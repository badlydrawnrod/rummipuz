# Rummipuz

Rummipuz is a Rummikub-style tile puzzle for a computer or tablet. Rearrange the board, use every tile, and empty your rack. You can play a sample or generate puzzles at four difficulty levels. Rummipuz saves your current puzzle in browser storage when it is available.

This guide is organised so you can start playing first, then look up specific tasks and details. It follows the four-part Diataxis structure: tutorial, how-to guides, reference, and explanation. The writing uses the plain-language aims of ISO 24495-1: help readers find, understand, and use the information they need.

## Tutorial: Play your first puzzle

### Start the app on a computer

From the project directory, start the built-in Python web server:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory app
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in a modern browser and select **Open sample puzzle**. To stop the server, return to the terminal and press Ctrl+C.

Python 3 is the only launch requirement. Use `python` or `py` if that is the command name on your computer. If port 8000 is already in use, choose another port in the command and URL.

Use the server address instead of opening `index.html` directly. The app loads JavaScript modules and a puzzle file, which browsers do not load correctly from a local file. Rummipuz has no build step or package installation.

### Make a move

The goal is to empty your rack and leave every board row valid.

1. Select a tile in the rack or on the board.
2. Select a **+** between tiles, or choose **New row** to start a row.
3. Continue until the rack is empty and every row is valid.
4. Select **Check** to finish.

You can also drag a tile to a **+** or **New row**. On a tablet, tap a tile and then its destination, or hold a tile briefly and drag it. A temporary invalid row is allowed while you work. Select **Undo** to reverse a move. Select **Reset** to restart the puzzle.

Try this sequence in the sample:

1. Move **Blue 6** from the end of board row 1 to **New row**.
2. Move **Red 6** from the rack to the position after Blue 6 in the new row.
3. Move **Black 6** from the rack to the position after Red 6.
4. Select **Check** to finish.

Select **How to play** below the puzzle for the full rules.

## How-to guides

### Start another puzzle

Choose **Easy**, **Medium**, **Hard**, or **Expert** under **Difficulty for a new puzzle**, then select **Start puzzle**. Rummipuz prepares the puzzle in the background. You can cancel preparation while your current puzzle remains available.

After you finish, select **Next Puzzle** to get another puzzle at your saved difficulty. To change difficulty, choose a different tier and select **Start puzzle**. Rummipuz saves the new tier after the puzzle is ready.

If you try to replace an unfinished puzzle, choose **Start another** to continue or **Keep playing** to return to it. If preparation fails, select **Retry** or keep playing the current puzzle.

### Resume a saved puzzle

Rummipuz saves your puzzle and Undo history in this browser. After a reload, select **Resume puzzle** to continue. The save belongs to the address you used: a tablet and computer, or two different addresses, may have separate saves.

If browser storage is unavailable, you can still play in the current session, but progress will not survive a reload.

### Replay a puzzle

Each puzzle has a replay code below the rack. Select **Copy replay code**, then paste the code into the **Replay code** box on the start screen and select **Play replay**. You can also copy the visible code manually if clipboard access is unavailable.

A replay code identifies the puzzle version, generator revision, difficulty, and seed. For example, `rummipuz:1:1:1:sample-rearrangement-001` opens the sample puzzle. A seed by itself is not enough. An unsupported or invalid code reports an error and leaves your current puzzle alone.

### Use a hint or view a solution

- Select **Hint** for one explained tile move. The highlighted source and destination show what to move; you make the move yourself.
- Select **Show tile** or **Show destination** if either part is off screen.
- Select **Reveal solution** to open a read-only solution preview. Close it to return to your unchanged puzzle.

Hints and solution previews do not change the board or Undo history. Search can take time; you can cancel it or retry if it reaches its work limit.

### Change appearance or tile colours

Use **Appearance** to select **System**, **Classic / Light**, **Dark**, or **High Contrast**. System follows your device's light or dark setting. Use **Tile palette** to choose **Standard** or **Alternative** independently.

The app saves these choices in the browser. Tile symbols and colour names stay the same in both palettes.

### Open the app on a tablet over your home network

This is a convenient way to preview and play while the computer and tablet are on the same network. It does not set up tablet installation or offline use; those require trusted HTTPS.

1. Connect the computer and tablet to the same Wi-Fi or local network.
2. In the project directory, start the server so other devices can reach it:

   ```bash
   python3 -m http.server 8000 --bind 0.0.0.0 --directory app
   ```

3. Find the computer's local IPv4 address in its network settings. It may look like `192.168.1.25`.
4. On the tablet, open `http://192.168.1.25:8000`, replacing the example address with the computer's address. Keep the computer awake and the server running.

If the page does not load, check that both devices are on the same network and that the computer's firewall allows connections on port 8000. Guest Wi-Fi may block connections between devices.

### Install the app for offline use

Offline setup needs a secure address. On the same computer, `localhost` is secure. A tablet needs an HTTPS address with a certificate it trusts. The local-network HTTP address above is for play and preview; it is not enough to install the app for offline use.

1. Open Rummipuz from its secure address while connected to the internet.
2. Wait for **Ready for offline use on this device**.
3. Use the browser's **Install app** command or install icon if available. On an iPad, use Safari's Share menu and choose **Add to Home Screen**.
4. Start a puzzle and make a move so there is progress to resume. Close every Rummipuz tab and app window.
5. Turn off networking, then open Rummipuz from its installed app icon. Confirm that the puzzle resumes and that you can make moves, use Undo and Check, start a puzzle, and replay a code.

Offline setup can fail if the browser blocks or runs out of cache storage. Rummipuz will still work online and show a message; reload while connected to try setup again. A readiness message confirms that setup succeeded at that time. Browsers can later clear stored data.

For more detail about HTTPS and installation support, see [MDN's PWA installation guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## Reference

### Rules and controls

- A **group** has three or four tiles with the same number and different colours.
- A **run** has at least three consecutive numbers of one colour, in ascending order.
- Numbers run from 1 to 13. They do not wrap from 13 to 1.
- Matching tiles are separate physical tiles. Use every tile exactly once.
- There are no jokers and no opening-point requirement.
- You win when your rack is empty and every board row is valid. The final arrangement can differ from the supplied solution.

Select a tile, then a **+** to place it before, between, or after tiles. Choose **New row** to start a row. The same controls let you move a tile from the board to the rack. One- and two-tile rows stay visible while you work.

Drag the six-dot handle beside a row label to move a whole row. Its tiles keep their order. **Undo** reverses a tile move or row move. **Reset** asks before restoring a changed puzzle to its original arrangement. After a win, **Replay** restarts that puzzle.

### Difficulty levels

| Level | What the puzzle asks you to do |
| --- | --- |
| Easy | Rework one row |
| Medium | Connect changes across two rows |
| Hard | Coordinate three rows |
| Expert | Rebuild four or more rows |

All levels are available whenever you start a puzzle. Completing puzzles does not change your selected level. **Next Puzzle** uses the last level you successfully started.

### Saved information

Rummipuz saves the active puzzle, its Undo history, your selected difficulty, and completed puzzle identities in browser storage. It saves appearance and tile-palette choices separately. It does not sync data between devices or addresses, and it does not need an account.

The app keeps one active puzzle. Replacing an unfinished puzzle replaces its saved session after the new puzzle is ready. Replay opens the puzzle's original arrangement. Resume restores the saved position and history.

### Troubleshooting

| Problem | What to try |
| --- | --- |
| The page is blank when I open `index.html` | Start the Python web server and open its HTTP address instead. |
| A tablet cannot reach the computer | Check the local IP address, same-network connection, firewall, and guest Wi-Fi restrictions. |
| Tablet offline setup is unavailable | Use a trusted HTTPS address. Local-network HTTP supports ordinary play only. |
| A puzzle will not prepare | Select **Retry**. The current puzzle remains available if preparation fails or is cancelled. |
| My puzzle did not resume | Reopen it using the same browser and address. Private browsing, cleared site data, or blocked storage can prevent saving. |
| Offline use stopped working | Reconnect, reload, and wait for **Ready for offline use on this device**. Browser storage may have been cleared or evicted. |

## Explanation

### What the difficulty level means

Difficulty describes how much of the starting board a puzzle requires you to rearrange. Higher levels require changes across more connected rows. It is not a timer or a score, and it does not increase automatically. The short descriptions in the table are a guide to the kind of rearrangement involved.

### How generated puzzles and replay codes work

Generated puzzles use a recorded seed and generator revision. This lets Rummipuz recreate supported puzzles from their replay codes. The app keeps older revisions available for replay when possible, even as it changes which revision it uses for new puzzles. A replay always refers to the puzzle's original arrangement, not its current saved position.

### What offline readiness means

When the browser reports that Rummipuz is ready for offline use, it has cached the app and the files needed to prepare puzzles. The browser may later remove those files, so readiness is not a promise of permanent storage. Progress and appearance settings are stored separately from the offline app files.

## For contributors

### Run the checks

Start the Python server from the project directory:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory app
```

Then open [http://127.0.0.1:8000/checks/](http://127.0.0.1:8000/checks/). The page runs the dependency-free checks in the browser and reports failures. It is not included in the offline app cache.

The checks cover rules, state, generation, replay, worker cancellation, saving, appearance, input handling, and offline packaging. Simulated touch and layout checks do not replace review in a real browser on a computer and tablet.

### Find the code for a task

| If you are changing… | Start here |
| --- | --- |
| Page structure or styles | `app/index.html`, `app/styles.css` |
| Game rules and moves | `app/rules.js`, `app/state.js` |
| Board interactions | `app/play.js`, `app/play-session.js`, `app/touch.js`, `app/row-drag.js` |
| Hints and solution preview | `app/hints.js`, `app/assistance.js`, `app/solver.js` |
| Puzzle creation and difficulty | `app/generator.js`, `app/rated-generator.js`, `app/generator-v6.js`, `app/difficulty-v6.js` |
| Replay, save, and resume | `app/puzzle-flow.js`, `app/progress.js`, `app/preferences.js` |
| Offline setup | `app/offline.js`, `app/offline-cache.js`, `app/service-worker.js` |

The app uses plain JavaScript modules and static files. Puzzle generation, solving, and assistance run in module workers so they do not block the interface. Pure game rules and state operations are kept separate from browser storage and display code.

### Update the offline package

When you change a file served to players, increase `OFFLINE_RELEASE` in `app/offline-cache.js`. Add any new runtime file to `OFFLINE_ASSETS`, including its worker imports. Deploy all app files together. The service worker stages the new cache before it activates the update.

### Read the specifications

- [Current implementation plan](plans/rummipuz-implementation.md): remaining device and offline acceptance work.
- [Player flow](plans/rummipuz-player-flow.md): screen behavior and interactions.
- [Rules](plans/rummipuz-rules.md): tile and row rules.
- [Difficulty policy](plans/rummipuz-difficulty.md): tier definitions and persistence.
- [Puzzle format](plans/rummipuz-puzzle-format.md): saved puzzle and replay identity.
- [Generator contract](plans/rummipuz-generator.md): generation and rating behavior.
- [Plans index](plans/README.md): current specifications and archived design records.

The sample puzzle is stored in both `plans/sample-puzzle.json` and `app/puzzles/sample.json`. Keep the two files identical when changing the sample.
