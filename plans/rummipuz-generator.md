# Seeded candidate generation — revision 2

`app/generator.js` implements `generateCandidate(identity)`. It accepts puzzle format version 1, generator version 2, tiers 1–4, and the canonical seed format. Omitted versions default to 1 and 2; omitted tier defaults to Easy. Seeds retain case and leading zeroes. Unsupported revisions are rejected.

Revision 1 remains reserved for the hand-authored sample fixture. Its replay code continues to resolve through that stored fixture; revision 2 never substitutes another puzzle for it.

## Replay algorithm

Hash the ASCII string `rummipuz:1:2:<difficultyTier>:<seed>` with FNV-1a: initial unsigned state 2166136261; for each character, XOR its character code then multiply by 16777619 with `Math.imul`, retaining the unsigned low 32 bits. Use that hash as the initial Mulberry32 state. Each draw adds `0x6D2B79F5` modulo 2^32, applies the integer mixing operations in `randomFor` in `app/generator.js`, and divides its unsigned result by 2^32. Inclusive integer selection is `min + floor(draw * (max - min + 1))`. Array shuffling uses descending Fisher–Yates, drawing an inclusive index from 0 through the current index.

Each request owns a fresh random stream. Do not use `Math.random`, time, device settings, completion history, locale sorting, or a global stream. Rejected attempts continue the same stream. The complete source algorithm and the saved fixtures in `app/checks/fixtures/generated-v2.json` define revision 2; changes that alter acceptance, draw consumption, or initial tile ordering require a new generator version.

## Candidate traversal

At each of at most 256 attempts:

1. Reset the unused inventory in black/blue/red/orange, value 1–13, copy 1/2 order. Draw board-row count, then rack count, uniformly within the requested tier's existing bounds.
2. For each board row, enumerate all available run intervals of lengths 3–8 in colour/start/end order. Enumerate groups in value/colour-mask order, masks 1–15 with black/blue/red/orange as bits 0–3, retaining only three/four-colour subsets with available copies.
3. Draw a 75% run preference, falling back to the other kind only when necessary. Choose uniformly from the selected candidate list. Choose an available physical copy separately for each face in row order. Shuffle groups; retain ascending runs. Remove all chosen physical IDs. An inability to construct the requested row count rejects the attempt.
4. Traverse unused IDs in inventory order and retain rack candidates that match any board value, or match a board colour within one value. Shuffle the pool and take the requested rack count. An insufficient pool rejects the attempt.
5. Validate the starting puzzle and run `solveState` with a fixed 20,000-node budget. Reject `unsolvable` and `limit` outcomes separately. Accept only a complete verified solution, attach it as immutable solution metadata, and validate the complete puzzle again.

Return `{ status: 'candidate', puzzle, attempts, rejected }` on acceptance. `rejected` counts construction failures, proven unsolvable positions, and inconclusive solver limits. Exhaustion returns `{ status: 'exhausted', puzzle: null, attempts: 256, rejected }`; it does not prove that the seed has no possible puzzle and must not replace an active session. Budgets are fixed revision constants so runtime speed cannot alter the result.

## Difficulty and publication boundary

These are **unpublished solvable candidates**. `difficultyTier` records the requested tier and constrains rack/board sizes; the generator has not yet proved minimum rearrangement count `R`. Candidates may have `R = 0` or fall outside the requested rearrangement tier. They must pass the next plan step's rating/rejection process before being offered as playable rated puzzles. No candidate is connected to the app's start controls yet.

The later rating integration must reject `R = 0`, prove the requested tier, and preserve versioned replay behavior. Human review and responsive worker execution remain separate plan items. Generation currently runs synchronously; the initial 20-seed native-runtime probe across all four tiers took about 1.6 seconds total, with individual calls roughly 14–279 ms. This is a development measurement, not a tablet performance guarantee.
