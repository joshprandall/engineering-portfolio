(() => {
  'use strict';

  if (window.__JR_SITE_AUDIO_V12__) return;
  window.__JR_SITE_AUDIO_V12__ = true;

  const scriptUrl = new URL(document.currentScript?.src || location.href, location.href);
  const base = new URL('./', scriptUrl);

  const MUTE_KEY = 'jr-site-ambient-muted-v2';
  const DARK_TIME_KEY = 'jr-dark-theme-time-v1';
  const PROJECT_RE = /(?:^|\/)(?:project-[^/]+\.html|play-evil-wizard\.html|agent-workbench\.html|games\/|geometric-lab\/|qubit-preview-20260921\/|deep-learning\/)/i;

  const SOURCES = {
    dark: new URL('assets/audio/dark-theme.mp3', base).href,
    river: new URL('assets/audio/river.mp3', base).href,
    waterfall: new URL('assets/audio/waterfall.mp3', base).href,
    beach: new URL('assets/audio/beach-waves.mp3', base).href,
    birds: new URL('assets/audio/beach-birds.mp3', base).href
  };

  const VOLUME = {
    dark: .24,
    river: .24,
    waterfall: .25,
    beach: .20,
    birds: .16
  };

  let sceneId = 'forest-river';
  let suppressed = PROJECT_RE.test(location.pathname);
  let generation = 0;
  let unlocked = false;
  let activeSignature = '';

  const tracks = Object.fromEntries(Object.entries(SOURCES).map(([key, src]) => {
    const audio = document.createElement('audio');
    audio.id = 'jr-audio-' + key;
    audio.src = src;
    audio.preload = key === 'dark' ? 'auto' : 'metadata';
    audio.loop = true;
    audio.playsInline = true;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('aria-hidden', 'true');
    audio.style.display = 'none';
    audio.volume = VOLUME[key];
    (document.body || document.documentElement).appendChild(audio);
    try { audio.load(); } catch (_) {}
    return audio;
  }));

  const theme = () => window.PortfolioTheme?.getTheme?.() || document.documentElement.dataset.theme || 'dark';

  const muted = () => {
    try { return localStorage.getItem(MUTE_KEY) === '1'; }
    catch (_) { return false; }
  };

  const lessonOpen = () => {
    const view = document.getElementById('lesson-view');
    return Boolean(view && !view.hidden);
  };

  const allowed = () => !muted() && !suppressed && !lessonOpen() && !document.hidden;

  function saveDarkTime() {
    try {
      const value = Number(tracks.dark.currentTime || 0);
      if (Number.isFinite(value) && value >= 0) localStorage.setItem(DARK_TIME_KEY, String(value));
    } catch (_) {}
  }

  tracks.dark.addEventListener('loadedmetadata', () => {
    try {
      const saved = Number(localStorage.getItem(DARK_TIME_KEY) || 0);
      if (!Number.isFinite(saved) || saved < 0) return;
      const duration = Number(tracks.dark.duration || 0);
      tracks.dark.currentTime = duration > 0 ? saved % duration : saved;
    } catch (_) {}
  }, { once: true });
  tracks.dark.addEventListener('timeupdate', saveDarkTime);

  function pauseTrack(key, reset=false) {
    const audio = tracks[key];
    if (!audio) return;
    if (key === 'dark') saveDarkTime();
    try { audio.pause(); } catch (_) {}
    audio.muted = false;
    if (reset && key !== 'dark') {
      try { audio.currentTime = 0; } catch (_) {}
    }
  }

  function hardStopAll({resetNature=true}={}) {
    generation++;
    pauseTrack('dark', false);
    pauseTrack('river', resetNature);
    pauseTrack('waterfall', resetNature);
    pauseTrack('beach', resetNature);
    pauseTrack('birds', resetNature);
    activeSignature = '';
  }

  function desired() {
    if (!allowed()) return {signature:'silent', keys:[]};

    if (theme() === 'dark') {
      return {signature:'dark', keys:['dark']};
    }

    if (sceneId === 'forest-waterfall') {
      return {signature:'light:waterfall', keys:['waterfall']};
    }
    if (sceneId === 'birds-water') {
      return {signature:'light:beach', keys:['beach','birds']};
    }
    return {signature:'light:river', keys:['river']};
  }

  function desiredIsPlaying(keys) {
    return keys.length > 0 && keys.every(key => {
      const audio = tracks[key];
      return audio && !audio.paused && !audio.ended && !audio.muted;
    });
  }

  function startKey(key, token) {
    const audio = tracks[key];
    if (!audio) return;
    audio.loop = true;
    audio.muted = false;
    audio.volume = VOLUME[key];

    try {
      const p = audio.play();
      if (p?.then) {
        p.then(() => {
          if (token !== generation) pauseTrack(key, key !== 'dark');
        }).catch(() => {});
      }
    } catch (_) {}
  }

  function sync(force=false) {
    const target = desired();

    if (!target.keys.length) {
      hardStopAll();
      return;
    }

    if (!force && activeSignature === target.signature && desiredIsPlaying(target.keys)) {
      return;
    }

    // Critical invariant: stop every source BEFORE starting the new scene.
    // This prevents river/waterfall/beach/dark audio from ever bleeding across.
    hardStopAll();
    const token = generation;
    activeSignature = target.signature;

    // Browsers may reject audible playback until user interaction. We still
    // attempt immediately, then every real user gesture retries this exact target.
    target.keys.forEach(key => startKey(key, token));
  }

  function userGestureSync() {
    unlocked = true;
    sync(false);
  }

  // First attempt.
  sync(true);

  // A real user gesture is the reliable iPhone/Safari audio unlock point.
  document.addEventListener('pointerdown', userGestureSync, {passive:true, capture:true});
  document.addEventListener('touchstart', userGestureSync, {passive:true, capture:true});
  document.addEventListener('keydown', userGestureSync, {capture:true});
  document.addEventListener('click', () => {
    unlocked = true;
    // Bubble phase runs after the theme/mute button's own click handler, so the
    // controller sees the NEW theme/mute state and starts the correct source.
    sync(false);
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
    hardStopAll({resetNature:false});
  });

  // If the browser suspends a track unexpectedly, restore only the CURRENT
  // desired scene. This never starts audio from an old background.
  setInterval(() => {
    const target = desired();
    if (!target.keys.length) {
      if (activeSignature) hardStopAll();
      return;
    }
    if (unlocked && (!desiredIsPlaying(target.keys) || activeSignature !== target.signature)) {
      sync(true);
    }
  }, 2500);

  window.SiteAudio = Object.freeze({
    sync,
    stopAll: hardStopAll,
    get scene(){ return sceneId; },
    get theme(){ return theme(); },
    get muted(){ return muted(); }
  });
})();