# CUDA indexing and transaction boundaries

Four generic GPU lessons now cover rounded grid guards, x-fast block linearization, aligned transaction segments and within-warp decision mixing. Only three approved lesson fields change.

Read official NVIDIA CUDA C++ Programming Guide 12.6 archive for exact thread hierarchy and warp definitions, and current CUDA Best Practices Guide for compute-capability-6.0-or-higher 32-byte coalescing examples and control-flow caveats. The unversioned programming-guide landing page did not expose the needed text; the explicit archive was read instead. No CUDA toolchain, GPU kernel or profiler was run.

Validation: six new source/scope/model tests and all 13 existing GPU-execution Node cases pass. Exact-byte isolated QA ran 343 Python test_*.py cases: 341 passed with two existing staged-package-only skips. All 62 *_test.py cases and site checks pass. No existing test changed.

The immutable baseline audits all 92 records and permits only three fields in the selected four. Enumeration checks launch coverage across boundary sizes, bijective block linearization, per-byte unique segment footprints and lane predicate counts. These are CPU-side models, not GPU execution, memory-traffic measurements or performance benchmarks. No CUDA install, compilation or kernel launch occurred.

Two new source URLs and 18 route dependency arrays changed. Metadata totals: 90 routes, 830 external references, four export units, zero unresolved HTML references. Exact bytes matched across checkout and isolated QA.

No UI/live/audio/game/personal-history/credential changes or deployment. Last full configured local suite passed for be1e944 content in 83.12 seconds; this batch used scoped checks. Hosted media/audio failures remain unwaived and current hosted CI is unchecked.
