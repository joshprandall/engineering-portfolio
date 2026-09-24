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

## Preserved content

This website release preserves these existing host paths byte for byte:

- `games/3d-battle-chess/`
- `games/evil-wizard/`, including the host-only browser export
- `geometric-lab/`
- `assets/fusion-presentation.mp4`

The three root project/game launcher pages are updated so they receive the shared navigation fixes. Their actual game and Geometry Lab trees remain separate. Never delete or replace `public_html` as a directory.

## Release checks

`npm test` validates all 16 project cards, the 8,000-record learning manifest, science calculations, release structure, and deployment preservation/rollback. `npm ci` followed by `npm run test:browser` exercises real rendering, navigation, animation controls, project experiments, and learning interactions. Set `PORTFOLIO_BROWSER_EXECUTABLE` to an installed Chrome/Chromium executable, or install Playwright Chromium with `npx playwright install chromium`.

GitHub Actions builds `Joshua_Randall_OSU_Science_Safe_Overlay.zip` and captures phone, tablet, and desktop screenshots. The overlay includes the local photos/fonts, homepage animation, learning data and science modules; it omits the preserved host paths above. If installing it manually, merge its contents into the existing site without deleting destination files.

After deployment, verify the public homepage, hamburger menu, project catalog, QPE and Emergent Systems controls, Learning Library lessons, and existing games in a browser. Local tests cannot establish the live server state or verify the host-only game export. The deployment script performs public HTTP checks but does not replace this final browser check.
