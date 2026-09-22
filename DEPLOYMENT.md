# Reconciled Knowledge Platform and portfolio: OSU deployment

This repository combines the v1.1.0 Knowledge Platform import with the separate, newer 16-project portfolio branch. The GitHub release branch is not itself the live OSU site. Do not replace your entire existing OSU `public_html` with the repository root.

1. Before deployment, verify the existing OSU `games/evil-wizard/index.html` browser export and `assets/fusion-presentation.mp4`; those two live assets are not in this GitHub repository. If either is absent, restore its original working asset before updating site pages. The game launcher currently depends on the OSU-hosted export and has not been end-to-end verified by a static test.
2. Back up the whole live `public_html` directory and retain the backup until desktop and phone checks pass.
3. After the reconciled pull request is approved, merged, and CI checks pass, download the repository ZIP from GitHub and extract it locally. Do not upload `.git`, `.github`, `tools/`, `tests/`, `release-upload/`, `site-repair/`, or `project-sources/` to public_html.
4. Copy the root HTML, CSS, and JS site files, `deep-learning/`, `geometric-lab/`, `games/3d-battle-chess/`, `labs/`, `qubit-preview-20260921/`, and needed static assets into the existing `public_html`, retaining the destination's existing `games/evil-wizard/` browser export, fusion video, and any other local assets. Merge directories; never delete a destination directory that contains assets missing from the source repository. Retain `resume.html` and any newer host-owned files unless specifically updated.
5. Verify home and project pages, all 16 cards, full-text Learn search, lessons and deep-learning packs, accessible mobile menu/theme, qubit controls, browser game play, chess, and other interactive labs on both desktop and phone. If something fails, restore the backup.

GitHub tools cannot directly write to OSU Engineering's file share without a connected, authorized deployment interface. A successful import or static GitHub check is not proof that the live OSU website has been deployed or that its games and media load.
