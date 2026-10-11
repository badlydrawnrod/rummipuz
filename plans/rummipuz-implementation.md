# Rummipuz implementation plan

## Goal and scope

Build a local, replayable Rummikub-style puzzle game for PC and tablet. Each puzzle starts with a valid board and a rack; the player wins by placing every rack tile while leaving every board row valid. Players can select a starting difficulty, and completed puzzles lead to progressively harder ones. Puzzles are generated on demand, with no daily limit.

**Status:** Phase 1 in progress; rules specification complete. App implementation has not started.

## Working assumptions

- Use modern JavaScript modules, HTML, and CSS with no build step or package manager. Render tiles as HTML elements. No Three.js or application server is needed for the game itself.
- Use numbers 1–13 in four colours (black, blue, red, and orange), with two physical copies of each number-colour combination: 104 numbered tiles. Each physical tile must have a distinct identity, even when its number and colour match another tile. The standard set also includes two wild jokers, for 106 tiles in total; the first playable version uses only the 104 numbered tiles, with jokers deferred. A valid row is either at least three consecutive numbers of one colour or three/four equal numbers of distinct colours. Existing board rows may be rearranged freely; the 30-point opening rule does not apply to these endgame puzzles.
- Every published puzzle must have at least one solution that empties the rack. Multiple solutions are acceptable.
- Progress and settings live on the device. A seed identifies each puzzle for replay or sharing.
- The same app serves PC and tablet. Mouse, keyboard, and touch are first-class input methods.

Record any changes to these assumptions under **Decisions** before implementing them.

## Resuming work

Work from the first unchecked item in the current phase. Check an item only when its acceptance condition is met. At the end of a work session, update **Current position** with the next action and any blocker or decision. Keep this file with the project so a later session can continue without reconstructing the plan.

**Current position:** Phase 1 rules specification is complete in [rummipuz-rules.md](rummipuz-rules.md). Next: define the puzzle data format and represent one sample puzzle. No blockers.

## Phase 1 — Define the game

- [x] Write a compact rules specification for valid groups, runs, duplicate physical tiles, tile movement, and the win condition. **Done when:** examples cover normal and edge cases. See [rummipuz-rules.md](rummipuz-rules.md).
- [ ] Define the puzzle data format: version, seed, rack, board rows, difficulty tier, and optional solution metadata. **Done when:** one sample puzzle can be represented unambiguously.
- [ ] Define the player flow: choose difficulty, play, undo/reset, check/win, next puzzle, replay, and change difficulty. **Done when:** there is a screen-by-screen outline for PC and tablet.
- [ ] Fix the initial difficulty tiers and progression policy. **Done when:** the starting tier and the conditions for moving up are explicit.

## Phase 2 — Build the game foundation

- [ ] Create a static HTML/CSS/JavaScript app using native browser modules, with local run instructions using Python's built-in HTTP server. **Done when:** it opens on a PC browser and on a tablet browser over the local network.
- [ ] Implement a pure game state and rules module, separate from the interface. **Done when:** it can classify valid rows, track every physical tile, and detect a win.
- [ ] Implement reversible moves and undo/reset. **Done when:** any sequence of moves can be undone without losing or duplicating a tile.
- [ ] Add focused checks for rule edge cases and tile conservation. **Done when:** duplicate tiles, long runs, invalid groups, and undo are covered.

## Phase 3 — Create and rate puzzles

- [ ] Build a solver that determines whether all rack tiles can be used while all board tiles remain in valid rows. **Done when:** it can return a complete solution or report none.
- [ ] Build a seeded generator that produces valid starting boards and racks, then uses the solver to reject unsolvable candidates. **Done when:** the same seed always reproduces the same puzzle.
- [ ] Rate candidate puzzles using features tied to human difficulty: rack size, number of rows touched, required rearrangement, and competing placements. **Done when:** generated samples fall into distinct starting tiers.
- [ ] Review sample puzzles by hand and tune the tiers. **Done when:** the early tier teaches simple placements and later tiers require meaningful board rearrangement, without long generation delays.
- [ ] Move generation/solving off the UI thread if it causes visible pauses. **Done when:** interaction remains responsive while preparing the next puzzle.

## Phase 4 — Build the PC and tablet interface

- [ ] Draw the board and rack with readable HTML tiles. **Done when:** numbers and suits are distinguishable without relying only on colour.
- [ ] Add mouse drag and click-to-select/place controls. **Done when:** the full puzzle can be completed comfortably on a PC.
- [ ] Add touch drag and tap-to-select/place controls using the same move rules. **Done when:** the full puzzle can be completed on a tablet without precision gestures.
- [ ] Add keyboard selection, placement, undo, and focus indicators. **Done when:** basic play is possible without a pointer.
- [ ] Make portrait, landscape, and desktop layouts. **Done when:** tiles remain legible, the rack stays accessible, and board overflow scrolls without hiding controls.
- [ ] Show invalid rows, remaining rack count, undo/reset, and clear win feedback. **Done when:** the player can understand why a move cannot finish the puzzle.

## Phase 5 — Progress, offline use, and finishing

- [ ] Save chosen difficulty, completed puzzle seeds, and current puzzle locally. **Done when:** a reload resumes the same state and a completed puzzle cannot be counted twice.
- [ ] Add unlimited Next Puzzle, difficulty selection, and replay by seed. **Done when:** players can continue indefinitely or start at any tier.
- [ ] Package the static app for offline use as a PWA. **Done when:** it loads after the first visit without a network connection in a supported installed browser context.
- [ ] Document PC local launch and tablet access. **Done when:** instructions cover Python's built-in HTTP server, serving on a local network, and the HTTPS requirement for installing a PWA on a tablet.
- [ ] Verify complete play sessions on a desktop browser and tablet-sized touch layout, including reload, offline launch, win, and difficulty change. **Done when:** all core flows work and remain readable.

## Decisions

- Use native JavaScript modules instead of TypeScript/Vite because this machine has Python but no Node or npm. Keep the project free of build dependencies.
- Match the standard numbered-tile inventory: two copies of each value 1–13 in black, blue, red, and orange (104 numbered tiles). Track the copies as distinct physical tiles. The standard set's two jokers bring its total to 106, but joker support remains deferred for the first playable version.
- Runs must appear in ascending numerical order; group colour order is unrestricted. Temporary invalid rows are allowed while rearranging. Any puzzle tile may temporarily return to the rack, including original board tiles; winning requires every puzzle tile on the board exactly once. Empty rows are ignored as layout placeholders. These rules are specified in [rummipuz-rules.md](rummipuz-rules.md).

## Deferred ideas

- Jokers, hints, scoring, timed challenges, daily featured puzzles, and syncing progress across devices. These are outside the first playable version.
