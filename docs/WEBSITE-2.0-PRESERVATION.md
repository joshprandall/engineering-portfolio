# WEBSITE 2.0 — Phase 2 preservation

Date: September 26, 2026. Branch: `website-2.0-reconciliation`. **Candidate work; not a production release.** No live files or main branch were altered. No deployment or cleanup was performed.

## Verified starting point

Audit commit `35f9db9e25285ff4b4828a1089e862f1c05ede8e` was pushed and independently verified with `git ls-remote` on `origin/website-2.0-reconciliation` before Phase 2. This remains the last verified branch commit until the final Phase 2 commit/push is recorded.

## What has been preserved

`manifests/live-preservation.json` maps every one of the 397 visible live files to an exact recoverable source, or explicitly records a read failure. All 395 readable files were reconstructed under ignored local `staging/live-20260926` and verified for size and SHA-256. This restore writes only within the local checkout.

Storage is deduplicated by audited SHA-256:

- Existing identical Git bytes reference their blob ID and the immutable audit ancestor commit. Later edits do not change those historical objects.
- Unique live text/source/history resides under `preservation/live-20260926/`, preserving original bytes. `.gitattributes` disables newline transformation for preservation and Godot exports.
- Required missing runtime files are imported at their original relative paths. See the exhaustive `manifests/live-imports.json` list: current Evil Wizard launcher/console/15-champion data/Godot loader/PCK/icons/worklets/server configuration, live chess `shared-game.js`, six historical audio recordings and attribution note, OSU media/resume files, and the Recovery Readiness download.
- Fusion and the common Godot WASM are stored once each as authenticated GitHub draft-release assets with server-verified hashes. They are restored locally but ignored by ordinary Git. See the asset report and manifest.

Identical live files were not blindly copied over divergent working files. All 49 materially divergent paths were preserved through the ledger before runtime edits. In particular, the deployed chess implementation can be reconstructed independently from the advanced Git baseline. The three alternate Evil Wizard PCKs remain separately preserved; their engine WASM is shared by hash.

The two inaccessible files (`quantum2.jpg` and `_shellfish_uploading_4336159125157019876`) remain unresolved. `.codex/` remains unenumerated. These entries have no inferred checksum and no removal authorization.

## Defects and test corrections

- The working homepage already lacked the live `index.html:27` literal `\n` artifact. Its divergent live original is preserved unchanged; a regression guard now rejects visible newline escapes and known homepage mojibake. No older live homepage was copied over the current route design.
- Confirmed corruption was confined to a historical backup. Its exact original remains preserved, and `preservation/normalized/projects-qubit-backup-20260921-224301.html` provides a readable derivative with original/output hashes in `manifests/normalized-history.json`.
- Legacy `games/battle-chess/index.html` now redirects to the complete current game instead of requesting missing historical JS/CSS. Historical source remains recoverable; the runtime manifest includes only the redirect from that tree.
- Importing the Evil Wizard export resolves its previously missing local launcher/cover/runtime dependencies. Restoring the WASM is required after cloning.
- New-tab behavior is optional, with local target existence and `noopener` checks retained for explicitly opened new tabs.
- Appearance tests now exercise the actual header sound control. A real click-loss defect was fixed: repeated audio UI refreshes replaced the SVG under an in-progress pointer interaction. Both owners now retain the icon DOM across state updates. A missing stored volume correctly uses the intended default in the independent header control.
- A remote MIT logo now has an accessible text fallback when unavailable; network failure does not leave a broken image. No replacement logo was invented or downloaded.
- Existing light-mode heading/visibility checks pass at phone, small-phone, tablet and desktop sizes. No speculative blanket color rewrite was applied.
- Windows deployment tests validate the requested chmod contract and copied bytes; POSIX mode bits are asserted only on POSIX. The destination-escape policy runs everywhere. A separate actual-symlink integration test is explicitly skipped when Windows lacks privilege.
- The portable test launcher accepts `PYTHON` or discovers a usable Python interpreter. Obsolete homepage planets/capability selectors were removed from current-route browser assertions; their live source is preserved. Dedicated lesson-page transitions are now exercised instead of assuming the old inline layout.

## Validation and remaining gates

- Core site/science validation passes.
- Chess rules pass starting-position perft 20/400/8902, legal/illegal moves, mate, both sides' castling, en passant, promotion, pins, standard draws, undo and all three AI levels without state mutation.
- Deployment tests: seven run, six pass, one explicitly skipped actual Windows symlink test; the portable escape-policy test passes.
- Appearance checks pass theme persistence, narrow layouts, scene animation, sound-panel operation and storage fallback. The current-route browser checks pass four viewport sizes, all project pages, learning progression, and three embedded browser user agents. The final consolidated browser run passed; its output is recorded in `docs/phase2-evidence/site-browser.log`.
- Emergency chess browser checks pass local gameplay, capture, undo and touch/responsive behavior with advanced modules deliberately unavailable.
- Full advanced 3D/combat/handoff browser validation now passes after approved CDN access, including desktop/touch, capture, undo/flip, state preservation, orientation and no-WebGL entry.
- Evil Wizard passes launcher/15-champion options, Godot/WASM/PCK startup, the three-screen prologue and playing-state handshake. The initial timeout was a test assumption: the prologue waits for player input. The corrected smoke test sends that input; no game source was changed. Evidence: `docs/phase2-evidence/evil-wizard-browser.json`; the PNG records the correctly waiting prologue.
- GitHub upload verified server hashes. Reconstruction tested all preserved bytes from local cache/Git; `restore_website2_assets.py --refresh` independently downloaded both release assets, bypassed cache, and verified size/SHA-256 successfully.

The architecture and cleanup manifests are review artifacts, not executable authorization. Commit/push status must be checked separately from local file completion. Next phase: extend game acceptance and review unresolved preservation entries, then build and test an isolated runtime staging package. Do not deploy or clean production in that phase without a separate explicit release decision.

Final staging verification: all 389 Git-backed preservation references matched their audited SHA-256 after Git filtering; the remaining six readable references use the two independently verified release assets. Staged whitespace checks report only four inherited export EOF blank lines, deliberately retained for exact provenance. Runtime candidate hashes describe this captured working-tree byte layout; a future cross-platform package builder must materialize a defined newline policy and regenerate/verify its package hashes before release.
