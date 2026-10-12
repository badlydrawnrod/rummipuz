import { generateCandidate } from './generator.js';
import { generatePuzzle } from './rated-generator.js';
import { solveState } from './solver.js';
import { rateVarietyPuzzle } from './difficulty-v6.js';
import { ratePuzzle } from './difficulty.js';
import { rateStructuralPuzzle } from './structural-difficulty.js';

// All search stays inside the worker. Cancellation terminates this dedicated
// worker, interrupting even synchronous searches without cooperative polling.
self.addEventListener('message', ({ data }) => {
  try {
    let value;
    switch (data?.operation) {
      case 'generate':
        value = data.input?.generatorVersion === 2
          ? generateCandidate(data.input) : generatePuzzle(data.input);
        break;
      case 'solve': value = solveState(data.input.state, data.input.options); break;
      case 'rate': value = data.input.puzzle?.generatorVersion === 6
        ? rateVarietyPuzzle(data.input.puzzle, data.input.options)
        : data.input.puzzle?.generatorVersion === 5
        ? rateStructuralPuzzle(data.input.puzzle, data.input.options)
        : ratePuzzle(data.input.puzzle, data.input.options); break;
      default: throw new Error('Unsupported puzzle-worker operation.');
    }
    self.postMessage({ ok: true, value });
  } catch (error) {
    self.postMessage({ ok: false, error: { name: error.name, message: error.message } });
  }
});
