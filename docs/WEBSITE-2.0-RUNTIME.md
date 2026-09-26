# Isolated production runtime

`python tools/build_runtime.py --commit <full-commit>` reads Git archive bytes at that exact commit and the committed route, import, artifact, export and external manifests. It never reads production or substitutes a worktree file. Artifact restoration uses authenticated release IDs and verifies both size and SHA-256, including cached bytes. Missing paths, case mismatches, changed hashes and unsafe output paths fail the build.

Output is exclusively `staging/website-2.0-runtime/`; evidence is outside it at `staging/website-2.0-runtime-manifest.json`. Only this named local staging directory may be replaced. The builder rejects symlinks and validates its resolved parent before replacement. No deploy operation exists.

`--refresh-manifest` explicitly regenerates the allowlist/hashes from the selected commit after an intentional runtime change. Review and commit that manifest before final acceptance. Schema 2 uses exact Git blob bytes, resolving the Phase 2 Windows newline convention. Every entry has path, byte size, SHA-256, Git/artifact provenance, owning component and deployment classification.

The initial Phase 3 baseline contains 228 files / 279,159,604 bytes. It includes both canonical artifacts, linked résumé/downloads, credits, 76 deep-learning chunks plus indexes/profiles, and isolated game exports. A staged closure check caught and fixed omission of the linked résumé DOCX. No preservation tree, test, tool, source-only project or audit document is packaged.

Static closure is not a proof of every possible dynamic execution path. Run `python tools/validate_runtime.py` and the staged browser suites after each package build. Absolute external services remain governed by the external manifest; they are not claimed to be immutable or offline.
