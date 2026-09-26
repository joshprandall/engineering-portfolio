# Phase 3 validation

Validation date: 2026-09-26. Payload source: `926efb72d00b949abcb86b6a15bb67f07791490c`. Later acceptance commits change tests, documentation and the reviewed manifest only. Browser servers use `staging/website-2.0-runtime`, never production or the repository as a fallback. The strict server rejects wrong-case and out-of-package paths. Core source tests and temporary-directory deployment unit tests do not deploy the staged package.

## Reproduction

Build the final committed manifest with `python tools/build_runtime.py --commit HEAD`, then run `python tools/validate_runtime.py`, `npm test`, `npm run test:browser`, `npm run test:runtime-browser`, `npm run test:ownership-browser`, `npm run test:chess-browser`, `npm run test:evil-wizard-browser` and `npm run test:media-downloads`. Python 3.10+ and Playwright/Chromium are required. Set `PYTHON`, `NODE_PATH` and `PORTFOLIO_BROWSER_EXECUTABLE` when using the bundled runtimes. The appearance suite runs inside the browser suite.

## Results and scope

- Static package: 242 files, 282,866,951 bytes, 51 HTML routes; every packaged byte matches its size/SHA-256. No missing detected local HTML/CSS/module/fetch/worker/template references, duplicate HTML IDs, visible literal newline escapes or detected encoding corruption. All 8,000 unique lessons match the 76 lazy chunks.

- Core: site/science validation passes (16 projects, 8,000 records); chess rules pass perft 20/400/8902, mate, castling, en passant, promotion, pins, draws, undo and all AI levels. Python: 14 tests, 13 passed, one skipped because Windows lacks symlink privilege; portable path-escape checks still pass. Deployment tests use disposable temporary directories only.

- Site/appearance: both themes, navigation/reload/history/cross-tab persistence, blocked storage, reduced motion, persistent pause, image/provider failure, 46 shared-appearance pages, science controls, learning and dedicated lessons pass. Messenger iOS, Facebook Android and Instagram iOS user-agent/touch simulations pass.

- Responsive runtime: all 51 HTML routes pass startup/local-request checks. Non-game routes pass both themes at 320x740, 390x844, 820x1180, 1180x820, 1440x1000, 1920x1080 and 844x390. Games receive their own touch/orientation checks. Strict-case/out-of-package denials and all 76 lazy-chunk requests pass.
- Ownership: seven behavioral contracts pass: quiet 5% default/5% steps, mute/volume persistence, denied-autoplay UI, lesson search and focus return, distinct solar sets, ambient suppression, subject plan persistence and domain-scoped practice/labs, reduced motion, unavailable canvas and blocked storage.

- Crown & Ash: desktop/touch, capture combat, undo, camera flip, repeated shared-state 2D/3D switching, orientation gate, module failure/retry and no-WebGL keyboard play pass.

- Evil Wizard: 15 champions, Godot/WASM/PCK startup and playing-state handshake pass.

- Media/labs: external requests blocked; Fusion metadata decodes at 1920×1080, 440.652653 seconds. Résumé and Recovery ZIP downloads match hashes; both archives pass integrity checks. Qubit zero-state sampling and Geometric curvature worker, model outputs, diffusion and inverse posterior pass. QPE and Emergent controls also pass in the full browser suite.

Evidence: `core-tests.log`, `browser-final.log`, `runtime-browser-final.log`, `ownership-browser-final.log`, `chess-browser-final.log`, `evil-wizard-browser-final.log`, `media-downloads-final.log`, and their JSON reports under `docs/phase3-evidence/`. Older baseline logs remain historical.

## Failures investigated and limits

The first closure run flagged a valid Qubit directory URL because the new JavaScript reference checker did not resolve directory indexes. The validator now applies exact-case index resolution; no runtime rewrite was needed. The media test initially selected decorative videos as well as the presentation; it now selects the controlled presentation explicitly.

One full responsive sweep under concurrent browser load reported `learn-cyber.html` at 844px in light mode. Eight targeted seven-viewport/two-theme repetitions did not reproduce it. Element-level failure diagnostics were added before repeating the full sweep; the repeated full sweep passed with no failures. The original isolated timing failure remains disclosed here, and diagnostics remain in the test. No speculative CSS change was made.

These are Chromium simulations, not physical iOS/Android or native WebKit acceptance. Browser tests do not certify full WCAG conformance: they cover skip links, keyboard/focus behavior, control semantics, layout and appearance, not a comprehensive screen-reader or contrast audit. Long game sessions, every character/combat variant, physical audio activation, gamepads, native Linux reproduction, third-party terms/provider outages and preservation gaps remain release-review concerns. Node emits a module-type inference warning; the chess browser can log an implicit favicon 404. These do not fail the asserted runtime/game contracts.
