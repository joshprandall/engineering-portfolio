# Protected refinement evidence — September 28–29, 2026

This is an implemented release candidate with local and automated verification. **OSU deployment and post-deployment production verification have not occurred.** An authenticated OSU shell was unavailable. Source recovery starts at `backup/protected-baseline-20260928-88d1980` (`88d1980a0520dffc0d3f84699f684c472a7c6516`). No unrelated working files, branch history or deployed game exports were overwritten.

The governing decisions and remaining content boundaries are in [the protected baseline](../WEBSITE-2.0-PROTECTED-BASELINE.md). [Authoring guidance](../WEBSITE-2.0-AUTHORING.md) includes a complete, unpublished example and a publication checklist. Earlier evidence directories retain their historical versions; these results belong to this pass.

## Before and after

All paired images use the same 390- or 1440-pixel viewport, theme, route and scroll target. Background animation phase can differ. The `comparisons/` images were reproduced against the archived starting commit and candidate source. `baseline/` was captured before edits; `refined/` contains the equivalent section views. Each covers Home, Projects, Learning, lesson visual/lab, AI, chess and Evil Wizard launchers, plus the menu and solar presentation, in both themes. Baseline filenames say what was actually captured.

| Example | Before | After | Intended difference |
| --- | --- | --- | --- |
| Homepage, phone, Night | [Image](comparisons/home-390-dark-before.jpg) | [Image](comparisons/home-390-dark-after.jpg) | Same composition and header bounds |
| Homepage, desktop, Day | [Image](comparisons/home-1440-light-before.jpg) | [Image](comparisons/home-1440-light-after.jpg) | Same composition and approved profile content |
| Learning mental model, phone | [Image](comparisons/teaching-390-dark-before.jpg) | [Image](comparisons/teaching-390-dark-after.jpg) | Topic-specific guide paired with the activity |
| Integral activity, phone | [Image](comparisons/integral-390-dark-before.jpg) | [Image](comparisons/integral-390-dark-after.jpg) | Previously unreachable model now calculates and draws |
| Computer vision, phone, Day | [Image](comparisons/ai-390-light-before.jpg) | [Image](comparisons/ai-390-light-after.jpg) | Inputs tied to a legible convolution matrix/result |

`comparisons/layout.json` records component bounds. Homepage header bounds match exactly in all four paired width/theme views. This is a representative comparison, not a claim that every pixel is identical.

[Baseline phone interaction](recordings/baseline-home-390.webm), [refined phone interaction](recordings/refined-home-390.webm), [baseline lab](recordings/baseline-lesson-lab-390.webm), [refined lab](recordings/refined-lesson-lab-390.webm), and [actual Evil Wizard launch-to-play](recordings/evil-wizard-launch-to-play.webm) are playable recordings. The other AI/game-launcher clips are under `recordings/`. A launcher clip is not a game playthrough. The baseline/refined recording manifests map the original sequential capture timestamps and describe their scope.

## Results

Node 24.19, Python 3.12, Playwright 1.63 API, Chromium 140 headless shell (1194), software WebGL. Official current-browser downloads failed in this environment, so the available official older Chromium executable was explicitly selected. External requests are blocked in isolated browser suites unless a test states otherwise. No physical-device result is inferred from an emulated viewport or user agent.

| Command or check | Observed result and scope |
| --- | --- |
| `npm test` | Pass: source/content contracts; all 8,000 record references/quiz indices, 76 teaching chunks and 66 guide keys; Qubit/QPE/emergent known cases; chess rules/perft 20/400/8902 and special moves/end states/AI; local review scheduling; modeled audio lifecycle; 18 Python asset/package/deployment/rollback tests |
| `npm run test:browser` | Pass: shared-site navigation, appearance, storage fallback, project experiments, learning flow and embedded-browser user-agent emulation |
| `npm run test:refinement-browser` | Pass: 19 AI experiments, all 66 learning model types, real controls/results, mathematical edge cases, notes/progress/review persistence, retry without state loss, narration/wave cleanup and hidden-timer resume |
| `npm run test:security-journeys` | Pass: six local security tools, deterministic fuzzer replay, schema/error recovery, current-result JSON export and current-goal MIND export |
| `npm run test:runtime-browser` | Pass: 71 packaged routes × seven viewport configurations × two themes, 76 fetched teaching chunks, no reported route failures |
| `npm run test:responsive-components` | Pass: shared headers/controls and learning components, including 320-pixel and 3840-pixel cases; theme parity and numeric extrema |
| `npm run test:ownership-browser` | Pass: singleton header controls, autoplay-denial state, preference persistence, search/focus, current solar destinations, lesson audio suppression, explicit pause, reduced motion, blocked storage/canvas fallback |
| `npm run test:chess-browser` | Pass with `PORTFOLIO_THREE_ROOT` set to exact Three.js 0.180.0 npm files: full advanced/emergency desktop/touch flows, 3D/capture, state-preserving switches, undo/flip and unsupported-WebGL fallback. Live CDN availability is not established by this substitution. |
| `npm run test:evil-wizard-browser` | Pass with actual preserved Godot/WASM/PCK: 15 champions, export initialization, player-driven prologue and playing-state handshake. Not an exhaustive level/collision/checkpoint playthrough. |
| `npm run test:responsive` | Partial/failed gate: 10 representative routes through 21 viewport sizes and continuous resizing; one intermittent legacy capability-scene resize warning was recorded. Native zoom failed its assertion because the requested 0.8 zoom remained DPR 1. No native zoom pass is claimed. A focused rerun passed 183 viewport/continuous-resize checks without reproducing that warning, and again failed only native zoom. Both raw reports remain attached. |
| `npm run test:media-playback` | Blocked: actual local Night WAV advances; this Chromium build reports no MP4/H.264 support and Day video raises media error 4. No Day-video pass or external-audio playback pass is fabricated. |
| `npm run test:media-downloads` | Blocked at the native fusion-video decoding gate for the same codec limitation. Hash-verified video bytes are preserved; subsequent checks in that suite did not run. |
| Production native media observation | Pre-release Cloud Chrome: river, beach and waterfall videos each reached readyState 4 and advanced, with matching ambience playing and abandoned players paused. [Observed states](production-media.json). Not physical speaker measurement and not verification of a new deployment. |

Detailed JSON reports and command logs accompany this file. A controller test with modeled media events is explicitly distinct from native media decoding. Existing production audio/scenes differ from source; the newer source's transition contract is retained and its fallback/stale-event defects are covered by targeted tests.

## Measured loading improvement

The comparable representative captures show 18,136 DOM nodes on the Learning homepage before, versus 737 afterward (about 96% fewer). The selected visual lesson fell from 18,089 to 626; its lab from 18,085 to 657. The corpus remains intact. The improvement comes from rendering only the active learning route rather than constructing hidden catalogs, paths and graphs.

Homepage DOM count stayed 435; Projects stayed 267. Single-run local DOMContentLoaded timings vary with concurrency, fonts and media, so they are retained as raw measurements rather than presented as a speed guarantee. No field Core Web Vitals, Lighthouse score or quantified memory-retention claim was established.

## Content scope and remaining boundaries

`content-counts.json` distinguishes 8,000 catalog records (1,400 source concepts, 6,600 derived practice records), 3,145 records backed by 66 model types, 3,000 entries labeled Lab, 855 Lab entries without an attached model, 19 deterministic AI build experiments, and 71 HTML routes. These are not 8,000 independently complete authored lessons. Repeated teaching scaffolds and imprecise inherited citations need editorial completion. This pass does not claim two bespoke teaching visuals or claim-level verification for every catalog entry.

Physical iOS Safari, Android Chrome, tablet/gamepad controls, desktop Safari/Firefox and Messenger WebViews remain unverified. Firefox would not finish starting here; WebKit required unavailable system libraries. The native-zoom and H.264 gates above remain open. No engine migration or replacement game was used to sidestep those boundaries.

Three deployed Day videos have pinned hashes and verified preview copies but still need immutable asset-release mirroring. Their public URLs are not immutable backup storage. Existing fusion/WASM release preservation and OSU's backup-first deployer remain intact. The known-path HTTP capture is not a server-directory inventory; inaccessible or unknown files were never authorized for deletion.

## Release procedure and state

Source commits, browser-tested previews, deployment and production verification are separate states. The refinement PR provides the final remote commit and CI status. Recheck `origin/main` and the candidate head before release; do not reset or force-push either side. Build the selected exact SHA using the documented manifest workflow, and retain the protected overlay behavior.

After the remaining applicable browser/media checks, run the two commands in `DEPLOYMENT.md` from the authenticated OSU account, replacing both `SHA` values with the PR's tested full head SHA. The deployer makes a full backup, preserves game/Geometry/fusion bytes and rolls back failed writes. Then perform actual production route, learning, AI, game, theme, scene and sound checks. Nothing in this report states that those deployment steps already occurred.
