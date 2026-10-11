# Rummipuz puzzle data format — version 1

A puzzle is a UTF-8 JSON object describing an immutable starting position. Rules are defined in [rummipuz-rules.md](rummipuz-rules.md). Current moves, undo history, completion records, and settings belong in separate saved-game data; they must not overwrite this starting position.

## Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `version` | Integer, exactly `1` | Puzzle format and rules version. Reject unsupported versions rather than guessing their meaning. |
| `generatorVersion` | Positive integer | Deterministic generator revision; increment when generation changes could change a replayed puzzle. |
| `seed` | Nonempty string, 1–64 ASCII letters, digits, `_` or `-` | Case-sensitive random seed input, kept as a string without trimming or numeric conversion. |
| `difficultyTier` | Integer from `1` to `4` | Requested starting tier: Easy, Medium, Hard, or Expert. See [difficulty and progression](rummipuz-difficulty.md) for rating criteria. |
| `rack` | Nonempty array of tile IDs | Initial rack, in display order. |
| `board` | Nonempty array of nonempty arrays of tile IDs | Initial board rows, in display order; each inner array gives left-to-right tile order. Every starting row must be valid. |
| `solution` | Optional object | A verified complete arrangement; omit when not stored. It is not the only accepted answer. |

`solution` contains a required `board` with the same row representation and an optional `note` string explaining the arrangement. Its rack is implicitly empty. No move sequence, solver statistics, or difficulty features are required in version 1. If `solution` is present, it must be valid; `null` is not a substitute for omission.

Field names above are reserved. Readers may ignore unknown fields for forward-compatible annotations, but must validate every known field that is present. JSON object member order has no meaning; array order does.

## Physical tile IDs

The canonical tile ID is `<colour>-<value>-<copy>`:

- `colour` is exactly `black`, `blue`, `red`, or `orange` (lowercase).
- `value` is a decimal integer from `1` to `13`, without leading zeroes.
- `copy` is exactly `1` or `2`.

For example, `blue-6-1` and `blue-6-2` are separate physical tiles with identical faces. IDs encode all immutable tile properties, so no separate tile catalogue is needed. `Blue-6-1`, `blue-06-1`, `blue-6-3`, and `joker-1` are invalid IDs.

The union of the initial `rack` and `board` is the puzzle inventory. Every ID must occur exactly once across those locations. The canonical IDs limit the available inventory to the 104 numbered tiles and two copies of each face. A solution must contain that exact inventory once each, with every row valid. Empty rows are allowed in live editing as layout placeholders, but are omitted from puzzle and solution data.

## Seed and replay contract

Reproduction uses the tuple `(version, generatorVersion, difficultyTier, seed)`, not a seed interpreted independently of its generation context. A future replay/share control must preserve all four values; the text encoding for sharing belongs to the player-flow implementation. Identical inputs must produce identical initial rack and board ordering, regardless of device or previous puzzles. Solution metadata is optional and does not affect puzzle identity.

A generator revision must define its random algorithm and candidate traversal order before generated puzzles are published. Preserve old revisions for replay, or retain the full puzzle JSON when a revision is unavailable. A stored puzzle can always be replayed directly from its starting position without running the generator. Revision 1 is reserved for the hand-authored sample fixture below and has no procedural generator. [Revision 2](rummipuz-generator.md) produces solver-verified, unpublished candidates; requested difficulty still needs proof before publication.

## Validation and sample

Before accepting a puzzle, check field types and versions, canonical IDs, tile uniqueness, nonempty starting locations, and starting-row validity. Validate any supplied solution for row validity and exact tile conservation. Without supplied solution metadata, the solver must establish solvability before a generated puzzle is published; structural validity alone does not prove solvability. The runtime must also reject unsupported generator revisions or tiers when asked to generate a replay.

[sample-puzzle.json](sample-puzzle.json) contains eleven tiles: a blue 1–6 run using copy 1, a blue 3–5 run using copy 2, and red/black 6 in the rack. The solution takes `blue-6-1` from the first run to form a three-colour group with the rack tiles, leaving blue 1–5 and the second run valid. This demonstrates physical duplicates, row ordering, rearrangement, and optional solution metadata. It is Tier 1 (Easy): exactly one original row must be rearranged, as explained in [difficulty and progression](rummipuz-difficulty.md).
