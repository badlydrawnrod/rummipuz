/** Optional native replay/hand-solution check: node plans/checks/review_v5_samples.mjs */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const staging = await fs.mkdtemp('/tmp/rummipuz-v5-sample-review-');
try {
  await fs.writeFile(staging + '/package.json', '{"type":"module"}');
  await fs.cp(new URL('../../app/', import.meta.url), staging + '/app', { recursive: true });
  const { generatePuzzle, RATED_GENERATOR_VERSION } = await import('file://' + staging + '/app/rated-generator.js');
  const { createGameState, checkState } = await import('file://' + staging + '/app/state.js');
  const { rearrangedRows } = await import('file://' + staging + '/app/difficulty.js');
  const samples = JSON.parse(await fs.readFile(new URL('../revision-5-sample-review.json', import.meta.url), 'utf8'));
  assert.equal(RATED_GENERATOR_VERSION, 5);
  assert.equal(samples.length, 8);
  for (const { identity, replayCode, result, handSolution } of samples) {
    assert.equal(replayCode, `rummipuz:1:5:${identity.difficultyTier}:${identity.seed}`);
    assert.deepEqual(generatePuzzle(identity), result, replayCode);
    assert.deepEqual(generatePuzzle(identity), result, 'second deterministic replay');
    const state = createGameState(result.puzzle);
    assert.equal(checkState({ ...state, rack: [], board: handSolution }).won, true, replayCode);
    assert.equal(rearrangedRows(state, handSolution).length, identity.difficultyTier, replayCode);
  }
  console.log('42 native assertions passed: eight exact replays, repeated determinism, conserved hand solutions, minimum changed rows, and approved default revision 5.');
} finally {
  await fs.rm(staging, { recursive: true, force: true });
}
