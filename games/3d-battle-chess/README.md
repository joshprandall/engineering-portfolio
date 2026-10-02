# Crown & Ash

A standalone, browser-based, 3D chess combat game created and directed by Joshua Randall.

## Play and features

The game supports local two-player chess and a computer opponent (Black), five selectable procedural sets (Classic, Arcane, Monsters, Brick Battle and Cosmic War), theme-specific animated captures, a 3D orbit/zoom camera, board flipping, synthesized sound, responsive touch input, keyboard and gamepad play, an accessible coordinate-move field, move history, undo, persistent settings, autosave/resume, FEN position import/export and PGN match export.

Chess rules are implemented in `engine.js`: legal moves, king safety, check, checkmate, stalemate, castling, en passant, four promotion choices, threefold repetition, fifty-move draws and supported insufficient-material draws. The computer opponent uses a compact local search and is not a professional-strength engine.

## Run locally

Serve this folder from a static HTTP server, then open its `index.html` (ES modules generally do not run reliably from `file://`). For example, with Python installed:

`python3 -m http.server 8000`

Open `http://localhost:8000/` in a modern WebGL-capable browser. No build step or npm installation is needed to play. Three.js and OrbitControls are pinned and bundled under `vendor/three/`, so core 3D play has no CDN or internet dependency.

Controller mapping: left stick/D-pad moves the board cursor, A selects or confirms, B cancels a selection, X flips the board, Y switches 2D/3D, left bumper undoes, and Start opens the game menu.

## Tests

With Node.js 22 or later, run `npm test`. The automated tests exercise the chess rules, computer move legality, saved-game reconstruction, FEN/PGN output, persistent settings contract and offline dependency packaging. The tests do not replace browser/device verification.

## Safe website deployment

Upload the files together into a dedicated directory such as `public_html/games/3d-battle-chess/`. Keep `index.html`, `styles.css`, `battle.js` and `engine.js` in that directory. Link to `/~randjosh/games/3d-battle-chess/` from your existing portfolio. Do not overwrite the portfolio root `index.html`, `styles.css`, `app.js`, or any existing game or Qubit folders.

See `DEPLOYMENT.md` for step-by-step instructions, `CREDITS.md` for third-party attribution, and `STEAM-ROADMAP.md` for the commercial desktop release plan.
