# Revision-6 family and sequence review

**Status:** Complete. User approval recorded on 2026-10-12: “We've tested. All good.” No tuning was requested. Approved revision 6 is now the default after the separate verified switch. No runtime or offline-package change was made by this review step, and no commit or agent-side browser use. The preceding native/laptop/tablet variety and preparation checks passed.

This guide has **19 tier/family samples**, **five additional variant comparisons**, and **four fixed consecutive 16-puzzle sequences**. The [exact review data](revision-6-sample-review.json) contains 71 distinct full replay identities, saved generated results, independently derived physical solutions and their provenance. Shared samples are stored once. This is a deliberate family/overlay review, not another frequency survey.

Use **Replay puzzle** to paste a full code below. Start and Next continue to generate revision 5; they will not select these review samples. Use the tuned offline release `v5`, with no waiting update. Ordinary replay uses the existing session replacement confirmation, local saving and completion credit. Copy your current code before replacing it if you want to return to its initial puzzle; a code does not preserve an unfinished layout or undo history.

Play the main samples **E1–E3, M1–M5, H1–H5 and X1–X6** first, keeping answers closed. E4/E5, H6 and X7/X8 compare important variants. For sequence review, start with the first four consecutive codes in each tier; the complete fixed 16-code sequences are provided for a longer comparison. Preserve their order and include repeats. There is no solving-time limit. Undo, resets, getting stuck, and apparently repetitive puzzles are useful observations.

Feedback should address whether the three Easy mechanisms stay approachable; whether higher-tier families require different ideas; whether duplicate/competing-placement examples are meaningful; and whether consecutive same-tier puzzles feel repetitive. Formal gates and preparation performance do not answer those questions. The user has approved this review. The separate default-switch step is now complete.

## Main samples and variant comparisons

Family labels and explanations are hidden below so the code table does not reveal the solution mechanism.

| Label | Tier | Full replay code | Rack / starting rows |
| --- | --- | --- | --- |
| E1 | Easy | `rummipuz:1:6:1:variety-v6-dev-20` | 2 / 2 |
| E2 | Easy | `rummipuz:1:6:1:variety-v6-dev-14` | 2 / 2 |
| E3 | Easy | `rummipuz:1:6:1:variety-v6-dev-0` | 2 / 2 |
| M1 | Medium | `rummipuz:1:6:2:variety-v6-dev-16` | 4 / 3 |
| M2 | Medium | `rummipuz:1:6:2:variety-v6-dev-5` | 4 / 3 |
| M3 | Medium | `rummipuz:1:6:2:variety-v6-dev-6` | 3 / 3 |
| M4 | Medium | `rummipuz:1:6:2:variety-v6-dev-14` | 3 / 3 |
| M5 | Medium | `rummipuz:1:6:2:variety-v6-dev-4` | 5 / 3 |
| H1 | Hard | `rummipuz:1:6:3:variety-v6-dev-1` | 4 / 4 |
| H2 | Hard | `rummipuz:1:6:3:variety-v6-dev-2` | 6 / 4 |
| H3 | Hard | `rummipuz:1:6:3:variety-v6-dev-4` | 4 / 4 |
| H4 | Hard | `rummipuz:1:6:3:variety-v6-dev-13` | 4 / 4 |
| H5 | Hard | `rummipuz:1:6:3:variety-v6-dev-5` | 7 / 4 |
| X1 | Expert | `rummipuz:1:6:4:variety-v6-dev-6` | 6 / 4 |
| X2 | Expert | `rummipuz:1:6:4:variety-v6-dev-36` | 8 / 5 |
| X3 | Expert | `rummipuz:1:6:4:variety-v6-dev-3` | 6 / 5 |
| X4 | Expert | `rummipuz:1:6:4:variety-v6-dev-20` | 6 / 4 |
| X5 | Expert | `rummipuz:1:6:4:variety-v6-dev-0` | 7 / 4 |
| X6 | Expert | `rummipuz:1:6:4:variety-v6-dev-45` | 5 / 4 |
| E4 | Easy | `rummipuz:1:6:1:variety-v6-dev-4` | 4 / 2 |
| E5 | Easy | `rummipuz:1:6:1:variety-v6-dev-1` | 2 / 2 |
| H6 | Hard | `rummipuz:1:6:3:variety-v6-dev-71` | 4 / 5 |
| X7 | Expert | `rummipuz:1:6:4:variety-v6-dev-24` | 6 / 5 |
| X8 | Expert | `rummipuz:1:6:4:variety-v6-dev-10` | 7 / 5 |

<details>
<summary>Coverage checklist (reveals family names)</summary>

| Labels | What to compare |
| --- | --- |
| E1 / E4 | One-end versus both-end run donation; whether the latter remains approachable. |
| E2 / E5 | Four-colour group donation to a new run’s end versus middle. |
| E3 | Simple run division with overlapping values and distinct copies. |
| M1–M5 | Interior extraction, split/join, groups→runs, runs→groups, optional mixed exchange. M2 has multiple face completions. |
| H1–H5 | The same four higher-tier mechanisms plus mixed exchange, all with connected three-row work. H3 begins entirely with groups. |
| H6 | Duplicate-choice groups→runs, compared with H3. |
| X1–X6 | Interior extraction, split/join, groups→runs, runs→groups, mixed exchange, necessary combined repair. X3 changes five original groups; X6 is a compact four-row repair. |
| X7 / X8 | Duplicate-choice group conversion and a longer combined repair with multiple completions. Compare with X3 / X6. |

No variant adds another family. Starting runs, groups and mixed boards, unique/multiple completions, duplicates and competing rack placements are represented.
</details>

## Fixed same-tier sequences

These are the **first 16 development seeds (0–15)** at each tier, selected before inspecting whether they repeat. None is replaced for convenience or family coverage. The full verification evidence contains the other 15 predeclared sequences per block/tier. Reviewing these four sequences complements the deliberately selected individual examples.

<details>
<summary>Easy — 16 consecutive replay codes</summary>

| Order | Full replay code | Answer label |
| --- | --- | --- |
| 1 | `rummipuz:1:6:1:variety-v6-dev-0` | E3 |
| 2 | `rummipuz:1:6:1:variety-v6-dev-1` | E5 |
| 3 | `rummipuz:1:6:1:variety-v6-dev-2` | S1-03 |
| 4 | `rummipuz:1:6:1:variety-v6-dev-3` | S1-04 |
| 5 | `rummipuz:1:6:1:variety-v6-dev-4` | E4 |
| 6 | `rummipuz:1:6:1:variety-v6-dev-5` | S1-06 |
| 7 | `rummipuz:1:6:1:variety-v6-dev-6` | S1-07 |
| 8 | `rummipuz:1:6:1:variety-v6-dev-7` | S1-08 |
| 9 | `rummipuz:1:6:1:variety-v6-dev-8` | S1-09 |
| 10 | `rummipuz:1:6:1:variety-v6-dev-9` | S1-10 |
| 11 | `rummipuz:1:6:1:variety-v6-dev-10` | S1-11 |
| 12 | `rummipuz:1:6:1:variety-v6-dev-11` | S1-12 |
| 13 | `rummipuz:1:6:1:variety-v6-dev-12` | S1-13 |
| 14 | `rummipuz:1:6:1:variety-v6-dev-13` | S1-14 |
| 15 | `rummipuz:1:6:1:variety-v6-dev-14` | E2 |
| 16 | `rummipuz:1:6:1:variety-v6-dev-15` | S1-16 |

</details>

<details>
<summary>Medium — 16 consecutive replay codes</summary>

| Order | Full replay code | Answer label |
| --- | --- | --- |
| 1 | `rummipuz:1:6:2:variety-v6-dev-0` | S2-01 |
| 2 | `rummipuz:1:6:2:variety-v6-dev-1` | S2-02 |
| 3 | `rummipuz:1:6:2:variety-v6-dev-2` | S2-03 |
| 4 | `rummipuz:1:6:2:variety-v6-dev-3` | S2-04 |
| 5 | `rummipuz:1:6:2:variety-v6-dev-4` | M5 |
| 6 | `rummipuz:1:6:2:variety-v6-dev-5` | M2 |
| 7 | `rummipuz:1:6:2:variety-v6-dev-6` | M3 |
| 8 | `rummipuz:1:6:2:variety-v6-dev-7` | S2-08 |
| 9 | `rummipuz:1:6:2:variety-v6-dev-8` | S2-09 |
| 10 | `rummipuz:1:6:2:variety-v6-dev-9` | S2-10 |
| 11 | `rummipuz:1:6:2:variety-v6-dev-10` | S2-11 |
| 12 | `rummipuz:1:6:2:variety-v6-dev-11` | S2-12 |
| 13 | `rummipuz:1:6:2:variety-v6-dev-12` | S2-13 |
| 14 | `rummipuz:1:6:2:variety-v6-dev-13` | S2-14 |
| 15 | `rummipuz:1:6:2:variety-v6-dev-14` | M4 |
| 16 | `rummipuz:1:6:2:variety-v6-dev-15` | S2-16 |

</details>

<details>
<summary>Hard — 16 consecutive replay codes</summary>

| Order | Full replay code | Answer label |
| --- | --- | --- |
| 1 | `rummipuz:1:6:3:variety-v6-dev-0` | S3-01 |
| 2 | `rummipuz:1:6:3:variety-v6-dev-1` | H1 |
| 3 | `rummipuz:1:6:3:variety-v6-dev-2` | H2 |
| 4 | `rummipuz:1:6:3:variety-v6-dev-3` | S3-04 |
| 5 | `rummipuz:1:6:3:variety-v6-dev-4` | H3 |
| 6 | `rummipuz:1:6:3:variety-v6-dev-5` | H5 |
| 7 | `rummipuz:1:6:3:variety-v6-dev-6` | S3-07 |
| 8 | `rummipuz:1:6:3:variety-v6-dev-7` | S3-08 |
| 9 | `rummipuz:1:6:3:variety-v6-dev-8` | S3-09 |
| 10 | `rummipuz:1:6:3:variety-v6-dev-9` | S3-10 |
| 11 | `rummipuz:1:6:3:variety-v6-dev-10` | S3-11 |
| 12 | `rummipuz:1:6:3:variety-v6-dev-11` | S3-12 |
| 13 | `rummipuz:1:6:3:variety-v6-dev-12` | S3-13 |
| 14 | `rummipuz:1:6:3:variety-v6-dev-13` | H4 |
| 15 | `rummipuz:1:6:3:variety-v6-dev-14` | S3-15 |
| 16 | `rummipuz:1:6:3:variety-v6-dev-15` | S3-16 |

</details>

<details>
<summary>Expert — 16 consecutive replay codes</summary>

| Order | Full replay code | Answer label |
| --- | --- | --- |
| 1 | `rummipuz:1:6:4:variety-v6-dev-0` | X5 |
| 2 | `rummipuz:1:6:4:variety-v6-dev-1` | S4-02 |
| 3 | `rummipuz:1:6:4:variety-v6-dev-2` | S4-03 |
| 4 | `rummipuz:1:6:4:variety-v6-dev-3` | X3 |
| 5 | `rummipuz:1:6:4:variety-v6-dev-4` | S4-05 |
| 6 | `rummipuz:1:6:4:variety-v6-dev-5` | S4-06 |
| 7 | `rummipuz:1:6:4:variety-v6-dev-6` | X1 |
| 8 | `rummipuz:1:6:4:variety-v6-dev-7` | S4-08 |
| 9 | `rummipuz:1:6:4:variety-v6-dev-8` | S4-09 |
| 10 | `rummipuz:1:6:4:variety-v6-dev-9` | S4-10 |
| 11 | `rummipuz:1:6:4:variety-v6-dev-10` | X8 |
| 12 | `rummipuz:1:6:4:variety-v6-dev-11` | S4-12 |
| 13 | `rummipuz:1:6:4:variety-v6-dev-12` | S4-13 |
| 14 | `rummipuz:1:6:4:variety-v6-dev-13` | S4-14 |
| 15 | `rummipuz:1:6:4:variety-v6-dev-14` | S4-15 |
| 16 | `rummipuz:1:6:4:variety-v6-dev-15` | S4-16 |

</details>

## Starting layouts and hand-derived answers — spoilers

Every answer below conserves all physical tiles, leaves valid ascending runs/groups, and attains the proved minimum rearrangement. Take duplicate faces from the named source row; exact copy IDs are available in the JSON. Higher-tier family credit comes from all minimum solutions and tier gates cover all complete solutions, not just these examples. These answers show one valid route without claiming a forced temporal editing order.

<details>
<summary>E1 — answer and reasoning (spoilers)</summary>

**Run endpoint donation.** Move the indicated end tile(s) out of the original run into groups with rack partners, leaving one valid original run core. Both-end donation is the same family with two exports; judge whether it still feels introductory.

Starting rows (numbered as displayed when the replay opens):

1. Red 3–5
2. Red 2–7

Rack: Black 2, Blue 2.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Red 3–7 | row 2: Red 3, Red 4, Red 5, Red 6, Red 7 |
| Red 3–5 | row 1: Red 3, Red 4, Red 5 |
| Black/Blue/Red 2 | row 2: Red 2; rack: Black 2, Blue 2 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **8** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-run-donation` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>E2 — answer and reasoning (spoilers)</summary>

**Four-colour-group donation.** Keep three original group tiles together. Use its fourth tile with rack neighbours to make a same-colour run. Compare donating to the end of the new run with filling its middle.

Starting rows (numbered as displayed when the replay opens):

1. Black 1–3
2. Black/Blue/Orange/Red 7

Rack: Blue 9, Blue 8.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 7–9 | row 2: Blue 7; rack: Blue 8, Blue 9 |
| Black/Orange/Red 7 | row 2: Black 7, Orange 7, Red 7 |
| Black 1–3 | row 1: Black 1, Black 2, Black 3 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-group-donation` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>E3 — answer and reasoning (spoilers)</summary>

**Run division.** Divide the original run into two contiguous source fragments and supply their missing neighbours from the rack. Equal faces belong to distinct physical tiles: a rack copy completes one run while the original copy belongs to the other.

Starting rows (numbered as displayed when the replay opens):

1. Red 8–13
2. Orange 2–4

Rack: Red 10, Red 11.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Orange 2–4 | row 2: Orange 2, Orange 3, Orange 4 |
| Red 10–13 | row 1: Red 10, Red 11, Red 12, Red 13 |
| Red 8–11 | row 1: Red 8, Red 9; rack: Red 10, Red 11 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-run-division` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>M1 — answer and reasoning (spoilers)</summary>

**Interior extraction.** Original run tiles enter shared groups while long fragments survive as separate runs. The gaps and the group partners must be considered together; this is a connected rearrangement rather than independent end donations.

Starting rows (numbered as displayed when the replay opens):

1. Orange 2–8
2. Black 2–8
3. Red 11–13

Rack: Blue 10, Black 10, Red 10, Blue 5.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Orange 2–4 | row 1: Orange 2, Orange 3, Orange 4 |
| Orange 6–8 | row 1: Orange 6, Orange 7, Orange 8 |
| Black 2–4 | row 2: Black 2, Black 3, Black 4 |
| Black 6–8 | row 2: Black 6, Black 7, Black 8 |
| Black/Blue/Orange 5 | row 1: Orange 5; row 2: Black 5; rack: Blue 5 |
| Black/Blue/Red 10 | rack: Black 10, Blue 10, Red 10 |
| Red 11–13 | row 3: Red 11, Red 12, Red 13 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Red 10 into row 3. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `medium-interior-extraction` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>M2 — answer and reasoning (spoilers)</summary>

**Split and join.** Some extracted tiles make groups, leaving a short original run contribution. Repair that contribution by joining it to tiles from another changed run. The source/final contribution table below shows the linked repair; it does not prescribe a forced editing order.

Starting rows (numbered as displayed when the replay opens):

1. Black 1–3
2. Orange 3–5
3. Orange 6–13

Rack: Blue 10, Red 10, Blue 3, Red 3.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue/Orange/Red 10 | row 3: Orange 10; rack: Blue 10, Red 10 |
| Orange 11–13 | row 3: Orange 11, Orange 12, Orange 13 |
| Black 1–3 | row 1: Black 1, Black 2, Black 3 |
| Blue/Orange/Red 3 | row 2: Orange 3; rack: Blue 3, Red 3 |
| Orange 4–9 | row 2: Orange 4, Orange 5; row 3: Orange 6, Orange 7, Orange 8, Orange 9 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **2** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `medium-longer-split-join` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>M3 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

Starting rows (numbered as displayed when the replay opens):

1. Black/Orange/Red 5
2. Black/Orange/Red 4
3. Blue 10–12

Rack: Orange 3, Red 6, Black 3.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 10–12 | row 3: Blue 10, Blue 11, Blue 12 |
| Black 3–5 | row 1: Black 5; row 2: Black 4; rack: Black 3 |
| Orange 3–5 | row 1: Orange 5; row 2: Orange 4; rack: Orange 3 |
| Red 4–6 | row 1: Red 5; row 2: Red 4; rack: Red 6 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `medium-groups-to-runs` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>M4 — answer and reasoning (spoilers)</summary>

**Runs to groups.** Break the indicated original runs and regroup equal values across colours. Repeated faces must be assigned to separate valid groups, with rack partners completing the missing colours.

Starting rows (numbered as displayed when the replay opens):

1. Orange 3–5
2. Red 9–11
3. Blue 9–11

Rack: Orange 9, Black 10, Orange 11.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Blue/Red 10 | row 2: Red 10; row 3: Blue 10; rack: Black 10 |
| Blue/Orange/Red 11 | row 2: Red 11; row 3: Blue 11; rack: Orange 11 |
| Blue/Orange/Red 9 | row 2: Red 9; row 3: Blue 9; rack: Orange 9 |
| Orange 3–5 | row 1: Orange 3, Orange 4, Orange 5 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `medium-runs-to-groups` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>M5 — answer and reasoning (spoilers)</summary>

**Mixed exchange.** Use original group tiles to repair runs while original run tiles help make groups in the same connected component. Both directions matter; a legal rack extension alone does not complete the repair.

Starting rows (numbered as displayed when the replay opens):

1. Black/Blue/Orange/Red 5
2. Blue 11–13
3. Orange 6–8

Rack: Orange 9, Orange 4, Orange 10, Red 7, Black 7.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 11–13 | row 2: Blue 11, Blue 12, Blue 13 |
| Black/Orange/Red 7 | row 3: Orange 7; rack: Black 7, Red 7 |
| Orange 4–6 | row 1: Orange 5; row 3: Orange 6; rack: Orange 4 |
| Black/Blue/Red 5 | row 1: Black 5, Blue 5, Red 5 |
| Orange 8–10 | row 3: Orange 8; rack: Orange 9, Orange 10 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Orange 9 into row 3. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `medium-mixed-group-donation` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>H1 — answer and reasoning (spoilers)</summary>

**Interior extraction.** Original run tiles enter shared groups while long fragments survive as separate runs. The gaps and the group partners must be considered together; this is a connected rearrangement rather than independent end donations.

Starting rows (numbered as displayed when the replay opens):

1. Blue 11–13
2. Black 5–7
3. Red 5–7
4. Orange 2–10

Rack: Red 5, Blue 6, Black 5, Orange 5.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 11–13 | row 1: Blue 11, Blue 12, Blue 13 |
| Black/Orange/Red 7 | row 2: Black 7; row 3: Red 7; row 4: Orange 7 |
| Orange 8–10 | row 4: Orange 8, Orange 9, Orange 10 |
| Black/Blue/Orange/Red 6 | row 2: Black 6; row 3: Red 6; row 4: Orange 6; rack: Blue 6 |
| Orange 2–4 | row 4: Orange 2, Orange 3, Orange 4 |
| Black/Orange/Red 5 | row 2: Black 5; row 3: Red 5; row 4: Orange 5 |
| Black/Orange/Red 5 | rack: Black 5, Orange 5, Red 5 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `hard-interior-extraction` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>H2 — answer and reasoning (spoilers)</summary>

**Split and join.** Some extracted tiles make groups, leaving a short original run contribution. Repair that contribution by joining it to tiles from another changed run. The source/final contribution table below shows the linked repair; it does not prescribe a forced editing order.

Starting rows (numbered as displayed when the replay opens):

1. Red 1–3
2. Blue 7–13
3. Red 4–13
4. Black 2–4

Rack: Orange 1, Orange 10, Black 7, Black 1, Red 7, Orange 7.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Orange/Red 1 | row 1: Red 1; rack: Black 1, Orange 1 |
| Blue/Orange/Red 10 | row 2: Blue 10; row 3: Red 10; rack: Orange 10 |
| Red 11–13 | row 3: Red 11, Red 12, Red 13 |
| Black 2–4 | row 4: Black 2, Black 3, Black 4 |
| Blue 11–13 | row 2: Blue 11, Blue 12, Blue 13 |
| Blue 7–9 | row 2: Blue 7, Blue 8, Blue 9 |
| Black/Orange/Red 7 | row 3: Red 7; rack: Black 7, Orange 7 |
| Red 2–4 | row 1: Red 2, Red 3; row 3: Red 4 |
| Red 5–9 | row 3: Red 5, Red 6, Red 8, Red 9; rack: Red 7 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **4** face-level completion(s) and **8** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Black 1 into row 4. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `hard-split-and-join` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>H3 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

Starting rows (numbered as displayed when the replay opens):

1. Black/Blue/Orange/Red 6
2. Black/Blue/Orange/Red 12
3. Black/Blue/Orange/Red 7
4. Black/Blue/Orange/Red 8

Rack: Red 9, Black 5, Black 9, Red 5.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 5–9 | row 1: Black 6; row 3: Black 7; row 4: Black 8; rack: Black 5, Black 9 |
| Blue 6–8 | row 1: Blue 6; row 3: Blue 7; row 4: Blue 8 |
| Orange 6–8 | row 1: Orange 6; row 3: Orange 7; row 4: Orange 8 |
| Red 5–9 | row 1: Red 6; row 3: Red 7; row 4: Red 8; rack: Red 5, Red 9 |
| Black/Blue/Orange/Red 12 | row 2: Black 12, Blue 12, Orange 12, Red 12 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `hard-four-colour-group-only` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>H4 — answer and reasoning (spoilers)</summary>

**Runs to groups.** Break the indicated original runs and regroup equal values across colours. Repeated faces must be assigned to separate valid groups, with rack partners completing the missing colours.

Starting rows (numbered as displayed when the replay opens):

1. Black 5–7
2. Red 11–13
3. Blue 11–13
4. Orange 11–13

Rack: Black 12, Orange 13, Red 13, Blue 13.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 5–7 | row 1: Black 5, Black 6, Black 7 |
| Blue/Orange/Red 11 | row 2: Red 11; row 3: Blue 11; row 4: Orange 11 |
| Black/Blue/Orange/Red 12 | row 2: Red 12; row 3: Blue 12; row 4: Orange 12; rack: Black 12 |
| Blue/Orange/Red 13 | row 2: Red 13; row 3: Blue 13; row 4: Orange 13 |
| Blue/Orange/Red 13 | rack: Blue 13, Orange 13, Red 13 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `hard-runs-to-groups` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>H5 — answer and reasoning (spoilers)</summary>

**Mixed exchange.** Use original group tiles to repair runs while original run tiles help make groups in the same connected component. Both directions matter; a legal rack extension alone does not complete the repair.

Starting rows (numbered as displayed when the replay opens):

1. Red 5–7
2. Blue/Orange/Red 3
3. Black 9–11
4. Blue/Orange/Red 4

Rack: Orange 6, Blue 2, Red 2, Red 9, Orange 2, Blue 6, Red 8.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Red 2–5 | row 1: Red 5; row 2: Red 3; row 4: Red 4; rack: Red 2 |
| Blue 2–4 | row 2: Blue 3; row 4: Blue 4; rack: Blue 2 |
| Orange 2–4 | row 2: Orange 3; row 4: Orange 4; rack: Orange 2 |
| Blue/Orange/Red 6 | row 1: Red 6; rack: Blue 6, Orange 6 |
| Red 7–9 | row 1: Red 7; rack: Red 8, Red 9 |
| Black 9–11 | row 3: Black 9, Black 10, Black 11 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Red 8 into row 1. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `hard-mixed-exchange` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>X1 — answer and reasoning (spoilers)</summary>

**Interior extraction.** Original run tiles enter shared groups while long fragments survive as separate runs. The gaps and the group partners must be considered together; this is a connected rearrangement rather than independent end donations.

Starting rows (numbered as displayed when the replay opens):

1. Orange 1–9
2. Red 4–6
3. Blue 4–6
4. Black 4–6

Rack: Orange 5, Black 5, Blue 6, Orange 6, Red 4, Orange 4.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Blue/Orange 6 | row 1: Orange 6; row 3: Blue 6; row 4: Black 6 |
| Blue/Orange/Red 6 | row 2: Red 6; rack: Blue 6, Orange 6 |
| Orange 7–9 | row 1: Orange 7, Orange 8, Orange 9 |
| Orange 1–3 | row 1: Orange 1, Orange 2, Orange 3 |
| Blue/Orange/Red 4 | row 1: Orange 4; row 2: Red 4; row 3: Blue 4 |
| Black/Orange/Red 4 | row 4: Black 4; rack: Orange 4, Red 4 |
| Black/Blue/Orange 5 | row 1: Orange 5; row 3: Blue 5; row 4: Black 5 |
| Black/Orange/Red 5 | row 2: Red 5; rack: Black 5, Orange 5 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **64** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-interior-extraction` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>X2 — answer and reasoning (spoilers)</summary>

**Split and join.** Some extracted tiles make groups, leaving a short original run contribution. Repair that contribution by joining it to tiles from another changed run. The source/final contribution table below shows the linked repair; it does not prescribe a forced editing order.

Starting rows (numbered as displayed when the replay opens):

1. Blue 1–3
2. Blue 4–12
3. Orange 7–9
4. Red 7–9
5. Black 7–9

Rack: Blue 7, Blue 8, Red 1, Black 8, Red 9, Orange 7, Black 1, Blue 9.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Blue/Red 1 | row 1: Blue 1; rack: Black 1, Red 1 |
| Black/Blue/Orange 7 | row 2: Blue 7; row 3: Orange 7; row 5: Black 7 |
| Blue/Orange/Red 7 | row 4: Red 7; rack: Blue 7, Orange 7 |
| Blue 2–6 | row 1: Blue 2, Blue 3; row 2: Blue 4, Blue 5, Blue 6 |
| Blue 10–12 | row 2: Blue 10, Blue 11, Blue 12 |
| Blue/Orange/Red 9 | row 2: Blue 9; row 3: Orange 9; row 4: Red 9 |
| Black/Blue/Red 9 | row 5: Black 9; rack: Blue 9, Red 9 |
| Black/Blue/Orange 8 | row 2: Blue 8; row 3: Orange 8; row 5: Black 8 |
| Black/Blue/Red 8 | row 4: Red 8; rack: Black 8, Blue 8 |

The rack is empty. This answer changes exactly **5** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **64** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-split-and-join` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>X3 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

Starting rows (numbered as displayed when the replay opens):

1. Black/Blue/Orange 7
2. Black/Blue/Orange 6
3. Black/Blue/Orange 5
4. Black/Blue/Orange 4
5. Black/Blue/Orange 3

Rack: Orange 1, Orange 9, Orange 8, Black 2, Orange 2, Black 8.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 3–7 | row 1: Blue 7; row 2: Blue 6; row 3: Blue 5; row 4: Blue 4; row 5: Blue 3 |
| Black 2–4 | row 4: Black 4; row 5: Black 3; rack: Black 2 |
| Black 5–8 | row 1: Black 7; row 2: Black 6; row 3: Black 5; rack: Black 8 |
| Orange 1–9 | row 1: Orange 7; row 2: Orange 6; row 3: Orange 5; row 4: Orange 4; row 5: Orange 3; rack: Orange 1, Orange 2, Orange 8, Orange 9 |

The rack is empty. This answer changes exactly **5** original rows. Independent exhaustive checking finds **18** face-level completion(s) and **18** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-five-group-conversion` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>X4 — answer and reasoning (spoilers)</summary>

**Runs to groups.** Break the indicated original runs and regroup equal values across colours. Repeated faces must be assigned to separate valid groups, with rack partners completing the missing colours.

Starting rows (numbered as displayed when the replay opens):

1. Orange 7–9
2. Blue 7–9
3. Red 7–9
4. Black 7–9

Rack: Orange 8, Black 7, Red 9, Blue 8, Blue 7, Blue 9.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Blue/Orange 7 | row 1: Orange 7; row 2: Blue 7; row 4: Black 7 |
| Black/Blue/Red 7 | row 3: Red 7; rack: Black 7, Blue 7 |
| Black/Blue/Red 9 | row 2: Blue 9; row 3: Red 9; row 4: Black 9 |
| Blue/Orange/Red 9 | row 1: Orange 9; rack: Blue 9, Red 9 |
| Black/Blue/Orange 8 | row 1: Orange 8; row 2: Blue 8; row 4: Black 8 |
| Blue/Orange/Red 8 | row 3: Red 8; rack: Blue 8, Orange 8 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **64** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-runs-to-groups` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>X5 — answer and reasoning (spoilers)</summary>

**Mixed exchange.** Use original group tiles to repair runs while original run tiles help make groups in the same connected component. Both directions matter; a legal rack extension alone does not complete the repair.

Starting rows (numbered as displayed when the replay opens):

1. Blue/Orange/Red 4
2. Red 7–9
3. Blue/Orange/Red 5
4. Blue/Orange/Red 6

Rack: Red 3, Orange 3, Blue 3, Red 11, Red 10, Orange 8, Blue 8.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue/Orange/Red 8 | row 2: Red 8; rack: Blue 8, Orange 8 |
| Red 9–11 | row 2: Red 9; rack: Red 10, Red 11 |
| Red 3–7 | row 1: Red 4; row 2: Red 7; row 3: Red 5; row 4: Red 6; rack: Red 3 |
| Orange 3–6 | row 1: Orange 4; row 3: Orange 5; row 4: Orange 6; rack: Orange 3 |
| Blue 3–6 | row 1: Blue 4; row 3: Blue 5; row 4: Blue 6; rack: Blue 3 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **2** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Red 10 into row 2. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `expert-mixed-exchange` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>X6 — answer and reasoning (spoilers)</summary>

**Combined repair.** Keep a three-tile core of the four-colour donor group and send its fourth tile to a changed run. That same source run also needs interior rebuilding with two surviving long cores and an intervening tile entering a group. The donation and interior repair are linked, not separate chores.

Starting rows (numbered as displayed when the replay opens):

1. Blue 4–6
2. Red 1–9
3. Black/Blue/Orange/Red 10
4. Black 4–6

Rack: Orange 5, Red 4, Blue 4, Red 11, Black 4.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Red 1–3 | row 2: Red 1, Red 2, Red 3 |
| Red 7–11 | row 2: Red 7, Red 8, Red 9; row 3: Red 10; rack: Red 11 |
| Black/Blue/Orange 10 | row 3: Black 10, Blue 10, Orange 10 |
| Black/Blue/Red 4 | row 1: Blue 4; row 2: Red 4; row 4: Black 4 |
| Black/Blue/Red 4 | rack: Black 4, Blue 4, Red 4 |
| Black/Blue/Orange/Red 5 | row 1: Blue 5; row 2: Red 5; row 4: Black 5; rack: Orange 5 |
| Black/Blue/Red 6 | row 1: Blue 6; row 2: Red 6; row 4: Black 6 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-compact-combined-repair` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>E4 — answer and reasoning (spoilers)</summary>

**Run endpoint donation.** Move the indicated end tile(s) out of the original run into groups with rack partners, leaving one valid original run core. Both-end donation is the same family with two exports; judge whether it still feels introductory.

Starting rows (numbered as displayed when the replay opens):

1. Black 9–13
2. Blue 3–5

Rack: Red 9, Orange 9, Red 13, Orange 13.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Orange/Red 13 | row 1: Black 13; rack: Orange 13, Red 13 |
| Black/Orange/Red 9 | row 1: Black 9; rack: Orange 9, Red 9 |
| Black 10–12 | row 1: Black 10, Black 11, Black 12 |
| Blue 3–5 | row 2: Blue 3, Blue 4, Blue 5 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-both-ends` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>E5 — answer and reasoning (spoilers)</summary>

**Four-colour-group donation.** Keep three original group tiles together. Use its fourth tile with rack neighbours to make a same-colour run. Compare donating to the end of the new run with filling its middle.

Starting rows (numbered as displayed when the replay opens):

1. Black/Blue/Orange/Red 9
2. Blue 3–5

Rack: Orange 10, Orange 8.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Orange 8–10 | row 1: Orange 9; rack: Orange 8, Orange 10 |
| Black/Blue/Red 9 | row 1: Black 9, Blue 9, Red 9 |
| Blue 3–5 | row 2: Blue 3, Blue 4, Blue 5 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-group-middle-donation` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>H6 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

Starting rows (numbered as displayed when the replay opens):

1. Red 4–6
2. Black/Blue/Orange 11
3. Black/Blue/Orange 10
4. Black/Blue/Orange 12
5. Blue 10–12

Rack: Blue 9, Orange 9, Orange 13, Blue 13.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Red 4–6 | row 1: Red 4, Red 5, Red 6 |
| Orange 9–13 | row 2: Orange 11; row 3: Orange 10; row 4: Orange 12; rack: Orange 9, Orange 13 |
| Black 10–12 | row 2: Black 11; row 3: Black 10; row 4: Black 12 |
| Blue 10–13 | row 2: Blue 11; row 3: Blue 10; row 4: Blue 12; rack: Blue 13 |
| Blue 9–12 | row 5: Blue 10, Blue 11, Blue 12; rack: Blue 9 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **16** physical-copy partitions; copy permutations are not counted as extra human ideas.

This is the duplicate-choice comparison. Use the row provenance above to distinguish equal-looking tiles, and compare the choice with the corresponding pure group-conversion sample. Copies and support rows do not create another family.

The answer is transported from the independently hand-reviewed `hard-duplicate-choice` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>X7 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

Starting rows (numbered as displayed when the replay opens):

1. Blue/Orange/Red 10
2. Orange 7–9
3. Blue/Orange/Red 7
4. Blue/Orange/Red 8
5. Blue/Orange/Red 9

Rack: Red 6, Orange 6, Orange 5, Orange 12, Orange 11, Red 11.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Red 6–11 | row 1: Red 10; row 3: Red 7; row 4: Red 8; row 5: Red 9; rack: Red 6, Red 11 |
| Orange 5–12 | row 1: Orange 10; row 3: Orange 7; row 4: Orange 8; row 5: Orange 9; rack: Orange 5, Orange 6, Orange 11, Orange 12 |
| Blue 7–10 | row 1: Blue 10; row 3: Blue 7; row 4: Blue 8; row 5: Blue 9 |
| Orange 7–9 | row 2: Orange 7, Orange 8, Orange 9 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **10** face-level completion(s) and **80** physical-copy partitions; copy permutations are not counted as extra human ideas.

This is the duplicate-choice comparison. Use the row provenance above to distinguish equal-looking tiles, and compare the choice with the corresponding pure group-conversion sample. Copies and support rows do not create another family.

The answer is transported from the independently hand-reviewed `expert-duplicate-choice` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>X8 — answer and reasoning (spoilers)</summary>

**Combined repair.** Keep a three-tile core of the four-colour donor group and send its fourth tile to a changed run. That same source run also needs interior rebuilding with two surviving long cores and an intervening tile entering a group. The donation and interior repair are linked, not separate chores.

Starting rows (numbered as displayed when the replay opens):

1. Black/Blue/Orange/Red 11
2. Blue 4–6
3. Orange 4–6
4. Red 4–6
5. Black 1–10

Rack: Black 6, Black 5, Black 4, Black 12, Blue 5, Orange 6, Red 4.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue/Orange/Red 11 | row 1: Blue 11, Orange 11, Red 11 |
| Black/Blue/Orange 6 | row 2: Blue 6; row 3: Orange 6; row 5: Black 6 |
| Black/Orange/Red 6 | row 4: Red 6; rack: Black 6, Orange 6 |
| Black 10–12 | row 1: Black 11; row 5: Black 10; rack: Black 12 |
| Black 7–9 | row 5: Black 7, Black 8, Black 9 |
| Black 1–3 | row 5: Black 1, Black 2, Black 3 |
| Black/Orange/Red 4 | row 3: Orange 4; row 4: Red 4; row 5: Black 4 |
| Black/Blue/Red 4 | row 2: Blue 4; rack: Black 4, Red 4 |
| Black/Blue/Orange 5 | row 2: Blue 5; row 3: Orange 5; row 5: Black 5 |
| Black/Blue/Red 5 | row 4: Red 5; rack: Black 5, Blue 5 |

The rack is empty. This answer changes exactly **5** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **128** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-longer-combined-repair` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

## Remaining sequence answers — spoilers

Samples already featured above use that answer. Other sequence answers follow; read the initial board directly from the replay and use its numbered original rows.

<details>
<summary>S1-03 — answer and reasoning (spoilers)</summary>

**Run division.** Divide the original run into two contiguous source fragments and supply their missing neighbours from the rack. Equal faces belong to distinct physical tiles: a rack copy completes one run while the original copy belongs to the other.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Red 2–4 | row 2: Red 2, Red 3, Red 4 |
| Black 7–11 | row 1: Black 7, Black 8, Black 9, Black 10, Black 11 |
| Black 10–13 | row 1: Black 12, Black 13; rack: Black 10, Black 11 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-longer-division` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S1-04 — answer and reasoning (spoilers)</summary>

**Four-colour-group donation.** Keep three original group tiles together. Use its fourth tile with rack neighbours to make a same-colour run. Compare donating to the end of the new run with filling its middle.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Red 6–8 | row 2: Red 7; rack: Red 6, Red 8 |
| Black/Blue/Orange 7 | row 2: Black 7, Blue 7, Orange 7 |
| Orange 11–13 | row 1: Orange 11, Orange 12, Orange 13 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-group-middle-donation` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S1-06 — answer and reasoning (spoilers)</summary>

**Run division.** Divide the original run into two contiguous source fragments and supply their missing neighbours from the rack. Equal faces belong to distinct physical tiles: a rack copy completes one run while the original copy belongs to the other.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 10–12 | row 2: Black 10, Black 11, Black 12 |
| Orange 1–4 | row 1: Orange 1, Orange 2, Orange 3, Orange 4 |
| Orange 3–6 | row 1: Orange 5, Orange 6; rack: Orange 3, Orange 4 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-run-division` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S1-07 — answer and reasoning (spoilers)</summary>

**Run endpoint donation.** Move the indicated end tile(s) out of the original run into groups with rack partners, leaving one valid original run core. Both-end donation is the same family with two exports; judge whether it still feels introductory.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Orange/Red 2 | row 1: Black 2; rack: Orange 2, Red 2 |
| Black/Orange/Red 6 | row 1: Black 6; rack: Orange 6, Red 6 |
| Black 3–5 | row 1: Black 3, Black 4, Black 5 |
| Blue 10–12 | row 2: Blue 10, Blue 11, Blue 12 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-both-ends` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S1-08 — answer and reasoning (spoilers)</summary>

**Run division.** Divide the original run into two contiguous source fragments and supply their missing neighbours from the rack. Equal faces belong to distinct physical tiles: a rack copy completes one run while the original copy belongs to the other.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 2–4 | row 1: Blue 2, Blue 3, Blue 4 |
| Orange 10–13 | row 2: Orange 10, Orange 11, Orange 12, Orange 13 |
| Orange 8–11 | row 2: Orange 8, Orange 9; rack: Orange 10, Orange 11 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-run-division` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S1-09 — answer and reasoning (spoilers)</summary>

**Run division.** Divide the original run into two contiguous source fragments and supply their missing neighbours from the rack. Equal faces belong to distinct physical tiles: a rack copy completes one run while the original copy belongs to the other.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 1–3 | row 1: Blue 1, Blue 2, Blue 3 |
| Red 6–10 | row 2: Red 6, Red 7, Red 8, Red 9, Red 10 |
| Red 9–12 | row 2: Red 11, Red 12; rack: Red 9, Red 10 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-longer-division` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S1-10 — answer and reasoning (spoilers)</summary>

**Run division.** Divide the original run into two contiguous source fragments and supply their missing neighbours from the rack. Equal faces belong to distinct physical tiles: a rack copy completes one run while the original copy belongs to the other.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 11–13 | row 2: Blue 11, Blue 12, Blue 13 |
| Red 4–8 | row 1: Red 4, Red 5, Red 6, Red 7, Red 8 |
| Red 2–5 | row 1: Red 2, Red 3; rack: Red 4, Red 5 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-longer-division` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S1-11 — answer and reasoning (spoilers)</summary>

**Four-colour-group donation.** Keep three original group tiles together. Use its fourth tile with rack neighbours to make a same-colour run. Compare donating to the end of the new run with filling its middle.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Red 7–9 | row 2: Red 8; rack: Red 7, Red 9 |
| Black/Blue/Orange 8 | row 2: Black 8, Blue 8, Orange 8 |
| Black 2–4 | row 1: Black 2, Black 3, Black 4 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-group-middle-donation` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S1-12 — answer and reasoning (spoilers)</summary>

**Run division.** Divide the original run into two contiguous source fragments and supply their missing neighbours from the rack. Equal faces belong to distinct physical tiles: a rack copy completes one run while the original copy belongs to the other.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 2–4 | row 2: Blue 2, Blue 3, Blue 4 |
| Black 10–13 | row 1: Black 10, Black 11, Black 12, Black 13 |
| Black 8–11 | row 1: Black 8, Black 9; rack: Black 10, Black 11 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-run-division` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S1-13 — answer and reasoning (spoilers)</summary>

**Run division.** Divide the original run into two contiguous source fragments and supply their missing neighbours from the rack. Equal faces belong to distinct physical tiles: a rack copy completes one run while the original copy belongs to the other.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 1–3 | row 1: Blue 1, Blue 2, Blue 3 |
| Red 6–10 | row 2: Red 6, Red 7, Red 8, Red 9, Red 10 |
| Red 9–12 | row 2: Red 11, Red 12; rack: Red 9, Red 10 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-longer-division` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S1-14 — answer and reasoning (spoilers)</summary>

**Run division.** Divide the original run into two contiguous source fragments and supply their missing neighbours from the rack. Equal faces belong to distinct physical tiles: a rack copy completes one run while the original copy belongs to the other.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 10–12 | row 2: Blue 10, Blue 11, Blue 12 |
| Red 1–4 | row 1: Red 1, Red 2, Red 3, Red 4 |
| Red 3–6 | row 1: Red 5, Red 6; rack: Red 3, Red 4 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-run-division` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S1-16 — answer and reasoning (spoilers)</summary>

**Four-colour-group donation.** Keep three original group tiles together. Use its fourth tile with rack neighbours to make a same-colour run. Compare donating to the end of the new run with filling its middle.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 4–6 | row 1: Black 5; rack: Black 4, Black 6 |
| Blue/Orange/Red 5 | row 1: Blue 5, Orange 5, Red 5 |
| Red 9–11 | row 2: Red 9, Red 10, Red 11 |

The rack is empty. This answer changes exactly **1** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `easy-group-middle-donation` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S2-01 — answer and reasoning (spoilers)</summary>

**Runs to groups.** Break the indicated original runs and regroup equal values across colours. Repeated faces must be assigned to separate valid groups, with rack partners completing the missing colours.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Blue/Red 12 | row 2: Blue 12; row 3: Red 12; rack: Black 12 |
| Black/Blue/Red 11 | row 2: Blue 11; row 3: Red 11; rack: Black 11 |
| Blue/Orange/Red 13 | row 2: Blue 13; row 3: Red 13; rack: Orange 13 |
| Orange 5–7 | row 1: Orange 5, Orange 6, Orange 7 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `medium-adjacent-rack-partners` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S2-02 — answer and reasoning (spoilers)</summary>

**Runs to groups.** Break the indicated original runs and regroup equal values across colours. Repeated faces must be assigned to separate valid groups, with rack partners completing the missing colours.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue/Orange/Red 4 | row 2: Red 4; row 3: Orange 4; rack: Blue 4 |
| Blue/Orange/Red 5 | row 2: Red 5; row 3: Orange 5; rack: Blue 5 |
| Black/Orange/Red 3 | row 2: Red 3; row 3: Orange 3; rack: Black 3 |
| Black 9–11 | row 1: Black 9, Black 10, Black 11 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `medium-adjacent-rack-partners` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S2-03 — answer and reasoning (spoilers)</summary>

**Split and join.** Some extracted tiles make groups, leaving a short original run contribution. Repair that contribution by joining it to tiles from another changed run. The source/final contribution table below shows the linked repair; it does not prescribe a forced editing order.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 11–13 | row 2: Black 11, Black 12, Black 13 |
| Black 5–9 | row 2: Black 7, Black 8, Black 9; row 3: Black 5, Black 6 |
| Black/Blue/Orange 10 | row 2: Black 10; rack: Blue 10, Orange 10 |
| Black/Blue/Orange 4 | row 3: Black 4; rack: Blue 4, Orange 4 |
| Red 1–3 | row 1: Red 1, Red 2, Red 3 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `medium-split-and-join` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S2-04 — answer and reasoning (spoilers)</summary>

**Interior extraction.** Original run tiles enter shared groups while long fragments survive as separate runs. The gaps and the group partners must be considered together; this is a connected rearrangement rather than independent end donations.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Orange/Red 4 | row 1: Orange 4; row 3: Black 4; rack: Red 4 |
| Black/Blue/Red 9 | rack: Black 9, Blue 9, Red 9 |
| Orange 1–3 | row 1: Orange 1, Orange 2, Orange 3 |
| Blue 10–12 | row 2: Blue 10, Blue 11, Blue 12 |
| Black 1–3 | row 3: Black 1, Black 2, Black 3 |
| Black 5–7 | row 3: Black 5, Black 6, Black 7 |
| Orange 5–8 | row 1: Orange 5, Orange 6, Orange 7, Orange 8 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Blue 9 into row 2. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `medium-asymmetric-interior` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S2-08 — answer and reasoning (spoilers)</summary>

**Split and join.** Some extracted tiles make groups, leaving a short original run contribution. Repair that contribution by joining it to tiles from another changed run. The source/final contribution table below shows the linked repair; it does not prescribe a forced editing order.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Blue/Red 10 | row 1: Black 10; rack: Blue 10, Red 10 |
| Black 11–13 | row 1: Black 11, Black 12, Black 13 |
| Orange 1–3 | row 2: Orange 1, Orange 2, Orange 3 |
| Black/Blue/Red 3 | row 3: Black 3; rack: Blue 3, Red 3 |
| Black 4–9 | row 1: Black 6, Black 7, Black 8, Black 9; row 3: Black 4, Black 5 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **2** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `medium-longer-split-join` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S2-09 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 8–10 | row 1: Black 8, Black 9, Black 10 |
| Black 2–4 | row 2: Black 2; row 3: Black 3; rack: Black 4 |
| Blue 1–3 | row 2: Blue 2; row 3: Blue 3; rack: Blue 1 |
| Orange 1–3 | row 2: Orange 2; row 3: Orange 3; rack: Orange 1 |
| Red 2–4 | row 2: Red 2; row 3: Red 3; rack: Red 4 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `medium-four-colour-conversion` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S2-10 — answer and reasoning (spoilers)</summary>

**Runs to groups.** Break the indicated original runs and regroup equal values across colours. Repeated faces must be assigned to separate valid groups, with rack partners completing the missing colours.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue/Orange/Red 10 | row 1: Blue 10; row 3: Red 10; rack: Orange 10 |
| Blue/Orange/Red 9 | row 1: Blue 9; row 3: Red 9; rack: Orange 9 |
| Black/Blue/Red 11 | row 1: Blue 11; row 3: Red 11; rack: Black 11 |
| Black 3–5 | row 2: Black 3, Black 4, Black 5 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `medium-adjacent-rack-partners` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S2-11 — answer and reasoning (spoilers)</summary>

**Mixed exchange.** Use original group tiles to repair runs while original run tiles help make groups in the same connected component. Both directions matter; a legal rack extension alone does not complete the repair.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Orange 9–11 | row 3: Orange 9, Orange 10, Orange 11 |
| Black/Blue/Red 5 | row 2: Red 5; rack: Black 5, Blue 5 |
| Red 2–4 | row 1: Red 3; row 2: Red 4; rack: Red 2 |
| Black/Blue/Orange 3 | row 1: Black 3, Blue 3, Orange 3 |
| Red 6–8 | row 2: Red 6; rack: Red 7, Red 8 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Red 7 into row 2. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `medium-mixed-group-donation` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S2-12 — answer and reasoning (spoilers)</summary>

**Split and join.** Some extracted tiles make groups, leaving a short original run contribution. Repair that contribution by joining it to tiles from another changed run. The source/final contribution table below shows the linked repair; it does not prescribe a forced editing order.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Blue/Red 4 | row 1: Blue 4; rack: Black 4, Red 4 |
| Blue 1–3 | row 1: Blue 1, Blue 2, Blue 3 |
| Orange 11–13 | row 2: Orange 11, Orange 12, Orange 13 |
| Black/Blue/Red 11 | row 3: Blue 11; rack: Black 11, Red 11 |
| Blue 5–10 | row 1: Blue 5, Blue 6, Blue 7, Blue 8; row 3: Blue 9, Blue 10 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **2** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `medium-longer-split-join` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S2-13 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 3–5 | row 1: Black 3, Black 4, Black 5 |
| Blue 10–12 | row 2: Blue 11; row 3: Blue 10; rack: Blue 12 |
| Orange 10–12 | row 2: Orange 11; row 3: Orange 10; rack: Orange 12 |
| Red 9–11 | row 2: Red 11; row 3: Red 10; rack: Red 9 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `medium-groups-to-runs` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S2-14 — answer and reasoning (spoilers)</summary>

**Split and join.** Some extracted tiles make groups, leaving a short original run contribution. Repair that contribution by joining it to tiles from another changed run. The source/final contribution table below shows the linked repair; it does not prescribe a forced editing order.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Orange/Red 10 | row 2: Orange 10; rack: Black 10, Red 10 |
| Orange 11–13 | row 2: Orange 11, Orange 12, Orange 13 |
| Blue 1–3 | row 1: Blue 1, Blue 2, Blue 3 |
| Black/Orange/Red 3 | row 3: Orange 3; rack: Black 3, Red 3 |
| Orange 4–9 | row 2: Orange 6, Orange 7, Orange 8, Orange 9; row 3: Orange 4, Orange 5 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **2** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `medium-longer-split-join` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S2-16 — answer and reasoning (spoilers)</summary>

**Mixed exchange.** Use original group tiles to repair runs while original run tiles help make groups in the same connected component. Both directions matter; a legal rack extension alone does not complete the repair.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 1–3 | row 1: Black 1, Black 2, Black 3 |
| Blue/Orange/Red 7 | row 2: Red 7; rack: Blue 7, Orange 7 |
| Red 8–10 | row 2: Red 8; row 3: Red 9; rack: Red 10 |
| Black/Blue/Orange 9 | row 3: Black 9, Blue 9, Orange 9 |
| Red 4–6 | row 2: Red 6; rack: Red 4, Red 5 |

The rack is empty. This answer changes exactly **2** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Red 5 into row 2. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `medium-mixed-group-donation` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S3-01 — answer and reasoning (spoilers)</summary>

**Runs to groups.** Break the indicated original runs and regroup equal values across colours. Repeated faces must be assigned to separate valid groups, with rack partners completing the missing colours.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 7–9 | row 3: Black 7, Black 8, Black 9 |
| Blue/Orange/Red 2 | row 1: Orange 2; row 2: Blue 2; row 4: Red 2 |
| Black/Blue/Orange/Red 3 | row 1: Orange 3; row 2: Blue 3; row 4: Red 3; rack: Black 3 |
| Blue/Orange/Red 1 | row 1: Orange 1; row 2: Blue 1; row 4: Red 1 |
| Blue/Orange/Red 1 | rack: Blue 1, Orange 1, Red 1 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `hard-endpoint-missing-partner` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S3-04 — answer and reasoning (spoilers)</summary>

**Interior extraction.** Original run tiles enter shared groups while long fragments survive as separate runs. The gaps and the group partners must be considered together; this is a connected rearrangement rather than independent end donations.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Orange 11–13 | row 3: Orange 11, Orange 12, Orange 13 |
| Black/Blue/Red 7 | row 1: Black 7; row 2: Red 7; row 4: Blue 7 |
| Black 8–10 | row 1: Black 8, Black 9, Black 10 |
| Black/Blue/Orange/Red 6 | row 1: Black 6; row 2: Red 6; row 4: Blue 6; rack: Orange 6 |
| Black 2–4 | row 1: Black 2, Black 3, Black 4 |
| Black/Blue/Red 5 | row 1: Black 5; row 2: Red 5; row 4: Blue 5 |
| Black/Blue/Red 5 | rack: Black 5, Blue 5, Red 5 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `hard-interior-extraction` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S3-07 — answer and reasoning (spoilers)</summary>

**Split and join.** Some extracted tiles make groups, leaving a short original run contribution. Repair that contribution by joining it to tiles from another changed run. The source/final contribution table below shows the linked repair; it does not prescribe a forced editing order.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Blue/Orange 1 | row 3: Blue 1; rack: Black 1, Orange 1 |
| Black/Blue/Red 10 | row 1: Red 10; row 4: Blue 10; rack: Black 10 |
| Blue 11–13 | row 4: Blue 11, Blue 12, Blue 13 |
| Orange 2–4 | row 2: Orange 2, Orange 3, Orange 4 |
| Red 11–13 | row 1: Red 11, Red 12, Red 13 |
| Red 7–9 | row 1: Red 7, Red 8, Red 9 |
| Black/Blue/Orange 7 | row 4: Blue 7; rack: Black 7, Orange 7 |
| Blue 2–4 | row 3: Blue 2, Blue 3; row 4: Blue 4 |
| Blue 5–9 | row 4: Blue 5, Blue 6, Blue 8, Blue 9; rack: Blue 7 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **4** face-level completion(s) and **8** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Orange 1 into row 2. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `hard-split-and-join` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S3-08 — answer and reasoning (spoilers)</summary>

**Split and join.** Some extracted tiles make groups, leaving a short original run contribution. Repair that contribution by joining it to tiles from another changed run. The source/final contribution table below shows the linked repair; it does not prescribe a forced editing order.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Orange/Red 13 | row 1: Red 13; rack: Black 13, Orange 13 |
| Black/Blue/Red 4 | row 3: Blue 4; row 4: Red 4; rack: Black 4 |
| Red 1–3 | row 4: Red 1, Red 2, Red 3 |
| Orange 10–12 | row 2: Orange 10, Orange 11, Orange 12 |
| Blue 1–3 | row 3: Blue 1, Blue 2, Blue 3 |
| Blue 5–7 | row 3: Blue 5, Blue 6, Blue 7 |
| Black/Orange/Red 7 | row 4: Red 7; rack: Black 7, Orange 7 |
| Red 10–12 | row 1: Red 11, Red 12; row 4: Red 10 |
| Red 5–9 | row 4: Red 5, Red 6, Red 8, Red 9; rack: Red 7 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **4** face-level completion(s) and **8** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Orange 13 into row 2. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `hard-split-and-join` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S3-09 — answer and reasoning (spoilers)</summary>

**Interior extraction.** Original run tiles enter shared groups while long fragments survive as separate runs. The gaps and the group partners must be considered together; this is a connected rearrangement rather than independent end donations.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 11–13 | row 1: Blue 11, Blue 12, Blue 13 |
| Black/Orange/Red 7 | row 2: Black 7; row 3: Orange 7; row 4: Red 7 |
| Orange 8–10 | row 3: Orange 8, Orange 9, Orange 10 |
| Black/Blue/Orange/Red 6 | row 2: Black 6; row 3: Orange 6; row 4: Red 6; rack: Blue 6 |
| Orange 2–4 | row 3: Orange 2, Orange 3, Orange 4 |
| Black/Orange/Red 5 | row 2: Black 5; row 3: Orange 5; row 4: Red 5 |
| Black/Orange/Red 5 | rack: Black 5, Orange 5, Red 5 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `hard-interior-extraction` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S3-10 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Red 5–9 | row 1: Red 7; row 2: Red 8; row 4: Red 6; rack: Red 5, Red 9 |
| Black 6–8 | row 1: Black 7; row 2: Black 8; row 4: Black 6 |
| Blue 6–8 | row 1: Blue 7; row 2: Blue 8; row 4: Blue 6 |
| Orange 5–9 | row 1: Orange 7; row 2: Orange 8; row 4: Orange 6; rack: Orange 5, Orange 9 |
| Black/Blue/Orange/Red 2 | row 3: Black 2, Blue 2, Orange 2, Red 2 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `hard-four-colour-group-only` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S3-11 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 4–8 | row 2: Black 6; row 3: Black 7; row 4: Black 5; rack: Black 4, Black 8 |
| Blue 5–7 | row 2: Blue 6; row 3: Blue 7; row 4: Blue 5 |
| Orange 5–7 | row 2: Orange 6; row 3: Orange 7; row 4: Orange 5 |
| Red 4–8 | row 2: Red 6; row 3: Red 7; row 4: Red 5; rack: Red 4, Red 8 |
| Black/Blue/Orange/Red 11 | row 1: Black 11, Blue 11, Orange 11, Red 11 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `hard-four-colour-group-only` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S3-12 — answer and reasoning (spoilers)</summary>

**Mixed exchange.** Use original group tiles to repair runs while original run tiles help make groups in the same connected component. Both directions matter; a legal rack extension alone does not complete the repair.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 4–7 | row 2: Blue 6; row 3: Blue 7; row 4: Blue 5; rack: Blue 4 |
| Black 4–6 | row 2: Black 6; row 4: Black 5; rack: Black 4 |
| Red 4–6 | row 2: Red 6; row 4: Red 5; rack: Red 4 |
| Black/Blue/Red 8 | row 3: Blue 8; rack: Black 8, Red 8 |
| Blue 9–11 | row 3: Blue 9; rack: Blue 10, Blue 11 |
| Orange 11–13 | row 1: Orange 11, Orange 12, Orange 13 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Blue 10 into row 3. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `hard-mixed-exchange` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S3-13 — answer and reasoning (spoilers)</summary>

**Mixed exchange.** Use original group tiles to repair runs while original run tiles help make groups in the same connected component. Both directions matter; a legal rack extension alone does not complete the repair.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Red 10–13 | row 1: Red 10; row 3: Red 11; row 4: Red 12; rack: Red 13 |
| Blue 11–13 | row 3: Blue 11; row 4: Blue 12; rack: Blue 13 |
| Orange 11–13 | row 3: Orange 11; row 4: Orange 12; rack: Orange 13 |
| Blue/Orange/Red 9 | row 1: Red 9; rack: Blue 9, Orange 9 |
| Red 6–8 | row 1: Red 8; rack: Red 6, Red 7 |
| Black 4–6 | row 2: Black 4, Black 5, Black 6 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Red 7 into row 1. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `hard-mixed-exchange` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S3-15 — answer and reasoning (spoilers)</summary>

**Runs to groups.** Break the indicated original runs and regroup equal values across colours. Repeated faces must be assigned to separate valid groups, with rack partners completing the missing colours.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 1–3 | row 2: Black 1, Black 2, Black 3 |
| Blue/Orange/Red 8 | row 1: Blue 8; row 3: Red 8; row 4: Orange 8 |
| Black/Blue/Orange/Red 7 | row 1: Blue 7; row 3: Red 7; row 4: Orange 7; rack: Black 7 |
| Blue/Orange/Red 9 | row 1: Blue 9; row 3: Red 9; row 4: Orange 9 |
| Blue/Orange/Red 9 | rack: Blue 9, Orange 9, Red 9 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **4** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `hard-endpoint-missing-partner` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S3-16 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 8–12 | row 1: Black 10; row 2: Black 9; row 4: Black 11; rack: Black 8, Black 12 |
| Red 9–11 | row 1: Red 10; row 2: Red 9; row 4: Red 11 |
| Orange 9–11 | row 1: Orange 10; row 2: Orange 9; row 4: Orange 11 |
| Blue 8–12 | row 1: Blue 10; row 2: Blue 9; row 4: Blue 11; rack: Blue 8, Blue 12 |
| Black/Blue/Orange/Red 5 | row 3: Black 5, Blue 5, Orange 5, Red 5 |

The rack is empty. This answer changes exactly **3** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **1** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `hard-four-colour-group-only` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S4-02 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 7–12 | row 1: Black 10; row 2: Black 11; row 3: Black 9; row 4: Black 8; rack: Black 7, Black 12 |
| Red 6–13 | row 1: Red 10; row 2: Red 11; row 3: Red 9; row 4: Red 8; rack: Red 6, Red 7, Red 12, Red 13 |
| Blue 8–11 | row 1: Blue 10; row 2: Blue 11; row 3: Blue 9; row 4: Blue 8 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **8** face-level completion(s) and **8** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-groups-to-runs` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S4-03 — answer and reasoning (spoilers)</summary>

**Split and join.** Some extracted tiles make groups, leaving a short original run contribution. Repair that contribution by joining it to tiles from another changed run. The source/final contribution table below shows the linked repair; it does not prescribe a forced editing order.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue/Orange/Red 13 | row 5: Blue 13; rack: Orange 13, Red 13 |
| Black/Blue/Orange 6 | row 2: Orange 6; row 3: Black 6; row 4: Blue 6 |
| Black/Blue/Red 6 | row 1: Red 6; rack: Black 6, Blue 6 |
| Blue 10–12 | row 4: Blue 10; row 5: Blue 11, Blue 12 |
| Blue 7–9 | row 4: Blue 7, Blue 8, Blue 9 |
| Blue 1–3 | row 4: Blue 1, Blue 2, Blue 3 |
| Black/Blue/Red 4 | row 1: Red 4; row 3: Black 4; row 4: Blue 4 |
| Blue/Orange/Red 4 | row 2: Orange 4; rack: Blue 4, Red 4 |
| Black/Blue/Orange 5 | row 2: Orange 5; row 3: Black 5; row 4: Blue 5 |
| Blue/Orange/Red 5 | row 1: Red 5; rack: Blue 5, Orange 5 |

The rack is empty. This answer changes exactly **5** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **128** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-longer-split-join` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S4-05 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black 3–7 | row 1: Black 4; row 2: Black 7; row 3: Black 5; row 4: Black 6; row 5: Black 3 |
| Blue 2–4 | row 1: Blue 4; row 5: Blue 3; rack: Blue 2 |
| Blue 5–8 | row 2: Blue 7; row 3: Blue 5; row 4: Blue 6; rack: Blue 8 |
| Orange 1–9 | row 1: Orange 4; row 2: Orange 7; row 3: Orange 5; row 4: Orange 6; row 5: Orange 3; rack: Orange 1, Orange 2, Orange 8, Orange 9 |

The rack is empty. This answer changes exactly **5** original rows. Independent exhaustive checking finds **18** face-level completion(s) and **18** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-five-group-conversion` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S4-06 — answer and reasoning (spoilers)</summary>

**Mixed exchange.** Use original group tiles to repair runs while original run tiles help make groups in the same connected component. Both directions matter; a legal rack extension alone does not complete the repair.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue/Orange/Red 6 | row 4: Blue 6; rack: Orange 6, Red 6 |
| Blue 3–5 | row 4: Blue 5; rack: Blue 3, Blue 4 |
| Blue 7–11 | row 1: Blue 9; row 2: Blue 8; row 3: Blue 10; row 4: Blue 7; rack: Blue 11 |
| Orange 8–11 | row 1: Orange 9; row 2: Orange 8; row 3: Orange 10; rack: Orange 11 |
| Red 8–11 | row 1: Red 9; row 2: Red 8; row 3: Red 10; rack: Red 11 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **2** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Blue 4 into row 4. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `expert-mixed-exchange` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S4-08 — answer and reasoning (spoilers)</summary>

**Interior extraction.** Original run tiles enter shared groups while long fragments survive as separate runs. The gaps and the group partners must be considered together; this is a connected rearrangement rather than independent end donations.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Orange/Red 6 | row 1: Black 6; row 2: Red 6; row 4: Orange 6 |
| Black/Blue/Orange 6 | row 3: Blue 6; rack: Black 6, Orange 6 |
| Orange 7–10 | row 4: Orange 7, Orange 8, Orange 9, Orange 10 |
| Orange 1–3 | row 4: Orange 1, Orange 2, Orange 3 |
| Black/Blue/Orange 4 | row 1: Black 4; row 3: Blue 4; row 4: Orange 4 |
| Blue/Orange/Red 4 | row 2: Red 4; rack: Blue 4, Orange 4 |
| Black/Orange/Red 5 | row 1: Black 5; row 2: Red 5; row 4: Orange 5 |
| Blue/Orange/Red 5 | row 3: Blue 5; rack: Orange 5, Red 5 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **64** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-longer-interior` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S4-09 — answer and reasoning (spoilers)</summary>

**Groups to runs.** Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue 2–7 | row 1: Blue 5; row 2: Blue 4; row 3: Blue 3; row 4: Blue 6; rack: Blue 2, Blue 7 |
| Black 1–8 | row 1: Black 5; row 2: Black 4; row 3: Black 3; row 4: Black 6; rack: Black 1, Black 2, Black 7, Black 8 |
| Orange 3–6 | row 1: Orange 5; row 2: Orange 4; row 3: Orange 3; row 4: Orange 6 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **8** face-level completion(s) and **8** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-groups-to-runs` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S4-10 — answer and reasoning (spoilers)</summary>

**Interior extraction.** Original run tiles enter shared groups while long fragments survive as separate runs. The gaps and the group partners must be considered together; this is a connected rearrangement rather than independent end donations.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Blue/Red 4 | row 1: Blue 4; row 2: Black 4; row 3: Red 4 |
| Black/Orange/Red 4 | row 4: Orange 4; rack: Black 4, Red 4 |
| Red 1–3 | row 3: Red 1, Red 2, Red 3 |
| Red 7–9 | row 3: Red 7, Red 8, Red 9 |
| Black/Orange/Red 6 | row 2: Black 6; row 3: Red 6; row 4: Orange 6 |
| Blue/Orange/Red 6 | row 1: Blue 6; rack: Orange 6, Red 6 |
| Black/Blue/Red 5 | row 1: Blue 5; row 2: Black 5; row 3: Red 5 |
| Blue/Orange/Red 5 | row 4: Orange 5; rack: Blue 5, Red 5 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **64** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-interior-extraction` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S4-12 — answer and reasoning (spoilers)</summary>

**Interior extraction.** Original run tiles enter shared groups while long fragments survive as separate runs. The gaps and the group partners must be considered together; this is a connected rearrangement rather than independent end donations.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Blue/Red 8 | row 1: Red 8; row 2: Black 8; row 3: Blue 8 |
| Blue/Orange/Red 8 | row 4: Orange 8; rack: Blue 8, Red 8 |
| Blue 9–11 | row 3: Blue 9, Blue 10, Blue 11 |
| Blue 3–5 | row 3: Blue 3, Blue 4, Blue 5 |
| Blue/Orange/Red 6 | row 1: Red 6; row 3: Blue 6; row 4: Orange 6 |
| Black/Blue/Orange 6 | row 2: Black 6; rack: Blue 6, Orange 6 |
| Black/Blue/Red 7 | row 1: Red 7; row 2: Black 7; row 3: Blue 7 |
| Black/Blue/Orange 7 | row 4: Orange 7; rack: Black 7, Blue 7 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **1** face-level completion(s) and **64** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-interior-extraction` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S4-13 — answer and reasoning (spoilers)</summary>

**Mixed exchange.** Use original group tiles to repair runs while original run tiles help make groups in the same connected component. Both directions matter; a legal rack extension alone does not complete the repair.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Blue/Red 6 | row 3: Red 6; rack: Black 6, Blue 6 |
| Red 3–5 | row 3: Red 5; rack: Red 3, Red 4 |
| Red 7–11 | row 1: Red 8; row 2: Red 9; row 3: Red 7; row 4: Red 10; rack: Red 11 |
| Blue 8–11 | row 1: Blue 8; row 2: Blue 9; row 4: Blue 10; rack: Blue 11 |
| Black 8–11 | row 1: Black 8; row 2: Black 9; row 4: Black 10; rack: Black 11 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **2** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Red 4 into row 3. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `expert-mixed-exchange` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S4-14 — answer and reasoning (spoilers)</summary>

**Split and join.** Some extracted tiles make groups, leaving a short original run contribution. Repair that contribution by joining it to tiles from another changed run. The source/final contribution table below shows the linked repair; it does not prescribe a forced editing order.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue/Orange/Red 1 | row 5: Orange 1; rack: Blue 1, Red 1 |
| Black/Orange/Red 8 | row 1: Black 8; row 2: Orange 8; row 4: Red 8 |
| Black/Blue/Orange 8 | row 3: Blue 8; rack: Black 8, Orange 8 |
| Orange 2–4 | row 2: Orange 4; row 5: Orange 2, Orange 3 |
| Orange 5–7 | row 2: Orange 5, Orange 6, Orange 7 |
| Orange 11–13 | row 2: Orange 11, Orange 12, Orange 13 |
| Black/Blue/Orange 10 | row 1: Black 10; row 2: Orange 10; row 3: Blue 10 |
| Blue/Orange/Red 10 | row 4: Red 10; rack: Blue 10, Orange 10 |
| Black/Orange/Red 9 | row 1: Black 9; row 2: Orange 9; row 4: Red 9 |
| Blue/Orange/Red 9 | row 3: Blue 9; rack: Orange 9, Red 9 |

The rack is empty. This answer changes exactly **5** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **128** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-longer-split-join` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S4-15 — answer and reasoning (spoilers)</summary>

**Mixed exchange.** Use original group tiles to repair runs while original run tiles help make groups in the same connected component. Both directions matter; a legal rack extension alone does not complete the repair.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Blue/Orange/Red 4 | row 4: Red 4; rack: Blue 4, Orange 4 |
| Red 1–3 | row 4: Red 3; rack: Red 1, Red 2 |
| Red 5–9 | row 1: Red 6; row 2: Red 7; row 3: Red 8; row 4: Red 5; rack: Red 9 |
| Orange 6–9 | row 1: Orange 6; row 2: Orange 7; row 3: Orange 8; rack: Orange 9 |
| Blue 6–9 | row 1: Blue 6; row 2: Blue 7; row 3: Blue 8; rack: Blue 9 |

The rack is empty. This answer changes exactly **4** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **2** physical-copy partitions; copy permutations are not counted as extra human ideas.

A tempting initial placement is Red 2 into row 4. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.

The answer is transported from the independently hand-reviewed `expert-mixed-exchange` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

<details>
<summary>S4-16 — answer and reasoning (spoilers)</summary>

**Combined repair.** Keep a three-tile core of the four-colour donor group and send its fourth tile to a changed run. That same source run also needs interior rebuilding with two surviving long cores and an intervening tile entering a group. The donation and interior repair are linked, not separate chores.

A complete hand-derived final board, with the sources of its exact physical tiles:

| Final row | Tiles taken from original rows and rack |
| --- | --- |
| Black/Orange/Red 3 | row 2: Black 3, Orange 3, Red 3 |
| Blue/Orange/Red 8 | row 3: Orange 8; row 4: Red 8; row 5: Blue 8 |
| Black/Blue/Red 8 | row 1: Black 8; rack: Blue 8, Red 8 |
| Blue 2–4 | row 2: Blue 3; row 5: Blue 4; rack: Blue 2 |
| Blue 5–7 | row 5: Blue 5, Blue 6, Blue 7 |
| Blue 11–13 | row 5: Blue 11, Blue 12, Blue 13 |
| Black/Blue/Red 10 | row 1: Black 10; row 4: Red 10; row 5: Blue 10 |
| Black/Blue/Orange 10 | row 3: Orange 10; rack: Black 10, Blue 10 |
| Blue/Orange/Red 9 | row 3: Orange 9; row 4: Red 9; row 5: Blue 9 |
| Black/Blue/Orange 9 | row 1: Black 9; rack: Blue 9, Orange 9 |

The rack is empty. This answer changes exactly **5** original rows. Independent exhaustive checking finds **2** face-level completion(s) and **128** physical-copy partitions; copy permutations are not counted as extra human ideas.

The answer is transported from the independently hand-reviewed `expert-longer-combined-repair` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.

</details>

## Verification and user acceptance

The native checker re-generates all 71 exact outputs twice, validates each reviewed physical solution and minimum `R`, checks the certified mechanism, verifies every transport against the original fixture rows/rack, confirms all 19 tier/family pairings and all four unchanged sequences, and now checks approved default revision 6. It passed 3,499 assertions again after the default switch. The independent physical oracle audits every review inventory and solution using both enumeration paths; evidence is in [revision-6-sample-audit.json](revision-6-sample-audit.json).

```bash
node plans/checks/review_v6_samples.mjs
PYTHONDONTWRITEBYTECODE=1 python3 plans/checks/review_v6_samples.py
```

The user reported “We've tested. All good.” on 2026-10-12, accepting the family/sequence review without further tuning. This is overall acceptance; no per-puzzle results or timings were supplied. The plan review item is complete. The separate verified revision-6 default switch is now complete; no runtime change was made to record approval itself.
