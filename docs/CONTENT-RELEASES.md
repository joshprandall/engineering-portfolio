# Content upgrade review ledger

The approved Website 3.0 baseline is
`e31cdd9efe0007159d4dd130e9bd5d5d9a7bb41e`. Work is isolated on
`content/website-3-approved-upgrades`. This branch is not a deployment.

## Preservation boundary

Keep the shared theme, scene, audio and sound-control bytes and manifest hashes
unchanged. Preserve navigation, responsive rules, native volume control, games,
Geometry calculations and benchmarks, immutable media, lesson IDs, and storage
keys. Add explanations and independently executable companions within the
existing content pages. No new backend or live model service is implied.

## Release 3.1 — foundations

Eight existing lesson IDs have authored explanations, worked examples, an explicit
model table, an executable calculator, five explained questions, targeted practice,
primary-source links, and a runnable Python/notebook companion:

| Lesson ID | Experiment |
| --- | --- |
| cloud-subnetting | Prefix boundaries and /31, /32 semantics |
| math-eigen | Candidate eigenpair residual |
| math-bayes | Prior, detector rates, and posterior |
| advanced-qubit-superposition | Pure-state X/Y/Z probabilities |
| advanced-entanglement | Bell versus separable-mixture correlations |
| cloud-recovery-rto-rpo | Independent RTO, RPO, validation evidence |
| software-testing-pyramid | Schema checks, rollback, idempotency |
| leadership-sli-slo-sla | Request-based error budget |

The 8,000 record IDs, 300 existing path IDs, and 66 existing model bindings remain
stable. The eight new calculators are separately identified; a generated practice
entry is not silently re-reviewed when its parent lesson changes. Review labels
distinguish a scoped authored review from legacy source metadata. New practice
questions remain formative checks; user completion is still self-reported.

Video players load on explicit selection. Existing locally pinned videos remain
available. Lessons without an exact selected video say so and remain usable.

### Validation evidence

- Full existing `npm test` suite: passed; its two pre-existing environment skips
  are still reported by the suite.
- New JavaScript model and authored-assessment checks: seven passed.
- Foundation Python tests: six passed, including transaction rollback, replay,
  and conflicting idempotency keys.
- All eight notebook files validate structurally and their code cells pass in
  fresh Python processes in temporary copies.
- Jupyter kernel transport is blocked in this execution environment (ZMQ socket
  operation not permitted). That gate is not reported as passed.
- The ordinary Playwright download returned incomplete archives. Content checks
  subsequently used packaged Chromium 153 with GPU rendering disabled; physical
  device, WebKit and GPU-game acceptance remain separate.

## Releases 3.2–3.6 — implemented bounded companions

41 authored sections on 27 existing routes have explanations, prerequisites,
worked predictions, model tables, executable notebooks, assertions, perturbation
questions, explained self-checks and claim-specific references. The 32-unit
sequence on the existing path page links eight foundations plus the first 24
companions. Seventeen further notebooks extend selected topics.

- 3.2: logistic training, neural gradients, GNN/EGNN symmetry, causal attention,
  lexical retrieval, typed idempotent tools, and artifact-based coordination.
- 3.3: density operators, kickback, QFT/QPE, Grover, order-finding arithmetic,
  exact-expectation VQE and bit-flip repetition decoding.
- 3.4: recorded GNP auditing, analytic PDE/inverse calculations, Kuramoto
  refinement, HPC bounds/collectives, probes, defensive fixtures, constraints, RL.
- 3.5: one-level denoising, spatial filtering, modality fusion, kinematics,
  ephemeral consent/expiry, integration checks, KV cache equivalence, weight
  quantization, low-rank updates and a solved subtraction game.
- 3.6: one-edge QAOA, product formulas, stabilizer algebra, coherence models,
  idealized swapping, noisy sensing and a scoped distillation approximation.

All 49 notebook files validate and their code cells pass. The studies suite
checks worked cases, symmetries, causality, denied effects, quantum boundaries,
recorded metrics, numerical refinement and optional GNP input validation.
No notebook silently substitutes a toy for a complete production system:
trained/fixed weights, generated/quoted text, recorded/new inference, sequential
simulation/real MPI, exact probabilities/device measurements are labeled.

Sixteen existing project/launcher pages now expose problem, implementation,
evidence boundary and a reproducible next step. `docs/project-evidence-review.json`
is the review record. Existing professional facts and credentials are preserved.
The wording connecting Phoenix Technology with the self-employed role remains
an owner-confirmation item; this release does not invent a corrected employment
or ownership history. No transcript was fabricated for the protected fusion video.

The 25 MB base corpus is byte-identical to baseline. Eight scoped changes live in
`knowledge-upgrades.js`, loaded after it on existing library routes. This makes
review possible without a one-line whole-corpus diff. The eight updated teaching
pack entries retain their chunk locations. Capstones link matching notebooks and
add an evidence-retention criterion without changing their IDs.

### Acceptance boundaries

- Scoped content-browser checks passed on packaged Chromium 153 with software
  rendering: eight lessons, forty questions, downloads/reset/notes, 27 study
  routes, seven lesson widths and both themes. This is not physical-device or
  GPU-game acceptance.
- Jupyter kernel transport remains blocked locally; a dedicated CI job runs the
  real kernel gate separately. Optional live MPI and new pretrained GNP inference
  have not been run. The GNP adapter's validation path is tested.
- The full refinement browser suite passed: 19 existing AI experiments, all 66
  visual/model pairs, numerical and invalid-input cases, notes, timer cleanup,
  quiz retry, review queue, narration lifecycle, teaching-pack retry, and six
  responsive widths in both themes. Protected owners, games, Geometry internals,
  immutable media manifest, and base corpus are byte-identical to baseline.
- Broader full-site, exact-commit, WebKit/media and production acceptance are
  separately recorded; none is inferred from the refinement result.

## Production gate

Review and approve the exact tested commit separately before OSU deployment.
Runtime packaging, successful tests, and a review branch do not establish live
deployment or physical-device acceptance.
