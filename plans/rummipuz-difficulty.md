# Rummipuz difficulty and progression — initial policy

The first version has four selectable tiers. A new device defaults to **Tier 1 — Easy**. Every tier is available immediately; players do not have to unlock them. Later visits retain the chosen tier, and Resume keeps the current puzzle's recorded tier.

## Initial tier definitions

Difficulty is based on the easiest complete solution, rather than a deliberately complicated stored solution. Let `R` be the minimum number of original board rows that must be rearranged over all complete solutions:

- An original group is preserved if all its physical tiles remain together in one final valid group, in any colour order. Adding another colour does not rearrange it.
- An original run is preserved if all its physical tiles remain together as the same consecutive sequence in one final valid run. Extending either end does not rearrange it.
- Otherwise that original row is rearranged. Removing tiles, splitting a row, or redistributing its tiles into different sets counts once for that original row. Moving a whole row to another screen position does not count.
- Count original rows, not final rows or the player's editing moves. Use physical identities when evaluating preservation, including matching copies.

| Tier | Picker description | Initial rack size | Initial board rows | Required `R` |
| --- | --- | --- | --- | --- |
| 1 — Easy | Rework one existing row to make room for your tiles. | 2–5 | 2–5 | Exactly 1 |
| 2 — Medium | Coordinate changes across two existing rows. | 3–6 | 3–6 | Exactly 2 |
| 3 — Hard | Coordinate changes across three existing rows. | 4–8 | 4–7 | Exactly 3 |
| 4 — Expert | Rebuild four or more rows while managing a larger rack. | 4–10 | 4–9 | At least 4 |

All bounds are inclusive. All tiers require valid starting rows, conserved tiles, and a complete solution. A candidate outside its requested tier's bounds is rejected, not relabelled or quietly served as an easier puzzle. These limits are initial generation targets, to be reviewed with human samples in Phase 3; they are not yet evidence of measured human difficulty.

Every tier requires board rearrangement, including the newly named Easy tier. Puzzles with `R = 0` are excluded from every tier, even when their rack or board is large.

Proving tier membership requires more than finding one witness solution. Easy needs a solution rearranging one row and proof that no solution preserves all rows. Medium needs a solution rearranging two rows and proof that no solution rearranges zero or one. Hard needs a solution rearranging exactly three rows and proof that no solution rearranges fewer than three. Expert needs a complete solution and proof that no solution rearranges fewer than four rows. An inconclusive or timed-out search cannot publish a rated puzzle. The solver may use constrained searches for these proofs rather than enumerating every solution.

Within each tier, include a mix of rack and board sizes within these bounds. Do not require a strictly increasing rating for every consecutive puzzle; structural complexity and variety matter more than raw tile count. In Phase 3, record rack size, board rows, `R`, and competing placements (distinct legal destinations for rack tiles in the initial position without moving board tiles) to tune candidate selection. Rating and generation depend only on the replay tuple, never on completion counters or device history. Multiple solutions and dead-end choices remain acceptable; no time or move limit is imposed.

## Examples and sample assignment

- **Excluded:** blue 3–5 on the board and blue 6 in the rack. Appending 6 gives `R = 0`; this is no longer a rated puzzle.
- **Easy:** [sample-puzzle.json](sample-puzzle.json) has two starting runs and red/black 6 in the rack. A solution moves blue 6 from its original run to form a group, so `R <= 1`. Neither rack tile can extend either blue run, and two rack tiles cannot form a valid set by themselves. Thus a solution preserving both original rows is impossible, and `R = 1`. Assign the sample to Tier 1.
- **Medium structural example:** board rows are blue 1–6, red 1–6, and orange 9–11; rack is black 6, black 12, blue 12, and red 12. Form a group of blue/red/black 6, leaving blue and red 1–5 runs; form a second group of black/blue/red 12; preserve orange 9–11. Black 6 requires both blue 6 and red 6 because no other 6 is present and black 4–5 or 7–8 are unavailable. Both original runs must be rearranged, giving `R = 2`, four rack tiles, and three starting rows.
- **Hard structural example:** board rows are blue 1–6, red 1–6, orange 7–12, and orange 1–3; rack is black 6, blue 12, red 12, and orange 4. Form blue/red/black 6 and blue/red/orange 12 groups, leaving blue and red 1–5 and orange 7–11 runs; extend orange 1–3 with orange 4. Black 6 forces both blue and red runs to change. Blue/red 12 cannot form runs or a group without the sole orange 12, forcing the third run to change. Thus `R = 3`, with four rack tiles and four starting rows.

An **Expert structural example** has board rows blue 1–6, red 1–6, orange 8–13, and black 8–13; rack tiles are black 6, blue 13, red 10, red 11, and red 12. Form blue/red/black 6 and blue/orange/black 13 groups, leaving blue/red 1–5 and orange/black 8–12 runs; form a red 10–12 run from the remaining rack tiles. Black 6 cannot form a black run because black 5 and black 7 are absent, so it forces both original blue/red runs to change. Blue 13 cannot form a blue run because blue 12 is absent, so it forces both original orange/black runs to change. Thus `R = 4`, with five rack tiles and four starting rows. The earlier 7–12 example allowed black 6 to extend its existing black run and did not force four rows to change.

## Revision-5 structural difficulty policy — specified, not implemented

Phase 6 adds structural requirements for newly generated revision-5 puzzles. Revisions 1–4 retain their existing identities and rating behaviour. The four tiers, exact minimum `R` requirements, full rack/board-size bounds above, and three-completion progression policy remain unchanged. Revision 4 stays the default until revision-5 samples are approved. The additional thresholds below are an initial design policy, not a measured human-difficulty scale; tuning them before publication must be recorded here and in the implementation plan.

### Features of a complete solution

Evaluate the actual physical IDs in a complete, valid, conserved final board. Ignore final row order and group colour order. Classify every original row as preserved or changed using the existing definition. Structural features describe the final arrangement, not a player's move sequence: temporary invalid rows, undo, or moving tiles through the rack do not affect them.

**Connected changed rows (`C`).** Make a graph with one vertex for each changed original row. Connect two vertices when a final valid row contains at least one physical tile from each of those original rows. Let `C` be the number of vertices in the largest connected component, or zero when no rows change. Transitive connections count: if one original row contributes to two different final rows, it can link two otherwise separate rearrangements.

Rack tiles are not graph vertices and do not connect components simply because they started in the same rack. Preserved original rows also do not connect components. A final row containing only rack tiles contributes no connection. Thus two independent two-row endpoint groups give `C = 2`, even though four rows change. Three changed source rows linked through two final sets give `C = 3`. This is a precise measure of shared final sets, not proof that a particular move order or reasoning dependency is forced.

**Rows requiring more than endpoint extraction (`N`).** A changed original run is endpoint-only in a solution if there exists a contiguous core of at least three original physical tiles satisfying all these conditions:

1. All original tiles in one final run are exactly that core, in consecutive order; the final run may also contain rack tiles or tiles from other original rows.
2. Every other tile from the original run is exported to another final row, so only an original prefix, suffix, or both have been removed from the core.
3. Neither exported end contains three or more consecutive original tiles that remain together in any other final run. Such a surviving run fragment is a split, rather than simple endpoint donation.

Check every possible core; finding any core satisfying all three conditions makes that row endpoint-only for this conservative test. Every other changed original row counts once towards `N`. This includes every changed group, a run with no retained valid core, or a run split into multiple surviving run fragments. The test deliberately does not count a single interior extraction that leaves only one valid core and short exported fragments as complex merely because the extracted tile was originally in the middle.

For example, blue 1–6 retaining blue 1–5 and donating 6 is endpoint-only. Blue 1–7 becoming blue 1–3, blue 5–7, and a group containing blue 4 counts towards `N`: both three-tile fragments survive as separate runs. Turning a three-colour group into tiles used in runs also counts. Removing two endpoints from one run still counts as endpoint-only if it retains a single valid core and neither exported end survives as another three-tile run fragment.

A connected component's `N` is the number of its vertices that pass this non-endpoint test. Count original rows, not donated tiles, final sets, or pattern labels. A row contributing to several new sets still counts once. Connection and non-endpoint counts must be satisfied by the **same component of the same solution**; independent complex rows elsewhere cannot inflate a component's score.

### Tier acceptance requirements

All tiers first pass the existing solvability, inventory, size, and exact minimum-`R` checks. Apply these additional revision-5 gates:

| Tier | Additional structural requirement |
| --- | --- |
| Easy | At least one solution changing exactly one row is endpoint-only (`N = 0`). This preserves a clear introductory route; other solutions may be more elaborate. |
| Medium | Every complete solution has a connected component with at least two changed rows and at least one non-endpoint row in that component. |
| Hard | Every complete solution has a connected component with at least three changed rows and at least two non-endpoint rows in that component. |
| Expert | Every complete solution has a connected component with at least four changed rows and at least three non-endpoint rows in that component. |

For Medium through Expert, the universal requirement includes solutions changing **more** than the minimum `R`. An easy endpoint route must not pass just because it touches extra rows. A candidate meeting the row-count tier but failing its structural gate is rejected for that requested tier; it is not silently relabelled. Do not increase board/rack bounds or promote a puzzle merely because generation struggles to find qualifying candidates. Revisit construction patterns and proof cost, and document any needed policy revision.

### Examples and counterexamples

The existing sample remains a suitable revision-5 Easy pattern: donate blue 6 from blue 1–6 to the rack's red/black 6 group, leaving blue 1–5 and the second blue run intact. The minimum `R` is one and an endpoint-only solution exists.

The existing Medium example above changes two runs but only removes their 6 endpoints. Its witness has a connected component of size two with zero non-endpoint rows. That one easy witness is sufficient to reject it under the revision-5 Medium gate, regardless of any more complicated stored answer.

A stronger Medium example starts with blue 1–7, red 1–7, and orange 10–12; the rack contains black 4, black 9, red 9, and orange 9. Use copy 1 for every tile. Form the blue/red/black 4 group, retain blue and red 1–3 and 5–7 as four runs, form the black/red/orange 9 group, and preserve orange 10–12. Black 4 has no possible black run or orange 4 partner: both blue 4 and red 4 must join it. Their source runs must both split around an interior tile; no same-colour 4 remains to repair either run. This forces `R = 2` and a shared two-row component with two non-endpoint rows. The extra 9 group is independent and supplies no structural credit. It fits the existing Medium size bounds. An independent exhaustive partition enumeration of this 21-tile, all-copy-1 inventory found exactly one final partition, ignoring row and group order, matching the arrangement above. Thus the example has no easier alternative. General physical-copy alternative searches remain a later implementation requirement.

The existing Hard example has a two-row 6 group and a separate one-row 12 extraction. Its witness has `C = 2` and no non-endpoint rows, so it fails revision-5 Hard despite `R = 3`. The existing Expert example has two separate two-row endpoint groups, so it likewise fails despite `R = 4`.

For a future Hard construction, the structural target is three changed rows linked through shared final sets, with at least two source rows split or converted rather than peeled at their ends. Expert extends that connected structure to at least four rows and three non-endpoint rows. These are design targets, not yet verified puzzle fixtures. The next Phase 6 step supplies full hand-derived patterns and reviews their alternative solutions; merely drawing a connected witness does not establish acceptance.

### Proving that easier solutions are unavailable

Keep the existing minimum-`R` proof, then perform a separate structural counterexample search. For Medium through Expert, ask whether **any** complete conserved arrangement lacks a component satisfying both of its thresholds. A found counterexample rejects the candidate. Only exhaustive failure of that search proves the structural gate. For Easy, search for an endpoint-only witness changing exactly one row; absence of such a witness excludes it from the revision-5 introductory pattern.

Either enumerate all valid physical-tile partitions with sound pruning, or implement an equivalent constrained exact-cover search that proves absence of counterexamples. The current `ratePuzzle` and `solvePreservingRows` return a first witness and cannot establish these new gates without extension. Do not inspect just that witness, just minimum-`R` solutions, or a random sample of solutions.

Physical-copy assignment matters to preservation, connections, and retained cores. Searches must explore distinct assignments or prove an equivalence reduction sound for **all** these features. The current face-count search's deterministic assignment of free copies alone is insufficient for a universal structural proof. Memoization/pruning must retain the origin and structural information needed by the counterexample predicate; a cache keyed only by remaining face counts cannot be assumed sound. Canonical row order and group colour order may remove duplicate arrangements because neither changes the predicate.

Use fixed revision-specific traversal and node budgets, shared across the required proofs for a candidate. Budget exhaustion, cancellation, or unsupported proof logic is inconclusive and cannot publish a revision-5 puzzle. Record a complete witness, exact `R`, component membership and non-endpoint classifications for that witness, counterexample-search outcome, and proof-node counts for review. These witness features explain an accepted puzzle but do not replace the universal proof. Differential checks against an independent exhaustive physical-tile oracle on small inventories belong to the later implementation step.

### Human review and calibration

Provable gates establish tile conservation, solvability, minimum rearrangement, and the absence of solutions below the specified structural thresholds. They do not prove that people will find a puzzle difficult, that connections force a particular temporal dependency, or that there is only one solution.

Review reproducible samples for whether the key idea is obvious, whether a decision changes options elsewhere, whether apparent alternatives are meaningful, whether patterns repeat, and whether extra tiles add reasoning rather than visual clutter. Initially legal rack placements, tile count, solver-node count, move count, and number of solutions are diagnostic observations, not tier gates or interchangeable human-difficulty scores. Player feedback may reveal easy routes that satisfy these structural gates; improve the documented criteria and construction before approving the new default. Easy should remain teachable, and the higher tiers should feel progressively more demanding in actual play.

## Completion credit and promotion

Keep a completed-identity set and a completion-credit counter for each tier on the device. Identity is the full `(version, generatorVersion, difficultyTier, seed)` tuple. Each counter starts at zero and is capped at three.

1. On the first successful Check for an identity, record it and add one credit to its recorded tier's counter, capped at three. Generated puzzles and first-time replays are treated equally. Undo count, resets, elapsed time, and temporary invalid rows do not reduce credit.
2. Replaying or reloading an already completed identity adds no credit. Checking an unfinished puzzle, skipping it, failed generation, and opening a picker add no credit.
3. For **Next puzzle**, use the chosen tier for future generated puzzles. With fewer than three credits at that tier, keep it. With three credits and a higher tier available, propose exactly one tier up. Show, for example, “Next puzzle: Medium — 3 Easy puzzles completed.”
4. Commit the proposed tier change only when its new puzzle is ready. Cancel or failure leaves the chosen tier unchanged. Counters are cumulative and retained across promotion, manual changes, replay, and reload; there is no consecutive-win streak to lose. Starting again at a previously completed lower tier may therefore already qualify for promotion on Next, which the completion panel must make clear.
5. At Expert, remain at Expert and continue producing fresh puzzles without a limit. Its counter stays capped at three; no fifth tier is implied.

The difficulty picker shows each tier's credit count, such as “2 of 3 completed”, or “Ready to move up”; Expert shows its name without promising a further promotion. Selecting any tier manually overrides the next puzzle's proposed promotion and starts directly at that chosen tier. It neither erases credit nor automatically redirects that explicit selection to a higher tier.

A replay never changes the chosen tier for future generated puzzles. It may earn a first-completion credit at its own tier. After replay, Next evaluates the chosen tier's counter, not necessarily the replay's tier. The Completed panel labels both the finished puzzle's tier and the proposed next tier so this difference is visible.

If storage is unavailable, apply the same rules in memory for the current session and show the existing unsaved-progress notice. Do not imply that credits will survive a reload.

## Progression examples for later verification

| Action | Expected result |
| --- | --- |
| New player starts without changing the picker | Easy, with zero credits. |
| Complete two distinct Easy puzzles | Next stays Easy; Easy has two credits. |
| Complete a third distinct Easy puzzle | Next proposes Medium; accepting a ready puzzle selects Medium. |
| Cancel or fail preparation of that Medium puzzle | Keep the completed puzzle and Easy selection; Next still proposes Medium. |
| Complete the same Easy seed again with the same full identity | No additional credit. |
| Select Hard manually on a new device | Start Hard immediately, without unlocking earlier tiers. |
| Complete three distinct Hard puzzles | Next proposes Expert; accepting a ready puzzle selects Expert. |
| Select Expert manually on a new device | Start Expert immediately, without unlocking earlier tiers. |
| Complete three distinct Expert puzzles | Next remains Expert; more puzzles remain available. |
| With Easy selected and two Easy credits, complete a first-time Medium replay | Medium earns one credit; next generated puzzle stays Easy. |
| With Medium selected, manually choose Easy after earning three Easy credits | The explicit new puzzle is Easy; its Completed panel proposes Medium for Next. |

## Implemented rating proof

`ratePuzzle` validates the starting puzzle, then tests zero changed rows, one changed row, and so on. For each count, it tries every choice of original rows to preserve. `solvePreservingRows` treats those rows as indivisible blocks of physical IDs, enumerates every legal group/run, and exhausts compatible block combinations plus remaining free tiles. Blocks may merge into a single valid row or gain extensions; matching physical copies remain separate. Failed search states are memoized by free face counts and remaining block identities.

The first complete witness, after all smaller changed-row counts have been ruled out, proves the exact minimum `R`. Zero rearrangement or a size mismatch produces `excluded`; exhaustion of the shared node budget produces inconclusive `limit` with no tier. A rated result reports the actual tier, independently of the requested tier. Revision-3 and revision-4 generation accept only exact requested-tier matches.

Rating features record rack size, board rows, minimum rearrangement, one minimum witness's changed-row indices, and competing placements as the number of initially valid rack-tile insertion gaps. The proof suite compares minimum `R` against an independent exhaustive physical-tile partition search and verifies the four structural examples. The corrected Expert example separates low and high runs so a rack tile cannot simply extend the high run.

Phase 3 must review the tier limits and generation speed using actual puzzles. Any later change that alters deterministic generation requires a generator-version increment under the puzzle-format replay contract.

Initial sample review retains these tier definitions and broad bounds, while revision 4 uses smaller sampling envelopes for clearer teaching moves and reduced proof work. See [rummipuz-sample-review.md](rummipuz-sample-review.md) for eight hand-derived solutions and generation timing. This is design analysis; actual learner feedback is still pending.
