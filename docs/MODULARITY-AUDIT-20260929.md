# Whole-site modularity audit — September 29, 2026

The site would benefit from clearer module boundaries. The strongest evidence is overlapping ownership: background CSS also styles content, the theme script also loads site features, repeated HTML decides shared initialization, and the learning controller manages several independent systems. Moving those responsibilities behind explicit interfaces will make content changes safer.

Some boundaries already work well. Preserve the geometry and quantum calculations, worker interface, standalone games, compact learning progress module, and existing data-driven subject pages. Keep the approved appearance, scenery, recordings, solar navigation, URLs, and saved user data throughout the migration. A framework replacement is not required.

## Scope and evidence

This review inventories all **71 HTML pages, 67 JavaScript files, and 22 stylesheets** in the selected 290-file runtime. It manually reviews the shared controllers, feature entry points, data loading, styles, generators, and deployment paths. It does not mean that every interactive state of every page was exercised in a browser.

- Source/tooling revision: `3425d00433d457e9d7ef000410a0b3b621629eea`.
- Runtime application revision: `510006658056637447d0cc20d64010017df36d24`, as recorded in `manifests/runtime-files.json`.
- All 160 runtime HTML/JS/CSS files were checked against the manifest's byte lengths and SHA-256 hashes before analysis.
- The reproducible [inventory](modularity-evidence/inventory.json) records page dependencies, module signals, style overlap, and Python-tool syntax findings. Run `python3 tools/audit_modularity.py` after restoring the reviewed runtime. JavaScript/CSS signals are lexical aids, not proof of execution or a complete dependency graph.

This is an architecture audit. The earlier background repair and its browser evidence are documented separately in [AMBIENCE-STABILITY.md](AMBIENCE-STABILITY.md) and [ambience-repair-20260929.md](ambience-repair-20260929.md). This audit adds documentation and a read-only inventory tool; it does not implement the proposed refactor or establish current OSU playback behavior.

## Recommended boundaries

Priority describes migration order, not a claim that every area is currently broken.

| Priority | Area and present evidence | Recommended ownership |
| --- | --- | --- |
| 1 | **Release setup and page capabilities.** The contract covers 64 pages, but 66 load the scene controller. Nested consumers and older generators can escape the common version checks. | One page registry declares each page's features. One release manifest supplies asset references. Generators and hosting adapters consume it. |
| 1 | **Background experience.** Scene, audio, control, and theme files have established APIs, but rely on shared document state and cross-file styling. | One mounted background subsystem owns its DOM, media, transitions, visible-scene identity, sound, native volume slider, and lifecycle. |
| 1 | **Style ownership.** `site-scenes.css` reaches headers and content cards; `site-responsive.css` reaches backgrounds, sound controls, portraits, cards, and solar navigation. | Shared design tokens plus styles owned by each component. Responsive rules live with their component. Background styles cannot redefine page content. |
| 2 | **Shared shell and preferences.** `site-theme.js` loads scenes, audio, navigation, controls, and styles. Header markup and navigation data have several sources. | A small early appearance initializer, a preference service, a shell loader, and separate navigation/search components. |
| 2 | **Learning data.** Ten pages load the same 25,408,234-byte `knowledge-data.js`; deep learning already has a separate lazy-loading mechanism. | A catalog repository supplies small indexes and loads lesson/detail data as needed. Extend the existing lazy-loading mechanism. |
| 2 | **Learning behavior.** `knowledge.js` combines routing, rendering, saved progress, quizzes, narration, evidence views, and interactive labs. | Separate router/views, progress storage, quiz/review logic, lesson rendering, narration, and a lab registry. |
| 3 | **AI, science, and security tools.** Shared files select many experiments and combine model calculations, markup, controls, and export logic. | Small experiment hosts with individual models and views; pure security analyzers with separate input, report, and export adapters. |
| 3 | **Portfolio and visual widgets.** `app.js` combines editorial data and interactions; `portfolio-next.js` combines cards, a visualization, and feature loading. | Content records, reusable cards/tabs, and independent visual widgets with explicit mount/dispose behavior. |
| 3 | **Content generation.** Metadata builders also rewrite visible markup, and page builders copy/modify another page's head and header. | Separate content data, templates, page-feature declarations, and generation. Regeneration must preserve approved output. |
| Preserve | **Existing feature islands.** Geometry math/worker, Qubit math, modular chess code, generated Godot exports, and some learning helpers already have useful boundaries. | Keep internals intact. Adapt only their shared shell or integration boundary when needed. |

## First address the shared release gaps

`manifests/ambience.json` lists 64 shared pages. The inventory finds two additional scene consumers: `geometric-lab/index.html` and `qubit-preview-20260921/index.html`. Their source references use older labels:

| Asset | Nested-page version label | Current common ambience label |
| --- | --- | --- |
| `site-theme.js` | `20260928-day-audio-lock-v2` | `20260929-ambience-phone-v2` |
| `site-scenes.js` | `20260925-dark-audio-v18` | `20260929-ambience-phone-v2` |
| `site-scenes.css` | `20260929-glass-controls` | `20260929-ambience-phone-v2` |

The automatic discovery in `tests/ambience-contract.test.cjs` scans root HTML files, not nested pages. Its version assertion also omits `site-responsive.css`, although that stylesheet can change background controls and its bytes are protected by the owner hash check. The 64 shared pages currently reference that stylesheet with the separate `20260929-glass-controls` label.

These are consistency and cache risks, not proof of another playback failure. An old query label can still return current bytes; the problem is that the contract does not ensure all consumers move together, including clients holding cached responses.

Define explicit profiles such as shared ambience, theme-only lab, and isolated game. Inventory all 71 pages and account for all 66 scene consumers. Decide intentionally whether each nested lab should retain scenes or only inherit theme. Generate the correct references for its profile, including relative paths. Do not add background audio to isolated experiences merely to satisfy one blanket test.

There is also a confirmed tooling defect: `tools/build_responsive_shell.py` fails Python parsing at line 37 with `unexpected indent`. Static inspection shows it contains unversioned shared audio/control/style insertion and mixes education-content changes with shell generation. It is not established as an active build step or a cause of current browser behavior. Repair or retire this entry point before anyone reuses it. The current test runner compiles selected deployment scripts, so it does not catch this file's syntax failure.

## Isolate the background and its styles

The recent repair already establishes one audio owner, scene-to-sound synchronization, first-frame presentation checks, preference/lifecycle handling, and native-media regression gates. Preserve that working behavior while moving ownership. `dark-music.js` is a compatibility shim delegating to `SiteAudio`; it is not another independent player to delete blindly.

The proposed boundary has a small surface:

- Inputs: theme, motion preference, volume/mute preference, and balanced activity-priority requests from narration or a lab.
- Outputs: readiness, visible-scene identity, and playback status needed by controls or diagnostics.
- Private state: media elements, loading attempts, scene clock, transitions, animation frames, audio players, and cleanup.

Page content must not select media elements, start scene timers, or set background-specific CSS. The slider belongs to this subsystem and keeps the approved native range appearance with no painted backing panel.

Style cleanup is part of that boundary. `site-scenes.css` contains 281 `!important` tokens and `site-responsive.css` contains 148, but counts alone do not prove defects. The actionable finding is that both reach the same components while also controlling unrelated content. Move those rules to their owners, preserve specificity deliberately, and compare approved Day/Night layouts during each move. Do not remove overrides in bulk.

## Give the shell one source of setup

Keep the small early theme application that prevents an incorrect-theme flash. Separate preference migration and storage from feature loading: `site-theme.js` currently performs both. Existing public APIs can remain as compatibility adapters while callers move to the new boundary.

Navigation currently appears in header markup, `site-navigation.js` defaults, generated `assets/site-navigation.json`, and route metadata. Generate these from one model while retaining a usable static header before enhancement. `site-navigation.js` already has an ownership guard; the audit does not find grounds to call every old navigation path an active duplicate handler.

`site-search.js` is already a compact component. Keep it separate, with a provider interface if global and learning search need shared UI. Split `site-resilience.js` by the components it currently enhances—project cards, launch links, image fallbacks, and route styling—rather than letting it become a second general initializer.

`app.js`, `knowledge.js`, and `portfolio-next.js` also choose features or inject resources. Move those choices into page capabilities so a new page does not require edits to scattered filename lists.

## Separate learning content from learning behavior

The learning area has the largest combined controller: `knowledge.js` is 200,292 bytes. Its responsibilities matter more than its size. It owns navigation, lesson views, progress and review behavior, speech queues, and many lab implementations. Shared learning pages also carry the same 15-section structure and hide sections by page mode.

Use page templates to render the appropriate view and a catalog repository to load its data. Preserve lesson IDs, query routes, completion records, notes, preferences, and review schedules. Hosting compression helps transfer size but does not remove the browser's need to parse and retain the large decoded catalog.

Retain useful existing pieces: `LearningProgress` contains small reusable domain functions; `ensureDeepLearning` already caches lazy loads and handles errors; lab timers and cleanup collections already exist. `learning-capstones.js`, `site-subject.js`, and `learning-visuals.js` have narrower responsibilities and need measured integration work rather than wholesale replacement.

`learning-next.js` aligns path cards with `D.paths` by array position and checks counts before enhancement. Replace that positional dependency with stable path IDs and an owned renderer. Narration should use an explicit acquire/release audio-priority handle instead of other components needing to know background state.

## Keep experiments independent

`ai-build-lab.js` already mounts in a dedicated root, but selects numerous experiments in one implementation. Split experiment models and views behind a small common host. Apply the same approach to the filename-selected science experiments. For security tools, preserve local processing and current report invalidation while separating pure analysis from form events and export snapshots.

A useful lifecycle contract is `mount(root, services)` returning update and dispose operations. Disposal releases event listeners, observers, timers, animation frames, and any temporary audio priority. Apply it where components actually need mounting or visibility control; it does not require one global simulation clock.

Extract the connected-systems visualization from `portfolio-next.js`; retain solar navigation and the quantum cube as independent widgets. `agent-workbench.js`, `labs/qpe.js`, and `labs/emergent.js` already expose reusable calculations, so preserve those functions.

Geometry's `math.js` and worker message interface, Qubit's exported model functions, and chess's module imports are existing architectural assets. Treat Godot's generated JavaScript/WASM/PCK as one export unit. Its size is not a reason to manually split generated code.

## Use one release description with separate hosting adapters

`tools/build_runtime.py` already builds an exact selected revision and verifies runtime hashes. Keep that foundation. The OSU deployer and overlay workflow maintain their own root-file globs, directory lists, and required assets, creating another opportunity for selection drift.

Have the preview builder, OSU overlay, and OSU deployer consume one reviewed release manifest. Preserve platform-specific adapters for byte-range media delivery, compression, upload, backups, and rollback. Hosting behavior belongs in those adapters, not page code.

`tools/build_destinations.py` copies and rewrites head/header markup, while `tools/build_shell_metadata.py` also changes visible home/learning content. Separate these responsibilities and designate the supported generation commands. Historical patch scripts should be clearly retired or archived before new work reuses them, without discarding their history.

## Migration order and acceptance

1. **Close release coverage gaps.** Add explicit page profiles, include nested consumers, make version checks cover relevant shared styles, and repair/retire the old generator. Keep game and lab profiles intentional.
2. **Encapsulate background and style ownership.** Move the existing verified implementation behind one boundary; retain appearance, footage, recordings, transition timing, and slider behavior.
3. **Consolidate shell generation and preferences.** Migrate pages to generated setup, remove duplicate loading decisions, and keep storage migration compatibility.
4. **Split learning data and runtime responsibilities.** Migrate one view at a time, preserving URLs and saved learning state.
5. **Refine individual features and remaining generators.** Extract only the components whose ownership or lifecycle benefits from it.

Each phase must pass existing relevant regressions and a preview review before production replacement. Add focused checks for the boundary being changed:

- Every page has an explicit profile, and all actual shared-asset consumers are covered recursively.
- Adding or regenerating content does not alter approved ambience owner hashes or add independent background state.
- Generator reruns are stable and preserve approved output, routes, and content.
- Day scenes rotate with visible motion and matching sound; Night motion/music, navigation persistence, focus/visibility changes, and the bare slider still work in the native-media browser gates.
- Lab/narration activity releases audio priority and resources on exit; learning data migrations preserve existing user records.
- Protected game and Geometry internals remain intact. Physical iPhone/Messenger observations remain distinct from simulated mobile WebKit results.

The audit is complete. The structural migration above remains to be implemented; its first priority is release consistency followed by the background boundary, because those changes most directly protect the experience that future content updates must preserve.
