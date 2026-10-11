# Rummipuz

A local Rummikub-style puzzle game for PC and tablet. The current foundation opens a validated sample board and rack, shows all four difficulty descriptions, and provides the rules. Pure rules, state checking, reversible tile moves, undo/reset, a complete-arrangement solver, and seeded candidate generation are implemented. Difficulty rating, play controls, and progress saving are still planned. This is not yet a playable game.

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
5. Open the sample, expand **How to play**, and check portrait and landscape. Longer board rows scroll horizontally without shrinking the tiles.

The `--directory app` option serves only the public app files, rather than repository metadata and configuration. Local HTTP is sufficient for this preview. PWA installation and offline support are not implemented yet; tablet PWA use will require HTTPS, as described in the implementation plan.

## Project layout

- `app/index.html`, `styles.css`, `main.js`, and `tiles.js`: buildless static app and native browser modules.
- `app/rules.js` and `state.js`: pure row classification, puzzle validation, tile tracking, win detection, reversible moves, and undo/reset.
- `app/solver.js`: pure deterministic search for a complete valid arrangement of every puzzle tile.
- `app/generator.js`: seeded, solver-verified candidate generation with versioned replay behavior.
- `app/checks/`: dependency-free core, solver, and generator checks, including an independent exhaustive solver and saved generation replay fixtures.
- `app/puzzles/sample.json`: public runtime copy of `plans/sample-puzzle.json`; keep these files identical when updating the fixture.
- `plans/`: rules, data format, player flow, difficulty policy, and the implementation checklist.

Follow [the implementation plan](plans/rummipuz-implementation.md) for the next step.

## Core modules and checks

These native modules have no browser, storage, or external dependency. The generator owns a deterministic seeded random stream:

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

Insertion indices are gaps in the destination **before** removal, from zero through its length. Moving within the same location adjusts the gap after removal; gaps immediately before/after the selected tile return the input without adding history. Moves permit temporary invalid rows and retain empty source rows as layout placeholders. Undo restores tile order and row layout exactly. All returned positions and history snapshots are immutable. Reset confirmation, selection, and completion records belong to the future interface/session layer.

Keep the original inventory when constructing later positions; never derive a new inventory from moved tiles. Win checking accepts any valid complete arrangement, independent of supplied solution metadata. Starting puzzles without solution metadata require `solveState` to return `solved` before publication.

The solver enumerates every available run interval and three/four-colour group, then searches for an exact partition using face counts, the most constrained remaining face, and memoized failed positions. Physical copy IDs are assigned deterministically to the result, which is verified through `checkState`. Current tile placement and stored solution metadata do not influence the search; temporary invalid rows are accepted when inventory is conserved. It returns a final arrangement, rather than a move sequence or difficulty rating. Search is synchronous and exhaustive by default. A finite node budget bounds search work; `limit` is inconclusive and must never be used as proof of unsolvability or tier membership. Worker execution and difficulty proofs remain later plan items.

The generator uses revision 2 so it cannot collide with the existing revision-1 sample fixture. Its FNV-1a/Mulberry32 algorithm, candidate traversal, and fixed rejection budgets are specified in [the generation contract](plans/rummipuz-generator.md). It returns unpublished candidates: size bounds and solvability do not prove the requested tier. Rating must exclude puzzles requiring no rearrangement and prove tier membership before publication. The current app continues to display only the hand-authored sample.

With the same Python server running, open [http://127.0.0.1:8000/checks/](http://127.0.0.1:8000/checks/). The page reports all checks or the first failure. The suites contain 167 checks (80 core, 36 solver, 51 generator), including a 200-move conservation/undo sequence, independent exhaustive comparison for all 511 nonempty subsets of a nine-tile inventory, and saved generation fixtures for every requested tier. They also cover the full 104-tile set, unsolvable positions, search limits, seed validation, size bounds, and generation independent of previous requests. Exported `runCoreChecks(sample)`, `runSolverChecks(sample)`, and `runGeneratorChecks(fixtures)` run in a native-module JavaScript runtime. No Node installation or package manager is needed for the browser runner.
