# Stable backgrounds and sound

The approved backgrounds and recordings are retained. This repair makes their loading, lifecycle and release package consistent across shared pages.

## Ownership and invariants

| Owner | Responsibility |
| --- | --- |
| site-theme.js | Saved Day/Night and motion preferences; shared shell fallback loading |
| site-scenes.js | One background; visible scene identity; 28-second Day rotation; video and poster lifecycle; Night motion |
| site-audio.js | The only background sound owner; matching audio, saved mute/volume, activity suppression and page lifecycle |
| site-sound-control.js | Controls for the existing audio API |
| manifests/ambience.json | Reviewed runtime hashes, common release version, shared pages and required media |

A scene begins silently while its matching image/video becomes available. Only the visible scene can commit its sound. Outgoing players are muted and stopped before replacement. Video startup cannot block the scene clock. A local matching poster remains above an unready video. Decorative canvas failure cannot disable video or controls. Explicit motion pause is independent of audio mute; returning to a page rechecks saved preferences and resumes eligible media.

All three existing Day videos, three matching posters and eight audio-format files are preserved in Git chunks. Their restore verifies each Git blob and final SHA-256. Runtime playback uses local files; external availability is not needed for the normal experience. The river index was moved before its video data by remuxing, without re-encoding frames. Audio MP3 copies contain the same field recordings as the preserved OGG originals. See assets/audio/CREDITS.md.

## Content updates

Copy the shared script/style block from an existing page. Do not add an independent background player or change background timing to support page content. Run npm test. The contract checks every existing shared page plus newly detected shared shells for one matching release and scene → audio → controls ordering.

The hash check deliberately fails if content work changes a protected runtime owner. When a background change is intentional, test the behavior first, then update the reviewed hashes and version together. This is a review boundary, not a claim that browsers can never change.

## Verification and release

1. Run npm test for controller, lifecycle, page contract and existing portfolio regressions.
2. Restore media with python3 tools/restore_website2_assets.py --ambience. Set PORTFOLIO_REQUIRE_MEDIA=1 when running tests/ambience-contract.test.cjs against a release.
3. The Site validation workflow runs real-media tests in Chromium and WebKit, blocks external requests, decodes changing video frames, checks all Day sound identities, Night motion/music, pause, navigation preferences and canvas fallback. It saves screenshots, recordings and a JSON result. Desktop WebKit is not a physical iPhone/Messenger certification.
4. The OSU overlay and deployer require complete verified Day media. Missing audio must stop packaging; the old optional-download behavior is removed.
5. Build the exact selected commit with tools/build_runtime.py and refresh reviewed runtime metadata when deliberately changing runtime bytes. Confirm protected game/Geometry hashes and preview the result before production replacement.

Sites also routes every background video/audio file through its byte-range handler, including short files. Safari probes require a correct 206, Content-Range and fixed Content-Length. The hosting tests verify range boundaries, complete file hashes and the river's leading seek index.

Never describe a preview-only fix or modeled-media test as verified OSU/device playback. Record the actual source revision and deployment result.
