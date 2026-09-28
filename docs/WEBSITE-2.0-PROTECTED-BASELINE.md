# Protected refinement baseline — 2026-09-28

This is the preservation and acceptance contract for the refinement branch. Josh's current refinement instruction and the inspected approved website take precedence over historical design requests. This document does not certify every catalog record or a production deployment.

## Starting state and recovery

- Repository: `joshprandall/engineering-portfolio`.
- Verified starting `main`: `88d1980a0520dffc0d3f84699f684c472a7c6516`.
- Reconciliation branch: `0853c124508561103027c6c10fd31f2a9e41f7e0`, an ancestor of main. No divergent work was discarded.
- Clean fresh checkout; no pre-existing uncommitted work in this environment. No claim is made about another computer's working tree.
- Remote recovery branch: `backup/protected-baseline-20260928-88d1980`. Local tag: `baseline/refinement-20260928`.
- Production inspected at `https://web.engr.oregonstate.edu/~randjosh/`. It does not expose a reliable release SHA. Homepage differences from the starting main were cache-version parameters; some scene/audio scripts and game files also differed.
- `docs/refinement-evidence/production-manifest.json` records 275 requested paths, 268 successful captures, timestamps, sizes and SHA-256 values. This is an HTTP inventory of known paths, not a complete server directory listing.
- `preservation/live-20260928/` keeps captured production HTML/JS/CSS/credit files that differed from main. They are recovery evidence, never a runtime overlay.
- Fusion video and Evil Wizard WASM match the existing hash-pinned preservation release assets. Three deployed Day videos are additionally pinned in `manifests/large-assets.json`; verified copies were used for preview. Their public source URLs are mutable: immutable release-asset mirroring remains an explicit durability boundary, not a fabricated backup claim.
- Four local Day OGG paths and two source chess module paths returned 404. Evil Wizard `.htaccess` returned 403. Absence/inaccessibility did not authorize deletion. Existing external Day audio fallbacks remain intact. Native Cloud Chrome on production showed each Day video advancing with its matching ambience playing and the abandoned ambience paused. This was a pre-release production check, not a deployment.

The established OSU deployer makes a full readable-site archive before writing, checks protected bytes and rolls back touched files on failure. `games/`, Geometry calculation modules and the existing fusion video remain protected. Do not deploy a full preview tree over production or run destructive synchronization. Do not replace production game exports with the source chess variant merely because they differ.

## Design and ownership decisions

Preserve the composition, profile/education text, typography direction, glass surfaces, colors, tile order, background scenes, solar identities and destinations. Home's removed Home planet/tile stay removed. Ordinary navigation keeps Home and Security Research. The current solar destinations are six portfolio planets, seven learning subjects and nineteen AI destinations; the descriptor link is not an extra planet.

The menu panel remains solid/readable. Theme, scene and ambient ownership remain in `site-theme.js`, `site-scenes.js`, `site-audio.js` and `site-sound-control.js`. Protected Geometry/Physics internals and all game internals were left unchanged in this pass. No new framework, account system, paid API, external scanning or job-search app was introduced. Retain licenses and existing credits.

## Implemented refinements

- Connected seven existing but unreachable activities: switch learning, Kubernetes scheduling, quorum, SQL joins, risk matrix, integral and series circuits. The dispatcher now reaches their original implementations.
- Corrected integral accumulation, switch destination labels, invalid IPv4/prefix handling, B-tree not-found behavior, a roofline curve that previously drew an unreachable compute ceiling, and rolling-update steps that ignored the zero-surge/zero-unavailable boundary. Added explicit limits/model assumptions.
- Added a topic-specific mental-model guide for each of 66 model families and paired it with the existing changing-state activity. These are 66 reusable guides, not thousands of independently authored visuals.
- Added saved per-record lab notes, quiz retry, a visible due/upcoming review queue and local-calendar scheduling. Same-day repeats do not advance spaced-retention intervals. Completion is explicitly self-reported; visiting/scrolling does not award mastery. Existing saved keys and record IDs remain intact.
- Added teaching-pack retry without destroying notes or live model state, missing-lesson recovery, subject-index retry and disabled loading/error controls.
- Cancelled timers and wave oscillators on reset/exit; suspended pending timer work while hidden and resumed it when visible without stranding controls. Narration and wave playback suppress ambience only during their lifetime and release it without changing mute preferences.
- Removed unnecessary hidden-page rendering: the same corpus is retained, while unrelated catalogs/graphs/paths are not materialized on each learning route.
- Fixed the 320-pixel learning-filter overflow and honored hidden-state semantics for scoped learning controls. No homepage layout redesign.
- All 19 AI build experiments retain their deterministic local architecture. Added validation, reset, prior-result comparison, accurate zero-vector/undefined handling, stable softmax and teaching visuals for vector rotation, confusion matrices, convolution and minimax. No simulated response is represented as live inference.
- Completed current-result exports and invalid-input recovery across six controlled local Security Research tools and the MIND workflow. Invalid schemas, ports and iteration counts no longer yield misleading results or export stale findings.
- Retained the newer source audio transition controller and corrected same-scene fallback reloads plus late ended/error playback during mute, hidden state or a pending scene transition. Production's older controller remains preserved separately.
- Refreshed exact route/dependency metadata, added verified public-source asset restoration and retained fail-closed hashing. Historical tests were reconciled with the current six-planet navigation, Security Research, current motion and 0–100% sound controls; assertions were not removed to hide failures.

## Counts and editorial boundaries

`docs/refinement-evidence/content-counts.json` is the machine-readable inventory.

| Inventory | Count | Meaning |
| --- | ---: | --- |
| Learning records | 8,000 | 1,400 source-concept records and 6,600 derived practice records |
| Kind: Lesson / Quick Concept / Lab / TroubleshootingGuide | 2,837 / 2,155 / 3,000 / 8 | Catalog classifications |
| Records with a model identifier | 3,145 | Reuse one of 66 model types, including structured study tools |
| Lab-or-model catalog entries | 4,000 | Union; not 4,000 distinct executable labs |
| Lab records with no attached model | 855 | Existing guided evidence activities; depth varies |
| Model families / AI build experiments | 66 / 19 | Browser implementations, not trained AI models |
| Domains / guided paths / glossary terms / capstones | 7 / 300 / 1,600 / 8 | Structural counts |
| Project cards / HTML routes / teaching chunks | 16 / 71 / 76 | Current release inventory |

No count of independently complete authored lessons has been established. Many inherited teaching packs use repeated scaffolding; metadata `verified` is not proof of claim-to-source editorial review. For example, the current `cloud-subnetting` catalog references include TCP and general vendor documentation rather than precise prefix evidence. Original content metadata is retained; the UI now identifies source records/links rather than asserting a new universal review. A complete, appropriately sourced authoring example is provided separately. Finishing topic-specific depth and two complementary teaching elements for every one of 8,000 records is not claimed by this pass.

## Functional acceptance

Every changed model must render actual controls, change a meaningful result, reset, accept its valid boundaries and reject invalid input without retaining a misleading answer. A nonempty placeholder is a failure. Numerical checks cover subnet boundaries, Riemann sums, circuit values, joins, quorum, scheduling, rollout bounds, roofline coordinates, convolution and softmax.

Learning journeys must retain bookmark/completion keys, notes and scheduled reviews across reloads; provide quiz explanations/retry; and release timers/audio when leaving. Persisted data is device-local, with session/in-memory fallbacks clearly reported where used. No cross-device sync is advertised.

Science tests retain ideal Qubit/QPE known cases, seed-reproducible emergent behavior and scoped research claims. AI pages must expose the exact local deterministic capability and its limits. MIND remains the approved human-autonomy/verification/HPC/knowledge/agent/robotics/quantum-accelerator vision, not an achieved superintelligent system.

Chess acceptance includes rules/perft, special moves, end states, AI modes, capture animation/state, 2D/3D handoff, undo, touch and unavailable-WebGL recovery. The browser validation used exact Three.js 0.180.0 npm bytes because this execution network failed the live CDN. Evil Wizard was tested through the actual Godot export to champion selection, prologue and playing handshake; every level, collision and save checkpoint was not exhaustively play-tested. Do not interpret launcher evidence as full-game certification.

## Verification and release boundaries

See `docs/refinement-evidence/README.md` for commands, results, images and limitations. Chromium automation and viewport/UA emulation are separate from physical devices. Actual iOS Safari, Android devices, desktop Safari/Firefox and Messenger-hosted WebViews are not certified. Firefox startup hung in this environment; WebKit dependencies could not be installed under the available process permissions. No browser restriction was bypassed.

Preview and production are distinct. The protected OSU overlay intentionally preserves production game bytes even when source games differ. An authenticated OSU shell is required for deployment; it is not available in this environment. Source commits and preview checks do not imply a changed public website.

Before a release, fetch current branch heads again, reconcile intervening commits, build the selected immutable SHA, run applicable checks and review screenshots. Use the exact tested SHA with `tools/deploy_osu_live.py` from the authenticated OSU account. Then test actual root/nested routes, local assets, games, learning, AI, themes, Day transitions and sound. Keep the generated server backup until that production verification completes.
