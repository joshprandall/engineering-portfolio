# Read-only live runtime comparison

I compared the exact committed Git blobs at `cc813a298d7cd3da3d69033b7e3330b99d82f7b6` with the public OSU responses. The companion JSON records the URLs, timestamps, sizes, hashes and individual errors.

Of 196 manifest-listed HTML, CSS, JavaScript and module files, 96 matched, 98 differed, and two returned HTTP 404: `games/3d-battle-chess/combatants-v6.js` and `games/3d-battle-chess/duels-v6.js`. Those responses do not prove that the currently live game loads either file. They do mean that a candidate route requiring them cannot assume they already exist on the host.

The shared stylesheet, responsive stylesheet, academy script, scene script, sound-control script and scene stylesheet match. Several important differences are real, not just line endings:

- The live homepage loads `solar-v7-isolated-20261109/solar-navigation.js?v=20261109-solar-v8-home-stage`, rather than the branch's root solar script. The directory is absent from the branch. Its live bytes must not be replaced by the branch's older navigation.
- The live theme loader names `20261002-audio-planets-v4`; the branch names `20260929-ambience-phone-v2`.
- The live audio controller uses the V33 guard and a decoded-buffer/gain-based Night playback path, with a separate fallback. The branch retains the older V31/two-player crossfade implementation. A full branch overlay would replace functioning production audio with different code.
- The chess project page differs in shared runtime and responsive stylesheet version references.

`tools/audit_live_runtime.py` makes this comparison repeatable without changing the host, repository files, or reviewed hashes. It pins a commit, streams bounded GET responses, records errors separately from mismatches, and refuses to overwrite an evidence output file. Eight offline tests cover exact bytes, line-ending differences, size limits, network errors, missing files, off-host redirects and safe inventory paths. The normal Python discovery command includes these tests automatically.

This inventory excludes binary media, JSON curriculum and host-only files. It is not full production parity, browser acceptance, permission to deploy, or a new baseline. Keep the existing host assets unchanged; publication remains blocked pending an independently verified content-only payload and the remaining release gates.

Validation: the eight auditor tests passed on Linux and Windows; `npm test` passed again in the isolated LF-byte test tree with the auditor included (1,033 curriculum tests and the other Node/Python suites). No substantive manifest changes resulted. For the preceding guard commit `cc813a2`, hosted Site validation run `43372756315` and Authored content companions run `43372756012` both passed. Those hosted results apply to that exact commit, not automatically to later commits, and do not establish live parity.
