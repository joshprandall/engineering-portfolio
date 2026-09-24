(() => {
  'use strict';

  if (window.__JR_DARK_MUSIC_V11__) return;
  window.__JR_DARK_MUSIC_V11__ = true;

  const scriptUrl = new URL(document.currentScript?.src || location.href, location.href);
  const base = new URL('./', scriptUrl);
  const src = new URL('assets/audio/dark-theme.mp3', base).href;
  const MUTE_KEY = 'jr-site-ambient-muted-v2';
  const TIME_KEY = 'jr-dark-theme-time-v1';
  const PROJECT_RE = /(?:^|\/)(?:project-[^/]+\.html|play-evil-wizard\.html|agent-workbench\.html|games\/|geometric-lab\/|qubit-preview-20260921\/|deep-learning\/)/i;

  let suppressed = PROJECT_RE.test(location.pathname);
  let audio = null;
  let retryTimer = 0;

  const muted = () => {
    try { return localStorage.getItem(MUTE_KEY) === '1'; }
    catch (_) { return false; }
  };

  const theme = () => {
    if (window.PortfolioTheme?.getTheme) return window.PortfolioTheme.getTheme();
    return document.documentElement.dataset.theme || 'dark';
  };

  const lessonOpen = () => {
    const view = document.getElementById('lesson-view');
    return Boolean(view && !view.hidden);
  };

  const allowed = () =>
    theme() === 'dark' &&
    !muted() &&
    !suppressed &&
    !lessonOpen() &&
    !document.hidden;

  const saveTime = () => {
    if (!audio) return;
    try {
      const t = Number(audio.currentTime || 0);
      if (Number.isFinite(t) && t >= 0) localStorage.setItem(TIME_KEY, String(t));
    } catch (_) {}
  };

  const restoreTime = () => {
    if (!audio) return;
    try {
      const saved = Number(localStorage.getItem(TIME_KEY) || 0);
      if (!Number.isFinite(saved) || saved < 0) return;
      const d = Number(audio.duration || 0);
      audio.currentTime = d > 0 ? saved % d : saved;
    } catch (_) {}
  };

  const ensure = () => {
    if (audio) return audio;

    audio = document.createElement('audio');
    audio.id = 'jr-dark-theme-music';
    audio.src = src;
    audio.preload = 'auto';
    audio.loop = true;
    audio.autoplay = true;
    audio.playsInline = true;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('aria-hidden', 'true');
    audio.style.display = 'none';
    audio.volume = 0.28;

    audio.addEventListener('loadedmetadata', restoreTime, { once: true });
    audio.addEventListener('timeupdate', saveTime);
    audio.addEventListener('ended', () => {
      try { audio.currentTime = 0; audio.play().catch(() => {}); } catch (_) {}
    });
    audio.addEventListener('error', () => {
      console.error('JR dark-mode music failed to load:', src, audio.error);
    });

    (document.body || document.documentElement).appendChild(audio);
    try { audio.load(); } catch (_) {}
    return audio;
  };

  const pause = () => {
    if (!audio) return;
    saveTime();
    try { audio.pause(); } catch (_) {}
  };

  const play = () => {
    if (!allowed()) {
      pause();
      return;
    }
    const a = ensure();
    a.loop = true;
    a.muted = false;
    a.volume = 0.28;
    try {
      const p = a.play();
      if (p?.catch) p.catch(() => {});
    } catch (_) {}
  };

  const sync = () => {
    if (allowed()) play();
    else pause();
  };

  // Attempt immediately. Browsers that allow audible autoplay will start now.
  const boot = () => {
    ensure();
    sync();

    // iPhone/Safari: the first real user gesture after a page load is the
    // guaranteed opportunity to start audible playback.
    const gesture = () => {
      if (allowed()) play();
    };
    document.addEventListener('pointerdown', gesture, { passive: true, capture: true });
    document.addEventListener('touchstart', gesture, { passive: true, capture: true });
    document.addEventListener('click', gesture, { passive: true, capture: true });
    document.addEventListener('keydown', gesture, { capture: true });

    // Theme change happens synchronously from the Day/Night button click,
    // which preserves user activation on iOS.
    document.addEventListener('portfolio:theme', sync);
    document.addEventListener('portfolio:ambient-suppression', event => {
      suppressed = Boolean(event.detail && event.detail.active);
      sync();
    });

    // The existing global Mute button owns MUTE_KEY. Re-sync immediately after
    // its click handler flips the stored state.
    document.addEventListener('click', event => {
      if (!event.target.closest('[data-scene-audio]')) return;
      setTimeout(sync, 0);
    }, true);

    document.addEventListener('visibilitychange', sync);
    addEventListener('pageshow', sync);
    addEventListener('pagehide', saveTime);

    retryTimer = setInterval(() => {
      if (!allowed()) {
        pause();
        return;
      }
      const a = ensure();
      if (a.paused) play();
    }, 2000);

    window.DarkThemeMusic = Object.freeze({
      play,
      pause,
      sync,
      get element(){ return audio; },
      get src(){ return src; },
      get allowed(){ return allowed(); }
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();