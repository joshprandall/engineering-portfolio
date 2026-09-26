# Isolated production runtime

`python tools/build_runtime.py --commit <full-commit>` reads Git archive bytes at that exact commit and the committed route, import, artifact, export and external manifests. It never reads production or substitutes a worktree file. Artifact restoration uses authenticated release IDs and verifies both size and SHA-256, including cached bytes. Missing paths, case mismatches, changed hashes and unsafe output paths fail the build.

Output is exclusively `staging/website-2.0-runtime/`; evidence is outside it at `staging/website-2.0-runtime-manifest.json`. Only this named local staging directory may be replaced. The builder rejects symlinks and validates its resolved parent before replacement. No deploy operation exists.

`--refresh-manifest` explicitly regenerates the allowlist/hashes from the selected commit after an intentional runtime change. Review and commit that manifest before final acceptance. Schema 2 uses exact Git blob bytes, resolving the Phase 2 Windows newline convention. Every entry has path, byte size, SHA-256, Git/artifact provenance, owning component and deployment classification.

The accepted Phase 3 payload contains 242 files / 282,866,951 bytes across 51 HTML routes. The initial baseline was 228 files / 279,159,604 bytes. It includes both canonical artifacts, linked résumé/downloads, credits, 76 deep-learning chunks plus indexes/profiles, and isolated game exports. A staged closure check caught and fixed omission of the linked résumé DOCX. No preservation tree, test, tool, source-only project or audit document is packaged.

Static closure is not a proof of every possible dynamic execution path. Run `python tools/validate_runtime.py` and the staged browser suites after each package build. Absolute external services remain governed by the external manifest; they are not claimed to be immutable or offline.

Final closure includes the Recovery Readiness Auditor ZIP, résumé DOCX, canonical Fusion video, Evil Wizard WASM/PCK, linked game credits and Geometric methods. Unlinked game README/deployment/roadmap/source-revision documents are excluded. SHA-256 uniqueness checks find no duplicate payloads. The external inventory contains 274 documented references (including historical evidence and outbound citations, not 274 mandatory runtime requests). Provider availability, licenses and immutable remote preservation are not implied by an inventory entry.

The final acceptance run serves only staged bytes. Detailed evidence is in `docs/phase3-evidence/`; the runtime, ownership and media/download JSON reports record the payload source commit. Subsequent validation/documentation commits do not change payload bytes. A normal build without `--refresh-manifest` at the final pushed commit is the final reproducibility gate.
