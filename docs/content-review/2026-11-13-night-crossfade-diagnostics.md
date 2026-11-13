# Passive night crossfade failure evidence

Inspected hosted 9239e6a Site run 43431676755, desktop WebKit job 131906440669 and artifact 14040043469. Failure is a 6000 ms timeout at prior media-playback:58 waiting for two unpaused/unmuted dark audio elements. Artifact records night playback at 9.08 seconds, primary gain about 0.05, one active owner and an alternate paused element before the seek. Errors, failed local requests and passive diagnostics are empty. No state was captured at the failed wait.

The existing runtime uses a 0.18 second night overlap; a missed short observation window is a hypothesis, not an established cause. Failed startup, seek or transition could also explain the result. No runtime, timing, predicate, pass/fail gate or retry behavior is changed.

Added bounded failure-only state snapshots after either original night-owner wait rejects. Capture both players, owner count, seeking/ended/ready/network/error state, bounded buffered/seekable ranges, selected volume and gain outputs. The original wait error is rethrown by identity, including when observation fails or exceeds its one-second diagnostic budget. Successful gates take no snapshot.

Validation: all 21 diagnostic tests passed (eight new, seven existing frame-predicate, six existing media diagnostics), plus media-playback syntax and site checks. Exact integration diff is only the import and failure wrappers around the two original six-second owner predicates; all other media test bytes remain unchanged. Test bytes match isolated QA. No browser playback rerun or successful crossfade is claimed. No runtime assets, release manifest, content or production code changed. No live change or deployment.
