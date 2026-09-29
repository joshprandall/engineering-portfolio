# Pinned release handoff

Candidate: `80f97cf0eee896e2a5b6c200be5ba357df4655ec`
PR: https://github.com/joshprandall/engineering-portfolio/pull/71
Starting main and recovery branch: `88d1980a0520dffc0d3f84699f684c472a7c6516`, `backup/protected-baseline-20260928-88d1980`.

This candidate includes the protected content refinement and updated [background/audio repair](../ambience-repair-20260929.md). Day videos, posters and recordings are preserved in immutable Git chunks and required by packaging. Chromium and WebKit verify actual decoded animation and matching local sound. The exact source package contains 290 runtime files and 442,504,117 bytes. Evidence-only commits may follow without changing this pinned payload.

The repaired private preview is published and its media delivery checked. OSU and main remain unchanged. Physical iPhone/Messenger, native zoom, deeper game playthroughs and full catalog editorial completion remain outside completed verification.

Review the preview on the target device before choosing to replace OSU. These commands describe a later deployment, not an action already performed. From the authenticated OSU account containing `~/public_html`:

```sh
curl -fsS https://raw.githubusercontent.com/joshprandall/engineering-portfolio/80f97cf0eee896e2a5b6c200be5ba357df4655ec/tools/deploy_osu_live.py -o ~/deploy-portfolio.py
python3 ~/deploy-portfolio.py 80f97cf0eee896e2a5b6c200be5ba357df4655ec
```

The deployer restores and verifies complete Day media before backing up or writing production. It archives the existing site, preserves protected game/Geometry/fusion bytes and rolls back failed writes. Keep its printed backup path. Do not copy the full preview tree over the site, delete deployment-only files or run destructive synchronization.

After any production deployment, verify root and nested routes, learning notes/reviews, AI input/output/reset, security exports, game entry/play/return, Day/Night preferences, all three scene/sound pairs, mute across navigation/reload and temporary audio-priority restoration. Record the deployed SHA and actual production results before describing OSU as updated and verified.
