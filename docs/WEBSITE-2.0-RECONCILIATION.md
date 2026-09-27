# WEBSITE 2.0 — OSU/GitHub Reconciliation Baseline

Status: non-destructive audit in progress.

Update, September 26, 2026: the direct read-only reconciliation is documented in
[WEBSITE-2.0-AUDIT.md](WEBSITE-2.0-AUDIT.md), with committed-byte comparisons,
canonical file mapping, cleanup candidates, and explicit access/validation gaps.
The supplied inventory counts below are historical context, not the new capture.

This document records the first reconciliation pass between the OSU home directory inventory and the GitHub repository. No OSU files should be deleted solely from this document; suspected duplicates and historical material must be content-hashed or otherwise verified before removal.

## Inventory received

- OSU account files inventoried: 1,370
- OSU account folders inventoried: 207
- Current `public_html` files inventoried: 404
- Approximate `public_html` size: 584.05 MB
- Top-level `public_html*` archive snapshots: 53
- Approximate size of those archive snapshots: 18,004.45 MB (~17.6 GiB)

## Immediate findings

### Production tree is mixed with development/history material

The live `public_html` inventory contains production assets together with historical/recovery and development artifacts. Examples include timestamped `_before_*` and `_safe_patch_backup_*` directories, `backup-*` directories, `.bak` files, nested `public_html`, review/reconciliation ZIPs, source snapshots, and temporary upload artifacts.

At least 87 files (~127.35 MB) in `public_html` match obvious historical/backup naming patterns. This is a conservative first-pass count, not a deletion list.

### Large duplicate candidate

Two 160.86 MB files exist in the live tree:

- `public_html/fusion-presentation.mp4`
- `public_html/assets/fusion-presentation.mp4`

The current GitHub `project-fusion.html` references `assets/fusion-presentation.mp4`. The two files are equal in reported size, but removal must wait for hash verification.

### Multiple Evil Wizard web exports

The live tree contains several large Godot web exports, including:

- `games/evil-wizard/`
- `games/evil-wizard-adaptive-preview-v23/`
- `games/evil-wizard-preview-20260922-163345/`
- `games/evil-wizard-console-20260922/`

Each contains a ~37.68 MB WASM plus associated PCK/data. We must identify the canonical live build, preserve it, and move superseded exports out of production after verification.

### Heavy data is expected, but should be intentional

`knowledge-data.js` is ~24.23 MB. The learning system also has many chunked `deep-learning/*.json` files. WEBSITE 2.0 should keep heavy learning data lazy-loaded and avoid making unrelated pages pay this cost.

### Root OSU home directory contains many automatic site snapshots

The home directory has 53 `public_html*` `.tar.gz` backups totaling ~17.6 GiB. Many have identical reported sizes (for example 19 at 349.41 MB and 12 at 333.11 MB), indicating strong deduplication potential. Size equality alone is insufficient; hashes are required before pruning.

## Target separation

### GitHub — authoritative source of truth

GitHub should contain:

- website source code and shared architecture
- all maintainable game/project source
- learning source/data needed to reproduce the site
- tests and validation
- documentation
- one authoritative deployment system
- asset provenance/license manifests
- manifests/checksums for large externally stored binaries when ordinary Git storage is inappropriate

### OSU `public_html` — production only

The deployed tree should contain only what the live website needs at runtime. It should not be the normal storage location for:

- historical snapshots
- patch scripts
- source-only project files
- CI configuration
- old review packages
- `.bak` files
- duplicate deployments
- temporary upload artifacts

### Archive/recovery storage

Milestone backups should be kept separately from production and deduplicated. The goal is a small set of meaningful recovery points, not dozens of near-identical full-site archives.

## WEBSITE 2.0 cleanup rules

1. Never delete a suspected duplicate before hash/content verification.
2. Never overwrite the current live site from an older GitHub/archive snapshot.
3. Preserve isolated games, labs, and science experiences until their canonical versions are positively identified.
4. Consolidate shared navigation, theme, scene, audio, search, and resilience behavior rather than stacking new patch files.
5. Keep production deploys reproducible from an exact Git commit plus documented large-asset sources.
6. Validate internal references, JS syntax, encoding, mobile/touch behavior, WebGL/canvas output, light/dark persistence, and audio policy before deployment.
7. Use backup-first, exact-commit, verify-after-live deployment with rollback.

## Next reconciliation work

- Compare every GitHub path with the live `public_html` inventory.
- Identify live-only runtime assets and determine which must be imported to source control or represented by an asset manifest.
- Identify GitHub-only development files that should never be deployed.
- Establish the canonical Evil Wizard build.
- Establish the canonical Crown & Ash/Battle Chess trees and retire superseded versions only after verification.
- Verify the fusion video duplicate by hash.
- Reduce deployment tooling to one maintained implementation.
- Convert one-off historical repair/install scripts into history or remove them from the active toolchain.
- Build WEBSITE 2.0 architecture and migration on a dedicated branch before touching `main` or the live OSU tree.
