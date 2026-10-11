# Seeded generation — revisions 2 and 3

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

Revision 3 provides rated generation without changing revision-2 replay. Human review and responsive worker execution remain separate plan items. Revision 2 runs synchronously; the initial 20-seed native-runtime probe across all four tiers took about 1.6 seconds total, with individual calls roughly 14–279 ms. This is a development measurement, not a tablet performance guarantee.

## Revision 3: rated puzzles

`app/rated-generator.js` implements `generatePuzzle(identity)`, defaulting to version 1, generator version 3, and Easy. It accepts only revision 3; use the retained revision-2 API for candidate replay and the stored fixture for revision 1. It returns `{ status: 'ready', puzzle, attempts, rejected }`, or `exhausted` with a null puzzle after 128 attempts. Each rating attempt has a fixed 100,000-node budget shared across all constrained searches. Limits, unsolvability, excluded candidates, and proven tier mismatches are rejected separately; an exhausted request must not replace an active session.

Hash the revision-3 replay tuple with the same FNV-1a/Mulberry32 algorithm. All draws belong to one fresh stream per request, continuing across rejected attempts. Descending Fisher–Yates shuffles, inclusive integer draws, and canonical physical IDs use the same rules as revision 2. The complete source and `app/checks/fixtures/generated-v3.json` define revision 3. Changes affecting the selected starting puzzle require another version.

Candidate construction proceeds as follows:

1. Shuffle black/blue/red/orange into four colour roles. Draw a low endpoint `a` from 4–6, a high endpoint `b` from `a + 5`–13, a low-run start from `max(1, a - 5)`–`a - 3`, and a high-run start from `max(a + 2, b - 5)`–`b - 3`. This keeps base runs at least four tiles long and separates the endpoint groups. Allocate each requested face by randomly choosing an unused physical copy in copy-1/copy-2 order.
2. Easy uses one low run, two rack tiles of other colours at `a`, and a high filler run. Medium uses two low runs, the third colour at `a` in the rack, three rack colours at `b`, and a fourth-colour filler run ending at `b - 1`. Hard uses two low runs, one high run, two high-end rack colours, the third low-end colour in the rack, and a fourth-colour three-tile run with a random start from 1–10. Expert uses two low and two high runs, the missing low/high endpoint rack colours, and a three-tile rack run of the second low colour ending at `b - 1`.
3. Draw the target row count within tier bounds, retaining all base rows. Add random available runs, enumerated in shuffled-colour/start/length order, lengths 3–6. Draw the target rack count within tier bounds and add random valid endpoint extensions using a temporary extended copy of the board. Enumerate extension choices in row/shuffled-colour/value/front-back order, choose the face, then its physical copy. Actual starting rows remain unchanged. Reject insufficient construction.
4. Shuffle starting rows and rack. Run the minimum rearrangement proof. Accept only a `rated` result whose actual tier equals the requested tier. Attach the proof's valid solution and immutable `rating` features; validate the resulting puzzle object.

Extra rows and extension tiles can create alternative solutions, so motifs alone are never accepted as a tier proof. Every accepted puzzle passes the exhaustive constrained search. Size variation is part of generation; human difficulty tuning remains pending. A 32-seed native-runtime probe produced eight puzzles per tier with multiple rack/board sizes. Maximum individual times were about 18 ms Easy, 38 ms Medium, 437 ms Hard, and 3.4 seconds Expert. Worker execution is needed before connecting this synchronous generator to interactive play.
