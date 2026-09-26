# Phase 3 migration and handoff

Production and main remain untouched. All work is on `website-2.0-reconciliation`; there has been no deployment or production cleanup.

## Completed implementation

1. `e0914b1`: exact-commit runtime builder and isolated baseline, before controller changes.
2. `1925bc3`: standard navigation owner; `0512b29`: learning navigation migrated separately after standard acceptance.
3. `4add645`: global route/lesson search owner, retaining detailed learning search.
4. `6ab91ed`: separate visual scenes, theme/motion, ambient playback and sound UI; explicit page policy.
5. `4bb8cd2`: dedicated destinations, nine portfolio solar links and seven real learning subject routes. Subsequent fixes preserve actual corpus levels, subject-scoped activities and accessible focus behavior.
6. `aedef5d` and checkpoint `926efb7`: package downloads and linked methods; exclude unlinked source-only game documents. This checkpoint is the final runtime payload tested in this acceptance run.
7. `0fdbb30`: directory-index validator correction and staged media/download/lab acceptance checks. Final documentation and reviewed manifest follow without changing runtime bytes.

Ownership remains: route manifest and `site-navigation.js` for navigation; `site-search.js` for global search; `knowledge.js` for detailed learning; `site-theme.js` for theme/motion preferences; `site-scenes.js` for scene rendering; `site-audio.js` for ambience; `site-sound-control.js` for sound UI; `site-resilience.js` for graceful image/project fallback; `tools/build_runtime.py` and `manifests/runtime-files.json` for package construction. Specialized games/labs retain their own state and controls.

## Phase 4 recommendation

Create a release candidate from the reviewed branch and reproduce its exact manifest on a clean Linux environment using authenticated artifact restoration. Then perform physical iPhone/Android/tablet acceptance, audio gesture checks, screen-reader/contrast review and longer game sessions; verify external contracts and outstanding preservation gaps (two unreadable live files and the unenumerated `.codex/` content). Resolve those items or record explicit release dispositions. Prepare and test a hash-verified deployment/rollback plan against a disposable production-shaped directory. Review the production cleanup manifest against that candidate; do not execute cleanup. Deployment, main merge and production deletion require a separate authorized phase.
