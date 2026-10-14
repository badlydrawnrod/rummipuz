"""Exhaustive physical-tile audit of hand-authored designs, using Python only.

Run from any directory: python3 scripts/checks/review_v5_patterns.py
No production solver, generation code, or browser is used.
"""
import json
from itertools import combinations, product
from pathlib import Path


def face(tile):
    colour, value, copy = tile.split('-')
    assert colour in ('black', 'blue', 'red', 'orange')
    assert 1 <= int(value) <= 13 and str(int(value)) == value
    assert copy in ('1', '2')
    return colour, int(value)


def kind(row):
    faces = [face(tile) for tile in row]
    if len(row) < 3 or len(set(faces)) != len(row):
        return None
    colours, values = zip(*faces)
    if len(set(values)) == 1 and len(set(colours)) == len(row):
        return 'group'
    if len(set(colours)) == 1:
        ordered = sorted(values)
        if ordered == list(range(ordered[0], ordered[-1] + 1)):
            return 'run'
    return None


def features(original, final):
    changed = [i for i, row in enumerate(original)
               if not any(set(row) <= target and kind(row) == kind(target) for target in final)]
    advanced = set()
    for i in changed:
        source = original[i]
        endpoint_only = False
        if kind(source) == 'run':
            for target in final:
                core = [tile for tile in source if tile in target]
                if kind(target) != 'run' or len(core) < 3 or kind(core) != 'run':
                    continue
                positions = [source.index(tile) for tile in core]
                if positions != list(range(positions[0], positions[-1] + 1)):
                    continue
                ends = [source[:positions[0]], source[positions[-1] + 1:]]
                split = any(set(end[a:b]) <= other and kind(other) == 'run'
                            for end in ends for a in range(len(end))
                            for b in range(a + 3, len(end) + 1)
                            for other in final if other != target)
                if not split:
                    endpoint_only = True
                    break
        if not endpoint_only:
            advanced.add(i)
    neighbours = {i: set() for i in changed}
    for target in final:
        contributors = [i for i in changed if set(original[i]) & target]
        for a, b in combinations(contributors, 2):
            neighbours[a].add(b)
            neighbours[b].add(a)
    unseen, components = set(changed), []
    while unseen:
        pending, component = [min(unseen)], set()
        while pending:
            i = pending.pop()
            if i in component:
                continue
            component.add(i)
            pending.extend(neighbours[i] - component)
        unseen -= component
        components.append((len(component), len(component & advanced)))
    return len(changed), tuple(sorted(components)), len(advanced)


def partitions(inventory):
    copies = {}
    for tile in sorted(inventory):
        copies.setdefault(face(tile), []).append(tile)
    shapes = []
    for colour in ('black', 'blue', 'red', 'orange'):
        for start in range(1, 12):
            for end in range(start + 2, 14):
                shape = [(colour, v) for v in range(start, end + 1)]
                if all(f in copies for f in shape):
                    shapes.append(shape)
    for value in range(1, 14):
        present = sorted(f for f in copies if f[1] == value)
        for size in (3, 4):
            shapes.extend(combinations(present, size))
    rows = sorted({frozenset(ids) for shape in shapes
                   for ids in product(*(copies[f] for f in shape))}, key=lambda r: tuple(sorted(r)))
    by_tile = {tile: [row for row in rows if tile in row] for tile in inventory}
    nodes = 0

    def search(remaining, chosen):
        nonlocal nodes
        nodes += 1
        if not remaining:
            yield chosen
            return
        choices = [(tile, [row for row in by_tile[tile] if row <= remaining])
                   for tile in sorted(remaining)]
        _, eligible = min(choices, key=lambda item: len(item[1]))
        for row in eligible:
            yield from search(remaining - row, chosen + [row])

    return search(frozenset(inventory), []), lambda: nodes


def audit(pattern):
    board, rack, witness = pattern['board'], pattern['rack'], pattern['solution']
    tiles = sum(board, []) + rack
    assert len(tiles) == len(set(tiles)), 'Repeated physical tile'
    inventory = set(tiles)
    assert all(kind(row) for row in board + witness), 'Invalid row'
    assert all(kind(row) != 'run' or [face(t)[1] for t in row] == sorted(face(t)[1] for t in row)
               for row in board + witness), 'Run order'
    assert set(sum(witness, [])) == inventory and len(sum(witness, [])) == len(tiles)
    tier = pattern['difficultyTier']
    bounds = {1: (2, 5, 2, 5), 2: (3, 6, 3, 6), 3: (4, 8, 4, 7), 4: (4, 10, 4, 9)}[tier]
    assert bounds[0] <= len(rack) <= bounds[1] and bounds[2] <= len(board) <= bounds[3]
    generated, nodes = partitions(inventory)
    count, minimum, signatures, easy_witness = 0, len(board) + 1, set(), False
    counterexamples = 0
    for final in generated:
        count += 1
        changed, components, advanced = features(board, final)
        minimum = min(minimum, changed)
        signatures.add((changed, components))
        if tier == 1:
            easy_witness |= changed == 1 and advanced == 0
        else:
            if not any(c >= tier and n >= tier - 1 for c, n in components):
                counterexamples += 1
    assert count > 0
    assert minimum == tier if tier < 4 else minimum >= 4
    accepted = easy_witness if tier == 1 else counterexamples == 0
    assert accepted == pattern.get('expectedAccepted', True), pattern['name']
    assert frozenset(map(frozenset, witness)) in {
        frozenset(final) for final in partitions(inventory)[0]
    }, 'Witness not enumerated'
    return dict(name=pattern['name'], tiles=len(tiles), solutions=count,
                nodes=nodes(), minimumR=minimum, accepted=accepted,
                counterexamples=counterexamples,
                signatures=sorted(signatures))


if __name__ == '__main__':
    source = Path(__file__).resolve().parents[2] / 'app/checks/fixtures/structural-v5.json'
    fixtures = json.loads(source.read_text())
    for item in fixtures:
        result = audit(item)
        assert result['solutions'] == item['expectedPartitions'], (item['name'], result['solutions'])
        print(json.dumps(result))
