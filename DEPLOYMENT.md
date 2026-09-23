# Science-experiment portfolio: OSU deployment

This repository combines the portfolio, Knowledge Platform, interactive science labs, and protected game/Geometric AI experiences. GitHub `main` is the source of truth, but it is not itself the live OSU site.

The current deployment rule is intentionally conservative: update the science/portfolio/learning layers while leaving Battle Chess, Evil Wizard, and the Geometry & Physics / Geometric AI experience untouched on the OSU host.

## Protected live experiences

Do not overwrite or delete these during this release:

- `games/3d-battle-chess/`
- `games/evil-wizard/`
- `geometric-lab/`
- `project-battle-chess.html`
- `project-geometric-ai.html`
- `play-evil-wizard.html`
- `assets/fusion-presentation.mp4` when present

The science-safe overlay omits those paths by construction. The backup-first deployment utility also skips them.

## Preferred deployment

1. Verify the live protected sentinels exist:
   - `~/public_html/games/3d-battle-chess/index.html`
   - `~/public_html/games/evil-wizard/index.html`
   - `~/public_html/geometric-lab/index.html`
   - the three protected root project/launcher pages listed above.
2. Create and retain a full `public_html` backup outside the web root.
3. Use the latest successful **Build OSU science-safe overlay** artifact, or run `tools/deploy_osu_live.py` from an authenticated OSU shell. The utility downloads the exact validated site commit, copies only approved root/science/learning files, validates the result, and restores the backup automatically on failure.
4. Never replace or delete the `public_html` directory itself. Merge files into the existing directory.
5. Verify on the public URL:
   - homepage and animated Connected Systems solar system;
   - Projects catalog and project experiment consoles;
   - Learn search/content;
   - pure-state qubit controls and sampling;
   - QPE, Emergent Systems, and Project MIND;
   - phone/tablet navigation;
   - unchanged Battle Chess, Evil Wizard, and Geometry & Physics Lab.

## Manual overlay deployment

If using the ZIP artifact manually, extract **Joshua_Randall_OSU_Science_Safe_Overlay.zip** into a staging directory first. Copy its contents into the existing `public_html`. The overlay intentionally does not contain the protected paths above, so do not delete destination files that are absent from the overlay.

Do not upload repository-only material such as `.git`, `.github`, `tools/`, `tests/`, `release-upload/`, `site-repair/`, or `project-sources/`.

## Verification and rollback

The release is not complete until desktop and phone checks pass on the public OSU URL. Static GitHub validation proves source integrity and mathematical unit checks; it cannot prove OSU-hosted permissions, cached files, WebGL behavior, or the host-only Evil Wizard/fusion media.

If any deployment check fails, restore the full pre-deployment backup before making another attempt.

GitHub cannot write to OSU Engineering hosting without an authorized SSH/SFTP deployment connection.
