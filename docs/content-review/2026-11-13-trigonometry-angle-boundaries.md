# Trigonometry angle boundaries

Six generic lessons now distinguish radian arc length from degrees and chord length, terminal direction from travel distance, scaled coordinates from unit-circle coordinates, sine solution families from a principal value, atan2 quadrant handling, and angular speed from tangential speed. Only three approved lesson fields changed.

Read OpenStax Precalculus 2e sections 5.1 and 5.2 plus official Python math documentation. Offline fixtures apply the cited definitions; the atan2 equal-coordinate example also appears in the Python documentation and is extended here with four quadrants, an axis, unequal-coordinate argument order, and zero-vector domain handling.

Validation: eight new exact-scope/source and numerical tests pass, plus nine existing cross-domain Node cases, including the original trigonometry oracle. Exact-byte isolated QA ran 307 Python test_*.py cases: 305 passed with two existing staged-package-only skips. All 62 *_test.py cases and site checks pass. No existing test was modified.

The new immutable-baseline test checks all 97 records and permits only essentialQuestion, reasoningSteps and labPlan in the six selected records. Fraction arithmetic checks normalized coordinates and revolution conversion; independent geometry checks arc/chord length and circumference/period speeds; tolerance-aware trigonometric comparisons avoid asserting exact floating-point zeros.

Three new source URLs and 18 route dependency arrays changed. Metadata totals: 90 routes, 816 external references, four export units, zero unresolved HTML references. Exact-byte content, baseline, test and generated metadata matched the isolated QA tree.

No UI, live, audio, game, personal-history, credential or deployment changes. Scoped content validation is not a new browser/device or staged-package release pass. Last full configured local suite passed at ed5c579; hosted media/audio failures remain unwaived and current hosted CI is unchecked.
