# Protected dependency release guard

I corrected a gap in the release preflight: a dependency was accepted solely because its path was protected, even when the retained host file did not exist. Protected files are excluded from the upload, so a source copy cannot repair that missing host dependency.

The guard now requires each declared dependency to be shipped or already present on the host. Protection continues to prevent replacement; it no longer implies existence. This changes release tooling only, not website files or their appearance.

Regression cases cover missing game WASM, missing Geometry JavaScript, and retained fusion media that exists only in the source. The existing host-present acceptance, preservation and rollback cases remain in place. The new game and Geometry cases failed before the fix; all 12 deployment tests passed afterward on AL with Python 3.13.15, using temporary mock sites only.

No live deployment, merge, game edit, media edit, or protected runtime hash change was performed. Full release acceptance and live-byte parity remain separate gates.

Aggregate validation: `npm test` passed on the upstream `ecb49760` tree plus this two-file patch, exported with `core.autocrlf=false` into a fresh temporary test repository. The Node suites passed 9, 25 and 1,033 tests; Python suites passed 6, 24 and 62 tests. Metadata regeneration left no substantive manifest diff. The ordinary Windows checkout initially failed the protected-byte check because Git converted LF to CRLF; no reviewed hashes were changed to accommodate that. Browser/media playback and production acceptance were not rerun for this tooling-only change.
