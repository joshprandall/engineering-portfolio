# Traffic measurement practice review
Six existing traffic lessons now contain original, bounded exercises: workload mix, unequal time windows, counter resets, offered/admitted/completed traffic, streaming units, and ambiguous demand drops.
Only essentialQuestion, reasoningSteps and labPlan changed. Every other field, record and ordering is tested against the stored baseline.
Primary source reread: https://sre.google/sre-book/monitoring-distributed-systems/ (Traffic, Black-Box Versus White-Box, measurement resolution). Source establishes monitoring concepts; arithmetic and conservation models are explicitly original, not operational measurements.
Review emphasized reset uncertainty, incomplete coverage, cohort versus interval denominators, nominal link capacity versus payload, and offered demand versus observed utilization.
Validation completed below. No live/runtime/UI changes or deployment. Prior 476a932 hosted companions passed but Site validation failed; not waived or assumed identical to earlier WebKit failures.

Hosted prior-head evidence: run 43383136916 validate, interface and Chromium passed. WebKit desktop job 131745333459 failed the unchanged empty-errors assertion with ResizeObserver loop completed with undelivered notifications (media-playback:114); phone job 131745333587 timed out after 30 seconds at the frame-callback probe (line110). Both verified all three normal day-motion samples before failure. Artifacts 14017178868 and 14017890955 remain available; logs checked, artifact phase details not inspected in this batch. No gate waived.

Focused tests: 118/118 pass, including exact three-field scope across all baseline records and independent unit/conservation arithmetic. Narrow runtime manifest refresh uses committed lesson blob at 3d17d10f414ccdc843b1e472da97ecf608cff59d: 496056 bytes, SHA256 a0ef1b956ee38994ca12e3bd9b4e7a84ee210aa55cf902efe6dc6d32b446b517. Only that one runtime entry changed; 334 paths retained; aggregate 446060063 bytes. No full package rebuild claimed. Metadata generation: 90 routes, 718 external references, zero unresolved HTML references; no source/route diff.

Full npm test passed in the isolated exact-byte QA tree: 1082 curriculum tests, plus all other configured Node and Python suites. Generated metadata has no diff. No merge, deployment or protected visual/runtime edits.
