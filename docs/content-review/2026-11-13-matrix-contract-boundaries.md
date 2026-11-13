# Matrix contract boundaries

Six generic linear-algebra lessons now cover rectangular one-sided inverses, composition order, reverse-order product inverses, singular-system consistency, rank-nullity and determinant row operations. Existing authored cases remain unchanged.

Read Dan Margalit and Joseph Rabinoff, Interactive Linear Algebra, hosted at Georgia Tech: matrix multiplication, matrix inverses, systems of equations, rank theorem and determinant properties. Numerical fixtures are original exact rational examples, not copied worked exercises.

Validation: eight new exact-rational/source/scope tests and 16 existing linear-algebra/cross-domain Node tests pass. Exact-byte isolated QA: 291 Python test_*.py cases, 289 passed with two existing staged-package-only skips; all 62 *_test.py cases and site contract pass.

The old cross-domain historical scope test initially rejected the newly authored records because it assumed all later non-original records stayed untouched forever. Extended its existing immutable-checkpoint map by one entry for linear-algebra. The original eight authored records remain exact against the checkpoint, all original historical differences remain audited, and the new Python test checks all 135 current records with only the selected three fields in six records permitted to differ. All original numerical oracles remain unchanged. This is not a browser/media failure waiver.

Five new official source URLs and 18 route dependency arrays changed. Metadata totals: 90 routes, 811 external references, four export units, zero unresolved HTML references.

No UI, live runtime, audio, game, credentials or deployment changes. The previous ed5c579 content had a full configured local suite pass; this batch used scoped verification. Known hosted media/audio failures remain unwaived. Current hosted CI unchecked; no fresh browser or staged-package validation claimed.

Narrow runtime manifest: content commit 80b5e67abd79bd4567148f211e9d49d45330c2d8; only math/linear-algebra.json updated, 534656 bytes, SHA256 d8c1b192195a017918d886c555dec41c64c7755001433de7fe7a4e2428cb3aca. Inventory remains 334 files, 446203066 aggregate bytes. No fresh staged-package validation.
