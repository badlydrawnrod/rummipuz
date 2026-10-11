# Sample review and generation tuning

This records agent hand analysis and verification separately from player feedback. The user approved the revision-5 samples on 11 October 2026 and requested that the review step be marked complete; no tuning was requested. The earlier revision-4 review follows unchanged. Neither hand analysis nor structural proofs establish observed human difficulty.

## Revision-5 user review — prepared 11 October 2026

**Status:** Complete. On 11 October 2026, the user reported “It worked well” and requested that the sample-review step be marked complete. The samples are approved without further tuning. Revision 5 is now the default following the separate verified default-switch step. No agent-side browser access was used and no runtime/interface changes were made.

The [saved sample set](revision-5-sample-review.json) contains the full identities, exact generated results, replay codes, and separately hand-derived physical-ID solutions. Selection uses `review-v5-0` and `review-v5-1` at Easy, Medium, and Hard; Expert uses `review-v5-0` and `review-v5-2` to include both available families. This is a deliberately small family-coverage set, not a random difficulty survey. Easy's second sample reverses the endpoint direction; it does not introduce another structural family.

### Play first, then open explanations

Use the game's existing replay control to paste each full code and load its puzzle. These are explicit revision-5 replays; Start and Next now generate revision 5; use the listed replay codes to reproduce these exact review samples. An unfinished session may require the existing replacement confirmation. Review replays use ordinary saved-session and completion-credit behaviour: completing a previously uncompleted code can earn credit at its recorded tier. Copy your current replay code first if you want to return to that puzzle; it does not preserve an unfinished layout or undo history.

Try A–F in order, then H before G to compare Expert without and with duplicates. Keep the explanations closed until you have tried the puzzle. Approximate solving time, resets/undo, or getting stuck are useful observations, not pass/fail limits.

| Label | Tier | Full replay code | Rack / starting rows |
| --- | --- | --- | --- |
| A | Easy | `rummipuz:1:5:1:review-v5-0` | 2 / 2 |
| B | Easy | `rummipuz:1:5:1:review-v5-1` | 2 / 2 |
| C | Medium | `rummipuz:1:5:2:review-v5-0` | 4 / 3 |
| D | Medium | `rummipuz:1:5:2:review-v5-1` | 4 / 3 |
| E | Hard | `rummipuz:1:5:3:review-v5-0` | 4 / 4 |
| F | Hard | `rummipuz:1:5:3:review-v5-1` | 7 / 4 |
| G | Expert | `rummipuz:1:5:4:review-v5-0` | 6 / 5 |
| H | Expert | `rummipuz:1:5:4:review-v5-2` | 6 / 4 |

### Hand-derived explanations — spoilers

Rows below are numbered from the initial board, starting at one. Ranges denote ascending runs; listed colours at one value denote a group. Each final layout uses all puzzle tiles and leaves an empty rack. Preserve physical copies from their named source rows; the JSON resolves every ID, including duplicate faces whose copy labels vary independently by value.

<details>
<summary>A — Easy, high endpoint</summary>

Start: red 5–10; red 7–9. Rack: black 10, blue 10.

Donate red 10 from row 1 to a red/black/blue 10 group. Final rows: red 5–9 from row 1; unchanged red 7–9 from row 2; the 10 group. The rack tiles have no same-colour neighbours and cannot form a two-tile group. Only one red 10 exists, forcing its extraction. One original row changes by endpoint removal. Matching red 7–9 copies allow additional arrangements, but this route keeps the smaller original run intact.

</details>

<details>
<summary>B — Easy, low endpoint</summary>

Start: orange 2–7; orange 3–5. Rack: black 2, red 2.

Donate orange 2 from row 1. Final rows: orange 3–7 from row 1; unchanged orange 3–5 from row 2; orange/black/red 2. Black and red 2 force the sole orange 2 into their group. This is the same introductory idea as A at the other end. Review whether the duplicate faces distract from an otherwise approachable move.

</details>

<details>
<summary>C — Medium, split and forced join</summary>

Start: orange 7–13; blue 1–3; orange 4–6. Rack: black/red 10 and black/red 4.

Both rack pairs require their orange partners. Removing orange 10 splits row 1 into orange 7–9 and 11–13. Removing orange 4 from row 3 strands orange 5–6: join those two tiles to orange 7–9. Final rows: orange 5–9; orange 11–13; orange/black/red 4; orange/black/red 10; unchanged blue 1–3. Rows 1 and 3 are connected through the joined run; both require more than endpoint extraction. There is exactly one complete physical partition. The need to repair the short remainder supplies the linked decision.

</details>

<details>
<summary>D — Medium, two interior splits</summary>

Start: blue 11–13; orange 2–8; black 2–8. Rack: blue 10, red 5, black 10, red 10.

Red 5 cannot enter a red run and requires orange/black 5. Extract both middle tiles, leaving orange 2–4 and 6–8 and black 2–4 and 6–8. Make the blue/black/red 10 group from the other rack tiles; preserve blue 11–13. These seven final rows are the unique complete partition. Extending blue 11–13 with blue 10 is tempting but strands black/red 10. Two changed rows meet in the 5 group and both split into surviving runs. Compare this obvious shared extraction with C's repair dependency rather than assuming they feel equally difficult.

</details>

<details>
<summary>E — Hard, groups become runs</summary>

Start: orange/blue/black 9; orange/blue/black 10; red 2–4; blue/black/orange 8. Rack: orange/black 7 and orange/black 11.

The rack endpoints have no complete groups available. Break the 8, 9, and 10 groups into their colours. Final rows: orange 7–11; black 7–11; blue 8–10; unchanged red 2–4. Each coloured run shares tiles from all three original groups. All three groups change and form one connected component. This is the only complete partition. Account for the blue leftovers as well as the two colours with rack endpoints.

</details>

<details>
<summary>F — Hard, group/run exchange with two repairs</summary>

Start: orange 6–8; black/red/orange 4; blue 10–12; black/red/orange 5. Rack: black 7, orange 9, red 3, red 7, orange 10, black 3, orange 3.

Rack black/red 7 require orange 7 from row 1. Orange 8 joins rack orange 9–10. Orange 6 must join orange 3–5, drawing orange 4 and 5 from both original groups. Their black/red leftovers join the corresponding rack 3s. Final rows: orange 3–6; orange 8–10; black 3–5; red 3–5; orange/black/red 7; unchanged blue 10–12.

The initially legal black/red/orange 3 group cannot remain in a complete solution because it strands orange 6. Rows 1, 2, and 4 connect through orange 3–6; all three are non-endpoint rearrangements. The unique partition combines an interior extraction, group conversion, and repairs on both sides. Review whether this takes more thought than E, or whether the larger rack mainly adds visual work.

</details>

<details>
<summary>G — Expert, duplicate variant</summary>

Start: red 6–8; black/red/blue 6; red/black/blue 8; blue/red/black 7; red/black/blue 9. Rack: red 10, red 5, black 5, red 11, red 4, black 10.

Leave row 1 intact. Break the four groups into black 5–10, red 4–11, and blue 6–9. Together with preserved red 6–8 these are the four final rows. The red tiles in the long run come from the groups, using the other physical copies from those in row 1. The full inventory permits 80 physical partitions, including different red-copy assignments and run divisions. Every solution still connects at least the four changed groups; some also change the duplicate run. The minimum is four.

The duplicate row offers alternatives, but the central conversion remains similar to H. Physical-copy alternatives alone may not add meaningful human difficulty: report whether this feels more demanding, equally easy, or merely busier.

</details>

<details>
<summary>H — Expert, four-group chain</summary>

Start: blue/orange/black 5; black/blue/orange 3; orange/blue/black 6; black/orange/blue 4. Rack: blue 1, black 7, blue 2, blue 8, black 2, blue 7.

Break the four groups by colour. Final rows: black 2–7; blue 1–8; orange 3–6. Rack endpoints have no available group completion and must enter runs. Runs may be divided differently: eight complete partitions exist, all changing and connecting the four original groups with four non-endpoint rows.

This clears the Expert structural gate, but the conversion is similar to E with one more source group. Once that idea is learned, H may feel little harder. This is a specific human-calibration concern to resolve before approval, rather than a reason to call the structural proof incorrect.

</details>

### Verification and provisional judgement

The native [replay check](checks/review_v5_samples.mjs) passed 42 assertions: exact saved output and repeated deterministic replay, conserved winning hand solutions, minimum changed-row counts, eight samples, and default revision 4. The independent [Python review audit](checks/review_v5_samples.py) verified both the hand solutions and production witnesses, enumerating all 108 physical partitions with zero easier structural counterexamples. Partition counts A–H are 8, 8, 1, 1, 1, 1, 80, and 8. Hand-solution component sizes/non-endpoint counts are respectively (1,0), (1,0), (2,2), (2,2), (3,3), (3,3), (4,4), and (4,4). These verify the documented gates, including all alternative copy assignments; they do not measure human effort.

Reproduce from the repository root, with Node available for the first command:

```bash
node plans/checks/review_v5_samples.mjs
PYTHONDONTWRITEBYTECODE=1 python3 plans/checks/review_v5_samples.py
```

The agent derived the final layouts from the inspected starts using the documented construction ideas, then validated the explicit physical solutions. No stored solver witness was used to choose those layouts. Native checks ran through the available Node runtime; no browser, touch session, or offline launch was attempted. Runtime assets and offline release `v2` are unchanged.

Provisional assessment: Easy retains a clear single-row route. Medium introduces splits and a forced join; F adds a more involved repair chain than E. Expert's universal four-row gate is sound, but its group-conversion core may become easy once E is learned. All seven families are covered; unlimited fresh seeds still draw from that small family set. No generator or threshold tuning is justified solely by this hand analysis. The user subsequently approved the samples overall without requesting stronger alternatives or other tuning. The limited family set remains a documented design limitation; detailed per-sample human-difficulty measurements were not supplied.

### Feedback and approval record — approved 11 October 2026

For A–H, record whether it was straightforward, appropriately challenging, or frustrating; roughly how long it took; the idea or choice that required thought; and whether it felt repetitive after earlier samples. In particular: are A/B approachable, do C/D differ meaningfully, does F add thought beyond E, and do G/H deserve Expert after learning the group-conversion idea? Report any easy alternative you found using the replay code and your final layout.

**User feedback:** “It worked well. Mark that step as complete.” The user approved the sample review overall; no individual puzzle ratings, solving times, or device details were supplied. **Tuning:** None requested or made, so the verified criteria, constructions, and proofs are unchanged. **Sample approval:** Accepted; Phase 6’s fifth step is complete. **Release/default decision:** The separate sixth step is now complete: revision 5 is the default for fresh puzzles, with 869 native checks and 39 offline-bundle worker checks passing. Offline release is `v3`; old replay and saved-session behaviour is preserved. Outstanding Phase 5 whole-session verification remains separate.

## Earlier revision-4 review

Eight revision-4 puzzles were inspected, with solutions derived through explicit endpoint transfers and rack placements rather than copied from the solver's witness. The canonical starting puzzles are in `app/checks/fixtures/generated-v4.json`; independently derived physical-ID solutions are in `app/checks/fixtures/reviewed-v4.json`.

## Review findings and sampling decision

The core sequence works: Easy extracts one endpoint; Medium combines endpoints from two rows; Hard coordinates a two-row group with another endpoint transfer; Expert combines two pairs of changed rows. Exact minimum-R proofs confirm these requirements, including when alternate physical-copy arrangements exist. Colour roles change between seeds, and every retained base run leaves at least three tiles after its endpoint is removed.

Revision-3 extra rows can obscure the Easy teaching move: `review-b` had five rows although only one needed to change. Larger Hard boards introduce copy choices and competing extensions, useful eventually but unnecessary for the initial tier distinction. Expert can reach nine rows, greatly increasing proof time without increasing its required four-row core. The tier policy's broad bounds remain appropriate; tighten the default generation sampling rather than change the definitions.

| Tier | Policy rack / rows | Revision-4 sampled rack / rows | Instructional target |
| --- | --- | --- | --- |
| Easy | 2–5 / 2–5 | 2–3 / 2–3 | One endpoint transfer, optionally one obvious extension. |
| Medium | 3–6 / 3–6 | 4–5 / 3–4 | Two endpoints must coordinate; another rack group is independent. |
| Hard | 4–8 / 4–7 | 4–6 / 4–5 | Two low endpoints plus a high endpoint; choose useful extensions. |
| Expert | 4–10 / 4–9 | 5–7 / 4–5 | Two coordinated pairs, with a separate rack run and occasional copy choices. |

Use generator revision 4 for this selection change. Preserve revision 3 exactly for replay. Each revision-4 attempt has 20,000 proof nodes, with at most 64 attempts; limits reject a candidate rather than awarding a guessed tier. Motifs, canonical IDs, and exact tier proofs retain their existing rules. Future variety improvements should introduce other rearrangement patterns after actual player feedback; the current family is intentionally narrow, and minimum R remains a structural rating rather than a measured human score.

## Hand-reviewed solutions

All codes below have prefix `rummipuz:1:4:` followed by `<tier>:<seed>`. Row numbers are one-based in these descriptions. Canonical fixtures resolve physical copies unambiguously.

| Tier / seed | Rack / rows | Initially valid rack placements | Hand reasoning |
| --- | --- | --- | --- |
| Easy / review-a | 2 / 2 | 0 | Take orange 6 from row 1 (orange 3–6); group it with rack black/red 6. Orange 3–5 and blue 8–11 remain valid. Exactly one row changes. |
| Easy / review-b | 3 / 2 | 1 | Take orange 4 from orange 1–4 for a black/red/orange group. Prepend rack blue 9 to blue 10–13. Extension preserves that row; exactly one row changes. |
| Medium / review-a | 5 / 3 | 1 | Take black/orange 5 from rows 2/3 for a group with rack red 5. Extend blue 10–12 with rack blue 13; make the black/red/orange 13 group from the other rack tiles. Two low rows change. |
| Medium / review-b | 4 / 3 | 0 | Take red/black 4 from rows 2/3 to join rack orange 4. The three rack 13s form another group; blue 10–12 is untouched. Two rows must supply endpoints to the first group. |
| Hard / review-a | 4 / 4 | 1 | Take black/red 6 from rows 1/4 to join rack orange 6. Take orange 13 from row 3 to join rack black/red 13. Prepend rack blue 3 to row 2. Three rows change; their remaining runs are black/red 1–5 and orange 8–12. |
| Hard / review-b | 5 / 5 | 2 | Take black/orange 6 from rows 2/3 to join rack blue 6. Take blue 13 from row 5 for the rack black/orange 13 group. Prepend rack black 10 to row 1; append rack red 4 to row 4. The extensions preserve their original rows, so exactly three rows change. |
| Expert / review-a | 6 / 5 | 1 | Take red/black 5 from rows 4/5 to join rack blue 5. Take blue/orange 10 from rows 2/3 to join rack red 10. Rack black 7–9 forms a run; rack red 11 extends row 1. Four rows change. |
| Expert / review-b | 5 / 5 | 0 | Take blue/red 6 from rows 3/5 to join rack black 6. Take black/orange 11 from rows 2/4 to join rack blue 11. Rack red 8–10 forms a run. Leave the other physical orange 11–13 row intact. Four rows change, and the orange-copy choice is meaningful. |

Every hand solution empties the rack and conserves all original IDs. Its changed-row count equals the proven minimum; it need not match the solver's stored arrangement or chosen changed-row indices. Several samples demonstrate that a legal extension preserves a row, whereas removing its endpoint does not.

## Generation timing

A native-module runtime probe used seeds `review-probe-0` through `review-probe-15` independently at every tier: 64 revision-4 requests total, all successful. Timings include candidate construction, failed attempts, and exact rating proofs. There is no wall-time cutoff influencing replay.

| Tier | Requests | Total construction attempts | Median ms | Maximum ms |
| --- | --- | --- | --- | --- |
| Easy | 16 | 18 | 2.3 | 7.0 |
| Medium | 16 | 22 | 3.3 | 14.8 |
| Hard | 16 | 52 | 19.5 | 57.6 |
| Expert | 16 | 28 | 11.1 | 30.6 |

Multiple rack/row sizes occurred in each tier. These reviewed envelopes avoid the multi-second delays observed in the earlier revision-3 probe; this is workload tuning, not proof that every seed/device is fast. No timing threshold is used in automated checks because host load varies. Worker execution remains the next plan step so slower devices and unusually expensive seeds cannot interrupt play. Actual desktop/tablet user testing remains necessary once controls exist.

The full native-module suite passed 264 checks, including 33 new replay/hand-review checks, unchanged revision-3 golden replay, and the independent minimum-R oracle. The browser `/checks/` runner includes the new review fixtures.
