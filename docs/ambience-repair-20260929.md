# Background and audio repair — 2026-09-29

The complete repair is published to the existing owner-private Website 2.1 preview. OSU and main remain unchanged. This supersedes the unfinished recovery checkpoint and the original refinement report's background/media limitations.

## Repair

The approved Day/Night scenery, music, field recordings, 28-second rotation, translucency, solar navigation and controls are retained. Games and Geometry calculation internals remain protected.

- Every preview background video/audio file now supports correct byte ranges and fixed Content-Length, including Safari's two-byte probe.
- River's seek index precedes its video data. Stream-copy remuxing preserved all 1,536 encoded packets; their aggregate SHA-256 is still `66b869098b41c13afaa44d674911baaf377dae79907cb7c11344953668896a7d`.
- Local matching posters remain above unready videos. Sound changes only after the matching scene is visible. Rotation is independent of stalled play promises; stale loads cannot overwrite a newer scene. Outgoing downloads are released after crossfade.
- All Day recordings and MP3 alternatives are packaged locally. One audio owner controls scene matching, saved mute/volume, Night playhead, activity suppression and page lifecycle. Web Audio gain handles site volume, with a native fallback. Late events cannot restart inactive or muted sound.
- Returning to a page restarts eligible media even if it was hidden during initial delay. Optional canvas decoration cannot prevent video/audio initialization.
- All 64 shared pages load one matching, ordered scene/audio/control release. Hash, script-order and complete-media contracts now run during content validation and packaging.

Fourteen Day assets are preserved as 26 immutable Git chunks, verified by Git blob and final SHA-256. Runtime playback no longer depends on external media availability. Corrected media credits accompany the recordings and conversions.

## Revisions

| Item | Revision or result |
| --- | --- |
| Application repair | `cf8cc5da81c2fd2889d805722b22f42deca812e1` |
| Browser-tested source with final streaming fixture | `681e4db96a16d5a3448b004a21157bf26ab21694` |
| Published private preview source | `95b8fb18342bab2755bbd6220b5fb99eb18473b8` |
| Preview deployment | `appgdep_6abb5e923ec481918b7aabea8c88aea1`, succeeded |
| Source/preview equivalence | All 64 shared pages and six runtime owners match byte for byte |
| Exact source runtime package | 287 files, 419,763,947 bytes; reviewed path/size/hash manifest |
| Main, unchanged | `88d1980a0520dffc0d3f84699f684c472a7c6516` |

Later evidence-only commits do not alter this tested application payload.

## Evidence

Source tests pass, including 16 background/controller/contract checks and 19 Python tests (two existing integration tests skipped). The hosting project passes 54 tests covering media hashes, range boundaries, seek-index placement, controllers and protected content.

[Site validation run 36532616425](https://github.com/joshprandall/engineering-portfolio/actions/runs/36532616425) passes with actual Chromium and WebKit decoders. Each engine verifies changing pixels for all three Day scenes, matching local sound, Night motion/music, pause/resume, saved mute/volume, navigation, canvas failure and five additional viewport sizes. JSON: [Chromium](ambience-evidence/chromium.json), [WebKit](ambience-evidence/webkit.json). Screenshots and recordings remain in the run artifacts.

The final fixture streams real HTTP 206 responses. Earlier automation-fulfilled large responses produced intermittent WebKit buffering failures; failed attempts remain in Actions history. Checks still require visible changing pixels, not just a playing flag or advancing clock.

[Overlay run 36532616407](https://github.com/joshprandall/engineering-portfolio/actions/runs/36532616407) checks restored media, packaging, protected experiences, browser journeys and translucent surfaces. The preceding identical-runtime overlay run 36532200273 also passes.

[Published HTTP evidence](ambience-evidence/published-http.json) records exact two-byte responses for all 13 video/audio files, first-frame decoding from the initial 2 MiB of all three published videos, and sampled scripts/pages/posters matching packaged source. HTML comparison accounts only for the observed hosting-added Cloudflare challenge script.

These are automated browser-engine and published-transport results. Physical iPhone Safari, Messenger and speaker output were not tested. OSU playback has not been changed or certified by these checks.

## Future content work

Follow [AMBIENCE-STABILITY.md](AMBIENCE-STABILITY.md). Reuse the shared shell; do not add page-owned timers or background audio. Resolve missing media, mixed script versions, changed reviewed hashes and native playback failures before shipping. These executable regression checks do not promise that future browsers can never introduce defects.
