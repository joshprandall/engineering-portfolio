# Metric boundaries and misleading summaries

Three existing generic Reliability lessons now contain original synthetic ledger exercises:

- failure-analysis-lab/service-level-indicator: attempt versus operation units, retries and a duplicate-success counterexample that exposes an impossible 101% mixed-unit ratio.
- troubleshooting-lab/service-level-objective: exact inclusive compliance versus rounded displays, integer event boundaries and explicit no-data handling.
- transfer-challenge/service-level-objective: typical versus long-tail latency grades, the information hidden by a mean, and boundary repairs requiring 50 rather than 49 improved requests.

Full lesson IDs retain their existing leadership-v09/v10 prefixes and order. Only essentialQuestion, reasoningSteps and labPlan changed. No background, sound, layout, tiles, navigation, games, personal credentials or career history changes.

Primary source read: https://sre.google/workbook/implementing-slos/, especially SLI specification versus implementation, distinct availability/latency/correctness concerns and multiple latency grades for typical and long-tail experience. Counts and targets are original synthetic examples, not measured results or prescribed production policy.

82 focused scope/arithmetic tests passed, including exact changed-field audit against stored baselines. Full aggregate result follows after completion. Narrow committed-blob manifest verification replaces redundant full-package regeneration for this prose-only batch; it does not claim a new package or browser pass. Prior unwaived WebKit ResizeObserver failures and live-runtime parity constraints remain release considerations.
