# Translucency verification — 2026-09-29

The initial preview did not fully meet the requested rule. Primary buttons, several selectors and inputs, notifications, logo holders, the standalone Qubit section and some Geometry controls still painted opaque backgrounds. Shared CSS now makes these UI fills translucent. The hamburger navigation panel remains fully opaque in both themes. No scene engine, audio controller, scientific calculation or game runtime was changed in this follow-up.

The contract concerns **surface fills**. Text, borders, graph marks, axes, logos, images, videos and the games' rendering remain intact. Native select popups belong to the browser/operating system. Do not use whole-element opacity: it would also fade labels and children.

## Evidence

- `npm run test:glass-browser`: passed on Chromium. All 66 portfolio/learning/science page shells, plus four lesson views, at 390 and 1440 pixels in both themes: 280 page checks. Twenty additional checks cover search, sound, notification and all Geometry tabs/save dialog. Twelve button checks cover default, hover, keyboard focus, pressed, disabled and focused skip-link states in both themes. Disabled appearance is deliberately exercised with the disabled attribute; this is not a claim about every asynchronous operation.
- Open hamburger menus were checked on every root page in both themes and widths. Night is `rgb(11, 18, 22)`, Day is `rgb(247, 249, 245)`, opacity is 1, and background-image/backdrop-filter are both `none`.
- `npm run test:browser`: passed, including the existing 66-page appearance/navigation matrix, scenery motion/pause, phone/tablet/desktop layout, science interactions, learning persistence and embedded-browser user-agent emulation.
- `npm test`: passed. Its deployer tests use temporary fixture directories; they do not deploy the website.
- Exact package build/validation: 274 files, 394,658,569 bytes, 71 HTML routes, 8,000 catalog records, 76 teaching chunks, no unresolved validation issues. `tested-runtime.json` verifies that the tested working runtime matches the committed package bytes.
- Sixteen before/after component-bound comparisons are identical (`layout.json`). The new CSS changes fills and foreground contrast, not layout. The before images use the previous committed styles against the same page content; animated background phase can differ.

| Example | Before | After |
| --- | --- | --- |
| Phone controls, Night | [Opaque controls](controls-390-dark-before.jpg) | [Glass controls](controls-390-dark-after.jpg) |
| Homepage, Night | Existing baseline gallery | [Preserved composition](home-390-dark-after.jpg) |
| Hamburger menu | Already solid | [Night](menu-dark-after.jpg) · [Day](menu-light-after.jpg) |
| Learning controls | Initial opaque selectors/buttons recorded in `before-findings.json` | [Night](lesson-390-dark-after.jpg) |
| Standalone Qubit | Initial opaque section/control fills | [Day](qubit-390-light-after.jpg) |

The first attempted new test is retained. Its gradient classifier initially included opaque chess artwork and data/legend marks; these are now explicitly classified as graphic content. The save-dialog journey also initially attempted to save from the guide tab where that action is intentionally hidden; it now returns to the experiment first. It additionally found real opaque Notebook/Field guide buttons, which were fixed. No failed UI-surface assertion was converted into an allowed opaque surface.

An intermediate package validation rejected a stale staged `direction.html`; a clean rebuild and immediate validation passed. Package hash checking remained enabled. Existing historical evidence files were restored after the validator generated its new report, and the new report is retained here.

## Boundaries

This is local automated browser verification, not physical iOS/Android, Safari, Firefox or actual Messenger-WebView testing. Local Chromium cannot decode the Day H.264 videos; Day screenshots show the available fallback, not proof of video playback. Existing production Day playback evidence predates this follow-up. The source branch and preview are updated; OSU has not been deployed.

To repeat: build the pinned release commit with `python tools/build_runtime.py --commit FULL_SHA`, run `python tools/validate_runtime.py`, then `npm run test:glass-browser` with `PORTFOLIO_BROWSER_EXECUTABLE` if needed. The same glass check is included in the protected-overlay CI workflow.
