# HTTP conditional and status boundaries

Six generic lesson triples now cover validator strength, method-dependent conditional outcomes, range bounds, asynchronous acceptance, method support signals, and cache storage versus validation. All examples are offline declared models, not full parsers or real endpoint probes.

Directly retrieved official RFC 9110 sections 13.1.1, 13.1.2, 14.1.2, 15.3.3, 15.5.6, 15.6.2 and RFC 9111 sections 5.2.2.4-5.2.2.5. Normative exceptions remain explicit rather than hidden in a simplified boolean.

Validation: all 8 new matrix/boundary/scope cases pass. The scoped QA tree passes 209 of 211 test_*.py cases with 2 existing staged-package skips, all 62 *_test.py cases including the original HTTP protocol exercises, and site contract validation. Content/test/baseline/metadata bytes match the checkout. Exactly six source references and 18 route externalDependencies arrays are added; 90 routes, 783 external references, and zero unresolved HTML references.

The historical 24-lesson HTTP audit now uses the immutable pre-batch checkpoint for its original 72-field-change proof, while asserting every original authored record still equals the current record. The new scope test checks all 131 current records and permits exactly six new three-field changes. No original numerical exercise or normative claim test was removed.

No real network requests are issued by tests, no resource/cache/security setting is altered, and no runtime/UI code is modified. No full package, merge or deployment. Previous intermittent browser-media failures remain unwaived.
