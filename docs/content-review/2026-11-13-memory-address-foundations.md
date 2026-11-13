# Memory address foundations

Eight existing lessons now distinguish address-space mappings, TLB misses, page-table indexing, fault causes, huge-page arithmetic, cache-line boundaries and false sharing. Only three authorized fields changed. Official Linux page-table, HugeTLB, false-sharing and TLB-maintenance documentation read directly. All page sizes, capacities, LRU policy and address traces explicitly synthetic; no real memory access or kernel configuration.

Validation: 10 new model/scope tests passed, along with 22 neighboring hardware/OS content tests, site contract validation, deterministic metadata regeneration, all 62 *_test.py cases and 111 of 113 test_*.py cases. Two existing staged-package cases explicitly skipped; no claim that these passed. Models test integer mappings and explicit scenario tables, not actual TLB replacement, kernel fault handling or measured speed. No redundant full Node scan while Crown used the machine.

Final QA source/test/baseline/metadata bytes match checkout. Two new source URLs and one added source consumer changed only externalDependencies on 18 existing routes. Narrow runtime manifest update changes only advanced/memory.json: 606,213 bytes; SHA256 b3cc89f0ef210d9e570bafa7a4f993272020719bc740b6856f8e8f88c70890c1. All 334 paths retained; aggregate 446,123,724 bytes. No full release package.

Hosted predecessor16e8761: Authored content companions43397525946 passed; Site validation43397525809 failed. Failure logs for that run were not diagnosed in this batch, so no specific new cause is claimed. Previously verified browser failures remain unwaived; no runtime or assertion edits. No UI/live/deploy changes.
