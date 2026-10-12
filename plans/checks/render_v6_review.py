"""Render the checked review set as a readable Markdown guide with hidden answers."""
import json
from pathlib import Path
from review_v6_patterns import face, kind

ROOT = Path(__file__).parents[2]
data = json.loads((ROOT / 'plans/revision-6-sample-review.json').read_text())
audit = json.loads((ROOT / 'plans/revision-6-sample-audit.json').read_text())
by_code = {r['replayCode']: r for r in audit['results']}
by_sample = {r['replayCode']: r for r in data['samples']}
TIERS = {1: 'Easy', 2: 'Medium', 3: 'Hard', 4: 'Expert'}
NAMES = {'run-donation': 'Run endpoint donation', 'group-donation': 'Four-colour-group donation',
         'run-division': 'Run division', 'interior-extraction': 'Interior extraction',
         'split-and-join': 'Split and join', 'groups-to-runs': 'Groups to runs',
         'runs-to-groups': 'Runs to groups', 'mixed-exchange': 'Mixed exchange', 'combined-repair': 'Combined repair'}
IDEAS = {
 'run-donation': 'Move the indicated end tile(s) out of the original run into groups with rack partners, leaving one valid original run core. Both-end donation is the same family with two exports; judge whether it still feels introductory.',
 'group-donation': 'Keep three original group tiles together. Use its fourth tile with rack neighbours to make a same-colour run. Compare donating to the end of the new run with filling its middle.',
 'run-division': 'Divide the original run into two contiguous source fragments and supply their missing neighbours from the rack. Equal faces belong to distinct physical tiles: a rack copy completes one run while the original copy belongs to the other.',
 'interior-extraction': 'Original run tiles enter shared groups while long fragments survive as separate runs. The gaps and the group partners must be considered together; this is a connected rearrangement rather than independent end donations.',
 'split-and-join': 'Some extracted tiles make groups, leaving a short original run contribution. Repair that contribution by joining it to tiles from another changed run. The source/final contribution table below shows the linked repair; it does not prescribe a forced editing order.',
 'groups-to-runs': 'Break the indicated original groups and collect same-colour tiles into runs. Rack endpoints and duplicate allocations constrain which runs can be completed. Support rows may stay intact; they do not earn extra difficulty.',
 'runs-to-groups': 'Break the indicated original runs and regroup equal values across colours. Repeated faces must be assigned to separate valid groups, with rack partners completing the missing colours.',
 'mixed-exchange': 'Use original group tiles to repair runs while original run tiles help make groups in the same connected component. Both directions matter; a legal rack extension alone does not complete the repair.',
 'combined-repair': 'Keep a three-tile core of the four-colour donor group and send its fourth tile to a changed run. That same source run also needs interior rebuilding with two surviving long cores and an intervening tile entering a group. The donation and interior repair are linked, not separate chores.',
}

def tile_list(row):
    return ', '.join(f'{colour.title()} {value}' for colour, value in map(face, row))

def describe(row):
    if kind(row) == 'run':
        colour, low = face(row[0]); high = face(row[-1])[1]
        return f'{colour.title()} {low}–{high}'
    if kind(row) == 'group':
        return '/'.join(colour.title() for colour, _ in sorted(map(face, row))) + f' {face(row[0])[1]}'
    return tile_list(row)

def answer(sample, featured=True):
    p, final = sample['result']['puzzle'], sample['handSolution']
    evidence = by_code[sample['replayCode']]
    lines = [f'<details>\n<summary>{sample["label"]} — answer and reasoning (spoilers)</summary>\n',
             f'**{NAMES[p["rating"]["family"]["primary"]]}.** {IDEAS[p["rating"]["family"]["primary"]]}\n']
    if featured:
        lines += ['Starting rows (numbered as displayed when the replay opens):\n']
        lines += [f'{i + 1}. {describe(row)}' for i, row in enumerate(p['board'])]
        lines += [f'\nRack: {tile_list(p["rack"])}.\n']
    lines += ['A complete hand-derived final board, with the sources of its exact physical tiles:\n',
              '| Final row | Tiles taken from original rows and rack |', '| --- | --- |']
    for target in final:
        contributions = []
        for i, source in enumerate(p['board']):
            part = [tile for tile in target if tile in source]
            if part:
                contributions.append(f'row {i + 1}: {tile_list(part)}')
        rack = [tile for tile in target if tile in p['rack']]
        if rack:
            contributions.append('rack: ' + tile_list(rack))
        lines.append(f'| {describe(target)} | ' + '; '.join(contributions) + ' |')
    lines += [f'\nThe rack is empty. This answer changes exactly **{evidence["minimumR"]}** original rows. Independent exhaustive checking finds **{evidence["facePartitions"]}** face-level completion(s) and **{evidence["physicalPartitions"]}** physical-copy partitions; copy permutations are not counted as extra human ideas.\n']
    if evidence['deadPreservedPlacements']:
        placement = evidence['deadPreservedPlacements'][0]
        colour, value = face(placement['tile'])
        lines += [f'A tempting initial placement is {colour.title()} {value} into row {placement["row"] + 1}. No complete solution keeps that whole extended row intact. You may still place it temporarily and later rearrange it; this is a preservation constraint, not a losing move.\n']
    if sample['label'] in ('H6', 'X7'):
        lines += ['This is the duplicate-choice comparison. Use the row provenance above to distinguish equal-looking tiles, and compare the choice with the corresponding pure group-conversion sample. Copies and support rows do not create another family.\n']
    lines += [f'The answer is transported from the independently hand-reviewed `{sample["handDerivation"]["fixture"]}` inventory. Exact IDs, the colour/value/copy bijection and the full source-row map are in the review JSON. The solution was not taken from the generator’s first solver witness.\n', '</details>\n']
    return '\n'.join(lines)

lines = ['# Revision-6 family and sequence review\n',
'''**Status:** Prepared on 12 October 2026; user feedback and approval pending. Revision 5 remains the default. No runtime or offline-package change is made by this review step, and no commit or agent-side browser use. The preceding native/laptop/tablet variety and preparation checks passed.

This guide has **19 tier/family samples**, **five additional variant comparisons**, and **four fixed consecutive 16-puzzle sequences**. The [exact review data](revision-6-sample-review.json) contains 71 distinct full replay identities, saved generated results, independently derived physical solutions and their provenance. Shared samples are stored once. This is a deliberate family/overlay review, not another frequency survey.

Use **Replay puzzle** to paste a full code below. Start and Next continue to generate revision 5; they will not select these review samples. Use the tuned offline release `v5`, with no waiting update. Ordinary replay uses the existing session replacement confirmation, local saving and completion credit. Copy your current code before replacing it if you want to return to its initial puzzle; a code does not preserve an unfinished layout or undo history.

Play the main samples **E1–E3, M1–M5, H1–H5 and X1–X6** first, keeping answers closed. E4/E5, H6 and X7/X8 compare important variants. For sequence review, start with the first four consecutive codes in each tier; the complete fixed 16-code sequences are provided for a longer comparison. Preserve their order and include repeats. There is no solving-time limit. Undo, resets, getting stuck, and apparently repetitive puzzles are useful observations.

Feedback should address whether the three Easy mechanisms stay approachable; whether higher-tier families require different ideas; whether duplicate/competing-placement examples are meaningful; and whether consecutive same-tier puzzles feel repetitive. Formal gates and preparation performance do not answer those questions. Approval is required before this step completes and before the later default switch.
''', '## Main samples and variant comparisons\n',
'Family labels and explanations are hidden below so the code table does not reveal the solution mechanism.\n',
'| Label | Tier | Full replay code | Rack / starting rows |', '| --- | --- | --- | --- |']
featured = [sample for sample in data['samples'] if sample['featured']]
for sample in featured:
    p = sample['result']['puzzle']
    lines.append(f'| {sample["label"]} | {TIERS[p["difficultyTier"]]} | `{sample["replayCode"]}` | {len(p["rack"])} / {len(p["board"])} |')
lines += ['\n<details>\n<summary>Coverage checklist (reveals family names)</summary>\n',
          '| Labels | What to compare |', '| --- | --- |',
          '| E1 / E4 | One-end versus both-end run donation; whether the latter remains approachable. |',
          '| E2 / E5 | Four-colour group donation to a new run’s end versus middle. |',
          '| E3 | Simple run division with overlapping values and distinct copies. |',
          '| M1–M5 | Interior extraction, split/join, groups→runs, runs→groups, optional mixed exchange. M2 has multiple face completions. |',
          '| H1–H5 | The same four higher-tier mechanisms plus mixed exchange, all with connected three-row work. H3 begins entirely with groups. |',
          '| H6 | Duplicate-choice groups→runs, compared with H3. |',
          '| X1–X6 | Interior extraction, split/join, groups→runs, runs→groups, mixed exchange, necessary combined repair. X3 changes five original groups; X6 is a compact four-row repair. |',
          '| X7 / X8 | Duplicate-choice group conversion and a longer combined repair with multiple completions. Compare with X3 / X6. |',
          '\nNo variant adds another family. Starting runs, groups and mixed boards, unique/multiple completions, duplicates and competing rack placements are represented.\n</details>\n',
          '## Fixed same-tier sequences\n',
'''These are the **first 16 development seeds (0–15)** at each tier, selected before inspecting whether they repeat. None is replaced for convenience or family coverage. The full verification evidence contains the other 15 predeclared sequences per block/tier. Reviewing these four sequences complements the deliberately selected individual examples.
''']
for sequence in data['sequences']:
    tier = sequence['tier']
    lines += [f'<details>\n<summary>{TIERS[tier]} — 16 consecutive replay codes</summary>\n',
              '| Order | Full replay code | Answer label |', '| --- | --- | --- |']
    for i, code in enumerate(sequence['replayCodes']):
        lines.append(f'| {i + 1} | `{code}` | {by_sample[code]["label"]} |')
    lines += ['\n</details>\n']
lines += ['## Starting layouts and hand-derived answers — spoilers\n',
'''Every answer below conserves all physical tiles, leaves valid ascending runs/groups, and attains the proved minimum rearrangement. Take duplicate faces from the named source row; exact copy IDs are available in the JSON. Higher-tier family credit comes from all minimum solutions and tier gates cover all complete solutions, not just these examples. These answers show one valid route without claiming a forced temporal editing order.
''']
for sample in featured:
    lines.append(answer(sample))
lines += ['## Remaining sequence answers — spoilers\n',
          'Samples already featured above use that answer. Other sequence answers follow; read the initial board directly from the replay and use its numbered original rows.\n']
for sample in data['samples']:
    if not sample['featured']:
        lines.append(answer(sample, False))
lines += ['## Verification and pending review\n',
'''The native checker re-generates all 71 exact outputs twice, validates each reviewed physical solution and minimum `R`, checks the certified mechanism, verifies every transport against the original fixture rows/rack, confirms all 19 tier/family pairings and all four unchanged sequences, and retains default revision 5. It passed 3,499 assertions. The independent physical oracle audits every review inventory and solution using both enumeration paths; evidence is in [revision-6-sample-audit.json](revision-6-sample-audit.json).

```bash
node plans/checks/review_v6_samples.mjs
PYTHONDONTWRITEBYTECODE=1 python3 plans/checks/review_v6_samples.py
```

Preparation and native correctness are complete; human family/sequence acceptance remains pending. Record feedback here before checking the plan item. If tuning is requested, update the specification/contract as needed, regenerate affected review codes and solutions, reprove the candidates, and rerun the relevant full quota blocks and regressions. Keep revision 5 as default until user approval and the separate default-switch step.
''']
rendered = '\n'.join(lines)
if data.get('review', {}).get('status') == 'approved':
    review = data['review']
    rendered = rendered.replace('**Status:** Prepared on 12 October 2026; user feedback and approval pending.',
                                f"**Status:** Complete. User approval recorded on {review['date']}: “{review['feedback']}” No tuning was requested.")
    rendered = rendered.replace('Approval is required before this step completes and before the later default switch.',
                                'The user has approved this review. The default switch remains a separate step.')
    rendered = rendered.replace('## Verification and pending review', '## Verification and user acceptance')
    rendered = rendered.replace('Preparation and native correctness are complete; human family/sequence acceptance remains pending. Record feedback here before checking the plan item. If tuning is requested, update the specification/contract as needed, regenerate affected review codes and solutions, reprove the candidates, and rerun the relevant full quota blocks and regressions. Keep revision 5 as default until user approval and the separate default-switch step.',
                                f"The user reported “{review['feedback']}” on {review['date']}, accepting the family/sequence review without further tuning. This is overall acceptance; no per-puzzle results or timings were supplied. The plan review item is complete. Revision 5 remains default until the separate verified default-switch step; no runtime change was made to record approval.")
# This completed guide lives in the archive; check data keep their stable paths.
rendered = rendered.replace('](revision-6-sample-review.json)', '](../revision-6-sample-review.json)')
rendered = rendered.replace('](revision-6-sample-audit.json)', '](../revision-6-sample-audit.json)')
heading, body = rendered.split('\n', 1)
rendered = heading + '\n\n> Historical record archived on 12 October 2026. Status, next-step instructions and release numbers below describe the work at the time. Use the [current implementation plan](../rummipuz-implementation.md) for remaining work.\n' + body
(ROOT / 'plans/archive').mkdir(exist_ok=True)
(ROOT / 'plans/archive/rummipuz-revision-6-sample-review.md').write_text(rendered)
