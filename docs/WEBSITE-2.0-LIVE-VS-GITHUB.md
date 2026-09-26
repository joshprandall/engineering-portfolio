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
| `app.js` | 15097 | 15042 |
| `games/3d-battle-chess/battle.js` | 23066 | 13496 |
| `games/3d-battle-chess/boot.js` | 595 | 1245 |
| `games/3d-battle-chess/CREDITS.md` | 945 | 949 |
| `games/3d-battle-chess/DEPLOYMENT.md` | 3531 | 3539 |
| `games/3d-battle-chess/duels.js` | 124 | 139 |
| `games/3d-battle-chess/engine.js` | 10149 | 8547 |
| `games/3d-battle-chess/fallback-board.js` | 4999 | 5159 |
| `games/3d-battle-chess/index.html` | 8331 | 3496 |
| `games/3d-battle-chess/README.md` | 2043 | 1982 |
| `games/3d-battle-chess/SOURCE_COMMIT.txt` | 298 | 192 |
| `games/3d-battle-chess/styles.css` | 12967 | 4800 |
| `games/battle-chess/index.html` | 8364 | 7092 |
| `geometric-lab/styles.css` | 11381 | 10805 |
| `index.html` | 27301 | 28995 |
| `knowledge.js` | 191179 | 191107 |
| `learn-browse.html` | 21635 | 21461 |
| `learn-capstones.html` | 1578 | 1519 |
| `learn-glossary.html` | 21640 | 21466 |
| `learn-labs.html` | 21634 | 21460 |
| `learn-map.html` | 21630 | 21456 |
| `learn-mastery.html` | 21629 | 21455 |
| `learn-paths.html` | 19927 | 19735 |
| `learn-practice.html` | 21630 | 21456 |
| `learn-verify.html` | 21632 | 21458 |
| `learn.html` | 21730 | 21541 |
| `play-evil-wizard.html` | 7646 | 7608 |
| `project-advanced-computing.html` | 4992 | 4940 |
| `project-asset-inventory.html` | 4709 | 4657 |
| `project-battle-chess.html` | 8814 | 8768 |
| `project-dependency.html` | 6137 | 6085 |
| `project-emergent.html` | 5965 | 5913 |
| `project-fusion.html` | 5253 | 5201 |
| `project-geometric-ai.html` | 5373 | 5321 |
| `project-kubernetes-lab.html` | 4698 | 4646 |
| `project-learning-library.html` | 4919 | 4867 |
| `project-lifecycle.html` | 6210 | 6158 |
| `project-mind.html` | 5263 | 5211 |
| `project-portfolio.html` | 5362 | 5310 |
| `project-qpe.html` | 6107 | 6055 |
| `project-qubit.html` | 5025 | 4973 |
| `project-recovery.html` | 5811 | 5759 |
| `projects.html` | 14919 | 15703 |
| `resume.html` | 19289 | 19197 |
| `site-audio.js` | 18710 | 16654 |
| `site-resilience.js` | 5965 | 5643 |
| `site-scenes.css` | 53262 | 53361 |
| `site-scenes.js` | 44070 | 43376 |
| `site-sound-control.js` | 7101 | 6958 |

## Live-only paths and disposition

| Path | Bytes | Proposed disposition (no action executed) |
|---|---:|---|
| `_before_game_learning_patch_20260924-060952/games/3d-battle-chess/index.html` | 3447 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/games/3d-battle-chess/styles.css` | 3868 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/games/evil-wizard/play.html` | 22376 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/knowledge.css` | 93255 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/learn.html` | 21124 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/play-evil-wizard.html` | 6248 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/project-battle-chess.html` | 7436 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/projects.html` | 14767 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_game_learning_patch_20260924-060952/styles.css` | 20030 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_true_glass_20260924-061812/games/3d-battle-chess/index.html` | 4767 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_true_glass_20260924-061812/games/3d-battle-chess/styles.css` | 4324 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_true_glass_20260924-061812/games/evil-wizard/play.html` | 22883 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_true_glass_20260924-061812/play-evil-wizard.html` | 6871 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_true_glass_20260924-061812/project-battle-chess.html` | 7813 | Archive after provenance and recovery verification; not authorized for deletion |
| `_before_true_glass_20260924-061812/projects.html` | 14768 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/games/3d-battle-chess/battle.js` | 12557 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/games/3d-battle-chess/index.html` | 3447 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/games/3d-battle-chess/styles.css` | 3868 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/games/evil-wizard/play.html` | 22376 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/knowledge.css` | 93255 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/learn.html` | 21124 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/play-evil-wizard.html` | 6248 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/project-battle-chess.html` | 7436 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/projects.html` | 14767 | Archive after provenance and recovery verification; not authorized for deletion |
| `_safe_patch_backup_20260924-060626/styles.css` | 20030 | Archive after provenance and recovery verification; not authorized for deletion |
| `_shellfish_uploading_4336159125157019876` | 210000 | Unfinished-upload candidate; unreadable content, do not delete yet |
| `3d-battle-chess-osu-deploy.zip` | 11368 | Inspect package manifest and preserve externally before removing production copy |
| `agent-workbench.mjs` | 5227 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `ASIMOV.jpg` | 44143 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `assets/audio/beach-birds.mp3` | 1579968 | Preserve audio and provenance; establish active versus historical role before import/archive |
| `assets/audio/beach-waves.mp3` | 4107072 | Preserve audio and provenance; establish active versus historical role before import/archive |
| `assets/audio/beach.mp3` | 2303040 | Preserve audio and provenance; establish active versus historical role before import/archive |
| `assets/audio/dark-theme.mp3` | 8477884 | Preserve audio and provenance; establish active versus historical role before import/archive |
| `assets/audio/README.txt` | 194 | Preserve audio and provenance; establish active versus historical role before import/archive |
| `assets/audio/river.mp3` | 352183 | Preserve audio and provenance; establish active versus historical role before import/archive |
| `assets/audio/waterfall.mp3` | 280503 | Preserve audio and provenance; establish active versus historical role before import/archive |
| `assets/fusion-presentation.mp4` | 168678432 | Preserve canonical assets/ video; archive duplicate root copy only after URL migration |
| `assets/Recovery_Readiness_Auditor.zip` | 8597 | Inspect package manifest and preserve externally before removing production copy |
| `audio-diagnostic.html` | 3471 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `backup-20260923-1119/site-resilience.css` | 4613 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-20260923-1119/site-resilience.js` | 2250 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-cosmos-20260923/index.html` | 16701 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-cosmos-20260923/portfolio-next.css` | 16733 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-cosmos-20260923/portfolio-next.js` | 25240 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-cosmos-labels-20260923/index.html` | 16701 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-cosmos-labels-20260923/portfolio-next.css` | 17648 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-cosmos-labels-20260923/portfolio-next.js` | 25468 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-theme-20260923/app.js` | 11403 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-theme-20260923/index.html` | 16629 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-theme-20260923/portfolio-next.css` | 6917 | Archive after provenance and recovery verification; not authorized for deletion |
| `backup-theme-20260923/portfolio-next.js` | 17618 | Archive after provenance and recovery verification; not authorized for deletion |
| `build_data.py` | 161308 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `DEPLOYMENT_READ_FIRST.txt` | 2373 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `fusion-presentation.mp4` | 168678432 | Preserve canonical assets/ video; archive duplicate root copy only after URL migration |
| `games/3d-battle-chess-v8/combat-v8/animation-runtime.js` | 2287 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/attack-executor.js` | 3501 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/attacks.js` | 5672 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/character-definitions.js` | 5385 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/character-factory.js` | 3640 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/character-visuals.js` | 8879 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/choreography.js` | 5591 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/collision.js` | 1084 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/combat-director.js` | 4152 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/defeat-choreography.js` | 976 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/effects.js` | 9126 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/physics.js` | 765 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/reactions.js` | 1492 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/combat-v8/rig-types.js` | 8049 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/index.html` | 2180 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/pieces.js` | 7347 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/v8-preview.css` | 2250 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess-v8/v8-preview.js` | 4459 | Preserve preview separately; compare complete module graph before archiving |
| `games/3d-battle-chess/_before_2d3d_fix_20260924-064833/battle.js` | 12557 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/_before_2d3d_fix_20260924-064833/index.html` | 4767 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/_before_2d3d_fix_20260924-064922/battle.js` | 12557 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/_before_2d3d_fix_20260924-064922/index.html` | 4767 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/battle.js.bak` | 12557 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/index.before-navigation.html` | 3104 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/index.html.bak` | 3447 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/3d-battle-chess/shared-game.js` | 74 | Preserve/import with live toggle implementation; do not mix game versions |
| `games/3d-battle-chess/styles.before-navigation.css` | 3868 | Archive after provenance and recovery verification; not authorized for deletion |
| `games/evil-wizard-adaptive-preview-v23/console-champions.js` | 9430 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-adaptive-preview-v23/console.html` | 13468 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-adaptive-preview-v23/index.apple-touch-icon.png` | 11944 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-adaptive-preview-v23/index.audio.position.worklet.js` | 2973 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-adaptive-preview-v23/index.audio.worklet.js` | 7298 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-adaptive-preview-v23/index.html` | 5454 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-adaptive-preview-v23/index.icon.png` | 5700 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-adaptive-preview-v23/index.js` | 279815 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-adaptive-preview-v23/index.pck` | 4385808 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-adaptive-preview-v23/index.png` | 21443 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-adaptive-preview-v23/index.wasm` | 39514754 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-adaptive-preview-v23/play.html` | 3374 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-console-20260922/console-champions.js` | 2619 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-console-20260922/console.html` | 13233 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-console-20260922/index.apple-touch-icon.png` | 11944 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-console-20260922/index.audio.position.worklet.js` | 2973 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-console-20260922/index.audio.worklet.js` | 7298 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-console-20260922/index.html` | 5454 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-console-20260922/index.icon.png` | 5700 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-console-20260922/index.js` | 279815 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-console-20260922/index.pck` | 4375160 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-console-20260922/index.png` | 21443 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-console-20260922/index.wasm` | 39514754 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-preview-20260922-163345/console-champions.js` | 9430 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-preview-20260922-163345/console.html` | 13233 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-preview-20260922-163345/index.apple-touch-icon.png` | 11944 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-preview-20260922-163345/index.audio.position.worklet.js` | 2973 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-preview-20260922-163345/index.audio.worklet.js` | 7298 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-preview-20260922-163345/index.html` | 5454 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-preview-20260922-163345/index.icon.png` | 5700 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-preview-20260922-163345/index.js` | 279815 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-preview-20260922-163345/index.pck` | 4378404 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-preview-20260922-163345/index.png` | 21443 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard-preview-20260922-163345/index.wasm` | 39514754 | Archive distinct export as a unit after build/play comparison; PCK differs |
| `games/evil-wizard/.htaccess` | 476 | Preserve/import complete current export, including server config and launcher |
| `games/evil-wizard/console-champions.js` | 3323 | Preserve/import complete current export, including server config and launcher |
| `games/evil-wizard/console.html` | 18101 | Preserve/import complete current export, including server config and launcher |
| `games/evil-wizard/index.apple-touch-icon.png` | 11944 | Preserve/import complete current export, including server config and launcher |
| `games/evil-wizard/index.audio.position.worklet.js` | 2973 | Preserve/import complete current export, including server config and launcher |
| `games/evil-wizard/index.audio.worklet.js` | 7298 | Preserve/import complete current export, including server config and launcher |
| `games/evil-wizard/index.html` | 5454 | Preserve/import complete current export, including server config and launcher |
| `games/evil-wizard/index.icon.png` | 5700 | Preserve/import complete current export, including server config and launcher |
| `games/evil-wizard/index.js` | 279815 | Preserve/import complete current export, including server config and launcher |
| `games/evil-wizard/index.pck` | 4398232 | Preserve/import complete current export, including server config and launcher |
| `games/evil-wizard/index.png` | 21443 | Preserve/import complete current export, including server config and launcher |
| `games/evil-wizard/index.wasm` | 39514754 | Preserve/import complete current export, including server config and launcher |
| `games/evil-wizard/play.html` | 23930 | Preserve/import complete current export, including server config and launcher |
| `header-cleanup.css` | 684 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/build_data.py` | 261822 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/index.html` | 15585 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/knowledge-data.js` | 329354 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/knowledge.css` | 32910 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/knowledge.js` | 70936 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/learn.html` | 12448 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/projects.html` | 19175 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/public_html/README_KNOWLEDGE_PLATFORM.txt` | 2943 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/README_FIRST.txt` | 2943 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/RELEASE_NOTES_v0.3.0.txt` | 1014 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_Knowledge_Platform_v0.3.0/VALIDATION_v0.3.0.txt` | 1373 | Archive source/generator with release provenance; exclude nested deployment from future runtime |
| `Joshua_Randall_MASTER_RESUME_L.docx` | 37409 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `Joshua_Randall_OSU_Reconciled_Site_Overlay_FINAL.zip` | 5151787 | Inspect package manifest and preserve externally before removing production copy |
| `Joshua_Randall_Portfolio_vNext_Review_Overlay.zip` | 634699 | Inspect package manifest and preserve externally before removing production copy |
| `Joshua_Randall_Resume(2).pdf` | 4253 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `joshua-randall.jpg` | 308295 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `knowledge.js.bak` | 187562 | Archive after provenance and recovery verification; not authorized for deletion |
| `labs/emergent.mjs` | 4780 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `labs/qpe.mjs` | 3883 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `learn-brand.css` | 1396 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `learn.html.bak` | 21048 | Archive after provenance and recovery verification; not authorized for deletion |
| `learn.html.before-header-type-20260924-062338` | 21045 | Archive after provenance and recovery verification; not authorized for deletion |
| `learning-depth.js.bak` | 9733 | Archive after provenance and recovery verification; not authorized for deletion |
| `lesson-header-controls.js` | 1099 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `osu-logo.png` | 10683 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `project-battle-chess.html.before-clear-glass-20260924-062614` | 8854 | Archive after provenance and recovery verification; not authorized for deletion |
| `projects-before-battle-chess.html` | 11242 | Archive after provenance and recovery verification; not authorized for deletion |
| `projects-before-chess-source.html` | 11718 | Archive after provenance and recovery verification; not authorized for deletion |
| `projects-before-source-arrow.html` | 11851 | Archive after provenance and recovery verification; not authorized for deletion |
| `projects-qubit-backup-20260921-224301.html` | 19934 | Archive after provenance and recovery verification; not authorized for deletion |
| `projects.backup-before-game-20260913-110537.html` | 19193 | Archive after provenance and recovery verification; not authorized for deletion |
| `projects.backup-before-web-game-20260913-114339.html` | 19814 | Archive after provenance and recovery verification; not authorized for deletion |
| `quantum2.jpg` | 147787 | Unreadable content: retain; no duplicate conclusion |
| `README_DEPLOY_THIS_EXACTLY.txt` | 1207 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `README_FIRST.txt` | 6121 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `RELEASE_NOTES_v0.2.0.txt` | 1232 | Preserve and review references/provenance; no automatic overwrite or deletion |
| `Thumbs.db` | 46080 | Eventual runtime exclusion after archive; not a site asset |
| `VALIDATION_v0.2.0.txt` | 1233 | Preserve and review references/provenance; no automatic overwrite or deletion |

## Git-only paths

The three new HTML routes are future runtime, not cleanup. Game v6 modules need transitive-import review. Tests, tooling, package manifests, release ZIPs and audit docs belong in source control but should not be copied wholesale into production.

- `.github/workflows/build-osu-overlay.yml`
- `.github/workflows/import-knowledge-release.yml`
- `.github/workflows/import-verified-battle-chess.yml`
- `.github/workflows/import-vnext-foundations.yml`
- `.github/workflows/validate.yml`
- `.gitignore`
- `DEPLOYMENT.md`
- `docs/WEBSITE-2.0-RECONCILIATION.md`
- `expertise-experience.html`
- `game-development.html`
- `games/3d-battle-chess/combatants-v6.js`
- `games/3d-battle-chess/duels-v6.js`
- `games/3d-battle-chess/STEAM-ROADMAP.md`
- `lesson.html`
- `package-lock.json`
- `package.json`
- `README.md`
- `RECONCILIATION_NOTES.md`
- `RELEASE_SYNC_STEPS.md`
- `release-upload/.gitkeep`
- `release-upload/Joshua_Randall_Knowledge_Platform_v1.1.0_DEEP_LEARNING_EDITION.zip`
- `release-upload/Joshua_Randall_Portfolio_vNext_Foundations_RC_20260922.zip`
- `SITE_IMPORT_REPORT.json`
- `tests/appearance.test.cjs`
- `tests/browser.test.cjs`
- `tests/site.test.mjs`
- `tests/test_deploy.py`
- `tools/deploy_education_logos_live.py`
- `tools/deploy_osu_live.py`
- `tools/deploy_osu_vnext.py`
- `tools/deploy_vnext_complete_20260922.sh`
- `tools/deploy_vnext_osu_verified.py`
- `tools/deploy_vnext_osu.py`
- `tools/deploy-osu-vnext.py`
- `tools/deploy-vnext-osu.py`
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
- `tools/install_site_audio_v12_1.py`
- `tools/install_site_audio_v12.py`
- `tools/install_site_audio_v13.py`
- `tools/patch_social_previews_osu.py`
- `tools/repair_audio_v13_1.py`
- `tools/repair-osu-portfolio.py`
- `tools/swap_portrait_solar_v1.py`

## Identical committed-byte paths

These files are safe to preserve without content reconciliation; identical content does not by itself authorize deleting a copy.

- `agent-workbench.html`
- `agent-workbench.js`
- `assets/audio/dark-theme-user.mp3`
- `assets/audio/dark-theme-user.wav`
- `assets/favicon.svg`
- `assets/fonts/dm-sans-400.ttf`
- `assets/fonts/dm-sans-500.ttf`
- `assets/fonts/dm-sans-600.ttf`
- `assets/fonts/dm-sans-700.ttf`
- `assets/fonts/dmsans-OFL.txt`
- `assets/fonts/fonts.css`
- `assets/fonts/manrope-400.ttf`
- `assets/fonts/manrope-500.ttf`
- `assets/fonts/manrope-600.ttf`
- `assets/fonts/manrope-700.ttf`
- `assets/fonts/manrope-800.ttf`
- `assets/fonts/manrope-OFL.txt`
- `assets/Joshua_Randall_Master_Resume.docx`
- `assets/joshua-randall-cutout.svg`
- `assets/joshua-randall-cutout.webp`
- `assets/joshua-randall-headshot.jpg`
- `assets/osu-logo.png`
- `assets/portrait.jpg`
- `assets/quantum-field-notes.jpg`
- `assets/quantum-lab-reference.jpg`
- `assets/quantum2.jpg`
- `assets/scenes/CREDITS.md`
- `assets/scenes/LIVING_SCENES_SOURCES.md`
- `assets/scenes/mountain-valley.svg`
- `assets/scenes/webb-cosmic-cliffs.webp`
- `assets/systems-lab.jpg`
- `dark-music.js`
- `deep-learning/advanced/architecture.json`
- `deep-learning/advanced/distributed-systems.json`
- `deep-learning/advanced/gpu-computing.json`
- `deep-learning/advanced/gpu.json`
- `deep-learning/advanced/hpc.json`
- `deep-learning/advanced/lab.json`
- `deep-learning/advanced/memory.json`
- `deep-learning/advanced/operating-systems.json`
- `deep-learning/advanced/parallel-computing.json`
- `deep-learning/advanced/quantum.json`
- `deep-learning/cloud/automation.json`
- `deep-learning/cloud/cloud.json`
- `deep-learning/cloud/identity.json`
- `deep-learning/cloud/kubernetes.json`
- `deep-learning/cloud/lab.json`
- `deep-learning/cloud/linux.json`
- `deep-learning/cloud/networking.json`
- `deep-learning/cloud/observability.json`
- `deep-learning/cloud/recovery.json`
- `deep-learning/cloud/windows-identity.json`
- `deep-learning/cyber/application-security.json`
- `deep-learning/cyber/architecture.json`
- `deep-learning/cyber/detection.json`
- `deep-learning/cyber/endpoint.json`
- `deep-learning/cyber/foundations.json`
- `deep-learning/cyber/governance.json`
- `deep-learning/cyber/identity.json`
- `deep-learning/cyber/lab.json`
- `deep-learning/cyber/network-security.json`
- `deep-learning/cyber/recovery.json`
- `deep-learning/cyber/risk.json`
- `deep-learning/index.json`
- `deep-learning/leadership/capacity.json`
- `deep-learning/leadership/finance.json`
- `deep-learning/leadership/governance.json`
- `deep-learning/leadership/incidents.json`
- `deep-learning/leadership/itsm.json`
- `deep-learning/leadership/lab.json`
- `deep-learning/leadership/leadership.json`
- `deep-learning/leadership/operations.json`
- `deep-learning/leadership/projects.json`
- `deep-learning/leadership/recovery.json`
- `deep-learning/leadership/reliability.json`
- `deep-learning/leadership/risk.json`
- `deep-learning/leadership/strategy.json`
- `deep-learning/leadership/teams.json`
- `deep-learning/leadership/vendors.json`
- `deep-learning/math/algebra.json`
- `deep-learning/math/calculus.json`
- `deep-learning/math/discrete-math.json`
- `deep-learning/math/functions.json`
- `deep-learning/math/lab.json`
- `deep-learning/math/linear-algebra.json`
- `deep-learning/math/numerical-methods.json`
- `deep-learning/math/probability.json`
- `deep-learning/math/sequences.json`
- `deep-learning/math/trigonometry.json`
- `deep-learning/physics/electricity.json`
- `deep-learning/physics/energy.json`
- `deep-learning/physics/lab.json`
- `deep-learning/physics/magnetism.json`
- `deep-learning/physics/mechanics.json`
- `deep-learning/physics/modern-physics.json`
- `deep-learning/physics/momentum.json`
- `deep-learning/physics/quantum.json`
- `deep-learning/physics/rotation.json`
- `deep-learning/physics/thermodynamics.json`
- `deep-learning/physics/waves.json`
- `deep-learning/software/algorithms.json`
- `deep-learning/software/apis.json`
- `deep-learning/software/architecture.json`
- `deep-learning/software/data-structures.json`
- `deep-learning/software/databases.json`
- `deep-learning/software/devops.json`
- `deep-learning/software/lab.json`
- `deep-learning/software/programming.json`
- `deep-learning/software/testing.json`
- `deep-learning/video-profiles.json`
- `games/3d-battle-chess/attacks.js`
- `games/3d-battle-chess/audio.js`
- `games/3d-battle-chess/castle-controls.js`
- `games/3d-battle-chess/characters.js`
- `games/3d-battle-chess/combat-physics.js`
- `games/3d-battle-chess/combat-v8/animation-runtime.js`
- `games/3d-battle-chess/combat-v8/attack-executor.js`
- `games/3d-battle-chess/combat-v8/attacks.js`
- `games/3d-battle-chess/combat-v8/character-definitions.js`
- `games/3d-battle-chess/combat-v8/character-factory.js`
- `games/3d-battle-chess/combat-v8/character-visuals.js`
- `games/3d-battle-chess/combat-v8/choreography.js`
- `games/3d-battle-chess/combat-v8/collision.js`
- `games/3d-battle-chess/combat-v8/combat-director.js`
- `games/3d-battle-chess/combat-v8/defeat-choreography.js`
- `games/3d-battle-chess/combat-v8/effects.js`
- `games/3d-battle-chess/combat-v8/physics.js`
- `games/3d-battle-chess/combat-v8/reactions.js`
- `games/3d-battle-chess/combat-v8/rig-types.js`
- `games/3d-battle-chess/combatants.js`
- `games/3d-battle-chess/duels-physics.js`
- `games/3d-battle-chess/duels-v8.js`
- `games/3d-battle-chess/fallback.css`
- `games/3d-battle-chess/pieces.js`
- `games/battle-chess/arena.js`
- `geometric-lab/app.js`
- `geometric-lab/assets/favicon.svg`
- `geometric-lab/benchmarks.js`
- `geometric-lab/CREDITS.md`
- `geometric-lab/index.html`
- `geometric-lab/math.js`
- `geometric-lab/METHODS.md`
- `geometric-lab/worker.js`
- `handheld-experience.css`
- `handheld-experience.js`
- `knowledge-data.js`
- `knowledge.css`
- `labs.css`
- `labs/emergent.js`
- `labs/qpe.js`
- `learning-capstones.css`
- `learning-capstones.js`
- `learning-capstones.json`
- `learning-depth.css`
- `learning-depth.js`
- `learning-next.css`
- `learning-next.js`
- `NEXT-RELEASE-NOTES.md`
- `portfolio-home.css`
- `portfolio-next.css`
- `portfolio-next.js`
- `project-sources/evil-wizard/project.godot`
- `project-sources/evil-wizard/README-source.md`
- `project-sources/evil-wizard/README.md`
- `project-sources/evil-wizard/scripts/game.gd`
- `project-sources/evil-wizard/scripts/movement_lab.gd`
- `project-sources/evil-wizard/scripts/player.gd`
- `quantum-cube.js`
- `qubit-preview-20260921/app.js`
- `qubit-preview-20260921/index.html`
- `qubit-preview-20260921/qubit.js`
- `qubit-preview-20260921/styles.css`
- `README_KNOWLEDGE_PLATFORM.txt`
- `science-experiments.css`
- `science-experiments.js`
- `site-repair/site-resilience.css`
- `site-repair/site-resilience.js`
- `site-resilience.css`
- `site-theme.js`
- `styles.css`
- `verification-manifest.json`
