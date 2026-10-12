# Rummipuz UX improvements and assistance plan

## Status and scope

Planned on 12 October 2026 from user feedback. This document schedules work; no runtime changes have been made. It covers preserving horizontal position, distinguishing red/orange tiles, moving whole rows, collapsing empty rows, staying at the chosen difficulty, hints and revealing a solution.

Approved generator revision 6, puzzle rules, physical tile identities and exact revisions 1–6 replay remain unchanged. These changes affect presentation, live layout and assistance. Existing saved sessions and undo history must remain readable. Keep the buildless static app, worker computation and offline support.

This plan takes priority over the remaining finishing checks in the [implementation plan](rummipuz-implementation.md). Complete those browser/device checks against the revised interface rather than repeating them before these changes. Check each item only when its acceptance criteria are met; native checks cannot substitute for the specified desktop/tablet review.

## Intended behaviour

| Request | Planned behaviour |
| --- | --- |
| Horizontal scrolling | Editing a long row preserves the part of that row the player was viewing. Other rows and the rack keep their own positions. |
| Red versus orange | Distinguish the inks more clearly and strengthen a visible cue independent of colour. Logical colours, symbols and names remain consistent. |
| Drag a row | Drag a dedicated row handle to reorder the whole row vertically among board rows. Tile order and contents travel together. |
| Collapse empty rows | Hide emptied board rows and show exactly one New row destination during play. |
| Difficulty | Start/Next stay at the chosen tier indefinitely. Only a deliberate difficulty choice changes the tier for fresh puzzles. |
| Hint | Show one concrete, explained tile move from the current position, highlighting its source and destination. The player performs it. |
| Reveal solution | Open a clearly labelled, dismissible, read-only complete solution preview. Closing it restores the unchanged play view. |

Row dragging is interpreted as moving a board row before/after another board row, including first/last position. Merging rows or moving a whole row into the rack are outside this first implementation. Reveal displays one valid solution; puzzles can have several. These are implementation defaults to review with the user during the relevant interface steps.

## Model recommendations

Use **GPT-6 Luna High** for bounded, well-specified changes, reflecting the user's good experience with it. Use **GPT-6.1 Sol High** for shared row identity/targeting, whole-row gestures and the hint planner. If using one model for the entire plan, choose Sol High. These are engineering recommendations, not published task benchmarks or mandatory model assignments. Official [model guidance](https://developers.openai.com/api/docs/models) positions Luna for focused efficient work, Sol for balancing capability and cost, and Astra for demanding reasoning/coding.

| Step | Suggested model | Reason |
| --- | --- | --- |
| 1 — Scroll retention | GPT-6 Luna High | Concrete bug with identifiable rendering paths and clear acceptance checks. |
| 2 — Red/orange distinction | GPT-6 Luna High | Mostly presentation work; user review on the actual display is decisive. |
| 3 — Collapse empty rows | GPT-6 Luna High after GPT-6.1 Sol High settles/reviews row mapping | Hiding rows is straightforward; targeting, scroll identity and undo require a shared design. |
| 4 — Whole-row dragging | GPT-6.1 Sol High | Combines state operations, touch gestures, scrolling, cancellation and persistence. |
| 5 — Fixed difficulty | GPT-6 Luna High | A specified policy change with predictable compatibility checks. |
| 6 — Reveal solution | GPT-6 Luna High | Existing worker/solver support bounds the read-only preview work. |
| 7 — Hint planner | GPT-6.1 Sol High; consider GPT-6 Astra High if design stalls | Requires algorithmic choices that preserve useful work and produce sensible moves, including duplicate-copy handling. |
| 8 — Integration and acceptance | GPT-6.1 Sol High for final review | Review interactions between the changes and compatibility; browser/device acceptance still comes from actual testing. |

Give each implementation run one step and its acceptance criteria, rather than the entire plan at once. Have Sol High settle the shared row identity design before steps 3–4, and design the assistance machinery before relying on current-position hints. Escalate a bounded Luna task when unresolved interactions or repeated failures justify it; higher reasoning effort does not replace a sound design or device testing.

## 1 — Preserve horizontal position

- [ ] Fix scroll retention through rendering and overflow refresh. **Done when:** removing or inserting a tile near the middle/end of an overflowing row preserves the visible neighbourhood; editing another row does not reset it. The rack follows the same policy. Test repeated removals, selection, Check, Undo, Reset and viewport resizing. Keep focus changes from scrolling the row unintentionally.

`app/play.js` currently destroys every board-row element in `render()`. `app/overflow.js` can also adjust positions while showing/hiding arrows and exposing placement gaps. Address both paths. Capture positions before DOM replacement and restore them after layout, or retain row elements; do not key retention solely by displayed row number, since empty-row collapse and reordering will change it.

Prefer preserving a visible physical tile and its pixel offset. If that tile disappears, use a surviving neighbour; clamp to the available scroll range when content shrinks. A row viewed at its end should remain at the new end. Rows that now fit need no artificial overflow. Keep arrows and terminal placement gaps correct after restoration. New/replayed puzzles start with fresh viewport state; viewport state need not enter saved puzzle data.

**Verification:** focused rendering/overflow checks plus desktop and tablet removal from the end of a long row. Recheck after steps 3 and 4. Native geometry stubs alone do not establish browser scroll behaviour.

## 2 — Make red and orange easier to distinguish

- [ ] Revise tile presentation and review it on both devices. **Done when:** the user can readily tell red and orange apart on a normal display and on their reading/dark display modes, across all app appearances and both palettes. Numbers, symbols and colour names remain readable and meet the existing contrast requirements; selection, dragging and validity cues remain clear.

Review `app/styles.css` ink variables and the shared tile/legend rendering in `app/tiles.js`. Choose a clearer hue/lightness separation within text-contrast limits. Strengthen the existing heart/triangle distinction with a prominent shape or other simple monochrome cue if colour changes alone are insufficient. Apply the same mapping to board, rack, legend, drag previews, hints and solution previews. Alternative-palette red can retain its established purple mapping; do not change logical tile colours or physical IDs.

Record the chosen inks/cues and contrast results. Include reduced-colour/grayscale inspection, but require user review on the actual limited-colour screen: display reading filters are outside the app's control. Do not assume meeting text contrast proves the two colours distinguishable.

## 3 — Collapse empty rows and establish reliable row targeting

- [ ] Render only nonempty board rows and one New row destination. **Done when:** repeatedly emptying several rows leaves no blank row stacks, while every remaining tile and drop target stays usable. Emptying the whole board leaves the single New row target. Undo, Reset, reload and old saved sessions with empty placeholders work correctly.

Existing state intentionally retains empty arrays to keep indices stable. Prefer hiding those placeholders in the view while preserving exact old snapshots; map each visible row explicitly to its state row. Display labels, Check messages, hint text and drop targets must use the same visible-row mapping. New row placement must create or reuse one target consistently, with no duplicated blank destination. Keep transient one/two-tile invalid rows visible.

Before implementation, document how row view identity follows edits, reordering and Undo. Use it for scroll retention and gesture targeting. A displayed ordinal or mutable tile-list string alone is insufficient. If state compaction or persisted row IDs prove necessary, specify backward-compatible save handling first; never rewrite immutable starting puzzles or existing undo snapshots merely for visual cleanup.

**Verification:** tile conservation, hidden-placeholder destination mapping, undo/reset/reload, all-empty board and stale/cancelled gestures. Recheck step 1 after collapsing rows.

## 4 — Drag whole rows to reorder the board

- [ ] Add an undoable row-reorder operation. **Done when:** a drop moves one complete nonempty row to a valid insertion position, preserving every physical tile and its order, all other rows, the rack and initial puzzle. One reorder adds one undo entry; dropping back at the same position is a no-op. Undo/Reset and save/reload restore exact ordering.
- [ ] Add mouse and touch row handles and insertion previews. **Done when:** the player can comfortably move a row to the top, middle or bottom, including across a vertically scrolling board, on desktop and tablet. Dragging from the handle cannot accidentally move one tile, activate a placement gap or hijack ordinary row scrolling. Cancelling or dropping outside a destination leaves the puzzle unchanged.

Add a pure operation in `app/state.js`, exposed through the play session. Treat whole-row dragging as distinct from tile dragging. Use a dedicated, labelled handle with a touch-friendly target, visible insertion marker, vertical edge scrolling and a deliberate activation gesture. Retain horizontal position for the moved row and unaffected rows. Do not allow reordering after completion is locked. Include a simple handle-based select/place or move-up/down alternative so dragging is not the sole way to reorder; this does not add a dedicated keyboard gameplay system.

**Verification:** first/last/upward/downward insertion indices, no-ops, inventory, immutable snapshots, exact undo and persisted order; mouse/touch gesture separation and cancellation; interactions with hidden empty rows and scrolled rows.

## 5 — Keep the chosen difficulty until the player changes it

- [ ] Remove automatic promotion and its interface prompts. **Done when:** Next stays at Easy/Medium/Hard/Expert after any number of completions; all tiers remain immediately selectable. The chosen tier survives reload and offline play. Replays and resuming an old puzzle retain that puzzle's recorded tier without silently changing the chosen tier for future fresh puzzles.

Change `nextDifficulty`/fresh generation policy in `app/puzzle-flow.js` and the credit/promotion text in `app/main.js` and HTML. Keep completion identity deduplication and compatible existing saves; old credit records must not trigger promotion. No generator revision change is needed because explicit tier/seed generation is unchanged. Remove progression from the player-flow/difficulty specifications and launch/gameplay copy when implementing this step.

**Verification:** many completions per tier, switching tiers, replay at a different tier, old saves containing three credits, reload, cancellation/failure retaining the previous chosen tier, and exact old replay fixtures.

## 6 — Reveal a verified complete solution

- [ ] Add a cancellable solution request for the current puzzle and a Reveal solution preview. **Done when:** the preview shows every puzzle tile exactly once in valid rows, with an empty rack, and uses the common tile palette/appearance. It is usable on desktop and tablet, including long rows, and closes back to the exact live arrangement, selection, undo history and view position. Revealing alone neither completes the puzzle nor writes completion credit.

The existing worker-backed solver can solve the conserved inventory even when the live board is temporarily invalid. Use a bounded request and verify its physical output with the rules module. Reject corrupt inventory and distinguish cancellation, exhausted work and a proved lack of solution. A supported published puzzle should remain solvable after legal tile moves; an unexpected failure needs clear retry feedback, not a fabricated answer.

Prefer a solution compatible with the current layout when feasible, sharing the assistance machinery in step 7. A valid stored witness may be used only after verifying its identity/inventory; restored sessions may lack witness metadata, so they must work without it. All solution computation remains in a worker, with cancellation and main-thread responsiveness.

The preview is a separate labelled panel/dialog, not a replacement live board. Provide Close, sensible focus return and accessible tile/row labels. No automatic Apply solution action is included. The player may continue, Reset, manually follow the preview or choose another puzzle. Existing Check remains the completion action.

## 7 — Give one sensible hint from the current position

- [ ] Implement and verify a deterministic current-position assistance planner. **Done when:** it chooses a conserved complete target and derives a finite legal tile-move sequence from the actual live arrangement. Applying that sequence reaches the verified target. It handles duplicate faces as distinct physical tiles, invalid intermediate rows, partial player progress and necessary temporary rack staging.
- [ ] Add Hint with concise move text and source/destination highlights. **Done when:** one click shows one actionable next move, such as “Move Orange 8 from row 3 into row 1 between 7 and 9,” plus a brief reason. The intended physical copy and insertion gap are unambiguous. The player performs the move through ordinary controls; requesting a hint does not mutate state or add undo history.

`app/solver.js` currently ignores current placement and stored solutions. Its first complete partition is not by itself a useful hint. Add current-layout preferences in a separate assistance path: preserve completed valid sets and useful partial work where compatible with a solution, prefer a rack placement or a productive rearrangement, and avoid reversing the player's work merely because an equivalent group has another colour order. Treat these as bounded heuristics, not a guarantee of globally optimal or human-easiest play.

Derive insertion destinations against the current state, not the initial board or a stale hint. If a temporary move to the rack is necessary, explain what it frees or prepares. Suppress no-op, pure cosmetic reorder and immediate back-and-forth hints. Repeated Hint without a state change returns the same instruction; after the player moves, recompute from the new position. Do not require blindly following a precomputed witness.

Hints and Reveal requests must carry puzzle/state identity tokens. Any tile move, row reorder, Undo, Reset, replay or session replacement cancels or invalidates pending results/highlights. A limit/failure leaves the live state intact and offers retry; it must not be called “no solution” unless proved. A board already ready to win gets “Select Check to finish”; completed sessions need no hint. Resolve offscreen highlighting through deliberate reveal of the hinted source/target, keeping unrelated rows' viewports unchanged.

**Verification:** replayable fixtures from all four tiers and revisions 1–6, partial valid work, temporary invalid rows, repeated physical faces, all tiles temporarily in the rack, hidden placeholders, reordered/scrolled rows, work-limit/cancellation races and stale responses. Replay every proposed move sequence through the real state operations and independently check the final win. Review the usefulness of hints with the user; solver validity alone does not establish sensible advice.

## 8 — Integration, offline release and acceptance

- [ ] Update current specifications and instructions. **Done when:** player flow, difficulty policy, save/undo documentation where affected, and README describe the new row controls, fixed difficulty, Hint and Reveal. Remove hints from deferred scope; leave jokers, scoring, timed/daily puzzles and device sync deferred.
- [ ] Package and run appropriate checks. **Done when:** relevant native regressions and exact replay/save fixtures pass; assistance and row operations preserve physical inventory; actual-worker cancellation and offline-import checks pass. Increment `OFFLINE_RELEASE` for cached runtime changes and add all assistance imports/assets to `OFFLINE_ASSETS`. Run worker checks from only the precached bundle, including assistance for a resumed session without stored solution metadata.
- [ ] Obtain desktop/tablet acceptance for the seven changes. **Done when:** the user confirms scroll retention, red/orange distinction on their display modes, single New row behaviour, comfortable row movement, fixed tier selection and useful hints/solution preview. Include reload, Undo/Reset, appearance/palette changes and offline assistance. Record device/browser and unresolved limitations; keep installed-launch/HTTPS acceptance in the main plan.

Release each practical UX fix for review as it becomes ready. Do not hold scroll/colour/progression fixes behind the more involved hint planner. If a step reveals a need to change puzzle rules, generator outputs or saved-data format, document the proposal and compatibility handling before implementing it.

## Current position

Plan prepared; implementation has not started. Next: step 1, preserve horizontal position. Step 2 and step 5 are independent of row movement/assistance and can be brought forward at the user's direction. Steps 3–4 must share a row identity/targeting policy; steps 6–7 must share cancellation, solution validation and current-position semantics.
