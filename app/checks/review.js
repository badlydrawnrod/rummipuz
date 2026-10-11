import { createGameState, checkState } from '../state.js';
import { rearrangedRows } from '../difficulty.js';
import { generatePuzzle, RATED_GENERATOR_VERSION } from '../rated-generator.js';

export function runReviewChecks(fixtures, handReviews) {
  const passed = [];
  const assert = (condition, name) => { if (!condition) throw new Error(`Failed: ${name}`); passed.push(name); };
  const envelope = [null, [2, 3, 2, 3], [4, 5, 3, 4], [4, 6, 4, 5], [5, 7, 4, 5]];
  assert(RATED_GENERATOR_VERSION === 4 && fixtures.length === 8 && handReviews.length === 8,
    'reviewed default revision and eight hand-reviewed samples available');
  for (const { identity, result } of fixtures) {
    const label = `${identity.difficultyTier}/${identity.seed}`;
    const actual = generatePuzzle(identity);
    assert(JSON.stringify(actual) === JSON.stringify(result), `reviewed revision-4 golden replay ${label}`);
    const state = createGameState(actual.puzzle);
    const hand = handReviews.find((review) => JSON.stringify(review.identity) === JSON.stringify(identity));
    assert(hand && checkState({ ...state, rack: [], board: hand.handSolution }).won,
      `hand-derived solution conserves tiles and wins ${label}`);
    assert(rearrangedRows(state, hand.handSolution).length === identity.difficultyTier
      && actual.puzzle.rating.rearrangement === identity.difficultyTier,
    `hand solution and proven minimum show intended coordination ${label}`);
    const [rackMin, rackMax, rowMin, rowMax] = envelope[identity.difficultyTier];
    assert(state.rack.length >= rackMin && state.rack.length <= rackMax
      && state.board.length >= rowMin && state.board.length <= rowMax,
    `reviewed sample fits focused sampling envelope ${label}`);
  }
  return passed;
}
