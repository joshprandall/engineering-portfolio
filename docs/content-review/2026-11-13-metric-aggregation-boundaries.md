# Metric aggregation boundaries

Six generic observability lessons now address series identity, cumulative histogram buckets, event-weighted means, non-aggregatable percentiles, absent versus zero, and sample-weighted versus time-weighted averages.

Official Prometheus rendered site returned 403. Read the official source files in prometheus/docs (docs/concepts/data_model.md and docs/practices/histograms.md) and prometheus/prometheus (docs/querying/functions.md) instead. Examples use exact offline arithmetic and declared model boundaries, not a PromQL engine or a live server.

Validation: eight new exact-arithmetic/model/source/scope tests and all five existing observability checks pass. Exact-byte isolated QA: 275 Python test_*.py cases, 273 passed with two existing staged-package-only skips; all 62 *_test.py cases and site contract pass. Full immutable prebatch comparison preserves every non-selected field and record.

The nearest-rank quantile is an explicitly declared raw-sample convention, not a claim about Prometheus histogram interpolation. The absent model omits label inference and selector evaluation. The step-hold average is explicitly a different model from equally weighted selected samples. No PromQL server execution is claimed.

Two new official reference URLs and 18 route dependency arrays changed. Metadata totals: 90 routes, 801 external references, four export units, zero unresolved HTML references.

No UI, live site, credentials, monitoring configuration, alert subscriptions or deployment changes. Known hosted media/audio failures remain unwaived. Current hosted CI unchecked; no fresh browser or staged-package validation is claimed.
