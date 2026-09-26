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
