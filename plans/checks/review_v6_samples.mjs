/** Native exact replay and independently derived solution checks. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const staging = await fs.mkdtemp('/tmp/rummipuz-v6-sample-review-');
let checks = 0;
const equal = (a, b, label) => { assert.deepEqual(a, b, label); checks += 1; };
const ok = (value, label) => { assert.ok(value, label); checks += 1; };
try {
  await fs.writeFile(staging + '/package.json', '{"type":"module"}');
  await fs.cp(new URL('../../app/', import.meta.url), staging + '/app', { recursive: true });
  const app = 'file://' + staging + '/app/';
  const { generatePuzzle, RATED_GENERATOR_VERSION } = await import(app + 'rated-generator.js');
  const { createGameState, checkState } = await import(app + 'state.js');
  const { classifyRow } = await import(app + 'rules.js');
  const { solutionStructure } = await import(app + 'structural-difficulty.js');
  const { easyMechanisms, coreMechanisms } = await import(app + 'mechanisms-v6.js');
  const data = JSON.parse(await fs.readFile(new URL('../revision-6-sample-review.json', import.meta.url), 'utf8'));
  const designs = JSON.parse(await fs.readFile(new URL('../revision-6-patterns.json', import.meta.url), 'utf8')).patterns;
  equal(RATED_GENERATOR_VERSION, 6, 'Approved revision 6 supplies the fresh default');
  equal(data.samples.filter(s => s.featured).length, 24, 'Every featured review sample is retained');
  equal(new Set(data.samples.map(s => s.replayCode)).size, data.samples.length, 'Review records have unique full identities');
  const coverage = new Set();
  for (const sample of data.samples) {
    const { identity, result, replayCode, handSolution, handDerivation: d } = sample;
    equal(replayCode, `rummipuz:1:6:${identity.difficultyTier}:${identity.seed}`, 'Full explicit review identity');
    equal(generatePuzzle(identity), result, replayCode);
    equal(generatePuzzle(identity), result, 'Repeated replay remains deterministic');
    const state = createGameState(result.puzzle);
    ok(checkState({ ...state, rack: [], board: handSolution }).won, 'Complete conserved reviewed solution');
    const structure = solutionStructure(state, handSolution);
    equal(structure.changedRows.length, result.puzzle.rating.rearrangement, 'Reviewed solution attains the exact minimum R');
    const predicates = identity.difficultyTier === 1 ? easyMechanisms(state, handSolution) : coreMechanisms(state, handSolution, identity.difficultyTier);
    ok(predicates.includes(result.puzzle.rating.family.primary), 'Reviewed mechanism matches independently certified family');
    const fixture = designs.find(p => p.name === d.fixture);
    equal(fixture.name, result.puzzle.rating.pattern, 'Solution derives from the selected independently audited inventory');
    for (const [source, target] of Object.entries(d.tileMap)) {
      const [colour, value, copy] = source.split('-');
      const [actualColour, actualValue, actualCopy] = target.split('-');
      equal([actualColour, Number(actualValue)], [d.colourMap[colour], (d.reflected ? 14 - Number(value) : Number(value)) + d.offset], 'Hand derivation face symmetry');
      ok([1, 2].includes(Number(copy)) && [1, 2].includes(Number(actualCopy)), 'Physical copies remain valid');
    }
    equal(new Set(Object.values(d.tileMap)).size, state.inventory.length, 'Hand mapping is an inventory bijection');
    for (let i = 0; i < fixture.board.length; i += 1) {
      equal(fixture.board[i].map(id => d.tileMap[id]).sort(), [...state.board[d.sourceRowMap[i]]].sort(), 'Hand mapping retains original row provenance');
    }
    equal(fixture.rack.map(id => d.tileMap[id]).sort(), [...state.rack].sort(), 'Hand mapping retains rack provenance');
    const transported = fixture.solution.map(row => {
      const mapped = row.map(id => d.tileMap[id]);
      return classifyRow(row).kind === 'run' ? mapped.sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1])) : mapped.sort();
    });
    equal(transported, handSolution, 'Hand solution is the independently derived fixture answer, not a solver substitution');
    if (sample.featured) coverage.add(`${identity.difficultyTier}/${result.puzzle.rating.family.primary}`);
  }
  equal(coverage.size, 19, 'All nineteen tier/family pairings have featured samples');
  equal(data.sequences.length, 4, 'One fixed full sequence per tier');
  for (const sequence of data.sequences) {
    equal(sequence.replayCodes, Array.from({ length: 16 }, (_, i) => `rummipuz:1:6:${sequence.tier}:variety-v6-dev-${i}`), 'First development sequence retains every consecutive seed');
    ok(sequence.replayCodes.every(code => data.samples.some(s => s.replayCode === code)), 'Every sequence replay has a checked reviewed solution');
  }
  console.log(JSON.stringify({ checks, featured: 24, distinctReplays: data.samples.length, familyPairings: coverage.size, sequences: 4 }));
} finally { await fs.rm(staging, { recursive: true, force: true }); }
export default { checks };
