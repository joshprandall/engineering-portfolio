# Joshua Randall — custom engine design space

Status: future architecture, no runtime implementation in Website 2.0. Current Crown & Ash and Evil Wizard remain independently shippable.

Joshua controls original source, engine interfaces, scene/asset/save specifications and versioning. Dependencies keep their own copyrights and licenses. Prefer permissive licenses only after verifying the exact dependency/version, distribution terms and notices; do not assume a dependency permits every commercial use.

Proposed boundaries:

- `platform`: clock, files, windows, input; deterministic test adapters.
- `simulation`: entity state, fixed-step updates, replay and stable identifiers.
- `render`: backend-neutral commands; disposable renderer adapters.
- `physics`: queries and contacts behind owned interfaces.
- `audio`: voices, mixing and streaming, isolated from browser site ambience.
- `assets`: documented owned formats, importer adapters, round-trip tests.
- `tools`: editor/build tooling separate from the shipped runtime.

First milestone: a headless deterministic scene/replay harness and versioned asset specification. Next: one rendering adapter, measured frame budget and input test rig. A game adopts a subsystem only after measured benefit, compatibility tests and a rollback path. Never make this prototype a prerequisite for commercial game releases.
