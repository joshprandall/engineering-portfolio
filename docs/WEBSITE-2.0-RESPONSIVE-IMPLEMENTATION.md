# Website 2.0 responsive architecture implementation

Implementation date: 2026-09-27. Authoritative contract: `docs/WEBSITE-2.0-RESPONSIVE-SPEC.md`. Production and `main` were not changed.

## Root causes corrected

- Shared pages had several generations of media-query overrides for the portrait, navigation, solar scene and learning ladder. Later rules changed individual coordinates and dimensions rather than the component's containing model.
- The animated solar's largest horizontal orbit used 58% of the scene width before adding label width, selected glow and parallax. Its foreground paint could not fit inside its parent mathematically.
- The home portrait used absolute positioning, negative visual overlap and theme-adjacent overrides across multiple stylesheets. The resulting geometry was hard to reason about and could diverge by viewport.
- Global navigation retained desktop links while mobile rules independently switched menu behavior. Search, Sound, theme and menu controls did not share one sizing contract.
- The learning ladder had competing one-column and two-column mobile rules. Several forms and grids retained intrinsic `min-width:auto` behavior.
- A mobile project-card action column still permitted flex wrapping; links formed a second column beyond the card. Qubit's convergence canvas used a fixed minimum render width and redrew only after user activation.
- Some learning routes displayed a hidden library search in their markup. The shared Search button could target that hidden control instead of the route's visible glossary/path search.
- Page-level `overflow-x:hidden` or `clip` rules in shared and lab shells concealed layout defects. Environmental background layers still clip intentionally because they use cover/crop semantics.

## Shared ownership

`site-responsive.css` owns the shared layout contract: shrinkable wrappers and grid/flex children, fluid gutters and spacing, bounded reading width, the global header/control family, portrait flow, education/resume cards, contained solar surfaces, learning ladder and route form, and foreground bounds. `tools/build_responsive_shell.py` generates the shared header and education markup. `assets/site-education.json` is the source for the confirmed OSU dual major in Electrical & Computer Engineering and Computer Science, Data Science/Mathematics/Physics minors, Honors College status, and MIT Online Quantum Engineering Program tuition-based professional study.

The existing behavior owners remain intact: `site-navigation.js`, `site-search.js`, `site-theme.js`, `site-audio.js`, `site-sound-control.js`, `site-scenes.js`, and learning's detailed search in `knowledge.js`. Sound playback policy and persisted settings were not moved into presentation code.

## Solar containment

The animated capability solar has one 800 by 560 logical scene. A `ResizeObserver` measures the actual parent and applies one uniform transform to `.solar-scene`:

`scale = min(parent width / 800, parent height / 560)`

The remaining space is divided evenly into x/y offsets before `translate(...) scale(...)`. Canvas render resolution separately tracks device pixel ratio. All planets, labels, core, paths and connectors share this coordinate system. Maximum x radius is 264 pixels; maximum y radius is 140 pixels. Automated extrema checks include every phase, parallax and a conservative 90-pixel foreground-paint allowance.

The destination solar maps are semantic SVGs with an `800 650` viewBox and `preserveAspectRatio="xMidYMid meet"`. Their route links remain ordinary, reflowing controls below the art. Artwork scales; readable controls do not become tiny.

## Header, hero and learning behavior

All standard pages use the same brand, Search, Sound, Day/Night and Hamburger family. Desktop text links were removed from the top bar; the Hamburger remains available at every width. Menus and sound panels fit inside the visual viewport and retain Escape/focus-return behavior. Learning-owned searches remain independent: visible glossary/path/library searches receive focus directly; routes whose detailed search is hidden move to the Browse library search.

The portrait and profile card now participate in document flow over a cover-style environmental image. The portrait uses one geometry rule for both themes, and automated bounding-box comparison allows at most one CSS pixel of difference. On narrow containers the portrait centers above the translucent education card.

The academic ladder is always rendered. It uses eight columns when space allows, four at medium component widths, and two on small component widths. The Build a Route form becomes a one-column form while retaining Subject, Starting point, Goal, Target depth and Build controls. Active-depth styling and the academic-depth rule remain visible.

## CSS audit disposition

`tools/audit_responsive_css.py` inventories fixed dimensions, viewport units, absolute/fixed positioning, nowrap, grid templates, large spacing, offsets and clipping across every allowlisted runtime CSS or inline-style source. The machine-readable result is `manifests/responsive-css-audit.json`.

Flagged declarations are review candidates, not automatic defects. Remaining clipping is limited to environmental artwork, render stages, progress/meter fills, intentionally scrollable navigation/tab rows, visually hidden accessibility text, and immersive/fullscreen game shells. Fullscreen game `100vw` rules are intentional. Reading/card content is checked dynamically for clipped scroll dimensions. Historical preservation copies and source-only files are outside the runtime and were not rewritten.

## Validation boundary

The responsive browser suite serves only `staging/website-2.0-runtime` from the committed allowlist. It evaluates every HTML route at the 19 required viewports plus 844x390 and 568x320 landscape cases, both themes, continuous width changes from 320 through 1600 CSS pixels, seven native Chromium zoom levels from 80% through 200%, element bounds, solar paint bounds, header control collisions, hero theme parity and learning ladder presence. Component tests open menus, Sound panels and Search across all standard routes at phone/tablet/desktop sizes.

These checks simulate touch/in-app/browser conditions and native Chromium zoom. They do not replace physical iOS, Android, iPadOS, Safari/WebKit, screen-reader, camera cutout or hardware audio/gamepad acceptance.

## Acceptance result

The final responsive matrix passed 2,639 assertions with zero failures across 51 routes, 21 viewport shapes and both themes. Native Chromium zoom passed at 80%, 90%, 100%, 110%, 125%, 150% and 200%, with the changed device-pixel ratios verified. The component suite passed all 44 shared-header routes at phone, tablet and desktop widths, including mathematical solar extrema. Core, staged runtime, browser, ownership, Crown & Ash, Evil Wizard and media/download suites passed. Fourteen Python deployment tests passed except for the expected Windows symlink-privilege skip.

One runtime-browser sweep timed out while checking `project-portfolio.html` at 844 pixels in dark mode. The page diagnostic showed `scrollWidth` and viewport width both equal to 844 pixels. The unchanged test passed on its immediate rerun, and the independent 2,639-assertion matrix also passed that route and viewport. This is retained as a disclosed timing event rather than hidden with a looser assertion.

An early idempotency check exposed unstable shared-script ordering on three generated pages. The ordering was fixed and committed. The original failed log remains in evidence; `generator-idempotency.log` records a stronger verification over all 44 generated root pages: aggregate SHA-256 values were identical before generation, after one pass and after a second pass.
