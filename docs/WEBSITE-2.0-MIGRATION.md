# Phase 3 migration log

Production and main remain untouched. Work stays on `website-2.0-reconciliation`.

1. Build a reproducible exact-commit runtime and establish the staged baseline before controller edits.
2. Move standard navigation to one route-backed controller; validate and commit independently. Learning navigation stays unchanged in that commit.
3. Move global search to its own generated metadata/controller while retaining detailed learning search.
4. Keep theme preferences in `site-theme.js`; separate ambient playback, sound UI and visual scenes, with explicit page policy.
5. Add dedicated destinations and distinct portfolio/learning solar navigation, then validate the complete final package.

No step authorizes deployment or production cleanup. Phase 4 begins with release-candidate review, physical-device acceptance and rollback/package verification.
