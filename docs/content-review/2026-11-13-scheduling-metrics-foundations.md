# Scheduling metrics foundations

Six existing generic OS lesson triples replaced with explicit oracle/synthetic traces. All 106 records and all other fields preserved against an immutable baseline, including 12 previously authored OS lessons.

Source read: official OSTEP cpu-sched.pdf, sections 7.1-7.7, retrieved directly (118326 bytes) and text-extracted via Firecrawl. Its prose definitions and assumptions were checked; equations with extraction artifacts were not copied. Independent arithmetic and traces below are executable teaching models, not host benchmarks or Linux policy claims.

Validation: 8 new exact-arithmetic/trace tests pass, plus all 13 existing OS state-trace tests. The scoped QA tree passes 193 of 195 test_*.py cases with 2 existing staged-package skips, all 62 *_test.py cases, and site contract validation. No new skip. Content/test/baseline/metadata bytes match the checkout. Exactly one new source entry and 18 externalDependencies arrays change; 90 routes, 773 external references, and zero unresolved HTML references. No route structure or protected visual/runtime code changes. Runtime metadata is updated narrowly after committing the content; no full package, merge, or live deployment. Prior hosted media failures remain unwaived.
