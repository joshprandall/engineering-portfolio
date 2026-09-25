(() => {
  'use strict';

  // Unified site ambience controller. This is the ONLY script that may create
  // or play background ambience/music.
  if (window.__JR_SITE_AUDIO_V18__) return;
  window.__JR_SITE_AUDIO_V18__ = true;

  const MUTE_KEY = 'jr-site-ambient-muted-v2';
  const DARK_TIME_KEY = 'jr-dark-theme-time-v1';
  const PROJECT_RE = /(?:^|\/)(?:project-[^/]+\.html|play-evil-wizard\.html|agent-workbench\.html|games\/|geometric-lab\/|qubit-preview-20260921\/|deep-learning\/)/i;
  const LOCAL_TEST_HOST = location.hostname === '127.0.0.1' || location.hostname === 'localhost';

  const SOURCES = Object.freeze({
    // John Bartmann — “Interstellar Space” (CC0/public-domain dedication).
    dark: 'https://web.engr.oregonstate.edu/~randjosh/assets/audio/dark-theme-user.mp3?v=20260925-seamless-v18',
    darkFallback: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/John_Bartmann/Public_Domain_Soundtrack_Music_Album_One/John_Bartmann_-_12_-_Interstellar_Space.mp3',

    // Existing light-mode field recordings.
    river: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sanna%20river%20rapids.ogg',
    waterfall: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Water%20fall.ogg',
    // Two matching Cape May shorebird/wave recordings. Alternating them avoids
    // an obvious 12.5-second repeat while keeping the same natural soundscape.
    beachNear: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cape%20May%20Shorebirds%20closer.ogg',
    beachFar: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cape%20May%20Shorebirds%20%28distant%29.ogg'
  });

  const BEACH_SOURCES = Object.freeze([SOURCES.beachNear, SOURCES.beachFar]);
  const BEACH_CROSSFADE_SECONDS = 1.2;
  const DARK_CROSSFADE_SECONDS = 4.0;

  // Website-side hard ceiling. Device volume may further attenuate this, but
  // this player itself can never exceed 10%.
  const MAX_BACKGROUND_VOLUME = 0.10;
  const VOLUME = Object.freeze({
    dark: 0.10,
    river: 0.10,
    waterfall: 0.10,
    beach: 0.10
  });

  let sceneId = 'forest-river';
  let suppressed = PROJECT_RE.test(location.pathname);
  let currentKey = '';
  let unlocked = false;
  let switching = false;
  let darkFallbackActive = false;

  // Remove stale legacy players if a cached older script left one behind.
  document.querySelectorAll('#jr-site-audio, #jr-site-audio-dark-a, #jr-site-audio-dark-b, #jr-site-audio-beach-a, #jr-site-audio-beach-b, #jr-dark-theme-music').forEach(node => {
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

  function createDarkPlayer(id) {
    const player = document.createElement('audio');
    player.id = id;
    player.preload = 'auto';
    // Native looping is a fallback if a second player cannot start on a
    // restrictive mobile/in-app browser. The audio asset itself is seamless.
    player.loop = true;
    player.playsInline = true;
    player.setAttribute('playsinline', '');
    player.setAttribute('aria-hidden', 'true');
    player.style.display = 'none';
    player.volume = 0;
    player.src = SOURCES.dark;
    (document.body || document.documentElement).appendChild(player);
    try { player.load(); } catch (_) {}
    return player;
  }

  const darkPlayers = [
    createDarkPlayer('jr-site-audio-dark-a'),
    createDarkPlayer('jr-site-audio-dark-b')
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
    player.loop = false;
    player.playsInline = true;
    player.setAttribute('playsinline', '');
    player.setAttribute('aria-hidden', 'true');
    player.style.display = 'none';
    player.volume = 0;
    player.src = src;
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
      const player = darkPlayers[darkActiveIndex];
      const value = Number(player?.currentTime || 0);
      if (Number.isFinite(value) && value >= 0) {
        localStorage.setItem(DARK_TIME_KEY, String(value));
      }
    } catch (_) {}
  }

  function restoreDarkTime(player) {
    if (!player) return;
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
      try { player.pause(); } catch (_) {}
      try { player.volume = 0; } catch (_) {}
      player.loop = true;
      if (reset) {
        try { player.currentTime = 0; } catch (_) {}
      }
    });
  }

  function beginDarkTransition() {
    if (darkTransitioning || currentKey !== 'dark' || desiredKey() !== 'dark') return;

    const fromIndex = darkActiveIndex;
    const toIndex = 1 - fromIndex;
    const from = darkPlayers[fromIndex];
    const to = darkPlayers[toIndex];
    const generation = darkGeneration;
    const cap = cappedVolume('dark');

    darkTransitioning = true;
    from.loop = false;
    to.loop = true;
    try { to.currentTime = 0; } catch (_) {}
    to.muted = false;
    to.volume = 0;

    let playResult;
    try { playResult = to.play(); }
    catch (_) {
      from.loop = true;
      darkTransitioning = false;
      return;
    }

    Promise.resolve(playResult).then(() => {
      if (generation !== darkGeneration || currentKey !== 'dark' || desiredKey() !== 'dark') {
        try { to.pause(); } catch (_) {}
        from.loop = true;
        darkTransitioning = false;
        return;
      }

      const startedAt = performance.now();
      const fadeMs = DARK_CROSSFADE_SECONDS * 1000;

      const step = now => {
        if (generation !== darkGeneration || currentKey !== 'dark' || desiredKey() !== 'dark') {
          try { to.pause(); } catch (_) {}
          from.loop = true;
          darkTransitioning = false;
          darkFadeFrame = 0;
          return;
        }

        const progress = Math.min(1, Math.max(0, (now - startedAt) / fadeMs));
        // Raised-cosine complementary gains make the transition smooth while
        // keeping the two players' combined website-side gain at the 10% cap.
        const incoming = 0.5 - 0.5 * Math.cos(Math.PI * progress);
        from.volume = cap * (1 - incoming);
        to.volume = cap * incoming;

        if (progress < 1) {
          darkFadeFrame = requestAnimationFrame(step);
          return;
        }

        darkFadeFrame = 0;
        try { from.pause(); } catch (_) {}
        try { from.currentTime = 0; } catch (_) {}
        from.volume = 0;
        from.loop = true;
        to.volume = cap;
        darkActiveIndex = toIndex;
        darkTransitioning = false;
      };

      darkFadeFrame = requestAnimationFrame(step);
    }).catch(() => {
      from.loop = true;
      darkTransitioning = false;
    });
  }

  function playDark() {
    const player = darkPlayers[darkActiveIndex];
    const cap = cappedVolume('dark');

    if (!darkStarted) restoreDarkTime(player);

    player.loop = true;
    player.muted = false;
    player.volume = cap;
    darkStarted = true;

    try {
      const result = player.play();
      if (result?.catch) {
        result.catch(() => {
          darkStarted = false;
        });
      }
    } catch (_) {
      darkStarted = false;
    }
  }

  darkPlayers.forEach((player, index) => {
    player.addEventListener('timeupdate', () => {
      if (currentKey !== 'dark' || index !== darkActiveIndex || darkTransitioning) return;
      const duration = Number(player.duration || 0);
      const current = Number(player.currentTime || 0);
      if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(current)) return;

      if (duration - current <= DARK_CROSSFADE_SECONDS + 0.20) {
        beginDarkTransition();
      }
    });

    player.addEventListener('error', () => {
      if (!darkFallbackActive && player.currentSrc !== SOURCES.darkFallback) {
        darkFallbackActive = true;
        darkGeneration += 1;
        cancelDarkFade();
        darkTransitioning = false;
        darkStarted = false;
        darkActiveIndex = 0;
        darkPlayers.forEach(item => {
          try { item.pause(); } catch (_) {}
          item.src = SOURCES.darkFallback;
          item.loop = true;
          item.volume = 0;
          try { item.load(); } catch (_) {}
        });
        if (currentKey === 'dark' && desiredKey() === 'dark') playDark();
        return;
      }
      console.error('JR dark ambience failed:', player.currentSrc, player.error);
    });

    player.addEventListener('volumechange', () => {
      const cap = cappedVolume('dark');
      if (player.volume > cap) player.volume = cap;
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
      try { player.pause(); } catch (_) {}
      try { player.volume = 0; } catch (_) {}
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
        // or below the same 10% ambience ceiling.
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
      if (result?.catch) {
        result.catch(() => {
          beachStarted = false;
        });
      }
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
      console.error('JR beach ambience failed:', player.currentSrc, player.error);
    });

    player.addEventListener('volumechange', () => {
      const cap = cappedVolume('beach');
      if (player.volume > cap) player.volume = cap;
    });
  });

  function stop() {
    saveDarkTime();
    try { audio.pause(); } catch (_) {}
    stopDark(true);
    stopBeach(true);
  }

  function applySource(nextKey) {
    if (!nextKey) {
      stop();
      currentKey = '';
      return;
    }

    if (nextKey === 'dark') {
      if (currentKey === 'dark') return;

      switching = true;
      stop();
      currentKey = 'dark';
      darkFallbackActive = false;
      switching = false;
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
    audio.loop = true;
    audio.muted = false;
    audio.volume = cappedVolume(nextKey);
    audio.src = SOURCES[nextKey];

    audio.onloadedmetadata = () => {
      try { audio.currentTime = 0; } catch (_) {}
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

    if (key === 'dark') {
      const active = darkPlayers[darkActiveIndex];
      if (!switching && (!darkStarted || (active.paused && !darkTransitioning))) {
        playDark();
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

    if (key === 'dark') {
      const active = darkPlayers[darkActiveIndex];
      if (unlocked && !switching && !darkTransitioning && (!darkStarted || active.paused)) {
        playDark();
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
    get theme() { return theme(); },
    get muted() { return muted(); },
    get suppressed() { return suppressed; },
    get maxVolume() { return MAX_BACKGROUND_VOLUME; },
    get element() {
      if (currentKey === 'dark') return darkPlayers[darkActiveIndex];
      if (currentKey === 'beach') return beachPlayers[beachActiveIndex];
      return audio;
    },
    get darkElements() { return darkPlayers.slice(); },
    get beachElements() { return beachPlayers.slice(); }
  });
})();