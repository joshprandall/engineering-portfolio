(() => {
  'use strict';

  if (window.__JR_SITE_AUDIO_V13__) return;
  window.__JR_SITE_AUDIO_V13__ = true;

  const scriptUrl = new URL(document.currentScript?.src || location.href, location.href);
  const base = new URL('./', scriptUrl);

  const MUTE_KEY = 'jr-site-ambient-muted-v2';
  const DARK_TIME_KEY = 'jr-dark-theme-time-v1';
  const PROJECT_RE = /(?:^|\/)(?:project-[^/]+\.html|play-evil-wizard\.html|agent-workbench\.html|games\/|geometric-lab\/|qubit-preview-20260921\/|deep-learning\/)/i;

  const SOURCES = {
    dark: new URL('assets/audio/dark-theme.mp3', base).href,
    river: new URL('assets/audio/river.mp3', base).href,
    waterfall: new URL('assets/audio/waterfall.mp3', base).href,
    beach: new URL('assets/audio/beach.mp3', base).href
  };

  // Hard ceiling for all background ambience/music. This caps the website's
  // own media gain at 15% even when the visitor's device volume is at 100%.
  const MAX_BACKGROUND_VOLUME = .15;
  const VOLUME = {
    dark: .15,
    river: .15,
    waterfall: .15,
    beach: .15
  };

  function cappedVolume(key) {
    return Math.min(MAX_BACKGROUND_VOLUME, Math.max(0, Number(VOLUME[key] ?? MAX_BACKGROUND_VOLUME)));
  }

  let sceneId = 'forest-river';
  let suppressed = PROJECT_RE.test(location.pathname);
  let currentKey = '';
  let unlocked = false;

  // ONE audio element for the entire site. This is deliberate: iPhone/Safari
  // is far more reliable after a single element has been unlocked by a tap.
  const audio = document.createElement('audio');
  audio.id = 'jr-site-audio';
  audio.preload = 'auto';
  audio.loop = true;
  audio.playsInline = true;
  audio.setAttribute('playsinline', '');
  audio.setAttribute('aria-hidden', 'true');
  audio.style.display = 'none';
  (document.body || document.documentElement).appendChild(audio);

  function theme() {
    return window.PortfolioTheme?.getTheme?.() || document.documentElement.dataset.theme || 'dark';
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
    return !muted() && !suppressed && !lessonOpen() && !document.hidden;
  }

  function saveDarkTime() {
    if (currentKey !== 'dark') return;
    try {
      const value = Number(audio.currentTime || 0);
      if (Number.isFinite(value) && value >= 0) localStorage.setItem(DARK_TIME_KEY, String(value));
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

  function desiredKey() {
    if (!allowed()) return '';
    if (theme() === 'dark') return 'dark';
    if (sceneId === 'forest-waterfall') return 'waterfall';
    if (sceneId === 'birds-water') return 'beach';
    return 'river';
  }

  function hardStop() {
    saveDarkTime();
    try { audio.pause(); } catch (_) {}
  }

  function switchSource(nextKey) {
    if (!nextKey) {
      hardStop();
      currentKey = '';
      return;
    }

    if (currentKey === nextKey && audio.src === SOURCES[nextKey]) return;

    // Hard cut first. No old scene is allowed to continue under a new visual.
    hardStop();
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
    };

    try { audio.load(); } catch (_) {}
  }

  function attemptPlay() {
    const key = desiredKey();
    if (!key) {
      hardStop();
      currentKey = '';
      return;
    }

    switchSource(key);
    audio.loop = true;
    audio.muted = false;
    audio.volume = cappedVolume(key);

    try {
      const p = audio.play();
      if (p?.catch) p.catch(() => {});
    } catch (_) {}
  }

  function sync(force=false) {
    const key = desiredKey();

    if (!key) {
      hardStop();
      currentKey = '';
      return;
    }

    if (force || currentKey !== key) {
      switchSource(key);
    }

    // If the same source is already playing, do nothing. Otherwise retry.
    if (audio.paused || audio.ended) attemptPlay();
  }

  function userGesture() {
    unlocked = true;
    attemptPlay();
  }

  // First best-effort attempt. Safari may wait for a tap.
  sync(true);

  // The first real gesture unlocks this ONE media element. After that, scene
  // changes reuse the same element rather than trying to unlock new players.
  document.addEventListener('pointerdown', userGesture, {passive:true, capture:true});
  document.addEventListener('touchstart', userGesture, {passive:true, capture:true});
  document.addEventListener('keydown', userGesture, {capture:true});
  document.addEventListener('click', () => {
    unlocked = true;
    // Bubble phase sees the post-click theme/mute state.
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
    hardStop();
  });

  audio.addEventListener('ended', () => {
    if (desiredKey() === currentKey) {
      try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch (_) {}
    }
  });

  audio.addEventListener('error', () => {
    console.error('JR site audio failed:', currentKey, audio.currentSrc, audio.error);
  });

  // Enforce the 15% ceiling even if another script tries to raise the player.
  audio.addEventListener('volumechange', () => {
    if (audio.volume > MAX_BACKGROUND_VOLUME) {
      audio.volume = MAX_BACKGROUND_VOLUME;
    }
  });

  setInterval(() => {
    const key = desiredKey();
    if (!key) {
      if (!audio.paused) hardStop();
      return;
    }
    if (key !== currentKey) {
      sync(true);
      return;
    }
    if (unlocked && audio.paused) attemptPlay();
  }, 2000);

  window.SiteAudio = Object.freeze({
    sync,
    stop: hardStop,
    get key(){ return currentKey; },
    get scene(){ return sceneId; },
    get theme(){ return theme(); },
    get muted(){ return muted(); },
    get maxVolume(){ return MAX_BACKGROUND_VOLUME; },
    get element(){ return audio; }
  });
})();