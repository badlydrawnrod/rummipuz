# Desktop and tablet acceptance

Two dedicated device checks remain pending. Run them against the current published app on both a desktop and the target tablet. Native checks and simulated layout/touch tests do not close them. Record date, tested commit/offline release, device, OS/browser version, results and limitations; fix discovered issues before marking a check complete. User-reported testing can supply acceptance.

## Complete play sessions

- [ ] Verify Start/Next, win, deliberate difficulty changes, exact replay, Undo/Reset and reload/Resume on both devices.

Confirm that saved arrangement, Undo history, chosen tier and completion-identity deduplication survive reload. Include preparation cancellation/failure retaining the current session and chosen tier, replay-code copying and invalid-code rejection without lost progress. Repeat completion of one identity and confirm it is recorded once. Exercise Hint and the read-only solution preview during play, including Undo, Reset cancellation, Rules, unfinished Check feedback and returning to the unchanged puzzle.

On the tablet, cover portrait/landscape, tap/place, touch dragging, board scrolling, offscreen hint Show actions and long solution rows. Record any limitation rather than infer a pass from automated checks.

## Appearance and readability

- [ ] Verify Light, Dark, High Contrast and System with both tile palettes on both devices.

Check readable tiles, feedback and focus, including red/orange distinction, overflowing rows/rack and tablet orientations within the existing layout. System must follow device appearance changes. Changing settings preserves gameplay and Undo history; reload retains both settings. The user selected orange `#D48519` despite its lower text contrast; do not treat the earlier contrast target as an unfulfilled task or change that choice without a new request.

## Existing acceptance record

The UX changes were user-approved on 12 October 2026: horizontal scroll retention, red/orange distinction, a single New row destination with empty rows hidden, compact placement controls and row spacing, whole-row movement, fixed difficulty, Hint and Reveal. Mouse/touch/overflow controls were also approved. Generator revision 6's two fixed variety/preparation blocks passed on native runtime, laptop and user-reported tablet, with responsiveness and family/sequence review approved that day.

Trusted HTTPS and installed offline acceptance were recorded complete on 13 October 2026 from the user's browser/tablet confirmation for release `v14`. That covered installation, offline use, persistence and updates; device/browser versions and per-scenario results were not recorded. Keep that evidence limitation explicit. These two dedicated checks remain separate; this checklist migration performs no new device testing.

Use the [README installation walkthrough](../README.md#install-the-app-for-offline-use) for future offline regression testing and its [release/rollback procedure](../README.md#update-or-roll-back-the-offline-package) for updates.

## Scope

Preserve the approved layout and mouse/touch controls. Dedicated keyboard gameplay, layout redesign and an additional validity/rack-count/win-feedback feature were removed from scope by user request; they are not pending acceptance work. Jokers, scoring, timed/daily puzzles and cross-device syncing remain optional deferred ideas. The app remains buildless with local progress/preferences and cancellable worker computation.
