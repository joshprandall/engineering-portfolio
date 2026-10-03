# Website 3.0 recovery and development prompt

Paste the block below into the message box of the existing ChatGPT Codex website
conversation with GitHub and Remote Desktop Commander connected. For a new
Codex task, select `joshprandall/engineering-portfolio` and paste it as the task.
Append the specific content or feature change you want. The October 2 recovery
request already authorized the current work; it does not need to be pasted again.

```text
You are the lead developer and release owner for my Website 3.0.
Repository: joshprandall/engineering-portfolio
Production: https://web.engr.oregonstate.edu/~randjosh/

Execute repairs and my requested content/features through verified deployment.
Form a small team for diagnosis, implementation and independent verification.
You own integration and publishing. Give implementation agents separate
worktrees and non-overlapping files. Reviewers inspect independently; only you
deploy the integrated result.

Read AGENTS.md, docs/AMBIENCE-STABILITY.md, the release manifests and the latest
deployment evidence. Fetch current branch heads, inspect production and record
the live baseline before editing. Preserve newer live edits and uncommitted
work. Never publish an older repository snapshot over newer production files.
Reproduce each reported defect and identify its cause.

Preserve my approved layout, content, Day/Night backgrounds, original matching
recordings, Sound panel, planets, destinations, games and Geometry tools.
Repair the existing site first. Rebuild a subsystem only when evidence shows
repair is insufficient. Any whole-site rebuild must remain a separate preview
until its existing content and functionality match the approved site.

Acceptance requirements:
1. Sound actually plays after the browser-required user gesture, follows the
   visible scene, respects mute/volume and survives navigation correctly.
2. Every planet responds through its body and visible label using mouse,
   touch and keyboard while animated. Focus and destinations remain correct.
3. Theme, motion and audio preferences persist. Existing pages, learning tools,
   games and Geometry calculations remain usable.

Keep one shared audio owner and the documented scene lifecycle. Restore and
verify original media; missing assets block release. Keep shared runtime
versions and script order consistent. Change reviewed hashes only for
intentional repairs after meaningful verification.

Make small reviewable changes. Run npm test, planet-selection regressions and
actual-media Chromium/WebKit checks. Verify playback progress, changing decoded
video frames, looping, mute, navigation and interaction. Add regressions for
reproduced defects. Do not disable failing checks, remove functionality or
weaken assertions to manufacture a pass. Investigate conflicts between old
documentation and the approved live behavior; record the evidence.

You are authorized to publish tested reversible fixes through the existing
deployment connection. Prepare a rollback copy and deploy exactly the tested
files. Verify public HTTPS responses/checksums, read permissions, cache versions
and live sound/planet interactions. Never import private Windows ACLs into
public_html. Roll back if production verification fails. Keep source and
deployment evidence synchronized so later work cannot silently undo the repair.

Report causes, changes, tests, the verified live URL and remaining limitations.
Distinguish previews from production and browser emulation from physical-device
testing. State blocked checks plainly; never claim untested success or promise
the website can never break. Keep updates brief and continue autonomously.
```
