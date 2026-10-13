# Rummipuz documentation

Start with the [implementation plan](rummipuz-implementation.md) for current status and remaining acceptance work. Use the [project README](../README.md) for launch, gameplay and offline instructions.

## Active change plans

- [GitHub Pages PWA publication](rummipuz-github-pages-pwa.md): completed first deployment, runtime packaging without `app/checks/`, installed/offline acceptance, and future release/rollback procedures.
- [UX improvements and assistance](rummipuz-ux-improvements.md): eight requested changes, implementation sequence, progress and acceptance criteria.

## Current specifications

- [Rules](rummipuz-rules.md)
- [Puzzle format and replay identity](rummipuz-puzzle-format.md), with [sample fixture](sample-puzzle.json)
- [Player flow](rummipuz-player-flow.md)
- [Difficulty and progression policy](rummipuz-difficulty.md)
- [Versioned generator contract](rummipuz-generator.md)
- [Revision-6 family/difficulty specification](rummipuz-revision-6-specification.md)

## Completed work and repeatable evidence

Completed plans, pattern designs, sample reviews and verification reports are in the [archive](archive/README.md). Their historical status statements do not add work to the current checklist.

JSON files remain here because native checkers, independent audits and review-generation tools use these stable paths. They include physical construction fixtures, exact replay/hand-solution sets, native/device measurements, initial failures, tuned reruns and independent audit reports. Scripts remain in `checks/`; runtime golden fixtures remain in `app/checks/fixtures/`.

Common verification commands, where Node is available:

```bash
node plans/checks/run_native.mjs
node plans/checks/review_v5_samples.mjs
node plans/checks/review_v6_samples.mjs
PYTHONDONTWRITEBYTECODE=1 python3 plans/checks/review_v6_samples.py
```

The native runner can also be imported through the connected native Node runtime. Browser/device acceptance remains separate from these checks.
