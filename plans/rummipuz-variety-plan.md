# Revision-6 puzzle variety plan

**Status:** Planning only, 11 October 2026. Revision 5 remains the default; no runtime, difficulty rule, replay result, or offline asset changes are made by this plan. The user reported repetitive Expert starting boards and requested a plan covering appropriate variants across all tiers.

## Problem and intended outcome

Revision 5 has seven templates: one Easy, two Medium, two Hard, and two Expert. Both Expert variants share the same four-group conversion core. Colour permutation, numerical reflection/translation, tile order, and copy-label swaps create different presentations without changing that core. Existing variety checks established template coverage, not enough different reasoning for sustained play.

Revision 6 should vary the starting sets, the necessary rearrangement idea, and how changed rows interact. Keep the current rules, four tiers, progression, board/rack bounds, controls, and saved sessions. Introduce revision 6 separately so every revision-1/2/3/4/5 replay remains exact. Retain useful existing patterns as part of a broader mix.

## Variant catalogue

These are design candidates, not proved tier assignments. A family can be used in a tier only after an exact physical fixture passes that tier's easiest-solution checks. Scaling a pattern by adding unrelated rows does not create a higher-tier family.

| Rearrangement idea | What the player needs to notice | Intended placement and conditions |
| --- | --- | --- |
| Endpoint donation from a run | Export one end tile to complete a group; retain a valid run. | Easy baseline. At higher tiers, only as a useful part of a connected construction, never as independent endpoint chores. |
| Donation from both ends | Export both ends of one run into different sets while retaining its middle. | Easy if one row and an obvious complete route suffice; Medium+ only when linked to other genuinely changed rows. Reflection alone is not another family. |
| Four-colour group donation | Remove one colour to complete a run, leaving a valid three-colour group. | New Easy candidate; Medium+ when donation and repair interact with other rows. A three-colour group cannot donate a tile and remain valid. |
| Divide a run without exporting an interior tile | Partition a long run into valid shorter runs to use a duplicate or accommodate new boundaries. | New Easy candidate for a clear single-row split; Medium+ for forced shared repair. Dividing an intact run unnecessarily is not a required mechanism. |
| Interior extraction and repair | Take a middle tile for a group; preserve or rebuild valid fragments on both sides. | Medium–Expert; a simple one-row version may be reviewed for Easy later, but is not needed for the initial Easy expansion. |
| Split followed by a forced join | Repair a stranded short fragment using tiles from another source run. | Medium–Expert. Joining two intact original runs can preserve both and give `R = 0`; extraction or redistribution must force the relevant rows to change. |
| Redistribute boundaries between runs | Shift the allocation of overlapping or adjacent same-colour runs so all remainders are valid. | Medium–Expert. Use real missing tiles or duplicate allocation constraints, not merely move a boundary in an already solved inventory. |
| Convert groups into runs | Redistribute consecutive-value groups by colour and account for every leftover. | Medium if exactly two changed rows qualify; Hard–Expert for larger connected conversions. Count the existing four-group chain and its duplicate overlay as one core family. |
| Convert short runs into groups | Break short runs across colours to build equal-value groups, repairing all leftovers. | Medium–Expert where the physical fixture proves the tier. Supplies a materially different direction of conversion from the present group-to-run core. |
| Exchange between groups and runs | Use a run tile in a group and group tiles to repair or extend runs. | Medium–Expert with tier-sized connected changes. Both directions must matter to completion. |
| Repair through a chain of shared sets | One source contributes to several final sets, linking repairs across other rows. | Hard–Expert. Vary linear, branching, and cyclic sharing where they change the reasoning; graph shape alone is not enough to count another family. A final graph does not prove a forced move order. |
| Combine different mechanisms | For example, interior extraction plus group donation plus boundary repair in one connected component. | Hard–Expert. Audit for independent subproblems and an easier route that bypasses one mechanism. |

Include all catalogue entries in the design investigation. Record an accepted fixture, a tier-specific rejection, or a concrete reason for deferral for each entry. Do not silently omit a candidate because the first construction attempt fails. One motif can have qualifying implementations in more than one tier, but its tier comes from proof and review, not its label.

### Variations within families

Use these dimensions where they create meaningful choices. They supplement core family coverage; they do not count as new families by themselves.

- Three- versus four-colour groups; short versus long runs; asymmetric lengths and repair needs; low/high values where the 1/13 limits matter.
- Run-only, group-only, and mixed starting boards. Higher tiers must not be identified by a single starting-row composition.
- Different connected arrangements of changed rows, and varying numbers of final rows, splits, joins, and exports.
- Duplicate faces when allocating the two copies changes valid repairs or row preservation. Swapping copy labels alone is cosmetic.
- Overlapping values/colours, several plausible uses for a scarce tile, and initially legal placements that can strand another tile. Keep misleading choices fair and reviewable; do not add them to every puzzle.
- Both unique and multiple complete solutions. More solutions do not automatically make a puzzle easier or harder.
- Rack and board sizes within the existing bounds, where the extra tiles contribute to the puzzle. Limit unchanged support rows to required size bounds or meaningful alternatives; do not pad for apparent complexity.

Standalone rack sets, direct extensions, and whole-row joins may appear as supporting actions but cannot supply rearrangement difficulty. Pure same-value exchanges between groups often only change colour/copy allocation without introducing a new reasoning problem; include them only if they affect a necessary run or repair. Jokers, new rules, hints, scoring, and UI redesign remain outside scope.

## Difficulty policy proposal

Preserve exact minimum rearrangement: Easy `R = 1`, Medium `R = 2`, Hard `R = 3`, Expert `R >= 4`. Preserve current rack/board bounds. Continue rejecting zero-rearrangement, unsolvable, mismatched, and inconclusive candidates.

For Medium/Hard/Expert, initially retain revision 5's universal structural gates: every complete solution must contain one changed-row component satisfying `(C, N) >= (2, 1)`, `(3, 2)`, or `(4, 3)` respectively. This includes solutions changing more than minimum `R` and all physical-copy assignments. A connected stored witness alone is insufficient. If a catalogue idea cannot meet a gate, redesign it or document its rejection; do not weaken the gate merely to add a template.

**Proposed Easy change, revision 6 only:** allow a simple witness changing exactly one source row via endpoint donation, four-colour-group donation, or a single run division. A group donation or run division can have `N = 1`, so the current `N = 0` predicate must not be reused unchanged. Specify exact predicates before coding: a donation retains the original group's three-tile core; a simple division produces two valid runs containing all original run tiles, with only necessary rack additions. Reject a zero-change solution independently. Restrict the allowed witness mechanisms explicitly rather than accepting every `R = 1` puzzle. Human review must confirm that these examples remain introductory.

Illustrative new Easy designs, **not yet independently audited**:

- Board: blue/red/orange/black 6 group; orange 10–12 run. Rack: blue 4, blue 5. Intended completion: blue 4–6; red/orange/black 6; orange 10–12. The key move donates one tile from a four-colour group.
- Board: blue 1–6 run; orange 10–12 run. Rack: blue 3 copy 2, blue 4 copy 2 (all board tiles use copy 1). Intended completion: blue 1–4 using the original 3/4; blue 3–6 using the rack 3/4 and original 5/6; orange 10–12. The key move divides one run into two overlapping runs with distinct physical copies.

Update `rummipuz-difficulty.md` with the final revision-6 policy during specification. Leave the published revision-5 policy and rating behaviour intact. Future changes prompted by human review must also be documented before release.

## Generation and selection design

Build a family registry with explicit eligible tiers and parameter constraints. Move beyond only recolouring fixed inventories: vary lengths, offsets between source ranges, missing positions, group sizes, overlaps, and rack contributions where a family supports them. A finite family registry is still finite; describe its limits honestly.

Start from conserved complete solutions or verified construction motifs, derive valid starting rows/racks, and prove the resulting candidate anew. Parameterisation must preserve the physical inventory, not assume it preserves difficulty. Use deterministic revision-specific random draws, canonical traversal, fixed node budgets, and bounded attempts. Keep all generation/proof work in the worker.

Separate family selection from cosmetic transformations. Measure **accepted** output frequencies: a difficult-to-prove family may otherwise disappear through rejection while an easy family dominates. Tune deterministic family selection and retry allocation against acceptance rates. When the selected construction cannot be proved within budget, use documented bounded retry behaviour or fail explicitly; never substitute an easier puzzle or a silent revision-5 fallback. Cancellation/failure retains the active session and chosen tier.

Do not choose a layout from completion history, device settings, or recent puzzles. A full replay code must identify one layout on every device. Balanced sampling reduces repetitive sessions but cannot guarantee no adjacent repeats with independent random seeds. Record short-session repetition in review; any future history-aware anti-repeat selection needs a separate explicit design preserving replay identity.

## Measurable variety acceptance

These are proposed release targets, to be tested and refined during fixture design rather than represented as existing capabilities:

| Tier | Minimum distinct core families | Starting-board coverage |
| --- | --- | --- |
| Easy | 3: run donation, group donation, and simple run division | Run-only and mixed starts; at least 20% of accepted samples include a group. |
| Medium | 4 | Run-only and mixed starts, each at least 20%; investigate group-only designs. |
| Hard | 5 | Run-only, mixed, and group-only starts, each at least 10%; no composition above 60%. |
| Expert | 6 | Run-only at least 20%, mixed at least 40%, group-only between 10% and 30%. |

In a fixed sample of at least **256 successful generated puzzles per tier**, no core family should exceed 50% of Easy, 40% of Medium, or 35% of Hard/Expert; every required family should appear in at least 5% of its tier's accepted outputs. Report every requested seed, including failures, rather than silently sampling until quotas pass. Required families must pass proof and human review; if a target cannot be met within the unchanged bounds, document the evidence and revise the plan openly before release.

Family labels must identify different necessary reasoning, not different constants or code branches. Distinguish core families, parameter variants, and overlays in metadata. Existing Expert duplicate-choice and four-group-chain count together towards the same family cap. Check solution alternatives: if a supposedly new mechanism can be bypassed, classify it as optional and do not count it as forced mechanism coverage.

Record semantic signatures of starting rows and solutions, accounting for source origins and face multiplicities. Normalise row/group order, colour renaming, global numerical reflection/translation, and bijective copy-label swaps when comparing cosmetic equivalents. Preserve relative numerical gaps, run lengths, group sizes, meaningful duplicate multiplicity, and contribution structure. Compare starting structure separately from solution mechanisms; neither raw face-layout counts nor a single solver witness measures both. For small fixtures, review all minimum-`R` solution mechanisms; document sampling/limits for larger diagnostics without weakening required tier proofs.

Report family frequencies, board compositions, rack/row/length ranges, duplicate use, cosmetic-equivalent repeats, simpler bypass routes, and family streaks in fixed short-session sequences. Use manual review to judge whether distinct signatures actually feel different. A larger registry that still produces the same visible/mental pattern fails the intent of this plan.

## Work sequence and acceptance

1. **Specify families and revision-6 policy.** Turn the catalogue into a tier matrix, define the Easy predicates and semantic signatures, and confirm quotas/bounds. Done when every catalogue entry has an investigation disposition and the planned release has enough distinct, plausible families per tier. No existing policy changes at runtime.
2. **Construct and independently audit fixtures.** Provide exact physical inventories, conserved hand solutions, minimum `R`, and all-solution structural results. Include simpler-alternative counterexamples for rejected designs and duplicate-origin cases. Done when the release targets are supported by proved fixtures, not merely motif descriptions. Extend/reuse the independent Python oracle while preserving revision-5 audit results.
3. **Implement explicit revision 6.** Add parameterised family construction, deterministic selection, revision-specific rating, replay/worker support, and metadata. Keep revision 5 as the default. Done when candidates pass all required proofs, old golden outputs remain exact, and worker cancellation/failure/resume semantics remain intact. Increment offline release and include any new runtime assets.
4. **Audit accepted output and preparation cost.** Run the fixed multi-seed sample, independent small-inventory comparisons, old replay regressions, and worker/offline checks. Measure frequencies, repetition, node costs, failure rates, median/p95/max timings and main-thread responsiveness by tier **and family**, including desktop/tablet runs. Done when quotas pass, required families are not lost to rejection, and preparation is acceptable on both devices; document any slow outliers and exhausted seeds.
5. **Review samples with the user and tune.** Supply reproducible codes, starting layouts, spoiler-hidden explanations and verified hand solutions. Cover every core family and meaningful overlay, plus short consecutive same-tier sequences so repetition is visible. Done when Easy remains approachable and the higher tiers offer visibly and mentally different problems. Re-audit after tuning; review mechanisms rather than only the number of samples that work.
6. **Switch the approved default.** Only after sample approval, make revision 6 supply fresh Start/Next; preserve old replay/saved sessions, update documentation and offline release, and verify actual-worker flow plus the precache-only package. Whole-session/browser/offline verification remains separately required.

The next work is specification and fixture design. This planning change does not implement revision 6 or switch the default.
