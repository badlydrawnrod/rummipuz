# Rummipuz player flow — PC and tablet

This outlines the first playable interface using the [rules](rummipuz-rules.md) and [puzzle format](rummipuz-puzzle-format.md). [Difficulty and progression](rummipuz-difficulty.md) defines Easy, Medium, Hard, and Expert, the Easy default, and promotion after three distinct completions at the chosen tier.

## Screens and transitions

| Screen or panel | Content and actions | PC layout | Tablet layout |
| --- | --- | --- | --- |
| Start | Brief goal: “Empty your rack and leave every row valid.” Choose a difficulty and select **Start puzzle**. Offer **Replay puzzle**. With a saved session, offer **Resume** and show its difficulty and rack count. | Compact central panel; keyboard-accessible controls. | Single-column panel with large tap targets in either orientation. |
| Preparing puzzle | Show “Preparing puzzle…” with **Cancel**. On success, open Play. On failure, explain that a puzzle could not be prepared and offer **Retry** or **Back**. | Status in the start panel or over the current play screen. | Same status in a full-width panel; controls remain reachable. |
| Play | Difficulty, replay code, remaining rack count, board, rack, **Undo**, **Reset**, **Check**, **Change difficulty**, **Replay puzzle**, and **Rules**. Show selection and row validity. | Board fills available space, rack stays below it, and actions remain visible. | Portrait stacks header, scrollable board, rack, and actions; landscape uses the wider board area. Rack and core actions stay accessible while the board scrolls. |
| Check feedback | If unfinished, show remaining rack count and specific invalid-row reasons. Selecting a listed row scrolls it into view. **Continue playing** dismisses feedback without changing tiles. A solved position opens Completed. | Inline status beside or above the board. | Status panel above the rack, without covering tile controls. |
| Completed | Show “Puzzle complete”, the finished board, completed difficulty, and the proposed difficulty for the next puzzle. Offer **Next puzzle**, **Replay this puzzle**, and **Change difficulty**. | Completion panel alongside the finished board. | Completion panel with the board still available to inspect by scrolling. |
| Difficulty picker | Show supported tiers and brief descriptions, with the current choice selected. **Start puzzle** prepares a fresh puzzle at the chosen tier; **Cancel** returns to the previous screen. | Dialog or central panel. | Full-width panel with large tier choices. |
| Replay picker | Accept a replay code; offer **Play replay** and **Cancel**. Show a clear error for invalid codes or unavailable puzzles. | Dialog with a text input and paste support. | Full-width panel with text input and paste support. |
| Rules | Explain valid runs/groups, rearrangement, duplicate tiles, and the win condition with examples. **Back to puzzle** returns to the exact prior state. | Scrollable dialog. | Scrollable panel with a persistent back control. |

All panels restore focus to their opening control when closed. Buttons and feedback have readable labels, visible keyboard focus, and accessible status announcements. Colour is supplemented by a consistent symbol and colour name on each tile; for example, an accessible tile label is “Blue 6”. Matching physical copies need not display their internal IDs, but each remains independently selectable.

## Playing and moving tiles

The default interaction is select, then place. Select a tile in the rack or board; highlight it without removing it from its source. Choose a visible insertion position before, between, or after tiles, an empty row, or **New row**. Rack insertion positions also allow any tile to return to the rack. A successful placement is one undoable move; selection alone is not a move.

| Input | Select and place | Cancel or scroll |
| --- | --- | --- |
| Mouse | Click a tile, then an insertion position. Drag-and-drop is an optional equivalent for the same move. | Click the selected tile again or press Escape to clear selection. Wheel/scrollbars move the board viewport. |
| Touch | Tap a tile, then a generous insertion target. Touch drag is also supported; tap-to-place always remains available. | Tap the selected tile again to clear selection. Swiping board whitespace scrolls without moving a tile. |
| Keyboard | Tab reaches controls, tiles, and active insertion targets. Enter or Space selects a focused tile or places it at a focused target. After placement, focus follows the moved tile. **New row** and rack targets work through the same controls. | Escape clears selection or closes a panel. Undo, Reset, and Check are reachable buttons, so shortcuts are not required. |

Dropping outside a destination or cancelling a drag leaves the state unchanged. Focus and selection identify a physical tile even when another tile has the same face. One move may leave invalid rows; the interface never blocks rearrangement solely because a row is temporarily invalid.

Row feedback updates after each move: a valid marker, or a short reason such as “Needs at least 3 tiles”, “Repeated colour”, or “Run has a gap”. Use text/symbols as well as colour. Empty layout rows do not produce an error. The rack counter includes original board tiles temporarily moved there.

## Undo, reset, check, and completion

- **Undo** restores the preceding move, including tile identities and order, and clears any selection. Disable it when there is no move history. Repeated undo can return to the starting position; redo is outside this version.
- **Reset** asks “Restart this puzzle?” when there are changes, offering **Restart** and **Keep playing**. Restart restores the original board/rack, clears history and selection, and preserves the puzzle identity and any recorded completion. With no changes, disable Reset.
- **Check** evaluates the entire position without changing it. Unfinished feedback lists remaining rack tiles and invalid rows. An internal tile-conservation error produces an error message and a **Reset puzzle** recovery action; it cannot produce completion.
- Completion occurs on **Check** when the rack is empty, all nonempty rows are valid, and all tiles are conserved. When a move reaches a valid empty-rack state, show “Ready to check” and keep Check prominent. There is no hidden requirement to match the supplied solution.
- On completion, record the puzzle identity once, show Completed, and stop board editing. **Replay this puzzle** restores its original position with an empty undo history. Re-completing a recorded puzzle does not add another completion or advance progression again.
- **Next puzzle** prepares a fresh puzzle at the progression policy's proposed tier, showing that tier before the player proceeds. Three distinct completions at the chosen tier qualify for the next tier; Expert continues indefinitely. Difficulty changes are always available. See [difficulty and progression](rummipuz-difficulty.md) for replay credit and manual-selection behaviour.

## Changing puzzles and replaying

Opening a picker does not change the current puzzle. Starting a replacement from an unfinished puzzle asks “Leave this puzzle and start another?” with **Start another** and **Keep playing**; make clear that the old in-progress arrangement will be replaced. Cancelling, an invalid replay code, or generation failure keeps the previous puzzle and undo history intact. Replace the active session only when the new puzzle is ready. There is one active saved session, rather than multiple unfinished puzzles.

Changing difficulty selects a fresh generated puzzle; it never modifies the existing puzzle's tiles or rating. Replay opens the exact original puzzle at its recorded tier, while preserving the chosen difficulty for future generated puzzles. After a replay completes, Next follows the normal progression policy; a previously recorded completion contributes no new promotion credit.

Use this replay-code encoding for version 1: `rummipuz:<version>:<generatorVersion>:<difficultyTier>:<seed>`. For example, `rummipuz:1:1:1:sample-rearrangement-001` identifies the sample fixture. Validate all parts against the puzzle format; trim surrounding whitespace from the pasted code, but preserve the seed's case and contents. A bare seed is insufficient. The Play and Completed screens offer **Copy replay code**, with selectable text as a fallback if copying is unavailable.

Replay first uses a matching stored starting puzzle, otherwise a supported generator revision. An unavailable revision or tier produces an explanatory error without opening a different puzzle. The hand-authored sample code works only when its fixture is available; it is not evidence that a generator can reproduce the sample.

## Resume and interruption

After persistence is implemented, save each completed move, reset, and completion together with the immutable starting puzzle, undo history, chosen difficulty, and replay identity. Reload offers Resume for the saved position, including its history or Completed screen. Selection, an unfinished drag, and transient panels are not resumed; a reload during a drag resumes the last completed move. Preparing a replacement never overwrites the saved puzzle until preparation succeeds.

If local storage is unavailable, keep the current session playable and display “Progress cannot be saved on this device.” If a saved session fails validation, explain that it cannot be resumed and offer a new puzzle rather than silently counting it as completed. Offline play follows the same screens once the app is available offline; no sign-in or network request is required to prepare puzzles.

## Walkthroughs for later interface verification

1. **PC:** Start at a chosen tier → select/place or drag tiles → Undo → Reset and cancel → open Rules and return → Check an invalid position → finish and Check → inspect Completed → Next puzzle.
2. **Keyboard:** Start → select a tile with Enter → navigate to a placement target → place → cancel selection with Escape → Undo → finish and Check, all with visible focus and no pointer.
3. **Tablet:** Start in portrait → tap/place a tile → scroll the board → rotate to landscape without changing state → touch-drag another tile → Check → complete → change difficulty and start again.
4. **Replay/resume:** Copy a code → open Replay and cancel → reject an invalid code without losing moves → replay a valid code → reload and Resume → complete the same puzzle twice and confirm only one completion is recorded.

These are acceptance scenarios for later implementation, not claims that an interface already exists.
