# Seeded generation — revisions 2, 3, 4, and 5

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

`app/rated-generator.js` implements `generatePuzzle(identity)`, supporting revisions 3, 4, and 5 and defaulting to approved revision 5. Use explicit revision 3 to retain its original replay behavior; use the revision-2 API for candidate replay and the stored fixture for revision 1. Revision 3 returns `{ status: 'ready', puzzle, attempts, rejected }`, or `exhausted` with a null puzzle after 128 attempts. Each revision-3 rating attempt has a fixed 100,000-node budget shared across all constrained searches. Limits, unsolvability, excluded candidates, and proven tier mismatches are rejected separately; an exhausted request must not replace an active session.

Hash the revision-3 replay tuple with the same FNV-1a/Mulberry32 algorithm. All draws belong to one fresh stream per request, continuing across rejected attempts. Descending Fisher–Yates shuffles, inclusive integer draws, and canonical physical IDs use the same rules as revision 2. The complete source and `app/checks/fixtures/generated-v3.json` define revision 3. Changes affecting the selected starting puzzle require another version.

Candidate construction proceeds as follows:

1. Shuffle black/blue/red/orange into four colour roles. Draw a low endpoint `a` from 4–6, a high endpoint `b` from `a + 5`–13, a low-run start from `max(1, a - 5)`–`a - 3`, and a high-run start from `max(a + 2, b - 5)`–`b - 3`. This keeps base runs at least four tiles long and separates the endpoint groups. Allocate each requested face by randomly choosing an unused physical copy in copy-1/copy-2 order.
2. Easy uses one low run, two rack tiles of other colours at `a`, and a high filler run. Medium uses two low runs, the third colour at `a` in the rack, three rack colours at `b`, and a fourth-colour filler run ending at `b - 1`. Hard uses two low runs, one high run, two high-end rack colours, the third low-end colour in the rack, and a fourth-colour three-tile run with a random start from 1–10. Expert uses two low and two high runs, the missing low/high endpoint rack colours, and a three-tile rack run of the second low colour ending at `b - 1`.
3. Draw the target row count within tier bounds, retaining all base rows. Add random available runs, enumerated in shuffled-colour/start/length order, lengths 3–6. Draw the target rack count within tier bounds and add random valid endpoint extensions using a temporary extended copy of the board. Enumerate extension choices in row/shuffled-colour/value/front-back order, choose the face, then its physical copy. Actual starting rows remain unchanged. Reject insufficient construction.
4. Shuffle starting rows and rack. Run the minimum rearrangement proof. Accept only a `rated` result whose actual tier equals the requested tier. Attach the proof's valid solution and immutable `rating` features; validate the resulting puzzle object.

Extra rows and extension tiles can create alternative solutions, so motifs alone are never accepted as a tier proof. Every accepted puzzle passes the exhaustive constrained search. Size variation is part of generation; revision-3 timing motivated the revision-4 design review below. Actual learner feedback remains pending. A 32-seed native-runtime probe produced eight puzzles per tier with multiple rack/board sizes. Maximum individual times were about 18 ms Easy, 38 ms Medium, 437 ms Hard, and 3.4 seconds Expert. Worker execution is needed before connecting this synchronous generator to interactive play.

## Revision 4: reviewed sampling envelopes

Revision 4 uses the identical candidate construction/traversal algorithm with three explicit changes: hash `rummipuz:1:4:<tier>:<seed>`, sample rack/row counts from Easy 2–3/2–3, Medium 4–5/3–4, Hard 4–6/4–5, and Expert 5–7/4–5, and use 64 maximum attempts with 20,000 proof nodes per attempt. All sampled counts remain inside the unchanged tier policy. Exact minimum-R proofs and requested-tier acceptance still apply. Revision-3 branches retain their original hash, bounds, and budgets.

The source and `app/checks/fixtures/generated-v4.json` define replay ordering. `app/checks/fixtures/reviewed-v4.json` stores independent hand-derived solutions for eight reviewed samples. See [the sample review](rummipuz-sample-review.md) for reasoning, measured generation cost, limitations, and the rationale for reducing extra rows. Future changes affecting candidate acceptance or ordering require another revision. Revision 4 was the default before the approved revision-5 switch; it remains supported for explicit replay. Replay must always supply the recorded version.

## Revision 5: structural generation (approved default)

`generatePuzzle({ generatorVersion: 5, difficultyTier, seed })` dispatches to `app/generator-v5.js`. Omitted generator versions and fresh Start/Next requests use revision 5 through the shared `RATED_GENERATOR_VERSION` constant. Explicit revision-5 replay is supported through the existing preparation controller and dedicated worker; revision 1 fixture loading and revision-2/3/4 algorithms remain unchanged. The user approved the eight-puzzle sample set on 11 October 2026; the default switch changes no revision-specific generation algorithm, traversal, seed mapping, or proof budget.

The revision-5 source, [hand-authored designs](rummipuz-revision-5-patterns.md), and `app/checks/fixtures/generated-v5.json` define its deterministic contract. It returns `ready` with an immutable, verified puzzle or `exhausted` with a null puzzle after at most **32 attempts**. Each attempt has **100,000 proof nodes total**, shared by minimum-`R` search, physical candidate expansion, and structural partition search. These are work limits, never elapsed-time cutoffs. Rejected attempts continue the same random stream. Reject `unsolvable`, `limit`, `excluded`, and requested-tier mismatches separately. Exhaustion remains a preparation failure and cannot replace saved play or commit a chosen-tier change.

### Construction and random draws

Hash `rummipuz:1:5:<tier>:<seed>` with the existing FNV-1a algorithm and initialise the same Mulberry32 implementation described above. Draw inclusive integers and use descending Fisher–Yates; there is no global random stream, clock, locale sorting, device input, or completion-history input.

At each attempt, perform these operations in order:

1. Draw a pattern index from the requested tier's ordered list: Easy `easy-endpoint`; Medium `medium-interior-splits`, `medium-split-and-join`; Hard `hard-groups-to-runs`, `hard-group-run-exchange`; Expert `expert-four-group-chain`, `expert-duplicate-choice`. The one-choice Easy selection still consumes a draw. The exact source inventories are defined in `PATTERNS` in `app/generator-v5.js` and reviewed in the pattern document.
2. Shuffle black/blue/red/orange into colour roles, then draw a reflection bit. Reflect all values as `14 - value` when selected. Compute the reflected inventory's minimum and maximum, then draw a common offset inclusively from `1 - minimum` to `13 - maximum`, including when the range contains only one value.
3. Enumerate distinct **source** colour/value faces in native ASCII lexicographic order. Draw a copy-swap bit for every face. Map both source copies bijectively using that bit, so duplicate IDs remain distinct. This changes physical labels without inventing or losing tiles.
4. Transform original rows in source order. Sort transformed runs numerically into ascending order. Shuffle each group separately; retain tile copy mappings. Shuffle the entire board and then the transformed rack. Do not add arbitrary filler rows, rack neighbours, or extra duplicate faces.
5. Prove the requested tier using `rateStructuralPuzzle` with the fixed per-attempt budget. Only an accepted `rated` result matching the requested tier is published. Attach the computed complete witness as `solution.board`, and attach exact row-count features, structural proof metadata, and the selected pattern name as optional `rating` annotation. Validate and deeply freeze the result.

Colour permutation, value reflection/translation, and face-wide copy swaps preserve the reviewed seed structure by bijection. Every transformed candidate is nevertheless proved anew. These seven seeds establish multiple families; they do not establish unlimited structural diversity or measured player difficulty. Further families or changes to ordering, draws, proof traversal, budgets, or accepted puzzles require a new generator revision after publication.

### Structural proof algorithm and traversal

`app/structural-difficulty.js` leaves `ratePuzzle` and `solvePreservingRows` unchanged. `rateStructuralPuzzle` first runs the existing exact minimum-`R` proof and size checks. It then uses the remaining node budget for origin-sensitive physical exact cover. Worker `rate` requests for a revision-5 puzzle use this function; older puzzles retain their original rating API behaviour.

Sort physical inventory IDs using native ASCII lexicographic order. Enumerate run faces in black/blue/red/orange, start, ascending-end order, retaining all available intervals of length at least three. Enumerate groups in value and colour-mask order (masks 1–15, black/blue/red/orange as bits 0–3), retaining three/four available colours. For each shape, recursively expand every physical copy assignment in sorted inventory order. Charge one node for every expansion recursion, including the root and completed physical candidate.

Represent physical candidates as BigInt inventory masks and ordered tile rows. At each partition-search call, charge one node. Choose the uncovered physical tile with the fewest currently compatible candidate rows, breaking ties by sorted inventory index. Try its candidates in their expansion order and remove their masks. This traversal enumerates each unordered physical partition once: every partition has exactly one row covering the chosen physical tile, and row/group order cannot affect structural features. Do not collapse physical assignments into face counts or memoize by residual inventory alone; different selected rows can change preservation and connections.

At complete partitions, calculate changed original rows, endpoint-only cores, and connected components exactly as specified in [the difficulty policy](rummipuz-difficulty.md#revision-5-structural-difficulty-policy). Easy stops on a one-row endpoint-only witness. Medium/Hard/Expert stop and reject on the first complete partition lacking a component satisfying both thresholds. Accept those tiers only after exhausting the search without a counterexample, including partitions changing more rows than minimum `R`. A found counterexample is returned for diagnosis but never as a published puzzle. Any budget exhaustion returns `limit` with no awarded tier or solution.

Accepted rating annotations include `structure.version = 1`, a proof label (`endpoint-witness` or `exhaustive-no-counterexample`), the number of complete partitions visited, and the chosen witness's changed rows, non-endpoint rows, and component membership. Easy's partition count is a search count until its witness, not a count of all solutions. Required proof budgets include the preceding minimum-`R` proof; annotations never substitute for those proofs.

### Verification for implementation

All **841 native-runtime checks** passed: the existing suites with unchanged revision-2/3/4 golden results, 99 new structural/generation checks, 11 actual revision-5 worker checks, and two added revision-5 replay-flow checks. Checks cover all seven design fixtures, the rejected disconnected join, physical-copy partition counts, solutions changing more than minimum `R`, proof limits, determinism, deep immutability, actual worker dispatch, cancellation/retry, and retained default revision 4. The saved eight generated outputs and an additional Hard group/run-exchange output (`exchange-1`) also passed the independent exhaustive Python physical-tile oracle, exercising every construction family.

Offline release `v2` precaches all **33** runtime assets, including both new modules; package and lifecycle checks pass. All 11 revision-5 actual-worker checks also passed from a temporary bundle containing only these precached resources. No browser verification was performed. Wider multi-seed variety/performance review, tablet checks, and user review of generated samples remain the following Phase 6 steps. Native checks establish implementation correctness for the tested cases, not human difficulty or device performance.

### Approved default switch — 11 October 2026

Revision 5 now supplies fresh Start/Next and omitted-revision rated generation. Explicit revisions 1–4 and saved sessions retain their recorded identities and layouts; no storage migration or regeneration occurs on resume. All 869 native checks passed, including new default-dispatch coverage, actual-worker structural checks at each tier, unchanged old golden replays, and exact revision-1/2/3/4/5 save/reload with undo history. The approved sample checker also passed its 42 assertions after updating its default expectation. All 39 focused worker checks passed using only offline release `v3`’s 33 precached assets. No new runtime assets were required; the new release covers the changed cached modules. Browser gameplay, update activation, and installed offline launch remain in Phase 5 acceptance.
