# Rummipuz implementation plan

## Goal and scope

Build a local, replayable Rummikub-style puzzle game for PC and tablet. Each puzzle starts with a valid board and a rack; the player wins by placing every rack tile while leaving every board row valid. Players can select a starting difficulty, and completed puzzles lead to progressively harder ones. Puzzles are generated on demand, with no daily limit.

**Status:** Phases 1–3 implementation complete. Phase 4 readable board/rack tiles, appearance settings, and independent alternative tile palette implemented. Mouse controls complete and approved by the user. Touch tap-to-place and deliberate dragging complete and manually approved by the user after context-menu and destination-targeting refinements. Portrait, landscape, and desktop layouts are next; browser worker verification remains pending.

## Working assumptions

- Use modern JavaScript modules, HTML, and CSS with no build step or package manager. Render tiles as HTML elements. No Three.js or application server is needed for the game itself.
- Use numbers 1–13 in four colours (black, blue, red, and orange), with two physical copies of each number-colour combination: 104 numbered tiles. Each physical tile must have a distinct identity, even when its number and colour match another tile. The standard set also includes two wild jokers, for 106 tiles in total; the first playable version uses only the 104 numbered tiles, with jokers deferred. A valid row is either at least three consecutive numbers of one colour or three/four equal numbers of distinct colours. Existing board rows may be rearranged freely; the 30-point opening rule does not apply to these endgame puzzles.
- Every published puzzle must have at least one solution that empties the rack. Multiple solutions are acceptable.
- Progress and settings live on the device. A seed identifies each puzzle for replay or sharing.
- The same app serves PC and tablet. Mouse and touch are the supported gameplay input methods.

Record any changes to these assumptions under **Decisions** before implementing them.

## Resuming work

Work from the first unchecked item in the current phase. Check an item only when its acceptance condition is met. At the end of a work session, update **Current position** with the next action and any blocker or decision. Keep this file with the project so a later session can continue without reconstructing the plan.

**Current position:** Touch controls are implemented in `app/touch.js` and integrated into `app/play.js`. Short taps retain select-then-place; a 280 ms hold starts a captured-pointer drag with a preview and highlighted destination. Insertion targets are at least 48 CSS pixels wide. Row and viewport edges scroll during dragging; swiping whitespace retains native scrolling. Early movement, release outside an enabled destination, pointer cancellation/capture loss, a second finger, page hiding, window blur, or Escape cancel without moving tiles. Compatibility clicks after a drag are suppressed. After tablet feedback reported a long-press context menu, playable tiles now explicitly prevent contextmenu events, including on nested tile content and after pointer cancellation; the user confirmed dragging now works on their tablet. Following feedback about targeting, highlighting and release now use the actual preview rectangle: its centre selects a direct target, and overlap plus a 12 px margin selects the nearest visible destination. Clipped, covered, or disabled targets are excluded. Geometry checks cover preview-versus-finger alignment, overlap, neighbouring gaps, cancellation outside targets, and fresh release coordinates. The user manually approved the revised touch controls on 11 October 2026; touch acceptance is complete. Drops use the existing session and immutable move rules, including rack, same-row, empty-row, and New row placement; Undo and explicit Check remain shared. All 294 relevant native-runtime checks passed: 81 touch-controller checks, 37 play-session checks, 80 core checks, and 96 appearance/palette checks. The browser runner now contains 504 checks; unchanged solver/generator/worker suites were not rerun. Touch checks use deterministic event/clock/hit-test stubs and do not prove native capture, actual browser scrolling, layout, or tablet comfort. No browser is available for agent-side verification; tablet acceptance is based on the user’s manual approval. Next: implement and verify portrait, landscape, and desktop layouts, keeping tiles legible, the rack accessible, and overflow scrollable without hiding controls. Mouse controls remain user-approved. Responsive layouts and browser worker execution still need their dedicated verification. The revision-1 sample loads directly; future generated play must use the worker service. Preferences remain session-only until Phase 5.

## Phase 1 — Define the game

- [x] Write a compact rules specification for valid groups, runs, duplicate physical tiles, tile movement, and the win condition. **Done when:** examples cover normal and edge cases. See [rummipuz-rules.md](rummipuz-rules.md).
- [x] Define the puzzle data format: version, seed, rack, board rows, difficulty tier, and optional solution metadata. **Done when:** one sample puzzle can be represented unambiguously. See [rummipuz-puzzle-format.md](rummipuz-puzzle-format.md) and [sample-puzzle.json](sample-puzzle.json).
- [x] Define the player flow: choose difficulty, play, undo/reset, check/win, next puzzle, replay, and change difficulty. **Done when:** there is a screen-by-screen outline for PC and tablet. See [rummipuz-player-flow.md](rummipuz-player-flow.md).
- [x] Fix the initial difficulty tiers and progression policy. **Done when:** the starting tier and the conditions for moving up are explicit. See [rummipuz-difficulty.md](rummipuz-difficulty.md).

## Phase 2 — Build the game foundation

- [x] Create a static HTML/CSS/JavaScript app using native browser modules, with local run instructions using Python's built-in HTTP server. **Done when:** it opens on a PC browser and on a tablet browser over the local network. App and instructions implemented; HTTP checks passed and browser opening on PC and tablet confirmed by the user.
- [x] Implement a pure game state and rules module, separate from the interface. **Done when:** it can classify valid rows, track every physical tile, and detect a win. Implemented in `app/rules.js` and `app/state.js`; 47 core checks passed.
- [x] Implement reversible moves and undo/reset. **Done when:** any sequence of moves can be undone without losing or duplicating a tile. Implemented in `app/state.js`; immutable snapshots restore exact tile and row order, and reset clears history.
- [x] Add focused checks for rule edge cases and tile conservation. **Done when:** duplicate tiles, long runs, invalid groups, and undo are covered. All 80 checks passed, including rejected moves, reset recovery, and conservation/exact undo throughout a 200-move sequence.

## Phase 3 — Create and rate puzzles

- [x] Build a solver that determines whether all rack tiles can be used while all board tiles remain in valid rows. **Done when:** it can return a complete solution or report none. Implemented in `app/solver.js`; 36 focused solver checks passed, including exhaustive comparison with an independent physical-tile subset search.
- [x] Build a seeded generator that produces valid starting boards and racks, then uses the solver to reject unsolvable candidates. **Done when:** the same seed always reproduces the same puzzle. Implemented as `generateCandidate` in `app/generator.js`; revision-2 replay fixtures, validation, and rejection checks passed. Candidates remain unpublished until the next step proves their requested difficulty.
- [x] Rate candidate puzzles using features tied to human difficulty: rack size, number of rows touched, required rearrangement, and competing placements. **Done when:** generated samples fall into distinct starting tiers. Exact minimum rearrangement proofs and requested-tier rejection are implemented; revision-3 samples and all 64 focused difficulty checks passed. Initial design calibration is documented in the sample review; actual learner feedback remains future validation.
- [x] Review sample puzzles by hand and tune the tiers. **Done when:** the starting tier teaches one-row rearrangement and later tiers require coordinated changes across more rows, without long generation delays. Eight hand-derived solutions verified the tier sequence. Revision-4 sampling reduces incidental rows and proof work; 64 measured requests all succeeded, maximum about 58 ms on the native runtime. See [rummipuz-sample-review.md](rummipuz-sample-review.md); learner/tablet testing remains pending.
- [x] Move generation/solving off the UI thread if it causes visible pauses. **Done when:** interaction remains responsive while preparing the next puzzle. Dedicated module-worker service implemented; actual worker-thread checks verify main-thread timer progress and cancellation. The browser runner is ready; real browser/tablet confirmation and play-screen wiring remain part of interface verification.

## Phase 4 — Build the PC and tablet interface

- [x] Draw the board and rack with readable HTML tiles. **Done when:** numbers and suits are distinguishable without relying only on colour. Implemented with large numbers, four distinct symbols, visible colour names, accessible labels, and a matching legend. Native rendering and contrast verification passed; browser/tablet visual verification remains pending.
- [x] Add appearance settings: Classic / Light (cream background, green board, ivory tiles), Dark (charcoal background, deep green board, muted ivory tiles), High Contrast (plain backgrounds, strong borders, bold numbers, clear selection outlines, minimal decoration), and System (automatically follow the device's light/dark preference; default setting). **Done when:** changes apply immediately without altering the puzzle or undo history; System reacts to device preference changes, and tiles, controls, feedback, and focus indicators meet WCAG AA contrast requirements in every mode. Implemented with presentation-only switching and live System tracking; all 61 behavior and stylesheet contrast checks passed. Browser/tablet visual verification remains pending; tile selection controls come later in Phase 4.
- [x] Add an alternative tile palette for colour-vision differences as a separate setting usable with any appearance mode. **Done when:** the palette works across Light, Dark, and High Contrast; symbols and colour names remain visible, and logical tile colours, identities, and rules are unchanged. Implemented with independent ink variables shared by the tiles and legend; both palettes pass contrast checks in every appearance mode. Browser/tablet and colour-vision usability review remain pending.
- [x] Add mouse drag and click-to-select/place controls. **Done when:** the full puzzle can be completed comfortably on a PC. Implementation and native session/DOM-event checks passed; the user reviewed and approved the step after status and replay-label refinements.
- [x] Add touch drag and tap-to-select/place controls using the same move rules. **Done when:** the full puzzle can be completed on a tablet without precision gestures. Implemented with 81 passing controller checks; the user manually approved tablet controls on 11 October 2026 after context-menu suppression and forgiving targeting based on the visible tile. See the README touch walkthrough.
- [ ] Make portrait, landscape, and desktop layouts. **Done when:** tiles remain legible, the rack stays accessible, and board overflow scrolls without hiding controls.
- [ ] Show invalid rows, remaining rack count, undo/reset, and clear win feedback. **Done when:** the player can understand why a move cannot finish the puzzle.

## Phase 5 — Progress, offline use, and finishing

- [ ] Save chosen difficulty, completed puzzle seeds, and current puzzle locally. **Done when:** a reload resumes the same state and a completed puzzle cannot be counted twice.
- [ ] Save appearance mode and tile-palette preference locally. **Done when:** reload restores both preferences, System continues following the device rather than saving a fixed light/dark result, and unavailable storage leaves settings usable for the current session.
- [ ] Add unlimited Next Puzzle, difficulty selection, and replay by seed. **Done when:** players can continue indefinitely or start at any tier.
- [ ] Package the static app for offline use as a PWA. **Done when:** it loads after the first visit without a network connection in a supported installed browser context.
- [ ] Document PC local launch and tablet access. **Done when:** instructions cover Python's built-in HTTP server, serving on a local network, and the HTTPS requirement for installing a PWA on a tablet.
- [ ] Verify complete play sessions on a desktop browser and tablet-sized touch layout, including reload, offline launch, win, difficulty change, appearance switching, and the alternative tile palette. **Done when:** all core flows work and remain readable in every appearance mode, including with the alternative palette enabled.

## Decisions

- Remove the dedicated keyboard gameplay implementation and acceptance step at the user’s request on 11 October 2026. Gameplay scope is mouse and touch; retain existing native button behavior and focus indicators.

- Use native JavaScript modules instead of TypeScript/Vite because this machine has Python but no Node or npm. Keep the project free of build dependencies.
- Match the standard numbered-tile inventory: two copies of each value 1–13 in black, blue, red, and orange (104 numbered tiles). Track the copies as distinct physical tiles. The standard set's two jokers bring its total to 106, but joker support remains deferred for the first playable version.
- Runs must appear in ascending numerical order; group colour order is unrestricted. Temporary invalid rows are allowed while rearranging. Any puzzle tile may temporarily return to the rack, including original board tiles; winning requires every puzzle tile on the board exactly once. Empty rows are ignored as layout placeholders. These rules are specified in [rummipuz-rules.md](rummipuz-rules.md).
- Store immutable starting puzzles as versioned JSON, using canonical colour/value/copy tile IDs and ordered rack/row arrays. Replay identifiers must preserve format version, generator version, difficulty tier, and seed so generation changes do not silently change a puzzle. Keep live saved-game state separate. See [rummipuz-puzzle-format.md](rummipuz-puzzle-format.md).
- Use select-then-place controls alongside mouse/touch dragging. Completion is explicit through Check. Keep one active saved session, replacing it only after a new puzzle is ready. Replay codes use `rummipuz:<version>:<generatorVersion>:<difficultyTier>:<seed>`; repeated completions of the same identity earn no additional progression credit. See [rummipuz-player-flow.md](rummipuz-player-flow.md).
- Exclude puzzles requiring no board rearrangement. Use four tiers: Easy, Medium, Hard, and Expert, with Easy as the default and all tiers selectable immediately. Rate tiers by the minimum number of original rows that a solution must rearrange (exactly 1, 2, 3, or at least 4 respectively), with explicit rack/board-size bounds. Three distinct completions at the chosen tier qualify Next for a one-tier promotion; Expert continues without a limit. Preserve per-tier credit across manual changes and replay. See [rummipuz-difficulty.md](rummipuz-difficulty.md).
- Reserve generator revision 1 for the existing hand-authored sample fixture, and implement procedural candidate generation as revision 2 to avoid changing that replay identity. Return unpublished solver-verified candidates until minimum rearrangement difficulty is proved. Fix random/traversal algorithms and work budgets per revision; changes affecting puzzle selection require a new revision. See [rummipuz-generator.md](rummipuz-generator.md).

- Preserve revision-2 candidate generation and introduce rated generation as revision 3 because difficulty filtering changes which puzzle a seed selects. Reject zero-rearrangement, size/tier mismatches, and inconclusive proofs. Correct the Expert example by separating its number ranges; the rules and tier definitions are unchanged.

- Keep tier definitions and full size bounds unchanged after sample review; use narrower revision-4 generation envelopes for clear teaching moves and shorter proofs. Preserve explicit revision-3 replay. Sampling envelopes and fixed work budgets are documented in [rummipuz-sample-review.md](rummipuz-sample-review.md).

- Use a dedicated module worker per preparation/search request, terminating it on cancellation or completion. Keep failures explicit rather than falling back to main-thread search. Callers retain the active session until a replacement is ready.

- Offer Classic / Light, Dark, High Contrast, and System appearance settings, defaulting to System. Keep tiles light in Dark mode so black numbers remain readable. Standard tile colours remain consistent across themes; the alternative tile palette is an independent preference. Keep symbols and colour names visible in every combination, and save appearance settings on the device without changing puzzle data.

## Deferred ideas

- Jokers, hints, scoring, timed challenges, daily featured puzzles, and syncing progress across devices. These are outside the first playable version.
