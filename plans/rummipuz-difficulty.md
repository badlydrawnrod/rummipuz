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
