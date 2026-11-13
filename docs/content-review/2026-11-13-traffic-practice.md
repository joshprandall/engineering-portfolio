# Traffic measurement practice review
Six existing traffic lessons now contain original, bounded exercises: workload mix, unequal time windows, counter resets, offered/admitted/completed traffic, streaming units, and ambiguous demand drops.
Only essentialQuestion, reasoningSteps and labPlan changed. Every other field, record and ordering is tested against the stored baseline.
Primary source reread: https://sre.google/sre-book/monitoring-distributed-systems/ (Traffic, Black-Box Versus White-Box, measurement resolution). Source establishes monitoring concepts; arithmetic and conservation models are explicitly original, not operational measurements.
Review emphasized reset uncertainty, incomplete coverage, cohort versus interval denominators, nominal link capacity versus payload, and offered demand versus observed utilization.
Validation pending. No live/runtime/UI changes or deployment. Prior 476a932 hosted companions passed but Site validation failed; not waived or assumed identical to earlier WebKit failures.
