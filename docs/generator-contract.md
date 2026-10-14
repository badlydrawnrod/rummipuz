# Puzzle, difficulty and generator contract

Revision 6 is the approved default for fresh Start/Next puzzles and omitted-revision rated generation. Explicit revisions 1–6 retain their recorded identities and replay behaviour. This document records the current requirements; revision-specific source and golden fixtures define exact traversal and output ordering.

## Puzzle format and replay

A version-1 puzzle is an immutable starting position, separate from live moves, Undo history, preferences and completion records.

| Field | Contract |
| --- | --- |
| `version` | Integer `1`; reject unsupported versions. |
| `generatorVersion` | Positive integer identifying the deterministic generator revision. |
| `difficultyTier` | Integer 1–4: Easy, Medium, Hard, Expert. |
| `seed` | Case-sensitive string of 1–64 ASCII letters, digits, `_` or `-`; retain leading zeroes. |
| `rack` | Nonempty array of physical tile IDs, in display order. |
| `board` | Nonempty array of nonempty valid rows, in display order. |
| `solution` | Optional object containing a complete, valid, conserved `board` and optional string `note`. Omit rather than use `null`. |

IDs are `<colour>-<value>-<copy>`, where colour is lowercase `black`, `blue`, `red` or `orange`, value is 1–13 without leading zeroes, and copy is `1` or `2`. Each ID occurs exactly once across the starting board and rack. Equal faces are separate physical tiles. The inventory is this union, drawn from the 104 numbered tiles; jokers and an opening-point requirement are outside the game.

A group has three or four equal numbers of distinct colours, in any colour order. A run has three to thirteen consecutive numbers of one colour in ascending order, without wraparound. Temporary invalid/empty rows and returning board tiles to the rack are allowed in live editing. Empty placeholders are omitted from puzzle/solution data. Winning requires an empty rack, valid nonempty rows and exact physical-tile conservation; the player need not match a stored solution.

Validate every known field that is present, all IDs, uniqueness, initial row validity and any supplied solution. Unknown annotation fields may be ignored. `rating` is annotation, not proof or part of identity. A generator must establish solvability before publication even when solution metadata is absent.

Replay identity is `(version, generatorVersion, difficultyTier, seed)`, encoded as `rummipuz:<version>:<generatorVersion>:<difficultyTier>:<seed>`. Trim surrounding whitespace from a pasted code, preserving the seed itself. Identical identities produce identical initial board/rack ordering regardless of device, session history or prior requests. Unsupported identities fail without substituting another puzzle. Replay uses a matching stored starting puzzle when available, otherwise a supported revision. Revision 1 is exclusively [the hand-authored sample](../app/puzzles/sample.json), not a procedural generator.

Changes to selection, random draws, acceptance, proof traversal or budgets that can change published replay outputs require a new generator revision. Resume restores stored layouts and Undo history without regenerating them or rewriting the original puzzle.

## Difficulty and chosen tier

Let `R` be the minimum number of changed original board rows over **all** complete solutions. A group is preserved when all its original physical tiles remain together in a final group; adding a colour is permitted. A run is preserved when its full original sequence remains together in a final run; extensions are permitted. Splitting, extraction or redistribution changes a row once. Whole-row screen reordering does not. Equal-face copies cannot substitute for original physical IDs when measuring preservation.

| Tier | Rack tiles | Starting rows | Minimum `R` | Revision-5/6 higher-tier gate |
| --- | --- | --- | --- | --- |
| Easy | 2–5 | 2–5 | Exactly 1 | Revision-specific witness below |
| Medium | 3–6 | 3–6 | Exactly 2 | `C >= 2`, `N >= 1` |
| Hard | 4–8 | 4–7 | Exactly 3 | `C >= 3`, `N >= 2` |
| Expert | 4–10 | 4–9 | At least 4 | `C >= 4`, `N >= 3` |

Bounds are inclusive. Reject zero-change, unsolvable, out-of-bounds, wrong-tier and inconclusive candidates. Expert still proves the exact minimum before applying its lower bound. A stored witness, tile count or family label cannot award difficulty.

For each solution, make a graph of changed original rows, joining two when a final row contains physical tiles from both. A component's `C` is its row count. Rack tiles and preserved original rows do not supply graph vertices or extra links.

A changed run is endpoint-only if some final run retains exactly one contiguous original core of at least three tiles, with all other original tiles exported from the prefix/suffix, and neither exported end contains a three-or-more-tile consecutive original fragment surviving together in another final run. Check every possible core. A component's `N` counts its rows that are not endpoint-only, including changed groups and runs with no qualifying core. Both thresholds must hold in the **same component of the same solution**.

For Medium–Expert in revisions 5/6, **every complete conserved solution**, including solutions above minimum `R` and every physical-copy assignment, must contain such a component. Exhaustive absence of a counterexample, or a sound independently verified equivalent proof, is required. A first solver witness, random samples or memoisation by remaining face counts cannot establish this universal origin-sensitive property.

Revision-5 Easy requires at least one endpoint-only solution changing exactly one row (`N = 0`). Revision-6 Easy uses the exact mechanisms below instead; arbitrary one-row rebuilding is excluded.

All four tiers are immediately selectable. A new device defaults to Easy. Only successfully starting a fresh puzzle at another picker selection changes the saved tier. Next stays at that tier after any number of completions. Cancellation/failure preserves the previous session and selection. Replay/Resume retain the puzzle's recorded tier without changing the tier for future fresh puzzles. Completion records deduplicate the full identity; legacy credit fields do not promote difficulty. When storage is unavailable, selection remains in memory for the session.

## Exact revision-6 Easy mechanisms

A qualifying witness changes exactly one original row `S`. Every other original row remains together in a separate final row of its original kind, with only rack extensions. No final row mixes `S` with another original row. Rack-only final sets are permitted without mechanism credit. Contributions refer to actual physical IDs.

1. **Run donation:** retain one contiguous original core of at least three tiles in a run, with only rack additions. Export either one endpoint or exactly one tile from each end. Each exported tile enters its own group with two or three other-colour rack tiles. No other final row contains tiles of `S`.
2. **Group donation:** from a four-colour group, retain exactly three original tiles as an unchanged three-colour group without additions. The fourth enters a single run with at least two same-colour rack tiles and no other board tiles. No other final row contains tiles of `S`.
3. **Run division:** split an original run of length `L >= 4` at `2 <= k <= L - 2`. Its entire original prefix and suffix belong to two distinct final runs, each at least three tiles long and with only rack additions. At least one receives a rack tile. No source tile enters a group or third run; overlapping values require distinct copies.

Enumerate eligible witnesses independently of the first solver answer. Easy eligibility is existential; elaborate alternatives are allowed. Choose the first witnessed family in donation, group-donation, division order and record every eligible kind. Both-end donation is a donation variant, not a fourth core family.

## Revision-6 family certification

Evaluate higher-tier mechanisms within components passing that tier's `C/N` gate:

| Mechanism | Required physical contributions |
| --- | --- |
| Interior extraction | All sources are runs. One retains two distinct contiguous cores of at least three tiles in separate final runs, with an intervening original tile entering a group. No final run joins changed sources; shared groups connect them. |
| Split/join | All sources are runs. A source splits across final rows; a final run joins at least two changed sources, including a consecutive one- or two-tile source remainder. |
| Boundary repair | All sources are runs and all their tiles finish in runs. A source splits across final runs and a final run joins changed origins. Split/join takes precedence when its short-remainder predicate also holds. |
| Groups-to-runs | All sources are groups and all their tiles finish in runs. |
| Runs-to-groups | All sources are runs and all their tiles finish in groups. |
| Mixed exchange | One component has original groups and runs, with group-to-run and run-to-group contributions both present. |
| Linked group donation | A changed four-colour group retains three originals together in a group and donates its fourth to a run receiving another changed source's tiles. |
| Combined repair | A four-colour group retains exactly three originals as a final group without additions and donates its fourth to a run receiving tiles of a changed run `S`. That same `S` retains two distinct contiguous cores of at least three originals in separate runs, with an intervening original tile entering a group. The donation and interior rebuilding must be linked through the same `S`. |

Intersect predicates over **every minimum-`R` solution** for certification, separately from the all-solution tier proof. Record common and optional predicates and bypass witnesses for absent predicates. A core counts only if present in every minimum solution; its qualifying component may differ between solutions.

Choose exactly one common primary label in this order: combined repair, mixed exchange, linked group donation, groups-to-runs, runs-to-groups, interior extraction, split/join, boundary repair. No common recognised core means rejection. Construction functions, topology, cosmetic changes and supporting work do not increase family counts.

Primary release families are Easy's three exact mechanisms; Medium's interior extraction, split/join, groups-to-runs and runs-to-groups; Hard's same four plus mixed exchange; Expert's same five plus combined repair. Medium additionally supports audited mixed exchange. Boundary repair remains deferred: bounded screening found no qualifying Expert fixture, without proving impossibility. Expert combined repair is the approved replacement. Further targets require explicit specification and independent proof.

## Deterministic generation and proof work

Every procedural revision hashes ASCII `rummipuz:1:<revision>:<tier>:<seed>` using FNV-1a (initial state 2166136261, XOR character code then `Math.imul` by 16777619, unsigned low 32 bits) and uses its recorded Mulberry32 implementation. Inclusive selection is `min + floor(draw * (max - min + 1))`; shuffles use descending Fisher–Yates. Each request owns a fresh stream; rejected attempts continue it. No time, locale, device, global random state or completion history enters generation.

| Revision | Implementation | Attempts | Proof nodes per attempt | Acceptance |
| --- | --- | --- | --- | --- |
| 1 | Sample JSON | — | — | Hand-authored fixture |
| 2 | [generator.js](../app/generator.js) | 256 | 20,000 | Solver-verified `candidate`; requested tier is unproved |
| 3 | [rated-generator.js](../app/rated-generator.js) | 128 | 100,000 | Exact minimum-`R` tier |
| 4 | Same module, explicit branch | 64 | 20,000 | Same tier proof, smaller sampling envelopes |
| 5 | [generator-v5.js](../app/generator-v5.js) | 32 | 100,000 shared | Tier plus revision-5 structural gate |
| 6 | [generator-v6.js](../app/generator-v6.js) | 32 | 200,000 shared | Tier plus exact mechanisms and primary-family match |

Revision-4 rack/row sampling envelopes are Easy 2–3/2–3, Medium 4–5/3–4, Hard 4–6/4–5, Expert 5–7/4–5. Older construction algorithms and ordered pattern lists remain defined by the explicit revision branches and their golden outputs in `app/checks/fixtures/generated-v2.json` through `generated-v6.json`.

Revision 5 selects from its ordered tier patterns, shuffles colours, draws reflection and a legal global offset, swaps copies per ASCII-sorted source face, transforms rows, keeps runs ascending, shuffles groups, then board and rack, and proves the tier. Singleton pattern/offset selections still consume draws.

Revision 6 permits only the 36 audited inventories in [patterns-v6.js](../app/patterns-v6.js), plus colour bijections, reflection (`14 - value`), legal global translations and face-wide copy swaps. Do not infer safe intermediate lengths, filler rows, rack neighbours or duplicate allocations. Every transformed inventory is proved again. Its draw order is:

1. Family ticket over cumulative weights in the table below.
2. Pattern ticket over filtered source-order inventories. Default weight is 1; Hard groups-to-runs uses group-only weight 8 (8:1:1), Expert group-only weights 2 (2:2:1). Even singleton buckets consume a draw.
3. Shuffle black/blue/red/orange; draw reflection, then offset inclusively from `1 - min` to `13 - max` after reflection.
4. Draw a copy-swap bit for each distinct original face in ASCII order, mapping physical copies bijectively.
5. Transform original rows in source order, sort runs numerically, shuffle each group, then board, then rack.
6. Prove the tier and primary-family match, publishing the first accepted candidate.

| Tier | Ordered family weights |
| --- | --- |
| Easy | run-donation 1, group-donation 1, run-division 1 |
| Medium | interior-extraction 1, split-and-join 1, groups-to-runs 1, runs-to-groups 1, mixed-exchange 1 |
| Hard | interior-extraction 16, split-and-join 16, groups-to-runs 26, runs-to-groups 16, mixed-exchange 26 |
| Expert | interior-extraction 32, split-and-join 20, groups-to-runs 40, runs-to-groups 16, mixed-exchange 46, combined-repair 46 |

For revisions 5/6, the shared budget covers minimum-`R` proof, physical candidate expansion and physical partition recursion. Sort IDs in ASCII order; enumerate runs in black/blue/red/orange, start, ascending-end order and groups in value/colour-mask order (masks 1–15, those colours as bits 0–3). Expand every physical copy assignment in sorted inventory order. Charge each expansion recursion and partition-search call. Choose the uncovered tile with fewest compatible rows, breaking ties by sorted inventory index, and try candidates in expansion order. Keep physical provenance; memoisation by residual faces alone is unsound for the structural predicate.

The minimum-`R` proof tries zero changed rows upwards, testing every preservation choice. `solvePreservingRows` holds original physical rows as indivisible blocks, permitting valid extensions/merges. Only exhaustive failure of every smaller count proves the minimum. Revision 5 stops Easy on an endpoint witness and higher tiers on a structural counterexample; revision 6 exhausts required partition/family searches, rejecting any higher-tier counterexample and collecting its Easy witnesses.

Inconclusive work returns `limit` without a tier/solution. Completed ineligibility returns `excluded`. Generation separately counts unsolvable, limit, excluded and mismatched tier/family rejections. Rated generation returns `ready` with a verified immutable puzzle, or `exhausted` with null puzzle. Exhaustion is preparation failure, not proof that a seed has no possible puzzle. Cancellation terminates a dedicated worker. Failed/cancelled preparation never replaces saved play or commits a tier change; explicit replay retry remains deterministic.

## Semantic diagnostics

Signatures supplement proof and cannot confer difficulty, certify uniqueness from a truncated set, or change acceptance with device-dependent limits.

1. **Starting geometry:** replace IDs with faces, retaining multiplicity. Try all 24 colour permutations and both value orientations; translate the inventory minimum to 1. Encode rows by kind, numeric run order or sorted group faces; sort row encodings and rack faces. Use the ASCII-lexicographic minimum encoding over 48 transforms. Relative gaps, lengths, group sizes and board/rack separation survive cosmetic normalisation.
2. **Origin-aware solution:** canonicalise start and solution jointly under those transforms. Index sources in sorted starting-row order, enumerating all assignments among tied encodings. Label final tiles by transformed face plus original-row index or rack origin; sort final groups and rows, keeping numeric run order. Choose the smallest joint encoding. Copy labels are cosmetic only in this key; physical proof still distinguishes them and preserves provenance.
3. **Mechanism profile:** record predicates, changed source kinds, component `C/N`, canonical source/final contribution incidence, splits/joins and conversion directions. Family common/optional annotations are exhaustive minimum-solution evidence, independent of which first witness was returned.

Detailed origin/profile records cover only the first **64 minimum physical partitions** in fixed traversal order. Status is `complete` only when total minimum partitions are at most 64, otherwise `truncated`, even if later keys might repeat. This allowance is separate from proof work. Required family certification and physical counts remain exhaustive. Record physical partitions separately from face-level completions, and the sorted pair of unnormalised distances to 1 and 13 separately from translation-normalised geometry.

Immutable revision-6 annotations include `proofNodes`, `structure.version = 2`, full/minimum partition counts, certified/common/optional families, eligible Easy witness kinds, bypass witnesses and bounded signatures. Easy chooses its first priority-family witness; higher tiers use the first minimum partition. Annotations do not replace recomputed proof.

## Variety and release verification

Each revision-6 block requests 256 puzzles per tier: `variety-v6-dev-0` through `-255`, and separately `variety-v6-holdout-0` through `-255`, with full revision-6 identities. Each must independently produce every output and meet these gates:

| Tier | Minimum primary families | Maximum one-family share | Starting-board composition |
| --- | --- | --- | --- |
| Easy | 3 | 50% | Run-only and mixed each >= 20%; group-present >= 20% |
| Medium | 4 | 40% | Run-only and mixed each >= 20%; no group-only floor |
| Hard | 5 | 35% | Run-only, mixed and group-only each >= 10%; none > 60% |
| Expert | 6 | 35% | Run-only >= 20%; mixed >= 40%; group-only 10–30% |

Each required primary family supplies at least 5% of accepted outputs. Minimum integer counts use `ceil(p * n)`, maxima `floor(p * n)`; equality passes. Composition describes all starting rows; also report changed-component composition so filler does not hide repetition.

Keep every failure/cancellation, without replacement seeds, omitted failures, pooling blocks or optional-family aliases. Cancellation tests are separate. After tuning, rerun the full failed named block. The fixed holdout is coverage, not statistical independence from developer inspection.

Report attempt/rejection and proof costs by family, readiness, timing median/p95/max and outliers, geometry/origin/profile frequencies and completeness, boundaries, duplicate/rack/row/length ranges, optional mechanisms and longest streak. Review sequences as 16 consecutive groups of 16 requests per block/tier. Generation remains independent of session history, with adjacent repeats permitted.

New fixture families/parameters need conserved hand solutions, exact minimum `R`, all-solution tier proof, minimum-solution certification, semantic records and simpler-route counterexamples. Preserve accepted/rejected/deferred overlay dispositions. Hard and Expert review each include audited duplicate allocation and competing-placement examples; Medium–Expert collectively include unique and multiple face-level completions. Source parameter/design notes and rejected fixtures are retained in [structural-v6.json](../app/checks/fixtures/structural-v6.json). Geometry variants must differ beyond cosmetic normalisation. Unchanged support rows, rack-only sets and direct extensions give no extra family/difficulty credit.

Use [the native suite](../scripts/run_native.mjs), [independent Python auditors](../scripts/checks/) and golden/structural fixtures under `app/checks/fixtures/`. For device timing and fixed-block diagnostics, serve `app/` and open `checks/revision-6-performance.html`; its benchmark remains in [revision-6-benchmark.js](../app/checks/revision-6-benchmark.js). Native tests cannot substitute for actual desktop/tablet responsiveness or human difficulty review. Do not invent a millisecond acceptance threshold. Revision 6's fixed blocks and family/sequence review were approved on 12 October 2026; historical measurements are not permanent performance guarantees.
