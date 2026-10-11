"""Independent full-partition and hand-solution audit of the user review set."""
import json
from pathlib import Path
from review_v5_patterns import audit, features

samples = json.loads((Path(__file__).resolve().parents[1] / 'revision-5-sample-review.json').read_text())
assert len(samples) == 8
total = 0
for sample in samples:
    puzzle = sample['result']['puzzle']
    identity = sample['identity']
    assert sample['result']['status'] == 'ready'
    assert all(puzzle[key] == value for key, value in identity.items())
    assert sample['replayCode'] == f"rummipuz:1:5:{identity['difficultyTier']}:{identity['seed']}"
    # Audit the supplied human derivation independently of the production witness.
    report = audit({**puzzle, 'name': sample['replayCode'], 'solution': sample['handSolution']})
    witness = audit({**puzzle, 'name': sample['replayCode'], 'solution': puzzle['solution']['board']})
    assert report == witness
    changed, components, advanced = features(puzzle['board'], list(map(set, sample['handSolution'])))
    assert changed == report['minimumR']
    if identity['difficultyTier'] == 1:
        assert advanced == 0
    total += report['solutions']
    print(json.dumps({**report, 'handComponents': components}))
print(json.dumps({'acceptedSamples': len(samples), 'completePhysicalPartitions': total,
                  'easierCounterexamples': 0}))
