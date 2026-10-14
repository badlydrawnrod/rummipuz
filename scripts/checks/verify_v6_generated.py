"""Audit actual revision-6 outputs independently of production JavaScript.
Usage: python3 scripts/checks/verify_v6_generated.py [sample-json] [--no-signatures] [--output report-json]
Default: the eight golden replay outputs. Also accepts native smoke output.
"""
import json
import sys
from pathlib import Path
from review_v6_patterns import audit

raw_arguments = list(sys.argv[1:])
output_path = None
if '--output' in raw_arguments:
    at = raw_arguments.index('--output')
    output_path = Path(raw_arguments[at + 1])
    del raw_arguments[at:at + 2]
arguments = [arg for arg in raw_arguments if arg != '--no-signatures']
signatures_enabled = '--no-signatures' not in sys.argv[1:]
source = Path(arguments[0]) if arguments else Path(__file__).parents[2] / 'app/checks/fixtures/generated-v6.json'
samples = json.loads(source.read_text())
partitions = 0
audit_records = []
for sample in samples:
    result, identity = sample['result'], sample['identity']
    assert result['status'] == 'ready'
    puzzle = result['puzzle']
    assert all(puzzle[key] == value for key, value in identity.items())
    rating = puzzle['rating']
    pattern = {'name': puzzle['seed'], 'difficultyTier': puzzle['difficultyTier'],
               'family': rating['family']['primary'], 'board': puzzle['board'], 'rack': puzzle['rack'],
               'solution': puzzle['solution']['board']}
    independent = audit(pattern, differential=True, signatures=signatures_enabled)
    assert independent['status'] == 'accepted'
    assert independent['minimumR'] == rating['rearrangement']
    assert independent['physicalPartitions'] == rating['structure']['partitions']
    assert independent['minimumPhysicalPartitions'] == rating['structure']['minimumPartitions']
    assert independent['commonPredicates'] == sorted(rating['family']['common'])
    assert independent['optionalPredicates'] == sorted(rating['family']['optional'])
    assert independent['easyWitnessKinds'] == sorted(rating['family']['eligibleWitnessKinds'])
    if signatures_enabled:
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
    audit_records.append({'identity': identity, 'family': independent['family'], 'pattern': rating['pattern'],
                          'physicalPartitions': independent['physicalPartitions'],
                          'minimumPhysicalPartitions': independent['minimumPhysicalPartitions'],
                          'facePartitions': independent['facePartitions'],
                          'deadPreservedPlacements': independent['deadPreservedPlacements'],
                          'duplicateAllocationAlternatives': independent['duplicateAllocationAlternatives']})
    partitions += independent['physicalPartitions']
summary = {'samples': len(samples), 'physicalPartitions': partitions,
           'differentialEnumeration': 'passed', 'runtimeMechanisms': 'passed',
           'runtimeSignatures': 'passed' if signatures_enabled else 'not collected'}
if output_path:
    output_path.write_text(json.dumps({'summary': summary, 'records': audit_records}, indent=2) + '\n')
print(json.dumps(summary))
