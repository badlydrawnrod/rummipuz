"""Independent exhaustive audit of revision-6 physical design fixtures.

No production JavaScript is used. The plain revision-5 Python enumerator is
retained as a second enumeration path for differential checks.
"""
import argparse
import hashlib
import json
from collections import Counter
from itertools import combinations, permutations, product
from pathlib import Path

from review_v5_patterns import face, kind, features, partitions

COLOURS = ('black', 'blue', 'red', 'orange')
BOUNDS = {1: (2, 5, 2, 5), 2: (3, 6, 3, 6), 3: (4, 8, 4, 7), 4: (4, 10, 4, 9)}
PRIORITY = ('combined-repair', 'mixed-exchange', 'linked-group-donation', 'groups-to-runs',
            'runs-to-groups', 'interior-extraction', 'split-and-join', 'boundary-repair')
EASY_PRIORITY = ('run-donation', 'group-donation', 'run-division')


def ordered(row):
    return sorted(row, key=lambda t: face(t)[1]) if kind(row) == 'run' else sorted(row)


def solution_structure(board, final):
    targets = [set(row) for row in final]
    changed = [i for i, row in enumerate(board)
               if not any(set(row) <= target and kind(row) == kind(target) for target in targets)]
    # The existing independent oracle's one-source endpoint test retains all
    # physical IDs. Applying it source by source gives the exact N membership.
    advanced = {i for i in changed if features([board[i]], targets)[2]}
    neighbours = {i: set() for i in changed}
    for target in targets:
        sources = [i for i in changed if set(board[i]) & target]
        for first, second in combinations(sources, 2):
            neighbours[first].add(second)
            neighbours[second].add(first)
    unseen, components = set(changed), []
    while unseen:
        pending, component = [min(unseen)], set()
        while pending:
            source = pending.pop()
            if source in component:
                continue
            component.add(source)
            pending.extend(neighbours[source] - component)
        unseen -= component
        components.append(component)
    return changed, advanced, components


def has_interior_export(source, targets, target_kinds):
    cores = [j for j, target in enumerate(targets)
             if target_kinds[j] == 'run' and len(set(source) & target) >= 3
             and consecutive(source, set(source) & target)]
    for first, second in combinations(cores, 2):
        positions = sorted(([source.index(tile) for tile in set(source) & targets[first]],
                            [source.index(tile) for tile in set(source) & targets[second]]), key=min)
        middle = source[max(positions[0]) + 1:min(positions[1])]
        if any(tile in target and target_kinds[j] == 'group'
               for tile in middle for j, target in enumerate(targets)):
            return True
    return False


def mechanisms(board, final, tier):
    _, advanced, components = solution_structure(board, final)
    targets = [set(row) for row in final]
    target_kinds = [kind(row) for row in targets]
    found = set()
    for component in components:
        if len(component) < tier or len(component & advanced) < tier - 1:
            continue
        sources = sorted(component)
        source_kinds = {kind(board[i]) for i in sources}
        contributions = [[set(board[i]) & target for target in targets] for i in sources]
        joined = any(target_kinds[j] == 'run' and sum(bool(row[j]) for row in contributions) >= 2
                     for j in range(len(targets)))
        split = any(sum(bool(part) for part in row) >= 2 for row in contributions)
        short_join = any(target_kinds[j] == 'run'
                         and sum(bool(row[j]) for row in contributions) >= 2
                         and any(1 <= len(contributions[at][j]) <= 2
                                 and consecutive(board[i], contributions[at][j])
                                 for at, i in enumerate(sources))
                         for j in range(len(targets)))
        all_runs = all(not row[j] or target_kinds[j] == 'run'
                       for row in contributions for j in range(len(targets)))
        all_groups = all(not row[j] or target_kinds[j] == 'group'
                         for row in contributions for j in range(len(targets)))
        if source_kinds == {'group'} and all_runs:
            found.add('groups-to-runs')
        if source_kinds == {'run'}:
            if all_groups:
                found.add('runs-to-groups')
            if split and joined and short_join:
                found.add('split-and-join')
            if split and joined and all_runs:
                found.add('boundary-repair')
            if not joined and any(has_interior_export(board[i], targets, target_kinds) for i in sources):
                found.add('interior-extraction')
        if source_kinds == {'group', 'run'}:
            group_to_run = any(kind(board[i]) == 'group' and target_kinds[j] == 'run'
                               and set(board[i]) & target for i in sources for j, target in enumerate(targets))
            run_to_group = any(kind(board[i]) == 'run' and target_kinds[j] == 'group'
                               and set(board[i]) & target for i in sources for j, target in enumerate(targets))
            if group_to_run and run_to_group:
                found.add('mixed-exchange')
        for i in sources:
            source = set(board[i])
            if kind(source) != 'group' or len(source) != 4:
                continue
            for core_index, retained in enumerate(targets):
                if target_kinds[core_index] != 'group' or len(source & retained) != 3:
                    continue
                donor = source - retained
                receivers = [j for j, target in enumerate(targets)
                             if target_kinds[j] == 'run' and donor <= target
                             and any(other != i and set(board[other]) & target for other in sources)]
                if receivers:
                    found.add('linked-group-donation')
                if len(retained) != 3:
                    continue
                # The same run receiving the donated tile must also have the
                # two surviving long cores and an intervening export to groups.
                if any(kind(board[other]) == 'run' and set(board[other]) & targets[j]
                       and has_interior_export(board[other], targets, target_kinds)
                       for j in receivers for other in sources):
                    found.add('combined-repair')
    return found


def consecutive(source, subset):
    positions = [i for i, tile in enumerate(source) if tile in subset]
    return bool(positions) and positions == list(range(positions[0], positions[-1] + 1))


def easy_mechanisms(board, rack, final):
    changed, _, _ = solution_structure(board, final)
    if len(changed) != 1:
        return set()
    source_index = changed[0]
    source = board[source_index]
    source_set, rack_set = set(source), set(rack)
    targets = [set(row) for row in final]
    # Other sources stay separate, with only rack additions.
    for i, row in enumerate(board):
        if i == source_index:
            continue
        if not any(set(row) <= target and kind(row) == kind(target)
                   and target - set(row) <= rack_set for target in targets):
            return set()
    active = [target for target in targets if target & source_set]
    if any(target - source_set - rack_set for target in active):
        return set()
    found = set()
    if kind(source) == 'run':
        for target in active:
            core = target & source_set
            exported = source_set - core
            allowed_exports = [{source[0]}, {source[-1]}, {source[0], source[-1]}]
            if (kind(target) == 'run' and len(core) >= 3
                    and consecutive(source, core) and exported in allowed_exports):
                exports = [row for row in active if row != target]
                if (len(exports) == len(exported)
                        and all(kind(row) == 'group' and len(row & source_set) == 1
                                and row & source_set <= exported
                                and 2 <= len(row & rack_set) <= 3 for row in exports)):
                    found.add('run-donation')
        if len(active) == 2 and all(kind(row) == 'run' for row in active):
            for cut in range(2, len(source) - 1):
                prefix, suffix = set(source[:cut]), set(source[cut:])
                if ({frozenset(row & source_set) for row in active}
                        == {frozenset(prefix), frozenset(suffix)}
                        and any(row & rack_set for row in active)):
                    found.add('run-division')
    elif len(source) == 4 and len(active) == 2:
        for retained in active:
            if kind(retained) != 'group' or len(retained) != 3 or not retained <= source_set:
                continue
            other = next(row for row in active if row != retained)
            if kind(other) == 'run' and len(other & source_set) == 1 and len(other & rack_set) >= 2:
                found.add('group-donation')
    return found


class ExplorationLimit(Exception):
    """Only bounded exploratory calls use this; release fixture audits do not."""


def mask_partitions(inventory, max_nodes=None):
    """Exact physical cover with integer masks; no pruning by face counts."""
    tiles = sorted(inventory)
    indices = {tile: i for i, tile in enumerate(tiles)}
    copies = {}
    for tile in tiles:
        copies.setdefault(face(tile), []).append(tile)
    shapes = []
    for colour in COLOURS:
        for start in range(1, 12):
            for end in range(start + 2, 14):
                faces = [(colour, value) for value in range(start, end + 1)]
                if all(f in copies for f in faces):
                    shapes.append(faces)
    for value in range(1, 14):
        faces = sorted(f for f in copies if f[1] == value)
        for size in (3, 4):
            shapes.extend(combinations(faces, size))
    rows = sorted({frozenset(ids) for shape in shapes
                   for ids in product(*(copies[f] for f in shape))},
                  key=lambda row: tuple(sorted(row)))
    candidates = [(sum(1 << indices[tile] for tile in row), row) for row in rows]
    by_tile = [[item for item in candidates if item[0] & (1 << i)] for i in range(len(tiles))]
    nodes = 0

    def search(remaining, chosen):
        nonlocal nodes
        if max_nodes is not None and nodes >= max_nodes:
            raise ExplorationLimit
        nodes += 1
        if remaining == 0:
            yield chosen
            return
        choices = None
        for i in range(len(tiles)):
            if not remaining & (1 << i):
                continue
            eligible = [item for item in by_tile[i] if item[0] & remaining == item[0]]
            if not eligible:
                return
            if choices is None or len(eligible) < len(choices):
                choices = eligible
        for mask, row in choices:
            yield from search(remaining ^ mask, chosen + [row])

    return search((1 << len(tiles)) - 1, []), lambda: nodes


def encoded(value):
    return json.dumps(value, separators=(',', ':'), ensure_ascii=True)


def semantic_keys(board, rack, final=None):
    """Literal 48-transform/tied-source definition from the specification."""
    inventory = sum(board, []) + rack
    origins = {tile: i for i, row in enumerate(board) for tile in row}
    best_start, best_joint, best_mapping, best_final = None, None, None, None
    for colours in permutations(COLOURS):
        colour_map = dict(zip(COLOURS, colours))
        for reflected in (False, True):
            values = [14 - face(tile)[1] if reflected else face(tile)[1] for tile in inventory]
            minimum = min(values)
            mapped = {tile: (colour_map[face(tile)[0]], value - minimum + 1)
                      for tile, value in zip(inventory, values)}

            def row_faces(row):
                faces = [mapped[tile] for tile in row]
                return sorted(faces, key=lambda f: f[1]) if kind(row) == 'run' else sorted(faces)

            source_rows = [encoded([kind(row), row_faces(row)]) for row in board]
            sorted_sources = sorted(source_rows)
            start = ['start-v1', [json.loads(row) for row in sorted_sources],
                     sorted(mapped[tile] for tile in rack)]
            start_key = encoded(start)
            if best_start is None or start_key < best_start:
                best_start = start_key
            if final is None:
                continue
            tied = []
            for source_encoding in sorted(set(source_rows)):
                slots = [i for i, row in enumerate(sorted_sources) if row == source_encoding]
                sources = [i for i, row in enumerate(source_rows) if row == source_encoding]
                tied.append([dict(zip(sources, assignment)) for assignment in permutations(slots)])
            for assignments in product(*tied):
                index_map = {source: target for assignment in assignments for source, target in assignment.items()}
                final_rows = []
                for row in final:
                    tiles = [[*mapped[tile], f'row:{index_map[origins[tile]]}' if tile in origins else 'rack']
                             for tile in row]
                    tiles.sort(key=(lambda tile: tile[1]) if kind(row) == 'run' else None)
                    final_rows.append([kind(row), tiles])
                final_rows.sort(key=encoded)
                joint = encoded(['origin-v1', start, final_rows])
                if best_joint is None or joint < best_joint:
                    best_joint, best_mapping, best_final = joint, index_map, final_rows
    return best_start, best_joint, best_mapping, best_final


def profile(board, final, tier, tags, mapping, canonical_final):
    changed, advanced, components = solution_structure(board, final)
    canonical_changed = {f'row:{mapping[i]}' for i in changed}
    counts = [Counter(tile[2] for tile in row[1] if tile[2].startswith('row:'))
              for row in canonical_final]
    contributions = [[int(source.split(':')[1]), j, count]
                     for j, row in enumerate(counts) for source, count in sorted(row.items())]
    splitting = sum(sum(f'row:{mapping[i]}' in row for row in counts) >= 2 for i in changed)
    joining = sum(len(set(row) & canonical_changed) >= 2 for row in counts)
    return {'predicates': sorted(tags), 'changedKinds': dict(sorted(Counter(kind(board[i]) for i in changed).items())),
            'components': sorted([[len(comp), len(comp & advanced)] for comp in components]),
            'contributions': contributions, 'splittingSources': splitting, 'joiningTargets': joining,
            'directions': sorted({f'{kind(board[i])}-to-{kind(row)}' for i in changed for row in final
                                  if set(board[i]) & set(row)})}


def partition_key(final):
    return frozenset(frozenset(row) for row in final)


def audit(pattern, differential=True, signatures=True):
    board, rack, tier = pattern['board'], pattern['rack'], pattern['difficultyTier']
    tiles = sum(board, []) + rack
    assert tiles and len(tiles) == len(set(tiles)), (pattern['name'], 'physical inventory')
    for tile in tiles:
        face(tile)
    assert all(kind(row) for row in board), (pattern['name'], 'starting row validity')
    assert all(kind(row) != 'run' or row == ordered(row) for row in board), 'Starting run order'
    lo_rack, hi_rack, lo_rows, hi_rows = BOUNDS[tier]
    fits = lo_rack <= len(rack) <= hi_rack and lo_rows <= len(board) <= hi_rows
    generated, nodes = mask_partitions(tiles)
    finals = list(generated)
    if differential:
        plain = list(partitions(tiles)[0])
        assert {partition_key(final) for final in finals} == {partition_key(final) for final in plain}, 'Enumeration disagreement'
    if pattern.get('solution') is not None:
        witness = pattern['solution']
        assert all(kind(row) for row in witness), 'Witness row validity'
        assert all(kind(row) != 'run' or row == ordered(row) for row in witness), 'Witness run order'
        assert Counter(sum(witness, [])) == Counter(tiles), 'Witness conservation'
        assert partition_key(witness) in {partition_key(final) for final in finals}, 'Witness absent'
    elif pattern.get('expectedStatus', 'accepted') == 'accepted':
        raise AssertionError('Accepted fixture requires an explicit solution')
    structures = [solution_structure(board, final) for final in finals]
    minimum = min((len(changed) for changed, _, _ in structures), default=None)
    minimum_finals = [final for final, (changed, _, _) in zip(finals, structures) if len(changed) == minimum]
    tags = [easy_mechanisms(board, rack, final) if tier == 1 else mechanisms(board, final, tier)
            for final in minimum_finals]
    common = set.intersection(*tags) if tags else set()
    union = set.union(*tags) if tags else set()
    # Easy is existential and uses the first predicate with any witness.
    certified = union if tier == 1 else common
    family = next((name for name in (EASY_PRIORITY if tier == 1 else PRIORITY) if name in certified), None)
    bad = [final for final, (_, advanced, comps) in zip(finals, structures)
           if tier > 1 and not any(len(comp) >= tier and len(comp & advanced) >= tier - 1 for comp in comps)]
    if not fits:
        status = 'bounds-rejection'
    elif not finals:
        status = 'unsolvable'
    elif minimum != tier and not (tier == 4 and minimum >= 4):
        status = 'wrong-tier'
    elif bad or (tier == 1 and not family):
        status = 'structural-rejection'
    elif not family:
        status = 'family-rejection'
    else:
        status = 'accepted'
    assert status == pattern.get('expectedStatus', 'accepted'), (pattern['name'], status, minimum, len(bad), family)
    if status == 'accepted':
        assert family == pattern['family'], (pattern['name'], family, pattern['family'])
    geometry, _, _, _ = semantic_keys(board, rack)
    minimum_records = {}
    if signatures:
        for final, predicates in zip(minimum_finals, tags):
            _, key, mapping, canonical_final = semantic_keys(board, rack, final)
            item = profile(board, final, tier, predicates, mapping, canonical_final)
            if key in minimum_records:
                assert minimum_records[key] == item
            minimum_records[key] = item
    face_keys = {encoded(sorted([encoded([kind(row), sorted(face(tile) for tile in row)]) for row in final]))
                 for final in finals}
    initial_placements = []
    dead_placements = []
    for tile in rack:
        for i, row in enumerate(board):
            for at in range(len(row) + 1):
                extended = row[:at] + [tile] + row[at:]
                if not kind(extended) or (kind(extended) == 'run' and extended != ordered(extended)):
                    continue
                placement = {'tile': tile, 'row': i, 'index': at}
                initial_placements.append(placement)
                if not any(any(kind(target) == kind(extended) and set(extended) <= set(target) for target in final) for final in finals):
                    dead_placements.append(placement)
    origins = {tile: i for i, row in enumerate(board) for tile in row}
    duplicate_allocations = {}
    for f, count in Counter(face(tile) for tile in tiles).items():
        if count < 2:
            continue
        allocations = set()
        for final in minimum_finals:
            for row in final:
                if any(face(tile) == f for tile in row):
                    allocations.add(encoded([kind(row), sorted(face(tile) for tile in row),
                                             sorted(origins.get(tile, -1) for tile in row if face(tile) == f)]))
        if len(allocations) > 1:
            duplicate_allocations[f'{f[0]}-{f[1]}'] = len(allocations)
    missing_predicate = pattern.get('claimedFamily')
    bypass = next((final for final, predicates in zip(minimum_finals, tags) if missing_predicate not in predicates), None) if missing_predicate else None
    values = [face(tile)[1] for tile in tiles]
    return {'name': pattern['name'], 'tier': tier, 'status': status, 'family': family,
            'tiles': len(tiles), 'rackSize': len(rack), 'startingRows': len(board),
            'composition': 'mixed' if len({kind(row) for row in board}) > 1 else f'{kind(board[0])}-only',
            'minimumR': minimum, 'physicalPartitions': len(finals), 'facePartitions': len(face_keys),
            'minimumPhysicalPartitions': len(minimum_finals), 'nodes': nodes(), 'complete': True,
            'commonPredicates': sorted(common), 'optionalPredicates': sorted(union - common),
            'easyWitnessKinds': sorted(union) if tier == 1 else [],
            'structuralCounterexamples': len(bad), 'geometryKey': geometry,
            'allStructureSignatures': sorted({encoded([len(changed), sorted([[len(comp), len(comp & advanced)] for comp in comps])])
                                              for changed, advanced, comps in structures}),
            'boundaryProfile': [min(values) - 1, 13 - max(values)],
            'minimumOriginKeys': sorted(minimum_records),
            'minimumMechanismProfiles': [minimum_records[key] for key in sorted(minimum_records)],
            'initialPlacements': initial_placements, 'deadPreservedPlacements': dead_placements,
            'duplicateAllocationAlternatives': duplicate_allocations,
            'minimumWitness': [ordered(row) for row in minimum_finals[0]] if minimum_finals else None,
            'tierCounterexample': [ordered(row) for row in (bad[0] if bad and status == 'structural-rejection' else minimum_finals[0])] if status != 'accepted' and finals else None,
            'mechanismBypass': [ordered(row) for row in bypass] if bypass else None}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, help='Write complete audit evidence as JSON')
    args = parser.parse_args()
    source = Path(__file__).resolve().parents[1] / 'revision-6-patterns.json'
    data = json.loads(source.read_text())
    results = []
    for pattern in data['patterns'] + data.get('rejectedPatterns', []):
        result = audit(pattern)
        results.append(result)
        print(encoded({key: result[key] for key in ('name', 'status', 'family', 'minimumR', 'physicalPartitions', 'nodes')}), flush=True)
    by_name = {result['name']: result for result in results}
    coverage = {tier: sorted({result['family'] for result in results
                             if result['status'] == 'accepted' and result['tier'] == tier})
                for tier in range(1, 5)}
    assert all(len(coverage[tier]) >= required for tier, required in enumerate((0, 3, 4, 5, 6)) if tier)
    # A counted parameter variant must actually differ after cosmetic normalisation.
    for pattern in data['patterns']:
        if 'variantOf' in pattern:
            assert by_name[pattern['name']]['geometryKey'] != by_name[pattern['variantOf']]['geometryKey'], pattern['name']
    parameter_families = {pattern['family'] for pattern in data['patterns'] if 'variantOf' in pattern}
    assert parameter_families == {pattern['family'] for pattern in data['patterns']}
    # Check the canonical definition under simultaneous colour, reflection,
    # row/group-order, rack-order, and face-wide copy-label changes.
    representatives = {}
    for pattern in data['patterns']:
        representatives.setdefault(pattern['family'], pattern)
    for pattern in representatives.values():
        colour_map = dict(zip(COLOURS, COLOURS[1:] + COLOURS[:1]))

        def transform(tile):
            colour, value, copy = tile.split('-')
            return f'{colour_map[colour]}-{14 - int(value)}-{3 - int(copy)}'

        def transform_rows(rows):
            return [ordered([transform(tile) for tile in reversed(row)]) for row in reversed(rows)]

        transformed_board = transform_rows(pattern['board'])
        transformed_rack = [transform(tile) for tile in reversed(pattern['rack'])]
        transformed_final = transform_rows(pattern['solution'])
        first = semantic_keys(pattern['board'], pattern['rack'], pattern['solution'])
        second = semantic_keys(transformed_board, transformed_rack, transformed_final)
        assert first[:2] == second[:2], (pattern['name'], 'semantic symmetry')
    translated = representatives['group-donation']
    minimum_value = min(face(tile)[1] for tile in sum(translated['board'], []) + translated['rack'])

    def translate(tile):
        colour, value, copy = tile.split('-')
        return f'{colour}-{int(value) - minimum_value + 1}-{copy}'

    shifted = semantic_keys([[translate(tile) for tile in row] for row in translated['board']],
                            [translate(tile) for tile in translated['rack']],
                            [[translate(tile) for tile in row] for row in translated['solution']])
    assert shifted[:2] == semantic_keys(translated['board'], translated['rack'], translated['solution'])[:2]
    tied_board = [[f'blue-{value}-{copy}' for value in range(1, 4)] for copy in (1, 2)]
    tied_rack = ['blue-4-1', 'blue-5-1']
    preserved = [tied_board[0] + tied_rack, tied_board[1]]
    tied_first = semantic_keys(tied_board, tied_rack, preserved)
    tied_reversed = semantic_keys(list(reversed(tied_board)), tied_rack, preserved)
    assert tied_first[:2] == tied_reversed[:2]
    mixed = [['blue-1-1', 'blue-2-2', 'blue-3-1'] + tied_rack,
             ['blue-1-2', 'blue-2-1', 'blue-3-2']]
    mixed_key = semantic_keys(tied_board, tied_rack, mixed)
    assert tied_first[0] == mixed_key[0] and tied_first[1] != mixed_key[1], 'Lost source provenance'
    assert 'combined-repair' not in by_name['expert-mixed-exchange']['commonPredicates']
    assert 'combined-repair' in by_name['expert-combined-repair']['commonPredicates']
    assert by_name['hard-mixed-exchange']['deadPreservedPlacements']
    assert by_name['expert-mixed-exchange']['deadPreservedPlacements']
    assert any(result['facePartitions'] == 1 for result in results if result['tier'] >= 2 and result['status'] == 'accepted')
    assert any(result['facePartitions'] > 1 for result in results if result['tier'] >= 2 and result['status'] == 'accepted')
    summary = {'acceptedFixtures': len(data['patterns']), 'rejectedFixtures': len(data.get('rejectedPatterns', [])),
               'acceptedPhysicalPartitions': sum(result['physicalPartitions'] for result in results if result['status'] == 'accepted'),
               'allPhysicalPartitions': sum(result['physicalPartitions'] for result in results),
               'coreCoverage': coverage, 'symmetryCheckedFamilies': len(representatives),
               'parameterVariedFamilies': len(parameter_families),
               'translationAndTiedOriginChecks': 'passed',
               'differentialEnumeration': 'all fixtures agree with the plain set-cover oracle'}
    print(encoded(summary), flush=True)
    if args.output:
        args.output.write_text(json.dumps({'schema': 1, 'purpose': 'Independent complete physical fixture audits; not generated replay output.',
                                          'fixtureSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                                          'oracleSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                                          'helperSha256': hashlib.sha256(Path(__file__).with_name('review_v5_patterns.py').read_bytes()).hexdigest(),
                                          'summary': summary,
                                          'results': results}, indent=2) + '\n')


if __name__ == '__main__':
    main()

