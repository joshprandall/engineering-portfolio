# Volume repair — isolated review checkpoint

This is implemented review code, not an integrated website release. No root runtime, main, existing PR branch, production site, styles, scenery, recordings or game internals are changed by this checkpoint.

## Reproduced failure and repair

The baseline controller reads an old saved volume again after a failed storage write. With readable 5% storage and writes throwing, requests for 60% and mute both leave sound at 5%. Session-authoritative preferences fix that failure. The control also accepts change-only commits and resumes an interrupted audio graph within the interaction; an active beach crossfade is not reset by that recovery.

The source is pinned to 11f9f5e33bd8452b1b0538ffe285b8e9b354d865. Both original blobs are included by their exact Git SHA. The patcher refuses unknown bytes and writes a separate patched directory, manifest and diff. Expected patched SHA-256 values:

- site-audio.js: d1b95c9089bc4f901e442947ed6ead9e30b7d543ef5a56c803da71687de5657c
- site-sound-control.js: 6fa11ac5aff4677ec03172ba3347629f6eabe6becc234c5de1e66636e0dde43f

## Reproduce

From this directory in a Python virtual environment:

    python -m pip install playwright==1.57.0
    python -m playwright install chromium
    python apply_volume_repair.py
    python tests/reproduce_offline.py
    python tests/test_volume_browser.py

Tested: Python 3.13.5, Playwright 1.57.0, system Chromium 144.0.7559.96 and Node 22.16.0. The fixture generates a WAV, embeds it, and measures samples after native Web Audio gain. BROWSER_EXECUTABLE_PATH can select a browser. Otherwise an installed system Chromium or Playwright's managed Chromium is used. No paid API, account or original media download is needed for these component checks.

17/17 cases passed, including a rerun from a fresh copy without the optional stored WAV: amplitude changes, denied persistence, muted start, change commit, keyboard, interrupted graph, scene identities, pending-scene silence, activity priority, page lifecycle, external storage events, numeric bounds, duplicate owners, simulated read-only native volume, beach crossfade, and touch input.

These tests simulate storage failures, scene/lifecycle events and media source URLs. Read-only native-volume behavior is simulated, not physical iOS testing. They do not prove the reported live phone bug has this same cause. They do not verify HTTP routes, actual original-video/audio matching, physical speakers, Safari/Messenger, complete games, or the whole website.

## Remaining release work

Integrate intentionally into the shared runtime release, update the common version and reviewed hashes together, and run full repository, packaging and actual-media regressions. Do not copy only these scripts onto OSU. Keep OSU and main untouched until the complete review build has passed and the owner approves it.

The right-edge strip, all tile journeys, meaningful game playthroughs, complete model-specific AI builds, Learning/Security depth, all root/nested routes, and a hosted accessible preview remain open. A partial overlay is not a complete game distribution. An automated schema or link result is not evidence of content completeness.

Vercel is connected, but the deploy action returned JSON-RPC -32602: Tool deploy_to_vercel not found. Team and default-scope project listings were empty. No new hosted preview exists.
