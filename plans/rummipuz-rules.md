# Rummipuz rules — first playable version

These are the puzzle game's rules. There are no turns, opponents, draws, opening-point requirement, or jokers.

## Tiles and puzzle setup

- The numbered inventory contains values 1–13 in black, blue, red, and orange, with two physical copies of each number-colour combination (104 tiles).
- Each physical tile has a unique, stable identity. Matching copies are interchangeable for row validity, but remain separate objects for movement, undo, and conservation. No puzzle may use more than two copies of any number-colour combination.
- A puzzle uses a subset of that inventory, divided between board rows and a nonempty rack. Every starting board row is valid, and at least one solution uses all puzzle tiles. Unused inventory tiles are unavailable during play.
- In examples below, `blue 7 A` and `blue 7 B` denote the two physical copies; these labels are illustrative, not a required data format.

## Valid rows

Each nonempty board row must be exactly one group or one run. Separate rows are checked independently; adjoining tiles in different rows do not form a set together.

**Group:** three or four tiles with the same number and distinct colours. Colour order does not matter.

**Run:** three to thirteen tiles of one colour, arranged in strictly ascending consecutive numerical order. There are no gaps, repeated numbers, or wraparound from 13 to 1. A descending or scrambled sequence must be reordered before it is valid.

| Row | Result | Reason |
| --- | --- | --- |
| black 7, blue 7, red 7 | Valid group | Three distinct colours with the same number. |
| orange 7, red 7, black 7, blue 7 | Valid group | All four colours; arbitrary colour order. |
| black 7, blue 7 | Invalid | A row needs at least three tiles. |
| black 7, blue 7 A, blue 7 B | Invalid | A group cannot repeat a colour, even using separate copies. |
| black 7, blue 7, red 8 | Invalid | Numbers differ and colours do not form a run. |
| black 7, blue 7, red 7, orange 7, black 7 B | Invalid | A group cannot contain five tiles. |
| blue 1, blue 2, blue 3 | Valid run | Starts at the lower boundary. |
| red 11, red 12, red 13 | Valid run | Ends at the upper boundary. |
| orange 1 through orange 13, in order | Valid run | Runs may exceed three tiles, up to all thirteen values. |
| blue 3, blue 5, blue 6 | Invalid | Missing 4. |
| blue 3, red 4, blue 5 | Invalid | Mixed colours. |
| blue 3, blue 4 A, blue 4 B, blue 5 | Invalid | Repeated number. |
| blue 5, blue 4, blue 3 | Invalid | Descending order. |
| blue 3, blue 5, blue 4 | Invalid | Scrambled order. |
| red 12, red 13, red 1 | Invalid | No wraparound. |

Two separate rows may have identical faces: `blue 3 A, blue 4 A, blue 5 A` and `blue 3 B, blue 4 B, blue 5 B` are both valid. Reusing any one physical tile in both rows is forbidden.

## Movement and temporary states

- Move a tile between the rack and a board row, between board rows, or to a different position within its current location. Create, split, merge, and reorder rows freely through these moves.
- Any tile may temporarily return to the rack, including a tile that started on the board. The rack is the only holding area; tiles cannot be discarded or drawn from the unused inventory.
- Every move preserves the exact set of puzzle tile identities. Each tile appears exactly once, either in the rack or in one board row. A move that would lose, duplicate, or introduce a tile is rejected.
- Rows may be invalid while the player rearranges them. Empty rows are layout placeholders, ignored when checking validity, and may be removed. A nonempty row of one or two tiles is invalid.
- Undo restores the state before the most recent move, including tile identities and ordering. Reset restores the original board and rack. Neither operation changes the puzzle's tile inventory.

For example, split `blue 1, blue 2, blue 3, blue 4, blue 5, blue 6` into two valid runs, `1–3` and `4–6`. A temporary split into `1–2` and `3–6` is allowed during editing, but cannot be a solution. Moving `blue 3` to the rack leaves an invalid gap until the remaining tiles are rearranged or the tile is returned.

## Checking and winning

A state wins exactly when all three conditions hold:

1. The rack is empty.
2. Every nonempty board row is a valid group or run.
3. Every original puzzle tile is on the board exactly once, with no additional tiles.

There is no requirement to match a stored solution or preserve the original rows. Checking an unfinished state reports the remaining rack tiles and invalid rows; it does not discard moves or roll back the board. A tile-conservation failure is a state error and cannot count as a win.

| Situation | Outcome |
| --- | --- |
| Board has blue 3–5; rack has blue 6; append 6 | Win: empty rack and valid blue 3–6 run. |
| Board has blue 1–6; rack has red 6 and black 6; split board into blue 1–5 and a group of blue/red/black 6 | Win: rearrangement uses every tile in valid rows. |
| Rack is empty but a row has only two tiles | Unfinished: invalid row. |
| All rows are valid but one tile remains in the rack | Unfinished: rack is not empty. |
| An original board tile is moved to the rack while all original rack tiles are placed | Unfinished: the rack still contains a tile. |
| Rack is empty and rows look valid, but a tile is missing or an identity is repeated | State error: conservation failed. |

The standard set also contains two wild jokers (106 tiles in total). Joker behaviour is outside this specification and remains deferred.
