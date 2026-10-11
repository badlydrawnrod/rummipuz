# Rummipuz

A local Rummikub-style puzzle game for PC and tablet. The current foundation opens a validated sample board and rack, shows all four difficulty descriptions, and provides the rules. Pure rules, state checking, reversible tile moves, and undo/reset are implemented. Play controls, generation, and progress saving are still planned. This is not yet a playable game.

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
- `app/checks/`: dependency-free core checks, including rule edge cases and tile conservation.
- `app/puzzles/sample.json`: public runtime copy of `plans/sample-puzzle.json`; keep these files identical when updating the fixture.
- `plans/`: rules, data format, player flow, difficulty policy, and the implementation checklist.

Follow [the implementation plan](plans/rummipuz-implementation.md) for the next step.

## Core modules and checks

These native modules have no browser, storage, or random-number dependency:

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

Insertion indices are gaps in the destination **before** removal, from zero through its length. Moving within the same location adjusts the gap after removal; gaps immediately before/after the selected tile return the input without adding history. Moves permit temporary invalid rows and retain empty source rows as layout placeholders. Undo restores tile order and row layout exactly. All returned positions and history snapshots are immutable. Reset confirmation, selection, and completion records belong to the future interface/session layer.

Keep the original inventory when constructing later positions; never derive a new inventory from moved tiles. Win checking accepts any valid complete arrangement, independent of supplied solution metadata. Starting puzzles without solution metadata still require a future solver to prove solvability before publication.

With the same Python server running, open [http://127.0.0.1:8000/checks/](http://127.0.0.1:8000/checks/). The page reports all checks or the first failure. The core suite currently contains 80 checks, including a 200-move conservation/undo sequence, and can also run via its exported `runCoreChecks(sample)` function in a native-module JavaScript runtime. No Node installation or package manager is needed for the browser runner.
