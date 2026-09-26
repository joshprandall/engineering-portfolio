# Phase 3 acceptance

All servers use the isolated staged directory when `PORTFOLIO_RUNTIME_ROOT` points to `staging/website-2.0-runtime`. `tests/runtime-browser.test.cjs` always uses that directory and rejects every path outside the exact package allowlist, including wrong-case paths. Test evidence is written outside the package.

Baseline static acceptance: 40 HTML pages, exact byte hashes, no missing static HTML references, duplicate IDs, visible literal newline escapes or detected mojibake. All 8,000 unique learning records resolve to the 76 chunks declared by the real chunk index; supplementary video profiles are not counted as a lesson chunk.

Baseline browser coverage: all 40 routes; 1440, 1920, 820 portrait, 1180 landscape, 390x844, 320 and 844 landscape viewports; skip links; menu state/Escape/focus; strict case and out-of-package denial; every lazy chunk fetched from staging. Existing site tests additionally exercise science, project pages, lessons, theme navigation/reload/back/cross-tab/storage failure, scenes and embedded Messenger/Facebook/Instagram simulations. Chess tests exercise advanced and emergency state continuity, touch, combat and no-WebGL entry. Evil Wizard tests advance its three-screen prologue before requiring a playing-state handshake.

These are Chromium simulations, not real iOS/Android hardware validation. Physical devices, camera/gamepad gestures, long gameplay sessions, every character/combat variant, remote provider outages, and staged cross-platform package reproduction remain explicit release review concerns until supported by evidence.
