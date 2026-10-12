# Rummipuz implementation plan

## Current status

Generator work is complete through Phase 7. Approved generator revision 6 supplies fresh Start/Next puzzles and omitted-revision generation. Revisions 1–6 retain exact replay identities and saved layouts/undo history. Fixed difficulty selection and the read-only solution preview are implemented and configured for offline release `v8` with the existing 39 assets; the user has not asked to commit the current UX changes.

Latest generator verification before the fixed-difficulty change: 1,288 native checks passed, including 62 worker checks from only the precached assets. Approved sample checkers passed 42 revision-5 and 3,499 revision-6 assertions. Both full revision-6 variety/preparation blocks passed on native runtime, laptop and user-reported tablet; the user confirmed both devices stayed responsive and approved the family/sequence review on 12 October 2026 without tuning. The focused checks were updated for fixed difficulty but have not been run.

Mouse, touch and overflow controls have user approval. Appearance/palette preference retention is confirmed on desktop and tablet. Complete browser sessions and installed offline launch still need the acceptance checks below; generator/device preparation approval does not complete those checks.

## Planned UX improvements

The user requested scroll retention, clearer red/orange tiles, whole-row reordering, collapsed empty rows, fixed difficulty selection, hints and solution reveal on 12 October 2026. See the [UX improvements and assistance plan](rummipuz-ux-improvements.md) for work order and acceptance criteria. Steps 1, 2, 5 and 6 are implemented and user-approved. Complete the remaining checks below against the revised app.

## Remaining work

- [ ] Reconcile PC/tablet launch documentation. **Done when:** the README instructions are reviewed for Python HTTP launch, LAN access and trusted HTTPS for tablet PWA installation, and this previously outstanding documentation item is explicitly closed. These instructions already exist in the [README](../README.md#run-on-a-pc).
- [ ] Set up trusted HTTPS for tablet installation. **Done when:** the tablet can open the app at a trusted HTTPS address and report readiness for offline use. Record the chosen setup in the launch instructions.
- [ ] Verify complete play sessions on desktop and tablet. **Done when:** Start/Next, win, deliberate difficulty changes, exact replay, undo/reset and reload/resume work; saved arrangement, undo history, chosen tier and completion-identity deduplication survive reload. Include preparation cancellation/failure retaining the current session and replay-copy behaviour.
- [ ] Verify appearance and readability on both devices. **Done when:** Light, Dark, High Contrast and System are readable with both tile palettes; System follows device changes; changing settings preserves gameplay and undo history. Include overflowing rows/rack and tablet orientations within the existing layout.
- [ ] Verify installed offline use on both devices. **Done when:** after closing all app windows and stopping the server/disconnecting networking, the installed app launches, restores progress/settings, generates at every tier, supports Check/Next and replays, and survives another offline close/relaunch. Reconnect and verify a waiting update activates after all old windows close without losing progress. Use the [README walkthrough](../README.md#install-and-verify-offline-use).

Fix issues found by these checks, then record device/browser, results and any limitations before checking an item. User-reported device testing can supply acceptance when no browser is available to the agent.

**Next action:** Continue with step 3 of the UX plan, then reconcile launch documentation and complete HTTPS/browser/device acceptance against the revised app.

## Scope and decisions still in force

- Buildless static HTML/CSS/JavaScript modules; no package manager, application server or external assets required for play. Generation/solving run in cancellable dedicated module workers. Failed preparation preserves the active session.
- Local, unlimited, replayable numbered-tile puzzles for PC and tablet. Use two distinct physical copies of numbers 1–13 in four colours. No jokers or 30-point opening rule. Winning puts every puzzle tile on valid board rows exactly once; temporary invalid rows and returning board tiles to the rack are allowed.
- Keep four selectable tiers. Start and Next use the saved chosen tier until the player successfully starts a fresh puzzle at another tier. Preserve versioned replay, stored layouts/undo history, completion-identity deduplication, and independent local progress/preferences. New generator selection algorithms require a new revision.
- Preserve the approved mouse/touch controls and existing layout. Dedicated keyboard gameplay, layout redesign and the additional validity/rack-count/win-feedback step were removed at the user's request; do not reintroduce them as unfinished work.
- Keep System, Classic / Light, Dark and High Contrast appearance modes and the independent alternative tile palette. Retain symbols and logical colour names.
- For cached runtime changes, increment `OFFLINE_RELEASE`, cover the full worker import graph in `OFFLINE_ASSETS`, and retain atomic installation and waiting-update behaviour. Progress/preferences are separate from cache cleanup.

## Reference documents and retained evidence

| Reference | Purpose |
| --- | --- |
| [Rules](rummipuz-rules.md) | Row validity, physical copies, movement and winning |
| [Puzzle format](rummipuz-puzzle-format.md) | Versioned puzzle/replay identity and sample fixture |
| [Player flow](rummipuz-player-flow.md) | Gameplay and navigation specification |
| [Difficulty policy](rummipuz-difficulty.md) | Tier bounds, proof gates and fixed selected tier |
| [Generator contract](rummipuz-generator.md) | Revision-specific algorithms, traversal and work limits |
| [Revision-6 specification](rummipuz-revision-6-specification.md) | Family certification, semantics and release quotas |
| [Documentation index](README.md) | Current references, historical records and check data |
| [Archive](archive/README.md) | Completed plans, designs, reviews and verification reports |

Exact JSON fixtures, evidence and audit scripts remain at their existing paths under `plans/` and `plans/checks/` so repeatable checks continue to work. The [previous full plan](archive/rummipuz-implementation-history.md) preserves the detailed phase history and decision log.

## Resuming work

Work from the first unchecked item unless the user directs otherwise. Check an item only when its acceptance condition is met. Update current status, next action and relevant decisions at the end of a session; put detailed completed evidence in the archive rather than expanding this checklist. Record scope changes before implementing them.

## Deferred ideas

Hints and solution reveal are now scheduled in the UX plan. Jokers, scoring, timed challenges, daily featured puzzles and syncing progress across devices remain deferred. They are optional ideas, not outstanding acceptance work.
