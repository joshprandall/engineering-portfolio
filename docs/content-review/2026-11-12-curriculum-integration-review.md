# Curriculum integration review — 2026-11-12

Branch: `content/curriculum-integration-20261112`, based on `main` at `968b512`.
Status: pushed for review. Not merged and not deployed. Live parity is established only for the
three files in section 1, so the branch must not be deployed yet.

What the branch changes at runtime:

- lesson text in `deep-learning/` chunks (sections 2, 5 and 6);
- the Evidence references of 453 Leadership records in `knowledge-data.js` (section 5);
- `learning-academy.js`, replaced by the hash-verified reconstruction of the live file
  (section 1);
- the closed search dialog that 18 project pages were missing (section 4).

It does not change shared CSS, scenes, solar navigation, audio, games or Geometry modules.
Release tooling, manifests and tests change as described in sections 7 and 8.

## 1. Live-site baseline

The live homepage and learning platform script were reconstructed from `main` by two
documented string substitutions each, and their SHA-256 values were recomputed:

| File | Reconstructed SHA-256 | Matches the live hash |
| --- | --- | --- |
| `index.html` | `c43093cb…af5d` | yes |
| `learning-academy.js` | `9e0e22aa…30c5` | yes |
| `styles.css` (unchanged from `main`) | `1302db17…0100` | yes |

`learning-academy.js` in this branch is now byte-identical to the live file. `index.html` is
left as on `main`; `tests/live-parity.test.cjs` pins both files and checks that the two
documented substitutions, and nothing else, turn this branch's `index.html` into the live bytes.

Findings from the reconstruction:

- The live homepage shows five Education cards (Oregon State University, Pioneer Pacific
  College, MIT Online Professional Education, Coding Temple, freeCodeCamp). The browser test
  expected three; it now checks these five in order.
- The live homepage loads `solar-v7-isolated-20261109/solar-navigation.js`. That directory is not
  in this repository or its history, so the live solar navigation cannot be reproduced from
  GitHub. It is not replaced or modified here.
- The live homepage requests `site-responsive.css?v=20261109-site-uniform-v1`. Only the query
  string differs from `main`; whether the stylesheet bytes served live differ from `main` is not
  established.

These files do not establish full-site parity. Every other live file remains unverified, and
deployment stays blocked on that comparison.

## 2. What was integrated

952 lessons in 31 existing chunk files, taken whole from the open draft branches. Each chunk
file was verified to be byte-identical to at least one draft head. Where drafts disagreed, the
newest corrected version was kept (databases and testing from the correction pass; HPC from
the latest revision of its own branch) except for algorithms, where the version citing
lecture-specific MIT 6.006 notes was preferred over a later version citing a generic page.
No lesson IDs were added, removed or reordered.

Still pending, because they need a structure decision: the robotics (36 lessons, three new
chunks) and AI/ML (12 lessons, one new chunk) drafts. Their lessons use new IDs in new chunk
files that no library category, index entry or catalog record references, so they would be
unreachable; making them visible needs new library categories or a new subject. Four sampled
lessons (inverse kinematics, Jacobian, confusion matrix, threshold cost) were checked and are
correct. Robotics and machine-learning material was instead worked into existing lessons
(section 6).

## 3. What was checked, and how

| Check | Coverage | Result |
| --- | --- | --- |
| Provenance against draft heads | all 31 chunks | byte-identical to a draft head |
| Scope: only lesson text fields changed | all 952 lessons | IDs, order and other fields unchanged |
| Attribution, internal narration, tracking parameters | all 952 lessons | none found |
| Missing source in substantive changes | all 952 lessons | 6 networking lessons had none; now cited |
| Vocabulary definitions | all 61 distinct definitions (559 uses) | 1 imprecise (eigenvalue); corrected |
| Expert recomputation | 90 lessons, 3 per chunk, seeded sample | no factual or arithmetic errors |
| Full lesson review | 16 quantum, 12 sequences, 6 networking, 58 Leadership, 8 math | see sections 4 to 6 |
| Citation fit | all cited URLs mapped to citing lessons | 4 corrections; Leadership Evidence references corrected (section 5) |
| Source existence and content | 230 URLs | see `2026-11-12-source-ledger.json` |
| Executable evidence | every substantively changed lesson | referenced by at least one evidence test or fixture |

The 90-lesson sample and its method are in `2026-11-12-expert-sample.json`. Lessons outside the
sample were not individually read; their numeric claims are covered by the drafts' evidence
tests, which recompute the stated results with independent models. The 173 vocabulary-only
changes have no executable test; all of their definitions were read.

Source checks follow the review environment's access rules: a page can be fetched only after a
web search has returned its exact address. A URL is recorded as **read** when its content was
read; **read elsewhere** when the same work was read at another address named in the ledger (for
example a DOI whose abstract was read on the university repository record); **listed by
publisher** when the publisher's own index page for the book links to that exact page;
**citation confirmed** when only the bibliographic record was confirmed; and **search-confirmed**
when a search returned the exact URL. Of 230 URLs, 51 were read, 5 read elsewhere, 58 listed by
the publisher (OpenStax index pages for University Physics Volumes 1 and 2 and Calculus
Volume 1), 1 citation-confirmed, 20 search-confirmed, 92 not individually checked, and 3 are
example hosts inside scenarios. Every source cited by lessons authored in this branch was read
or read elsewhere before it was cited, except Little's 1961 paper, whose bibliographic record was
confirmed; that lesson uses only the formula named in the paper's title. The 92 unchecked URLs
come from the integrated drafts.

## 4. Corrections made after integration

- Restored missing spaces before numbers in 26 architecture lessons and 9 algorithm fields
  ("to1", "becomes1030", "level0"); the tests that quoted the glued text were corrected the
  same way.
- Removed sentences duplicated verbatim between the first two reasoning steps of 10 waves lessons.
- Replaced the generic placeholder question in 16 quantum lessons with a question about each
  lesson's worked case.
- Corrected the eigenvalue definition, used RFC 4511's scope name `singleLevel`, pointed the
  MPI point-to-point lesson at the point-to-point chapter rather than the nonblocking section,
  and cited the matching OpenStax sections for arithmetic and geometric sequences.
- Added primary RFC references to the DNS, ARP, DHCP, TCP handshake, routing and UDP lessons.
- Named the public repository in 72 labs that tell learners to run repository tests.
- Replaced a Node.js documentation anchor that does not exist (`#mocking-timers`) with the
  MockTimers class heading, and used the canonical `.html` names for three OWASP links.
- Eighteen project pages (the API contract, cache consistency, job scheduler, migration safety,
  chaos recovery, edge failover, event-sourced workflow, HPC fabric, hybrid quantum, incident
  evidence, mini compiler, network twin, progressive delivery, message processing, routing
  convergence, Rust flow telemetry, wireless roaming and zero-trust pages) showed a Search
  button but lacked the dialog that `site-search.js` needs, so the button did nothing. They now
  carry the same closed dialog markup as the other project pages; `tests/search-dialog-contract.test.cjs`
  checks every page that loads the script.

Test changes made during review:

- Three tests read their pre-change baseline with `git show` on draft-branch commits that are
  not in `main`'s history. They now read stored snapshots of the same bytes (`tests/baselines/`),
  so they also run in shallow CI checkouts.
- The 48-lesson mechanics test asserted exactly 48 changed records; the chunk also carries the
  next 48. It now asserts that exactly records 1–96 changed and records 97–120 did not.
- An earlier wait added to the appearance test was reverted: the failure it addressed came from
  serving a staging directory that did not exist, not from a race.

## 5. Leadership

All 1,100 Leadership lessons carried the generic placeholder question, the same boilerplate
reasoning and lab steps, and no sources in their study text. 58 have now been authored:

- 26 v06 core lessons: reliability, recovery, incidents, capacity, governance, labs,
  operations and strategy (Google SRE book chapters 1, 3, 4, 5, 6, 11, 14, 15, 21 and 22; SRE
  Workbook chapters 2 and 5; NIST SP 800-34 Rev. 1 and SP 800-61 Rev. 3; Little's law).
- All 32 original core lessons in every Leadership chunk: total cost of ownership (GAO-20-195G),
  CapEx versus OpEx (IAS 16), incident command, roles, severity (NIST CSF 2.0 implementation
  examples), tabletop exercises (NIST SP 800-84), postmortems, change management (SRE book
  chapter 1; DORA), delegation (Yukl and Fu, 1999), one-on-ones (Flinchum, 2022), feedback
  (Kluger and DeNisi, 1996), executive communication (Digital.gov), service ownership
  (Vogels, 2006), capacity, escalation, metrics, error budgets and their policy (SRE Workbook
  appendix B), toil, service levels, RACI, roadmaps (GOV.UK Service Manual), technical debt
  (Cunningham, 1992), prioritization (SRE book chapter 3), psychological safety (Edmondson,
  1999), structured interviews (Sackett et al., 2022, as reported by SIOP), vendor evaluation
  (NIST SP 800-161 Rev. 1) and lock-in (EU Data Act, Article 29).

Each lesson works a stated, invented scenario, checks it a second way, rejects a named
misconception, changes one factor and states what its source does and does not establish.
`tests/leadership-core-evidence.test.cjs` recomputes every number these lessons state, allows
only the checked source URLs and pins every other record in the 14 touched chunks against
stored snapshots.

Evidence references. 407 Leadership records listed the same two SRE chapters (service level
objectives and postmortem culture) as their Evidence whatever the topic, so lessons on total
cost of ownership, hiring or vendor lock-in cited sources that do not discuss them. The 32 core
lessons now list the sources their lessons use, keeping existing references that still fit the
claim, and the 432 practice records derived from them carry the same evidence, as the
verification policy requires. 453 records changed (`references`, `verification.sourceCount`
and `verification.reviewed` only; the manifest's `sources` and `reviewed` to match).
`tests/leadership-evidence-references.test.cjs` checks for all 8,000 lessons that manifest
sources, source counts, review dates and inherited evidence agree.

Still to do: the 1,041 generated Leadership practice records (80 deep dives and evidence labs,
436 v09 and 525 v10 practice formats) keep the generic study text. Many are numbered
near-duplicates of the same format and topic, so authoring them one by one would produce
repetitive content; deciding whether to consolidate them is a curriculum-structure question.

## 6. Robotics and machine learning within existing lessons

Eight math lessons still carried the placeholder text. They now work robotics and
machine-learning cases, without new categories or interface changes:

| Lesson | Worked case | Source |
| --- | --- | --- |
| Trigonometry | forward kinematics of a two-link arm; the degrees-versus-radians bug | OpenStax Algebra and Trigonometry 7.3 |
| Linear independence | Jacobian columns and the straight-arm singularity | Modern Robotics 5.3 |
| Derivatives | joint velocity from encoder samples; noise amplification | OpenStax Calculus Volume 1, 3.1 |
| Sets and logic | precision and recall as set operations | scikit-learn, metrics and scoring |
| Logarithms | underflow of probability products; log loss | scikit-learn, metrics and scoring |
| Combinatorics | grid-search candidates and feature subsets | scikit-learn 1.7, tuning hyper-parameters |
| Functions | the logistic function, its range and the decision threshold | scikit-learn, linear models |
| Vector addition lab | odometry and a heading error | OpenStax University Physics Volume 1, 2.1 |

`tests/math-ml-robotics-evidence.test.cjs` recomputes every stated number and pins every other
record in the five touched chunks. The AI build pages (`assets/ai-build-mastery.json`) were
reviewed for the machine-learning and embodied-AI systems; their content is accurate and was
not changed.

## 7. About, Projects and Security Research

All 37 pages were scanned for assistant attribution, internal narration, tracking parameters and
third-person voice; none was found. Education, employment and credentials on the About page
agree with the live homepage reconstruction. The project count (34 numbered cards) matches the
homepage link. Phrases such as "production" or "guarantee" on project pages appear only in
disclaimers. The Security Research tools state their synthetic and authorized-use boundaries.
Apart from the missing search dialogs (section 4), no edits were needed.

## 8. Runtime packaging

Root cause. The route generator (`tools/website2_routes.py`) resolved references only against
a hand-maintained allowlist of runtime files, so files added later, or loaded by scripts at run
time (`learning-academy.js`, `ai-mastery.js`, `project-mastery.js` and the security toolkit
through `site-navigation.js`; the Night ambience audio through `site-audio.js`), were left out
of route closures, and the packaged site returned 404 for them.

Fix:

- The route generator resolves references against every tracked runtime-eligible file plus the
  verified large assets, including quoted file names in scripts and data and CSS `url()`
  references.
- `tools/prepare_runtime_metadata.py` derives runtime candidates from route closures and repeats
  until the manifest and the routes agree; the old filename-pattern list is gone, so
  regeneration is idempotent.
- `tools/build_runtime.py` fails closed if a packaged page, script, stylesheet or data file
  loads a tracked runtime file that is not in the package.
- `tools/deploy_osu_live.py` refuses a release whose route metadata names a dependency that is
  neither shipped, protected nor already on the host.
- CI fails if `npm test` regenerates `manifests/` with uncommitted changes.

Result: 90 routes and 334 packaged files. Each runtime change in this branch is followed by a
commit that refreshes `manifests/runtime-files.json` from the exact Git blobs
(`tools/build_runtime.py --refresh-manifest`), and a strict build from the branch head passes.
(The message of `1daf5fd` mentions `verification-manifest.json`; that file is not part of the
runtime package, and only `knowledge-data.js` changed there.)

Tests: `tests/runtime-dependency-closure.test.cjs` re-derives references with an independent
parser and requires the runtime-injected files to be packaged with the pages that load them,
every route closure to be complete and every packaged file to be in the manifest;
`tests/test_deploy.py` covers the deploy guard. The runtime browser suite passes against the
built package (section 9).

## 9. Tests

- `npm test` passes: 1,023 tests in the curriculum suites plus the other Node suites (9 and 25
  tests), and 6, 22 and 62 Python tests. It leaves the worktree clean.
- GitHub Actions on recent pushes: `validate`, `companions` and `ambience (chromium, desktop)`
  pass. The WebKit ambience jobs fail intermittently with "ResizeObserver loop completed with
  undelivered notifications", on the desktop and phone variants alike, as on `main`; the
  observers live in shared shell scripts that this branch does not change. `interface` passed on
  `135c2eb` and `60ef85f` and failed once on `2e15260`, a lesson-text-only commit, on a scene
  audio transition timing check ("Outgoing beach ambience is silent before waterfall becomes
  visible").
- Local browser suites (Chromium) against a package built from the branch:

  | Suite | Result | Notes |
  | --- | --- | --- |
  | `test:runtime-browser` | pass | the packaged site serves every runtime-loaded file |
  | `test:responsive` | pass | |
  | `test:responsive-components` | fail | only on a static check that `site-sound-control.js` calls `setPointerCapture`; `main` removed that call in `5100066` and fails the same way. With that one check removed in a scratch copy, the suite passes, including the search dialogs. The sound control is under the visual freeze and was not changed. |
  | `test:media-downloads` | fail | expects a video on `project-fusion.html`; `main` removed it on 2026-11-09 (`d4b9d4e`); the live page was not checked |
  | `test:browser`, `test:ownership-browser`, `test:security-journeys` | pass | earlier runs in this branch |
  | `test:evil-wizard-browser` | pass | WASM restored from the repository's release asset and hash-verified |
  | `test:refinement-browser`, `test:media-playback` | pass | earlier runs in this branch |
  | `test:glass-browser` | fail | a control on the lesson review view paints an opaque background in the dark theme; fails identically on unmodified `main` |
  | `test:chess-browser` | not run | needs Three.js 0.180.0; the CDN is blocked here and package installs are disabled |

  WebKit is not available locally; the CI matrix covers it.

## 10. Known limitations

- Deployment is blocked until the remaining live files are compared with this branch; only the
  three files in section 1 are verified.
- The 1,041 generated Leadership practice records and the remaining placeholder records in
  other domains keep the generic study text.
- 92 URLs from the integrated drafts were not individually checked; 58 more are confirmed to
  exist through the publisher's index but their content was not read.
- Much of the drafted text follows rigid templates (for example "The ordered synthetic model
  inputs are …" in mechanics and JSON fixtures quoted inside testing lessons). The content is
  correct but reads mechanically; a style pass is still needed.
- Source URLs render as plain text in lesson study text; making them links is a renderer change
  and is out of scope under the visual freeze. Evidence references render as links.
- The route generator records external URLs found in prose with any trailing punctuation
  (for example `…/introduction/.`); the list is an inventory only and does not affect packaging.
- Labs are guided exercises unless the lesson names an executable model. Labs that run
  repository tests require a clone of the public repository.
