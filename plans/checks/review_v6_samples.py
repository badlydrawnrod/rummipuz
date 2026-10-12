"""Independently audit review layouts, physical solutions and minimum mechanisms.
Usage: PYTHONDONTWRITEBYTECODE=1 python3 plans/checks/review_v6_samples.py
"""
import json
from collections import Counter
from pathlib import Path
from review_v6_patterns import audit, kind

root = Path(__file__).parents[2]
data = json.loads((root / 'plans/revision-6-sample-review.json').read_text())
results = []
for sample in data['samples']:
    p = sample['result']['puzzle']
    final = sample['handSolution']
    assert Counter(sum(final, [])) == Counter(sum(p['board'], []) + p['rack'])
    assert all(kind(row) for row in final)
    result = audit({'name': sample['label'], 'difficultyTier': p['difficultyTier'],
                    'family': p['rating']['family']['primary'], 'board': p['board'], 'rack': p['rack'],
                    'solution': final}, differential=True, signatures=False)
    assert result['minimumR'] == p['rating']['rearrangement']
    assert result['physicalPartitions'] == p['rating']['structure']['partitions']
    results.append({'label': sample['label'], 'replayCode': sample['replayCode'], 'family': result['family'],
                    'minimumR': result['minimumR'], 'physicalPartitions': result['physicalPartitions'],
                    'facePartitions': result['facePartitions'], 'commonPredicates': result['commonPredicates'],
                    'optionalPredicates': result['optionalPredicates'], 'easyWitnessKinds': result['easyWitnessKinds'],
                    'deadPreservedPlacements': result['deadPreservedPlacements']})
summary = {'samples': len(results), 'physicalPartitions': sum(r['physicalPartitions'] for r in results),
           'status': 'all independent physical partitions and hand solutions pass; human feedback pending'}
(root / 'plans/revision-6-sample-audit.json').write_text(json.dumps({'summary': summary, 'results': results}, indent=2) + '\n')
print(json.dumps(summary))
