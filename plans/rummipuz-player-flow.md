# Rummipuz player flow — PC and tablet

This outlines the playable interface using the [rules](rummipuz-rules.md), [puzzle format](rummipuz-puzzle-format.md), and [fixed difficulty policy](rummipuz-difficulty.md). Easy, Medium, Hard, and Expert are immediately selectable; fresh Start and Next stay at the chosen tier until the player starts a puzzle at another tier.

## Screens and transitions

| Screen or panel | Content and actions | PC layout | Tablet layout |
| --- | --- | --- | --- |
| Start | Brief goal: “Empty your rack and leave every row valid.” Choose a difficulty and select **Start puzzle**. Offer **Replay puzzle**. With a saved session, offer **Resume** and show its difficulty and rack count. | Compact central panel; keyboard-accessible controls. | Single-column panel with large tap targets in either orientation. |
| Preparing puzzle | Show “Preparing puzzle…” with **Cancel**. On success, open Play. On failure, explain that a puzzle could not be prepared and offer **Retry** or **Back**. | Status in the start panel or over the current play screen. | Same status in a full-width panel; controls remain reachable. |
| Play | Difficulty, replay code, remaining rack count, board, rack, **Undo**, **Reset**, **Check**, **Reveal solution**, **Change difficulty**, **Replay puzzle**, and **Rules**. Show selection and row validity. | Board fills available space, rack stays below it, and actions remain visible. | Portrait stacks header, scrollable board, rack, and actions; landscape uses the wider board area. Rack and core actions stay accessible while the board scrolls. |
| Solution preview | A cancellable worker search opens a read-only, verified complete arrangement in a labelled modal. Show all physical tiles in valid rows, an empty rack, and **Close**. Cancel or retry an unfinished search. Closing returns focus to **Reveal solution** without changing the live puzzle or its view. | Scrollable modal with horizontal row scrolling for long solutions. | Full-width, vertically scrollable modal with horizontal row scrolling and touch-friendly controls. |
| Check feedback | If unfinished, show remaining rack count and specific invalid-row reasons. Selecting a listed row scrolls it into view. **Continue playing** dismisses feedback without changing tiles. A solved position opens Completed. | Inline status beside or above the board. | Status panel above the rack, without covering tile controls. |
| Completed | Show “Puzzle complete”, the finished board, and its difficulty. Offer **Next puzzle**, **Replay this puzzle**, and **Change difficulty**. Next uses the saved chosen tier. | Completion panel alongside the finished board. | Completion panel with the board still available to inspect by scrolling. |
| Difficulty picker | Show supported tiers and brief descriptions, with the current choice selected. **Start puzzle** prepares a fresh puzzle at the chosen tier; **Cancel** returns to the previous screen. | Dialog or central panel. | Full-width panel with large tier choices. |
| Replay picker | Accept a replay code; offer **Play replay** and **Cancel**. Show a clear error for invalid codes or unavailable puzzles. | Dialog with a text input and paste support. | Full-width panel with text input and paste support. |
| Rules | Explain valid runs/groups, rearrangement, duplicate tiles, and the win condition with examples. **Back to puzzle** returns to the exact prior state. | Scrollable dialog. | Scrollable panel with a persistent back control. |
| Appearance | Accessible from Start, Play, and Completed. Select Classic / Light, Dark, High Contrast, or System (default), plus an independent alternative tile palette for colour-vision differences. Apply changes immediately; **Back** returns to the previous screen without altering puzzle state or undo history. | Dialog with labelled choices. | Scrollable full-width panel with large choices and a persistent back control. |

All panels restore focus to their opening control when closed. Buttons and feedback have readable labels, visible keyboard focus, and accessible status announcements. Colour is supplemented by a consistent symbol and colour name on each tile; for example, an accessible tile label is “Blue 6”. Matching physical copies need not display their internal IDs, but each remains independently selectable.

## Playing and moving tiles

Appearance preferences are saved on the device. System follows the device's light/dark preference, including changes while the app is open. All themes retain tile symbols and colour names, readable feedback, and visible focus indicators. The alternative palette works with every theme and changes display colours only; a tile labelled “Blue 6” retains its logical colour and physical identity. If storage is unavailable, changes still apply for the current session with the existing unsaved-progress notice.

Gameplay supports mouse and touch; a dedicated keyboard gameplay flow is outside the scope. The default interaction is select, then place. Select a tile in the rack or board; highlight it without removing it from its source. Choose a visible insertion position before, between, or after tiles, or **New row**. Rack insertion positions also allow any tile to return to the rack. A successful placement is one undoable move; selection alone is not a move.

| Input | Select and place | Cancel or scroll |
| --- | --- | --- |
| Mouse | Click a tile, then an insertion position. Drag-and-drop is an optional equivalent for the same move. | Click the selected tile again or press Escape to clear selection. Wheel/scrollbars move the board viewport. |
| Touch | Tap a tile, then a generous insertion target. Touch drag is also supported; tap-to-place always remains available. | Tap the selected tile again to clear selection. Swiping board whitespace scrolls without moving a tile. |

Dropping outside a destination or cancelling a drag leaves the state unchanged. Focus and selection identify a physical tile even when another tile has the same face. One move may leave invalid rows; the interface never blocks rearrangement solely because a row is temporarily invalid.

Row feedback updates after each move: a valid marker, or a short reason such as “Needs at least 3 tiles”, “Repeated colour”, or “Run has a gap”. Use text/symbols as well as colour. Empty layout rows are hidden and do not produce an error; one **New row** destination remains during play, including when the entire board is empty. Temporary one- and two-tile rows stay visible. Labels, placement targets and Check feedback use consecutive visible row numbers. Underlying empty placeholders remain in state and saved history for exact Undo/Reset. Session row IDs retain horizontal view positions independently of visible numbering. The rack counter includes original board tiles temporarily moved there.

## Undo, reset, check, and completion

- **Undo** restores the preceding move, including tile identities and order, and clears any selection. Disable it when there is no move history. Repeated undo can return to the starting position; redo is outside this version.
- **Reset** asks “Restart this puzzle?” when there are changes, offering **Restart** and **Keep playing**. Restart restores the original board/rack, clears history and selection, and preserves the puzzle identity and any recorded completion. With no changes, disable Reset.
- **Check** evaluates the entire position without changing it. Unfinished feedback lists remaining rack tiles and invalid rows. An internal tile-conservation error produces an error message and a **Reset puzzle** recovery action; it cannot produce completion.
- **Reveal solution** searches the conserved puzzle inventory in a cancellable worker, verifies the returned physical tiles and valid rows, and opens a read-only preview. It does not apply moves, alter completion, or write progress. Work limits and errors offer retry; a proved unsolvable inventory is reported separately.
- Completion occurs on **Check** when the rack is empty, all nonempty rows are valid, and all tiles are conserved. When a move reaches a valid empty-rack state, show “Ready to check” and keep Check prominent. There is no hidden requirement to match the supplied solution.
- On completion, record the puzzle identity once, show Completed, and stop board editing. **Replay this puzzle** restores its original position with an empty undo history. Replaying or re-completing a recorded identity does not duplicate its completion record.
- **Next puzzle** prepares a fresh puzzle at the saved chosen tier, regardless of completion count. Difficulty changes are always available through the picker and **Start puzzle**. See the [fixed difficulty policy](rummipuz-difficulty.md) for persistence and replay behaviour.

## Changing puzzles and replaying

Opening a picker does not change the current puzzle. Starting a replacement from an unfinished puzzle asks “Leave this puzzle and start another?” with **Start another** and **Keep playing**; make clear that the old in-progress arrangement will be replaced. Cancelling, an invalid replay code, or generation failure keeps the previous puzzle and undo history intact. Replace the active session only when the new puzzle is ready. There is one active saved session, rather than multiple unfinished puzzles.

Changing difficulty and successfully starting a fresh puzzle saves the new tier; it never modifies the existing puzzle's tiles or rating. Replay opens the exact original puzzle at its recorded tier without changing the saved choice for future puzzles. Next always follows that saved choice.

Use this replay-code encoding for version 1: `rummipuz:<version>:<generatorVersion>:<difficultyTier>:<seed>`. For example, `rummipuz:1:1:1:sample-rearrangement-001` identifies the sample fixture. Validate all parts against the puzzle format; trim surrounding whitespace from the pasted code, but preserve the seed's case and contents. A bare seed is insufficient. The Play and Completed screens offer **Copy replay code**, with selectable text as a fallback if copying is unavailable.

Replay first uses a matching stored starting puzzle, otherwise a supported generator revision. An unavailable revision or tier produces an explanatory error without opening a different puzzle. The hand-authored sample code works only when its fixture is available; it is not evidence that a generator can reproduce the sample.

## Resume and interruption

After persistence is implemented, save each completed move, reset, and completion together with the immutable starting puzzle, undo history, chosen difficulty, and replay identity. Reload offers Resume for the saved position, including its history or Completed screen. Selection, an unfinished drag, and transient panels are not resumed; a reload during a drag resumes the last completed move. Preparing a replacement never overwrites the saved puzzle until preparation succeeds.

If local storage is unavailable, keep the current session playable and display “Progress cannot be saved on this device.” If a saved session fails validation, explain that it cannot be resumed and offer a new puzzle rather than silently counting it as completed. Offline play follows the same screens once the app is available offline; no sign-in or network request is required to prepare puzzles.

## Walkthroughs for later interface verification

1. **PC:** Start at a chosen tier → select/place or drag tiles → Undo → Reset and cancel → reveal and close a solution while preserving the play state → open Rules and return → Check an invalid position → finish and Check → inspect Completed → Next puzzle.
2. **Tablet:** Start in portrait → tap/place a tile → scroll the board → reveal and close a solution with long rows → rotate to landscape without changing state → touch-drag another tile → Check → complete → change difficulty and start again.
3. **Replay/resume:** Copy a code → open Replay and cancel → reject an invalid code without losing moves → replay a valid code → reload and Resume → complete the same puzzle twice and confirm only one completion is recorded.
4. **Appearance:** Switch through Light, Dark, and High Contrast during play → enable the alternative palette with each theme → confirm tiles, feedback, and focus remain readable and moves/history are unchanged → select System and change the device preference → reload and confirm both settings are retained.

These are acceptance scenarios for later implementation, not claims that an interface already exists.
