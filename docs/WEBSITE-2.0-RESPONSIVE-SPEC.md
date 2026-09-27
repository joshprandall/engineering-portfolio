# WEBSITE 2.0 — Responsive Architecture Specification

Status: authoritative responsive-design contract for the Website 2.0 reconciliation branch.

This specification is a responsive architecture and consistency correction, not a visual reset. Preserve the site's visual identity, backgrounds, glass/translucent design, light/dark modes, animations, solar-system concept, portrait concept, navigation architecture, learning architecture, existing interactions, and audio functionality.

## Core responsive principles

- Ordinary content must reflow.
- Visualizations must scale proportionally.
- Background art may cover/crop intentionally.
- Foreground content must fit/reflow/contain and must never be cropped.
- Cards resize/stack.
- Typography responds/wraps.
- Controls compact/reflow.
- Games/canvas resize to their parent.
- Nothing important may be clipped.
- No accidental horizontal scrolling.
- The site must feel intentionally designed for desktop, laptop, tablet, mobile, portrait, landscape, ultrawide, browser zoom, and in-app browsers where technically possible.
- Never solve broken layouts by simply hiding overflow. Fix the actual layout.

## 1. Global responsive architecture

Audit the full ancestry of every major page:

- html
- body
- #root where present
- app shell
- main
- page wrappers
- sections
- grid children
- flex children
- cards
- visualization wrappers

Relevant containers should correctly allow shrinking:

```css
width: 100%;
max-width: 100%;
min-width: 0;
```

Pay special attention to Grid/Flex intrinsic sizing and `min-width:auto`. Use `min-width:0` where required.

Audit and correct genuine responsive defects involving:

- large fixed pixel widths
- min-width values that force desktop layouts
- negative margins
- fixed left/right offsets
- 100vw where width:100% is appropriate
- fixed canvas dimensions
- nowrap
- absolute positioning tied to one screen size
- oversized fixed padding/gaps
- overflow:hidden / overflow:clip used to conceal broken positioning

Do not blindly remove valid uses.

## 2. Page content must reflow, not just shrink

When a wide layout stops fitting, change structure.

Wide:

`[ visual ] [ text ]`

Narrow:

`[ visual ]`
`[ text ]`

Do not preserve two columns until both sides become unusably narrow.

Use Grid/Flex with `minmax(0,1fr)`, `flex-wrap`, responsive gaps, and container queries where useful.

Breakpoints should be based on when content stops fitting naturally, not specific phone models.

## 3. Solar/orbital visualization

This is a root-architecture issue.

Treat the whole orbital composition as one logical scene containing the sun, planets, labels, orbit paths, rings, connector lines, decorative particles, and meaningful glow extents.

Responsive model:

- ONE SCENE
- ONE COORDINATE SYSTEM
- ONE UNIFORM SCALE
- ONE CENTERING CALCULATION
- ZERO CROPPING

Preferred architecture: responsive SVG with a logical viewBox and `preserveAspectRatio="xMidYMid meet"`.

If DOM-based, use:

```text
.solar-viewport
  .solar-scene
    everything inside
```

Only `.solar-scene` is transformed.

Measure the actual parent with `ResizeObserver`; do not rely on `window.innerWidth` alone.

Use uniform contain-style scaling:

```text
scaleX = availableWidth / SCENE_WIDTH
scaleY = availableHeight / SCENE_HEIGHT
scale = Math.min(scaleX, scaleY)

renderedWidth = SCENE_WIDTH * scale
renderedHeight = SCENE_HEIGHT * scale

offsetX = (availableWidth - renderedWidth) / 2
offsetY = (availableHeight - renderedHeight) / 2

translate(offsetX, offsetY) scale(scale)
```

Do not independently scale X/Y, stretch orbit geometry, position planets with vw/vh, use viewport-specific planet coordinates, fix clipping with random negative margins, or use overflow clipping to hide scene failures.

Foreground visualization behaves like `object-fit: contain`. Backgrounds may use cover.

If solar is beside text, stack solar above text when the two-column composition no longer fits.

Add automated bounds tests so every planet, label, meaningful glow, and outer orbit remains inside the visualization viewport.

## 4. Profile/hero responsiveness

Preferred narrow composition:

- centered portrait
- intentional head/shoulder crop
- profile card directly below or overlapping the lower portrait
- OSU and MIT information visible
- readable typography
- no horizontal overflow
- background remains visible
- translucent profile panel

Do not simply scale the desktop hero down; reflow it.

## 5. Light/dark headshot geometry parity

Theme switching must not change portrait geometry.

Light and dark must share the same:

- x/y
- width/height
- scale
- crop
- object-position
- transform
- alignment

Theme may change only visual treatment such as color, background, border, shadow, opacity, or glow.

Portrait bounding boxes should match within about 1 CSS pixel at the same viewport.

## 6. Header/navigation

Remove desktop text links from the top bar.

Shared global header:

Left:
- JR
- Joshua Randall
- Systems. Software. Possibility.

Right:
- Search
- Sound
- Day/Night
- Hamburger

Hamburger must remain visible on desktop and mobile.

Use one shared header component across the site. The menu contains top-level destinations; routes remain intact.

## 7. Floating UI above persistent backgrounds

Visual model:

- BACKGROUND = persistent environmental layer
- UI = translucent floating layer above it

Animated/background artwork should remain visible behind header, buttons, cards, content panels, menus, resume, education, projects, learning sections, game pages, and other main pages where the page design uses the global background system.

Use translucent glass surfaces with backdrop blur, subtle borders, restrained shadows, rounded corners, and readable contrast. Avoid fully opaque surfaces unless functionally necessary.

## 8. Header controls

Search, Sound, Day/Night, and Hamburger are one visual control family.

Share:
- height
- vertical alignment
- border thickness
- radius
- icon sizing
- typography
- spacing
- hover/focus behavior
- transition timing

Search:
- icon
- Search label
- shortcut hint aligned right

Sound:
- preserve current functionality
- redesign visual presentation only
- speaker icon + Sound label

Day/Night:
- same geometry as Sound
- sun + Day
- moon + Night
- switching theme must not shift surrounding controls

Hamburger:
- vertically aligned
- proper tap/click target
- visually minimal is acceptable

Do not unnecessarily rewrite working audio logic.

## 9. Learning depth ladder + Build a Route

The academic-depth ladder must remain visible on small devices together with the route builder.

Stages:

00 Orientation
01 Foundations
02 Core
03 Applied
04 Undergraduate
05 Advanced
06 Graduate Bridge
07 Doctoral / Research

Never hide the ladder on mobile.

Preferred layout:
- wide: 8 columns when it fits
- medium: 4x2 or equivalent responsive grid
- small: 2-column grid preferred

Keep the visual relationship:
- academic depth ladder
- Build a Route
- academic-depth rule

Active level must remain obvious.

On mobile stack the route form:
- Subject
- Starting point
- Goal
- Target depth
- Build button

Controls remain full-width and usable.

## 10. Education content source of truth

Update education/technical-development content to show clearly:

- Oregon State University
- Dual major: Electrical & Computer Engineering and Computer Science, in progress
- Data Science minor
- Mathematics minor
- Physics minor
- Honors College
- MIT online Quantum Engineering Program, tuition-based professional study, in progress

Do not bury minors in a long sentence.
Do not omit Honors College.
Do not omit MIT.
Do not downgrade the confirmed Computer Science second major to a planned focus.

Hero/profile education and the full education section should consume the same source of truth where practical.

## 11. Responsive typography

Use `clamp()` where appropriate.
Do not shrink text until unreadable.
Allow natural wrapping.
Preserve larger/heavier readability.
Audit nowrap and oversized fixed letter-spacing.

## 12. Fluid spacing

Use responsive spacing for:
- page padding
- card padding
- section gaps
- control gaps
- hero spacing

Use `clamp()` where useful. Avoid huge fixed whitespace on small screens.

## 13. Cards/panels

Cards should use:
- width:100%
- appropriate max-width
- min-width:0

Responsive grids should use content-aware patterns such as:

`repeat(auto-fit, minmax(min(...,100%),1fr))`

Do not allow cards to establish a minimum page width.

## 14. Canvas/WebGL/games/interactive content

Interactive surfaces derive their display size from the parent container.

Use `ResizeObserver` where appropriate.
Maintain aspect ratio.
Account for `devicePixelRatio`.
Separate render resolution from CSS display size where needed.
Do not require page refresh after resize.

## 15. Live resizing

The site must adapt continuously while resizing.

Do not calculate layout only at page load.

There must be no range where content clips, cards overlap, text leaves the viewport, visualizations crop, navigation disappears, or controls collide.

## 16. Browser zoom

Test:
- 80%
- 90%
- 100%
- 110%
- 125%
- 150%
- 200%

Layout must continue reflowing correctly.

## 17. Very wide screens

Do not stretch reading content infinitely on ultrawide/4K.

Backgrounds may fill.
Foreground reading content gets intentional max-width constraints.

## 18. Small-screen requirement

At approximately 320 CSS px:
- no accidental horizontal scrolling
- header works
- hamburger works
- search/sound/theme controls remain usable
- portrait fits
- learning ladder remains understandable
- forms remain usable
- solar scene remains contained
- cards remain readable

## 19. Global CSS audit

Search repository-wide for:
- fixed width
- min-width
- 100vw
- 100vh
- absolute positioning
- negative margins
- translateX
- translateY
- fixed canvas dimensions
- nowrap
- grid-template-columns
- large fixed padding
- large fixed gaps
- overflow hidden
- overflow clip

Review every occurrence and fix genuine responsive problems.

## 20. Breakpoint system

Use a small coherent breakpoint system.

Prefer:
- fluid CSS first
- container queries where useful
- a small number of structural breakpoints

Do not accumulate dozens of contradictory media queries.

## 21. Container queries

Use container queries where component width matters more than viewport width, especially for:
- education cards
- learning components
- project cards
- profile components
- visualizations
- embedded panels

A component inside a narrow column should adapt even on a wide monitor.

## 22. Safe areas

Support where appropriate:
- env(safe-area-inset-top)
- env(safe-area-inset-right)
- env(safe-area-inset-bottom)
- env(safe-area-inset-left)

## 23. Background vs foreground rule

Background art may use cover/crop intentionally.

Foreground content must fit/reflow/contain.

Never crop meaningful foreground information merely to fill a rectangle.

## 24. Minimum test matrix

Test at least:

- 320x568
- 360x800
- 375x812
- 390x844
- 393x852
- 412x915
- 430x932
- 768x1024
- 820x1180
- 1024x768
- 1152x864
- 1280x720
- 1366x768
- 1440x900
- 1536x864
- 1920x1080
- 2560x1440
- 3440x1440
- 3840x2160

Also test landscape mobile and continuous resizing between breakpoints.

## 25. Global overflow regression test

For every major route and representative viewport verify:

```js
document.documentElement.scrollWidth <=
document.documentElement.clientWidth + smallTolerance
```

Do not solve failures by clipping. Identify the offending element and fix the root cause.

## 26. Element bounds tests

Verify key elements remain inside intended parent/container:
- header
- profile hero
- solar visualization
- learning ladder
- route builder
- education cards
- project cards
- dialogs
- game canvases

## 27. Preserve the design

Do not redesign the site from scratch.

Preserve:
- visual identity
- backgrounds
- glass/translucent design
- light/dark modes
- animations
- solar-system concept
- portrait concept
- navigation architecture
- learning architecture
- existing interactions
- audio functionality

## 28. Final responsive behavior by content type

- Ordinary content: REFLOW
- Solar/visualizations: SCALE PROPORTIONALLY
- Background art: COVER
- Cards: RESIZE / STACK
- Typography: RESPOND / WRAP
- Controls: COMPACT / REFLOW
- Games/canvas: RESIZE TO PARENT
- Foreground content: NEVER CROPPED

## 29. Completion standard

Do not declare responsive work complete because one screenshot looks better.

Before completion:
- identify actual root causes
- correct the shared responsive architecture
- update stale academic content
- verify header behavior globally
- verify light/dark hero geometry parity
- verify learning-section mobile behavior
- verify the solar scene mathematically
- run the full build
- run existing tests
- run responsive regression tests
- verify every major route for horizontal overflow
- confirm no important content is clipped

The final site should feel designed specifically for whatever screen or component container it is currently displayed in, not like a desktop page being squeezed into a smaller window.
