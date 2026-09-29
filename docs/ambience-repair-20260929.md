# Background and audio repair — 2026-09-29

Status: the complete stabilization is unfinished. Do not treat the earlier release-candidate evidence as verification of these repairs or replace the OSU site yet.

## Protected experience

Preserve Josh's approved Day/Night scenery, Night music, Day field recordings, 28-second Day scene rotation, translucent surfaces, solar navigation, and controls. Games and Geometry internals remain unchanged. Validate the separate private preview before any OSU replacement.

## Confirmed causes

- Safari's initial `bytes=0-1` probes exposed inconsistent range delivery. Small static MP4s could bypass the range handler; arbitrary streamed responses lacked a dependable Content-Length.
- The river MP4 used fragmented metadata, leading Safari to request much of the file before displaying it. A stream-copy remux moves the complete index before video data without changing encoded frames.
- External poster requests failed. Matching JPEG frames now accompany all three videos in the saved preview repair.
- A stalled play promise could hold up scene changes. Rotation must use visible elapsed time independently of video readiness.
- Older local checks disabled real video on localhost and did not verify Day audio.
- Shared pages contained multiple script versions and different load orders.
- Four Day OGG files were missing from the packaged site. Remote fallbacks concealed the incomplete package.
- Inactive sound players allowed autoplay. Late loading/playback events and overlapping activity suppression need explicit lifecycle tests.
- A page hidden during the initial media delay could return without restarting that delay.
- Native media volume alone is insufficient for consistent iOS website-level volume. The pending implementation adds Web Audio gain control while retaining a native fallback.

## Saved preview repairs

Source repository: the existing private Website 2.1 Site, project `appgprj_6abb392a58f481918c45f25581fea22a`.

- `87748183d710e8de72bd3ae1f0edc55d16a8cdf3`: published range delivery and independent rotation fixes. Actual HTTP probes for all three Day clips returned 206 and the correct two bytes; cross-chunk reads also matched.
- `58451dc1cd0769e16f8ed3229af4951a22da8879`: saved river remux, three local posters, poster layering, scene-visible audio synchronization, and release of outgoing video downloads. Publication was requested through the remote build fallback on 2026-09-29 after the editing workspace disconnected. Check the actual deployment result before claiming it is live.
- Deployment to inspect: `appgdep_6abb57e3ac748191b1e00af51d378e0b`.
- Saved version: `appgprj_6abb392a58f481918c45f25581fea22a~appgver_7d9c75c127b88191b94d6d0b843f2c47`.

The river remux preserves all 1,536 encoded video packets. Their aggregate packet SHA-256 remains `66b869098b41c13afaa44d674911baaf377dae79907cb7c11344953668896a7d`.

## Additional implementation awaiting recovery and publication

The disconnected workspace contains a larger uncommitted pass in:
- `/workspace/sites/josh-randall-website21-preview`
- `/workspace/scratch/1fa2b770058f/ambience-source`

It normalizes 64 shared pages, adds matching local MP3/OGG sound, handles saved preferences and audio lifecycle, adds gain-based volume, permits real local playback, and makes canvas decoration optional so canvas failure cannot prevent scenery.

Thirteen controller regression tests passed: singleton ownership, quiet initial gain (including modeled read-only native volume), native fallback, visible-scene sound matching, stable local audio fallback, late events after mute/hide/pagehide, overlapping activity suppression, beach crossfade volume/zero/mute, navigation persistence, independent 28-second rotation under stalled playback, slow startup, stale source loads, explicit pause/Night behavior, stale gesture completion, and late poster loads. These are modeled-media tests, not native browser/device certification.

A full packaging/test run was started but its result was not collected before the workspace disconnected. Do not claim that run passed.

Fourteen Day media assets were prepared as 26 immutable Git chunks with a verified restore path, so future builds will not depend on external downloads. That source publication is incomplete: only two binary Git objects were uploaded, and no application commit containing the broader repair has been pushed to this repository.

## Remaining release work

1. Recover and inspect the working changes; preserve unrelated modifications in the original source checkout.
2. Finish the executable shared-page/runtime/media contract and call it from the normal test and packaging workflow.
3. Finish immutable Day media publication and require the complete verified media package in the OSU overlay/deployer; missing sound must fail the build instead of silently shipping a remote fallback.
4. Complete real-media Chromium/WebKit CI coverage for all three Day scenes, Night, sound identity, mute/volume, pause/resume, navigation, and lifecycle transitions. Keep physical Safari/Messenger claims separate from modeled or desktop tests.
5. Refresh exact committed runtime hashes and release evidence; verify protected game/Geometry bytes.
6. Publish the complete private preview, verify its actual media responses and first-frame decoding, and review on the target iPhone before any OSU replacement.

## Media attribution correction

River: Jarrod stanley / J. D. Savanyu, CC0, https://commons.wikimedia.org/wiki/File:Sanna_river_rapids.ogg

Waterfall: Benzband, CC BY-SA 3.0, https://commons.wikimedia.org/wiki/File:Water_fall.ogg — the older blanket CC0 description was wrong. Retain attribution, license link and a note that MP3 copies are conversions.

Beach recordings: U.S. Fish and Wildlife Service, U.S. federal public domain:
- https://commons.wikimedia.org/wiki/File:Cape_May_Shorebirds_closer.ogg
- https://commons.wikimedia.org/wiki/File:Cape_May_Shorebirds_(distant).ogg

Video attribution remains K / Christophe Génot / Daniel Feldman under the existing Pexels terms. Night imagery and user-provided music are unchanged.
