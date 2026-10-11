# Revision-5 rearrangement patterns — hand-authored design review

These are candidate construction families for Phase 6, not a new generator or published revision-5 puzzles. The runtime still uses revision 4. The designs satisfy the proposed [structural policy](rummipuz-difficulty.md#revision-5-structural-difficulty-policy--specified-not-implemented); actual player difficulty and variety still need review before revision 5 becomes the default.

Exact physical tile IDs, starting layouts, and hand-derived complete solutions are in [revision-5-patterns.json](revision-5-patterns.json). These fixtures deliberately omit generator identities: no revision-5 replay codes are supported yet. In the descriptions below, every tile uses copy 1 except where copy 2 is explicitly stated. A range such as blue 1–7 means an ascending run; a list of colours at one value means a group. A solution lists every final row, and the rack is empty.

## Verification and alternative solutions

The independent [Python audit](checks/review_v5_patterns.py) enumerates every legal physical-tile run and group, including every available copy assignment, and partitions the entire inventory using a deterministic most-constrained-tile search. It does not use the production solver, rating module, or generator. It checks valid starting rows, ascending runs, unique inventory, the supplied solution's exact conservation, existing size bounds, exact minimum `R`, and the structural gate across **all** complete partitions. Canonical partition traversal ignores final row/group order without discarding distinct copy assignments. No search budget truncates these small fixture audits.

Run from the project directory:

```bash
python3 plans/checks/review_v5_patterns.py
```

Results from the complete audit:

| Design | Tier | Rack / original rows | Tiles | Complete physical partitions | Minimum `R` | Components in complete solutions: (changed rows, non-endpoint rows) |
| --- | --- | --- | --- | --- | --- | --- |
| easy-endpoint | Easy | 2 / 2 | 11 | 8 | 1 | (1, 0), or (2, 1), or (2, 2) |
| medium-interior-splits | Medium | 4 / 3 | 21 | 1 | 2 | (2, 2) |
| medium-split-and-join | Medium | 4 / 3 | 17 | 1 | 2 | (2, 2) |
| hard-groups-to-runs | Hard | 4 / 4 | 16 | 1 | 3 | (3, 3) |
| hard-group-run-exchange | Hard | 7 / 4 | 19 | 1 | 3 | (3, 3) |
| expert-four-group-chain | Expert | 6 / 4 | 18 | 8 | 4 | (4, 4) |
| expert-duplicate-choice | Expert | 6 / 5 | 21 | 80 | 4 | (4, 4), or (5, 5) |
| rejected-optional-join | Rejected Medium candidate | 5 / 3 | 18 | 2 | 2 | One solution has (2, 2); another has two separate (1, 1) components |

The seven accepted fixtures have 100 complete partitions in total. Every Medium/Hard/Expert partition meets its tier's connected-component and non-endpoint thresholds; Easy has the required one-row endpoint-only witness. The rejected fixture demonstrates why a connected witness alone is insufficient. These counts are proof evidence for the supplied inventories, not generation-performance estimates or human-difficulty scores.

## Easy: one endpoint, with physical copies

**Start:** blue 1–6 copy 1; blue 3–5 copy 2. **Rack:** red 6, black 6.

**Solution:** blue 1–5 copy 1; blue 3–5 copy 2; blue/red/black 6.

Donate blue 6 from the long run. Both remaining runs are valid, so there is a clear one-row introductory route. Red and black 6 have no same-colour neighbours and require blue 6 for their group; a zero-rearrangement solution is impossible. The two copies of blue 3–5 also admit other physical partitions, some changing both original rows, but the simple witness is sufficient for Easy. This is the existing sample, retained as a baseline rather than made harder.

## Medium: remove middle tiles and divide two runs

**Start:** blue 1–7; red 1–7; orange 10–12. **Rack:** black 4, black 9, red 9, orange 9.

**Solution:** blue 1–3; blue 5–7; red 1–3; red 5–7; blue/red/black 4; black/red/orange 9; orange 10–12.

Black 4 can only form the 4 group with blue and red 4. Removing those interior tiles leaves two valid pieces of each original run. Both source rows change and meet in the same final group; both count as non-endpoint rearrangements. The 9 group uses the rack independently and does not earn connection credit. There is exactly one complete partition, ruling out endpoints-only or disconnected alternatives. Orange 9 cannot simply extend orange 10–12 because that leaves black/red 9 without a valid set.

This family introduces run division without requiring a large board. Its shared idea is still visible, so human review should check whether it fits Medium rather than assuming the structural gate guarantees challenge.

## Medium: a split that forces a join

**Start:** blue 1–7; blue 8–10; orange 11–13. **Rack:** black 4, red 4, black 10, red 10.

**Solution:** blue 1–3; blue 5–9; blue/red/black 4; blue/red/black 10; orange 11–13.

The rack forces both blue 4 and blue 10 into groups. Removing 4 divides the first run. Removing 10 leaves only blue 8–9 from the second, which cannot stand as a valid run: it must join blue 5–7 to become blue 5–9. That join connects the two changed originals. The first row is split, and the second has no retained three-tile core; both count towards `N`. The complete partition is unique.

This is a linked decision: solving the two groups requires repairing the stranded two-tile remainder through the other changed row. The orange run supplies the policy's third starting row but contributes no rating credit. The construction must retain the two-tile remainder; adding a convenient rack neighbour can introduce a disconnected shortcut.

## Hard: break three groups to build runs

**Start:** blue/red/orange 4; blue/red/orange 5; blue/red/orange 6; black 10–12. **Rack:** blue 3, blue 7, red 3, red 7.

**Solution:** blue 3–7; red 3–7; orange 4–6; black 10–12.

Blue 3 has no possible group and must enter a blue run. Blue 7 also cannot form a group. Without duplicate blue middle tiles, a complete partition must join both endpoints through blue 4–6, breaking all three original groups. The red endpoints force the analogous red run, and the orange leftovers form orange 4–6. Every final coloured run shares tiles from those three original groups, so all three changed rows form one component and all three are non-endpoint rows. The black run is preserved. The complete partition is unique.

The player must reinterpret the starting sets by colour and account for every leftover from each broken group. This differs from taking independent endpoints from already convenient runs.

## Hard: exchange tiles between groups and a run

**Start:** blue/red/orange 4; blue/red/orange 5; blue 6–8; black 10–12. **Rack:** blue 3, red 3, orange 3, red 7, orange 7, blue 9, blue 10.

**Solution:** blue 3–6; red 3–5; orange 3–5; blue/red/orange 7; blue 8–10; black 10–12.

Red and orange 7 have no neighbouring 6 or 8 of their colours; they require blue 7 to form a group. That breaks the short blue 6–8 run and strands blue 6 and blue 8. Blue 8 joins rack blue 9–10; blue 6 must join blue 3–5, which draws blue 4 and 5 out of both original groups. The red/orange leftovers from those groups join their rack 3s. The initially tempting rack 3 group cannot survive in a complete solution because it would strand blue 6. The final blue 3–6 run connects both changed groups and the changed original run. All three are non-endpoint rows. The complete partition is unique.

This combines group-to-run conversion, run-to-group conversion, and repairs on both sides of a removed middle tile. The seven-tile rack stays inside the existing Hard bound; its extra tiles support the repair rather than merely adding independent sets.

## Expert: four connected groups with alternative run divisions

**Start:** blue/red/orange 4; blue/red/orange 5; blue/red/orange 6; blue/red/orange 7. **Rack:** blue 3, blue 8, red 2, red 3, red 8, red 9.

**Solution:** blue 3–8; red 2–9; orange 4–7.

There is no orange or black 3/8 available to complete endpoint groups. Blue 3 and blue 8 must be accommodated in runs using all four original blue middle tiles. They may form one long run or two disjoint runs, but every original group still loses its blue tile. Red 2 and red 9 similarly force the red middle tiles into runs. The orange leftovers form orange 4–7. Consequently all four original groups change.

Some solutions divide blue 3–8 into blue 3–5 and blue 6–8, or divide red 2–9 into two valid runs. The blue/red contributions still connect the four original groups transitively, including when both colours divide. Exhaustive enumeration finds eight complete partitions, all with one four-row, four-non-endpoint component. Thus multiple solutions are allowed without admitting an independent endpoint shortcut.

This is an Expert construction seed, not evidence that four similar groups alone will feel difficult. Generation should mix it with other connected families instead of repeatedly recolouring it.

## Expert variant: duplicate tiles with origin-sensitive choices

Add **red 4–6 copy 2** as a fifth starting row to the Expert design above; keep its rack unchanged. The supplied solution leaves that extra run intact alongside blue 3–8, red 2–9, and orange 4–7 using copy 1.

Alternative solutions can exchange which red copies supply the long red run and the shorter remainder, or split those runs differently. Unlike merely changing tile labels, these assignments can preserve the fifth original row or change it. The exhaustive physical audit finds 80 partitions: every solution still connects the four changed groups with four non-endpoint rows; solutions that break the added run connect all five with five non-endpoint rows. Minimum `R` stays four, and no easier structural route appears.

The extra row introduces real physical-copy and layout alternatives within the existing Expert five-row envelope. Keep this as an optional variation: whether those alternatives add useful human reasoning rather than clutter is a later review question.

## Rejected variant: joining is optional

**Start:** blue 1–7; blue 9–11; orange 1–3. **Rack:** blue 8, black 4, red 4, black 11, red 11.

A connected witness is blue 1–3; blue 5–10; blue/red/black 4; blue/red/black 11; orange 1–3. It changes two rows and satisfies the Medium component gate.

But blue 1–3; blue 5–7; blue 8–10; the same two groups; and orange 1–3 is also a complete solution. Rack blue 8 repairs the second source independently, giving two disconnected one-row components. The audit finds exactly these two partitions and rejects the candidate. This explains the accepted split-and-join pattern's adjacent source ranges and lack of a separate rack repair tile.

## Construction boundaries for the next step

Use these verified inventories as seed patterns, not as permission to publish every colour/value variation. Colour permutations and face-wide copy-label swaps preserve the features by bijection, but added rows, rack neighbours, duplicated faces, and shifted/expanded value ranges can create new solutions. Every generated candidate must undergo the actual revision-5 solvability, minimum-`R`, and structural counterexample proofs.

Keep physical identities explicit, limit additional rows to useful choices or required size bounds, and vary the structural family as well as colour roles. Preserve old replay revisions. Implement revision-5 generation and its proof logic next; performance checks, desktop/tablet sessions, and user sample approval remain separate unfinished steps. No runtime assets changed during this design work, so no offline release increment is needed here.
