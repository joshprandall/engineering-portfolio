# Authoring within the protected website

Use the current shell and data contracts. Add content to the existing system; do not create a second library or globally restyle the site to add a lesson.

## Complete example

`examples/learning-authoring/prefix-boundaries.json` contains an entire lesson record, teaching-pack entry, expected results and two teaching-element bindings. It is intentionally not counted as a published record. It reuses the current subnet calculator and its conceptual guide. Preview the existing renderer at `lesson.html?lesson=cloud-subnetting&view=lab`; use the example's exact instructions, predictions and feedback when authoring a reviewed entry.

The example's prefix arithmetic is grounded in [RFC 4632 §3.1](https://www.rfc-editor.org/rfc/rfc4632.html#section-3.1). The /31 exception is described by [RFC 3021](https://www.rfc-editor.org/rfc/rfc3021). A reference must support the actual claim; a link to a vendor homepage or a neighboring standard is insufficient.

## Current source map

| Change | Existing source |
| --- | --- |
| Lesson identity, objectives, explanation, worked example, prerequisites, related IDs, quiz and evidence | `knowledge-data.js`, `window.JR_KNOWLEDGE.lessons` |
| Deeper reasoning, lab instructions, vocabulary, recall ladder and optional video | `deep-learning/<domain>/<category-slug>.json`, keyed by lesson ID |
| Chunk discovery | `deep-learning/index.json` |
| Topic-specific mental model and prediction | `learning-visuals.js`, `guides[interactive]` |
| Executable teaching activity | `knowledge.js`, `mountInteractive` or dispatched `mountMathPhysics` |
| Local progress and review intervals | `learning-progress.js`; UI/storage binding in `knowledge.js` |
| Paths, glossary, curriculum relationships | Existing arrays in `knowledge-data.js` |
| Lightweight subject/search metadata | `assets/site-subjects.json`, `assets/site-search.json` |
| Integration challenge | `learning-capstones.json` and the existing capstone renderer |
| AI experiment | Matching `ai-*.html`, `ai-build-lab.js`, scoped `ai-build-lab.css` |
| Project/game entry | Existing project card and launcher; keep its engine/export unit isolated |
| Public route/package closure | `manifests/site-routes.json`, `manifests/runtime-files.json` |

Keep IDs stable: bookmarks, notes, recall and review plans use those IDs. Do not regenerate the corpus just to change one record. New schemas must read legacy state first and preserve unknown fields; add a tested migration rather than clearing storage. Progress is local to the browser, not account-backed.

## Publication checklist

1. State a specific objective and prerequisites. Write an explanation a returning learner can follow, a worked example with actual values, a plausible misconception and a next step.
2. Supply two complementary teaching elements: a topic-specific structure/process/mental model and a changing example/result/comparison. Decorative cards and generic diagrams do not satisfy this requirement.
3. For a reused model, confirm the guide's prediction is possible with its real controls. State units and assumptions. A family-level guide does not make every record a uniquely authored lesson.
4. Give the lab exact inputs, an expected observation, interpretation, reset/recovery and a useful perturbation to try. Persist useful notes. Test entry, action, result, error, exit and re-entry.
5. Add a recall question with plausible distractors and an explanation. The learner should justify the result. Include a teach-back prompt and a review/next-step path. Keep self-report separate from scored evidence.
6. Check every prerequisite/related/path ID and both the chunk index and chunk entry. Rebuild subject/search metadata with the repository's existing generator or update its exact entry. Report new counts honestly; revise count expectations only to reflect intentional publication.
7. Verify authoritative claim-specific sources and label simulations, approximations, randomness and research hypotheses. Do not inherit a `verified` flag without the editorial work it represents.
8. Test 320/390/430/820/1024/1440/1920 widths, both themes, keyboard focus, touch, reduced motion, failed fetch and unavailable storage. Read labels/captions on a phone viewport. Avoid color-only distinctions.
9. A new model needs a real dispatcher route and an executable-control assertion. Add known cases and meaningful edge cases. Register cleanup for every timer, oscillator, worker or animation owner; reset must not leave old work running.
10. Follow the exact-commit package/release sequence below. A successful build alone is not functional acceptance.

## AI and games

Keep each AI demo's inputs, local processing, outputs, validation, compare and reset behavior explicit. The existing AI build pages are local demonstrations. Any future live integration needs an established secure backend, server-side keys and bounded usage; do not turn a static response into a fake live integration. Geometry/Physics internals are protected.

For games, add navigation/launcher metadata without copying a new engine over a deployed export. Keep native game styles separate. Verify launch-to-play, input, audio, pause, restart, return/relaunch and optional fullscreen failure. Engine/runtime/PCK/WASM files form a versioned unit; never mix variants.

## Exact-commit validation and release

```sh
npm ci
npm test
python tools/restore_website2_assets.py
python tools/prepare_runtime_metadata.py
# Review generated metadata, then commit source and route changes.
python tools/build_runtime.py --commit <SOURCE_SHA> --refresh-manifest
# Review and commit the resulting runtime hash manifest.
python tools/build_runtime.py --commit <RELEASE_SHA>
python tools/validate_runtime.py
npm run test:browser
npm run test:refinement-browser
npm run test:security-journeys
npm run test:runtime-browser
npm run test:ownership-browser
npm run test:responsive-components
npm run test:chess-browser
npm run test:evil-wizard-browser
npm run test:media-playback
```

Browser tests default to the isolated staging package. A browser binary can be supplied via `PORTFOLIO_BROWSER_EXECUTABLE`; this changes the tested environment and must be recorded. `PORTFOLIO_THREE_ROOT` permits exact-version Three.js npm bytes for an isolated chess test; this is not proof of the live CDN. `npm run test:responsive` additionally includes the full native-zoom matrix where the browser environment supports it. Do not mark a skipped/blocked matrix as passed.

The committed runtime manifest refers to the source commit used to generate its payload hashes. A later metadata-only commit can have the same runtime bytes. The builder validates the selected commit's exact bytes against those hashes; it never silently accepts working-tree files.

Restore tooling accepts only manifest-listed assets with matching size and SHA-256. The public fallback cannot silently replace a changed deployed video. Retain the current OSU backup and existing preservation release artifacts. Inspect license/credit requirements before adding a new asset.

From an authenticated OSU shell, follow `DEPLOYMENT.md` with the final full SHA. The deployer preserves protected experiences, archives the current site, verifies writes and rolls back failures. Do not copy the full staging tree over production. Verify the actual deployed site afterward and record deployment and production verification as separate states.

## Reviewed content overlays

`knowledge-upgrades.js` applies eight explicit lesson-record updates after the
unchanged base corpus loads. It preserves IDs, model bindings and existing state.
The associated teaching packs are edited only at those lesson entries. The
standalone `learning-experiments.js` calculators are additive and create no
audio, timers or persisted state. `tools/build_study_pages.py` replaces only its
own marked content sections inside existing routes, using authored
`project-sources/engineering-studies/units.json`; it does not regenerate shells.

Use `tools/build_content_companions.py` for deterministic packages. Notebook code
execution, real kernel transport, optional MPI/GNP runtimes and browser/device
acceptance are separate gates recorded in `docs/CONTENT-RELEASES.md`.
