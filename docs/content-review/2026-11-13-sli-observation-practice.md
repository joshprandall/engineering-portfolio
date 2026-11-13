# SLI observation and joint-condition practice

Two existing generic Reliability lessons now contain original synthetic exercises:

- `leadership-v09-design-review-service-level-indicator`: count success AND latency eligibility using a four-cell ledger, inclusion-exclusion, strict threshold boundaries, and counterexamples to double-counting and unsupported independence.
- `leadership-v09-troubleshooting-lab-service-level-indicator`: reconcile server versus client observation, quantify the server blind spot, and bound genuinely unknown telemetry rather than assuming it successful.

Only essentialQuestion, reasoningSteps and labPlan changed. Lesson IDs/order, other fields, public identity/history, renderer, tiles, navigation, sound, solar, games and all protected assets remain unchanged. These invented numbers are not claimed service measurements or operational recommendations.

Primary source read: https://sre.google/workbook/implementing-slos/ (local extracted source reviewed for successful requests below a threshold, specification versus implementation, backend blind spots and client telemetry reliability). Source snapshot hash was recorded in the adjacent error-budget review. Exercises are original, not copied source examples.

Focused tests: 77/77 passed, including exact field/ID scope against stored baseline, independent arithmetic, strict threshold cases, and missing-data bounds. Full aggregate and package results are recorded after execution. No merge or deployment is authorized by this review; prior live runtime differences still block a blanket overlay.
