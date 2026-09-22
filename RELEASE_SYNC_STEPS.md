# Knowledge Platform v1.1.0 and 16-project portfolio: reconciled release

The Knowledge Platform ZIP upload and GitHub import already succeeded. GitHub branch `site-v1-1-knowledge-sync` now incorporates the newer `release/final-project-portfolio-2026-09-22` project catalog and components. The original 8,000-record verification manifest and deep-learning packs were retained. Do not re-upload the old ZIP or overwrite the reconciled site with either original branch.

Read `DEPLOYMENT.md` and `RECONCILIATION_NOTES.md` before deploying. The working OSU-hosted Evil Wizard browser export and fusion video are not in GitHub and must be backed up, preserved, and verified. The pull request may remain draft until actual browser and host checks are completed.

GitHub Actions `Build reconciled OSU overlay` creates a deployment ZIP from the combined site, excluding GitHub workflows, development tools, tests, and Godot project source. Copy its *contents* into the existing OSU `public_html` after making a full backup; merge folders without deleting OSU-only media and game exports. The workflow ZIP is an overlay, not a replacement of the host directory. GitHub cannot deploy to OSU automatically without an authorized connection.
