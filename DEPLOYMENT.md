# Static portfolio deployment

The portfolio is a static directory. The web root must contain `index.html`, `projects.html`, the shared CSS and JavaScript, and every referenced directory (`assets/`, `deep-learning/`, `geometric-lab/`, `games/`, `labs/`, `project-sources/`, and the learning pages).

For the OSU Engineering host:

1. Back up the current `public_html` directory.
2. Copy the contents of this repository into `public_html`, preserving the existing filenames and subdirectories.
3. Keep the existing host path and permissions. The portfolio expects the root page at `~randjosh/index.html`.
4. Open the home page, project catalog, geometry lab, phase-estimation lab, emergent-systems explorer, agent workbench, chess route, Evil Wizard route, and qubit route from the hosted URL.
5. Check the mobile menu at a phone width and the theme toggle at both theme settings.
6. Run `npm test` from this repository before copying a later revision.

The repository is intentionally self-contained. There is no server process, database, runtime secret, or build step required by the portfolio pages.
