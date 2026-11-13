# Passive frame-callback starvation failure evidence

Base: 52fcdf6215ed569ac8c22f7039374ef16e929c06.

Three recent phone WebKit jobs (131819279648, 131811390168, 131803806880) timed out in the deliberately starved requestVideoFrameCallback probe. This change records the four predicate flags, timeline, paused/readiness/network/error/source state, and document visibility after that existing gate rejects.

The exact original waitForFunction call is retained, including its existing second argument {timeout:20000}. This is not the options position and observed effective timeout is 30000ms; this patch deliberately does not correct that timing mismatch. No predicate, playback, DOM, fallback, deadline, existing assertion, or runtime asset is modified. Successful execution performs no added browser evaluation. After failure only, the read-only diagnostic is bounded to one second; a failed or hung observation cannot mask the original rejection. The snapshot is post-failure evidence, not a simultaneous measurement at timeout, and is stored in the existing media-playback.json report.

Validation: syntax check passed; 7 new helper/integration tests and all 10 existing passive media/audio diagnostic tests passed (17 total, zero skips). Tests cover successful result preservation, exact original rejection identity, missing media, strict .15 threshold, independently false predicate flags, failed observation, and bounded hung observation. No full browser rerun or live test was requested. Prior intermittent media failures remain unwaived. This is not a runtime fix or release approval.
