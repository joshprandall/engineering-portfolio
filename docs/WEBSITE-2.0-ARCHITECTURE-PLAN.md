# WEBSITE 2.0 — exact consolidation plan

This is a staged implementation plan, not a broad refactor already performed. Keep games/labs independently versioned and preserve compatibility while moving one concern at a time.

| Concern | Target owner and interface | Migration and acceptance |
|---|---|---|
| Global routes | `manifests/site-routes.json` | The Phase 2 manifest now records every HTML route, isolated runtime boundary, static dependency closure, linked routes and external dependencies. Extend it with stable IDs, navigation labels and search metadata before generating navigation/search at build time. Validate every route and compatibility redirect, including dedicated lesson pages. |
| Primary/hamburger navigation | `site-navigation.js`, generated header template | Extract standard behavior from `site-resilience.js`; replace learning `knowledge.js` header binding with this owner. One handler per button; Escape/outside click/navigation close; focus return and `aria-expanded` tests at 320/390/820/1440 widths. |
| Global search | `site-search.js`, route-manifest index | Move `app.js` catalog/dialog controls. Keep lesson search inside the learning app, with only explicit link/search metadata exported. No game internals in global search execution. |
| Theme persistence | existing `site-theme.js` / `PortfolioTheme` | Retain `jr-site-theme`, legacy key migration, session fallback and `portfolio:theme` event. Other components consume this API instead of registering competing preference writers. Test reload/back/cross-tab/blocked storage. |
| Living visual background | `site-scenes.js` / scene renderer | Own visual media, canvas, scene selection and media fallback only. Preserve dedicated homepage/science canvases independently. Remove dormant ambient synthesis only after behavior/failure tests. Define pause/reduced-motion policy explicitly rather than accidental shared button semantics. |
| Ambient playback | existing `site-audio.js` / `SiteAudio` | Sole owner of ambient Audio elements, mute/volume/time, autoplay status and project/lesson suppression. Expose state events/getters/setters. Game audio and lesson speech remain local with a suppression handshake. |
| Sound UI | `site-sound-control.js` | One owner for button, slider, mute, keyboard and panel placement. Remove scene-owned duplicate DOM/listeners only after migrating pages. Preserve stable DOM during pointer events (Phase 2 bug fix). Test one control and one playback owner in both themes and without canvas. |
| Accessibility/resilience | semantic templates plus `site-resilience.js` | Resilience owns image/media fallback and diagnostics, not navigation/theme. Accessibility stays in each owning component: names, focus, live regions, safe DOM insertion, reduced motion. No global DOM sweep inside isolated games/labs. |
| Runtime packaging | `manifests/runtime-files.json` plus a future `tools/build_runtime.py` | Exact allowlist + hashes + restored asset closure; output only to local staging. Exclude preservation/docs/tests/tooling. Fail closed on absent/unverified assets. Keep linked credits and compatibility redirect. |
| Deployment | one future reviewed deploy adapter | Accept only verified staged manifest and exact commit; backup/rollback and live byte verification. Retire overlapping old scripts only after caller/workflow migration. Do not expand the old deployer's protected-game behavior before complete acceptance. |

## Isolation contract

- Games keep independent entrypoints, CSS, control input, render loops, rules and audio. Shell metadata/links may be generated; global page scripts must not traverse or rebind game controls.
- Geometry/Qubit/QPE/Emergent keep math modules/workers and scoped UI. A scene failure must not stop computation.
- Learning owns lesson rendering, progress, data chunks and speech. It consumes global theme/navigation contracts and explicitly signals ambient suppression.
- Chess uses one per-document match state within its own runtime boundary. This is not a global portfolio singleton shared across unrelated pages.
- Existing routes stay valid or redirect. Never rename “preview” paths just because their names look historical: the Qubit path is canonical.

## Ordered changesets

1. Phase 2 automated 3D/combat/handoff and authenticated binary restore checks passed. Extend coverage to physical camera/gamepad input, all character sets/combat modes and AI-turn recovery; retain the two unreadable files and unenumerated metadata directory. No production changes.
2. Build a local staged runtime package from the candidate manifest; verify case-sensitive references and exact bytes. Serve that package for all acceptance tests.
3. Introduce route manifest/generated header and search index; migrate standard pages first, then learning in a separate commit. Preserve the live dropdown/route decisions until user-facing equivalence is reviewed.
4. Consolidate sound UI and ambient state without changing game audio. Test denied autoplay, zero/default volume, lesson suppression, scene failure and storage denial.
5. Separate background visuals from audio and establish the accessibility/motion policy. Restore or intentionally relocate preserved live-only visual experiences through explicit page decisions, not test deletions.
6. Establish one deployment adapter and deprecate redundant tooling only after CI and recovery tests pass.
7. Only then produce a separate release proposal; production cleanup is another subsequent operation with per-file rehashing and authorization.

Each changeset must be reversible and retain the preceding runtime contract until acceptance passes. No plan entry authorizes deployment or deletion.
