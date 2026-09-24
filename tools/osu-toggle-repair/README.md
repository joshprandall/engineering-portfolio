# OSU live chess toggle and Learn brand repair

The inspected OSU game uses the original `boardMode` control and `boot.js` fallback, while the repository's main chess folder contains a different game version. This repair targets the inspected live version, preserving its assets and styling. Do not deploy the entire game folder for this repair.

`../fix_live_toggle_font.py` is a self-contained installer. Run it on OSU with Python 3. It defaults to `~/public_html`; `--root PATH` supports a staging copy. It verifies the three original JavaScript files by SHA-256 before writing, saves replaced files in a sibling backup folder, rolls back on a write failure, and can be run again safely.

The two renderers share one ChessGame instance. Switching pauses the outgoing renderer and its computer timer, rebinds controls, and preserves moves. Failed 3D loading leaves the same game playable in 2D, with an explicit retry message. The obsolete inline patch targeting nonexistent IDs is removed. Updated module URLs bypass cached old modules.

The final learning-page stylesheet matches the homepage's DM Sans branding without changing lesson typography.

Validation on a copy of the live files: Chromium at 430px, repeated 3D/2D switching, moves in both modes, undo, new game, blocked graphics-module loading, failed retry with move preservation, and computed learning/homepage font-family, font-size and font-weight comparison. Installer checked for repeatability. Browser harness: `tests/live-toggle.browser.cjs`, with TEST_BASE_URL pointing to a staging server.
