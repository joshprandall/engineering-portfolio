# Audio and planet selection repair

The audio upload inherited private Windows access rules. OSU returned HTTP 403
for `site-audio.js`, so the single audio controller never initialized and its
Sound control was missing. The file's normal public-read access rules were
restored without changing its owner/group. HTTPS then returned the expected
46,682 bytes and SHA-256 `b56e16a6c06bb6d9dfceba798837075a9f9dfdbc3be83be8069d6eac53aaf3a5`.

The planet animation detached and re-appended every interactive group on every
frame. The labels ignored pointer input, phone targets shrank below 44 CSS
pixels, and the enclosing SVG image role hid the controls from assistive
technology. The repair retains depth ordering with moves only when necessary,
holds targets steady from pointer press through release, preserves focus,
provides transparent label targets, and exposes the existing selection controls
as buttons within a group. The visible composition and destination behavior
are preserved.

The shared loader and 64 pages use one version. Solar entry pages explicitly
version their navigation script. The existing live responsive CSS is preserved
in the repository, including the approved Day contrast and opaque sound panel.
Inactive Night-buffer diagnostic output now reports muted state correctly.

Verification before publication:

- `npm test`: all required checks pass; two existing optional Python checks skip.
- Chromium: 140 real mouse, touch, label and keyboard checks on Home, Learn and
  AI Development across both themes.
- Windows WebKit: the same 140 planet-input checks pass.
- Chrome: real decoded Night playback, one complete PCM loop with one source
  start at rate 1, all three moving Day videos with matching sound, volume/mute,
  navigation preferences, motion pause/resume and canvas fallback pass.
- Windows WebKit lacks Web Audio and exercises the intended native MP3
  fallback. Its Day videos and matching audio decode and progress. This is
  browser-engine coverage, not a physical iPhone or Messenger certification.

`tools/deploy-smb-hotfix.ps1` preflights reviewed before/after checksums, creates
a rollback copy, writes server-side staged bytes with the existing public-read
rules, verifies every published file through HTTPS, and rolls back on failure.
The scene engine, recordings, games and Geometry calculations are unchanged.
