# Curriculum integration review — 2026-11-12

Branch: `content/curriculum-integration-20261112`, based on `main` at `968b512`.
Status: pushed for review. Not merged and not deployed. Nothing in this branch changes page
markup, shared CSS or JavaScript, scenes, audio, games or Geometry modules; the only runtime
files it changes are lesson data chunks under `deep-learning/`.

## 1. Live-site baseline

The live homepage and learning platform script were reconstructed from `main` by two
documented string substitutions each, and their SHA-256 values were recomputed:

| File | Reconstructed SHA-256 | Matches the live hash |
| --- | --- | --- |
| `index.html` | `c43093cb…af5d` | yes |
| `learning-academy.js` | `9e0e22aa…30c5` | yes |
| `styles.css` (unchanged from `main`) | `1302db17…0100` | yes |

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

These two files do not establish full-site parity. Every other live file remains unverified.

## 2. What was integrated

952 lessons in 31 existing chunk files, taken whole from the open draft branches. Each chunk
file was verified to be byte-identical to at least one draft head. Where drafts disagreed, the
newest corrected version was kept (databases and testing from the correction pass; HPC from
the latest revision of its own branch) except for algorithms, where the version citing
lecture-specific MIT 6.006 notes was preferred over a later version citing a generic page.
No lesson IDs were added, removed or reordered.

Not integrated, pending a structure decision: the robotics (36 lessons, three new chunks) and
AI/ML (12 lessons, one new chunk) drafts. Their lessons use new IDs in new chunk files that no
library category, index entry or catalog record references, so they would be unreachable.
Making them visible needs new library categories or a new subject. Four sampled lessons
(inverse kinematics, Jacobian, confusion matrix, threshold cost) were checked and are correct.

## 3. What was checked, and how

| Check | Coverage | Result |
| --- | --- | --- |
| Provenance against draft heads | all 31 chunks | byte-identical to a draft head |
| Scope: only lesson text fields changed | all 952 lessons | IDs, order and other fields unchanged |
| Attribution, internal narration, tracking parameters | all 952 lessons | none found |
| Missing source in substantive changes | all 952 lessons | 6 networking lessons had none; now cited |
| Vocabulary definitions | all 61 distinct definitions (559 uses) | 1 imprecise (eigenvalue); corrected |
| Expert recomputation | 90 lessons, 3 per chunk, seeded sample | no factual or arithmetic errors |
| Full lesson review | 16 quantum, 12 sequences, 6 networking, 12 new Leadership | see section 4 |
| Citation fit | all cited URLs mapped to citing lessons | 4 corrections |
| Source existence | 198 URLs | see `2026-11-12-source-ledger.json` |
| Executable evidence | every substantively changed lesson | referenced by at least one evidence test or fixture |

The 90-lesson sample and its method are in `2026-11-12-expert-sample.json`. Lessons outside the
sample were not individually read; their numeric claims are covered by the drafts' evidence
tests, which recompute the stated results with independent models. The 173 vocabulary-only
changes have no executable test; all of their definitions were read.

Source existence was checked within the review environment's access rules: most documentation
hosts cannot be fetched directly, so a URL is recorded as read only when its content or the
publisher's table of contents for that exact URL was read, and as search-confirmed only when a
web search returned that exact URL. Of 198 URLs, 24 were read, 20 were search-confirmed, 151 were
not individually checked, and 3 are example hosts inside scenarios.

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
reasoning and lab steps, and no sources. Twelve core lessons were authored: SLI, SLO, error
budget, cascading failure, graceful degradation and reliability targets (Google SRE book
chapters 3, 4 and 22; SRE Workbook chapter 2); RTO, RPO and contingency-plan testing
(NIST SP 800-34 Rev. 1, with the RTO and RPO definitions checked against the NIST glossary); and
incident command, incident timelines and blameless postmortems (SRE book chapters 14 and 15).
A new evidence test recomputes every number these lessons state, allows only the verified
source URLs and pins every other Leadership record as unchanged. The other 1,088 Leadership
lessons still need the same treatment.

## 6. About, Projects and Security Research

All 37 pages were scanned for assistant attribution, internal narration, tracking parameters and
third-person voice; none was found. Education, employment and credentials on the About page
agree with the live homepage reconstruction. The project count (34 numbered cards) matches the
homepage link. Phrases such as "production" or "guarantee" on project pages appear only in
disclaimers. The Security Research tools state their synthetic and authorized-use boundaries.
No edits were needed.

## 7. Runtime packaging metadata

`manifests/runtime-files.json` on `main` was generated at `c6a1ef0`. Ten runtime files changed
on `main` afterwards without a refresh (`about.html`, `game-development.html`, `index.html`,
`play-evil-wizard.html`, `portfolio-home.css`, `project-fusion.html`, `projects.html`,
`security-research.html`, `site-navigation.js`, `site-responsive.css`), and 23 runtime files were
added without being listed. `tools/build_runtime.py` therefore fails closed on `main` with
"Unexpected hash: about.html". This branch adds the 31 changed chunks to that list of stale
entries. The committed manifests are left unchanged on purpose: refreshing them would make a
package of `main`'s `index.html`, which is not the live homepage, buildable.

A local build with refreshed hashes (not committed) produced 320 files. Pages on `main` now load
`learning-academy.js`, `ai-mastery.js`, `project-mastery.js` and the security toolkit at runtime
through `site-navigation.js`, and the Night ambience requests `assets/audio/dark-theme-user-v32.*`.
The committed `site-routes.json` does not list these dependencies, so the packaged site
returned 404 for them in the runtime browser suite. Regenerating the route metadata in a local
scratch commit (not pushed) added `project-mastery.js` and its data file but still omitted
`learning-academy.js`, `ai-mastery.js`, `security-toolkit.js`/`.css` and the Night audio: the
route generator does not recognize scripts injected through `addScript(...)`/`addStyle(...)`
in `site-navigation.js` or media addressed with `new URL(...)` in `site-audio.js`. Before any
release, the generator or the manifests must account for these runtime-loaded files, and the
regenerated `site-routes.json` and `runtime-files.json` must be reviewed and committed together
with the live-parity work.

## 8. Tests

- `npm test`: passes (959 Node tests in the curriculum suites plus the existing suites; 62 Python
  tests). `npm test` regenerates three manifests; those changes were not committed.
- GitHub Actions on this branch: `validate`, `interface` and `ambience (chromium, desktop)`,
  `ambience (webkit, phone)` and the content-companions workflow pass. `ambience (webkit,
  desktop)` fails because WebKit reports "ResizeObserver loop completed with undelivered
  notifications" as a page error; `main` fails the same way. The observers that set layout
  variables live in shared shell scripts, which this branch does not change.
- Local browser suites (Chromium, served from the checkout or from a package built from this
  branch):

  | Suite | Result | Notes |
  | --- | --- | --- |
  | `test:browser` | pass | five Education cards, original appearance test |
  | `test:ownership-browser`, `test:security-journeys` | pass | |
  | `test:evil-wizard-browser` | pass | WASM restored from the repository's release asset and hash-verified |
  | `test:responsive`, `test:refinement-browser` | pass | |
  | `test:media-playback` (Chromium) | pass | |
  | `test:glass-browser` | fail | a control on the lesson review view paints an opaque background in the dark theme; fails identically on unmodified `main` |
  | `test:runtime-browser` | fail | the package omits runtime-loaded files (section 7) |
  | `test:media-downloads` | fail | expects a video on `project-fusion.html`; `main` removed it on 2026-11-09 (`d4b9d4e`); the live page was not checked |
  | `test:responsive-components` | fail | search-focus check on `project-advanced-computing.html`; this branch changes neither that page nor any script; cause not isolated |
  | `test:chess-browser` | not run | needs Three.js 0.180.0; the CDN is blocked here and package installs are disabled |

  WebKit is not available locally; the CI matrix covers it.

## 9. Known limitations

- Much of the drafted text follows rigid templates (for example "The ordered synthetic model
  inputs are …" in mechanics and JSON fixtures quoted inside testing lessons). The content is
  correct but reads mechanically; a style pass is still needed.
- Source URLs render as plain text in lessons; making them links is a renderer change and is
  out of scope under the visual freeze.
- Labs are guided exercises unless the lesson names an executable model. Labs that run
  repository tests require a clone of the public repository.
