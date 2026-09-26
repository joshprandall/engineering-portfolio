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

- `tools/deploy-osu-vnext.py`
- `tools/deploy-vnext-osu.py`
- `tools/deploy_education_logos_live.py`
- `tools/deploy_osu_live.py`
- `tools/deploy_osu_vnext.py`
- `tools/deploy_vnext_complete_20260922.sh`
- `tools/deploy_vnext_osu.py`
- `tools/deploy_vnext_osu_verified.py`
- `tools/fix_dark_audio_ios_v8.py`
- `tools/fix_global_audio_motion_v4.py`
- `tools/fix_mobile_headshot_position_v2.py`
- `tools/fix_persistent_ambient_v5.py`
- `tools/fix_real_theme_audio_v6.py`
- `tools/fix_solar_orbits_v10.py`
- `tools/fix_solar_orbits_v11.py`
- `tools/import_knowledge_release.py`
- `tools/import_vnext_foundations.py`
- `tools/install_audio_cap15.py`
- `tools/install_audio_diagnostic.py`
- `tools/install_cc0_dark_space_audio_v7.py`
- `tools/install_dark_audio_v11.py`
- `tools/install_dark_music_v10.py`
- `tools/install_dark_music_v9.py`
- `tools/install_site_audio_v12.py`
- `tools/install_site_audio_v12_1.py`
- `tools/install_site_audio_v13.py`
- `tools/patch_social_previews_osu.py`
- `tools/repair-osu-portfolio.py`
- `tools/repair_audio_v13_1.py`
- `tools/swap_portrait_solar_v1.py`

## Exhaustive naming-based live candidate queue

This initial classifier found 99 files. It deliberately over-includes linked credits/methods, which must stay available. Extra preview/game/video categories above are not all captured by this filename classifier. Inbound counts include historical/test references and are not liveness proof.

| Path | Bytes | Captured inbound edges | Decision |
|---|---:|---:|---|
| `_before_game_learning_patch_20260924-060952/games/3d-battle-chess/index.html` | 3447 | 3 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/games/3d-battle-chess/styles.css` | 3868 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/games/evil-wizard/play.html` | 22376 | 2 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/knowledge.css` | 93255 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/learn.html` | 21124 | 5 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/play-evil-wizard.html` | 6248 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/project-battle-chess.html` | 7436 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/projects.html` | 14767 | 7 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/styles.css` | 20030 | 3 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_true_glass_20260924-061812/games/3d-battle-chess/index.html` | 4767 | 3 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_true_glass_20260924-061812/games/3d-battle-chess/styles.css` | 4324 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_true_glass_20260924-061812/games/evil-wizard/play.html` | 22883 | 2 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_true_glass_20260924-061812/play-evil-wizard.html` | 6871 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_true_glass_20260924-061812/project-battle-chess.html` | 7813 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_true_glass_20260924-061812/projects.html` | 14768 | 4 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/games/3d-battle-chess/battle.js` | 12557 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/games/3d-battle-chess/index.html` | 3447 | 3 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/games/3d-battle-chess/styles.css` | 3868 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/games/evil-wizard/play.html` | 22376 | 2 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/knowledge.css` | 93255 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/learn.html` | 21124 | 5 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/play-evil-wizard.html` | 6248 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/project-battle-chess.html` | 7436 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/projects.html` | 14767 | 7 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/styles.css` | 20030 | 3 | Archive after provenance and recovery verification; not authorized for deletion |
| `3d-battle-chess-osu-deploy.zip` | 11368 | 0 | Inspect package manifest and preserve externally before removing production copy |
| `agent-workbench.mjs` | 5227 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `assets/audio/README.txt` | 194 | 0 | Preserve audio and provenance; establish active versus historical role before import/archive |
| `assets/Recovery_Readiness_Auditor.zip` | 8597 | 0 | Inspect package manifest and preserve externally before removing production copy |
| `assets/scenes/CREDITS.md` | 762 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `assets/scenes/LIVING_SCENES_SOURCES.md` | 1915 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `backup-20260923-1119/site-resilience.css` | 4613 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-20260923-1119/site-resilience.js` | 2250 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-cosmos-20260923/index.html` | 16701 | 4 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-cosmos-20260923/portfolio-next.css` | 16733 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-cosmos-20260923/portfolio-next.js` | 25240 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-cosmos-labels-20260923/index.html` | 16701 | 4 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-cosmos-labels-20260923/portfolio-next.css` | 17648 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-cosmos-labels-20260923/portfolio-next.js` | 25468 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-theme-20260923/app.js` | 11403 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-theme-20260923/index.html` | 16629 | 4 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-theme-20260923/portfolio-next.css` | 6917 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-theme-20260923/portfolio-next.js` | 17618 | 1 | Archive after provenance and recovery verification; not authorized for deletion |
| `build_data.py` | 161308 | 0 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `DEPLOYMENT_READ_FIRST.txt` | 2373 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `games/3d-battle-chess/_before_2d3d_fix_20260924-064833/battle.js` | 12557 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/_before_2d3d_fix_20260924-064833/index.html` | 4767 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/_before_2d3d_fix_20260924-064922/battle.js` | 12557 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/_before_2d3d_fix_20260924-064922/index.html` | 4767 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/battle.js.bak` | 12557 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/CREDITS.md` | 949 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `games/3d-battle-chess/DEPLOYMENT.md` | 3539 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `games/3d-battle-chess/index.before-navigation.html` | 3104 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/index.html.bak` | 3447 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/README.md` | 1982 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `games/3d-battle-chess/styles.before-navigation.css` | 3868 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `geometric-lab/CREDITS.md` | 3209 | 2 | KEEP: referenced runtime documentation |
| `geometric-lab/METHODS.md` | 6779 | 1 | KEEP: referenced runtime documentation |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/build_data.py` | 261822 | 0 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/index.html` | 15585 | 12 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/knowledge-data.js` | 329354 | 1 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/knowledge.css` | 32910 | 1 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/knowledge.js` | 70936 | 1 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/learn.html` | 12448 | 6 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/projects.html` | 19175 | 8 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/README_KNOWLEDGE_PLATFORM.txt` | 2943 | 0 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/README_FIRST.txt` | 2943 | 0 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/RELEASE_NOTES_v0.3.0.txt` | 1014 | 0 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/VALIDATION_v0.3.0.txt` | 1373 | 0 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_OSU_Reconciled_Site_Overlay_FINAL.zip` | 5151787 | 0 | Inspect package manifest and preserve externally before removing production copy |
| `Joshua_Randall_Portfolio_vNext_Review_Overlay.zip` | 634699 | 0 | Inspect package manifest and preserve externally before removing production copy |
| `knowledge.js.bak` | 187562 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `labs/emergent.mjs` | 4780 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `labs/qpe.mjs` | 3883 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `learn.html.bak` | 21048 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `learn.html.before-header-type-20260924-062338` | 21045 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `learning-depth.js.bak` | 9733 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `NEXT-RELEASE-NOTES.md` | 5711 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `project-battle-chess.html.before-clear-glass-20260924-062614` | 8854 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `project-sources/evil-wizard/project.godot` | 8169 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `project-sources/evil-wizard/README-source.md` | 23478 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `project-sources/evil-wizard/README.md` | 960 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `project-sources/evil-wizard/scripts/game.gd` | 95806 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `project-sources/evil-wizard/scripts/movement_lab.gd` | 6549 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `project-sources/evil-wizard/scripts/player.gd` | 115701 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `projects-before-battle-chess.html` | 11242 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `projects-before-chess-source.html` | 11718 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `projects-before-source-arrow.html` | 11851 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `projects-qubit-backup-20260921-224301.html` | 19934 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `projects.backup-before-game-20260913-110537.html` | 19193 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `projects.backup-before-web-game-20260913-114339.html` | 19814 | 0 | Archive after provenance and recovery verification; not authorized for deletion |
| `README_DEPLOY_THIS_EXACTLY.txt` | 1207 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `README_FIRST.txt` | 6121 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `README_KNOWLEDGE_PLATFORM.txt` | 1248 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `RELEASE_NOTES_v0.2.0.txt` | 1232 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `site-repair/site-resilience.css` | 1748 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `site-repair/site-resilience.js` | 2785 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `Thumbs.db` | 46080 | 0 | Eventual runtime exclusion after archive; not a site asset |
| `VALIDATION_v0.2.0.txt` | 1233 | 0 | Preserve and review references/provenance; no automatic overwrite or deletion |

## Exact duplicate groups

The [42-group hash ledger](audit-evidence/duplicates.json) lists all cross-path duplicate groups. Shared engine/worklet files, copied combat modules, brand assets and backup content can have identical bytes while still being needed at different runtime paths. No deletion is justified solely by belonging to a group.

## Release gate before eventual removal

Resolve inaccessible files; preserve unique contents and source provenance; verify archive restoration; establish all active URLs and module/data dependencies; provide replacements or redirects where needed; validate desktop/mobile/game/audio/science behaviors on a complete staging release; and review a concrete file-by-file removal manifest. Until then, retain every current production file.
