# Completing the existing cascading-failure practice sequence

Seven remaining generic existing cascading-failure lessons now have distinct synthetic exercises:
- deep-dive: offered worker occupancy from a small stalled class versus physically available workers.
- evidence-lab: propagation of one absolute deadline with queue/processing costs and finishing reserves.
- exam-style-practice: aggregate spare capacity versus an overloaded replica and constrained routing.
- field-note: independent process retry budgets growing with process count and integer global-budget allocation.
- explain-back-challenge: a finite positive-feedback retry trace, with attempts explicitly distinguished from unique operations.
- transfer-lab: cancellation propagation saves work but does not roll back side effects.
- configuration-lab: retry count versus a schedule of waits, execution durations and a fixed deadline; jitter is explicitly not omitted as a real-world recommendation.

Only essentialQuestion, reasoningSteps and labPlan changed. Counts and policies are synthetic teaching models, not production measurements or instructions to change real systems. Existing IDs/order and all other lesson fields are preserved. No UI, runtime, audio, solar, game, credentials or career-history changes.

Primary source reread: https://sre.google/sre-book/addressing-cascading-failures/, particularly bimodal latency, retries, deadline propagation and cancellation propagation. The source snapshot hash is recorded in the adjacent cascade/degradation review. Numerical fixtures here are original rather than the source's examples.

100 focused tests passed, including independent calculations, boundaries, counterexamples and exact field scope. Full aggregate results follow. Metadata refresh remains limited to the exact committed lesson blob; no redundant full package or deployment is claimed. The WebKit history-return failure is still unwaived.
