# Audio and motion ownership

`site-audio.js` is the only global ambient playback/preference owner. `site-sound-control.js` is the only global ambient UI owner. `site-scenes.js` now draws visuals, manages muted background videos, credits and scene selection; over 600 lines of dormant audio synthesis, players and duplicate controls were removed after baseline preservation/testing.

Ambience is allowed only on the root Home and main `learn.html`. Project pages, subject plans, dedicated lessons/labs and games are suppressed. Learning narration and game audio remain local. The existing ambient-suppression event pauses ambience while learning content/narration needs it.

Default volume is 5%, ceiling 10%, UI increments 5%. Mute/volume persist when storage is available; in-memory fallback preserves controls within a blocked-storage visit. Autoplay denial is exposed in UI, with a user gesture retry. Dark audio uses the preserved package-relative WAV/MP3, rather than an absolute OSU dependency. Nature audio remains an external dependency with a silence-on-failure contract.

`site-theme.js` remains the only theme preference owner, including legacy key migration, storage fallback, back/reload and cross-tab handling. It now also honors reduced motion and saved pause preferences. Scene rendering consumes that state; learning consumes it without writing a competing global preference. Real device audio activation and long-running transitions remain release acceptance gates.
