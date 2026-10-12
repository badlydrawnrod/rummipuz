"""Retain all request evidence with SHA-256 semantic keys instead of long JSON keys.
Usage: python3 plans/checks/summarize_v6_native.py <native-directory> <output-json>
The full native source files remain in the emitted native directory.
"""
import hashlib
import json
import sys
from pathlib import Path

source, output = map(Path, sys.argv[1:])
r = json.loads((source / 'verification.json').read_text())
def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()

def compact_record(record):
    item = dict(record)
    if 'geometry' in item:
        item['geometrySha256'] = digest(item.pop('geometry'))
    for key in ('originKeys', 'mechanismProfiles'):
        if key in item:
            item[key + 'Sha256'] = [digest(value) for value in item.pop(key)]
    return item

for block in r['reports']:
    block['records'] = [compact_record(record) for record in block['records']]
    for tier in block['tiers']:
        for key in ('geometries', 'originKeyFrequencies', 'mechanismProfileFrequencies'):
            tier[key + 'Sha256'] = {digest(value): count for value, count in tier.pop(key).items()}
r['schema'] = 1
r['semanticKeyEncoding'] = 'SHA-256 of exact canonical JSON string; complete/truncated diagnostic statuses retained'
r['scope'] = 'native runtime and worker threads, not browser/tablet evidence'
output.write_text(json.dumps(r, indent=2) + '\n')
print(json.dumps({'output': str(output), 'requests': sum(b['requested'] for b in r['reports']),
                  'ready': sum(b['ready'] for b in r['reports']), 'blocks': [{'block': b['block'], 'quotaPass': b['quotaPass']} for b in r['reports']]}))
