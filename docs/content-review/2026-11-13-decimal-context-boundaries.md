# Decimal context boundaries

Four numerical lessons cover exact construction versus arithmetic precision, explicit tie rules, Rounded versus Inexact and sticky flags, and nested local context restoration after exceptions. Read official Python3.13 decimal documentation. Tests use actual Decimal with explicit isolated contexts and text inputs, not financial data or globally modified settings.

Validation: six new source/scope/actual Decimal tests pass. All 441 Python test_*.py cases ran: 439 passed and two existing staged-package-only cases skipped. All 62 configured Python cases and site checks pass.

Scope audit covers all 98 numerical-methods records, permitting only three approved fields in four selected lessons. The six original floating-point records remain identical to the immutable pre-batch checkpoint; all original binary64 boundary, cancellation, NaN and closeness oracles remain unchanged and pass.

Original JSON formatting and exact isolated QA bytes preserved. One official source and 18 route dependency arrays changed: 90 routes, 849 external references, four export units, zero unresolved HTML references. Explicit local contexts isolate precision, rounding and flags; original active context identity is verified after the exception-path fixture.

No live UI, runtime behavior, audio, games, navigation, personal history or credentials changed. No merge or deployment. Hosted media failures remain unwaived. No fresh full-package, full-suite or physical-device validation is claimed; prior full configured suite passed at0444a12 in85.467seconds.
