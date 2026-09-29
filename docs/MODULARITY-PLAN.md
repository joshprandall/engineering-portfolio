# Website 2.1 modularity and hardening plan

This plan begins only after the current visual/functionality repair is approved in a review preview. The approved review build becomes the protected behavior baseline. The purpose of the next phase is not a redesign; it is to make the existing site easier to extend, faster to load, smoother to use, and substantially harder to break.

## Non-negotiable baseline

Preserve the approved visual identity, Day/Night environments, animated scene rotation, synchronized scene audio, 0–100 volume control with explicit Mute/Unmute, the slim rail-free page scroll thumb, translucent header/cards, intentionally opaque hamburger menu, responsive mobile composition, solar navigation, working games, and working labs.

Crown & Ash and Defeat the Evil Wizard remain protected game applications. Working labs such as Geometric AI remain protected applications during structural refactoring. Their surrounding site integration may change; their internal behavior does not change unless explicitly requested.

No production deployment replaces the OSU site until the complete candidate passes automated verification and a human review preview is approved.

## Architecture rule

Every subsystem has exactly one owner for DOM, state, styles, events, storage, resources, and lifecycle. Modules communicate through explicit public interfaces/events. No page-specific stylesheet or script may silently reach into another subsystem and override its internals.

| Module | Owns | Must not own |
| --- | --- | --- |
| Shared shell | Header, navigation, menu, search mounting, responsive layout primitives, cards/tiles, page scroll thumb, theme/motion controls, sound-control UI | Background media, game/lab internals, editorial page data |
| Scene engine | Day/Night scene catalog, visual media loading, posters, animation, scene rotation, visible-scene identity | Header/cards, volume UI, page navigation |
| Audio engine | Ambient source selection, scene synchronization, playback, volume/mute state, audio lifecycle, media recovery | Sound-control layout, unrelated feature audio, page content |
| Content pages | Page-specific semantic content and destination structure | Global navigation, ambient media internals, cross-page styling |
| Learning | Learning data, curricula, lesson rendering, progress, quizzes, learning labs | Global shell internals, game internals |
| AI | AI models/topics, build-your-own tooling, code examples, AI labs and their state | Global shell/background internals |
| Security & ethical hacking | Defensive/ethical labs, simulations, tooling, safety boundaries and content | Global shell/background internals |
| Game Development workbench | Topic tools, demos, technical workflows and Game Development routing | Crown & Ash / Evil Wizard internal game code |
| Games | Each game's own state, renderer, controls, assets, audio and lifecycle | Shared site state beyond explicit mount/exit contracts |
| Delivery | Asset restoration, bundling, versioning, cache policy, preview/deployment packaging, rollback | Runtime UI behavior |

## Full post-approval audit

Audit every runtime page and asset from the following angles:

1. Architecture and ownership
   - Map every JS/CSS/HTML/data owner.
   - Find duplicate responsibilities, global selectors, cross-module DOM access, duplicated event listeners, duplicated localStorage keys, mixed release versions and hidden fallback code.
   - Replace implicit coupling with documented interfaces.
   - Identify dead, obsolete and legacy compatibility code without deleting anything until proven unused.

2. Visual consistency
   - Compare Day and Night geometry, spacing, translucency, controls, typography, tile padding, alignment and responsive breakpoints.
   - Verify phone, small phone, tablet, desktop and in-app browser layouts.
   - Establish reusable design tokens for spacing, radii, glass strength, typography, controls and card geometry.
   - Prevent page-specific overrides from changing global components.

3. Functional consistency
   - Exercise every link, tile, button, slider, menu, dialog, tab, lab launcher, return path, keyboard control and touch target.
   - Verify all destinations are meaningful and never fall through to generic pages unexpectedly.
   - Protect working games/labs from unrelated changes.

4. Performance
   - Measure first contentful display, largest visual paint, interaction readiness, layout shift and media start latency.
   - Remove duplicate scripts/styles and unnecessary page-wide work.
   - Defer noncritical modules, lazy-load heavy labs/content, preload only critical media, use efficient phone media and cache immutable assets.
   - Ensure background media never blocks navigation or content.
   - Measure memory/CPU impact of animation, observers, timers and canvases on mobile.

5. Media and audio
   - Verify Day/Night visual and audio synchronization across Safari/iOS, Chromium, WebKit and embedded browsers.
   - Centralize media manifests and fallback order.
   - Make preview, test and production delivery use equivalent media contracts.
   - Keep volume/mute state consistent across navigation without duplicate audio owners.

6. Mobile and accessibility
   - Verify safe-area handling, centering, card gutters, scroll behavior, orientation changes, reduced motion, keyboard navigation, focus order, accessible names and touch target sizes.
   - Test iPhone/Safari and in-app browser behavior as first-class targets, not afterthoughts.

7. Reliability and state
   - Audit localStorage/sessionStorage keys, history handling, Back/Forward navigation, pagehide/pageshow, visibility changes and tab synchronization.
   - Ensure modules can mount/unmount cleanly without duplicated state or listeners.
   - Verify failures degrade gracefully instead of breaking the page.

8. Maintainability
   - Create one documented component registry and page-capability manifest.
   - Generate or validate common page imports from one source of truth.
   - Add architecture tests that fail when a module reaches across its boundary.
   - Add representative visual/browser regression tests for every shared component.
   - Document how to add a new page, tile, lab, AI topic or Game Development tool without modifying unrelated modules.

9. Delivery and rollback
   - Produce one reproducible preview package containing the same runtime asset set intended for OSU.
   - Add asset hashes/versioning and cache-busting only at controlled release boundaries.
   - Keep a known-good release snapshot and one-command rollback.
   - Never deploy a candidate with a red validation gate.

## Migration sequence

1. Freeze the approved repair build as the reference release.
2. Inventory every shared/global responsibility and create the component ownership map.
3. Consolidate design tokens and shared shell components without visual change.
4. Finish isolating scene engine, audio engine, sound UI and page scrolling.
5. Replace duplicated page bootstrapping with one capability-driven loader.
6. Modularize Learning, AI, Security/Ethical Hacking and Game Development one subsystem at a time.
7. Add per-module lifecycle APIs and scoped styles to labs/tools.
8. Optimize asset delivery and runtime performance after architecture is stable.
9. Run the full device/browser/route matrix and compare against the approved reference.
10. Publish a review preview; deploy to OSU only after approval.

## Acceptance criteria

The architecture phase is complete only when:
- every shared subsystem has one documented owner;
- no background/media stylesheet owns page-shell or content-card styling;
- no page-specific code reaches directly into another module's private DOM/state;
- adding a content page or tile does not require editing unrelated modules;
- adding a lab/tool has an explicit mount/unmount and asset boundary;
- Day and Night have identical shell geometry and interactions by construction;
- every runtime page passes route, layout, accessibility and interaction checks;
- representative Safari/iOS, WebKit, Chromium and embedded-browser tests pass;
- performance measurements meet an agreed baseline and show no major regressions;
- preview packaging matches the production asset contract;
- the entire candidate can be rolled back cleanly.

This document is the authoritative architecture plan for the post-functionality phase.
