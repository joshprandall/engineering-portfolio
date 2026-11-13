# Completing the existing SLI/SLO practice sequence

Five remaining generic v10 SLI/SLO lessons now contain distinct synthetic reasoning and practice:
- recovery-lab/service-level-indicator: current recovery versus full-window historical compliance and the precise fixed-failure dilution boundary.
- concept-mapping-lab/service-level-indicator: pipeline coverage, conditional correctness/freshness, overlapping defects and expected-inventory blind spots.
- fault-isolation-lab/service-level-indicator: duplicate telemetry versus unique outcomes and conflicting identities.
- scenario-brief/service-level-objective: critical-task failure hidden by aggregate compliance and added unrelated successful traffic.
- exam-style-practice/service-level-objective: bounds on joint success when overlap is unknown, and exact evidence needed for a joint target.

Only essentialQuestion, reasoningSteps and labPlan changed. Existing IDs/order and all other lesson fields remain intact. No renderer, navigation, tiles, media, sound, personal credentials/history or deployment changes.

Primary source reread: https://sre.google/workbook/implementing-slos/ sections on measurement implementation/coverage, pipeline correctness and freshness, reporting windows and critical user journeys. All counts, targets and proof exercises are synthetic. No claim of production observations or automatic authority to alter a service is made.

87 focused tests cover all authored Leadership lessons and exact allowed-field scope. Full aggregate results follow. This completes authored practice for existing SLI/SLO lesson IDs only, not the entire Leadership curriculum. Narrow exact-blob manifest verification is used; no redundant full-package build or new deployment approval is claimed.

Prior checkpoint ffcce5c hosted CI: authored companions, validate, interface, Chromium desktop and WebKit desktop passed. WebKit phone failed in run 43377610587/job 131727658226. The verified error list includes a local assets/project-evaluation.json?v=20261109-v1 access-control error as well as the recurring ResizeObserver undelivered-notifications error at tests/media-playback.test.cjs:112. These remain unwaived; neither frozen runtime nor browser assertions were changed.

Full npm aggregate passed: 1,051 curriculum tests plus other Node and Python suites; generated route/source metadata unchanged. All 18 existing SLI/SLO records now have specific questions and six reasoning/lab steps. Narrow committed-blob manifest verification retains 334 paths; only reliability.json changed, now 467,211 bytes, SHA-256 42215c4c036db098ecf9840ca3ea01a086ed90b5e281eacbdd22c88e7ed69b94. Aggregate manifest bytes: 446,031,218. No new full package, merge or deployment.
