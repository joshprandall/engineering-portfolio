# Probability evidence review

Eight existing v08 lessons now cover conditional denominators, sampling dependence, random-variable mappings, expectation, and variance with exact finite examples. Only essentialQuestion, reasoningSteps, and labPlan changed. All earlier authored probability records are preserved.

Sources: OpenStax Introductory Statistics 2e sections 3.2, 3.3, and 4.2 read directly on 2026-11-13, including multiplication/conditional rules, independence distinction, weighted mean and squared-deviation table. Synthetic numbers and algebra are independently checked with Fraction/enumeration; no empirical inference or production claim.

Validation: all 10 new exact-fixture/scope tests passed. Full npm test passed (1,139 curriculum Node tests, 69 test_*.py cases, and all other configured suites). After separating source URL punctuation, reran the 10 new tests, 8 existing probability tests, site contract validation and deterministic metadata regeneration successfully against the final bytes. QA source/test/baseline/metadata bytes match checkout. Only one new source URL and its entries on 18 existing routes were generated; no route identities or runtime behavior changed.

The narrow runtime manifest update covers only the committed probability JSON blob (445,918 bytes; SHA256 f08856aecf137913faa59213fd56721fe1b765d163a925cd4d950199efa7b4c5), preserving 334 paths; aggregate 446,102,855 bytes. No new full package was generated.

Hosted predecessor dabd242: companions, validate, interface, Chromium and desktop WebKit passed. Phone WebKit job 131773677819 failed the unchanged empty-errors assertion at media-playback.test.cjs:114 with project-evaluation access-control text and ResizeObserver undelivered notifications. This remains an unwaived release blocker, not evidence that these prose changes broke or repaired media. No live UI, route identity, game, audio, credential, education, or job-history edits; no merge/deploy.
