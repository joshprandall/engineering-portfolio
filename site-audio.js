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
    // User-provided dark-mode soundtrack. Prefer the PCM WAV master so the browser has no MP3/AAC encoder padding at the loop boundary.
    dark: new URL('assets/audio/dark-theme-user.wav', AUDIO_BASE).href,
    darkFallback: new URL('assets/audio/dark-theme-user.mp3', AUDIO_BASE).href,

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

  // Branch-preview hosts serve the source tree verbatim, while the release
  // build reconstructs approved Day audio from preserved Git chunks. Rebuild
  // those exact MP3 bytes in-browser only for the branch preview. Blob URLs
  // also give Safari/Chrome a definite audio/mpeg MIME type for the dark MP3.
  const BRANCH_PREVIEW_HOST = /(?:^|\.)raw\.githack\.com$/i.test(location.hostname);
  const PREVIEW_AUDIO_ASSETS = Object.freeze({
    dark: {
      mime: 'audio/mpeg',
      parts: ['assets/audio/dark-theme-user.mp3']
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

  async function usePreviewAudio(player, key, { loop = true, play = true, level } = {}) {
    if (!BRANCH_PREVIEW_HOST || player.dataset.previewFallback === 'loading' || player.dataset.previewFallback === '1') return false;
    player.dataset.previewFallback = 'loading';
    try {
      const src = await previewAudioUrl(key);
      if (!src) throw new Error('No preview media source for ' + key);
      player.pause();
      player.src = src;
      player.loop = loop;
      player.muted = false;
      setPlayerLevel(player, level ?? cappedVolume(key.startsWith('beach') ? 'beach' : key));
      player.load();
      player.dataset.previewFallback = '1';
      if (play) {
        const result = player.play();
        if (result?.then) await result;
      }
      markAutoplayState(false);
      return true;
    } catch (error) {
      player.dataset.previewFallback = 'failed';
      console.error('JR preview audio fallback failed:', key, error);
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
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    if (!audioContext) {
      try {
        audioContext = new Context();
        for (const player of [audio, ...beachPlayers]) {
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

  let memoryVolume=DEFAULT_BACKGROUND_VOLUME, memoryMuted=false;
  function setMuted(value){memoryMuted=Boolean(value);try{localStorage.setItem(MUTE_KEY,memoryMuted?'1':'0');}catch{}sync(true);document.dispatchEvent(new CustomEvent('portfolio:ambient-volume'));}
  function muted() {
    try { const value=localStorage.getItem(MUTE_KEY);return value===null?memoryMuted:value==='1'; }
    catch (_) { return memoryMuted; }
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
    try {
      const raw = localStorage.getItem(VOLUME_KEY);
      const saved = raw === null ? memoryVolume : Number(raw);
      if (Number.isFinite(saved)) return Math.min(MAX_BACKGROUND_VOLUME, Math.max(0, saved));
    } catch (_) {}
    return memoryVolume;
  }

  function cappedVolume() {
    return preferredVolume();
  }

  function applyPreferredVolume() {
    const cap = preferredVolume();
    try { setPlayerLevel(audio, cap); } catch (_) {}
    beachPlayers.forEach((player, index) => {
      if (beachTransitioning && cap > 0) return;
      try { setPlayerLevel(player, index === beachActiveIndex && beachStarted ? cap : 0); } catch (_) {}
    });
  }

  function setPreferredVolume(value) {
    const next = Math.min(MAX_BACKGROUND_VOLUME, Math.max(0, Number(value) || 0));
    memoryVolume=next;
    try { localStorage.setItem(VOLUME_KEY, String(next)); } catch (_) {}
    applyPreferredVolume();
    document.dispatchEvent(new CustomEvent('portfolio:ambient-volume', { detail: { volume: next } }));
    return next;
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
    if (desiredKey() !== 'beach') return;
    resumeVolumeGraph();
    const player = beachPlayers[beachActiveIndex];
    const generation = beachGeneration;
    const cap = cappedVolume('beach');

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

    if (nextKey === 'beach') {
      if (currentKey === 'beach') return;

      switching = true;
      stop();
      currentKey = 'beach';
      switching = false;
      return;
    }

    const retainedFallback = nextKey === 'dark' ? (darkFallbackActive && audio.src === SOURCES.darkFallback) : (audio.dataset.dayFallback === '1' && audio.src === DAY_FALLBACKS[nextKey]);
    if (currentKey === nextKey && (audio.src === SOURCES[nextKey] || retainedFallback)) {
      setPlayerLevel(audio, cappedVolume(nextKey));
      return;
    }

    switching = true;
    stop();

    currentKey = nextKey;
    if (nextKey === 'dark') darkFallbackActive = false;
    audio.dataset.dayFallback = '0';
    audio.dataset.previewFallback = '0';
    audio.loop = true;
    audio.muted = false;
    audio.defaultPlaybackRate = 1;
    audio.playbackRate = 1;
    setPlayerLevel(audio, cappedVolume(nextKey));
    audio.src = SOURCES[nextKey];

    audio.onloadedmetadata = () => {
      if (currentKey !== nextKey || (audio.currentSrc && audio.currentSrc !== audio.src)) return;
      if (currentKey === 'dark') restoreDarkTime();
      else {
        try { audio.currentTime = 0; } catch (_) {}
      }
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

    if (key === 'beach') {
      playBeach();
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
    sync(true);
  });

  document.addEventListener('portfolio:theme', () => {
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
    sync(true);
    if (!document.hidden) scheduleAutoplayRetries();
  });
  addEventListener('DOMContentLoaded', scheduleAutoplayRetries, { once: true });
  addEventListener('load', scheduleAutoplayRetries, { once: true });
  addEventListener('pageshow', () => {
    pageActive = true;
    sync(true);
    scheduleAutoplayRetries();
  });
  addEventListener('pagehide', () => {
    previewAudioUrls.forEach(url => { try { URL.revokeObjectURL(url); } catch (_) {} });
    previewAudioUrls.clear();
    pageActive = false;
    clearAutoplayRetries();
    saveDarkTime();
    stop();
  });

  // Keep different tabs/windows in sync with the global mute preference.
  addEventListener('storage', event => {
    if (event.key === MUTE_KEY) sync(true);
    if (event.key === VOLUME_KEY) {
      applyPreferredVolume();
      sync(true);
    }
  });

  audio.addEventListener('ended', () => {
    if (!currentKey || desiredKey() !== currentKey) return;
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
    if (currentKey === 'dark' && !darkFallbackActive && audio.currentSrc !== SOURCES.darkFallback) {
      darkFallbackActive = true;
      audio.src = SOURCES.darkFallback;
      audio.loop = true;
      setPlayerLevel(audio, cappedVolume('dark'));
      try {
        const result = audio.play();
        if (result?.catch) result.catch(() => {});
      } catch (_) {}
      return;
    }
    if (BRANCH_PREVIEW_HOST && audio.dataset.previewFallback !== 'loading' && audio.dataset.previewFallback !== '1') {
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
    get maxVolume() { return MAX_BACKGROUND_VOLUME; },
    get volume() { return preferredVolume(); },
    get volumeBackend() { return gains.size ? 'gain' : 'media'; },
    get outputLevels() { return [audio, ...beachPlayers].map(player => ({ level: gains.get(player)?.gain.value ?? player.volume, muted: player.muted, paused: player.paused })); },
    setVolume: setPreferredVolume,
    setMuted,
    get element() { return currentKey === 'beach' ? beachPlayers[beachActiveIndex] : audio; },
    get beachElements() { return beachPlayers.slice(); }
  });
  document.dispatchEvent(new CustomEvent('portfolio:site-audio-ready'));
})();
