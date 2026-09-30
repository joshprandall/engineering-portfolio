(() => {
  'use strict';

  // Unified site ambience controller. This is the ONLY script that may create
  // or play background ambience/music.
  if (window.__JR_SITE_AUDIO_V31__) return;
  window.__JR_SITE_AUDIO_V31__ = true;
  // Claim the immediately previous guards as well so stale cached scripts
  // cannot create a second controller after this version initializes.
  window.__JR_SITE_AUDIO_V30__ = true;
  window.__JR_SITE_AUDIO_V29__ = true;

  const MUTE_KEY = 'jr-site-ambient-muted-v3';
  const DARK_TIME_KEY = 'jr-dark-theme-time-v1';
  const VOLUME_KEY = 'jr-site-ambient-volume-v6';
  // Normal shared-shell pages always receive ambience. Only standalone interactive
  // experiences that intentionally own their own media environment are isolated.
  const ISOLATED_RE = /(?:^|\/)(?:games\/|geometric-lab\/|qubit-preview-20260921\/|deep-learning\/)/i;
  const LOCAL_TEST_HOST = location.hostname === '127.0.0.1' || location.hostname === 'localhost';

  const REMOTE_DAY_SOURCES = Object.freeze({
    river: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sanna%20river%20rapids.ogg',
    waterfall: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Water%20fall.ogg',
    beachNear: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cape%20May%20Shorebirds%20closer.ogg',
    beachFar: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cape%20May%20Shorebirds%20%28distant%29.ogg'
  });

  const LOCAL_DAY_SOURCES = Object.freeze({
    river: new URL('assets/audio/day/river.ogg', document.currentScript.src).href,
    waterfall: new URL('assets/audio/day/waterfall.ogg', document.currentScript.src).href,
    beachNear: new URL('assets/audio/day/beach-near.ogg', document.currentScript.src).href,
    beachFar: new URL('assets/audio/day/beach-far.ogg', document.currentScript.src).href
  });

  const SOURCES = Object.freeze({
    // User-provided dark-mode soundtrack rebuilt from the original-length recording.
    // The WAV is a long circularly crossfaded PCM master; MP3 is fallback only.
    dark: new URL('assets/audio/dark-theme-user-v31.wav', document.currentScript.src).href,
    darkFallback: new URL('assets/audio/dark-theme-user-v31.mp3', document.currentScript.src).href,

    // Production serves Day ambience same-origin so visual/audio scene changes
    // do not wait on a third-party redirect or CDN. Local test hosts keep using
    // the remote sources because deploy-only audio assets are not committed.
    river: LOCAL_TEST_HOST ? REMOTE_DAY_SOURCES.river : LOCAL_DAY_SOURCES.river,
    waterfall: LOCAL_TEST_HOST ? REMOTE_DAY_SOURCES.waterfall : LOCAL_DAY_SOURCES.waterfall,
    beachNear: LOCAL_TEST_HOST ? REMOTE_DAY_SOURCES.beachNear : LOCAL_DAY_SOURCES.beachNear,
    beachFar: LOCAL_TEST_HOST ? REMOTE_DAY_SOURCES.beachFar : LOCAL_DAY_SOURCES.beachFar
  });

  const DAY_FALLBACKS = Object.freeze({
    river: REMOTE_DAY_SOURCES.river,
    waterfall: REMOTE_DAY_SOURCES.waterfall
  });
  const BEACH_SOURCES = Object.freeze([SOURCES.beachNear, SOURCES.beachFar]);
  const BEACH_FALLBACKS = Object.freeze([REMOTE_DAY_SOURCES.beachNear, REMOTE_DAY_SOURCES.beachFar]);
  const BEACH_CROSSFADE_SECONDS = 1.2;

  // Quiet-first ambience. The site starts at 5% of its own media output even
  // when the device is turned up. Users can mute it or deliberately raise it.
  // Hardware/device volume remains controlled by the operating system.
  const DEFAULT_BACKGROUND_VOLUME = 0.05;
  const MAX_BACKGROUND_VOLUME = 1.00;

  let sceneId = 'forest-river';
  let pendingSceneId = '';
  let suppressed = ISOLATED_RE.test(location.pathname);
  let currentKey = '';
  let unlocked = false;
  let switching = false;
  let darkFallbackActive = false;
  let autoplayBlocked = false;
  let autoplayRetryTimers = [];

  // Night-mode gapless engine. Native <audio> remains the best-effort autoplay
  // path; after the first real user gesture, Night migrates to Web Audio so
  // iPhone/Safari no longer inserts a decoder gap at the loop boundary.
  let darkAudioContext = null;
  let darkBytesPromise = null;
  let darkBufferPromise = null;
  let darkBuffer = null;
  let darkBufferFailed = false;
  let darkSourceNode = null;
  let darkGainNode = null;
  let darkStartContextTime = 0;
  let darkStartOffset = 0;
  let darkGeneration = 0;

  // Remove stale legacy players if a cached older script left one behind.
  document.querySelectorAll('#jr-site-audio, #jr-site-audio-dark-a, #jr-site-audio-dark-b, #jr-site-audio-beach-a, #jr-site-audio-beach-b, #jr-dark-theme-music').forEach(node => {
    try { node.pause(); } catch (_) {}
    try { node.remove(); } catch (_) {}
  });
  try { window.DarkThemeMusic?.pause?.(); } catch (_) {}

  const audio = document.createElement('audio');
  audio.id = 'jr-site-audio';
  audio.preload = 'auto';
  audio.autoplay = true;
  audio.setAttribute('autoplay', '');
  audio.loop = true;
  audio.playsInline = true;
  audio.setAttribute('playsinline', '');
  audio.setAttribute('aria-hidden', 'true');
  audio.style.display = 'none';
  audio.volume = DEFAULT_BACKGROUND_VOLUME;
  audio.defaultPlaybackRate = 1;
  audio.playbackRate = 1;
  (document.body || document.documentElement).appendChild(audio);

  function createBeachPlayer(id, src) {
    const player = document.createElement('audio');
    player.id = id;
    player.preload = 'auto';
    player.autoplay = true;
    player.setAttribute('autoplay', '');
    player.loop = false;
    player.playsInline = true;
    player.setAttribute('playsinline', '');
    player.setAttribute('aria-hidden', 'true');
    player.style.display = 'none';
    player.volume = 0;
    player.src = src;
    player.dataset.remoteSrc = BEACH_FALLBACKS[id.endsWith('-a') ? 0 : 1];
    player.dataset.remoteFallback = '0';
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
      !document.hidden;
  }

  function desiredKey() {
    if (!allowed()) return '';
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
    try { audio.volume = cap; } catch (_) {}
    try {
      if (darkGainNode && darkAudioContext) {
        darkGainNode.gain.setValueAtTime(cap, darkAudioContext.currentTime);
      }
    } catch (_) {}
    beachPlayers.forEach((player, index) => {
      if (beachTransitioning) return;
      try { player.volume = index === beachActiveIndex && beachStarted ? cap : 0; } catch (_) {}
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

  function darkWebAudioSupported() {
    return Boolean(window.AudioContext || window.webkitAudioContext);
  }

  function readSavedDarkTime(duration = 0) {
    try {
      const saved = Number(localStorage.getItem(DARK_TIME_KEY) || 0);
      if (!Number.isFinite(saved) || saved < 0) return 0;
      return duration > 0 ? saved % duration : saved;
    } catch (_) {
      return 0;
    }
  }

  function currentDarkTime() {
    try {
      if (darkSourceNode && darkAudioContext && darkBuffer) {
        const elapsed = Math.max(0, darkAudioContext.currentTime - darkStartContextTime);
        return (darkStartOffset + elapsed) % darkBuffer.duration;
      }
      return Number(audio.currentTime || 0);
    } catch (_) {
      return 0;
    }
  }

  function saveDarkTime() {
    if (currentKey !== 'dark') return;
    try {
      const value = currentDarkTime();
      if (Number.isFinite(value) && value >= 0) {
        localStorage.setItem(DARK_TIME_KEY, String(value));
      }
    } catch (_) {}
  }

  function restoreDarkTime() {
    if (currentKey !== 'dark') return;
    try {
      const duration = Number(audio.duration || 0);
      audio.currentTime = readSavedDarkTime(duration);
    } catch (_) {}
  }

  function ensureDarkContext() {
    if (darkAudioContext) return darkAudioContext;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) throw new Error('Web Audio is unavailable');
    darkAudioContext = new AudioContextCtor();
    darkGainNode = darkAudioContext.createGain();
    darkGainNode.gain.value = cappedVolume('dark');
    darkGainNode.connect(darkAudioContext.destination);
    return darkAudioContext;
  }

  function fetchDarkBytes() {
    if (darkBytesPromise) return darkBytesPromise;
    darkBytesPromise = fetch(SOURCES.dark, { cache: 'force-cache', credentials: 'same-origin' })
      .then(response => {
        if (!response.ok) throw new Error('Night audio HTTP ' + response.status);
        return response.arrayBuffer();
      })
      .catch(error => {
        darkBytesPromise = null;
        throw error;
      });
    return darkBytesPromise;
  }

  function ensureDarkBuffer() {
    if (darkBuffer) return Promise.resolve(darkBuffer);
    if (darkBufferPromise) return darkBufferPromise;
    let context;
    try { context = ensureDarkContext(); }
    catch (error) {
      darkBufferFailed = true;
      return Promise.reject(error);
    }

    darkBufferPromise = fetchDarkBytes()
      .then(bytes => context.decodeAudioData(bytes.slice(0)))
      .then(buffer => {
        if (!buffer || !Number.isFinite(buffer.duration) || buffer.duration <= 0) {
          throw new Error('Night audio decode produced an invalid buffer');
        }
        darkBuffer = buffer;
        darkBufferFailed = false;
        return buffer;
      })
      .catch(error => {
        darkBufferPromise = null;
        darkBufferFailed = true;
        throw error;
      });
    return darkBufferPromise;
  }

  function stopDarkWebAudio() {
    darkGeneration += 1;
    if (!darkSourceNode) return;
    const node = darkSourceNode;
    darkSourceNode = null;
    try { node.stop(); } catch (_) {}
    try { node.disconnect(); } catch (_) {}
  }

  function playDarkNative() {
    audio.loop = true;
    audio.muted = false;
    audio.defaultPlaybackRate = 1;
    audio.playbackRate = 1;
    audio.volume = cappedVolume('dark');

    try {
      const result = audio.play();
      if (result?.then) result.then(() => markAutoplayState(false)).catch(error => {
        if (error?.name === 'NotAllowedError') markAutoplayState(true);
      });
    } catch (error) {
      if (error?.name === 'NotAllowedError') markAutoplayState(true);
    }
  }

  async function playDarkWebAudio() {
    if (darkBufferFailed || !darkWebAudioSupported()) {
      playDarkNative();
      return;
    }

    if (darkSourceNode && darkAudioContext?.state === 'running') {
      try { darkGainNode.gain.setValueAtTime(cappedVolume('dark'), darkAudioContext.currentTime); } catch (_) {}
      markAutoplayState(false);
      return;
    }

    const generation = ++darkGeneration;
    const buffer = await ensureDarkBuffer();
    if (generation !== darkGeneration || currentKey !== 'dark' || desiredKey() !== 'dark') return;

    const context = ensureDarkContext();
    await context.resume();
    if (generation !== darkGeneration || currentKey !== 'dark' || desiredKey() !== 'dark') return;
    if (context.state !== 'running') throw new DOMException('AudioContext is not running', 'NotAllowedError');

    let offset = 0;
    try {
      offset = (!audio.paused && Number.isFinite(audio.currentTime))
        ? audio.currentTime % buffer.duration
        : readSavedDarkTime(buffer.duration);
    } catch (_) {
      offset = readSavedDarkTime(buffer.duration);
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = buffer.duration;
    source.connect(darkGainNode);
    darkGainNode.gain.setValueAtTime(cappedVolume('dark'), context.currentTime);

    darkStartOffset = offset;
    darkStartContextTime = context.currentTime;
    darkSourceNode = source;
    source.start(0, offset);

    // Hand off from native autoplay to the sample-accurate loop only after the
    // Web Audio source is running, preventing silence during the transition.
    try { audio.volume = 0; } catch (_) {}
    try { audio.muted = true; } catch (_) {}
    try { audio.pause(); } catch (_) {}
    markAutoplayState(false);
  }

  function playDark() {
    if (unlocked && !darkBufferFailed && darkWebAudioSupported()) {
      playDarkWebAudio().catch(error => {
        if (error?.name === 'NotAllowedError') markAutoplayState(true);
        if (currentKey === 'dark' && desiredKey() === 'dark') playDarkNative();
      });
      return;
    }
    playDarkNative();
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
      try { player.volume = 0; } catch (_) {}
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
    const cap = cappedVolume('beach');

    beachTransitioning = true;
    try { to.currentTime = 0; } catch (_) {}
    to.loop = false;
    to.muted = false;
    to.volume = 0;

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
        // Complementary linear fades keep the combined website-side level at
        // or below the user-selected ambience level.
        from.volume = cap * (1 - progress);
        to.volume = cap * progress;

        if (progress < 1) {
          beachFadeFrame = requestAnimationFrame(step);
          return;
        }

        beachFadeFrame = 0;
        try { from.pause(); } catch (_) {}
        try { from.currentTime = 0; } catch (_) {}
        from.volume = 0;
        to.volume = cap;
        beachActiveIndex = toIndex;
        beachTransitioning = false;
      };

      beachFadeFrame = requestAnimationFrame(step);
    }).catch(() => {
      beachTransitioning = false;
    });
  }

  function markAutoplayState(blocked) {
    if (autoplayBlocked === blocked) return;
    autoplayBlocked = blocked;
    document.dispatchEvent(new CustomEvent('portfolio:ambient-autoplay', {
      detail: { blocked }
    }));
  }

  function playBeach() {
    const player = beachPlayers[beachActiveIndex];
    const cap = cappedVolume('beach');

    if (!beachStarted) {
      try { player.currentTime = 0; } catch (_) {}
    }

    player.loop = false;
    player.muted = false;
    player.volume = cap;
    beachStarted = true;

    try {
      const result = player.play();
      if (result?.then) result.then(() => markAutoplayState(false)).catch(error => {
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
      const remote = player.dataset.remoteSrc;
      if (!LOCAL_TEST_HOST && player.dataset.remoteFallback !== '1' && remote) {
        player.dataset.remoteFallback = '1';
        try {
          player.pause();
          player.src = remote;
          player.load();
          if (currentKey === 'beach' && index === beachActiveIndex && desiredKey() === 'beach') playBeach();
        } catch (_) {}
        return;
      }
      console.error('JR beach ambience failed:', player.currentSrc, player.error);
    });

    player.addEventListener('volumechange', () => {
      const cap = cappedVolume('beach');
      if (player.volume > cap) player.volume = cap;
    });
  });

  function stop() {
    saveDarkTime();
    stopDarkWebAudio();
    // Mute/zero before pause to prevent Safari from leaking buffered audio from
    // the outgoing scene into the next visual scene.
    try { audio.volume = 0; } catch (_) {}
    try { audio.muted = true; } catch (_) {}
    try { audio.pause(); } catch (_) {}
    stopBeach(true);
  }

  function hardSilenceDay() {
    if (theme() !== 'light') return;
    try { audio.volume = 0; } catch (_) {}
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

    if (currentKey === nextKey && audio.src === SOURCES[nextKey]) {
      audio.volume = cappedVolume(nextKey);
      return;
    }

    switching = true;
    stop();

    currentKey = nextKey;
    if (nextKey === 'dark') darkFallbackActive = false;
    audio.dataset.dayFallback = '0';
    audio.loop = true;
    audio.muted = false;
    audio.defaultPlaybackRate = 1;
    audio.playbackRate = 1;
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

    if (key === 'dark') {
      playDark();
      return;
    }

    if (key === 'beach') {
      playBeach();
      return;
    }

    audio.loop = true;
    audio.muted = false;
    audio.defaultPlaybackRate = 1;
    audio.playbackRate = 1;
    audio.volume = cappedVolume(key);

    try {
      const result = audio.play();
      if (result?.then) result.then(() => markAutoplayState(false)).catch(error => {
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
      if (!switching) {
        if (unlocked && !darkBufferFailed && darkWebAudioSupported()) {
          if (!darkSourceNode || darkAudioContext?.state !== 'running') playDark();
        } else if (audio.paused || audio.ended) {
          playDark();
        }
      }
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

  // Warm the Night asset immediately so the first permitted playback gesture
  // can hand off to the gapless engine without waiting on a network download.
  fetchDarkBytes().catch(() => {});

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
    if (!next || theme() !== 'light' || next === sceneId) return;
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
    suppressed = ISOLATED_RE.test(location.pathname) || Boolean(event.detail?.active);
    sync(true);
  });

  document.addEventListener('visibilitychange', () => {
    sync(true);
    if (!document.hidden) scheduleAutoplayRetries();
  });
  addEventListener('DOMContentLoaded', scheduleAutoplayRetries, { once: true });
  addEventListener('load', scheduleAutoplayRetries, { once: true });
  addEventListener('pageshow', () => {
    sync(true);
    scheduleAutoplayRetries();
  });
  addEventListener('pagehide', () => {
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
    if (desiredKey() !== currentKey) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (_) {}
  });

  audio.addEventListener('error', () => {
    if ((currentKey === 'river' || currentKey === 'waterfall') &&
        !LOCAL_TEST_HOST &&
        audio.dataset.dayFallback !== '1' &&
        DAY_FALLBACKS[currentKey] &&
        audio.currentSrc !== DAY_FALLBACKS[currentKey]) {
      audio.dataset.dayFallback = '1';
      audio.src = DAY_FALLBACKS[currentKey];
      audio.loop = true;
      audio.muted = false;
      audio.volume = cappedVolume(currentKey);
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
      audio.volume = cappedVolume('dark');
      try {
        const result = audio.play();
        if (result?.catch) result.catch(() => {});
      } catch (_) {}
      return;
    }
    console.error('JR site audio failed:', currentKey, audio.currentSrc, audio.error);
  });

  // Enforce the ceiling and normal speed even if another script, browser,
  // media-session quirk, or in-app browser tries to alter either value.
  audio.addEventListener('volumechange', () => {
    if (audio.volume > MAX_BACKGROUND_VOLUME) {
      audio.volume = MAX_BACKGROUND_VOLUME;
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

    if (key === 'dark') {
      if (unlocked && !switching) {
        if (!darkBufferFailed && darkWebAudioSupported()) {
          if (!darkSourceNode || darkAudioContext?.state !== 'running') playDark();
        } else if (audio.paused) {
          playDarkNative();
        }
      }
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
    get maxVolume() { return MAX_BACKGROUND_VOLUME; },
    get volume() { return preferredVolume(); },
    setVolume: setPreferredVolume,
    setMuted,
    get element() { return currentKey === 'beach' ? beachPlayers[beachActiveIndex] : audio; },
    get beachElements() { return beachPlayers.slice(); }
  });
  document.dispatchEvent(new CustomEvent('portfolio:site-audio-ready'));
})();