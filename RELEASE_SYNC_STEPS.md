# Knowledge Platform v1.1.0: safe GitHub and OSU update

The full Knowledge Platform ZIP is not in this branch yet. **Do not merge the draft pull request until the ZIP import workflow has passed.** The branch contains an importer, a qubit/mobile repair, and validation; it does not yet contain the 8,000-object dataset.

1. Download `Joshua_Randall_Knowledge_Platform_v1.1.0_DEEP_LEARNING_EDITION.zip` from the ChatGPT conversation to your PC. Do not extract this ZIP before uploading it to GitHub.
2. From the current OSU folder `\\stak.engr.oregonstate.edu\users\randjosh\public_html`, copy **the current `projects.html`** to your PC, then rename that copy `live-projects.html`. This preserves the real game browser link and any newer project cards; never rename the live OSU file.
3. In GitHub, open the `site-v1-1-knowledge-sync` branch and navigate into `release-upload/`. Click **Add file → Upload files**. Upload both the release ZIP and `live-projects.html` in ONE commit to this branch (not `main`). Do not upload the ZIP alone if you want to preserve your exact current game links.
4. Open **Actions → Import Knowledge Platform v1.1**. Confirm the upload-triggered workflow passed. It checks ZIP integrity and 8,000 verification records, imports 94 site files, preserves `app.js`, `styles.css`, and `assets`, keeps your live `projects.html`, fixes common UTF-8 artifacts, wires the navigation and qubit repair scripts, and runs JavaScript/site checks. If it fails, do not merge; inspect its log.
5. Open the draft pull request for the release branch. Inspect **Files changed**, and check that the imported `projects.html` still includes the game browser link and `id="quantum"`. Once checks are green and these links are intact, merge the pull request.
6. Back up the entire live OSU `public_html` folder on your PC.
7. In GitHub's updated `main` branch, click **Code → Download ZIP**, then extract it on your PC. Open the extracted `engineering-portfolio-main` folder. Copy the website HTML files (`index.html`, `projects.html`, all `learn*.html`), `knowledge-data.js`, `knowledge.js`, `knowledge.css`, `verification-manifest.json`, `site-resilience.js`, `site-resilience.css`, and the complete `deep-learning/` folder into your **existing** OSU `public_html`. Replace matching files.
8. Do **not** copy `tools/`, `.github/`, `site-repair/`, `tests/`, or `release-upload/` into `public_html`. Keep existing `app.js`, `styles.css`, `resume.html`, `assets/`, game files, and media untouched. Do not nest `public_html/public_html`.
9. Hard-refresh your OSU Projects page. Test the game browser link, qubit slider/presets/100 measurements, mobile menu open/close, Learn navigation, and an interactive lab on both desktop and phone.

This is an overlay update, not a deletion of your OSU web directory. GitHub changes do **not** automatically deploy to OSU.
