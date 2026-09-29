# Background and audio repair — 2026-09-29

The updated repair is published to the existing owner-private Website 2.1 preview. OSU and main remain unchanged. This supersedes the unfinished recovery checkpoint and the original refinement report's background/media limitations.

## Repair

The approved Day/Night scenery, music, field recordings, 28-second rotation, translucency, solar navigation and Sound button are retained; the expanded control is now only a native volume slider with no backing panel. Games and Geometry calculation internals remain protected.

- Every preview background video/audio file now supports correct byte ranges and fixed Content-Length, including Safari's two-byte probe.
- River's seek index precedes its video data. Stream-copy remuxing preserved all 1,536 encoded packets; their aggregate SHA-256 is still `66b869098b41c13afaa44d674911baaf377dae79907cb7c11344953668896a7d`.
- Local matching posters remain above unready videos. Sound changes only after the matching scene is visible. Rotation is independent of stalled play promises; stale loads cannot overwrite a newer scene. Outgoing downloads are released after crossfade.
- All Day recordings and MP3 alternatives are packaged locally. One audio owner controls scene matching, saved mute/volume, Night playhead, activity suppression and page lifecycle. Web Audio gain handles site volume, with a native fallback. Late events cannot restart inactive or muted sound.
- Returning to a page restarts eligible media even if it was hidden during initial delay. Optional canvas decoration cannot prevent video/audio initialization.
- All 64 shared pages load one matching, ordered scene/audio/control release. Hash, script-order and complete-media contracts now run during content validation and packaging.

Seventeen Day assets are preserved as 31 immutable Git chunks, verified by Git blob and final SHA-256. Runtime playback no longer depends on external media availability. Corrected media credits accompany the recordings and conversions.

## Revisions

| Item | Revision or result |
| --- | --- |
| Application repair | `510006658056637447d0cc20d64010017df36d24` |
| Browser-tested source with final streaming fixture | `80f97cf0eee896e2a5b6c200be5ba357df4655ec` |
| Published private preview source | `51ac5821f39ba219cbdf83fdf67a4680a5add6c8` |
| Preview deployment | `appgdep_6abb7c521be88191b7969a947848b3a1`, succeeded |
| Source/preview equivalence | All 64 shared pages and six runtime owners match byte for byte |
| Exact source runtime package | 290 files, 442,504,117 bytes; reviewed path/size/hash manifest |
| Main, unchanged | `88d1980a0520dffc0d3f84699f684c472a7c6516` |

Later evidence-only commits do not alter this tested application payload.

## Evidence

Source tests pass, including 16 background/controller/contract checks and 19 Python tests (two existing integration tests skipped). The hosting project passes 61 tests covering media hashes, range boundaries, seek-index placement, controllers and protected content.

[Site validation run 36544540368](https://github.com/joshprandall/engineering-portfolio/actions/runs/36544540368) passes with actual Chromium and WebKit decoders. Each engine verifies changing pixels for all three Day scenes, matching local sound, Night motion/music, pause/resume, saved mute/volume, navigation, canvas failure and five additional viewport sizes. JSON: [Chromium](ambience-evidence/chromium-v2.json), [WebKit](ambience-evidence/webkit-v2.json). Screenshots and recordings remain in the run artifacts.

The final fixture streams real HTTP 206 responses. Earlier automation-fulfilled large responses produced intermittent WebKit buffering failures; failed attempts remain in Actions history. Checks still require visible changing pixels, not just a playing flag or advancing clock.

[Overlay run 36544540380](https://github.com/joshprandall/engineering-portfolio/actions/runs/36544540380) checks restored media, packaging, protected experiences, browser journeys and translucent surfaces. The preceding identical-runtime overlay run 36532200273 also passes.

Earlier V1 [published HTTP evidence](ambience-evidence/published-http.json) records exact two-byte responses for that prior publication for all 13 video/audio files, first-frame decoding from the initial 2 MiB of all three published videos, and sampled scripts/pages/posters matching packaged source. HTML comparison accounts only for the observed hosting-added Cloudflare challenge script.

These are automated browser-engine and published-transport results. Physical iPhone Safari, Messenger and speaker output were not tested. OSU playback has not been changed or certified by these checks.

## Reproduced phone failure and V2 follow-up

The earlier checks proved initial decoded movement but did not require sustained movement on a limited connection. After the user reported continuing failures, run 36534362982 reproduced River stalling in mobile WebKit with each video stream limited to 256 KiB/s (about 2.1 Mbps). The unmodified River averages about 7.4 Mbps. [Before evidence](ambience-evidence/phone-before.json) is retained.

V2 adds 1280×720, 24 fps fast-start renditions of the same complete clips at about 1.3 Mbps. Phone, coarse-pointer, save-data and constrained-device contexts prefer these local copies; original videos remain available and preserved. Video-frame callbacks keep the matching poster visible until a frame is presented where supported. No alternate scenery or recording is substituted.

The volume panel now contains only the accessible native range. Its background, border, shadow, blur and padding are removed, including the overriding responsive styles. Zero mutes and increasing the value restores sound. Browser checks verify the actual computed panel surface, its single input and keyboard behavior.

Final mobile WebKit [after evidence](ambience-evidence/phone-after.json) passes the same limited-connection test: all three scenes have changing decoded pixels and sustained playback. River has one brief initial buffering interval followed by five consecutive one-second progress samples; the test does not claim zero buffering under every condition. Desktop Chromium and WebKit also pass, with matching sound, Night motion/music, pause, saved preferences, navigation and canvas fallback. The test waits for the intended first-frame handoff and rejects spurious rewinds as sustained progress.

The hosting package stores the 25.4 MB learning-data script using lossless gzip (2.3 MB). This fits the host archive limit without omitting any background media. Its URL and decoded JavaScript are unchanged; delivery tests verify the original size and SHA-256 plus MIME, encoding and validators. The build checks the publication-size budget before upload.

## Modularity

Separate runtime files are not full component isolation. Shared CSS, repeated page loaders and document events still create coupling. The current release adds ownership and regression protections; it is not a completed architectural rewrite. The next boundaries and migration order are recorded in [MODULARITY-PLAN.md](MODULARITY-PLAN.md). Content should not directly control background DOM, media or timers. The intended next step is an isolated background component, followed by shared page setup and scoped content/interactive components.

## Future content work

Follow [AMBIENCE-STABILITY.md](AMBIENCE-STABILITY.md). Reuse the shared shell; do not add page-owned timers or background audio. Resolve missing media, mixed script versions, changed reviewed hashes and native playback failures before shipping. These executable regression checks do not promise that future browsers can never introduce defects.
