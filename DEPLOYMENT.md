# OSU portfolio deployment

GitHub `main` contains the reviewed source. The public OSU website changes only when its files are deployed from an authenticated OSU shell.

## Deploy a tested release

Use the full 40-character commit SHA from the successful pull request checks. Download the deployment script from that same commit and run it with `--commit SHA`:

```bash
curl -fsS https://raw.githubusercontent.com/joshprandall/engineering-portfolio/SHA/tools/deploy_osu_live.py -o ~/deploy-portfolio.py
python3 ~/deploy-portfolio.py --commit SHA
```

Replace both occurrences of `SHA` with the tested commit. The script rejects branch names and does not silently select an older release. Run it in the OSU account containing `~/public_html`.

The deployment creates a full backup outside the web root, installs supporting assets before page HTML, verifies the installed bytes, checks public URLs and JavaScript content types, and restores the previous files if installation or verification fails. Newly introduced files are removed during rollback. Retain the printed backup path.

## Full Geometry Lab deployment

The normal portfolio deploy intentionally preserves most of `geometric-lab/`. When a tested release changes Geometry Lab calculation modules, deploy that lab separately with the dedicated exact-commit tool:

```bash
curl -fsS https://raw.githubusercontent.com/joshprandall/engineering-portfolio/SHA/tools/deploy_geometry_lab.py -o "$HOME/deploy-geometry-lab.py" && python3 "$HOME/deploy-geometry-lab.py" --commit SHA
```

Replace both occurrences of `SHA` with the same tested 40-character commit. The tool rejects branch names, backs up the existing `~/public_html/geometric-lab` tree, installs only files from the repository's Geometry Lab directory, verifies installed bytes, performs public HTTP checks, and rolls the lab back on failure. It does not modify games or other website directories.

## Preserved content

This website release preserves these existing host paths byte for byte:

- `games/3d-battle-chess/`
- `games/evil-wizard/`, including the host-only browser export
- Geometry Lab calculation modules and assets in `geometric-lab/` (all files except `index.html` and `app.js`)
- `assets/fusion-presentation.mp4`

The three root project/game launcher pages are updated so they receive the shared navigation fixes. The Geometry Lab’s `index.html` and `app.js` shell also receive the shared Day/Night preference; its math, simulation modules, and assets remain separate. Never delete or replace `public_html` as a directory.

## Release checks

`npm test` validates all 16 project cards, the 8,000-record learning manifest, science calculations, release structure, and deployment preservation/rollback. `npm ci` followed by `npm run test:browser` exercises real rendering, navigation, animation controls, project experiments, learning interactions, cross-page appearance persistence, tab synchronization, reduced motion, and background rendering. Set `PORTFOLIO_BROWSER_EXECUTABLE` to an installed Chrome/Chromium executable, or install Playwright Chromium with `npx playwright install chromium`.

GitHub Actions builds `Joshua_Randall_OSU_Science_Safe_Overlay.zip` and captures phone, tablet, and desktop screenshots. The overlay includes the local photos/fonts, homepage animation, shared appearance scripts and scenes, learning data and science modules; it omits the preserved host paths above. If installing it manually, merge its contents into the existing site without deleting destination files.

After deployment, verify the public homepage, hamburger menu, project catalog, QPE and Emergent Systems controls, Learning Library lessons, and existing games in a browser. Local tests cannot establish the live server state or verify the host-only game export. The deployment script performs public HTTP checks but does not replace this final browser check.
