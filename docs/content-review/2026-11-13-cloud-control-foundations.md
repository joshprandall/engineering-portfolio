# Cloud control foundations

Six existing cloud lessons now use scoped offline arithmetic/state examples: resource units, scheduling filters, probe thresholds, HPA base formula, PDB rounding and reconciliation. Only the three authorized lesson fields changed. Official Kubernetes pages read directly on 2026-11-13. These are deliberately incomplete pedagogical models, not cluster integration tests or production recommendations.

Validation: all 8 new tests pass, as do 11 existing Kubernetes content tests, site contract validation, all 62 *_test.py tests and 83 of 85 discovered test_*.py cases. Two existing runtime-package tests explicitly skip because a staged package was not generated; no claim that these passed. Metadata regeneration is deterministic and final source/test/baseline/metadata QA bytes match checkout. Used narrow verification instead of a redundant full Node/dependency scan while concurrent Crown work used the machine.

Three new source URLs and three added consumers; only externalDependencies changed on 18 existing routes. Narrow runtime manifest update changes only cloud/cloud.json: 735,378 bytes; SHA256 2394bf0b9703e0343e7e1d997e20fb6af6891212c89f856a9d2858a7c39f1fd0. All 334 runtime paths retained; aggregate 446,110,484 bytes. No full release package or live cluster execution.

Hosted predecessor ff88f43 passed both Authored content companions (43394687591) and Site validation (43394687629). This passing run does not prove earlier intermittent audio/media errors are fixed. The residual-gain failure evidence from dc17d95 remains recorded and no assertion or release gate was relaxed. No live/UI/deploy changes.
