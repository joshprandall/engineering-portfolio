# Reconciliation evidence

Captured September 25–26, 2026 from the existing reconciliation branch and read-only OSU tree. See `git-provenance.json` for exact baseline refs; the audit commit necessarily has a later hash.

- `repository-inventory.json`: every baseline working-tree file outside `.git`, installed dependencies, Python caches and generated audit tooling/evidence. Size, UTC mtime, SHA-256 and tracked flag.
- `live-inventory.json`: 397 visible files; 395 content hashes, two null hashes with read errors. `.codex` could not be enumerated. Null is unknown, not a checksum match.
- `live-metadata.csv`: independent read-only metadata walk including directories and unreadable file metadata.
- `comparison.json`: raw working-tree versus live bytes. Windows checkout line endings affect these results.
- `git-head-inventory.json`, `git-main-inventory.json`: committed blob identities, sizes and SHA-256, without checkout transformations.
- `git-live-comparison.json`: authoritative content classification against the captured reconciliation commit.
- `live-only-branch-membership.json`: path membership for the original 165 readable live-only paths across 61 fetched branch tips. It does not search all history or prove byte identity.
- `dependencies.json`: initial regex reference candidates, with source line numbers. `dependencies-expanded.json` adds asset literals, absolute OSU URLs and Godot members, plus assessment flags. No incoming edge is not proof a file is unused.
- `external-dependencies.json`: captured external asset strings, including dormant code. This is a reference ledger, not a network availability check.
- `duplicates.json`: exact cross-path SHA-256 matches. Shared runtime files may still require multiple URLs.
- `cleanup-candidates.json`: broad filename classifier with inbound edges. Linked credits/methods are explicit keep exceptions in the cleanup report.
- `text-issues.json`: raw pattern matches. `visible-literal-newlines.json` excludes script/style text and confirms the actual HTML newline artifact.
- `browser-smoke.json`: targeted Chrome inspection of both trees via a read-only localhost server, 390×844. Does not validate gameplay, real audio output or OSU Apache behavior.
- `syntax-and-data.json`: 150 captured JS syntax checks and learning data existence/count checks.
- `errors.json`: filesystem access gaps; those reads were retried without changing permissions and still denied.

`runtime-sources.json` and `content-differences.json` are ignored local analysis scratch. They are not included in this documentation commit and are not a durable backup of live source. Before any future cleanup, preserve actual source/binaries in verified recoverable storage.

Collection tools are under `../audit-tools/`: `reconcile.cjs` reads/hashes trees, `analyze.cjs` compares committed Git bytes, `enrich.py` adds metadata-only records/reference analysis, and `browser-smoke.cjs` serves read-only content for diagnostic checks. `report.py` records the human-reviewed findings from this particular capture; it is not an automatic authority/deletion decision engine. Baseline timestamps and counts in report prose must be reviewed for a new capture.

No tool in this audit deploys. The browser uses the locally installed Chrome and bundled Playwright; the capture requires read access to the Z drive. Native Windows permissions tests do not substitute for Linux deployment validation.
