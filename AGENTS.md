# Portfolio maintenance

Preserve the approved appearance and experiences. Backgrounds and matching sound are core functionality, not decorative extras to remove during content work.

- Read docs/AMBIENCE-STABILITY.md before changing shared appearance, scenes, audio, controls, or deployment packaging.
- Add content using the existing shared shell. Keep the version and ordered deferred scripts in manifests/ambience.json. Never create another background audio owner or a page-specific scene timer.
- Ordinary content updates must pass npm test without changing the reviewed runtime hashes. An intentional background repair must include focused regressions and explicitly update those hashes after verification; do not update them merely to silence a failure.
- Preserve all immutable media chunks. Restore with python3 tools/restore_website2_assets.py --ambience before browser tests or packaging. Do not substitute similarly named remote media or omit missing sounds.
- Keep the actual-media Chromium and WebKit checks passing. Model tests alone do not establish native browser playback. Physical iPhone/Messenger observations must be identified separately.
- Preserve game and Geometry internals. Test the preview before replacing the OSU site.
