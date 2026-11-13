# Unit-test lifecycle boundaries

Four lessons cover registered cleanup after setup failure, teardown and LIFO cleanup ordering, preserved subtest failures, and narrow exception attribution. Official Python3.13 unittest documentation checked. Deliberately failing nested synthetic fixtures produce private TestResults whose failures/errors are explicitly asserted; this does not modify the real suite result or release gates.

Validation: six new source/scope/framework tests pass. All 417 Python test_*.py cases ran: 415 passed and two existing staged-package-only cases skipped. All 62 configured Python cases and site checks pass.

Scope audit covers all 109 testing records, allowing only three approved fields in four selected lessons. The six previously authored mock-contract records remain identical to the immutable pre-batch checkpoint; every original mock behavior assertion remains unchanged and passes.

Original JSON formatting and exact isolated QA bytes preserved. One official source and 18 route dependency arrays changed: 90 routes, 843 external references, four export units, zero unresolved HTML references. Deliberate nested failures/errors remain unsuccessful in their private TestResults, and the outer tests verify those results. No real suite assertion, timeout, error collection or release failure was suppressed.

No live UI, runtime behavior, audio, games, navigation, personal history or credentials changed. No merge or deployment. Hosted media failures remain unwaived. No fresh full-package, full-suite or physical-device validation is claimed; prior full configured suite passed at2b29097 in84.69seconds.
