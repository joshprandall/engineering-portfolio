# SQL parameter boundary foundations

Six generic application-security lessons distinguish bound values from SQL syntax, collection expansion, structural allow-lists, LIKE wildcards, NULL semantics and stored-data reuse. The original 12 authored application-security lessons stay intact.

Read official Python sqlite3 placeholder guidance, SQLite expression rules for LIKE/ESCAPE, NULL/IS, and empty IN lists, and the official OWASP SQL Injection Prevention Cheat Sheet source. Fixtures are defensive and execute only in fresh :memory: SQLite databases with synthetic values.

Validation: all 8 new cases pass using real SQLite in fresh in-memory connections, and all 13 existing application-security Node cases pass unchanged. Scoped QA passes 233 of 235 test_*.py cases with 2 existing staged-package skips, all 62 *_test.py cases and site contract checks. Exact QA content/test/baseline/metadata bytes match checkout. Two source entries and 18 existing externalDependencies arrays change; 90 routes, 790 external references and zero unresolved HTML references.

All 116 records and fields outside six declared teaching triples remain exact; original authored lessons and tests stay unchanged. Full configured local suite passed at the immediately preceding 8a24778 checkpoint; this batch uses scoped validation. No actual external database, filesystem table, credential or application setting is touched. No UI/live changes, merge or deployment.

Read exact prior 84ffd71 hosted failure logs: interface job 131836720199 repeats gain 0.05000000074505806 at output index 3 with muted=true and paused=true, all five DOM media muted/paused; no audible-leak conclusion. Phone job 131836720678 fails the primary error gate with project-evaluation.json access-control wording, not the starvation predicate. Neither establishes a new runtime root cause, and all media failures remain unwaived.

Narrow runtime manifest updates only cyber/application-security.json: 519,218 bytes, SHA256 48a174d40ae1563a6a32f7cde447a4dfafd877e8af0c0357d142b79efe518d93, source commit b5eaf5fe8081d4f5bc425eff39ad7f947af1a45e. All 334 paths retained; aggregate 446,172,252 bytes. No staged-package or release approval claim.
