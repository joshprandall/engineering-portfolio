# Bash shell foundations

Six existing Linux lessons now distinguish command status, pipefail, conditional lists, argument quoting, command substitution and descriptor redirection. Only three authorized fields changed. GNU Bash manual sections read directly. Tests run isolated Bash processes without startup files; redirection uses temporary directories only. No settings or permissions changed.

Validation: 8 new tests passed using GNU Bash 5.3.15 on Git for Windows. All 129 of 131 discovered test_*.py cases passed; 2 existing staged-package cases explicitly skipped. All 62 *_test.py cases and site contract validation passed. No redundant heavy Node scan. An initial site-check invocation used a nonexistent tools/validate-site.js path; corrected to the repository entry point tests/site.test.mjs and verified exit 0. No failure was waived.

All 147 records retain their original keys; only essentialQuestion, reasoningSteps and labPlan change on the six named lessons. QA lesson/test/baseline/generated metadata bytes equal checkout. Metadata regeneration gives 90 routes, 753 external references and 0 unresolved HTML references; only 18 existing externalDependencies lists changed. Runtime manifest updates one blob only: cloud/linux.json, 619,885 bytes, SHA256 ecd07217037322a0781065b825f39f77ab397511e6b1a4f6d95b360be6559c46. All 334 paths retained; aggregate 446,130,622 bytes. Not a full release package.

GNU Pipelines, Lists, Exit Status, Double Quotes and Command Substitution pages were read directly. Redirections direct fetch failed twice and an IPv4 retry timed out; a separate retrieval of the same official page (cached November 12) verified the exact left-to-right explanation and both descriptor-order examples. Executable temporary-file fixtures independently confirm the stated outputs. Bash startup files are disabled, inherited BASH_ENV/ENV/SHELLOPTS/BASHOPTS removed, and options plus IFS explicitly set. Redirection files exist only in disposable test directories.

Hosted browser CI not reinterpreted or rerun for this batch; prior media failures remain unwaived. Earlier browser gates remain unwaived; no UI/live/deploy changes.
