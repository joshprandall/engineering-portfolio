# Six error-budget practice lessons

I replaced the generic question, reasoning and lab steps in six existing practice records. They now address distinct mistakes rather than repeating a definition:

- `leadership-v09-scenario-analysis-error-budget`: request-weighted regional aggregation and a changed traffic mix.
- `leadership-v09-design-review-error-budget`: two-window burn alerts, AND versus OR, and a strict threshold boundary.
- `leadership-v09-troubleshooting-lab-error-budget`: rolling-window expiration and a changing denominator.
- `leadership-v10-decision-brief-error-budget`: separate SLO-miss and incident-postmortem decisions, with explicit example-policy limits.
- `leadership-v10-checklist-lab-error-budget`: probe contamination that turns a user-visible miss into a false pass.
- `leadership-v10-diagnostic-lab-error-budget`: sparse traffic, unstable short-window ratios and conditional rather than certain exhaustion forecasts.

Each case has invented counts, a derivation, a second check, a falsifiable counterexample, a one-factor variation and a reproducible offline exercise. No real service or production decision is represented.

I read the primary SRE Workbook chapters before writing the lessons:

| Source | Retrieved HTML SHA-256 |
| --- | --- |
| https://sre.google/workbook/alerting-on-slos/ | `340f148f65a7a92596c65f0a44828cbc1bcf165291cccf2c33a2b57673dd30b3` |
| https://sre.google/workbook/implementing-slos/ | `1b02c7f3f640d92ca4357ba3e088fdbd6766274118afac934bede95ea9ea23e9` |
| https://sre.google/workbook/error-budget-policy/ | `6127d2a77904a4f4627ee0067de4f291d0cf6188cadea427f29afb1b91ac95df` |

The sources establish the concepts and example policies; the worked scenarios and counts are original. Thresholds and release exceptions are not presented as universal requirements.

`tests/leadership-core-evidence.test.cjs` independently recomputes the results, checks threshold counterexamples with integer arithmetic, and pins the exact set of 74 authored IDs against the existing baseline. Its 75 tests pass. All lesson IDs, order and other fields are unchanged; the original compact JSON serialization is preserved. This is content and test work only, with no new categories, routes, tiles, markup, runtime behavior or personal-history changes. Publication remains separate from this review.
