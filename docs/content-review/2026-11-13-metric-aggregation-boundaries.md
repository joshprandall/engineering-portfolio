# Metric aggregation boundaries

Six generic observability lessons now address series identity, cumulative histogram buckets, event-weighted means, non-aggregatable percentiles, absent versus zero, and sample-weighted versus time-weighted averages.

Official Prometheus rendered site returned 403. Read the official source files in prometheus/docs (docs/concepts/data_model.md and docs/practices/histograms.md) and prometheus/prometheus (docs/querying/functions.md) instead. Examples use exact offline arithmetic and declared model boundaries, not a PromQL engine or a live server.

Validation: eight new exact-arithmetic/model/source/scope tests and all five existing observability checks pass. Exact-byte isolated QA: 275 Python test_*.py cases, 273 passed with two existing staged-package-only skips; all 62 *_test.py cases and site contract pass. Full immutable prebatch comparison preserves every non-selected field and record.

The nearest-rank quantile is an explicitly declared raw-sample convention, not a claim about Prometheus histogram interpolation. The absent model omits label inference and selector evaluation. The step-hold average is explicitly a different model from equally weighted selected samples. No PromQL server execution is claimed.

Two new official reference URLs and 18 route dependency arrays changed. Metadata totals: 90 routes, 801 external references, four export units, zero unresolved HTML references.

No UI, live site, credentials, monitoring configuration, alert subscriptions or deployment changes. Known hosted media/audio failures remain unwaived. Current hosted CI unchecked; no fresh browser or staged-package validation is claimed.

Narrow runtime manifest: content commit 5cdf90d896fdbd65ce5772e4fe2e76b1d6385c94; only cloud/observability.json updated, 450588 bytes, SHA256 c68aeb7908439ef92e976c3118b2310ed13e0cc30b726eb4d82cc8ddf8e8e65b. Inventory remains 334 files, 446195381 aggregate bytes. No fresh staged-package validation.
