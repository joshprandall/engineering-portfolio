# Crown & Ash — Steam Productization Roadmap

## Product identity

Working commercial title: **Crown & Ash**

Store descriptor: **Animated 3D chess combat**

Recommended Steam-facing title: **Crown & Ash**. Avoid making “Battle Chess” part of the commercial title or logo without qualified trademark review. Interplay currently sells *Battle Chess* and *Battle Chess: Game of Kings* on Steam and identifies BATTLE CHESS as a trademark/registered trademark.

The existing website route `games/3d-battle-chess/` stays unchanged for backward compatibility. The player-facing product name changes to Crown & Ash.

## Commercial target

Target base price: **$14.99 USD**, provided the release feels like a complete premium game rather than a browser prototype.

A $14.99 build should ship with:
- polished 3D board presentation and combat camera work;
- five visually distinct armies with meaningful animation/effect differences;
- complete legal chess rules and reliable game-state handling;
- computer opponent with multiple genuinely distinct difficulty levels;
- local two-player play and Steam Remote Play Together compatibility;
- mouse, keyboard and controller support;
- tutorial/onboarding and clear move feedback;
- save/resume, settings persistence and separate audio controls;
- offline play with all runtime dependencies bundled locally;
- configurable graphics/performance settings;
- ultrawide and common 16:9/16:10 resolutions;
- accessibility options including reduced motion, scalable UI and keyboard-only play;
- production audio, UI feedback and coherent visual identity;
- a battle gallery or equivalent showcase mode;
- QA coverage for rules, game state, input, resolution changes and suspend/resume.

Online matchmaking is not mandatory for the first paid release, but it would materially increase long-term value. Do not advertise it until it exists.

## Phase 1 — Separate product from website prototype

1. Keep the browser version as the public playable demo/prototype.
2. Create a desktop distribution layer around the proven HTML/JS/Three.js game.
3. Bundle Three.js and every runtime asset locally. The Steam build must not depend on jsDelivr or another CDN to launch.
4. Produce a Windows 10/11 x64 executable first. Add macOS/Linux only after dedicated QA.
5. Keep web deployment and desktop packaging isolated so website changes cannot break the Steam build.
6. Add semantic product versioning and a deterministic build process.

Fastest low-rewrite path: package the current game with a Chromium-based desktop shell such as Electron, then optimize footprint and startup behavior. A native-engine port should only happen if the web renderer becomes a real performance or feature ceiling.

## Phase 2 — Make the game worth $14.99

### Combat and spectacle
- Give each piece class recognizable movement, attack, hit-reaction and defeat language.
- Add multiple capture finishers so repeated matches do not feel canned.
- Build camera choreography around captures without obscuring board state.
- Add a fast/skip setting for competitive players.
- Improve particles, lighting, shadows, materials and impact audio while retaining a performance mode.

### Armies
Each army needs a coherent visual identity, not merely recoloring:
- Classic / royal medieval
- Arcane
- Monsters
- original construction-toy aesthetic
- Cosmic

Avoid third-party protected character, brand or trade-dress imitation in commercial assets.

### Chess experience
- Preserve full legal move enforcement.
- Improve AI strength and personality differentiation.
- Add analysis-friendly move history and rematch flow.
- Add board/piece readability settings.
- Add optional clocks and common time controls.
- Add FEN/PGN import/export after the core UX is stable.

### Retention
- Achievements.
- Match statistics.
- Unlockable cosmetic variants earned through play, not pay-to-win mechanics.
- Challenge positions / tactical scenarios.
- Battle Gallery expanded into an intentional showcase mode.

## Phase 3 — Desktop production requirements

- No network dependency for core play.
- Clean install/uninstall.
- Local save location documented and tested.
- Graceful recovery from corrupt settings/save files.
- Windowed, borderless and fullscreen modes.
- Resolution and render-scale controls.
- VSync/frame-cap options.
- Controller glyphs and focus navigation.
- No browser chrome, external portfolio navigation or development UI in the paid build.
- Crash/error logging that does not collect personal data without disclosure.
- Automated rule-engine tests plus desktop smoke tests.
- Release builds must launch from a fresh non-developer Windows account.

Steamworks API integration is optional for the core executable; use it when adding achievements, Steam Cloud, rich presence or other Steam features. The Steamworks SDK is required for uploading content to Steam.

## Phase 4 — Steam launch checklist

Current Steam requirements to plan around:
- Steam Direct fee: **$100 USD per app**.
- The fee is recoupable after the product reaches **$1,000 Adjusted Gross Revenue**.
- First releases have a **30-day waiting period** after paying the app fee.
- A public **Coming Soon** page must be live for at least **two weeks** before release.
- Store presence and product build are reviewed by Valve; current documentation says review typically takes **3–5 business days**, with at least **7 business days** recommended for planning.

Create:
- capsule art;
- library hero/logo assets;
- 6–10 strong screenshots;
- gameplay trailer focused on animated captures and army variety;
- short description;
- full store description;
- system requirements;
- feature checklist that exactly matches the shipping build;
- privacy disclosure only for data actually collected;
- controller/Steam Deck claims only after testing.

## Pricing position

$14.99 is defensible only if Crown & Ash looks and behaves like a premium game. Current chess-adjacent Steam examples span roughly $10–$20, including 5D Chess With Multiverse Time Travel at $11.99 and a number of chess/strategy titles around $12.99–$19.99.

The price should follow delivered value, not lead it. The product goal is therefore: make the release obviously worth $14.99 at first glance and after several matches.

## Release gate

Do not submit the commercial build until all of these are true:
- 100 consecutive automated rules-engine test runs pass;
- no known game-breaking move/state bugs;
- no external runtime CDN dependency;
- fresh-machine Windows install launches successfully;
- controller and mouse/keyboard flows both complete a full match;
- all five armies can finish a match without missing assets/animations;
- save/resume survives restart;
- audio/settings persist;
- performance remains stable during repeated animated captures;
- store claims match implemented features;
- commercial asset/license audit is complete.

## Immediate engineering backlog

1. Freeze **Crown & Ash** as the working brand.
2. Audit every asset, font, sound and dependency for commercial distribution rights.
3. Vendor Three.js locally.
4. Create the desktop packaging scaffold.
5. Add persistent settings and save/resume.
6. Add controller-first menu/game navigation.
7. Strengthen AI tiers.
8. Expand capture choreography and army differentiation.
9. Add graphics/performance settings.
10. Build automated desktop smoke tests.
11. Create a Steam-ready demo branch.
12. Create Steam store media only after the visual pass is strong enough to sell the game without explanation.

## Sources

- Steam Direct: https://partner.steamgames.com/steamdirect
- Steam Direct fee: https://partner.steamgames.com/doc/gettingstarted/appfee
- Steam review process: https://partner.steamgames.com/doc/store/review_process
- Steam pricing guidance: https://partner.steamgames.com/doc/store/pricing
- Steamworks SDK: https://partner.steamgames.com/doc/sdk
- Interplay Battle Chess Steam page: https://store.steampowered.com/app/622830/Battle_Chess/
