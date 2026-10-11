# Sample review and generation tuning

This is an agent's hand analysis of puzzle arrangements and instructional structure, followed by rule/conservation checks. It is not an observed learner playtest or a tablet performance test. Eight revision-4 puzzles were inspected, with solutions derived through explicit endpoint transfers and rack placements rather than copied from the solver's witness. The canonical starting puzzles are in `app/checks/fixtures/generated-v4.json`; independently derived physical-ID solutions are in `app/checks/fixtures/reviewed-v4.json`.

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
