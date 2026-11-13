# Retry outcome boundaries

Four generic replication-tradeoff lessons now distinguish timeout observations from mutation outcomes, operation identity from payload equality, atomic deduplication boundaries, and multiplicative retry load. Only three approved lesson fields change.

Read AWS Builders Library articles Timeouts, retries, and backoff with jitter and Making retries safe with idempotent APIs. The local examples make their assumptions explicit and do not claim to implement Raft or guarantee distributed exactly-once execution.

Validation: six new source/scope and executable tests pass, plus all 18 existing consensus/causality Node cases. Exact-byte isolated QA ran 337 Python test_*.py cases: 335 passed with two existing staged-package-only skips. All 62 *_test.py cases and site checks pass. No existing test changed.

The immutable baseline audits all 108 records and permits only three fields in the selected four. Tests cover indistinguishable timeout observations, token/payload/caller distinctions, a real SQLite :memory: transaction with pre-commit fault injection and rollback, and recursively counted attempt amplification. The database fixture makes no external calls and does not model concurrent distributed execution.

Two new source URLs and 18 route dependency arrays changed. Metadata totals: 90 routes, 828 external references, four export units, zero unresolved HTML references. Exact bytes matched across checkout and isolated QA.

No UI/live/audio/game/personal-history/credential changes or deployment. Last full configured local suite passed for be1e944 content in 83.12 seconds; this batch used scoped checks. Hosted media/audio failures remain unwaived and current hosted CI is unchecked.
