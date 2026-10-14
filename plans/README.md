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

## Verification

The one-off sample review workflow has been removed. Runtime golden fixtures remain in `app/checks/fixtures/`. The repeatable native check command, where Node is available, is:

```bash
node plans/checks/run_native.mjs
```

The native runner can also be imported through the connected native Node runtime. Browser/device acceptance remains separate from these checks.
