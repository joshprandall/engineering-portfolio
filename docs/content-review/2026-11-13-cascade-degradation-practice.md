# Cascading failure and graceful degradation practice

Six previously generic existing Reliability lessons now teach distinct synthetic models:
- design-review/cascading-failure: nested retry multiplication, a single retry owner and the scope of an aggregate retry budget.
- troubleshooting-lab/cascading-failure: fluid queue conservation, retained memory, deadlines and backlog drain.
- failure-analysis-lab/cascading-failure: health-check symptoms, ejection and loss of spare capacity.
- failure-analysis-lab/graceful-degradation: cache misses overwhelming a shared fallback dependency, exact capacity boundary and safe degradation constraints.
- worked-walkthrough/graceful-degradation: CPU-work cost of mixed response quality, integer feasibility and omitted-resource caveats.
- measurement-lab/cascading-failure: raw attempts versus distinct timely user outcomes and counterfactual useful-work comparison.

Only essentialQuestion, reasoningSteps and labPlan changed. All counts and targets are invented teaching fixtures, not measured results or real operational instructions. No personal-history, protected runtime, layout, navigation, media or game changes.

Primary source fetched and read: https://sre.google/sre-book/addressing-cascading-failures/. HTML SHA-256: d67024d52d72a1254c830d3c29e6d1b2afade88e133ffcff64b94711c2aaa11a. Relevant material covers resource starvation, queues, retry amplification/budgets, deadlines, cache-related load growth and tested degraded modes. Lessons derive their own counts rather than reproducing the book's numerical examples.

93 focused tests passed: independent arithmetic and counterexamples plus exact authored-field scope against the stored baseline. Full aggregate result follows. Runtime metadata uses a narrow exact-committed-blob update, not a redundant full-package build. The existing WebKit history-return failure remains unwaived; the adjacent evidence report is bundled with this substantive checkpoint rather than triggering a separate docs-only CI run.

Full npm aggregate passed: 1,057 curriculum tests plus all other suites. Metadata generation added exactly one existing-source consumer: reliability.json for the already-listed cascading-failures chapter (four lines); no new routes or source URLs. That generated change is included. The narrow committed-blob refresh preserves all 334 runtime paths and changes only reliability.json: 474,386 bytes, SHA-256 b629eb7237f27619b3ebb9075748b34452c129b740cb797ea3e339b3c9c539fb. Aggregate manifest size is 446,038,393 bytes. No new full-package build or browser pass is claimed.
