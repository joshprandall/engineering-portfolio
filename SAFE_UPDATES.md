# Safe updates for Joshua Randall's OSU portfolio

The live site is `https://web.engr.oregonstate.edu/~randjosh/`. This GitHub repository is a **source project**, not a verified byte-for-byte copy of the files currently hosted by OSU. The repository's existing GitHub Actions workflow validates code; it does not upload files to OSU. Verify any other deployment integration before merging or publishing changes.

## Before changing anything

1. Open the live site on a desktop and a phone. Check home, Projects, the quantum demo, existing games, menu, search, links, and light/dark theme. Record which URLs actually work.
2. Using your existing OSU web-file access method, download **all current live website files** to a dated folder on your PC, outside the public website directory. Include subfolders and assets. This is your *actual live-site backup*; a GitHub commit alone is not a backup of OSU.
3. In GitHub, record the commit ID of the branch you are starting from. For this initial safety work, the `main` baseline was `ad48c33cf476bd6a8c02a436a3ac747147b7e085` (September 21, 2026). Future deployments should record their own commit ID. Do not assume this old commit represents the live OSU contents.
4. Make a branch for each feature or game integration. Keep Unreal Engine project sources, build caches, dependencies, credentials, and large binary assets out of the public OSU web directory.

## Build and test in GitHub

1. Make changes in a feature branch, not directly on `main`.
2. Run `npm test` (or `node tests/site.test.mjs`) from the portfolio repository. A passing test checks basic structure, not full game behavior or real browser/device compatibility.
3. Open the changes as a pull request. Review the **Files changed** tab, especially `index.html`, `projects.html`, `styles.css`, `app.js`, game paths, and navigation.
4. Check the GitHub Actions validation result. Do not merge if it fails. Test keyboard navigation, mobile/tablet layout, the quantum demo, games, console errors, and internal links manually.
5. When possible, preview the changed files locally or in an isolated staging directory; do not publish staging experiments over the existing home page.

## Deploy to OSU only after the checks

1. Compare the GitHub version with the downloaded OSU backup and identify which files are actually meant to change. GitHub and OSU may have diverged.
2. Upload **only** the approved, web-ready HTML/CSS/JavaScript and required assets using your existing authorized OSU deployment method. Preserve unrelated apps, games, demos, and folders; do not upload the entire repository or a raw Unreal Engine project.
3. Avoid replacing shared `app.js`, `styles.css`, or navigation markup without checking every page that uses them. Use distinct folders and asset names for each independently built game/application.
4. Visit the live site in a private/incognito window and on a phone. Repeat the checks from step 1, including any previously failing features. Refresh cached assets if a previous version appears.
5. Save the deployed commit ID, deployment date, list of changed paths, and location of the live-site backup in a private deployment log.

## If something breaks

1. Stop further uploads.
2. Restore the **affected files** from the dated OSU backup (or restore the whole site if changes were widespread). Restoring an old GitHub commit is not enough when OSU contained different files.
3. Verify the original pages and applications again on desktop and mobile. Inspect browser console/network errors and broken file paths before retrying.
4. Fix the issue in a new feature branch, rerun automated and manual checks, then redeploy only the corrected files.

## Known checks to resolve before any major site refresh

- The portfolio source currently has nine project cards. The previous automated test expected eight; the accompanying test change compares the visible count against the actual cards instead.
- `projects.html` in this repository links to `projects.html#quantum` and `projects.html#fusion`, but those anchors are not present in the repository copy of that page. Check whether the OSU live site uses a different version and repair the intended targets before deploying this repository wholesale.
- Treat the learning platform, quantum demo, Battle Chess, Evil Wizard, and AI Game Studio as separate projects until their actual deployment paths, runtime requirements, shared dependencies, and integration tests are confirmed.

**Safety rule:** GitHub upload → review and test → explicit OSU deployment. Never assume a successful GitHub push proves the live website is working.
