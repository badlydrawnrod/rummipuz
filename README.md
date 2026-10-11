# Rummipuz

A local Rummikub-style puzzle game for PC and tablet. The current app opens a playable sample board and rack, shows readable tiles with distinct symbols and colour names, all four difficulty descriptions, the rules, and Classic / Light, Dark, High Contrast, and System appearance choices plus an independent alternative tile palette. Pure rules, reversible moves, a solver, seeded generation with proven tiers, and cancellable worker execution are implemented. Mouse selection/placement and drag/drop, touch tap-to-place and press-and-hold dragging, Undo, confirmed Reset, Check, and sample replay are implemented. The user manually approved tablet touch controls after context-menu and destination-targeting refinements. Current puzzle state, undo history, chosen difficulty, and completed replay identities are saved locally. Unlimited generated play is available through module workers: choose any difficulty and Start puzzle, continue with Next Puzzle after completion, or enter a full replay code. The sample remains available, and saved sessions can resume.

## Run on a PC

Python 3 is the only launch dependency. From this project directory:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory app
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in a modern browser, then select **Open sample puzzle**. On systems where Python is named `python` or `py`, substitute that command for `python3`. Stop the server with Ctrl+C. If the port is occupied, use another port in both the command and URL.

Use the HTTP server rather than opening `index.html` as a file: native JavaScript modules and the sample JSON are loaded over HTTP. There is no build step, package manager, application server, or external asset request.

## Open on a tablet over your local network

1. Connect the PC and tablet to the same local network.
2. Start the server from the project directory with:

   ```bash
   python3 -m http.server 8000 --bind 0.0.0.0 --directory app
   ```

3. Find the PC's local IPv4 address in its network settings, for example `192.168.1.25`.
4. On the tablet, open `http://192.168.1.25:8000`, substituting the actual PC address. Keep the PC awake and the server running. If needed, permit incoming TCP port 8000 on the PC's private-network firewall; guest Wi-Fi/client isolation can prevent device-to-device access.
5. Open the sample, compare the tile symbols and names with the legend, expand **How to play**, and check portrait and landscape. Longer board rows and the rack scroll horizontally without shrinking the tiles; focus their scroll areas with Tab to scroll using the keyboard.

The `--directory app` option serves only the public app files, rather than repository metadata and configuration. Local HTTP is sufficient for this preview. PWA installation and offline support are not implemented yet; tablet PWA use will require HTTPS, as described in the implementation plan.

## Project layout

- `app/index.html`, `styles.css`, `main.js`, and `tiles.js`: buildless static app and native browser modules.
- `app/play-session.js`, `play.js`, and `touch.js`: transient selection/drag, mouse and touch event handling, interactive board/rack rendering, and sample completion controls using the pure state module.
- `app/overflow.js`: directional arrow cues beside overflowing board rows and the rack, refreshed on scroll, rendering, and resize.
- `app/puzzle-flow.js`: cancellable puzzle preparation, fresh seeds, progression proposals, and exact replay resolution.
- `app/progress.js`: versioned local progress storage, saved-session validation, resume, and completion credit without duplicate counting.
- `app/appearance.js`: appearance and tile-palette switching with live device preference tracking, independent of puzzle state.
- `app/preferences.js`: local appearance/palette preferences, validation, and session fallback when storage is unavailable.
- `app/rules.js` and `state.js`: pure row classification, puzzle validation, tile tracking, win detection, reversible moves, and undo/reset.
- `app/solver.js`: pure deterministic search for a complete valid arrangement of every puzzle tile.
- `app/generator.js`: seeded, solver-verified candidate generation with versioned replay behavior.
- `app/preservation.js` and `difficulty.js`: constrained physical-row preservation and minimum rearrangement proofs.
- `app/rated-generator.js`: reviewed revision-4 generation with proven requested tiers and preserved revision-3 replay.
- `app/puzzle-service.js` and `puzzle-worker.js`: asynchronous module-worker boundary for generation, solving, and rating, with cancellation and cleanup.
- `app/checks/`: dependency-free checks, including independent exhaustive searches and saved replay fixtures.
- `app/puzzles/sample.json`: public runtime copy of `plans/sample-puzzle.json`; keep these files identical when updating the fixture.
- `plans/`: rules, data format, player flow, difficulty policy, and the implementation checklist.

Follow [the implementation plan](plans/rummipuz-implementation.md) for the next step.

## Core modules and checks

The pure modules have no browser, storage, or external dependency. The generator owns a deterministic seeded random stream. The asynchronous service uses browser module workers:

| API | Result |
| --- | --- |
| `parseTile(id)` | Decoded physical tile identity, colour, number, and copy; `null` for an invalid ID. |
| `classifyRow(row)` | `{ valid, kind, reason }`, with kind `group`, `run`, `empty`, or `invalid`. |
| `createGameState(puzzle)` | Detached, frozen state containing puzzle metadata, the original `inventory`, `rack`, `board`, immutable `initial` layout, and empty `history`; throws for malformed starting data or an invalid supplied solution. |
| `getTileLocations(state)` | Map of physical IDs to location arrays: `{ area: 'rack', index }` or `{ area: 'board', row, index }`. Multiple locations expose duplicates. |
| `checkState(state)` | `{ won, conserved, remainingRack, invalidRows, errors }`. Row indices are zero-based. Invalid temporary rows are unfinished positions; inventory failures are state errors. |
| `moveTile(state, id, destination)` | New frozen state with one undo entry; destinations are `{ area: 'rack', index }`, `{ area: 'board', row, index }`, or `{ area: 'new-row' }`. Rejects missing tiles, invalid destinations, and corrupt inventory without changing the input. |
| `undoMove(state)` | New frozen state restoring the preceding layout and removing its history entry; returns the input when history is empty. |
| `resetGame(state)` | New frozen state restoring `initial` and clearing history, preserving puzzle metadata and inventory. Can recover a corrupt live layout when the original layout is intact. |
| `solveState(state, { maxNodes = Infinity })` | `{ status, board, nodes }`, where status is `solved`, `unsolvable`, or `limit`. A solved board contains every original tile exactly once in valid rows; otherwise board is `null`. Throws for malformed/nonconserved states or invalid budgets. |
| `generateCandidate({ version = 1, generatorVersion = 2, difficultyTier = 1, seed })` | `{ status, puzzle, attempts, rejected }`. Status is `candidate` for an immutable solver-verified puzzle or `exhausted` with a null puzzle. Unsupported identities throw. Requested tier size bounds are enforced; rearrangement difficulty remains unproven. |
| `ratePuzzle(puzzle, { maxNodes = 200000 })` | `{ status, tier, board, nodes, features }`. Status is `rated`, `excluded`, `unsolvable`, or `limit`. Awards the actual tier only after proving minimum rearrangement and checking size bounds. Supports up to nine starting rows. |
| `rearrangedRows(state, board)` | Original row indices not preserved in a complete conserved solution, using physical identities. |
| `generatePuzzle({ version = 1, generatorVersion = 4, difficultyTier = 1, seed })` | `{ status, puzzle, attempts, rejected }`. `ready` includes an immutable puzzle, solution, and rating features; `exhausted` has a null puzzle. Only the requested tier is accepted. |
| `createPuzzleService()` | Worker-backed `generate(identity, { signal })`, `solve(state, { signal, maxNodes })`, `rate(puzzle, { signal, maxNodes })`, and `dispose()`. Requests return promises with the same results as the pure modules. |

Insertion indices are gaps in the destination **before** removal, from zero through its length. Moving within the same location adjusts the gap after removal; gaps immediately before/after the selected tile return the input without adding history. Moves permit temporary invalid rows and retain empty source rows as layout placeholders. Undo restores tile order and row layout exactly. All returned positions and history snapshots are immutable. Reset confirmation, selection, and completion records belong to the interface/session layer.

Keep the original inventory when constructing later positions; never derive a new inventory from moved tiles. Win checking accepts any valid complete arrangement, independent of supplied solution metadata. Starting puzzles without solution metadata require `solveState` to return `solved` before publication.

The solver enumerates every available run interval and three/four-colour group, then searches for an exact partition using face counts, the most constrained remaining face, and memoized failed positions. Physical copy IDs are assigned deterministically to the result, which is verified through `checkState`. Current tile placement and stored solution metadata do not influence the search; temporary invalid rows are accepted when inventory is conserved. It returns a final arrangement, rather than a move sequence or difficulty rating. Search is synchronous and exhaustive by default. A finite node budget bounds search work; `limit` is inconclusive and must never be used as proof of unsolvability or tier membership. The puzzle service runs searches in a worker; difficulty proofs are provided by the rating module.

Rated generation rejects zero-rearrangement, size-mismatched, tier-mismatched, unsolvable, and inconclusive candidates. Revision 4 is the reviewed default; explicit revision 3 preserves its original replay, revision 2 preserves candidate replay, and revision 1 resolves through the stored sample. Algorithms and budgets are specified in [the generation contract](plans/rummipuz-generator.md). Rating treats selected original rows as indivisible physical-tile blocks, permits valid extensions and merges, and exhausts every choice of fewer changed rows before proving the minimum. Features include rack size, board rows, minimum rearrangement, a witness's changed-row indices, and competing placements counted as initially valid rack-tile insertion gaps. The app prepares generated play through the worker service. The [sample review](plans/rummipuz-sample-review.md) records eight hand-derived solutions and smaller revision-4 sampling envelopes. A 64-seed native-runtime probe peaked around 58 ms; the worker boundary protects the main thread, and actual learner/tablet testing remains pending.

The interface uses the service for interactive preparation; keep direct search calls in the worker or pure-module checks. Each request has a dedicated worker. Abort terminates even synchronous search, rejects with `AbortError`, and ignores late replies. `dispose()` cancels every pending request and prevents new ones. Worker construction/loading, search, and cloning errors reject without a synchronous fallback. Cloned results are deeply frozen again. Preparation has no reference to an active session; a caller replaces it only after a `ready` result and retains it on cancellation, failure, or exhaustion. Revision 2 generation returns its original `candidate` result; revisions 3/4 retain `ready` results. The revision-1 fixture is loaded directly rather than generated.

```js
import { createPuzzleService } from './puzzle-service.js';
const preparation = createPuzzleService();
const controller = new AbortController();
const pending = preparation.generate(
  { difficultyTier: 1, seed: 'example' },
  { signal: controller.signal },
);
// Cancel button: controller.abort();
const result = await pending;
// Replace the current session only when result.status === 'ready'.
// On application teardown: preparation.dispose();
```

Module workers load over HTTP through the same static server. A browser without module-worker support receives an error; it never runs preparation on the main thread. The playable sample loads its stored fixture directly. Generated-puzzle session wiring is implemented; desktop/tablet verification remains pending.

With the same Python server running, open [http://127.0.0.1:8000/checks/](http://127.0.0.1:8000/checks/). The page reports all checks or the first failure. There are 679 checks (80 core, 36 solver, 51 generator, 64 difficulty, 33 review, 15 worker lifecycle, 11 real-worker checks, 96 appearance/palette checks, 41 preference-persistence checks, 37 play-session checks, 40 progress-persistence checks, 81 touch-controller checks, 39 overflow-control checks, 39 puzzle-flow checks, and 16 real-worker play-flow checks). These include independent search oracles, saved replay fixtures, hand-derived solutions, a 200-move undo sequence, worker error/cleanup races, concurrent cancellation, and main-thread heartbeat progress during search. Pure and lifecycle checks run in native-module runtimes; real-worker checks also accept a worker adapter. The original 290 passed using native worker threads executing the actual worker module; appearance/palette and play-session checks passed separately. For preference saving, all 409 relevant checks passed (38 preferences, 40 progress, 37 overflow, 81 touch, 80 core, 37 play-session, and 96 appearance/palette); unchanged solver/generator/worker suites were not rerun. The touch suite uses deterministic events, clocks, and hit-test stubs to exercise the actual controller. It cannot verify native pointer capture, browser scrolling, layout, or tablet comfort. No browser was available in that session. No Node installation or package manager is needed for the browser runner.

## Verify appearance manually

Use the **Appearance** selector above the sample preview. Switch through Classic / Light, Dark, and High Contrast before and after opening the puzzle. Check that numbers, symbols, names, controls, loading feedback, and keyboard focus remain readable. Tiles and replay code should stay unchanged. High Contrast has plain backgrounds, strong borders, bold numbers, and no tile shadows; Dark retains light tiles.

Select **System**, then change the device's light/dark preference while the page is open: the appearance and status should follow. Select an explicit mode and repeat the device change: the selected mode should remain active. Inspect narrow/tablet layouts and 200% zoom. Reload should restore the chosen appearance. With System selected, change the device preference before reloading: the app should keep System selected and use the current device appearance.

Use **Tile palette → Alternative** with each appearance mode. The legend and tiles should use charcoal, deep blue, purple, and ochre inks while keeping the same numbers, symbols, and logical colour names (a purple heart still says “Red”). Switch appearances and change the device preference in System mode: the palette choice should remain selected. Switching back to Standard restores the original inks without changing the puzzle or replay code. Reload should restore the chosen palette independently of appearance. If storage is unavailable, both settings remain usable until reload and the appearance note explains that choices cannot be saved.

## Verify mouse play manually

Open the sample. Click any tile: its selection outline and the selection message should identify it. Click it again or **Cancel selection** to clear selection without moving it. Click a selected tile, then a **+** target before, between, or after tiles, or **New row**. Temporary invalid rows are allowed and their reasons appear beside the row number. Dragging to the same targets is an equivalent move; dropping outside them or cancelling a drag must leave every tile in place.

Complete this sample:

1. Move **Blue 6** from the end of row 1 to **New row**.
2. Move **Red 6** from the rack to the **+** after Blue 6 in row 3.
3. Move **Black 6** from the rack to the **+** after Red 6 in row 3.
4. The rack should be empty and the status should say **Ready to check**. Select **Check** to complete; tile editing then stops. **Replay** restores the starting arrangement.

Try that sequence once with clicks and once with dragging. Also check **Undo**, moving a board tile back into the rack, moving within a row, and **Reset → Keep playing** versus **Reset → Restart**. Checking an unfinished position should report the remaining rack count and invalid rows. Switch appearances and palettes during play: selection, tile positions, and undo history should remain unchanged. Reopening the puzzle preserves the current session; after a page reload, **Resume puzzle** restores the saved position and undo history. The user reviewed and approved mouse controls; agent-side browser verification remains unavailable.

## Verify touch play manually

On a tablet, complete the same three-move sample first by tapping a tile and then a **+** or **New row**. Tap the selected tile again to cancel. Insertion targets are at least 48 CSS pixels wide. Try board-to-rack moves, insertion within a row, and placement into an empty row.

Repeat with touch dragging: hold a tile still for about a quarter of a second until a preview appears, then move the visible tile over a **+** or **New row**. Targeting follows the visible tile rather than your finger. Its centre selects a target directly; overlapping a nearby target, with a small extra margin, selects the nearest visible destination. The chosen destination gets a solid outline; release when the intended destination is highlighted. Holding a playable tile should not open the browser context menu. Release there to place the tile. Move near a row's left/right edge to scroll it, or near the screen's top/bottom edge to scroll the page during dragging. A quick movement before the hold threshold cancels the gesture; it must not select or move a tile. Swipe row labels, gaps, or other whitespace to scroll normally; tile surfaces reserve gestures for selection and dragging.

Release outside a destination, add a second finger, or switch away from the page while holding a tile. Every tile and undo entry must stay unchanged, and the preview/highlight must disappear. After a cancelled or successful drag, the next tap should work immediately, without an accidental selection from the drag's release. Try **Undo**, **Reset**, **Check**, and **Replay**, and repeat in portrait/landscape with each appearance and palette. Confirm tile editing stops after completion. The user manually approved the touch-controls step on 11 October 2026. This walkthrough remains available for regression checks; broader appearance verification remains in the implementation plan; the dedicated responsive-layout step was removed at the user’s request.

## Verify overflow arrows manually

Open the sample on a screen narrow enough for row 1 to overflow. A right arrow should appear beside the row; tap or click it to scroll one tile plus its **+** marker and the spacing between them. After scrolling, a left arrow should appear too. At either end, only the direction with more content should remain visible; the unavailable arrow should leave no empty space. The arrows sit outside the tiles and insertion targets. Swiping or dragging near the scroll edges should update the arrows as well.

Move board tiles into the rack until it overflows and check the same cues there. Resize or rotate the device: arrows should disappear completely when the contents fit, then return when they overflow. Undo, Reset, Check, and Replay should refresh the cues after tile counts change. After removing a tile, a trailing **+** alone must not keep the right arrow visible: the placement marker should be exposed instead. The same rule applies to the leading **+** on the left; an arrow should appear only when a tile is clipped. If only the two end markers overflow, scrolling must not repeatedly jump between the ends. A right-arrow tap must advance smoothly through the leading **+** without snapping back; end-marker adjustments wait until scrolling stops. Scrolling with an arrow must preserve selection, tile positions, and undo history. Check all appearance modes and both palettes. Reduced-motion preferences should make arrow scrolling immediate. The user confirmed manual checks pass on 11 October 2026; overflow controls are approved. Automated checks use mocked dimensions and scroll events; this walkthrough remains available for regression checks.

## Resume and local progress

Each completed move, Undo, Reset, Replay, and successful Check saves the current puzzle and its undo history. Reload, then select **Resume puzzle** to return to that exact arrangement. A completed puzzle resumes with tile editing locked and Replay available. Selection, an unfinished drag, and transient confirmation panels are not restored. The original starting board and rack are saved separately from the current arrangement.

Completion records use the full replay code, including puzzle version, generator revision, tier, and seed. Completing the same puzzle again does not earn another credit. Credits are retained per tier and capped at three. The chosen difficulty is stored independently, with Easy as the default. Starting a generated puzzle commits the selected tier only after preparation succeeds; replay preserves this choice. Appearance and palette preferences are saved separately from puzzle progress; changing them preserves the current puzzle and undo history.

Progress is stored in your browser for this site's address and port. Use the same address to resume; a PC and tablet keep separate progress. If storage is blocked or full, the app displays **Progress cannot be saved on this device** and keeps play and duplicate protection working in memory. An invalid or unsupported saved record cannot resume or award completion; the app explains this and offers the existing sample button to start again.

For manual verification, make two sample moves, reload, and Resume. Confirm the rack, board, and undo history match; Undo should restore the preceding move. Test Reset after resuming, then finish the sample and Check. Reload and Resume again: the completed board should remain locked. Replay and complete it again; it should retain just one completed identity in the `rummipuz.progress.v1` local-storage record. Reload during a selection or unfinished drag: only the last completed move should resume. Repeat on tablet and with storage unavailable. Automated storage checks pass; browser/tablet reload verification remains pending.

Preference persistence uses the separate `rummipuz.preferences.v1` local-storage record. Verify by choosing Dark and Alternative, reloading, and resuming the puzzle: both settings, tile positions, and Undo should remain as saved. Repeat with Light, High Contrast, and System. Invalid saved preferences fall back to System and Standard with an explanatory note; changing either setting replaces the invalid record. Browser/tablet reload verification remains pending.

After a startup storage-access failure, changing an appearance or palette choice retries access so a temporary failure does not disable saving for the session. The user confirmed preference retention on desktop and tablet after the fix. All 41 preference and 96 appearance checks passed after the recovery fix.

## Generated play, difficulty, and replay

Choose Easy, Medium, Hard, or Expert and select **Start puzzle**. Every tier is available immediately. Preparation runs in a module worker and offers **Cancel preparation**. When replacing an unfinished puzzle, confirm **Start another** or choose **Keep playing**. The saved puzzle and undo history remain intact until a replacement is ready. Failure offers **Retry**; a generated retry uses a fresh seed. Cancelling or failure preserves the chosen difficulty and completion credits.

After a successful Check, **Next Puzzle** appears above the board with its proposed tier. Three distinct completions at the chosen tier propose exactly one tier up; Expert continues indefinitely. Manually selecting a tier starts there directly, even when its credit qualifies for promotion. The picker shows each tier's credit, and credits survive manual changes, replay, and reload. Promotion commits only after the next puzzle is ready.

Use **Copy replay code** below the rack, or copy the selectable code if clipboard access is unavailable. **Replay puzzle** focuses the code input; paste a full code and select **Play replay**. Surrounding whitespace is trimmed and seed case is preserved. A bare seed is insufficient. Replay first uses a matching saved starting puzzle, then the revision-1 sample fixture or a supported generator revision (2, 3, or 4). An unsupported or unavailable code reports an error without replacing play. Replay restores the initial arrangement with no undo history, and never changes the chosen tier for future generated puzzles. The existing **Replay** button after completion also restarts the current puzzle directly.

Manual verification still needed on desktop and tablet:

1. Start each tier, move tiles, then try replacing the unfinished puzzle. Cancel confirmation and cancel preparation; the board and Undo must stay intact. Start a replacement successfully and confirm old controls do not trigger duplicate moves.
2. Complete three distinct Easy puzzles. Next must propose Medium. Cancel preparation and confirm Easy remains chosen; accept a ready Next and confirm Medium is saved. Manually choose Easy and confirm it starts at Easy despite its three credits. Expert Next must keep producing new Expert puzzles.
3. Copy a generated code, start another puzzle, then replay the copied code. Its initial tiles and tier must match exactly. Try the sample code, a revision-2/3 code, an invalid code, and an unsupported revision. Errors must preserve the current position and Undo. Replay at a different tier must leave future generated difficulty unchanged.
4. Reload during preparation: Resume must restore the previous saved puzzle. Reload after successful preparation: Resume must restore the new puzzle. Verify duplicate completion protection, appearances, palettes, mouse/touch movement, and overflow arrows on generated puzzles.

All 679 native-runtime checks passed for this step, including actual worker-thread execution of the worker module and all-tier play-flow integration. These checks cover deterministic generation, progression, exact replay, failure/exhaustion, stale replies, cancellation, and existing gameplay regressions. No browser was available; browser module loading, clipboard behavior, layout, and tablet interaction remain manual verification tasks. No PWA/offline support is included in this step.
