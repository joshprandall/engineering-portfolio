# Electrostatic and circuit boundary conditions

Six generic lessons now contrast fixed-charge and fixed-voltage dielectric insertion, RC charge-sharing energy, scalar potential versus vector field, and loaded terminal voltage with internal power loss. Only three approved fields change.

Read official OpenStax University Physics Volume 2 sections 7.3, 7.4, 8.3, 8.5 and 10.1. A guessed 7.3 URL returned 404; the correct calculations-of-electric-potential page was discovered from 7.4 and read before use. All examples are offline ideal-model exercises, not instructions to energize or short physical hardware.

Validation: eight new exact-rational/source/scope tests pass, plus 62 existing electricity Node cases. Exact-byte isolated QA ran 315 Python test_*.py cases: 313 passed with two existing staged-package-only skips. All 62 *_test.py cases and site checks pass. No existing test was changed. An initial new-test text assertion looked for a lab value in the reasoning array; it was corrected to check the actual lab field, while every numerical assertion stayed unchanged.

The new immutable-baseline test audits all 112 records and permits only three fields in the selected six. Independent checks include RC dissipation integrated over time at three positive resistances, exact source/load/internal power balance, scalar/vector superposition and a finite-difference potential-gradient cross-check. Synthetic k is explicitly rounded, not claimed as an exact physical constant.

Three new source URLs and 18 route dependency arrays changed. Metadata totals: 90 routes, 819 external references, four export units, zero unresolved HTML references. Exact-byte content, baseline, test and metadata matched isolated QA.

No visual/live/audio/game/personal-history/credential changes or deployment. This scoped pass is not a new browser/device or staged-package release pass. After the scoped checks, the complete configured local suite ran successfully against this batch in the exact-byte QA tree: node tools/run-tests.cjs exited 0 in 83.1237338 seconds, including all 1,139 curriculum Node cases and all 62 configured Python cases, plus the other configured site/security/scene/audio/game checks. The separately run 315-case Python suite is reported above. This is not hosted browser or physical-device validation; hosted media/audio failures remain unwaived.


Hosted evidence for preceding checkpoint f495413: Site validation run 43422105300 failed only desktop WebKit job 131874360148. Exact log reports ResizeObserver loop completed with undelivered notifications at the existing media-playback.test.cjs:116 gate. Validate, interface, Chromium desktop and phone WebKit passed; companion run 43422105274 passed. This is a sampled failure observation, not a root-cause diagnosis or release waiver. Current be1e944 hosted result was not inspected.
