# WEBSITE 2.0 — deterministic cleanup proposal

Machine-readable manifest: `manifests/production-cleanup.json`. It covers 397 visible files plus the inaccessible `.codex/` directory. `executionAllowed` and every `deleteAuthorized` field are false. No cleanup script is provided or executed.

| Category | Meaning |
|---|---|
| `KEEP_PRODUCTION` | Current runtime or linked attribution; retain until an accepted replacement is deployed. |
| `IMPORT_TO_GITHUB` | Originally absent from the audited branch; preservation/import has been prepared in Git or authenticated draft assets. This category records disposition, not permission to remove live. |
| `ARCHIVE` | Historical/source/alternate release/diagnostic material; exact bytes are preserved or referenced by immutable Git blob identity. Review consumers and recovery before removing production copies. |
| `DELETE_AFTER_VERIFICATION` | Root fusion duplicate and Windows thumbnail cache. Removal remains forbidden until all listed verification steps pass. |
| `UNRESOLVED` | Two unreadable files and unenumerated metadata directory; retain untouched. |

Every readable file has its audited size and SHA-256, source-preservation locator, disposition reason and review gates. Future operations must reject a changed live hash rather than apply an old manifest to new content. Shared WASM and duplicate backup bytes refer to one preserved hash, while distinct PCK builds remain separate.

The root fusion URL may have external consumers even though the active project selects `assets/fusion-presentation.mp4`. Plan a redirect or deliberate retention after checking consumers. The legacy chess route receives a working redirect in the candidate package; its historical implementation remains archived. Linked Geometry credits/methods and asset licenses are runtime keep exceptions to generic source-file cleanup.

Required gates before any cleanup: authenticated cold restore, verified archives, resolution of internal/external consumers, complete staged runtime acceptance including games/audio, independent live rehash immediately before action, and explicit approval of a concrete removal plan. No item in this document overrides the instruction that `Z:\public_html` remains read-only.
