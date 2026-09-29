# Modularity direction

The [whole-site audit](MODULARITY-AUDIT-20260929.md) now maps all 71 runtime pages, the concrete ownership problems, and areas to preserve. Its evidence and priority order refine this earlier direction. The audit is complete; the structural refactor remains pending.

Preserve the approved appearance, existing content, Day/Night scenery, matching sound, solar navigation, games and labs. The goal is to let each area evolve without changing another area's behavior. More files alone do not establish that boundary.

| Area | Owns | Connection to the rest of the site |
| --- | --- | --- |
| Shared shell | Navigation, layout, theme requests, component mounting | One shared loader and explicit theme/motion requests |
| Background | Scene catalog, media loading, visible-scene identity, animation, audio, volume UI and lifecycle | Theme/motion input; balanced activity-priority requests; status output |
| Page content | Biography, project descriptions, learning records and editorial data | Renders inside the shell; no access to background media elements or timers |
| Interactive features | Each game's or lab's state, styles and resources | Mount/unmount lifecycle; temporary audio priority while active |
| Delivery | Asset restoration, checksums, caching, packaging and deployment | Produces one consistent release from reviewed source |

## Sequence

1. Stabilize the reported failure with reproducible native-media tests. Retain the same recordings and footage, including efficient phone renditions and a bare native volume slider.
2. Close the release-contract gaps identified by the audit: two nested scene consumers, version coverage for related shared styles, and the old responsive-shell generator. Declare explicit page capabilities so labs and games receive only their intended shared features.
3. Encapsulate background DOM, styles and lifecycle behind one component boundary. Remove cross-file style overrides and direct page access to media state. Keep the existing public behavior during migration.
4. Generate shared page setup from one source so pages cannot drift into mixed script versions or inconsistent initialization. Separate preference storage, navigation, and feature loading.
5. Separate learning data, routing, progress, narration, rendering, and lab ownership. Migrate one area at a time, preserving URLs and saved preferences.
6. Give each interactive feature an explicit lifecycle and scoped styles. Separate editorial data and page generation from feature code. Keep protected game and Geometry internals intact unless a separate change is requested.

For each migration, verify the component alone, then verify it within representative pages and navigation. Ship a reviewed private preview before replacing OSU. Preserve an immediate rollback to the prior release.

## Current boundary

The current repair establishes shared runtime owners, one audio owner, synchronized visible-scene sound, version/hash/media contracts and native-browser regressions. It does not complete steps 2–6. The audit found gaps in the contract's page/version coverage as well as global CSS, duplicated page loaders and document-level events. Automated checks reduce accidental breakage; they are not a guarantee of permanent browser compatibility.
