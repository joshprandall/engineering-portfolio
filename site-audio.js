(() => {
  'use strict';

  // Unified site ambience controller. This is the ONLY script that may create
  // or play background ambience/music.
  if (window.SiteAudio || window.__JR_SITE_AUDIO_V31__) return;
  window.__JR_SITE_AUDIO_V31__ = true;
  window.__JR_SITE_AUDIO_V30__ = true;
  // Also claim the previous guard so a stale deferred V29 script cannot start
  // a second detached audio controller after this one initializes.
  window.__JR_SITE_AUDIO_V29__ = true;

  const MUTE_KEY = 'jr-site-ambient-muted-v3';
  const DARK_TIME_KEY = 'jr-dark-theme-time-v1';
  const VOLUME_KEY = 'jr-site-ambient-volume-v6';
  const LAST_NONZERO_VOLUME_KEY = 'jr-site-ambient-last-nonzero-v1';
  // Normal shared-shell pages always receive ambience. Only standalone interactive
  // experiences that intentionally own their own media environment are isolated.
  const ISOLATED_RE = /(?:^|\/)(?:games\/|geometric-lab\/|qubit-preview-20260921\/|deep-learning\/)/i;
  const AUDIO_BASE = new URL('./', document.currentScript?.src || location.href);

  const LOCAL_DAY_SOURCES = Object.freeze({
    river: new URL('assets/audio/day/river.mp3', AUDIO_BASE).href,
    waterfall: new URL('assets/audio/day/waterfall.mp3', AUDIO_BASE).href,
    beachNear: new URL('assets/audio/day/beach-near.mp3', AUDIO_BASE).href,
    beachFar: new URL('assets/audio/day/beach-far.mp3', AUDIO_BASE).href
  });

  const SOURCES = Object.freeze({
    // Night v32 is rebuilt from the full original recording as a beat-aligned,
    // circularly crossfaded PCM master. MP3 remains fallback only.
    dark: new URL('assets/audio/dark-theme-user-v32.wav', AUDIO_BASE).href,
    darkFallback: new URL('assets/audio/dark-theme-user-v32.mp3', AUDIO_BASE).href,

    // MP3 works across the target browsers. Original local OGGs remain the
    // fallback; third-party availability never controls runtime playback.
    river: LOCAL_DAY_SOURCES.river,
    waterfall: LOCAL_DAY_SOURCES.waterfall,
    beachNear: LOCAL_DAY_SOURCES.beachNear,
    beachFar: LOCAL_DAY_SOURCES.beachFar
  });

  const DAY_FALLBACKS = Object.freeze({
    river: new URL('assets/audio/day/river.ogg', AUDIO_BASE).href,
    waterfall: new URL('assets/audio/day/waterfall.ogg', AUDIO_BASE).href
  });
  const BEACH_SOURCES = Object.freeze([SOURCES.beachNear, SOURCES.beachFar]);
  const BEACH_FALLBACKS = Object.freeze([
    new URL('assets/audio/day/beach-near.ogg', AUDIO_BASE).href,
    new URL('assets/audio/day/beach-far.ogg', AUDIO_BASE).href
  ]);
  const BEACH_CROSSFADE_SECONDS = 1.2;
  const DARK_CROSSFADE_SECONDS = 0.18;

  // Branch-preview hosts serve the source tree verbatim, while the release
  // build reconstructs approved Day audio from preserved Git chunks. Rebuild
  // those exact MP3 bytes in-browser only for the branch preview. Blob URLs
  // also give Safari/Chrome a definite audio/mpeg MIME type for the dark MP3.
  const BRANCH_PREVIEW_HOST = /(?:^|\.)raw\.githack\.com$/i.test(location.hostname);
  const PREVIEW_AUDIO_ASSETS = Object.freeze({
    dark: {
      mime: 'audio/wav',
      parts: ['assets/audio/dark-theme-user-v32.wav']
    },
    river: {
      mime: 'audio/mpeg',
      parts: ['preservation/ambience/878679d3fcd4cf6c8361458f76b6e14cd77072b02aafe528bbb30f158fafa20d/0.bin']
    },
    waterfall: {
      mime: 'audio/mpeg',
      parts: ['preservation/ambience/67ee2ea0cbfa73192444aa7c561eb57ad705caa6423dfc27b16b62e53e127fe0/0.bin']
    },
    beachNear: {
      mime: 'audio/mpeg',
      parts: ['preservation/ambience/79d467f62f0c516c62661c6530b1358a956af47a90961e212f1535605d377264/0.bin']
    },
    beachFar: {
      mime: 'audio/mpeg',
      parts: ['preservation/ambience/b9b0dbce1d88951b063571b3b33d1741f814418f1178f3814b7f39501f8baeee/0.bin']
    }
  });
  const previewAudioUrls = new Map();
  const previewAudioLoads = new Map();
  const previewPlayerGenerations = new WeakMap();
  let previewWarmTimer = 0;

  function invalidatePreviewPlayer(player) {
    if (!BRANCH_PREVIEW_HOST || !player) return;
    previewPlayerGenerations.set(player, (previewPlayerGenerations.get(player) || 0) + 1);
    player.dataset.previewKey = '';
    if (player.dataset.previewFallback === 'loading') player.dataset.previewFallback = '0';
  }

  async function previewAudioUrl(key) {
    if (!BRANCH_PREVIEW_HOST) return '';
    if (previewAudioUrls.has(key)) return previewAudioUrls.get(key);
    if (previewAudioLoads.has(key)) return previewAudioLoads.get(key);
    const spec = PREVIEW_AUDIO_ASSETS[key];
    if (!spec) return '';
    const load = (async () => {
      const buffers = [];
      for (const part of spec.parts) {
        const response = await fetch(new URL(part, AUDIO_BASE), { cache: 'force-cache' });
        if (!response.ok) throw new Error('Preview media HTTP ' + response.status + ': ' + part);
        buffers.push(await response.arrayBuffer());
      }
      const url = URL.createObjectURL(new Blob(buffers, { type: spec.mime }));
      previewAudioUrls.set(key, url);
      return url;
    })().finally(() => previewAudioLoads.delete(key));
    previewAudioLoads.set(key, load);
    return load;
  }

  function warmPreviewAudio() {
    if (!BRANCH_PREVIEW_HOST) return;
    ['dark', 'waterfall', 'beachNear', 'beachFar'].forEach(key => previewAudioUrl(key).catch(() => {}));
    clearTimeout(previewWarmTimer);
    previewWarmTimer = setTimeout(() => previewAudioUrl('river').catch(() => {}), 2500);
  }
  warmPreviewAudio();

  async function usePreviewAudio(player, key, { loop = true, play = true, level } = {}) {
    if (!BRANCH_PREVIEW_HOST) return false;

    const desired = key.startsWith('beach') ? 'beach' : key;
    const targetLevel = level ?? cappedVolume(desired);
    if (play && desiredKey() !== desired) return false;
    const alreadyLoaded = player.dataset.previewFallback === '1' &&
      player.dataset.previewKey === key &&
      (player.currentSrc || player.src || '').startsWith('blob:');

    if (alreadyLoaded) {
      player.loop = loop;
      player.muted = false;
      setPlayerLevel(player, targetLevel);
      if (play) {
        if (desiredKey() !== desired || player.dataset.previewKey !== key) return false;
        try {
          const result = player.play();
          if (result?.then) await result;
        } catch (error) {
          if (error?.name === 'NotAllowedError') markAutoplayState(true);
          return false;
        }
      }
      markAutoplayState(false);
      return true;
    }

    const generation = (previewPlayerGenerations.get(player) || 0) + 1;
    previewPlayerGenerations.set(player, generation);
    player.dataset.previewFallback = 'loading';
    player.dataset.previewKey = key;

    try {
      const src = previewAudioUrls.get(key) || await previewAudioUrl(key);
      if (!src) throw new Error('No preview media source for ' + key);
      if (previewPlayerGenerations.get(player) !== generation || player.dataset.previewKey !== key) return false;
      if (play && desiredKey() !== desired) return false;

      player.pause();
      player.src = src;
      player.loop = loop;
      player.muted = false;
      setPlayerLevel(player, targetLevel);
      player.load();
      player.dataset.previewFallback = '1';

      if (play) {
        if (previewPlayerGenerations.get(player) !== generation || player.dataset.previewKey !== key || desiredKey() !== desired) return false;
        const result = player.play();
        if (result?.then) await result;
      }
      markAutoplayState(false);
      return true;
    } catch (error) {
      if (previewPlayerGenerations.get(player) === generation) {
        player.dataset.previewFallback = 'failed';
      }
      if (error?.name === 'NotAllowedError') markAutoplayState(true);
      else console.error('JR preview audio fallback failed:', key, error);
      return false;
    }
  }

  // Quiet-first ambience. The site starts at 5% of its own media output even
  // when the device is turned up. Users can mute it or deliberately raise it.
  // Hardware/device volume remains controlled by the operating system.
  const DEFAULT_BACKGROUND_VOLUME = 0.05;
  const MAX_BACKGROUND_VOLUME = 1.00;

  const sceneBackdrop = document.getElementById('site-scene');
  const expectsDayScene = Boolean(sceneBackdrop || document.querySelector('script[src*="site-scenes.js"]'));
  let sceneId = sceneBackdrop?.dataset.visibleDayScene || 'forest-river';
  let pendingSceneId = sceneBackdrop?.dataset.pendingDayScene ||
    (expectsDayScene && !sceneBackdrop?.dataset.visibleDayScene ? 'loading' : '');
  let suppressed = ISOLATED_RE.test(location.pathname);
  let currentKey = '';
  let unlocked = false;
  let switching = false;
  let darkFallbackActive = false;
  let autoplayBlocked = false;
  let autoplayRetryTimers = [];
  const suppressionReasons = new Set();
  const levels = new Map();
  const gains = new Map();
  let audioContext = null;
  let pageActive = true;
  const platformAudioSession = (() => {
    try { return typeof navigator !== 'undefined' ? navigator.audioSession || null : null; }
    catch (_) { return null; }
  })();
  let audioSessionRecoveryTimer = 0;

  function usePlaybackAudioSession(recover = false) {
    if (!platformAudioSession || !unlocked || muted() || suppressed) return;
    try {
      if (recover && platformAudioSession.type === 'playback') {
        platformAudioSession.type = 'ambient';
        clearTimeout(audioSessionRecoveryTimer);
        audioSessionRecoveryTimer = setTimeout(() => {
          try {
            if (!unlocked || !allowed()) return;
            platformAudioSession.type = 'playback';
            sync(true);
          } catch (_) {}
        }, 0);
        return;
      }
      platformAudioSession.type = 'playback';
    } catch (_) {}
  }

  function setPlayerLevel(player, value) {
    const level = Math.min(1, Math.max(0, Number(value) || 0));
    levels.set(player, level);
    const gain = gains.get(player);
    if (gain) {
      gain.gain.setValueAtTime(level, audioContext.currentTime);
      // Native iOS media volume is read-only; the gain controls the site level.
      try { player.volume = 1; } catch (_) {}
    } else {
      try { player.volume = level; } catch (_) {}
    }
  }

  function resumeVolumeGraph() {
    usePlaybackAudioSession(false);
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    if (!audioContext) {
      try {
        audioContext = new Context();
        for (const player of [audio, ...darkPlayers, ...beachPlayers]) {
          const gain = audioContext.createGain();
          gain.gain.value = levels.get(player) || 0;
          audioContext.createMediaElementSource(player).connect(gain);
          gain.connect(audioContext.destination);
          gains.set(player, gain);
          try { player.volume = 1; } catch (_) {}
        }
        audioContext.addEventListener?.('statechange', () => markAutoplayState(audioContext.state !== 'running'));
      } catch (_) {
        // Native media remains the fallback when Web Audio is unavailable.
        if (!gains.size) audioContext = null;
      }
    }
    if (audioContext && audioContext.state !== 'running') {
      try { audioContext.resume().then(() => markAutoplayState(audioContext.state !== 'running')).catch(() => markAutoplayState(true)); }
      catch (_) { markAutoplayState(true); }
    }
  }

  // Remove stale legacy players if a cached older script left one behind.
  document.querySelectorAll('#jr-site-audio, #jr-site-audio-dark-a, #jr-site-audio-dark-b, #jr-site-audio-beach-a, #jr-site-audio-beach-b, #jr-dark-theme-music').forEach(node => {
    try { node.pause(); } catch (_) {}
    try { node.remove(); } catch (_) {}
  });
  try { window.DarkThemeMusic?.pause?.(); } catch (_) {}

  const audio = document.createElement('audio');
  audio.id = 'jr-site-audio';
  audio.preload = 'auto';
  audio.autoplay = false;
  audio.muted = true;
  audio.loop = true;
  audio.playsInline = true;
  audio.setAttribute('playsinline', '');
  audio.setAttribute('aria-hidden', 'true');
  audio.style.display = 'none';
  setPlayerLevel(audio, DEFAULT_BACKGROUND_VOLUME);
  audio.defaultPlaybackRate = 1;
  audio.playbackRate = 1;
  (document.body || document.documentElement).appendChild(audio);

  function createDarkPlayer(id, preload = 'metadata') {
    const player = document.createElement('audio');
    player.id = id;
    player.preload = preload;
    player.autoplay = false;
    player.muted = true;
    player.loop = false;
    player.playsInline = true;
    player.setAttribute('playsinline', '');
    player.setAttribute('aria-hidden', 'true');
    player.style.display = 'none';
    setPlayerLevel(player, 0);
    player.src = SOURCES.dark;
    player.dataset.darkFallback = '0';
    player.dataset.previewFallback = '0';
    player.dataset.previewKey = '';
    (document.body || document.documentElement).appendChild(player);
    try { player.load(); } catch (_) {}
    return player;
  }

  const darkPlayers = [
    createDarkPlayer('jr-site-audio-dark-a', 'auto'),
    createDarkPlayer('jr-site-audio-dark-b', 'metadata')
  ];

  let darkActiveIndex = 0;
  let darkStarted = false;
  let darkTransitioning = false;
  let darkFadeFrame = 0;
  let darkGeneration = 0;

  function createBeachPlayer(id, src) {
    const player = document.createElement('audio');
    player.id = id;
    player.preload = 'auto';
    player.autoplay = false;
    player.muted = true;
    player.loop = false;
    player.playsInline = true;
    player.setAttribute('playsinline', '');
    player.setAttribute('aria-hidden', 'true');
    player.style.display = 'none';
    setPlayerLevel(player, 0);
    player.src = src;
    player.dataset.fallbackSrc = BEACH_FALLBACKS[id.endsWith('-a') ? 0 : 1];
    player.dataset.localFallback = '0';
    player.dataset.previewFallback = '0';
    player.dataset.previewKey = '';
    (document.body || document.documentElement).appendChild(player);
    try { player.load(); } catch (_) {}
    return player;
  }

  const beachPlayers = [
    createBeachPlayer('jr-site-audio-beach-a', BEACH_SOURCES[0]),
    createBeachPlayer('jr-site-audio-beach-b', BEACH_SOURCES[1])
  ];

  let beachActiveIndex = 0;
  let beachStarted = false;
  let beachTransitioning = false;
  let beachFadeFrame = 0;
  let beachGeneration = 0;

  function theme() {
    return window.PortfolioTheme?.getTheme?.() ||
      document.documentElement.dataset.theme ||
      'dark';
  }

  // Session state is authoritative; localStorage is persistence, not a second
  // controller. A failed write can never restore a stale volume or mute state.
  let memoryVolume = DEFAULT_BACKGROUND_VOLUME;
  let memoryMuted = false;
  let memoryLastNonzeroVolume = DEFAULT_BACKGROUND_VOLUME;

  function readSavedPreferences(key = null) {
    try {
      if (key === null || key === LAST_NONZERO_VOLUME_KEY) {
        const raw = localStorage.getItem(LAST_NONZERO_VOLUME_KEY);
        const saved = raw === null ? NaN : Number(raw);
        if (Number.isFinite(saved) && saved > 0) memoryLastNonzeroVolume = Math.min(MAX_BACKGROUND_VOLUME, saved);
      }
      if (key === null || key === VOLUME_KEY) {
        const raw = localStorage.getItem(VOLUME_KEY);
        const saved = raw === null ? DEFAULT_BACKGROUND_VOLUME : Number(raw);
        if (Number.isFinite(saved)) {
          memoryVolume = Math.min(MAX_BACKGROUND_VOLUME, Math.max(0, saved));
          if (memoryVolume > 0) memoryLastNonzeroVolume = memoryVolume;
        }
      }
      if (key === null || key === MUTE_KEY) memoryMuted = localStorage.getItem(MUTE_KEY) === '1';
    } catch (_) {
      // Keep the current in-memory values when persistence is unavailable.
    }
  }

  readSavedPreferences();

  function setMuted(value) {
    const next = Boolean(value);
    if (!next && memoryVolume <= 0) {
      memoryVolume = Math.min(MAX_BACKGROUND_VOLUME, Math.max(.01, memoryLastNonzeroVolume || DEFAULT_BACKGROUND_VOLUME));
      try { localStorage.setItem(VOLUME_KEY, String(memoryVolume)); } catch (_) {}
      applyPreferredVolume();
    }
    memoryMuted = next;
    try { localStorage.setItem(MUTE_KEY, memoryMuted ? '1' : '0'); } catch (_) {}
    sync(true);
    document.dispatchEvent(new CustomEvent('portfolio:ambient-volume'));
  }

  function muted() {
    return memoryMuted;
  }

  function lessonOpen() {
    const view = document.getElementById('lesson-view');
    return Boolean(view && !view.hidden);
  }

  function allowed() {
    return !muted() &&
      !suppressed &&
      pageActive &&
      !document.hidden;
  }

  function desiredKey() {
    if (!allowed() || (theme() === 'light' && pendingSceneId)) return '';
    if (theme() === 'dark') return 'dark';
    if (sceneId === 'forest-waterfall') return 'waterfall';
    if (sceneId === 'birds-water') return 'beach';
    return 'river';
  }

  function preferredVolume() {
    return memoryVolume;
  }

  function cappedVolume() {
    return preferredVolume();
  }

  function applyPreferredVolume() {
    const cap = preferredVolume();
    try {
      setPlayerLevel(audio, currentKey && currentKey !== 'dark' && currentKey !== 'beach' ? cap : 0);
    } catch (_) {}
    darkPlayers.forEach((player, index) => {
      if (darkTransitioning && cap > 0) return;
      try {
        setPlayerLevel(player, currentKey === 'dark' && index === darkActiveIndex ? cap : 0);
      } catch (_) {}
    });
    beachPlayers.forEach((player, index) => {
      if (beachTransitioning && cap > 0) return;
      try { setPlayerLevel(player, index === beachActiveIndex && beachStarted ? cap : 0); } catch (_) {}
    });
  }

  function setPreferredVolume(value) {
    const next = Math.min(MAX_BACKGROUND_VOLUME, Math.max(0, Number(value) || 0));
    memoryVolume = next;
    try { localStorage.setItem(VOLUME_KEY, String(next)); } catch (_) {}
    if (next > 0) {
      memoryLastNonzeroVolume = next;
      try { localStorage.setItem(LAST_NONZERO_VOLUME_KEY, String(next)); } catch (_) {}
    }
    applyPreferredVolume();
    document.dispatchEvent(new CustomEvent('portfolio:ambient-volume', { detail: { volume: next } }));
    return next;
  }

  function saveDarkTime() {
    if (currentKey !== 'dark') return;
    const player = darkPlayers[darkActiveIndex];
    try {
      const value = Number(player?.currentTime || 0);
      if (Number.isFinite(value) && value >= 0) {
        localStorage.setItem(DARK_TIME_KEY, String(value));
      }
    } catch (_) {}
  }

  function restoreDarkTime(player = darkPlayers[darkActiveIndex]) {
    if (currentKey !== 'dark' || !player) return;
    try {
      const saved = Number(localStorage.getItem(DARK_TIME_KEY) || 0);
      if (!Number.isFinite(saved) || saved < 0) return;
      const duration = Number(player.duration || 0);
      player.currentTime = duration > 0 ? saved % duration : saved;
    } catch (_) {}
  }

  function cancelDarkFade() {
    if (!darkFadeFrame) return;
    try { cancelAnimationFrame(darkFadeFrame); } catch (_) {}
    darkFadeFrame = 0;
  }

  function stopDark(reset = true) {
    darkGeneration += 1;
    cancelDarkFade();
    darkTransitioning = false;
    darkStarted = false;
    darkActiveIndex = 0;
    darkPlayers.forEach(player => {
      invalidatePreviewPlayer(player);
      try { setPlayerLevel(player, 0); } catch (_) {}
      try { player.muted = true; } catch (_) {}
      try { player.pause(); } catch (_) {}
      if (reset) {
        try { player.currentTime = 0; } catch (_) {}
      }
    });
  }

  function prepareDarkPlayer(player) {
    if (!player) return;
    player.loop = false;
    player.muted = false;
    player.defaultPlaybackRate = 1;
    player.playbackRate = 1;
    if (!BRANCH_PREVIEW_HOST &&
        player.src !== SOURCES.dark &&
        player.currentSrc !== SOURCES.dark &&
        !(player.dataset.darkFallback === '1' && player.currentSrc === SOURCES.darkFallback)) {
      player.src = SOURCES.dark;
      player.dataset.darkFallback = '0';
      try { player.load(); } catch (_) {}
    }
  }

  function playDark() {
    if (desiredKey() !== 'dark' || switching || darkTransitioning) return;
    resumeVolumeGraph();
    const player = darkPlayers[darkActiveIndex];
    const generation = darkGeneration;
    const cap = cappedVolume('dark');

    if (BRANCH_PREVIEW_HOST &&
        !(player.dataset.previewFallback === '1' && player.dataset.previewKey === 'dark' &&
          (player.currentSrc || player.src || '').startsWith('blob:'))) {
      usePreviewAudio(player, 'dark', { loop: false, play: false, level: cap }).then(ok => {
        if (!ok || generation !== darkGeneration || desiredKey() !== 'dark') return;
        restoreDarkTime(player);
        player.muted = false;
        setPlayerLevel(player, cap);
        try {
          const result = player.play();
          if (result?.then) result.then(() => {
            if (generation === darkGeneration && desiredKey() === 'dark') {
              darkStarted = true;
              markAutoplayState(false);
            }
          }).catch(error => {
            if (error?.name === 'NotAllowedError') markAutoplayState(true);
          });
        } catch (error) {
          if (error?.name === 'NotAllowedError') markAutoplayState(true);
        }
      });
      return;
    }

    prepareDarkPlayer(player);
    if (!darkStarted) restoreDarkTime(player);
    setPlayerLevel(player, cap);
    try {
      const result = player.play();
      if (result?.then) result.then(() => {
        if (generation === darkGeneration && desiredKey() === 'dark') {
          darkStarted = true;
          markAutoplayState(false);
        }
      }).catch(error => {
        if (generation !== darkGeneration) return;
        if (error?.name === 'NotAllowedError') markAutoplayState(true);
      });
    } catch (error) {
      if (error?.name === 'NotAllowedError') markAutoplayState(true);
    }
  }

  function beginDarkTransition() {
    if (darkTransitioning || currentKey !== 'dark' || desiredKey() !== 'dark') return;
    const fromIndex = darkActiveIndex;
    const toIndex = 1 - fromIndex;
    const from = darkPlayers[fromIndex];
    const to = darkPlayers[toIndex];
    const generation = darkGeneration;
    darkTransitioning = true;

    const beginFade = () => {
      if (generation !== darkGeneration || currentKey !== 'dark' || desiredKey() !== 'dark') {
        try { to.pause(); } catch (_) {}
        darkTransitioning = false;
        return;
      }
      const startedAt = performance.now();
      const fadeMs = DARK_CROSSFADE_SECONDS * 1000;
      const step = now => {
        if (generation !== darkGeneration || currentKey !== 'dark' || desiredKey() !== 'dark') {
          try { to.pause(); } catch (_) {}
          darkTransitioning = false;
          darkFadeFrame = 0;
          return;
        }
        const progress = Math.min(1, Math.max(0, (now - startedAt) / fadeMs));
        const cap = cappedVolume('dark');
        setPlayerLevel(from, cap * (1 - progress));
        setPlayerLevel(to, cap * progress);
        if (progress < 1) {
          darkFadeFrame = requestAnimationFrame(step);
          return;
        }
        darkFadeFrame = 0;
        try { from.pause(); from.currentTime = 0; } catch (_) {}
        setPlayerLevel(from, 0);
        setPlayerLevel(to, cap);
        darkActiveIndex = toIndex;
        darkTransitioning = false;
        darkStarted = true;
      };
      darkFadeFrame = requestAnimationFrame(step);
    };

    const startNext = () => {
      try { to.currentTime = 0; } catch (_) {}
      to.loop = false;
      to.muted = false;
      setPlayerLevel(to, 0);
      try {
        const result = to.play();
        Promise.resolve(result).then(beginFade).catch(() => {
          darkTransitioning = false;
        });
      } catch (_) {
        darkTransitioning = false;
      }
    };

    if (BRANCH_PREVIEW_HOST &&
        !(to.dataset.previewFallback === '1' && to.dataset.previewKey === 'dark' &&
          (to.currentSrc || to.src || '').startsWith('blob:'))) {
      usePreviewAudio(to, 'dark', { loop: false, play: false, level: 0 })
        .then(ok => { if (ok) startNext(); else darkTransitioning = false; });
      return;
    }

    prepareDarkPlayer(to);
    startNext();
  }

  darkPlayers.forEach((player, index) => {
    player.addEventListener('loadedmetadata', () => {
      if (currentKey === 'dark' && index === darkActiveIndex && !darkStarted) restoreDarkTime(player);
    });
    player.addEventListener('timeupdate', () => {
      if (currentKey !== 'dark' || index !== darkActiveIndex || darkTransitioning) return;
      const duration = Number(player.duration || 0);
      const current = Number(player.currentTime || 0);
      if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(current)) return;
      if (duration - current <= DARK_CROSSFADE_SECONDS + .3) beginDarkTransition();
    });
    player.addEventListener('ended', () => {
      if (currentKey === 'dark' && index === darkActiveIndex && !darkTransitioning) beginDarkTransition();
    });
    player.addEventListener('error', () => {
      if (player.dataset.darkFallback !== '1' && player.currentSrc !== SOURCES.darkFallback) {
        player.dataset.darkFallback = '1';
        try {
          player.pause();
          player.src = SOURCES.darkFallback;
          player.load();
          if (currentKey === 'dark' && index === darkActiveIndex && desiredKey() === 'dark') playDark();
        } catch (_) {}
        return;
      }
      console.error('JR Night ambience failed:', player.currentSrc, player.error);
    });
    player.addEventListener('volumechange', () => {
      const cap = cappedVolume('dark');
      if (!gains.has(player) && player.volume > cap) setPlayerLevel(player, cap);
    });
    player.addEventListener('ratechange', () => {
      if (player.defaultPlaybackRate !== 1) player.defaultPlaybackRate = 1;
      if (player.playbackRate !== 1) player.playbackRate = 1;
    });
  });

  function cancelBeachFade() {
    if (!beachFadeFrame) return;
    try { cancelAnimationFrame(beachFadeFrame); } catch (_) {}
    beachFadeFrame = 0;
  }

  function stopBeach(reset = true) {
    beachGeneration += 1;
    cancelBeachFade();
    beachTransitioning = false;
    beachStarted = false;
    beachActiveIndex = 0;

    beachPlayers.forEach(player => {
      invalidatePreviewPlayer(player);
      // Mute first, then pause. On Safari this closes the audible media pipeline
      // immediately instead of allowing a decoded tail from the outgoing scene.
      try { setPlayerLevel(player, 0); } catch (_) {}
      try { player.muted = true; } catch (_) {}
      try { player.pause(); } catch (_) {}
      if (reset) {
        try { player.currentTime = 0; } catch (_) {}
      }
    });
  }

  function beginBeachTransition() {
    if (beachTransitioning || currentKey !== 'beach' || desiredKey() !== 'beach') return;

    const fromIndex = beachActiveIndex;
    const toIndex = 1 - fromIndex;
    const from = beachPlayers[fromIndex];
    const to = beachPlayers[toIndex];
    const generation = beachGeneration;

    beachTransitioning = true;
    try { to.currentTime = 0; } catch (_) {}
    to.loop = false;
    to.muted = false;
    setPlayerLevel(to, 0);

    let playResult;
    try { playResult = to.play(); }
    catch (_) {
      beachTransitioning = false;
      return;
    }

    Promise.resolve(playResult).then(() => {
      if (generation !== beachGeneration || currentKey !== 'beach' || desiredKey() !== 'beach') {
        try { to.pause(); } catch (_) {}
        beachTransitioning = false;
        return;
      }

      const startedAt = performance.now();
      const fadeMs = BEACH_CROSSFADE_SECONDS * 1000;

      const step = now => {
        if (generation !== beachGeneration || currentKey !== 'beach' || desiredKey() !== 'beach') {
          try { to.pause(); } catch (_) {}
          beachTransitioning = false;
          beachFadeFrame = 0;
          return;
        }

        const progress = Math.min(1, Math.max(0, (now - startedAt) / fadeMs));
        const cap = cappedVolume('beach');
        // Complementary linear fades keep the combined website-side level at
        // or below the user-selected ambience level.
        setPlayerLevel(from, cap * (1 - progress));
        setPlayerLevel(to, cap * progress);

        if (progress < 1) {
          beachFadeFrame = requestAnimationFrame(step);
          return;
        }

        beachFadeFrame = 0;
        try { from.pause(); } catch (_) {}
        try { from.currentTime = 0; } catch (_) {}
        setPlayerLevel(from, 0);
        setPlayerLevel(to, cap);
        beachActiveIndex = toIndex;
        beachTransitioning = false;
      };

      beachFadeFrame = requestAnimationFrame(step);
    }).catch(() => {
      beachTransitioning = false;
    });
  }

  function markAutoplayState(blocked) {
    blocked = Boolean(blocked || (audioContext && audioContext.state !== 'running'));
    if (autoplayBlocked === blocked) return;
    autoplayBlocked = blocked;
    document.dispatchEvent(new CustomEvent('portfolio:ambient-autoplay', {
      detail: { blocked }
    }));
  }

  function playBeach() {
    if (desiredKey() !== 'beach' || switching || beachTransitioning) return;
    resumeVolumeGraph();
    const player = beachPlayers[beachActiveIndex];
    const generation = beachGeneration;
    const cap = cappedVolume('beach');
    const previewKey = beachActiveIndex === 0 ? 'beachNear' : 'beachFar';

    if (BRANCH_PREVIEW_HOST &&
        !(player.dataset.previewFallback === '1' && player.dataset.previewKey === previewKey &&
          (player.currentSrc || player.src || '').startsWith('blob:'))) {
      beachStarted = false;
      usePreviewAudio(player, previewKey, { loop: false, play: true, level: cap }).then(ok => {
        if (generation !== beachGeneration || desiredKey() !== 'beach') return;
        beachStarted = ok;
      });
      return;
    }

    if (!beachStarted) {
      try { player.currentTime = 0; } catch (_) {}
    }

    player.loop = false;
    player.muted = false;
    setPlayerLevel(player, cap);
    beachStarted = true;

    try {
      const result = player.play();
      if (result?.then) result.then(() => {
        if (generation === beachGeneration && desiredKey() === 'beach') markAutoplayState(false);
      }).catch(error => {
        if (generation !== beachGeneration) return;
        beachStarted = false;
        if (error?.name === 'NotAllowedError') markAutoplayState(true);
      });
    } catch (_) {
      beachStarted = false;
    }
  }

  beachPlayers.forEach((player, index) => {
    player.addEventListener('timeupdate', () => {
      if (currentKey !== 'beach' || index !== beachActiveIndex || beachTransitioning) return;
      const duration = Number(player.duration || 0);
      const current = Number(player.currentTime || 0);
      if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(current)) return;

      // Start the alternate field recording just before this one ends. The
      // overlap masks both decoder scheduling jitter and the acoustic seam.
      if (duration - current <= BEACH_CROSSFADE_SECONDS + 0.18) {
        beginBeachTransition();
      }
    });

    player.addEventListener('ended', () => {
      if (currentKey === 'beach' && index === beachActiveIndex && !beachTransitioning) {
        beginBeachTransition();
      }
    });

    player.addEventListener('error', () => {
      const fallback = player.dataset.fallbackSrc;
      if (player.dataset.localFallback !== '1' && fallback) {
        player.dataset.localFallback = '1';
        try {
          player.pause();
          player.src = fallback;
          player.load();
          if (currentKey === 'beach' && index === beachActiveIndex && desiredKey() === 'beach') playBeach();
        } catch (_) {}
        return;
      }
      if (BRANCH_PREVIEW_HOST && player.dataset.previewFallback !== 'loading' && player.dataset.previewFallback !== '1') {
        const previewKey = index === 0 ? 'beachNear' : 'beachFar';
        const active = currentKey === 'beach' && index === beachActiveIndex && desiredKey() === 'beach';
        usePreviewAudio(player, previewKey, { loop: false, play: active, level: active ? cappedVolume('beach') : 0 })
          .then(ok => { if (ok && active) playBeach(); });
        return;
      }
      console.error('JR beach ambience failed:', player.currentSrc, player.error);
    });

    player.addEventListener('volumechange', () => {
      const cap = cappedVolume('beach');
      if (!gains.has(player) && player.volume > cap) setPlayerLevel(player, cap);
    });
  });

  function stop() {
    saveDarkTime();
    stopDark(true);
    invalidatePreviewPlayer(audio);
    // Mute/zero before pause to prevent Safari from leaking buffered audio from
    // the outgoing scene into the next visual scene.
    try { setPlayerLevel(audio, 0); } catch (_) {}
    try { audio.muted = true; } catch (_) {}
    try { audio.pause(); } catch (_) {}
    stopBeach(true);
  }

  function hardSilenceDay() {
    if (theme() !== 'light') return;
    try { setPlayerLevel(audio, 0); } catch (_) {}
    try { audio.muted = true; } catch (_) {}
    try { audio.pause(); } catch (_) {}
    stopBeach(true);
  }

  function applySource(nextKey) {
    if (!nextKey) {
      stop();
      currentKey = '';
      return;
    }

    if (nextKey === 'dark') {
      if (currentKey === 'dark') {
        applyPreferredVolume();
        return;
      }
      switching = true;
      stop();
      currentKey = 'dark';
      darkFallbackActive = false;
      darkActiveIndex = 0;
      darkStarted = false;
      darkTransitioning = false;
      darkPlayers.forEach(player => {
        player.dataset.darkFallback = '0';
        if (!BRANCH_PREVIEW_HOST) prepareDarkPlayer(player);
      });
      switching = false;
      return;
    }

    if (nextKey === 'beach') {
      if (currentKey === 'beach') return;

      switching = true;
      stop();
      currentKey = 'beach';

      if (BRANCH_PREVIEW_HOST) {
        Promise.all([
          usePreviewAudio(beachPlayers[0], 'beachNear', { loop: false, play: false, level: 0 }),
          usePreviewAudio(beachPlayers[1], 'beachFar', { loop: false, play: false, level: 0 })
        ]).then(() => {
          switching = false;
          if (desiredKey() === 'beach') playBeach();
        });
        return;
      }

      switching = false;
      return;
    }

    const retainedFallback = audio.dataset.dayFallback === '1' && audio.src === DAY_FALLBACKS[nextKey];
    const retainedPreview = BRANCH_PREVIEW_HOST &&
      audio.dataset.previewFallback === '1' &&
      audio.dataset.previewKey === nextKey &&
      (audio.currentSrc || audio.src || '').startsWith('blob:');
    if (currentKey === nextKey && (audio.src === SOURCES[nextKey] || retainedFallback || retainedPreview)) {
      setPlayerLevel(audio, cappedVolume(nextKey));
      return;
    }

    switching = true;
    stop();

    currentKey = nextKey;
    audio.dataset.dayFallback = '0';

    if (BRANCH_PREVIEW_HOST) {
      usePreviewAudio(audio, nextKey, { loop: true, play: true, level: cappedVolume(nextKey) })
        .then(ok => {
          switching = false;
          if (!ok && desiredKey() === nextKey) {
            audio.src = SOURCES[nextKey];
            try { audio.load(); } catch (_) {}
          }
        });
      return;
    }

    audio.loop = true;
    audio.muted = false;
    audio.defaultPlaybackRate = 1;
    audio.playbackRate = 1;
    setPlayerLevel(audio, cappedVolume(nextKey));
    audio.src = SOURCES[nextKey];

    audio.onloadedmetadata = () => {
      if (currentKey !== nextKey || (audio.currentSrc && audio.currentSrc !== audio.src)) return;
      try { audio.currentTime = 0; } catch (_) {}
      switching = false;
      if (desiredKey() === nextKey) playDesired();
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
    resumeVolumeGraph();

    if (key === 'dark') {
      playDark();
      return;
    }

    if (key === 'beach') {
      playBeach();
      return;
    }

    if (BRANCH_PREVIEW_HOST &&
        audio.dataset.previewKey === key &&
        audio.dataset.previewFallback === 'loading') {
      return;
    }

    audio.loop = true;
    audio.muted = false;
    audio.defaultPlaybackRate = 1;
    audio.playbackRate = 1;
    setPlayerLevel(audio, cappedVolume(key));

    try {
      const result = audio.play();
      if (result?.then) result.then(() => {
        if (desiredKey() === key && currentKey === key) markAutoplayState(false);
      }).catch(error => {
        if (desiredKey() !== key || currentKey !== key) return;
        if (error?.name === 'NotAllowedError') markAutoplayState(true);
      });
    } catch (error) {
      if (error?.name === 'NotAllowedError') markAutoplayState(true);
    }
  }

  function sync(force = false) {
    const key = desiredKey();

    if (!key) {
      stop();
      currentKey = '';
      return;
    }

    if (force || currentKey !== key) applySource(key);

    if (key === 'dark') {
      const active = darkPlayers[darkActiveIndex];
      if (!switching && (!darkStarted || (active.paused && !darkTransitioning))) playDark();
      return;
    }

    if (key === 'beach') {
      const active = beachPlayers[beachActiveIndex];
      if (!switching && (!beachStarted || (active.paused && !beachTransitioning))) {
        playBeach();
      }
      return;
    }

    if (!switching && (audio.paused || audio.ended)) {
      playDesired();
    }
  }

  function unlockAndPlay() {
    unlocked = true;
    usePlaybackAudioSession(autoplayBlocked);
    resumeVolumeGraph();
    clearAutoplayRetries();
    playDesired();
  }

  function clearAutoplayRetries() {
    autoplayRetryTimers.forEach(timer => clearTimeout(timer));
    autoplayRetryTimers = [];
  }

  function scheduleAutoplayRetries() {
    if (muted() || suppressed) return;
    clearAutoplayRetries();

    // Start immediately, then retry as the document/media pipeline settles.
    // Browsers that permit audible autoplay will begin without any interaction.
    [0, 120, 450, 1100, 2200].forEach(delay => {
      autoplayRetryTimers.push(setTimeout(() => {
        if (!document.hidden && allowed()) playDesired();
      }, delay));
    });
  }

  platformAudioSession?.addEventListener?.('statechange', () => {
    if (platformAudioSession.state === 'active' && unlocked && allowed()) {
      usePlaybackAudioSession(false);
      sync(true);
    }
  });

  // Best effort immediately. Browsers that allow audible autoplay start here.
  // Safari/iOS and some Chromium configurations may still require a real user
  // gesture; that browser policy cannot be bypassed by page JavaScript.
  sync(true);
  scheduleAutoplayRetries();

  document.addEventListener('pointerdown', unlockAndPlay, { passive: true, capture: true });
  document.addEventListener('touchstart', unlockAndPlay, { passive: true, capture: true });
  document.addEventListener('keydown', unlockAndPlay, { capture: true });

  // Bubble phase intentionally runs after the Day/Night or Mute button changes
  // its state, so the controller sees the final state from that interaction.
  document.addEventListener('click', () => {
    unlocked = true;
    usePlaybackAudioSession(autoplayBlocked);
    sync(true);
  });

  document.addEventListener('portfolio:theme', () => {
    if (unlocked) usePlaybackAudioSession(autoplayBlocked);
    sync(true);
    scheduleAutoplayRetries();
  });

  document.addEventListener('portfolio:scene-will-change', event => {
    const next = event.detail?.id;
    if (!next || theme() !== 'light') return;
    pendingSceneId = next;
    hardSilenceDay();
  });

  document.addEventListener('portfolio:scene', event => {
    const next = event.detail?.id;
    if (!next) return;
    sceneId = next;
    pendingSceneId = '';
    // Always force a scene commit. This makes a visual scene change the single
    // source of truth for ambience, rather than allowing audio to keep its own
    // independent timing state.
    sync(true);
  });

  document.addEventListener('portfolio:ambient-suppression', event => {
    const reason = event.detail?.reason || 'activity';
    if (event.detail?.active) suppressionReasons.add(reason);
    else suppressionReasons.delete(reason);
    suppressed = ISOLATED_RE.test(location.pathname) || suppressionReasons.size > 0;
    sync(true);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && unlocked) usePlaybackAudioSession(true);
    sync(true);
    if (!document.hidden) scheduleAutoplayRetries();
  });
  addEventListener('DOMContentLoaded', scheduleAutoplayRetries, { once: true });
  addEventListener('load', scheduleAutoplayRetries, { once: true });
  addEventListener('pageshow', () => {
    pageActive = true;
    warmPreviewAudio();
    if (unlocked) usePlaybackAudioSession(true);
    sync(true);
    scheduleAutoplayRetries();
  });
  addEventListener('pagehide', () => {
    clearTimeout(previewWarmTimer);
    clearTimeout(audioSessionRecoveryTimer);
    previewAudioUrls.forEach(url => { try { URL.revokeObjectURL(url); } catch (_) {} });
    previewAudioUrls.clear();
    pageActive = false;
    clearAutoplayRetries();
    saveDarkTime();
    stop();
  });

  // Only external storage events reload persistence. Local controls never
  // reread an old value after a failed write.
  addEventListener('storage', event => {
    if (event.key !== null &&
        event.key !== MUTE_KEY &&
        event.key !== VOLUME_KEY &&
        event.key !== LAST_NONZERO_VOLUME_KEY) return;
    try { if (event.storageArea && event.storageArea !== localStorage) return; } catch (_) { return; }
    readSavedPreferences(event.key);
    applyPreferredVolume();
    sync(true);
    document.dispatchEvent(new CustomEvent('portfolio:ambient-volume'));
  });

  audio.addEventListener('ended', () => {
    if (!currentKey || currentKey === 'dark' || desiredKey() !== currentKey) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (_) {}
  });

  audio.addEventListener('error', () => {
    // Late load/error events cannot restart muted, hidden or outgoing media.
    if (!currentKey || desiredKey() !== currentKey) return;
    if ((currentKey === 'river' || currentKey === 'waterfall') &&
        audio.dataset.dayFallback !== '1' &&
        DAY_FALLBACKS[currentKey] &&
        audio.currentSrc !== DAY_FALLBACKS[currentKey]) {
      audio.dataset.dayFallback = '1';
      audio.src = DAY_FALLBACKS[currentKey];
      audio.loop = true;
      audio.muted = false;
      setPlayerLevel(audio, cappedVolume(currentKey));
      try {
        const result = audio.play();
        if (result?.catch) result.catch(() => {});
      } catch (_) {}
      return;
    }
    if (BRANCH_PREVIEW_HOST &&
        !(audio.dataset.previewFallback === '1' && audio.dataset.previewKey === currentKey &&
          (audio.currentSrc || audio.src || '').startsWith('blob:'))) {
      usePreviewAudio(audio, currentKey, { loop: true, play: true, level: cappedVolume(currentKey) });
      return;
    }
    console.error('JR site audio failed:', currentKey, audio.currentSrc, audio.error);
  });

  // Enforce the ceiling and normal speed even if another script, browser,
  // media-session quirk, or in-app browser tries to alter either value.
  audio.addEventListener('volumechange', () => {
    if (audio.volume > MAX_BACKGROUND_VOLUME) {
      setPlayerLevel(audio, MAX_BACKGROUND_VOLUME);
    }
  });
  audio.addEventListener('ratechange', () => {
    if (audio.defaultPlaybackRate !== 1) audio.defaultPlaybackRate = 1;
    if (audio.playbackRate !== 1) audio.playbackRate = 1;
  });

  // Recovery watchdog: one player, one desired source, no cross-theme bleed.
  setInterval(() => {
    const key = desiredKey();

    if (!key) {
      if (!audio.paused || beachPlayers.some(player => !player.paused)) stop();
      return;
    }

    if (key !== currentKey) {
      sync(true);
      return;
    }

    if (audio.volume > MAX_BACKGROUND_VOLUME) {
      setPlayerLevel(audio, MAX_BACKGROUND_VOLUME);
    }

    if (key === 'dark') {
      const active = darkPlayers[darkActiveIndex];
      if (unlocked && !switching && !darkTransitioning && (!darkStarted || active.paused)) playDark();
      return;
    }

    if (key === 'beach') {
      const active = beachPlayers[beachActiveIndex];
      if (unlocked && !switching && !beachTransitioning && (!beachStarted || active.paused)) {
        playBeach();
      }
      return;
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
    get pendingScene() { return pendingSceneId; },
    get theme() { return theme(); },
    get muted() { return muted(); },
    get suppressed() { return suppressed; },
    get autoplayBlocked() { return autoplayBlocked; },
    get audioSessionType() { return platformAudioSession?.type || 'unavailable'; },
    get audioSessionState() { return platformAudioSession?.state || 'unavailable'; },
    get maxVolume() { return MAX_BACKGROUND_VOLUME; },
    get volume() { return preferredVolume(); },
    get volumeBackend() { return gains.size ? 'gain' : 'media'; },
    get outputLevels() { return [audio, ...darkPlayers, ...beachPlayers].map(player => ({ level: gains.get(player)?.gain.value ?? player.volume, muted: player.muted, paused: player.paused })); },
    setVolume: setPreferredVolume,
    setMuted,
    get element() {
      if (currentKey === 'dark') return darkPlayers[darkActiveIndex];
      if (currentKey === 'beach') return beachPlayers[beachActiveIndex];
      return audio;
    },
    get darkElements() { return darkPlayers.slice(); },
    get beachElements() { return beachPlayers.slice(); }
  });
  document.dispatchEvent(new CustomEvent('portfolio:site-audio-ready'));
})();
