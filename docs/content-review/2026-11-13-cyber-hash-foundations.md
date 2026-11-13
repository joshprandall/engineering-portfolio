# Hash and authentication foundations

Six existing lessons distinguish digest bytes, text encodings, chunk boundaries, Base64, keyed authentication and trusted reference digests. Only three authorized fields changed. Direct official Python hashlib/hmac/base64 documentation and RFC4231 vectors reviewed; use stable APIs available in Python3.13, not new3.15-only options visible in current docs. Public fixture keys only, no accounts or real credentials.

Validation: all 8 new public-fixture and scope tests pass. Full npm run completed successfully: 1,139 curriculum Node tests, 91 passed plus 2 explicitly skipped out of 93 test_*.py cases, all 62 *_test.py cases and the other configured suites. The two pre-existing runtime-builder tests require a staged package and are not claimed as passed. Final source/test/baseline/metadata QA bytes match checkout.

Four new source URLs; only externalDependencies changed on 18 existing routes. Narrow runtime manifest update changes only cyber/foundations.json: 404,993 bytes; SHA256 fe1cf8f40f10657ce9a560c324424b035d586d0073ae6032ec43102c074630f5. All 334 runtime paths retained; aggregate 446,114,574 bytes. No full release package regenerated.

Hosted predecessor cebc944: companions, validate, interface, Chromium and desktop WebKit passed. Phone WebKit job131785627571 failed the unchanged empty-errors assertion at media-playback.test.cjs:114 with ResizeObserver undelivered notifications. Previous green run did not eliminate the intermittent failure; no runtime fix, assertion change or release waiver is claimed. No UI/live/deploy changes.
