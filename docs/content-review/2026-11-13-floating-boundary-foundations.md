# Floating-point boundary foundations

Six generic lessons address nontransitive closeness, binary64 integer spacing, NaN validation, decimal ties, constructor/context distinctions and cancellation reformulation. All other records and fields, including the original six numerical lessons, remain unchanged.

Read official Python math isclose/isnan, built-in round, decimal, and floating-point tutorial documentation. Current documentation describes newer Python releases; fixtures use established operations available in the actual Python 3.13 interpreter, not newer-only APIs. Decimal contexts are local and no host settings change.

Validation: all 8 new cases and 8 existing numerical-methods Node cases pass. Actual Python arithmetic confirms 53-bit radix-two nearest-rounding behavior; no binary64-specific test skipped on AL. The scoped QA tree passes 217 of 219 test_*.py cases with 2 existing staged-package skips, all 62 *_test.py cases and site contract validation. Exact QA content/test/baseline/metadata bytes match the checkout. Four source entries and 18 existing externalDependencies arrays change; 90 routes, 787 external references and zero unresolved HTML references.

All 98 records and every field outside the six declared triples remain exact against the pre-batch baseline. No original test guard needed changes. Decimal contexts are restored after each fixture. Binary64-specific cases explicitly skip on incompatible arithmetic platforms rather than asserting universal hardware behavior. No live/UI changes, full package, merge or deployment. Prior browser-media failures remain unwaived.
