# Modularity direction

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
2. Encapsulate background DOM, styles and lifecycle behind one component boundary. Remove cross-file style overrides and direct page access to media state. Keep the existing public behavior during migration.
3. Generate shared page setup from one source so pages cannot drift into mixed script versions or inconsistent initialization.
4. Separate content/data rendering from reusable navigation and interaction components. Migrate one area at a time, preserving URLs and saved preferences.
5. Give each interactive feature an explicit lifecycle and scoped styles. Keep protected game and Geometry internals intact unless a separate change is requested.

For each migration, verify the component alone, then verify it within representative pages and navigation. Ship a reviewed private preview before replacing OSU. Preserve an immediate rollback to the prior release.

## Current boundary

The current repair establishes shared runtime owners, one audio owner, synchronized visible-scene sound, version/hash/media contracts and native-browser regressions. It does not complete steps 2–5. Global CSS, duplicated page loaders and document-level events remain coupling to address. Automated checks reduce accidental breakage; they are not a guarantee of permanent browser compatibility.
