import { createGameState } from './state.js';
import { puzzleIdentity } from './progress.js';

export const TIER_NAMES = ['Easy', 'Medium', 'Hard', 'Expert'];
export function nextDifficulty({ chosenDifficultyTier: tier, credits }) {
  return credits[tier - 1] >= 3 ? Math.min(4, tier + 1) : tier;
}
export function parseReplayCode(code) {
  const match = typeof code === 'string' && /^rummipuz:1:([1-9][0-9]*):([1-4]):([A-Za-z0-9_-]{1,64})$/.exec(code.trim());
  if (!match || !Number.isSafeInteger(Number(match[1]))) throw new Error('Enter a full replay code: rummipuz:1:revision:tier:seed.');
  return { version: 1, generatorVersion: Number(match[1]), difficultyTier: Number(match[2]), seed: match[3] };
}
const startingPuzzle = (state) => ({ version: state.version, generatorVersion: state.generatorVersion,
  difficultyTier: state.difficultyTier, seed: state.seed, ...state.initial });

// Preparation cannot mutate progress. The caller installs a ready state before
// committing its chosen tier. Tokens also protect fixture loads and late replies.
export function createPuzzleFlow({ service, progress, loadSample,
  newSeed = () => Array.from(globalThis.crypto.getRandomValues(new Uint32Array(4)),
    (part) => part.toString(16).padStart(8, '0')).join('') }) {
  let pending = null;
  const seen = new Set(progress.snapshot().completedIdentities);
  if (progress.snapshot().active) seen.add(puzzleIdentity(progress.snapshot().active.state));
  function cancel() {
    const request = pending;
    pending = null;
    request?.controller.abort();
  }
  return {
    cancel,
    async prepare({ kind, tier, code }) {
      cancel();
      const saved = progress.snapshot();
      let identity;
      let chosenTier = null;
      if (kind === 'replay') identity = parseReplayCode(code);
      else {
        chosenTier = kind === 'next' ? nextDifficulty(saved) : tier;
        if (!Number.isInteger(chosenTier) || chosenTier < 1 || chosenTier > 4) throw new Error('Choose a supported difficulty.');
        let seed;
        for (let attempt = 0; attempt < 100; attempt += 1) {
          seed = newSeed();
          identity = { version: 1, generatorVersion: 4, difficultyTier: chosenTier, seed };
          if (!seen.has(puzzleIdentity(identity))) break;
          identity = null;
        }
        if (!identity) throw new Error('Could not create a fresh seed. Try again.');
        seen.add(puzzleIdentity(identity));
      }
      const request = { controller: new AbortController() };
      pending = request;
      try {
        let puzzle;
        const active = saved.active?.state;
        if (kind === 'replay' && active && puzzleIdentity(active) === puzzleIdentity(identity)) {
          puzzle = startingPuzzle(active);
        } else if (identity.generatorVersion === 1) {
          puzzle = await loadSample({ signal: request.controller.signal });
          if (puzzleIdentity(puzzle) !== puzzleIdentity(identity)) throw new Error('That revision-1 puzzle is unavailable.');
        } else {
          if (![2, 3, 4, 5].includes(identity.generatorVersion)) throw new Error('That generator revision is unavailable.');
          const result = await service.generate(identity, { signal: request.controller.signal });
          if (!['ready', 'candidate'].includes(result.status) || !result.puzzle) throw new Error('A puzzle could not be prepared for this seed. Try another puzzle or replay code.');
          puzzle = result.puzzle;
        }
        if (pending !== request || request.controller.signal.aborted) {
          const error = new Error('Puzzle preparation cancelled.'); error.name = 'AbortError'; throw error;
        }
        if (puzzleIdentity(puzzle) !== puzzleIdentity(identity)) throw new Error('Prepared puzzle does not match its replay code.');
        return { state: createGameState(puzzle), chosenTier };
      } finally { if (pending === request) pending = null; }
    },
  };
}
