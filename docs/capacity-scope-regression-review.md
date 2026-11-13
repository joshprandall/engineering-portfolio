# Capacity scope regression review

The first full local suite at c95deb7 failed 1 of 1,139 Node tests. The capacity content batch had passed its scoped Python checks, but an older leadership scope test still assumed these four newly developed lessons were untouched. This was a test-chain integration omission, not a runtime defect. Scoped success was not full-suite acceptance.

## Correction

The original 174-lesson audit now uses the already committed immutable pre-capacity snapshot for that chunk. Every original numerical, source and lesson oracle remains unchanged. The two originally authored capacity records must still equal that snapshot exactly. A new whole-chunk guard requires exactly the four approved follow-up lessons to change, and only essentialQuestion, reasoningSteps and labPlan. All 73 records, IDs and order remain guarded. No content, runtime, media, timing or release assertion was changed.

## Verification

- Before correction: full runner failed, Node 1,138/1,139 passing.
- After correction: focused leadership suite 176/176 passing.
- Three isolated, in-memory negative fixtures each failed as required: an original lesson question, an unselected lesson question and a selected lesson title. No lesson files were mutated.
- Exact-byte QA copy: full runner passed, including all 1,140 Node tests and configured Python checks. The separately run content discovery suite previously passed 535/537 with only two pre-existing staged-package skips.

Hosted interface outgoing-ambience and WebKit ResizeObserver failures observed at 71a8fcd remain separate, unwaived release concerns. This test repair does not claim those failures fixed. No merge, deployment or live appearance change occurred.
