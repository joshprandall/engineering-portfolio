# SLO units and reporting-window practice

Two existing generic lessons now contain original synthetic exercises:
- `leadership-v09-scenario-analysis-service-level-objective`: time versus request units, unequal traffic weighting, allowance consumption and the explicit equal-traffic special case.
- `leadership-v09-design-review-service-level-objective`: completed calendar versus partial calendar versus rolling reports, precise pass/fail comparisons, month lengths and interval endpoints.

Only essentialQuestion, reasoningSteps and labPlan changed. No IDs/order, identity/history, shared runtime, navigation, tiles, games or media changed. Targets are illustrative, not operational recommendations.

Primary source read: https://sre.google/workbook/implementing-slos/; specifically event-ratio definitions and Choosing an Appropriate Time Window. The source explains rolling/calendar tradeoffs and does not prescribe one window for all services. Source snapshot provenance is retained in the adjacent error-budget review.

79 focused tests passed, including exact authored-field scope, independent arithmetic and counterexamples. Full aggregate results follow after execution. To avoid rebuilding 446 MB for a two-record prose change, only the exact committed reliability blob's manifest size/hash/blob ID and aggregate size are refreshed. This is not a new full-package verification or deployment approval; the last full-package gate remains the previous checkpoint, 2d657fe.
