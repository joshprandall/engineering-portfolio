# Context and generator lifecycle boundaries

Six generic programming lessons now cover entry failure, selective exception suppression, nested unwinding, generator context-manager reraising, explicit generator close and failed as-target assignment. Only essentialQuestion, reasoningSteps and labPlan changed.

Read the official Python with-statement and contextlib documentation, plus Python 3.13 generator close semantics. Current unversioned docs identify Python 3.15; the examples use long-established behavior and are executed on the installed Python runtime. Explicit 3.13 reference avoids assuming the generator-method documentation location is unchanged in newer versions. No external resources are acquired by fixtures.

Validation: eight new actual-runtime/source/scope tests pass on Python 3.13.15. Exact-byte isolated QA ran 299 Python test_*.py cases: 297 passed with two pre-existing staged-package-only skips. All 62 *_test.py cases and the site contract pass. The 17 original Python-foundation cases are included in that result.

The historical foundation scope guard initially rejected six later authored records. Its original 14 records are now explicitly checked unchanged against the immutable pre-batch checkpoint, while its original historical changes remain checked against the original baseline. The new scope test audits all 158 current records and permits exactly three fields in the six selected lessons. All original executable examples and numerical oracles remain unchanged; no failures were hidden.

Two new source URLs and 18 route dependency arrays changed. Metadata totals: 90 routes, 813 external references, four export units, zero unresolved HTML references. Exact-byte content, baselines, tests and generated metadata were compared between checkout and isolated QA.

No visual, live, sound, game, credentials, personal-history or deployment changes. This is scoped content verification, not a new browser/device or staged-package release pass. Last full configured local suite passed at ed5c579; hosted media/audio failures remain unwaived and current hosted CI is unchecked.
