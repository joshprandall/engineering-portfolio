(() => {
  'use strict';

  // Unified site ambience controller. This is the ONLY script that may create
  // or play background ambience/music.
  if (window.__JR_SITE_AUDIO_V14__) return;
  window.__JR_SITE_AUDIO_V14__ = true;

  const MUTE_KEY = 'jr-site-ambient-muted-v2';
  const DARK_TIME_KEY = 'jr-dark-theme-time-v1';
  const PROJECT_RE = /(?:^|\/)(?:project-[^/]+\.html|play-evil-wizard\.html|agent-workbench\.html|games\/|geometric-lab\/|qubit-preview-20260921\/|deep-learning\/)/i;
  const LOCAL_TEST_HOST = location.hostname === '127.0.0.1' || location.hostname === 'localhost';

  const SOURCES = Object.freeze({
    // John Bartmann — “Interstellar Space” (CC0/public-domain dedication).
    dark: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/John_Bartmann/Public_Domain_Soundtrack_Music_Album_One/John_Bartmann_-_12_-_Interstellar_Space.mp3',

    // Existing light-mode field recordings.
    river: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sanna%20river%20rapids.ogg',
    waterfall: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Water%20fall.ogg',
    // Shorebirds with waves audible; one track prevents overlap/bleed.
    beach: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cape%20May%20Shorebirds%20closer.ogg'
  });

  // Website-side hard ceiling. Device volume may further attenuate this, but
  // this player itself can never exceed 15%.
  const MAX_BACKGROUND_VOLUME = 0.15;
  const VOLUME = Object.freeze({
    dark: 0.15,
    river: 0.15,
    waterfall: 0.15,
    beach: 0.15
  });

  let sceneId = 'forest-river';
  let suppressed = PROJECT_RE.test(location.pathname);
  let currentKey = '';
  let unlocked = false;
  let switching = false;

  // Remove stale legacy players if a cached older script left one behind.
  document.querySelectorAll('#jr-site-audio, #jr-dark-theme-music').forEach(node => {
    try { node.pause(); } catch (_) {}
    try { node.remove(); } catch (_) {}
  });
  try { window.DarkThemeMusic?.pause?.(); } catch (_) {}

  const audio = document.createElement('audio');
  audio.id = 'jr-site-audio';
  audio.preload = 'auto';
  audio.loop = true;
  audio.playsInline = true;
  audio.setAttribute('playsinline', '');
  audio.setAttribute('aria-hidden', 'true');
  audio.style.display = 'none';
  audio.volume = MAX_BACKGROUND_VOLUME;
  (document.body || document.documentElement).appendChild(audio);

  function theme() {
    return window.PortfolioTheme?.getTheme?.() ||
      document.documentElement.dataset.theme ||
      'dark';
  }

  function muted() {
    try { return localStorage.getItem(MUTE_KEY) === '1'; }
    catch (_) { return false; }
  }

  function lessonOpen() {
    const view = document.getElementById('lesson-view');
    return Boolean(view && !view.hidden);
  }

  function allowed() {
    return !LOCAL_TEST_HOST &&
      !muted() &&
      !suppressed &&
      !lessonOpen() &&
      !document.hidden;
  }

  function desiredKey() {
    if (!allowed()) return '';
    if (theme() === 'dark') return 'dark';
    if (sceneId === 'forest-waterfall') return 'waterfall';
    if (sceneId === 'birds-water') return 'beach';
    return 'river';
  }

  function cappedVolume(key) {
    const requested = Number(VOLUME[key] ?? MAX_BACKGROUND_VOLUME);
    return Math.min(MAX_BACKGROUND_VOLUME, Math.max(0, requested));
  }

  function saveDarkTime() {
    if (currentKey !== 'dark') return;
    try {
      const value = Number(audio.currentTime || 0);
      if (Number.isFinite(value) && value >= 0) {
        localStorage.setItem(DARK_TIME_KEY, String(value));
      }
    } catch (_) {}
  }

  function restoreDarkTime() {
    if (currentKey !== 'dark') return;
    try {
      const saved = Number(localStorage.getItem(DARK_TIME_KEY) || 0);
      if (!Number.isFinite(saved) || saved < 0) return;
      const duration = Number(audio.duration || 0);
      audio.currentTime = duration > 0 ? saved % duration : saved;
    } catch (_) {}
  }

  function stop() {
    saveDarkTime();
    try { audio.pause(); } catch (_) {}
  }

  function applySource(nextKey) {
    if (!nextKey) {
      stop();
      currentKey = '';
      return;
    }

    if (currentKey === nextKey && audio.src === SOURCES[nextKey]) {
      audio.volume = cappedVolume(nextKey);
      return;
    }

    switching = true;
    stop();

    currentKey = nextKey;
    audio.loop = true;
    audio.muted = false;
    audio.volume = cappedVolume(nextKey);
    audio.src = SOURCES[nextKey];

    audio.onloadedmetadata = () => {
      if (currentKey === 'dark') restoreDarkTime();
      else {
        try { audio.currentTime = 0; } catch (_) {}
      }
      switching = false;
    };

    try { audio.load(); } catch (_) { switching = false; }
  }

  function playDesired() {
    const key = desiredKey();
    if (!key) {
      stop();
      currentKey = '';
      return;
    }

    applySource(key);
    audio.loop = true;
    audio.muted = false;
    audio.volume = cappedVolume(key);

    try {
      const result = audio.play();
      if (result?.catch) result.catch(() => {});
    } catch (_) {}
  }

  function sync(force = false) {
    const key = desiredKey();

    if (!key) {
      stop();
      currentKey = '';
      return;
    }

    if (force || currentKey !== key) applySource(key);

    if (!switching && (audio.paused || audio.ended)) {
      playDesired();
    }
  }

  function unlockAndPlay() {
    unlocked = true;
    playDesired();
  }

  // Best effort immediately. Browsers with autoplay restrictions will resume
  // on the first real interaction and then reuse this same player.
  sync(true);

  document.addEventListener('pointerdown', unlockAndPlay, { passive: true, capture: true });
  document.addEventListener('touchstart', unlockAndPlay, { passive: true, capture: true });
  document.addEventListener('keydown', unlockAndPlay, { capture: true });

  // Bubble phase intentionally runs after the Day/Night or Mute button changes
  // its state, so the controller sees the final state from that interaction.
  document.addEventListener('click', () => {
    unlocked = true;
    sync(true);
  });

  document.addEventListener('portfolio:theme', () => sync(true));

  document.addEventListener('portfolio:scene', event => {
    const next = event.detail?.id;
    if (!next || next === sceneId) return;
    sceneId = next;
    sync(true);
  });

  document.addEventListener('portfolio:ambient-suppression', event => {
    suppressed = Boolean(event.detail?.active);
    sync(true);
  });

  document.addEventListener('visibilitychange', () => sync(true));
  addEventListener('pageshow', () => sync(true));
  addEventListener('pagehide', () => {
    saveDarkTime();
    stop();
  });

  // Keep different tabs/windows in sync with the global mute preference.
  addEventListener('storage', event => {
    if (event.key === MUTE_KEY) sync(true);
  });

  audio.addEventListener('ended', () => {
    if (desiredKey() !== currentKey) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (_) {}
  });

  audio.addEventListener('error', () => {
    console.error('JR site audio failed:', currentKey, audio.currentSrc, audio.error);
  });

  // Enforce the ceiling even if another script or browser control changes it.
  audio.addEventListener('volumechange', () => {
    if (audio.volume > MAX_BACKGROUND_VOLUME) {
      audio.volume = MAX_BACKGROUND_VOLUME;
    }
  });

  // Recovery watchdog: one player, one desired source, no cross-theme bleed.
  setInterval(() => {
    const key = desiredKey();

    if (!key) {
      if (!audio.paused) stop();
      return;
    }

    if (key !== currentKey) {
      sync(true);
      return;
    }

    if (audio.volume > MAX_BACKGROUND_VOLUME) {
      audio.volume = MAX_BACKGROUND_VOLUME;
    }

    if (unlocked && audio.paused && !switching) {
      playDesired();
    }
  }, 2000);

  window.SiteAudio = Object.freeze({
    sync,
    stop,
    play: playDesired,
    get key() { return currentKey; },
    get scene() { return sceneId; },
    get theme() { return theme(); },
    get muted() { return muted(); },
    get suppressed() { return suppressed; },
    get maxVolume() { return MAX_BACKGROUND_VOLUME; },
    get element() { return audio; }
  });
})();