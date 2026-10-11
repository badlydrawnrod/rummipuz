"""Reproduce bounded boundary-only design exploration, not an impossibility proof."""
import argparse
import json
from collections import Counter
from functools import lru_cache
from pathlib import Path
from random import Random

from review_v6_patterns import ExplorationLimit, mask_partitions, mechanisms, ordered, solution_structure


@lru_cache(None)
def face_cover(counts):
    """Existence of a same-colour run partition; no origin-sensitive claim."""
    if not any(counts):
        return True
    first = next(i for i, count in enumerate(counts) if count)
    for last in range(first + 2, 13):
        if not all(counts[i] for i in range(first, last + 1)):
            break
        remaining = list(counts)
        for i in range(first, last + 1):
            remaining[i] -= 1
        if face_cover(tuple(remaining)):
            return True
    return False


def investigate(with_group):
    rng = Random(614 if with_group else 613)
    filtered, outcomes, evidence = 0, Counter(), []
    for attempt in range(30000):
        intervals, counts = [], [0] * 13
        for _ in range(3 if with_group else 4):
            start = rng.randint(1, 10)
            end = rng.randint(start + 2, min(13, start + 6))
            if any(counts[value - 1] == 2 for value in range(start, end + 1)):
                break
            intervals.append((start, end))
            for value in range(start, end + 1):
                counts[value - 1] += 1
        if len(intervals) != (3 if with_group else 4):
            continue
        donor_value = None
        if with_group:
            donor_value = rng.choice([value for value in range(1, 14) if counts[value - 1] < 2])
            counts[donor_value - 1] += 1
        unused = [value for value in range(1, 14) for _ in range(2 - counts[value - 1])]
        if len(unused) < 4:
            continue
        rack_values = rng.sample(unused, rng.randint(4, min(8, len(unused))))
        total = counts.copy()
        for value in rack_values:
            total[value - 1] += 1
        if not face_cover(tuple(total)):
            continue
        if with_group:
            without_donor = total.copy()
            without_donor[donor_value - 1] -= 1
            if face_cover(tuple(without_donor)):
                continue
        # A complete partition preserving even one original row as a standalone
        # run is already a proof that this candidate is below Expert's R gate.
        if any(face_cover(tuple(count - int(start <= value <= end)
                                for value, count in enumerate(total, 1))) for start, end in intervals):
            continue
        filtered += 1
        copies, board = Counter(), []
        for start, end in intervals:
            row = []
            for value in range(start, end + 1):
                copies[value] += 1
                row.append(f'blue-{value}-{copies[value]}')
            board.append(row)
        if with_group:
            copies[donor_value] += 1
            board.append([f'blue-{donor_value}-{copies[donor_value]}']
                         + [f'{colour}-{donor_value}-1' for colour in ('red', 'orange', 'black')])
        rack = []
        for value in rack_values:
            copies[value] += 1
            rack.append(f'blue-{value}-{copies[value]}')
        generator, nodes = mask_partitions(sum(board, []) + rack, max_nodes=5000)
        minimum, minimum_tags, counterexample, partitions = 10, [], None, 0
        status = 'complete-without-required-core'
        try:
            for final in generator:
                partitions += 1
                changed, advanced, components = solution_structure(board, final)
                if len(changed) < 4 or not any(len(component) >= 4 and len(component & advanced) >= 3
                                              for component in components):
                    status, counterexample = 'counterexample', [ordered(row) for row in final]
                    break
                if len(changed) < minimum:
                    minimum, minimum_tags = len(changed), []
                if len(changed) == minimum:
                    minimum_tags.append(mechanisms(board, final, 4))
            else:
                common = set.intersection(*minimum_tags) if minimum_tags else set()
                target = 'linked-group-donation' if with_group else 'boundary-repair'
                if target in common:
                    status = 'certified'
        except ExplorationLimit:
            status = 'inconclusive-node-limit'
        outcomes[status] += 1
        evidence.append({'proposalIndex': attempt, 'board': board, 'rack': rack, 'status': status,
                         'nodes': nodes(), 'partitionsVisited': partitions, 'counterexample': counterexample})
    return {'mode': 'linked-group-donation' if with_group else 'boundary-only',
            'seed': 614 if with_group else 613, 'proposals': 30000, 'filteredCases': filtered,
            'nodeLimit': 5000, 'outcomes': dict(sorted(outcomes.items())), 'cases': evidence}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    results = [investigate(False), investigate(True)]
    for result in results:
        print(json.dumps({key: value for key, value in result.items() if key != 'cases'}), flush=True)
    if args.output:
        args.output.write_text(json.dumps({'purpose': 'Bounded design search; no impossibility or release proof is claimed.',
                                          'results': results}, indent=2) + '\n')
