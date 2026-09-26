"""Generate documentation from captured audit evidence only."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];DOC=ROOT/'docs';EV=DOC/'audit-evidence'
def read(n):return json.loads((EV/(n+'.json')).read_text(encoding='utf-8'))
def write(n,s):(DOC/n).write_text(s.strip()+'\n',encoding='utf-8')
c=read('git-live-comparison'); inv=read('live-inventory'); prov=read('git-provenance'); summary=read('summary')
def code(s):return '`'+s+'`'
def paths(status):return [x for x in c if x['status']==status]
def action(p):
    if p.startswith('games/evil-wizard/'):return 'Preserve/import complete current export, including server config and launcher'
    if p=='games/3d-battle-chess/shared-game.js':return 'Preserve/import with live toggle implementation; do not mix game versions'
    if re.search(r'backup|_before|_safe|\.bak|\.before|before-',p):return 'Archive after provenance and recovery verification; not authorized for deletion'
    if p.startswith('games/evil-wizard-'):return 'Archive distinct export as a unit after build/play comparison; PCK differs'
    if p.startswith('games/3d-battle-chess-v8/'):return 'Preserve preview separately; compare complete module graph before archiving'
    if p in ['assets/fusion-presentation.mp4','fusion-presentation.mp4']:return 'Preserve canonical assets/ video; archive duplicate root copy only after URL migration'
    if p.startswith('assets/audio/'):return 'Preserve audio and provenance; establish active versus historical role before import/archive'
    if p.endswith('.zip'):return 'Inspect package manifest and preserve externally before removing production copy'
    if p.startswith('Joshua_Randall_Knowledge_Platform_') or p=='build_data.py':return 'Archive source/generator with release provenance; exclude nested deployment from future runtime'
    if p=='quantum2.jpg':return 'Unreadable content: retain; no duplicate conclusion'
    if p.startswith('_shellfish'):return 'Unfinished-upload candidate; unreadable content, do not delete yet'
    if p=='Thumbs.db':return 'Eventual runtime exclusion after archive; not a site asset'
    return 'Preserve and review references/provenance; no automatic overwrite or deletion'

write('WEBSITE-2.0-AUDIT.md',r'''
# WEBSITE 2.0 — reconciliation audit

Audit date: 2026-09-25/26 America/Los_Angeles. Status: accessible-tree reconciliation completed; access and functional-validation gaps remain. This is **not a deployment or deletion clearance**.

## Boundaries and provenance

- Primary checkout: `C:\Users\joshp\Documents\engineering-portfolio`.
- Production reference: `Z:\public_html` (OSU share). Every operation against it was read-only. No deployment, deletion, move, rename, overwrite, or permission change was performed.
- Initial working tree was clean on local `main` at `ad48c33cf476bd6a8c02a436a3ac747147b7e085`.
- Fetched origin and checked out the existing `website-2.0-reconciliation` branch at `abf09c466cc06c4cfff8c62004e867972c52a878`. The local `main` branch was not advanced or edited.
- Fetched `origin/main` was `c8a34a8d90ac7556cd9e8f96efce62352791d989`. At capture, reconciliation differed from that commit only by the previous audit-baseline document. This is why branch runtime findings also describe fetched main, not because main was assumed newer than production.
- 61 fetched remote branch tips were searched for live-only paths. This does not establish absence from all Git history, tags, other repositories, unpushed work, or external release assets.
- No `AGENTS.md` was found in the inspected repository/live tree. The inaccessible live `.codex` directory was not bypassed.

## Inventory and comparison

| Measurement | Result |
|---|---:|
| Baseline repository working files, excluding Git internals and generated audit evidence | 287 |
| Visible live files, including metadata-only records | 397 |
| Live files successfully SHA-256 hashed | 395 |
| Visible live bytes | 612,169,069 |
| Repository bytes at baseline | 78,420,123 |
| Same path, identical committed Git/live SHA-256 | 181 |
| Same path, different committed Git/live content | 49 |
| Live-only relative paths | 167 |
| Git-only relative paths | 57 |
| Cross-path exact duplicate groups | 42 |

The raw working-tree comparison gives 103 identical and 127 different shared files. Comparing committed Git blob bytes removes 78 checkout line-ending differences. Keep raw hashes for evidence; do not interpret CRLF conversion or checkout mtime as a newer release. Git commit dates are not per-file content timestamps. All captured sizes, UTC mtimes and SHA-256 values are in the evidence inventories. The comparison baseline precedes creation of these new audit documents.

The earlier baseline's 404 live files was an externally supplied inventory, not this capture. The new count is not evidence that seven files were deleted: dates, scope and inaccessible metadata differ.

## Preservation-critical findings

1. **Git cannot reproduce the live Evil Wizard runtime.** The entire `games/evil-wizard/` export is missing from the current branch: launcher, console, champion definitions, Godot loader, PCK, WASM, image/icon files, audio worklets and `.htaccess`. Preserve/import the complete build as a versioned unit. The six source files under `project-sources/evil-wizard/` are committed-byte identical to live, but their presence does not prove they reproduce this export.
2. **Crown & Ash diverges in both directions.** Live `boot.js`, `battle.js`, `fallback-board.js` and live-only `shared-game.js` implement a shared chess state when switching 2D/3D. Git has a setup-first expanded renderer, combat modules, difficulty profiles and handheld handling, with a different fallback boot path. Live is the canonical deployed behavior; Git is a distinct candidate development version. Neither should overwrite the other. Capture live provenance and port the toggle fix deliberately with state-preservation tests.
3. **Fusion is genuinely duplicated.** `fusion-presentation.mp4` and `assets/fusion-presentation.mp4` are each 168,678,432 bytes, SHA-256 `eefc852a3a5d12eeedf8a217fc2cb68d6d0476612ad4d8744a8e6febd99361e8`. The active fusion page points to the assets/ URL. Archive/redirect the root URL only after checking external consumers; keep the video retrievable from a versioned source or immutable binary store with this checksum.
4. **Evil Wizard previews are not interchangeable.** Four exports share the exact 39,514,754-byte WASM hash, but all four PCK hashes differ. Equal engine binaries do not establish equal game content. Archive complete distinct releases, not selected files based on size.
5. **Repository page architecture is not yet deployed.** `expertise-experience.html`, `game-development.html`, and `lesson.html` exist only in Git. Git navigation/search and `knowledge.js` depend on those routes. Live keeps expertise/experience on the homepage, dropdown game navigation and inline lessons. Deploying only updated controllers would break the route contract.
6. **Do not remove metadata merely by extension.** `geometric-lab/CREDITS.md` and `METHODS.md` have runtime links. Fonts and scene attribution files also carry provenance. “Source-only” must be a per-file decision.

## Defects and dependency findings

- Confirmed visible literal `\n`: live `index.html:27`, between the scene and sound-control script tags. HTML text parsing isolates this one actual text node. Thirteen other HTML search matches are valid JavaScript newline escapes in Godot/diagnostic scripts, not rendered corruption.
- Confirmed mojibake candidate: historical `projects-qubit-backup-20260921-224301.html:1` contains `Â·` and `â†—`. No matching corruption was found in current runtime HTML/JS/CSS/JSON by the scoped scan. This is not a linguistic proof for all Unicode or binary documents.
- Confirmed incomplete historical game: `games/battle-chess/index.html` references missing `styles.css` and `main.js`; its `arena.js` references missing `sets.js`, `game.js` and `vendor/OrbitControls.js`. Preserve it as history, not the canonical playable game.
- Git current game links to `games/evil-wizard/play.html` and the cover `games/evil-wizard/index.png` cannot resolve from this checkout alone. Existing browser tests explicitly exempt some Evil Wizard errors, so their success could not establish game completeness.
- Bare `three` and `three/addons/controls/OrbitControls.js` imports are mapped to pinned jsDelivr URLs by import maps; they are not missing local assets.
- Absolute OSU audio/video URLs, remote Pexels scene videos, Wikimedia field recordings and Three.js CDN modules are external dependencies. A fully local source tree still will not be independently reproducible/offline until these have provenance and fallback contracts.
- Static edges cover HTML src/href/poster, CSS URLs, module imports, literal fetch/Audio/Worker references, extra asset strings and Godot export members. Dynamic HTML, document-relative fetch paths, base URLs, generated paths and import maps require interpretation. The initial 411 unresolved edges include historical backup pages, test strings and CDN specifiers; they are **not 411 confirmed broken production assets**.
- `knowledge.js` computes `deep-learning/<domain>/<category>.json`. All 76 index-listed chunks exist and parse. `knowledge-data.js` and `verification-manifest.json` each contain 8,000 lesson/record entries and match live Git bytes. Lazy chunk loading must remain part of the runtime graph.

## Validation actually performed

| Check | Result and meaning |
|---|---|
| Existing `node tests/site.test.mjs` | Stops at line 51, requiring every project card to have `target="_blank"`; first failure is Recovery Readiness. This is an outdated/contested design assertion, not evidence of a broken link. Later assertions did not run. |
| Existing Python deployment unit tests | 6 run: 4 pass, 1 failure (POSIX 0755 expectation on Windows), 1 error (Windows symlink privilege). Tests use temporary fake sites; no live deployment occurred. Linux permission and destination-escape coverage remains unverified here. |
| Existing browser suite | Bundled default Chromium absent; reran with installed Chrome. Passed its 32-page theme/navigation-direction/reload/Back/tab-sync and narrow-layout stage, then stopped at `appearance.test.cjs:70`. It expects sound inside `.scene-options`, while the homepage control now lives in the header. Remaining suite did not execute. |
| Targeted read-only smoke | 15 page/tree combinations, 390×844: home, Learn, QPE, Emergent, Geometry, Qubit, chess on both trees, plus live Evil Wizard launcher. No recorded JS page errors, local HTTP failures or horizontal overflow; sampled shared theme/menu controls responded. Homepage sound control visible in the header. |
| Captured JS syntax | 150 non-backup JS/MJS/CJS source checks passed in Node module syntax mode. Parsing does not prove browser behavior. |
| Data consistency | 76 deep-learning chunks parse and exist; 8,000 lessons and 8,000 manifest records. |
| SHA-256 | Every readable live file hashed, including large video and game binaries. No per-file changed-during-read flags on successfully hashed files. |

Browser smoke served captured HTML/JS/CSS from memory and other assets read-only from the corresponding tree through localhost. It does not reproduce OSU Apache headers, network caching, production origin or actual phone hardware. Chess Git showed its setup screen (zero initial canvases), live chess one canvas; those are different launch flows, not an automatic failure. The Evil Wizard launcher was inspected without starting/completing gameplay. Audio audibility/autoplay, full game controls, gamepad, touch devices, WebGL resilience, fusion playback and all science experiments need dedicated functional acceptance before any release. Localhost-specific audio behavior further limits playback conclusions.

## Remaining access gaps

`quantum2.jpg` (147,787 bytes) and `_shellfish_uploading_4336159125157019876` (210,000 bytes) expose metadata but deny reads. Their SHA-256 is null, not inferred from equal sizes. `.codex/` denies directory enumeration, so its contents and count remain unknown. A second elevated read-only attempt failed too; no permissions were changed. These are host/share access limitations, not requests for the user to inspect files manually.

## Safe next work and consolidation order

1. Preserve the live-only canonical game export, shared chess repair, OSU assets, audio provenance and generator in a separately reviewed import commit. Retain exact checksums and source/build identities. Large binaries can be versioned artifacts with a checked-in manifest and verified retrieval process; a manifest alone is not preservation.
2. Record unique backups and alternate releases in recoverable archive storage outside production. Verify restoration before proposing deletions. Do not discard distinct PCK files or historical source generators.
3. Establish one route/navigation manifest and generated shared page shell, consumed by standard pages and learning pages. Preserve accessible menu handling and all existing routes until replacements/redirects are tested.
4. Keep `site-theme.js` as preference owner; migrate remaining legacy keys through its API. Keep one `SiteAudio` playback owner, one sound-control component and a separate visual scene renderer. Delete dormant legacy audio code only after call-graph and failure-path tests.
5. Treat each game/lab as a versioned runtime boundary with its own full asset closure, source commit and launch contract. Merge chess behavior with move-state continuity tests rather than directory replacement.
6. Consolidate deployment into one explicit runtime allowlist/manifest, validated from an exact source commit plus binary hashes. Existing tooling protects host games by omission, which is useful for safety but does not make Git authoritative. Keep docs/tests/source archives out of output, while retaining linked credits and downloads.
7. Update tests to assert supported behavior instead of obsolete DOM placement, target attributes or exact page counts. Add release acceptance for route closure, case-sensitive Linux paths, learning lessons, touch menus, theme persistence, sound ownership, scene failure, game launch and fallbacks.
8. Only after that validation and a reviewed removal list should an import/architecture release or production cleanup be considered. This audit makes no runtime changes.

## Companion documents and evidence

- [Canonical file map](WEBSITE-2.0-CANONICAL-FILES.md)
- [Complete live/Git path comparison and import disposition](WEBSITE-2.0-LIVE-VS-GITHUB.md)
- [Cleanup candidates, preservation exceptions and gates](WEBSITE-2.0-CLEANUP-CANDIDATES.md)
- [Evidence summary](audit-evidence/summary.json), [Git provenance](audit-evidence/git-provenance.json), [live inventory](audit-evidence/live-inventory.json), [local inventory](audit-evidence/repository-inventory.json), [Git blob comparison](audit-evidence/git-live-comparison.json), [raw comparison](audit-evidence/comparison.json), [duplicate hashes](audit-evidence/duplicates.json), [dependency edges](audit-evidence/dependencies-expanded.json), [external references](audit-evidence/external-dependencies.json), [browser smoke](audit-evidence/browser-smoke.json), [syntax/data checks](audit-evidence/syntax-and-data.json).

The `audit-tools/` scripts document collection and analysis. They write only audit outputs and never deploy. `.git`, installed dependencies, Python caches and generated audit outputs are excluded from baseline site inventories. Runtime source captures used for analysis are scratch evidence, not imported runtime source or part of the documentation commit.
''')

write('WEBSITE-2.0-CANONICAL-FILES.md',r'''
# WEBSITE 2.0 — canonical runtime file map

“Canonical live” means selected by current entrypoints/imports, not “newest filename” or “best implementation.” Git versions are compared at `abf09c4`; current live is preserved as captured. No version was promoted or deployed.

| Function | Current live entrypoint and dependency chain | Git difference / preservation decision |
|---|---|---|
| Crown & Ash / 3D Battle Chess | `project-battle-chess.html` / `projects.html` → `games/3d-battle-chess/index.html` → `boot.js` → `battle.js`, `fallback-board.js` → `shared-game.js`, `engine.js`; `styles.css`, `fallback.css`; import-map Three.js and OrbitControls | Live has the working shared-state toggle repair. Git's `battle.js` instead owns its `ChessGame`, expanded character/combat imports, audio, setup/handheld controls and AI profiles. Preserve both, merge behavior deliberately. |
| Chess development/combat variants | Git `battle.js` → `pieces.js`, `characters.js`, `combat-v8/character-factory.js`, `duels.js`, `duels-v8.js`, `castle-controls.js`, `attacks.js`, `audio.js`; transitive combat-v8 modules | Live `games/3d-battle-chess-v8/index.html`, `v8-preview.js`, `v8-preview.css` is a separate preview, not the catalog entrypoint. Copied combat-v8 modules do not prove the live primary renderer uses them. `games/battle-chess/` is incomplete history. |
| Defeat the Evil Wizard | `projects.html` / `play-evil-wizard.html` → `games/evil-wizard/play.html` → `console-champions.js`; touch path `console.html`; desktop/compatibility path `index.html` → `index.js`, `index.pck`, `index.wasm`, worklets/icons; `.htaccess` server behavior | Complete live runtime missing from current Git. Preserve launcher modes, iframe messaging, fullscreen/orientation fallback and direct-launch query parameters as well as binaries. Preview/console/adaptive exports have distinct PCK files. |
| Geometry & Physics / Geometric AI | `project-geometric-ai.html` → `geometric-lab/index.html` → `app.js`, `math.js`, `benchmarks.js`, `worker.js` (`importScripts('math.js')`), `styles.css`, `assets/favicon.svg`, shared theme/scenes, linked `CREDITS.md`, `METHODS.md` | All main math/app/worker bytes match Git; `styles.css` differs. Retain worker and original research attribution. Root wrapper differs with the page-shell changes. |
| One Qubit, Two Outcomes | `project-qubit.html` / project card → `qubit-preview-20260921/index.html` → `app.js`, `qubit.js`, `styles.css`, shared theme/scenes | Four lab files match committed Git bytes. Despite its “preview” name this is the current runtime route; do not archive it by name. `quantum-cube.js` is a separate homepage visualization. |
| QPE | `project-qpe.html` → `labs/qpe.js`, shared styles/theme/scenes | JS matches Git. Live `labs/qpe.mjs` is an alternate source copy, not the page's selected controller; preserve provenance before archival. |
| Emergent Systems Explorer | `project-emergent.html` → `labs/emergent.js`, shared styles/theme/scenes | JS matches Git. Live `.mjs` alternative is not a substitute for the active `.js` URL. |
| Learning platform | `learn.html` and `learn-{browse,paths,practice,map,mastery,glossary,verify,labs,capstones}.html`; `knowledge.js`, `knowledge.css`, `knowledge-data.js`; `learning-depth.*`, `learning-next.*`, `learning-capstones.{js,css,json}`; `deep-learning/index.json` and 76 chunk JSON files; `verification-manifest.json` | Live lessons open inline. Git `knowledge.js` redirects to Git-only `lesson.html`. Keep page and controller versions together. Data and learning support controllers match Git bytes; shell/controller routing differs. Old nested v0.3.0 is historical, not canonical. |
| Fusion project/video | `project-fusion.html` → absolute OSU `assets/fusion-presentation.mp4` | Video absent from current Git and all inspected portfolio branch-tip paths. Root video is byte-identical duplicate. Preserve canonical assets URL and a restorable source artifact. |
| Navigation / mobile hamburger | Standard HTML `header #primary-nav`, `#menu`; `site-resilience.js` owns standard-page events; `styles.css`, `site-resilience.css`; `knowledge.js` independently builds/binds its learning header | Live adds game `<details>` dropdown; Git replaces nav with six dedicated routes. Both standard and learning implementations need a common manifest/component. `app.js` explicitly delegates navigation to resilience. |
| Theme preference | `site-theme.js`, `window.PortfolioTheme`, `portfolio:theme`; `jr-site-theme`, legacy `portfolio-theme`, `jr-knowledge-theme`, `jr-geometry-theme`; CSS across shared/page/lab files | Controller bytes identical. Legacy key migration and document binding are intentional compatibility behavior; preserve storage fallback and cross-tab synchronization. |
| Scene/background | `site-scenes.js` + `site-scenes.css`; `assets/scenes/webb-cosmic-cliffs.webp`, scene attribution, remote Pexels videos/posters; homepage orbit additionally `portfolio-next.js`/CSS; `quantum-cube.js`, `science-experiments.js`/CSS | Git adds main-page scoping and saved light-scene selection; live resets scene index. Multiple visual layers are not all duplicates: backdrop, solar system and scientific canvases have different roles. |
| Ambient audio playback | `site-audio.js`, `window.SiteAudio`; custom `assets/audio/dark-theme-user.wav` + MP3 fallback (absolute OSU URLs); external river/waterfall/shorebird OGG recordings | Custom WAV/MP3 match Git. Live V24 vs Git V26 differ in suppression and autoplay retry/state handling. Light MP3 files on live are not the currently selected OGG URLs; preserve them pending provenance review. |
| Sound controls | `site-sound-control.js` handles header control and dynamically loads audio; `site-scenes.js` also creates/updates scene sound UI and dynamically loads audio; storage `jr-site-ambient-muted-v3`, `jr-site-ambient-volume-v2` | Homepage explicitly loads sound-control in live; Git has changed placement/scoping. Competing UI ownership remains. `dark-music.js` is a compatibility shim that does not create playback nodes. Game `audio.js` and learning speech/lab tones are separate functional audio, not expendable ambient duplicates. |
| Search | `app.js` static `searchable` catalog, `#search-dialog`, `#search-input`, `#search-results`; learning search/filter logic in `knowledge.js` | Catalog URLs differ with the route reorganization. Separate global search and lesson search are useful, but shared route data should have one source. |
| Resilience/fallback | `site-resilience.js` image fallbacks/card/menu behavior; chess `boot.js` + `fallback-board.js`; Geometry worker error reporting; scene media/canvas fallbacks; `SiteAudio` play rejection handling | Preserve failure paths. `site-repair/site-resilience.*` is an alternate historical patch tree, not the standard root script. Do not remove fallback code merely because a happy-path test passes. |
| Handheld presentation | `app.js` dynamically loads `handheld-experience.js`/CSS; helper marks responsive modes and removes obsolete floating docks; game/lab controllers maintain separate controls | This helper intentionally skips games and certain lab wrappers. Root hamburger consolidation cannot replace dedicated game touch/controller handling. |

## Exact-build preservation records

- Current Evil Wizard `index.pck`: `ad3ca9d384f87565bc792945aa884dd20c6f2a84782257939f7a5fc756026588`.
- Adaptive preview PCK: `aaf7dd79b59d397db1fdca6c01090423b6a78485f22972f755312fb181690dc4`.
- Console preview PCK: `7c64ab80db32f6f0fa93893b11b0e58a0506ee8f7a9d838bd587e225bd2c3940`.
- Dated preview PCK: `88d84fee9950ce24cb2b22622f23189b122bbf59f030e0230ae5f20c01d4923c`.
- Shared WASM: `fc74679e3b97f76878947fcd4fbe1268cbfa6188182a2e33bbc3f5dc9bfa57d0`.
- Git chess `SOURCE_COMMIT.txt` pins `ed14050047cee8f11004c7a78c49136800342dd3`; live source marker differs. A marker is provenance evidence, not proof all deployed files belong to that commit.

See [dependency edges](audit-evidence/dependencies-expanded.json) for source paths and line numbers. Literal candidates include dormant code and must not be treated as a precise liveness graph. Full user interaction and OSU-server validation remain required.
''')

s=r'''
# WEBSITE 2.0 — live versus GitHub

Source baseline: fetched `origin/website-2.0-reconciliation` = `abf09c466cc06c4cfff8c62004e867972c52a878`; `origin/main` = `c8a34a8d90ac7556cd9e8f96efce62352791d989`. Only the earlier reconciliation document differs between those two trees. Local main remains unchanged at `ad48c33`.

The lists below are exhaustive for visible captured file paths. There are 181 byte-identical shared paths, 49 content differences, 167 live-only paths and 57 Git-only paths. Two live-only records are metadata-only and one directory cannot be enumerated. “Live-only” means absent from this branch, not necessarily absent everywhere on GitHub.

Every raw size, UTC mtime and SHA-256 is in [local inventory](audit-evidence/repository-inventory.json) and [live inventory](audit-evidence/live-inventory.json). [Committed Git blob inventory](audit-evidence/git-head-inventory.json) and [full comparison](audit-evidence/git-live-comparison.json) avoid Windows line-ending false positives. [Fetched main inventory](audit-evidence/git-main-inventory.json) records the separate remote-main baseline. Modified time is evidence of filesystem state, not authority.

## Import priority

1. Preserve canonical `games/evil-wizard/` as a complete release, including its `.htaccess`, touch console and both audio worklets.
2. Preserve live chess `shared-game.js` and the associated live controller versions as an intact snapshot before porting its state-preserving 2D/3D toggle into the expanded Git game.
3. Preserve the canonical fusion video and needed OSU downloads/media with exact hashes and reproducible retrieval; retain audio attribution and historical recordings until their replacement role is resolved.
4. Preserve the live generator, original documents and unique releases as source/archive material rather than blindly importing production clutter into the future runtime output.

Of 61 fetched portfolio branch tips, six branch-missing paths were found elsewhere: `agent-workbench.mjs`, `header-cleanup.css`, `labs/emergent.mjs`, `labs/qpe.mjs`, `learn-brand.css`, `lesson-header-controls.js`. See [branch membership](audit-evidence/live-only-branch-membership.json). This search checks path membership, not byte identity or all Git history. The two unreadable metadata-only paths were not included in that branch membership scan. Separate game repositories were not exhaustively audited.

## Same path, different committed bytes

All differences below require intentional version reconciliation, not “copy newer mtime.” Most page HTML changes accompany Git's new route structure and changed scene/audio scope. Chess is a substantive competing implementation. `geometric-lab/styles.css` also needs visual comparison. The data layer itself matches.

| Path | Git bytes | Live bytes |
|---|---:|---:|
'''
for x in paths('different'):s+=f"| {code(x['path'])} | {x['git']['size']} | {x['live']['size']} |\n"
s+='\n## Live-only paths and disposition\n\n| Path | Bytes | Proposed disposition (no action executed) |\n|---|---:|---|\n'
for x in paths('live-only'):s+=f"| {code(x['path'])} | {x['live']['size']} | {action(x['path'])} |\n"
s+='\n## Git-only paths\n\nThe three new HTML routes are future runtime, not cleanup. Game v6 modules need transitive-import review. Tests, tooling, package manifests, release ZIPs and audit docs belong in source control but should not be copied wholesale into production.\n\n'
s+='\n'.join('- '+code(x['path']) for x in paths('git-only'))+'\n'
s+='\n## Identical committed-byte paths\n\nThese files are safe to preserve without content reconciliation; identical content does not by itself authorize deleting a copy.\n\n'
s+='\n'.join('- '+code(x['path']) for x in paths('identical'))+'\n'
write('WEBSITE-2.0-LIVE-VS-GITHUB.md',s)

s=r'''
# WEBSITE 2.0 — cleanup candidates

No cleanup was executed. This document is a review queue, not a deletion script. Production is unchanged. Preserve complete recoverable copies, classify dependencies and validate replacements before considering removal.

## Decisions by category

| Category | Evidence | Disposition and prerequisite |
|---|---|---|
| Duplicate fusion video | Both paths have identical SHA-256; assets/ URL is selected by the fusion page | Keep assets/ version; archive root duplicate after public URL/consumer review and retrieval verification. Potential removable duplicate bytes: 168,678,432, not an approved deletion. |
| Three alternate Evil Wizard exports | Same WASM, different PCKs and launcher/controller versions | Archive each distinct release as a unit after comparison and recovery validation. Do not deduplicate PCKs or replace the current game. |
| `games/3d-battle-chess-v8/` | Separate preview entrypoint and modules | Preserve milestone outside future runtime if no public route needs it; not proven obsolete by name. |
| `games/battle-chess/` | Missing main/style/imported modules; canonical catalog uses 3d-battle-chess | Archive incomplete historical implementation with source provenance. Do not use it as fallback for current chess. |
| `_before_*`, `_safe_patch_backup_*`, `backup-*`, `*.bak`, `*.before-*`, `projects-before-*` | Historical naming plus distinct hashes and internal backup references | Archive unique versions outside production. Internal links among backups do not establish current runtime use, but must be preserved within archives. |
| Nested `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/` | Six old runtime files plus release docs/generator in containing directory | Preserve complete v0.3.0 archive; exclude nested public_html from future release output. It is not the current learning platform. |
| Root ZIP overlays / install packages | Live-only archives; contents not extracted in this pass | Archive intact, then inspect internal manifests before deduplication/deletion. Equal names or archive sizes do not prove equivalence. |
| `_shellfish_uploading_4336159125157019876` | 210,000-byte temporary-upload name; reads denied | Eventual cleanup candidate only after confirming abandoned upload and recovering any unique content. |
| `Thumbs.db` | Windows thumbnail cache | Exclude from future runtime package; retain current tree until reviewed cleanup. |
| `project-sources/evil-wizard/`, `build_data.py`, source `.mjs` alternatives | Source/generation material; six Godot source files identical to Git | Keep maintainable source in authoritative repository/archive; exclude from runtime only when no download/link requires it. |
| `site-repair/site-resilience.*` | Alternate patch implementation, root scripts are current entrypoints | Archive old patch tree after all callers/build scripts are accounted for. |
| `.github`, `tests`, `tools`, `release-upload` on live | Directories are present, but readable metadata shows no files there | No content deletion recommendation inferred from directory names. Repository equivalents contain CI/source tooling and should be excluded from runtime output. |
| Root OSU photos/resumes/logos, `assets/Recovery_Readiness_Auditor.zip`, audio collection | Live-only assets or duplicate candidates with possible legacy consumers | Preserve/import or archive with provenance. No generic “old assets” deletion. `quantum2.jpg` cannot be hashed. |
| Credits/methods/font licenses | Some `.md`/`.txt` files have live links and/or license obligations | Explicit keep exceptions to extension-based cleanup. |

## Old tooling in the source repository

Keep these in source/history for this phase. The active deployment direction should become one maintained runtime manifest builder and one tested deployer. Current `tools/deploy_osu_live.py` protects host experiences by omission; that protection must remain until assets are reproducible. Other similarly named deployment tools and patch/install/fix scripts need caller/workflow review before archival. The archive/import workflows in `.github/workflows/` reference historical release branches and scripts, so simply deleting tools would break those historical workflows.

'''
tools=[x['path'] for x in read('git-head-inventory') if x['path'].startswith('tools/')]
s+='\n'.join('- '+code(p) for p in tools)+'\n'
s+='\n## Exhaustive naming-based live candidate queue\n\nThis initial classifier found 99 files. It deliberately over-includes linked credits/methods, which must stay available. Extra preview/game/video categories above are not all captured by this filename classifier. Inbound counts include historical/test references and are not liveness proof.\n\n| Path | Bytes | Captured inbound edges | Decision |\n|---|---:|---:|---|\n'
for x in read('cleanup-candidates'):
    p=x['path']; decision='KEEP: referenced runtime documentation' if p in ['geometric-lab/CREDITS.md','geometric-lab/METHODS.md'] else action(p)
    s+=f"| {code(p)} | {x['size']} | {len(x['incoming'])} | {decision} |\n"
s+='\n## Exact duplicate groups\n\nThe [42-group hash ledger](audit-evidence/duplicates.json) lists all cross-path duplicate groups. Shared engine/worklet files, copied combat modules, brand assets and backup content can have identical bytes while still being needed at different runtime paths. No deletion is justified solely by belonging to a group.\n\n'
s+='## Release gate before eventual removal\n\nResolve inaccessible files; preserve unique contents and source provenance; verify archive restoration; establish all active URLs and module/data dependencies; provide replacements or redirects where needed; validate desktop/mobile/game/audio/science behaviors on a complete staging release; and review a concrete file-by-file removal manifest. Until then, retain every current production file.\n'
write('WEBSITE-2.0-CLEANUP-CANDIDATES.md',s)
print('Wrote four audit reports.')
