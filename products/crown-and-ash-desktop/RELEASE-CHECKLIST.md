# Crown & Ash Release Candidate Checklist

This checklist is for internal release-candidate verification of Crown & Ash, the first CindrVault title under Roughneck Forge.

## Product boundary

- [ ] Website build remains the Crown & Ash Basic Edition.
- [ ] Basic Edition provides complete standard chess and does not expose premium Full Edition combat/faction capabilities.
- [ ] Windows desktop build identifies as the Full Edition capability path.
- [ ] Edition-boundary automated tests pass.

## Core game state

- [ ] Legal move generation and all standard chess rules pass.
- [ ] Check, checkmate, stalemate, castling, en passant, promotion, repetition, and fifty-move draw behavior pass.
- [ ] Save/load preserves board state and move history.
- [ ] Undo remains correct in local and AI play.
- [ ] Board flip does not mutate game state.
- [ ] FEN import/export and PGN export pass.
- [ ] State recovery tests pass after reload/re-entry.

## Premium presentation

- [ ] Five Full Edition factions remain distinct and original.
- [ ] All 30 premium character definitions are present.
- [ ] Pawn/knight/bishop/rook/queen/king identity reads from geometry without relying on labels.
- [ ] Attack, defense, reaction, defeat, follow-through, and recovery choreography tests pass.
- [ ] Contact/impact physics and capture VFX tests pass.
- [ ] Board locomotion and living-presence tests pass.
- [ ] Camera choreography tests pass.
- [ ] Faction material and palette-language tests pass.
- [ ] Faction audio behavior tests pass.

## Input and accessibility

- [ ] Keyboard/mouse flow passes.
- [ ] Xbox-standard controller flow passes.
- [ ] PlayStation-compatible standard Gamepad flow passes.
- [ ] Touch/mobile Basic Edition flow passes.
- [ ] 2D fallback remains playable when WebGL is unavailable.
- [ ] Orientation/full-screen behavior passes supported automated coverage.

## Performance and offline operation

- [ ] Pinned local Three.js dependency is used; no runtime CDN dependency is required.
- [ ] Constrained-hardware performance gate passes.
- [ ] Automatic graphics downshift activates on constrained profiles.
- [ ] Repeated 2D/3D transitions remain responsive.
- [ ] Offline/productization contract passes.

## Windows packaging

- [ ] NSIS x64 installer builds successfully.
- [ ] Packaged win-unpacked executable passes startup/load smoke.
- [ ] Clean installed Windows lifecycle passes install -> launch -> local/offline verification -> exit -> uninstall.
- [ ] Windows executable name is shell-safe.
- [ ] Installer does not auto-run after finish.
- [ ] Unsigned internal test artifact is retained for rollback/reference.

## Final human-only acceptance

These items cannot be honestly replaced by hosted CI and remain required before a public Steam release:

- [ ] Human playtest confirms premium combat feels cohesive, readable, responsive, and appropriately cinematic.
- [ ] Physical Xbox-compatible controller playtest passes.
- [ ] Physical PlayStation-compatible controller playtest passes.
- [ ] Representative lower-spec physical Windows hardware playtest is acceptable.
- [ ] Final audio/music balance is approved by ear.
- [ ] Final visual/material/lighting/VFX quality is approved by eye.
- [ ] Code-signing identity/certificate is configured if required for distribution.
- [ ] Steamworks application/depot/store configuration is reviewed and approved by the account owner.
- [ ] Final release candidate is explicitly approved by the user before any protected-branch merge or public distribution.

## Non-destructive release boundary

No automation may merge into the protected Crown & Ash baseline/release branch, publish to Steam, deploy the Full Edition publicly, or bypass the local Roughneck Studio safety gate.
