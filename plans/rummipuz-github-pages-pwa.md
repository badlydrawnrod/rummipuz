# Publish Rummipuz as a PWA on GitHub Pages

## Goal and status

Publish the runtime contents of `app/` at **https://badlydrawnrod.github.io/rummipuz/**, with `app/checks/` excluded from the deployed artifact. Preserve installation, offline play, saved progress, preferences, and replay support.

This is an implementation plan, created on 13 October 2026. Deployment has not been implemented or enabled. Complete the numbered steps in order; mark a step complete only after its acceptance criteria pass. Record commands, commit SHA, workflow run URL, and device/browser results when executing the plan.

Repository inspection established:

- Origin: `https://github.com/badlydrawnrod/rummipuz.git`; repository is public.
- Default branch and current local branch: `develop`.
- GitHub reports `has_pages: false`; querying the Pages endpoint returns HTTP 404.
- The authenticated `gh` user has repository administration permission.
- No tracked GitHub Actions workflows currently exist.
- The app consists of static HTML, CSS, JavaScript modules, icons, and JSON. It needs no build or package installation.
- PWA support already exists: `manifest.webmanifest`, install icons, `offline.js`, `service-worker.js`, and `offline-cache.js`.
- Manifest `id`, `start_url`, and `scope` use `./`. Registration, worker creation, and sample loading resolve relative to their modules. These support the project-site subdirectory without rewriting URLs.
- `OFFLINE_RELEASE` is currently `v14`; `OFFLINE_ASSETS` includes the runtime and worker dependencies, and excludes checks. Existing offline checks exercise root and subdirectory scopes, atomic installation, and waiting updates.

Recheck remote facts at execution time. Local/native results do not establish installed-device acceptance; the remaining browser/device checks in [the implementation plan](rummipuz-implementation.md) still apply.

## Deployment decisions

1. Use a custom GitHub Actions Pages workflow. Stage only the contents of `app/`, excluding its top-level `checks/` tree, and upload that staged directory. GitHub documents this approach in [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
2. Place `index.html` at the artifact root. `app/main.js` becomes `/rummipuz/main.js`, not `/rummipuz/app/main.js`.
3. Deploy pushes to `develop`, with a manual dispatch option restricted to that branch. Pull requests targeting `develop` validate without publishing.
4. Keep `app/checks/` in the repository and run it before deployment. Exclusion applies to the Pages artifact; this public repository's source checks remain accessible through GitHub.
5. Keep the current relative paths, service-worker scope, waiting-update behavior, and storage schemas. Use the default GitHub Pages domain initially.
6. Use Python and Node only for packaging and verification. Do not introduce an application build framework or npm dependencies for this deployment.

## 1. Confirm prerequisites

Run from the repository root:

```bash
git status --short
gh auth status
gh repo view --json nameWithOwner,defaultBranchRef,visibility,url
gh api repos/badlydrawnrod/rummipuz --jq '{has_pages: .has_pages, permissions: .permissions}'
gh api repos/badlydrawnrod/rummipuz/pages
```

Treat a Pages HTTP 404 as expected only after confirming repository access and `has_pages: false`. Authentication, permission, or network failures must be resolved separately. If Pages now exists, inspect its domain, source, and deployment settings before changing them.

Check that repository Actions settings allow the official actions used below, and inspect branch protection and any existing `github-pages` environment rules. Use Node 24, Python 3, and `gh` locally; hosted Ubuntu runners supply Python and the workflow sets up Node.

**Done when:** repository/branch are confirmed, the executor can manage Pages and push a branch or open a PR, and existing settings will not be accidentally overwritten.

**Execution record (13 October 2026):** `gh auth status`, `gh repo view --json nameWithOwner,defaultBranchRef,visibility,url`, `gh api repos/badlydrawnrod/rummipuz --jq '{has_pages: .has_pages, permissions: .permissions}'`, and the Pages endpoint were checked. The authenticated `badlydrawnrod` account has admin and push permission; the public repository's default branch is `develop`. The clean local branch is `feat/pwa`, tracking `origin/feat/pwa`. `has_pages` is false and the Pages endpoint returns the expected 404. Actions are enabled and allow all actions and workflows. `develop` has no branch protection or applicable rulesets, and no `github-pages` environment exists. No repository settings were changed.

## 2. Implement reproducible staging and artifact verification

Create these repository files:

| File | Responsibility |
| --- | --- |
| `scripts/stage-pages.py` | Copy runtime files to an explicitly supplied empty output directory, excluding `app/checks/`. |
| `scripts/check-pages-package.mjs` | Validate the staged output and run the existing offline package checks against it. |
| `.github/workflows/pages.yml` | Validate, package, and deploy as described in step 4. |

Define these command interfaces:

```bash
python3 scripts/stage-pages.py OUTPUT_DIRECTORY
node scripts/check-pages-package.mjs OUTPUT_DIRECTORY
```

Staging requirements:

1. Resolve the source `app/` relative to the script, so invocation does not depend on the working directory.
2. Reject an output directory inside `app/`, the repository's `.git/`, or any nonempty destination. Do not recursively delete an arbitrary caller-supplied path. A fresh temporary directory is the normal destination.
3. Copy all source files and subdirectories except the top-level `app/checks/` directory and everything below it. Copy the **contents** of `app/`; do not add an enclosing `app/` directory.
4. Reject symbolic links and unsupported special files rather than copying content from outside the app. Ensure the resulting artifact contains ordinary files and directories only.
5. Return a nonzero exit code on any failure. Print a concise file count and destination on success.

Verification requirements:

1. Compare the relative file list and bytes against `app/` with `checks/` excluded. Reject missing runtime files, unexpected files, nested `app/`, or any `checks/` tree. This also confirms that repository-root files such as `README.md`, `plans/`, and `.github/` have not entered the artifact.
2. Require a nonempty root `index.html`, manifest, service worker, cache module, stylesheet, entry module, icons, and sample puzzle.
3. Reuse `runOfflinePackageChecks` from `app/checks/offline.js`, supplying a reader rooted in the **staged output**; map `./` to staged `index.html`. Read every precached asset from that output, not from source `app/`.
4. Run these modules in a disposable temporary module workspace with a `package.json` containing `{"type":"module"}`. Copy the staged runtime there and the source check module into a separate `checks/` directory for verification only. This lets its `../offline-cache.js` and `../offline.js` imports resolve to the staged runtime. Never copy that verification workspace into the artifact; remove it in `finally`.
5. Confirm every `OFFLINE_ASSETS` path stays within the stage, exists, and excludes checks. Validate the full runtime/worker import graph, manifest identity/start/scope at `https://badlydrawnrod.github.io/rummipuz/`, PNG dimensions, and installation links. The existing package checker covers much of this; add only the missing deployment-specific assertions.
6. Reject site-root absolute paths in runtime asset references that would escape `/rummipuz/`; inspect CSS URLs and any new dynamic fetch/worker paths as well as module imports.

**Done when:** staging matches the intended runtime exactly; package verification passes; and verification demonstrably fails for a missing runtime asset and an injected `checks/` file. Perform failure probes only on disposable copies, not on source files.

## 3. Validate locally at the actual project path

Run the existing checks against the source tree before packaging:

```bash
node plans/checks/run_native.mjs
```

Then create a temporary web root and serve the package at `/rummipuz/`:

```bash
pages_preview_root=$(mktemp -d /tmp/rummipuz-pages-preview.XXXXXX)
python3 scripts/stage-pages.py "$pages_preview_root/rummipuz"
node scripts/check-pages-package.mjs "$pages_preview_root/rummipuz"
python3 -m http.server 8000 --bind 127.0.0.1 --directory "$pages_preview_root"
```

Open `http://127.0.0.1:8000/rummipuz/`. Localhost is suitable for service-worker testing. Use a fresh browser profile or clear only this preview scope's worker/cache when testing a changed package with an unchanged release ID; a previously cached release can conceal mistakes.

Confirm:

- The page, all modules, worker, styles, icons, and sample load without errors or asset 404s.
- Start a generated puzzle, replay the sample, make a move, Undo, and reload/resume.
- The manifest resolves its identity, start URL, and scope to `/rummipuz/`.
- The service worker is registered at `/rummipuz/service-worker.js`, scoped to `/rummipuz/`, and reaches offline readiness.
- `/rummipuz/checks/`, `/rummipuz/checks/index.html`, and `/rummipuz/checks/fixtures/generated-v6.json` return HTTP 404, rather than the app shell. There is no blanket SPA fallback.

For the source browser check suite, serve the original `app/` on a different port and open `/checks/`; its absence from the staged preview is intentional. Stop the servers when finished and remove only the recorded temporary directory.

**Done when:** native checks and staged package checks pass, and the browser works at the repository subdirectory. Record actual results rather than copying historical check counts.

## 4. Add the GitHub Actions workflow

Use the following starting template for `.github/workflows/pages.yml`. It references the scripts from step 2. The official action tags below were verified to exist on 13 October 2026; recheck them when implementing. The workflow uses the normal temporary `GITHUB_TOKEN`, without a personal access token secret.

```yaml
name: Publish Rummipuz to GitHub Pages

on:
  push:
    branches: [develop]
    paths:
      - 'app/**'
      - 'scripts/stage-pages.py'
      - 'scripts/check-pages-package.mjs'
      - 'plans/checks/run_native.mjs'
      - '.github/workflows/pages.yml'
  pull_request:
    branches: [develop]
    paths:
      - 'app/**'
      - 'scripts/stage-pages.py'
      - 'scripts/check-pages-package.mjs'
      - 'plans/checks/run_native.mjs'
      - '.github/workflows/pages.yml'
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages-${{ github.event_name == 'pull_request' && github.ref || 'production' }}
  cancel-in-progress: false

jobs:
  validate-and-package:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '24'
      - name: Run native checks
        run: node plans/checks/run_native.mjs
      - name: Stage and verify runtime
        run: |
          python3 scripts/stage-pages.py "$RUNNER_TEMP/rummipuz-pages"
          node scripts/check-pages-package.mjs "$RUNNER_TEMP/rummipuz-pages"
      - name: Upload Pages artifact
        if: github.event_name != 'pull_request' && github.ref == 'refs/heads/develop'
        uses: actions/upload-pages-artifact@v4
        with:
          path: ${{ runner.temp }}/rummipuz-pages

  deploy:
    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/develop'
    needs: validate-and-package
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Configure Pages
        uses: actions/configure-pages@v5
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

GitHub's [workflow requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) explain the deployment permissions, environment, and job dependency. The [Pages artifact action](https://github.com/actions/upload-pages-artifact) packages the chosen directory. No Jekyll step or separate `gh-pages` branch is needed.

If branch protection makes this validation job a required check, remove path filters or use a separate always-triggered validation workflow; skipped workflows can leave required checks pending. Include source checks in the trigger because a checks-only change can affect validation.

**Done when:** a PR run validates without uploading/deploying; only `develop` can publish; failure of either validation command prevents deployment; and the uploaded artifact path points to the verified stage.

## 5. Enable GitHub Pages for Actions

Execute this step when implementing publication, before merging the workflow into `develop`. Recheck step 1 first.

If Pages still does not exist:

```bash
gh api --method POST repos/badlydrawnrod/rummipuz/pages -f build_type=workflow
```

If a site already exists and the desired source is GitHub Actions:

```bash
gh api --method PUT repos/badlydrawnrod/rummipuz/pages -f build_type=workflow
```

Inspect the result:

```bash
gh api repos/badlydrawnrod/rummipuz/pages --jq '{build_type: .build_type, html_url: .html_url, https_enforced: .https_enforced, cname: .cname}'
```

These operations are defined in the [Pages REST API](https://docs.github.com/en/rest/pages/pages). The equivalent human path is **Repository Settings → Pages → Build and deployment → Source → GitHub Actions**. Keep the default domain; investigate any unexpected existing custom domain before proceeding.

Check **Enforce HTTPS**. If it is not enabled, use the Settings control or:

```bash
gh api --method PUT repos/badlydrawnrod/rummipuz/pages -F https_enforced=true
```

If certificate provisioning is still pending, wait for readiness and retry. GitHub documents [HTTPS for Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https). In **Settings → Environments → github-pages**, allow deployments from `develop` and retain any required repository approval rules.

**Done when:** Pages uses `workflow`, HTTPS is available/enforced, and the environment permits the deployment branch.

## 6. Merge and publish the first release

Review the scripts, workflow, and documentation on a working branch. Commit only intended files, push that branch, and open a PR targeting `develop`; use `gh pr create --base develop` if following the CLI route. Run the checks and review the artifact exclusion before merging through the repository's normal process.

The merge triggers publication. To deliberately redeploy after the workflow is on the default branch:

```bash
gh workflow run pages.yml --ref develop
gh run list --workflow pages.yml --branch develop --limit 5
gh run watch RUN_ID --exit-status
gh api repos/badlydrawnrod/rummipuz/pages --jq .html_url
```

Replace `RUN_ID` with the intended run's ID. Inspect failures with `gh run view RUN_ID --log-failed`. Use the deployment's reported URL as authoritative if it differs from the expected URL.

**Done when:** validation/upload/deploy jobs succeed and a fresh online browser loads the HTTPS site without console errors, missing assets, or worker registration failures.

## 7. Verify the public artifact and installed PWA

Check HTTP results without relying on a previously installed service worker:

```bash
curl --fail --silent --show-error https://badlydrawnrod.github.io/rummipuz/ -o /dev/null
curl --fail --silent --show-error https://badlydrawnrod.github.io/rummipuz/manifest.webmanifest
curl --silent --show-error -o /dev/null -w '%{http_code}\n' https://badlydrawnrod.github.io/rummipuz/checks/
curl --silent --show-error -o /dev/null -w '%{http_code}\n' https://badlydrawnrod.github.io/rummipuz/checks/index.html
curl --silent --show-error -o /dev/null -w '%{http_code}\n' https://badlydrawnrod.github.io/rummipuz/checks/fixtures/generated-v6.json
```

Expect success for runtime resources and **404** for all three check URLs. Inspect response headers for HTML, JavaScript modules, manifest, PNGs, and JSON; confirm usable content types, successful responses, and no mixed-content requests. In browser developer tools, inspect the manifest, actual `/rummipuz/` registration scope, and cache entries; no checks or unrelated project paths should be cached. Manifest scope and service-worker scope are separate controls; see [service-worker scope](https://web.dev/learn/pwa/service-workers).

Perform acceptance on a desktop browser with PWA installation support and the actual target tablet. Record device, OS/browser version, and date:

1. Open the HTTPS site online and wait for **Ready for offline use on this device**.
2. Confirm ordinary gameplay: sample, generation at all four tiers, cancellation, replay, moves, Check/win, Next, Undo, Reset, and reload/resume. Confirm appearance/palette settings and the saved difficulty survive reopening.
3. Install using the supported browser control; on iPad use Safari's Share menu → **Add to Home Screen**. Check the icon, title, standalone display, and launch URL. Browser installation controls vary; absence of an automatic prompt alone is not a failure.
4. Save a changed puzzle and preferences, close all Rummipuz tabs and installed windows, and turn off networking on the device.
5. Launch from the installed icon. Resume the saved position and Undo history, make moves, use Hint/Reveal solution, Check/win/Next, generate at every tier, and replay both the sample and a generated puzzle code. Fresh workers must load offline too.
6. Close and relaunch offline again; confirm progress/settings persist.
7. Reconnect and test the release-update procedure in step 9. Do not call installed offline acceptance complete until real device testing passes.

**Done when:** public checks URLs are absent, desktop/tablet installation and offline acceptance pass, and any remaining device limitations are explicitly recorded.

## 8. Update contributor and player documentation

Update `README.md` with the public **Play Rummipuz** link, HTTPS installation instructions, and deployment commands. Keep local Python launch and `/checks/` instructions for contributors; state that checks are omitted from the public site.

Link this plan from `plans/README.md`. Once acceptance actually passes, update the trusted-HTTPS and installed-offline items in `plans/rummipuz-implementation.md`, with evidence or a link to a deployment acceptance record. Mark other device acceptance items only if their complete criteria were exercised.

**Done when:** a player can find, install, and play the published app, and a contributor can reproduce checks, staging, deployment, and updates.

## 9. Maintain and recover deployments

For future releases:

1. If any cached runtime bytes change, increment `OFFLINE_RELEASE` in `app/offline-cache.js`. Add new runtime files and worker dependencies to `OFFLINE_ASSETS`. Deployment-only workflow/documentation changes do not require a cache-release bump.
2. Run source checks and staged package validation, then merge to `develop`. Publish the complete package together.
3. In a client already using the prior release, reopen online and allow the new worker to install. Confirm the waiting-update notice and that the current game remains usable.
4. Close every tab and installed window in the scope. Reopen to activate the replacement; confirm progress, preferences, and replay still work, then verify offline launch again. Do not add `skipWaiting()` merely to accelerate deployment.
5. Record the deployed commit, workflow run, offline release, and acceptance result.

For rollback, create a new commit on `develop` restoring the previous working runtime. Assign a **new, unused `OFFLINE_RELEASE`**, rerun checks, and deploy. Reusing an old release ID or just rerunning an old deployment can interact badly with cache-first clients. Leave storage schemas/data intact and verify the same waiting-update/offline behavior after recovery.

If publication fails, inspect the failed job first. Common causes are Pages still using branch publishing, Actions policy restrictions, an environment branch restriction, missing token permissions, a missing staged asset, or an incorrect artifact path. If a new offline installation fails, reconnect and check every precache response; a missing resource prevents that worker from activating while an existing working release can remain active.

## Completion checklist

- [x] Prerequisites and remote settings confirmed.
- [ ] Reproducible staging excludes `app/checks/` and fails closed on invalid output.
- [ ] Source/native and staged package checks pass; exclusion failure probes pass.
- [ ] Local `/rummipuz/` browser smoke test passes.
- [ ] Workflow validates PRs and deploys only `develop`.
- [ ] Pages Actions source, HTTPS, and environment configured.
- [ ] First production deployment succeeds; runtime resources load and checks return 404.
- [ ] Desktop and tablet installation, offline play, persistence, and updates verified.
- [ ] README, plan index, and implementation acceptance status reflect actual results.

When handing this plan to another executor, continue from the first unchecked item and preserve recorded evidence. The creation of this document does not complete any implementation or deployment checklist item.
