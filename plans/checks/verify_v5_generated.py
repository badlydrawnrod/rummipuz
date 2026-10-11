"""Independently audit a native benchmark's full generated samples.

Usage: python3 plans/checks/verify_v5_generated.py /path/to/samples.json
The benchmark writes samples.json in its reported temporary directory.
"""
import json
import sys
from collections import Counter
from review_v5_patterns import audit

samples = json.load(open(sys.argv[1], encoding='utf-8'))
patterns = Counter()
partitions = 0
for fixture in samples:
    puzzle = fixture['result']['puzzle']
    assert fixture['result']['status'] == 'ready'
    result = audit({**puzzle, 'name': f"generated/{puzzle['difficultyTier']}/{puzzle['seed']}",
                    'solution': puzzle['solution']['board']})
    assert result['accepted'] and result['counterexamples'] == 0
    patterns[puzzle['rating']['pattern']] += 1
    partitions += result['solutions']
print(json.dumps({'acceptedSamples': len(samples), 'completePhysicalPartitions': partitions,
                  'easierCounterexamples': 0, 'patterns': dict(patterns)}, indent=2))
