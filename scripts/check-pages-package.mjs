#!/usr/bin/env node
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const repo = path.resolve(path.dirname(scriptPath), '..');
const source = path.join(repo, 'app');
const siteBase = new URL('https://badlydrawnrod.github.io/rummipuz/');
const requiredFiles = [
  'index.html', 'manifest.webmanifest', 'service-worker.js', 'offline-cache.js',
  'styles.css', 'main.js', 'puzzles/sample.json', 'icons/icon.svg',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

function fail(message) {
  throw new Error(message);
}

function inside(child, parent) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function walkTree(root, { excludeChecks = false } = {}) {
  const files = new Map();
  const directories = new Set();
  async function visit(directory, relative = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (excludeChecks && relative === '' && entry.name === 'checks') continue;
      const absolute = path.join(directory, entry.name);
      const rel = relative ? `${relative}/${entry.name}` : entry.name;
      const info = await lstat(absolute);
      if (info.isSymbolicLink()) fail(`symbolic links are not allowed in a Pages package: ${rel}`);
      if (info.isDirectory()) {
        directories.add(rel);
        await visit(absolute, rel);
      } else if (info.isFile()) {
        files.set(rel, absolute);
      } else {
        fail(`unsupported file type in Pages package: ${rel}`);
      }
    }
  }
  await visit(root);
  return { files, directories };
}

async function compareSourceAndStage(stageTree) {
  const { files: stageFiles, directories: stageDirectories } = stageTree;
  const sourceTree = await walkTree(source, { excludeChecks: true });
  const sourceFiles = sourceTree.files;
  const missing = [...sourceFiles.keys()].filter((file) => !stageFiles.has(file));
  const unexpected = [...stageFiles.keys()].filter((file) => !sourceFiles.has(file));
  const missingDirectories = [...sourceTree.directories].filter((directory) => !stageDirectories.has(directory));
  const unexpectedDirectories = [...stageDirectories].filter((directory) => !sourceTree.directories.has(directory));
  if (missing.length || unexpected.length || missingDirectories.length || unexpectedDirectories.length) {
    fail(`staged tree differs from app/ (checks excluded); missing files: ${missing.join(', ') || 'none'}; unexpected files: ${unexpected.join(', ') || 'none'}; missing directories: ${missingDirectories.join(', ') || 'none'}; unexpected directories: ${unexpectedDirectories.join(', ') || 'none'}`);
  }
  for (const [relative, sourcePath] of sourceFiles) {
    const [expected, actual] = await Promise.all([readFile(sourcePath), readFile(stageFiles.get(relative))]);
    if (!expected.equals(actual)) fail(`staged bytes differ from app/${relative}`);
  }
}

function checkRootAbsoluteReferences(relative, bytes) {
  const text = bytes.toString('utf8');
  const patterns = [];
  if (relative.endsWith('.html')) {
    patterns.push(/\b(?:src|href|action|poster|manifest)\s*=\s*(["'])\/(?!\/)[^"']*\1/gi);
  }
  if (relative.endsWith('.css')) {
    patterns.push(/url\(\s*(["']?)\/(?!\/)[^)'"\s]*\1\s*\)/gi);
    patterns.push(/@import\s+(["'])\/(?!\/)[^"']*\1/gi);
  }
  if (relative.endsWith('.js')) {
    patterns.push(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\bnew\s+URL\(\s*|\bfetch\(\s*|\b(?:register|importScripts)\(\s*|\bnew\s+(?:Worker|SharedWorker)\(\s*)(["'])\/(?!\/)[^"']*\1/g);
  }
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) fail(`site-root absolute asset reference escapes /rummipuz/: ${relative}: ${match[0]}`);
  }
}

function stagePathForAsset(asset, url) {
  if (url.origin !== siteBase.origin || !url.pathname.startsWith(siteBase.pathname)) {
    fail(`precache URL escapes the deployed project path: ${asset} -> ${url.href}`);
  }
  const suffix = decodeURIComponent(url.pathname.slice(siteBase.pathname.length));
  const resolved = path.resolve(process.argv[2], suffix || 'index.html');
  if (!inside(resolved, path.resolve(process.argv[2]))) fail(`precache asset escapes the staged directory: ${asset}`);
  return resolved;
}

async function runExistingOfflineChecks(stage) {
  const workspace = await mkdtemp(path.join(os.tmpdir(), 'rummipuz-pages-check-'));
  try {
    await writeFile(path.join(workspace, 'package.json'), '{"type":"module"}\n');
    for (const [relative, file] of (await walkTree(stage)).files) {
      const target = path.join(workspace, relative);
      await mkdir(path.dirname(target), { recursive: true });
      await cp(file, target);
    }
    const checksDirectory = path.join(workspace, 'checks');
    await mkdir(checksDirectory);
    await cp(path.join(source, 'checks', 'offline.js'), path.join(checksDirectory, 'offline.js'));

    const runtimeModule = await import(pathToFileURL(path.join(workspace, 'offline-cache.js')).href);
    const { OFFLINE_ASSETS } = runtimeModule;
    if (!Array.isArray(OFFLINE_ASSETS) || OFFLINE_ASSETS.length === 0) fail('OFFLINE_ASSETS is missing or empty');
    const seen = new Set();
    for (const asset of OFFLINE_ASSETS) {
      if (typeof asset !== 'string' || asset.startsWith('/') || asset.includes('\\')) fail(`invalid precache path: ${asset}`);
      const assetUrl = new URL(asset, siteBase);
      if (assetUrl.pathname.includes('/checks/')) fail(`checks must not be precached: ${asset}`);
      const file = stagePathForAsset(asset, assetUrl);
      if (!inside(file, stage)) fail(`precache asset escapes the staged directory: ${asset}`);
      const info = await lstat(file).catch(() => null);
      if (!info?.isFile()) fail(`precache asset is missing or not an ordinary file: ${asset}`);
      if (seen.has(assetUrl.href)) fail(`duplicate precache URL: ${asset}`);
      seen.add(assetUrl.href);
    }

    const { runOfflinePackageChecks } = await import(pathToFileURL(path.join(checksDirectory, 'offline.js')).href);
    const passed = await runOfflinePackageChecks(async (asset) => {
      const assetUrl = new URL(asset, siteBase);
      return readFile(stagePathForAsset(asset, assetUrl));
    });
    console.log(`Existing offline package checks passed (${passed.length} assertions).`);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

async function main() {
  const argument = process.argv[2];
  if (!argument) fail('usage: node scripts/check-pages-package.mjs OUTPUT_DIRECTORY');
  const stage = path.resolve(argument);
  const sourceReal = await realpath(source);
  const gitReal = await realpath(path.join(repo, '.git')).catch(() => path.resolve(repo, '.git'));
  if (inside(stage, sourceReal) || inside(stage, gitReal)) fail(`staged output must be outside app/ and .git/: ${stage}`);
  const stageInfo = await lstat(stage).catch(() => null);
  if (!stageInfo?.isDirectory() || stageInfo.isSymbolicLink()) fail(`staged output must be an ordinary directory: ${stage}`);
  const stageReal = await realpath(stage);
  if (inside(stageReal, sourceReal) || inside(stageReal, gitReal)) fail(`staged output must be outside app/ and .git/: ${stageReal}`);

  const stageTree = await walkTree(stageReal);
  const stageFiles = stageTree.files;
  await compareSourceAndStage(stageTree);
  for (const file of requiredFiles) {
    const location = stageFiles.get(file);
    if (!location || (await lstat(location)).size === 0) fail(`required runtime file is missing or empty: ${file}`);
  }
  for (const [relative, file] of stageFiles) checkRootAbsoluteReferences(relative, await readFile(file));

  const index = await readFile(path.join(stage, 'index.html'), 'utf8');
  const manifest = JSON.parse(await readFile(path.join(stage, 'manifest.webmanifest'), 'utf8'));
  for (const [field, value] of [['id', manifest.id], ['start_url', manifest.start_url], ['scope', manifest.scope]]) {
    if (new URL(value, siteBase).href !== siteBase.href) fail(`manifest ${field} does not resolve to ${siteBase.href}`);
  }
  if (!index.includes('rel="manifest" href="./manifest.webmanifest"')) fail('index.html does not link the relative web manifest');

  await runExistingOfflineChecks(stageReal);
  console.log(`Verified ${stageFiles.size} staged runtime files for ${siteBase.href}`);
}

main().catch((error) => {
  console.error(`check-pages-package: ${error.message}`);
  process.exitCode = 1;
});
