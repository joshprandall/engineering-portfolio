# WEBSITE 2.0 — large assets and restoration

Canonical machine-readable records: `manifests/large-assets.json`. Full live-path restoration mappings: `manifests/live-preservation.json`.

| Asset | Canonical deployed path | Bytes | SHA-256 |
|---|---|---:|---|
| Fusion presentation | `assets/fusion-presentation.mp4` | 168678432 | `eefc852a3a5d12eeedf8a217fc2cb68d6d0476612ad4d8744a8e6febd99361e8` |
| Shared Evil Wizard Godot engine | `games/evil-wizard/index.wasm` | 39514754 | `fc74679e3b97f76878947fcd4fbe1268cbfa6188182a2e33bbc3f5dc9bfa57d0` |

The duplicate root fusion URL is not an additional stored binary. Three archived game exports refer to the same stored engine hash; their distinct PCKs remain separate. Required smaller runtime files, including the current PCK, are ordinary Git files. No Git LFS setup or account assumption was made.

## Durable source and access

Two content-named assets were uploaded to GitHub **draft** release ID `397149099`, designated `website-2.0-preservation-20260926`, against the audited reconciliation ancestor. This is unpublished preservation storage, not a site release or deployment. Neither main nor production was changed. GitHub returned matching `sha256:` digests for both uploads.

The manifest records asset IDs, authenticated API URLs, source OSU URLs, canonical filenames, expected deployed paths, sizes, hashes and ownership caveats. Draft display/download URLs can contain an `untagged-...` identifier; restoration uses stable asset API IDs, not an assumed public release URL. Access requires an account/token permitted to read the repository's draft release. Retain the draft and files; they are checksum-verified but not claimed to be immutable storage.

Fusion is Joshua Randall's OSU team presentation; no broader redistribution license is inferred. The WASM is a Godot engine export with engine/third-party attribution requirements; project game content is separate. Preserve project credits and do not invent licenses for imported audio or OSU assets. The draft keeps preservation separate from a new public redistribution decision.

Implementation follows GitHub's [release API](https://docs.github.com/en/rest/releases/releases) and [release asset API](https://docs.github.com/en/rest/releases/assets). The uploader verifies repository push access and server digests; credentials remain in memory through the existing Git credential helper and are never written to manifests.

## Restore after clone

1. Check out the reconciliation commit containing these manifests and initialize normal GitHub authentication for this repository.
2. Run `python tools/restore_website2_assets.py`. It restores the two canonical assets into this local checkout, uses the existing Git credential helper for uncached draft downloads, strips authorization from cross-host download redirects, and verifies size/SHA-256 before writing.
3. To reconstruct the complete audited readable live tree, run `python tools/restore_website2_assets.py --snapshot`. Output is exclusively local `staging/live-20260926/`. Unreadable entries are excluded and remain explicit unresolved records.
4. Restores refuse paths outside the local checkout and refuse to overwrite differing existing files. The local `.asset-cache`, staging tree and canonical external binaries are ignored by Git. These ignores are not permission to omit binaries from a future runtime package.
5. A future package builder must require every `manifests/runtime-files.json` entry and validate all hashes, including restored binaries, before considering upload. No deploy command is part of this restoration tool.

All 395 readable captured files were reconstructed and verified using local cache and preserved Git sources. An independent authenticated GitHub download using `python tools/restore_website2_assets.py --refresh` passed for both assets, bypassing the cache and validating size/SHA-256. Do not delete the live originals or draft assets before that independent recovery test.

## Remote dependencies and export identity

See manifests/external-dependencies.json for current and audit-only Pexels, Wikimedia, pinned Three.js CDN, absolute OSU media and other external references. Each records source consumers, fallback contract, license uncertainty and any preserved local counterpart. No remote bytes were fetched for this inventory; URL presence is not proof of availability or redistribution permission. Audit-only entries are retained as historical evidence, not asserted to be active runtime loads.

See manifests/evil-wizard-builds.json for four complete export units, their distinct PCK hashes, common engine identity and exact restoration members. The deployed export is canonical for preservation; matching source fragments do not establish build reproducibility.
