"""Prepare review replays and transport independently hand-derived fixture solutions.
Usage: PYTHONDONTWRITEBYTECODE=1 python3 plans/checks/prepare_v6_samples.py <native-samples.json>
No production solver witness is used as the review solution.
"""
import json
import sys
from itertools import permutations
from pathlib import Path
from review_v6_patterns import face, kind

ROOT = Path(__file__).parents[2]
COLOURS = ('black', 'blue', 'red', 'orange')
SELECTION = [
    ('E1', 'easy-run-donation'), ('E2', 'easy-group-donation'), ('E3', 'easy-run-division'),
    ('M1', 'medium-interior-extraction'), ('M2', 'medium-longer-split-join'),
    ('M3', 'medium-groups-to-runs'), ('M4', 'medium-runs-to-groups'), ('M5', 'medium-mixed-group-donation'),
    ('H1', 'hard-interior-extraction'), ('H2', 'hard-split-and-join'), ('H3', 'hard-four-colour-group-only'),
    ('H4', 'hard-runs-to-groups'), ('H5', 'hard-mixed-exchange'),
    ('X1', 'expert-interior-extraction'), ('X2', 'expert-split-and-join'), ('X3', 'expert-five-group-conversion'),
    ('X4', 'expert-runs-to-groups'), ('X5', 'expert-mixed-exchange'), ('X6', 'expert-compact-combined-repair'),
    ('E4', 'easy-both-ends'), ('E5', 'easy-group-middle-donation'), ('H6', 'hard-duplicate-choice'),
    ('X7', 'expert-duplicate-choice'), ('X8', 'expert-longer-combined-repair'),
]

def transport(design, puzzle):
    """Find colour/reflection/translation, row permutation and face-wide copy bijection.
    Equal-face origins remain distinct; tied rows are explicitly backtracked.
    """
    original = sum(design['board'], []) + design['rack']
    actual = sum(puzzle['board'], []) + puzzle['rack']
    actual_min = min(face(tile)[1] for tile in actual)
    for perm in permutations(COLOURS):
        colour_map = dict(zip(COLOURS, perm))
        for reflected in (False, True):
            offset = actual_min - min(14 - face(tile)[1] if reflected else face(tile)[1] for tile in original)
            def mapped_face(tile):
                colour, value = face(tile)
                return colour_map[colour], (14 - value if reflected else value) + offset
            candidates = []
            for row in design['board']:
                expected = sorted(mapped_face(tile) for tile in row)
                candidates.append([i for i, target in enumerate(puzzle['board'])
                                   if sorted(face(tile) for tile in target) == expected and kind(row) == kind(target)])
            if any(not indices for indices in candidates):
                continue
            def match(at, used, mapping, rows):
                if at < len(candidates):
                    for target_index in candidates[at]:
                        if target_index in used:
                            continue
                        target = {face(tile): tile for tile in puzzle['board'][target_index]}
                        additions = {tile: target[mapped_face(tile)] for tile in design['board'][at]}
                        result = match(at + 1, used | {target_index}, dict(mapping, **additions), rows + [target_index])
                        if result is not None:
                            return result
                    return None
                # A source-face copy swap must be consistent across all origins.
                swaps = {}
                for tile, target in mapping.items():
                    swap = int(tile.rsplit('-', 1)[1]) != int(target.rsplit('-', 1)[1])
                    if face(tile) in swaps and swaps[face(tile)] != swap:
                        return None
                    swaps[face(tile)] = swap
                pending = set(puzzle['rack'])
                for tile in design['rack']:
                    options = sorted(target for target in pending if face(target) == mapped_face(tile)
                                     and (face(tile) not in swaps or
                                          (int(tile.rsplit('-', 1)[1]) != int(target.rsplit('-', 1)[1])) == swaps[face(tile)]))
                    if not options:
                        return None
                    target = options[0]
                    mapping[tile] = target
                    swaps[face(tile)] = int(tile.rsplit('-', 1)[1]) != int(target.rsplit('-', 1)[1])
                    pending.remove(target)
                if pending or len(set(mapping.values())) != len(actual):
                    return None
                return mapping, rows
            matched = match(0, set(), {}, [])
            if matched:
                mapping, rows = matched
                final = [[mapping[tile] for tile in row] for row in design['solution']]
                for row in final:
                    row.sort(key=(lambda tile: face(tile)[1]) if kind(row) == 'run' else None)
                return final, {'fixture': design['name'], 'colourMap': colour_map, 'reflected': reflected,
                               'offset': offset, 'sourceRowMap': rows, 'tileMap': mapping}
    raise AssertionError(('No exact construction symmetry', design['name'], puzzle['seed']))

samples = json.loads(Path(sys.argv[1]).read_text())
designs = {p['name']: p for p in json.loads((ROOT / 'plans/revision-6-patterns.json').read_text())['patterns']}
selected = []
for label, pattern in SELECTION:
    sample = next(s for s in samples if s['result']['puzzle']['rating']['pattern'] == pattern)
    selected.append((label, sample, True))
# Four complete first predeclared 16-seed sequences: no skipping natural repeats.
sequences = []
for tier in range(1, 5):
    codes = []
    for index in range(16):
        seed = f'variety-v6-dev-{index}'
        sample = next(s for s in samples if s['identity']['difficultyTier'] == tier and s['identity']['seed'] == seed)
        code = f'rummipuz:1:6:{tier}:{seed}'
        codes.append(code)
        if not any(s['identity'] == sample['identity'] for _, s, _ in selected):
            selected.append((f'S{tier}-{index + 1:02}', sample, False))
    sequences.append({'tier': tier, 'block': 'dev', 'groupIndex': 0, 'indices': list(range(16)), 'replayCodes': codes})
records = []
for label, sample, featured in selected:
    puzzle = sample['result']['puzzle']
    design = designs[puzzle['rating']['pattern']]
    solution, derivation = transport(design, puzzle)
    records.append({'label': label, 'featured': featured, 'identity': sample['identity'],
                    'replayCode': f"rummipuz:1:6:{puzzle['difficultyTier']}:{puzzle['seed']}",
                    'result': sample['result'], 'handSolution': solution, 'handDerivation': derivation})
output = {'schema': 1, 'purpose': 'Revision-6 pre-release human family/sequence review; feedback pending.',
          'offlineRelease': 'v5', 'defaultRevision': 5,
          'selection': 'First occurrence of each named inventory in the fixed dev-then-holdout native sample; four full first development 16-seed sequences.',
          'samples': records, 'sequences': sequences}
(ROOT / 'plans/revision-6-sample-review.json').write_text(json.dumps(output, indent=2) + '\n')
print(json.dumps({'featured': sum(r['featured'] for r in records), 'distinctReplays': len(records),
                  'sequences': len(sequences), 'handSolutions': 'transported from independent reviewed fixtures'}))
