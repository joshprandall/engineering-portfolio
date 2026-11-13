# Preserve browser gates and improve failure evidence

Repeated WebKit reports contain ResizeObserver undelivered-notifications errors; one phone run also reported access-control failure for local project-evaluation.json. Previous reports stored only error messages, without phase, page URL, stack, console source location or request failure reason. Their cause is not yet established. A ResizeObserver writing header height exists in frozen site-navigation.js, but that observation alone does not prove causality.

Test-only changes add passive event diagnostics with named phases for navigation, controls, media, viewport resizing and the iPhone callback-starvation probe. Local failed requests and HTTP errors retain URLs and failure/status details; console errors retain locations; page errors retain stacks. Remote requests intentionally aborted by the harness are not recorded as local failures.

The original primary-page error list and both final assertions are preserved exactly. Diagnostics are capped at 200 entries with an explicit dropped count; the original error gate is never truncated. Secondary probe-page errors are diagnostic-only, preserving the existing test's gate scope rather than silently adding or removing failure policy. No page APIs, errors or exceptions are intercepted or suppressed.

Six offline unit tests pass for phase attribution, stack/location retention, local versus external requests, HTTP status filtering, bounded storage without gate truncation, attachment idempotence and secondary-page scope. Syntax check passed for the instrumented media test. The unit suite is wired into npm test. Full aggregate and hosted browser results are reported separately; diagnostics alone are not a fix or proof of a passing browser.

No runtime asset, UI, appearance, sound, navigation, curriculum data or runtime manifest changed. No package regeneration or deployment.

Phase labels record the harness phase when an event arrives, not proof that the immediately preceding action caused it. Error stacks and request reasons can still be empty when the browser does not supply them. A source comparison verified the final gate and cleanup block remains unchanged apart from checkout newline conventions.

Full npm aggregate passed with the new six diagnostic unit tests and all existing suites, including 1,051 curriculum tests. Generated manifests remained unchanged. No local browser run was performed for this test-only instrumentation; hosted real-browser execution is the pending integration check.
