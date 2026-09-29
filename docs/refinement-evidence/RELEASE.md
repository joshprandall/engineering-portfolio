# Pinned release handoff

Candidate: `b5ceebf6888cbf38824a65b201bbe4e4c19ff219`
PR: https://github.com/joshprandall/engineering-portfolio/pull/71
Starting main and recovery branch: `88d1980a0520dffc0d3f84699f684c472a7c6516`, `backup/protected-baseline-20260928-88d1980`.

Source implementation, automated validation, protected-overlay packaging and preview verification are complete for the scopes in [the evidence report](README.md). Site validation and OSU overlay CI passed on this candidate; runtime hashes exactly match the locally browser-tested payload. Main is unchanged. Deployment and post-deployment production verification have not happened. Later evidence-only commits can record these results without changing the pinned candidate.

Native zoom, local H.264 playback, physical-device/browser coverage, deeper game playthroughs and full catalog editorial completion remain limited as documented. Do not describe those as certified. The three Day videos also need immutable release-asset mirroring.

Authenticated OSU access was unavailable in this environment. The exact repository-supported deployment action, after applicable release gates, is to run these commands from the OSU account containing `~/public_html`:

```sh
curl -fsS https://raw.githubusercontent.com/joshprandall/engineering-portfolio/b5ceebf6888cbf38824a65b201bbe4e4c19ff219/tools/deploy_osu_live.py -o ~/deploy-portfolio.py
python3 ~/deploy-portfolio.py b5ceebf6888cbf38824a65b201bbe4e4c19ff219
```

The deployer archives the existing site, preserves the protected game/Geometry/fusion bytes and rolls back failures. Keep its printed backup path. Do not copy the full preview tree over the site, delete deployment-only files or run destructive synchronization.

After deployment, separately verify production root and nested routes, learning notes/reviews, AI input/output/reset, security exports, game entry/play/return, Day/Night preferences, all three Day scene/ambience pairs, mute across navigation and reload, and temporary audio-priority restoration. Record the actual deployed SHA and browser results before calling the release live and verified.
