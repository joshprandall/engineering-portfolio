# SLO units and reporting-window practice

Two existing generic lessons now contain original synthetic exercises:
- `leadership-v09-scenario-analysis-service-level-objective`: time versus request units, unequal traffic weighting, allowance consumption and the explicit equal-traffic special case.
- `leadership-v09-design-review-service-level-objective`: completed calendar versus partial calendar versus rolling reports, precise pass/fail comparisons, month lengths and interval endpoints.

Only essentialQuestion, reasoningSteps and labPlan changed. No IDs/order, identity/history, shared runtime, navigation, tiles, games or media changed. Targets are illustrative, not operational recommendations.

Primary source read: https://sre.google/workbook/implementing-slos/; specifically event-ratio definitions and Choosing an Appropriate Time Window. The source explains rolling/calendar tradeoffs and does not prescribe one window for all services. Source snapshot provenance is retained in the adjacent error-budget review.

79 focused tests passed, including exact authored-field scope, independent arithmetic and counterexamples. Full aggregate results follow after execution. To avoid rebuilding 446 MB for a two-record prose change, only the exact committed reliability blob's manifest size/hash/blob ID and aggregate size are refreshed. This is not a new full-package verification or deployment approval; the last full-package gate remains the previous checkpoint, 2d657fe.

Previous checkpoint CI clarification: 2d657fe authored companions, validate, interface, Chromium desktop and WebKit desktop passed. WebKit phone failed in run 43376376580, job 131723709962 at tests/media-playback.test.cjs:112 with `ResizeObserver loop completed with undelivered notifications.` after media decoding. This remains an unwaived release-gate failure; no runtime code or assertion was changed to hide it.

Full npm aggregate passed: 1,043 curriculum tests plus the other Node and Python suites. Generated route/source manifests were unchanged. Scoped exact-blob manifest refresh retains 334 paths and records 446,021,612 aggregate bytes; only reliability.json changed, with SHA-256 e1d7300a5a5e62ec5748b1c193f5e41e9b5d26e62904f2b18d7ba976b4c4cbac. No new full package build or deployment was performed.
