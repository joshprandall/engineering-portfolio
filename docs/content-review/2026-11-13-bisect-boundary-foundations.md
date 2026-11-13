# Bisection boundary foundations

Six generic algorithm lessons cover insertion versus membership, duplicate blocks, inclusive value ranges, key-domain contracts, insertion movement costs and sortedness invariants. Existing 24 authored algorithm lessons remain untouched.

Official Python bisect documentation read directly, including left/right partition contracts, key behavior, performance notes and concurrent mutation warning. The actual standard library executes the fixtures; no benchmark or production concurrency claim.

Validation: 8 new tests pass against real Python bisect and independent linear oracles, including 55 ordered value-interval pairs. All 76 existing algorithm Node checks pass without changes. Scoped QA passes 225 of 227 test_*.py cases with 2 existing staged-package skips, all 62 *_test.py cases, and site contract validation. Exact QA content/test/baseline/metadata bytes match checkout. One source entry and 18 existing externalDependencies arrays change; 90 routes, 788 external references, zero unresolved HTML references.

All 111 records and every field outside six declared question/reasoning/lab triples remain exact against the immutable baseline. No previous test guard changed. No UI/live changes, merge or deployment; old hosted media failures remain unwaived. The full configured local suite then passed with exit 0 in 82.36 seconds: all 1139 configured curriculum Node tests and 62 additional Python tests pass, alongside its other configured site/security/audio/scenes/learning checks. Scoped Python totals above were independently verified. The latest inspected hosted Site validation at prior head 84ffd71 failed (run 43410888463), while companions passed (43410888449); its job-level cause has not yet been read, so no new failure attribution is made.

Narrow runtime manifest updates only software/algorithms.json: 452,329 bytes, SHA256 b5abc73f5c0c89c7bc091c87f37ba58a89f3eb56ec7da191324d1a2f36c3e414, source commit 9cecf3076090db6fd0a5f764ac04357553df10b4. All 334 paths retained; aggregate 446,167,697 bytes. No staged-package or deployment approval claim.
