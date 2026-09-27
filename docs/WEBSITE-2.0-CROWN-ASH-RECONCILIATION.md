# Crown & Ash — preservation and reconciliation

## Provenance and exact difference

Advanced Git baseline: audit ancestor `35f9db9e25285ff4b4828a1089e862f1c05ede8e`; imported game source marker pins `ed14050047cee8f11004c7a78c49136800342dd3` in the separate game repository. That marker describes provenance, not a guarantee of a pristine upstream tree.

Live source is the read-only September 26 OSU capture. `manifests/live-preservation.json` records each live source path, size, SHA-256 and exact storage. Reconstruct the full captured game with `tools/restore_website2_assets.py --snapshot`; original divergent modules are also browsable in `preservation/live-20260926/games/3d-battle-chess/`. The Git original remains available at the ancestor commit.

| Live-only behavior | Advanced Git-only behavior |
|---|---|
| Shared `game` singleton imported by both renderers | Setup-first launch, advanced native 2D and 3D views |
| Bidirectional renderer handoff without resetting position | Procedural character sets, v8 combat choreography/physics, legacy combat choice |
| Failed 3D import can retain a local playable board | Three AI strengths and positional search profiles |
| Explicit active-renderer lifecycle in boot | Audio effects, camera/orbit, fullscreen, keyboard/castling controls |
| Deployed repair versions of boot/fallback/battle/styles | Touch controls, landscape gate, responsive dedicated game shell |

The advanced game already has an internal shared-state 2D/3D switch. Its old boot loader incorrectly treated the intentionally canvas-free setup screen as a renderer failure, launching a second `ChessGame` in fallback. The handheld toggle also had a ternary-precedence error that selected 2D even when the stored target requested 3D.

## Candidate integration

1. Imported the exact live `shared-game.js` singleton. Both advanced `battle.js` and the CDN-independent fallback now import it. The rules engine, characters, combat, camera and AI implementations remain the advanced Git versions.
2. Boot enters fallback only after a failed module import, not because setup has no canvas. Retry imports the advanced controller and hands off the same game without reset.
3. The emergency renderer now targets the advanced page shell and its setup/control IDs. Event handlers are abortable, AI timers cancel on handoff, and `stopTwoDimensionalBoard()` clears view state without resetting the match.
4. `resumePreservedGame()` adopts the singleton and rebuilds graphics/status around its existing history. Native view switching retains en-passant/castling/repetition/history through the same object.
5. Fixed handheld toggle precedence; moving/animating a piece guards view switching. Leaving setup gameplay cancels queued AI. Hidden/non-playing 3D views do not keep drawing.
6. Keyboard move form binding now works even when WebGL creation fails. Emergency play retains AI strength selection, underpromotion, castling entry, touch moves, undo and basic keyboard actions. Emergency audio remains explicitly unavailable; advanced game audio is unchanged.

`tests/chess-rules.test.mjs` provides semantic rules tests. `tests/chess-browser.test.cjs` covers setup, desktop/touch views, capture animation, repeated toggles, full-state equality, undo/flip, orientation, failed module load/retry and no-WebGL keyboard entry. Set `CHESS_OFFLINE_ONLY=1` only for the separately labeled emergency subset; it is not a substitute for the full suite.

## Acceptance status

Rules, syntax, and the full browser suite pass: advanced desktop/touch 3D rendering, combat capture, repeated view switching with complete state equality, undo/flip, orientation gate, emergency retry handoff, and no-WebGL keyboard entry. The earlier CDN/approval block was resolved by an approved test run. This is still an undeployed candidate.

Before promoting: verify camera gestures and physical touch/gamepad behavior; verify state equality across native switching and emergency recovery during AI turns; inspect all five sets and both combat modes. Preserve the current live rollback until those gates pass.
