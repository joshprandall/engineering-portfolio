# Broader coverage review and Python foundations
At source2947ea2, all seven domains contain8000 lesson records;7031 match the exact canned first reasoning step and7034 match the generic question prefix. These are candidate indicators, not a correctness grade or proof that all other records are fully authored. Per-domain evidence is preserved in the companion JSON.
Software/programming had158/158 canned reasoning candidates. This batch authors six foundational existing records with actual executable Python semantics: shallow aliases, dictionary ordering/views, set hashability, exception precedence, context suppression and iterator exhaustion.
Official sources read directly: https://docs.python.org/3/library/stdtypes.html and https://docs.python.org/3/reference/compound_stmts.html. Examples are original. Only three authorized fields change; the entire prior programming chunk is pinned in a compressed baseline for exact scope comparison.
Validation completed below. No runtime/UI/live changes, merge or deployment.

Eight focused Python tests passed on Python3.13.15: six executable semantic examples, exact158-record/three-field baseline scope, and structure/source checks. Tests execute authored fixtures, never evaluate lesson text. The existing npm runner automatically discovers this test via test_*.py; no runner change required.

Scoped runtime blob64d5ee0fc55b723ec0107755d40758b07d602e00:programming608821 bytes,SHA256aad4760d1ef8520aeb9b1a2859144be9bbb099f557df29a6292350cc521734d4;334paths retained,aggregate446094319 bytes. No full package rebuild. Metadata adds programming as consumer of existing standard-types URL and new compound-statement URL, plus that dependency in18 existing route entries;90 route identities,720 external references,zero unresolved HTML references.

Prior2947ea2 authored companions43389083696 passed;Site validation43389083771 failed. This batch does not waive or repair browser release failures.

Full npm test passed:1139 existing curriculum Node tests plus all other configured suites;Python test_*.py suite increased from32 to40 with the eight new semantic/scope tests. All passed. Generated source/route metadata agrees byte-for-byte with the isolated QA tree. No whole-curriculum completion claim.
