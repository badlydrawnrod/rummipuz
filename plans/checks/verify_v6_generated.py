"""Audit actual revision-6 outputs independently of production JavaScript.
Usage: python3 plans/checks/verify_v6_generated.py [sample-json]
Default: the eight golden replay outputs. Also accepts native smoke output.
"""
import json
import sys
from pathlib import Path
from review_v6_patterns import audit

source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parents[2] / 'app/checks/fixtures/generated-v6.json'
samples = json.loads(source.read_text())
partitions = 0
for sample in samples:
    result, identity = sample['result'], sample['identity']
    assert result['status'] == 'ready'
    puzzle = result['puzzle']
    assert all(puzzle[key] == value for key, value in identity.items())
    rating = puzzle['rating']
    pattern = {'name': puzzle['seed'], 'difficultyTier': puzzle['difficultyTier'],
               'family': rating['family']['primary'], 'board': puzzle['board'], 'rack': puzzle['rack'],
               'solution': puzzle['solution']['board']}
    independent = audit(pattern, differential=True, signatures=True)
    assert independent['status'] == 'accepted'
    assert independent['minimumR'] == rating['rearrangement']
    assert independent['physicalPartitions'] == rating['structure']['partitions']
    assert independent['minimumPhysicalPartitions'] == rating['structure']['minimumPartitions']
    assert independent['commonPredicates'] == sorted(rating['family']['common'])
    assert independent['optionalPredicates'] == sorted(rating['family']['optional'])
    assert independent['easyWitnessKinds'] == sorted(rating['family']['eligibleWitnessKinds'])
    signatures = rating['signatures']
    assert signatures['geometry'] == independent['geometryKey']
    expected = dict(zip(independent['minimumOriginKeys'], independent['minimumMechanismProfiles']))
    records = {record['origin']: record['profile'] for record in signatures['minimumSolutions']}
    assert all(expected[key] == profile for key, profile in records.items())
    if signatures['status'] == 'complete':
        assert records == expected
    else:
        assert signatures['status'] == 'truncated' and independent['minimumPhysicalPartitions'] > 64
    assert sum(result['rejected'].values()) == result['attempts'] - 1
    if 'diagnostics' in result:
        assert sum(result['diagnostics']['attemptsByFamily'].values()) == result['attempts']
    partitions += independent['physicalPartitions']
print(json.dumps({'samples': len(samples), 'physicalPartitions': partitions,
                  'differentialEnumeration': 'passed', 'runtimeSignaturesAndMechanisms': 'passed'}))
