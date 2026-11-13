# Latency distribution practice

Six generic existing lessons now contain original evidence exercises: mean versus tails, information lost by coarse histogram bins, invalid averaging of regional percentiles, fast failures distorting mixed-population latency, sample-count effects on nearest-rank p99, and explicitly different sample-quantile algorithms.

Every exercise declares its population, units and quantile convention where relevant, states its synthetic boundary, supplies independent checks and counters a plausible wrong inference. Histogram evidence yields ranges rather than invented precision. Sample percentiles are not presented as population confidence guarantees. No vendor-specific quantile implementation is asserted.

Primary source fetched and read: https://sre.google/sre-book/monitoring-distributed-systems/. HTML SHA-256: 3117d94aca6d7422db18b210a4142718388523a4ea2082df539ffe9a8c4c2a75. The chapter supports separating successful/failed latency and inspecting distributions/tails; the numerical arrays, bins and quantile formulas are original mathematical fixtures, not attributed to the source as prescribed algorithms.

106 focused tests pass, including independent arrays, order statistics, compatible histogram counterexamples, arithmetic and exact permitted-field scope. The first test run exposed binary floating-point representation (95.49999999999999 versus mathematical 95.5); only those interpolated-number checks use the existing 1e-12 closeness helper. Integer ranks, counts and scope checks remain exact.

Only essentialQuestion, reasoningSteps and labPlan changed. No runtime, layout, sound, navigation, solar, games, credentials or personal history changed. Full aggregate and narrow committed-blob metadata results follow; no full package or deployment is claimed.
