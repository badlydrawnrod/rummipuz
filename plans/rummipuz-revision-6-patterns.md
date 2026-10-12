# Revision-6 physical pattern review

**Status:** Independent fixture design/audit complete, 11 October 2026. There are **36 accepted inventories**, spanning **3 Easy, 5 Medium, 5 Hard, and 6 Expert core families**, plus nine rejected designs with counterexamples. This includes every primary tier/family pairing and an optional Medium mixed exchange. These are design fixtures, not generated puzzles or supported replay codes. Runtime revision 5 and offline release `v3` remain unchanged; no browser access or commit was used.

Exact IDs, valid starting rows, racks, conserved reviewed solutions, variant relationships, and parameter notes are in [revision-6-patterns.json](revision-6-patterns.json). Full independent evidence is in [revision-6-pattern-audit.json](revision-6-pattern-audit.json): exact minimum `R`, all-solution structural results, certified minimum-solution mechanisms, full semantic keys/profiles, physical/face partition counts, initial placement diagnostics, and simpler-route witnesses. See the [amended specification](rummipuz-revision-6-specification.md) for the exact predicates.

## Verification and limits

Run from the project directory:

```bash
python3 plans/checks/review_v6_patterns.py --output plans/revision-6-pattern-audit.json
python3 plans/checks/review_v5_patterns.py
```

The new [Python audit](checks/review_v6_patterns.py) enumerates all legal rows and every physical-copy assignment, then exhausts complete partitions with an integer-mask exact-cover search. It does not invoke production JavaScript, the game solver, or the generator. For every inventory it compares the full physical partition set with the existing independent plain set-cover enumerator. Neither acceptance path uses a timeout, truncation, or face-count equivalence for origin-sensitive proofs.

All **757 accepted physical partitions** satisfy their specified tier gates. The full audit covers **1,042 partitions** across accepted and rejected inventories. Family certification inspects every minimum-`R` partition, not just the stored solution; higher-tier difficulty inspects every complete partition. Conservation, row validity/order, current size bounds, exact minimum `R`, and declared primary labels are asserted. The saved report hashes the input fixtures, audit, and independent helper so its provenance can be checked.

Additional checks cover cosmetic symmetry for all nine release cores, a nontrivial translation, tied identical source-row ordering, and an origin-allocation change that must retain a different solution key. Every family has at least one audited noncosmetic parameter variant. Existing revision-5 audits are preserved separately. Oracle node counts measure this Python partition traversal only; they exclude signature work and do not represent the production shared proof budget or device speed.

This establishes fixture correctness and formal family coverage. It does not establish generated output frequencies, parameter ranges beyond the supplied inventories, preparation performance, or human acceptance. Some new families share underlying inventory constraints; later short-session review must still decide whether they feel sufficiently different. No additional colour/value/copy transformation is counted as a new family.

## Accepted fixture index

`Physical` counts every physical partition; `Face` ignores copy labels and source origins but retains the final face rows. Extra copy partitions are not presented as extra human solutions. All minimum solutions share the certified higher-tier primary mechanism. Easy instead has the specified existential witness and priority rule.

### Easy

| Fixture | Certified core | Minimum R | Physical | Face |
| --- | --- | --- | --- | --- |
| `easy-run-donation` | run-donation | 1 | 8 | 1 |
| `easy-both-ends` | run-donation | 1 | 1 | 1 |
| `easy-group-donation` | group-donation | 1 | 1 | 1 |
| `easy-group-middle-donation` | group-donation | 1 | 1 | 1 |
| `easy-run-division` | run-division | 1 | 4 | 1 |
| `easy-longer-division` | run-division | 1 | 4 | 1 |

### Medium

| Fixture | Certified core | Minimum R | Physical | Face |
| --- | --- | --- | --- | --- |
| `medium-interior-extraction` | interior-extraction | 2 | 1 | 1 |
| `medium-asymmetric-interior` | interior-extraction | 2 | 1 | 1 |
| `medium-split-and-join` | split-and-join | 2 | 1 | 1 |
| `medium-longer-split-join` | split-and-join | 2 | 2 | 2 |
| `medium-groups-to-runs` | groups-to-runs | 2 | 1 | 1 |
| `medium-four-colour-conversion` | groups-to-runs | 2 | 1 | 1 |
| `medium-runs-to-groups` | runs-to-groups | 2 | 1 | 1 |
| `medium-adjacent-rack-partners` | runs-to-groups | 2 | 1 | 1 |
| `medium-mixed-group-donation` | mixed-exchange | 2 | 1 | 1 |

### Hard

| Fixture | Certified core | Minimum R | Physical | Face |
| --- | --- | --- | --- | --- |
| `hard-interior-extraction` | interior-extraction | 3 | 4 | 1 |
| `hard-split-and-join` | split-and-join | 3 | 8 | 4 |
| `hard-groups-to-runs` | groups-to-runs | 3 | 1 | 1 |
| `hard-four-colour-group-only` | groups-to-runs | 3 | 1 | 1 |
| `hard-duplicate-choice` | groups-to-runs | 3 | 16 | 2 |
| `hard-runs-to-groups` | runs-to-groups | 3 | 4 | 1 |
| `hard-endpoint-missing-partner` | runs-to-groups | 3 | 4 | 1 |
| `hard-mixed-exchange` | mixed-exchange | 3 | 1 | 1 |
| `hard-longer-mixed-repair` | mixed-exchange | 3 | 1 | 1 |

### Expert

| Fixture | Certified core | Minimum R | Physical | Face |
| --- | --- | --- | --- | --- |
| `expert-interior-extraction` | interior-extraction | 4 | 64 | 1 |
| `expert-longer-interior` | interior-extraction | 4 | 64 | 1 |
| `expert-split-and-join` | split-and-join | 5 | 64 | 1 |
| `expert-longer-split-join` | split-and-join | 5 | 128 | 2 |
| `expert-groups-to-runs` | groups-to-runs | 4 | 8 | 8 |
| `expert-five-group-conversion` | groups-to-runs | 5 | 18 | 18 |
| `expert-duplicate-choice` | groups-to-runs | 4 | 80 | 10 |
| `expert-runs-to-groups` | runs-to-groups | 4 | 64 | 1 |
| `expert-mixed-exchange` | mixed-exchange | 4 | 2 | 2 |
| `expert-combined-repair` | combined-repair | 5 | 64 | 1 |
| `expert-longer-combined-repair` | combined-repair | 5 | 128 | 2 |
| `expert-compact-combined-repair` | combined-repair | 4 | 4 | 1 |


## Hand explanations for the primary constructions

Names below match the exact JSON inventories. Unmarked tiles use copy 1; `copy 2` always means the other physical tile. Group colour order is unrestricted, and every final run is ascending. The JSON solution records account for every tile, including support rows.

### Easy

**Run donation:** from blue 1–6, donate blue 6 to the rack's red/black 6 group. Blue 1–5 remains valid and the blue 3–5 copy-2 support row is preserved. The two rack tiles cannot form a set without a board tile. The both-end variant donates blue 2 and 6 from blue 2–6 into separate groups, leaving blue 3–5; it remains the same core family.

**Group donation:** remove blue 6 from the four-colour 6 group. Red/orange/black 6 remain a valid group, and blue 4–6 uses the two rack neighbours. The variant uses blue 5 and 7 around the donated middle tile instead. A three-colour starting group cannot support the same move.

**Run division:** blue 1–6 and rack blue 3/4 copy 2 become blue 1–4 using the original 3/4, and blue 3–6 using the rack 3/4 with original 5/6. Neither duplicate can be inserted into the intact original run. The seven-tile source variant gives a longer suffix while retaining the same two-run, one-cut route.

### Medium

**Interior extraction:** blue and red 1–7 each lose 4 to the blue/red/black 4 group, leaving four three-tile runs. Rack black/red/orange 9 form their own group; orange 10–12 is the required third starting row and remains intact. The longer blue source creates a four-tile upper fragment, not an extra family.

**Split/join:** blue 4 and 10 enter their rack-supported groups. Blue 1–3 survives; blue 5–7 must join the stranded blue 8–9 to become blue 5–9. The rejected optional-join design shows why a convenient independent repair tile cannot be added. The longer variant can divide its six-tile repair in different ways, but the second-source remainder still requires a shared final run.

**Groups to runs:** groups at 4 and 5 supply blue 3–5, red 4–6, and orange 3–5. The rack provides blue/orange 3 and red 6, rather than three colours at one value that could form an independent rack group. The fourth-colour variant must also make black 4–6. Black 10–12 supplies the minimum third starting row.

**Runs to groups:** break the blue and red 4–6 runs into groups at 4, 5, and 6. The rack supplies orange 4, black 5, and orange 6. These mixed-colour partners cannot make a rack-only run, and both originals are necessary. Adjacent rather than separated same-colour partners give a proved rack-arrangement variant.

**Optional mixed exchange:** the four-colour 4 group donates blue 4 to join rack blue 3 and original blue 5. Blue 6 from the short 5–7 source enters the rack's red/orange 6 group; blue 7 joins rack 8/9. The retained red/orange/black 4 group remains valid. Both sources change and meet in blue 3–5. It is mixed exchange, not a separate linked-donation family.

### Hard

**Interior extraction:** blue 1–9 keeps its 1–3 and 7–9 ends, while its 4–6 block and both short red/orange 4–6 runs become groups. The three copy-2 rack 4s produce a second distinct physical 4 group; black 5 completes the four-colour 5 group. A 6 group consumes the remaining middle tiles. Black 10–12 is preserved. All three sources change and share final groups.

**Split/join:** form groups at 4, 7, and 13. Blue 7 copy 2 repairs the missing 7, allowing blue 5–9 and blue 10–12; the latter shares the original long blue source's 10 with the short source's 11/12. Retain blue 1–3, red 1–3 and 5–7, and orange 10–12. The changed sources form a three-row path. Some solutions have only two conservatively non-endpoint rows, which is enough for Hard. Replacing rack orange 7 by red 7 copy 2 admits a two-endpoint-core shortcut and is explicitly rejected.

**Groups to runs:** three consecutive groups at 4–6 become blue and red 3–7 plus orange 4–6. The four-colour variant additionally makes black 4–6 and uses a preserved 10 group as the required fourth starting row, giving a genuinely group-only board. A duplicate red 4–6 row permits red repair/allocation choices but does not add a family.

**Runs to groups:** three short 4–6 runs break into two 4 groups, a four-colour 5 group, and a 6 group. The duplicate rack 4 group could initially stand alone, but black 5 forces the middle reconstruction. Moving the black demand from 5 to 6 is also audited. Black 10–12 stays intact.

**Mixed exchange:** the two groups at 4/5 provide blue 3–6, red 3–5, and orange 3–5. Blue 7 is needed for the rack's red/orange 7 group; blue 8 joins rack 9/10. The original blue 6–8 must therefore break, and its 6 joins both changed groups. Blue 9 initially extends that source legally, but no completion can preserve the entire extended row because 7 must be exported. A longer source/right repair is a proved variant.

### Expert

**Interior extraction:** start with blue 1–9 and short red/orange/black 4–6 runs. The six rack duplicates are blue/red 4, blue/orange 5, and blue/black 6, all copy 2. The complete audit forces two groups at each middle value; blue 1–3 and 7–9 survive. Every short source converts, and all four sources connect through the groups. Extending only the blue tail to 10 is safe; extending a second colour into a long source is not.

**Split/join:** add blue 10–12 to the preceding construction and rack red/orange 12. The only blue 12 must enter that group, so its source's blue 10/11 must join the long source's upper fragment to make blue 7–11. Five rows necessarily change. The longer variant repairs blue 7–12 and permits a different valid division, while every minimum solution still contains a shared short-remainder repair.

**Groups to runs:** retain the reviewed four-group chain, creating blue 3–8, red 2–9 and orange 4–7. Alternative divisions still connect the four changed groups. Five consecutive starting groups instead force five changes; the duplicate red-run overlay adds meaningful face/physical allocations, not another core family. This family is capped together in output sampling.

**Runs to groups:** start with four colours of short 4–6 runs and the six rack duplicates used above. The same constrained middle inventory now requires complete destruction of all four short source runs, rather than retaining a long run's two ends. There is one face-level final partition and 64 physical partitions. A different duplicate pairing can admit a disconnected alternative, so the proven rack pattern cannot be replaced arbitrarily.

**Mixed exchange:** groups at 3, 4, and 5 must repair blue 6 after exporting blue 7 from blue 6–8 to its red/orange group. Finish blue 8–10 and the colour runs through the group leftovers. Rack blue/red/orange 2 may either extend those runs or remain as their own group; both completions still require all four sources. Initially legal blue 9 extension cannot remain intact in a completion.

**Combined repair:** the long blue source and three short sources undergo the forced interior reconstruction above. Add a four-colour 10 group and rack blue 11. The 10 group must retain red/orange/black 10 and donate blue 10. Blue 10/11 alone are too short, so they must share a run with tiles from the same original blue row whose middle went to groups and whose two long end cores survive. Five rows change in one component. The 11-group/12-rack, longer-tail variant has more face completions but still requires the same joint mechanism. A compact version uses the Hard interior inventory's two short sources, replaces its support row with the donor group, and adds rack blue 11: exactly four rows change, with five rack tiles. It is rejected when proposed for Hard and independently accepted as Expert. This differs from ordinary mixed exchange, which need not retain either two long cores or a three-colour group.

## Fixture-driven specification amendment

The initial Expert target included pure boundary repair: all source tiles stay in runs while overlapping/adjacent runs redistribute their boundaries. A reproducible rejected four-run example has a zero-change route even though a complicated redistribution witness exists. Bounded exploratory screening also tested 30,000 deterministic proposals (`Random(613)`), of which 80 survived standalone-preservation/solvability prefilters: 78 had an explicit counterexample and two were inconclusive at the 5,000-node limit. A separate three-run-plus-group-donation investigation (`Random(614)`) screened 30,000 proposals and 105 filtered cases: 82 had counterexamples and 23 were inconclusive. Neither screen certified a qualifying replacement.

Those screens are design observations, not exhaustive proofs of impossibility, full fixture audits, or runtime benchmarks. The [bounded investigation script](checks/investigate_v6_boundaries.py) and [saved proposals/outcomes](revision-6-boundary-investigation.json) make the conditions and inconclusive outcomes explicit. Reproduce with `python3 plans/checks/investigate_v6_boundaries.py --output plans/revision-6-boundary-investigation.json`. The accepted fixtures above are proved without those exploratory limits. Pure boundary repair remains eligible for future investigation, but cannot fill a release quota without a qualifying independent proof.

As expressly permitted by the specification's replacement rule, Expert's sixth primary is now **combined repair**, with the exact joint predicate and priority documented in the specification and independently certified in both supplied variants. No tier threshold, size bound, or six-family target was lowered. The ordinary Expert mixed-exchange fixture fails the combined predicate; the two labels are not aliases for the same broad bidirectional exchange.

## Rejected-design ledger

| Rejected design | Reason | Minimum R | Physical | Structurally insufficient partitions |
| --- | --- | --- | --- | --- |
| `rejected-optional-join` | structural-rejection | 2 | 2 | 1 |
| `rejected-hard-duplicate-core` | structural-rejection | 3 | 16 | 2 |
| `rejected-expert-two-long-sources` | structural-rejection | 4 | 128 | 3 |
| `rejected-expert-duplicate-path` | structural-rejection | 4 | 64 | 1 |
| `rejected-expert-boundary-only` | wrong-tier | 0 | 64 | 59 |
| `rejected-easy-interior` | structural-rejection | 1 | 1 | 0 |
| `rejected-three-colour-donation` | unsolvable | — | 0 | 0 |
| `rejected-intact-row-extension` | wrong-tier | 0 | 6 | 6 |
| `rejected-hard-combined-promotion` | wrong-tier | 4 | 4 | 0 |

Every solvable rejected fixture has a conserved stored witness, and the report provides a simpler/minimum or structurally insufficient completion. The unsolvable three-colour donation has no witness. Rejection can result from a valid but wrong minimum tier, even when some other solution looks complicated.

## Catalogue and overlay disposition ledger

| Catalogue entry / overlay | Disposition and evidence |
| --- | --- |
| Single endpoint; both endpoints | Accepted Easy fixtures. Two ends remain one family; higher-tier endpoint exports occur only within proved connected repairs. |
| Four-colour-group donation | Accepted Easy, optional Medium mixed exchange, and mandatory Expert combined repair. Generic linked donation is counted under the higher-priority certified core, not as a quota shortcut. A separate Hard donation-only core is deferred: Hard already has its five primary mechanisms, and an additional candidate would need a new exact-three-row connected proof rather than promoting the Medium example. |
| Simple run division | Accepted six-/seven-tile Easy sources. One-row interior export remains intentionally excluded from Easy. |
| Interior extraction | Accepted Medium, Hard and Expert; unequal lengths and longer fragments are proved. Second-colour long-source expansion is rejected for Expert. |
| Forced split/join | Accepted all three higher tiers; optional joins and unsafe duplicate core repairs are rejected. |
| Pure boundary redistribution | Expert examples rejected or inconclusive in bounded investigation; deferred from initial release across tiers until a qualifying fixture is independently proved. Whole preserved-row joins confer no credit. |
| Groups to runs; runs to groups | Accepted all higher tiers in both directions. Group counts, colour counts, and partner placement vary without being counted as new families. |
| Mixed exchange; combined repair | Mixed accepted Medium–Expert. Precisely defined joint combined repair accepted Expert. The compact proposed Hard combined design is rejected because its exact `R` is 4; the same inventory is independently accepted as Expert. A qualifying Hard combined variant remains deferred rather than silently changing the tier. |
| Linear connections | Hard split/join supplies a genuine three-source path in the changed-row graph. |
| Branching / cycles | Group-conversion and mixed fixtures have final sets with several source contributors and cyclic source/final-set incidence. Recorded contribution graphs show this; no forced editing order is claimed. They are overlays, not extra families. |
| Asymmetric source/repair lengths | Accepted Medium extraction, longer split/join, and longer Hard mixed repair variants. |
| Values at 1/13 | Accepted long-run and tail-donation fixtures, including Expert longer split/join. Boundary profiles remain separate from translation-normalised keys. |
| Run-only, mixed, group-only boards | Supported across the required tiers. Hard's four-colour conversion and Expert group chains supply group-only starts; Expert has three run-only cores, one group core, and two mixed cores. Filler composition and changed-component composition remain distinguishable. |
| Duplicate allocation and overlap | Accepted Easy divisions, Hard/Expert duplicate-choice fixtures, short-run conversion and split/join repairs. Hard duplicate-choice has two face completions; Expert duplicate-choice has ten. Neither is merely a copy-label permutation. |
| Scarce-tile competing uses | Hard/Expert mixed fixtures require blue 6 for a repaired run and blue 7 for a group; rack group/endpoint choices can conflict. The optional Medium mixed fixture uses a donated 4 to repair a stranded 5. |
| Initially legal incompatible placements | Hard and Expert mixed fixtures have blue 9 insertion that cannot preserve the resulting extended original row. This means later rebuilding is necessary, not that placing it temporarily makes the live puzzle unsolvable. |
| Unique and multiple face completions | Both audited: Medium longer split/join, Hard split/join/duplicate-choice, Expert groups/mixed/longer combined variants have multiple face completions; reverse conversions include unique face completions. |
| Rack/row size variation | Accepted rack sizes span Easy 2–4, Medium 3–5, Hard 4–7, Expert 5–8; Expert `R` varies between 4 and 5. Starting-row ranges are Easy 2, Medium 3, Hard 4–5, Expert 4–5. More sizes remain generation-design work, not padded difficulty. |
| Extra support rows / direct extensions / rack-only sets | Documented in each fixture's purpose. Minimum-row support and meaningful duplicate alternatives are allowed; unrelated padding gets no structural/family credit. |
| Pure same-value exchanges; jokers/new rules/UI | No independently distinct repair mechanism demonstrated for same-value-only exchanges; excluded as a core. Jokers and interface/rule additions remain outside scope. |

## Parameter envelope for implementation

The proved envelope is the **finite set of supplied inventories**, including each named variant. There is no claimed continuous safe range between two examples. Reflection, global translation within 1–13, colour bijections and face-wide copy-label bijections preserve the inventory's abstract problem; every runtime candidate will nevertheless be proved anew.

| Core | Audited noncosmetic parameter changes / construction constraints |
| --- | --- |
| Run donation | One end versus both ends, source length 6 versus 5, two versus four rack tiles. Keep exactly the specified one-tile end exports and a valid core. |
| Group donation | Donated tile at endpoint versus middle of a three-tile new run. Initial group must contain four colours and retain exactly three original tiles. |
| Run division | Source length 6 versus 7, two-face duplicate overlap, both source contributions at least two tiles. No interior export. |
| Interior extraction | Medium asymmetric 7/8 sources; Hard one length-9 source plus short runs; Expert one length-9/10 source with the proved six duplicate partners. Do not lengthen another colour without a fresh successful proof. |
| Split/join | Medium first source length 7/8; Hard's specific extraction/duplicate repair roles; Expert upper fragment length 3/4 with its matching short tail and forced endpoint group. Independent rack repairs and unsafe copy roles are rejected. |
| Groups to runs | Medium two groups of three/four colours; Hard three groups of three/four colours; Expert four/five groups of three colours. Duplicate red-row overlays have separate proved inventories. |
| Runs to groups | Medium missing partner pattern changes; Hard demand at 5 versus 6; Expert's star-like duplicate pattern. Arbitrary duplicate pairings are not permitted as preproved variants. |
| Mixed exchange | Medium retained group donation; Hard short source length 3/4 and corresponding right repair; Expert adds a third converted group. Rack placements are accepted only with full alternative-solution proof. |
| Combined repair | Expert blue source length 9/10, matching four-colour donor group 10/11 and rack neighbour 11/12; compact version uses two short sources rather than three, lowering exact `R` to 4. Both long retained cores, interior export, and donation to the same source are mandatory. |

The JSON `parameterInvestigation` fields also nominate future ranges to explore. Those ranges are hypotheses to sample and prove, not blanket eligibility. New gaps, overlaps, missing positions, groups, copies or rack neighbours can invalidate both tier and family proofs.

## Output-quota feasibility and next step

The fixture set supports the unchanged composition/family targets. For example, a design allocation of Expert 20% interior, 10% split/join, 15% groups-to-runs, 10% runs-to-groups, 22.5% mixed exchange and 22.5% combined repair gives 40% run-only, 15% group-only, and 45% mixed starts, with no family above its cap. Hard can allocate 18% interior, 18% split/join, 19% runs-to-groups, 20% group-only conversion and 25% mixed exchange, leaving margin below its 60% composition cap. These are feasibility illustrations, not measured generator frequencies; duplicate variants and support composition must be accounted for separately when sampling actual output.

Next: implement explicit deterministic revision-6 generation, revision-specific rating/family certification, worker/replay support and offline assets while retaining revision 5 as the default. Define fixed traversal and shared proof/retry budgets from production measurements, not this Python oracle's node counts. Reprove every parameterised candidate, preserve old replay/save/cancellation behaviour, and later run the predeclared development/holdout blocks plus user review before changing the default.


**Implementation follow-up — 12 October 2026:** The explicit revision-6 runtime step is complete using this exact finite inventory envelope, with new proofs for every transformed candidate. See [the fixed generation contract](rummipuz-generator.md#revision-6--explicit-variety-generation-12-october-2026). Revision 5 remains default. Accepted-output quota/performance verification is next; the fixture evidence above remains unchanged.
