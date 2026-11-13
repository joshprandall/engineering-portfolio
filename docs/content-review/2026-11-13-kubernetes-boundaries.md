# Kubernetes semantic boundaries

Six generic lessons now distinguish headless DNS answer sets, named target-port mapping, credential-automount precedence, combined required label constraints, raw preference scores and execution-time label changes. Existing ten authored lessons stay unchanged.

Read official Kubernetes DNS, Service, node assignment and ServiceAccount configuration documentation. Tests are deliberately bounded offline models, not Kubernetes client or cluster integration tests. No tokens, connections or cluster changes.

Validation: 8 new model/scope/source tests and 11 existing Kubernetes Node tests pass. Exact-byte isolated QA: 251 Python test_*.py cases, 249 passed with two existing staged-package-only skips; all 62 *_test.py cases and site contract pass. Unchanged IDs and all non-selected fields are checked against an immutable baseline. These tests validate lesson fixtures, not a full Kubernetes implementation.

One new official reference and 18 route external-dependency arrays changed. Metadata totals: 90 routes, 795 external references, four export units, zero unresolved HTML references.

Read exact hosted failures at preceding 9ddbadd: Site run 43414606440, desktop WebKit job 131849214805 failed the unchanged page-error gate (media-playback line 116) on ResizeObserver loop completed with undelivered notifications. Phone job 131849214826 failed the starvation-probe wait at line 112 after 30000 ms. Interface, Chromium and validate passed; companion run 43414606511 passed.

Downloaded phone artifact 14030728875 and read media-playback.json. The new passive post-failure snapshot reports activeVideo=true, timelineAdvanced=false, playing=false, posterReady=false, time=0.001103782, paused=true, readyState=4, networkState=1, mediaErrorCode=null, document complete and visible. Thus this sample was paused near zero, not merely missing a poster-ready class while its timeline advanced. All three primary scenes showed decoded and sustained motion; errors and failedLocalRequests arrays were empty. Snapshot timing is after failure and does not establish what caused the pause or the full state history. Runtime root cause remains unproven; failures are not waived.

No live, UI, runtime media, credential, cluster or deployment changes. No assertion or timeout relaxation. Current hosted CI unchecked; no full package or browser suite claim for this content batch.

Narrow runtime manifest: content commit 25ffbedce12e739a0f8ccd44282504e7cf81dedc; only kubernetes.json updated, 445350 bytes, SHA256 87925ea4255ed286dc0233ac6f6a4436057c0e20f5ce043d5274855d205bdd21. Inventory remains 334 files and 446181906 aggregate bytes. No new staged-package validation.
