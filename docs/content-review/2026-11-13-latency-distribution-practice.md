# Latency distribution practice

Six generic existing lessons now contain original evidence exercises: mean versus tails, information lost by coarse histogram bins, invalid averaging of regional percentiles, fast failures distorting mixed-population latency, sample-count effects on nearest-rank p99, and explicitly different sample-quantile algorithms.

Every exercise declares its population, units and quantile convention where relevant, states its synthetic boundary, supplies independent checks and counters a plausible wrong inference. Histogram evidence yields ranges rather than invented precision. Sample percentiles are not presented as population confidence guarantees. No vendor-specific quantile implementation is asserted.

Primary source fetched and read: https://sre.google/sre-book/monitoring-distributed-systems/. HTML SHA-256: 3117d94aca6d7422db18b210a4142718388523a4ea2082df539ffe9a8c4c2a75. The chapter supports separating successful/failed latency and inspecting distributions/tails; the numerical arrays, bins and quantile formulas are original mathematical fixtures, not attributed to the source as prescribed algorithms.

106 focused tests pass, including independent arrays, order statistics, compatible histogram counterexamples, arithmetic and exact permitted-field scope. The first test run exposed binary floating-point representation (95.49999999999999 versus mathematical 95.5); only those interpolated-number checks use the existing 1e-12 closeness helper. Integer ranks, counts and scope checks remain exact.

Only essentialQuestion, reasoningSteps and labPlan changed. No runtime, layout, sound, navigation, solar, games, credentials or personal history changed. Full aggregate and narrow committed-blob metadata results follow; no full package or deployment is claimed.

Full npm aggregate passed: 1,070 curriculum tests plus the other Node and Python suites. Existing route/source metadata was unchanged. Narrow manifest verification preserves 334 paths and changes only reliability.json: 486,204 bytes, SHA-256 b622449b630a719caca7e336afcc893890f03351994f78ca16c375e13147b883; aggregate manifest size 446,050,211 bytes. Previous checkpoint f327f02 passed both hosted workflows including browser gates (Site validation run 43381409861), without claiming the earlier intermittent issue repaired. No deployment or full-package regeneration.
