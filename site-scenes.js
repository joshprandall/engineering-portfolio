/* Living portfolio environments.
   Dark: real JWST imagery + layered cinematic motion.
   Light: real licensed nature footage + graceful real-image fallback.
*/
(() => {
  'use strict';

  const SCENE_SCRIPT_URL = new URL(document.currentScript?.src || location.href, location.href);
  const SITE_BASE = new URL('./', SCENE_SCRIPT_URL);

  // Load exactly one shared ambience controller everywhere the living-scene
  // layer is used. Keeping this here avoids per-page audio script drift.
  function ensureSiteAudioController() {
    if (window.SiteAudio || window.__JR_SITE_AUDIO_LOADING__) return;
    if (document.getElementById('jr-site-audio-controller')) return;

    window.__JR_SITE_AUDIO_LOADING__ = true;
    const script = document.createElement('script');
    script.id = 'jr-site-audio-controller';
    script.src = new URL('site-audio.js?v=20260925-beat-loop-v20', SITE_BASE).href;
    script.async = false;
    script.onload = () => {
      window.__JR_SITE_AUDIO_LOADING__ = false;
      try { window.SiteAudio?.sync?.(true); } catch (_) {}
    };
    script.onerror = () => {
      window.__JR_SITE_AUDIO_LOADING__ = false;
      console.error('Failed to load unified site audio controller:', script.src);
    };
    (document.head || document.documentElement).appendChild(script);
  }

  ensureSiteAudioController();

  const LIGHT_SCENES = [
    {
      id: 'forest-river',
      src: 'https://videos.pexels.com/video-files/33886656/14381142_1920_1080_25fps.mp4',
      poster: 'https://images.pexels.com/videos/33886656/pexels-photo-33886656.jpeg?auto=compress&cs=tinysrgb&w=1600',
      page: 'https://www.pexels.com/video/serene-forest-river-scene-in-daylight-33886656/',
      creator: 'Christophe Génot',
      label: 'Forest river'
    },
    {
      id: 'birds-water',
      src: 'https://videos.pexels.com/video-files/9982425/9982425-hd_1920_1080_30fps.mp4',
      poster: 'https://images.pexels.com/videos/9982425/pexels-photo-9982425.jpeg?auto=compress&cs=tinysrgb&w=1600',
      page: 'https://www.pexels.com/video/birds-flying-above-beach-at-sunset-9982425/',
      creator: 'Daniel Feldman',
      label: 'Birds over water'
    },
    {
      id: 'forest-waterfall',
      src: 'https://videos.pexels.com/video-files/7351460/7351460-hd_1920_1080_24fps.mp4',
      poster: 'https://images.pexels.com/videos/7351460/pexels-photo-7351460.jpeg?auto=compress&cs=tinysrgb&w=1600',
      page: 'https://www.pexels.com/video/waterfall-in-the-forest-7351460/',
      creator: 'K',
      label: 'Forest waterfall'
    }
  ];

  const ROTATE_AFTER = 28;
  const AMBIENT_AUDIO_KEY = 'jr-site-ambient-muted-v2';

  // Real nature recordings. River + beach are CC0, shorebirds are U.S. federal
  // public domain, and the waterfall recording is used as a looped field clip.
  // Dark mode intentionally looks for a local licensed file instead of copying
  // a copyrighted film score into the repository.
  const REAL_NATURE_AUDIO = {
    'forest-river': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sanna%20river%20rapids.ogg',
    'birds-water': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ocean%20Waves%20on%20a%20Tropical%20Beach.ogg',
    'forest-waterfall': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Water%20fall.ogg'
  };
  const BEACH_BIRDS_AUDIO = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cape%20May%20Shorebirds%20closer.ogg';
  const DARK_LICENSED_TRACK = 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/John_Bartmann/Public_Domain_Soundtrack_Music_Album_One/John_Bartmann_-_12_-_Interstellar_Space.mp3';
  const DARK_TRACK_TIME_KEY = 'jr-dark-theme-time-v1';
  const PROJECT_AUDIO_RE = /(?:^|\/)(?:project-[^/]+\.html|play-evil-wizard\.html|agent-workbench\.html|games\/|geometric-lab\/|qubit-preview-20260921\/|deep-learning\/)/i;

  const boot = () => {
    if (document.getElementById('site-scene') || !window.PortfolioTheme) return;

    const appearance = window.PortfolioTheme;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = Boolean(connection && connection.saveData);
    const localTestHost = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    const mediaDisabled = saveData || localTestHost;
    const inAppBrowser = /FBAN|FBAV|Instagram|Messenger|Line\/|; wv\)/i.test(navigator.userAgent || '');
    const constrainedMedia = Boolean(
      inAppBrowser ||
      /(^|-)2g$/.test(connection?.effectiveType || '') ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    );
    const ambientLockedByPage = PROJECT_AUDIO_RE.test(location.pathname);

    // Warm image/video connections immediately so the background appears before
    // the rest of the page has finished settling.
    ['https://videos.pexels.com','https://images.pexels.com'].forEach(href => {
      if (document.querySelector('link[rel="preconnect"][href="' + href + '"]')) return;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.append(link);
    });
    [
      new URL('assets/scenes/webb-cosmic-cliffs.webp', SITE_BASE).href,
      LIGHT_SCENES[0].poster
    ].forEach((href, i) => {
      if (document.querySelector('link[rel="preload"][href="' + href + '"]')) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      if (i === 0) link.fetchPriority = 'high';
      document.head.append(link);
    });

    document.body.classList.add('living-scenes');

    const backdrop = document.createElement('div');
    backdrop.id = 'site-scene';
    backdrop.className = 'scene-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.innerHTML =
      '<div class="scene-night-wrap">' +
        '<div class="scene-image scene-night"></div>' +
        '<div class="scene-night-depth"></div>' +
        '<div class="scene-night-glow"></div>' +
      '</div>' +
      '<div class="scene-day-wrap">' +
        '<div class="scene-image scene-day-fallback"></div>' +
        '<video class="scene-video scene-video-a" muted playsinline autoplay loop preload="metadata" tabindex="-1"></video>' +
        '<video class="scene-video scene-video-b" muted playsinline autoplay loop preload="metadata" tabindex="-1"></video>' +
      '</div>' +
      '<canvas class="scene-canvas"></canvas>' +
      '<div class="scene-atmosphere"></div>' +
      '<div class="scene-veil"></div>';

    document.body.prepend(backdrop);

    const options = document.createElement('div');
    options.className = 'scene-options';
    options.innerHTML =
      '<div>' +
        '<p class="scene-source-night">Webb’s Cosmic Cliffs · ' +
          '<a href="https://esawebb.org/images/weic2205a/" target="_blank" rel="noopener noreferrer">NASA, ESA, CSA, and STScI</a><br>' +
          '<small>Audio: “Interstellar Space” by John Bartmann · CC0 public-domain dedication.</small>' +
        '</p>' +
        '<p class="scene-source-day">Living Earth · ' +
          '<a class="scene-day-link" href="#" target="_blank" rel="noopener noreferrer">real licensed nature footage</a><br>' +
          '<small class="scene-day-credit">Pexels License · real wind, water, birds, and landscape motion.</small>' +
        '</p>' +
      '</div>' +
      '<button data-scene-audio type="button" aria-pressed="false">Mute</button>';

    // Motion is intentionally always on. Reuse the existing footer motion
    // control as the global mute button so it stays in exactly the same place.
    const legacyFooterAudio = document.querySelector('footer button[data-scene-motion]');
    if (legacyFooterAudio) {
      legacyFooterAudio.removeAttribute('data-scene-motion');
      legacyFooterAudio.setAttribute('data-scene-audio','');
      legacyFooterAudio.hidden = false;
      legacyFooterAudio.removeAttribute('aria-hidden');
      legacyFooterAudio.removeAttribute('aria-pressed');
      legacyFooterAudio.tabIndex = 0;
      const placeholder = options.querySelector('[data-scene-audio]');
      if (placeholder) placeholder.replaceWith(legacyFooterAudio);
    }
    document.querySelectorAll('button[data-scene-motion]').forEach(button => button.remove());
    document.body.append(options);
    appearance.setMotion?.('running', true);
    appearance.bind(options);

    const canvas = backdrop.querySelector('.scene-canvas');
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const night = backdrop.querySelector('.scene-night');
    const nightDepth = backdrop.querySelector('.scene-night-depth');
    const nightGlow = backdrop.querySelector('.scene-night-glow');
    const dayFallback = backdrop.querySelector('.scene-day-fallback');
    const videoA = backdrop.querySelector('.scene-video-a');
    const videoB = backdrop.querySelector('.scene-video-b');
    const dayLink = options.querySelector('.scene-day-link');
    const dayCredit = options.querySelector('.scene-day-credit');
    const audioButton = options.querySelector('[data-scene-audio]');

    let activeVideo = videoA;
    let standbyVideo = videoB;
    let activeSceneIndex = 0;
    let mediaReady = false;
    let mediaTimer = 0;
    let lightLoaded = false;
    let transitionBusy = false;
    let rotationElapsed = 0;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let lastFrame = 0;
    let time = 0;
    let theme = appearance.getTheme();
    let stars = [];
    let dust = [];
    let streak = null;
    let nextStreak = 18;

    const seedArray = new Uint32Array(1);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(seedArray);
    else seedArray[0] = Date.now() >>> 0;
    let seed = seedArray[0];
    const random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const motionAllowed = () => true;

    // Audio state. Light mode uses real field recordings matched to each scene.
    // Dark mode uses John Bartmann's CC0 'Interstellar Space' soundtrack,
    // stored locally as MP3 for reliable iPhone/Safari playback and looping.
    let ambientCtx = null;
    let ambientMaster = null;
    let ambientNodes = [];
    let ambientTimer = 0;
    let birdTimer = 0;
    let ambientWatchdog = 0;
    let ambientSignature = '';
    let recordedAmbience = null;
    let darkLicensedAudio = null;
    let darkTrackElement = null;
    let birdAudio = null;
    let birdReplayTimer = 0;
    let audioUnlocked = false;
    let audioSuppressed = false;
    let ambientMuted = (() => {
      try { return localStorage.getItem(AMBIENT_AUDIO_KEY) === '1'; }
      catch (_) { return false; }
    })();

    function storeAmbientMuted() {
      try { localStorage.setItem(AMBIENT_AUDIO_KEY, ambientMuted ? '1' : '0'); }
      catch (_) {}
    }

    function lessonIsOpen() {
      const view = document.getElementById('lesson-view');
      return Boolean(view && !view.hidden);
    }

    function ambientAllowed() {
      // v12: all actual playback is owned by site-audio.js.
      return false;
    }

    function updateAudioButton() {
      if (!audioButton) return;
      audioButton.type = 'button';
      audioButton.setAttribute('aria-pressed', String(ambientMuted));
      audioButton.setAttribute('aria-label', ambientMuted ? 'Unmute background ambience' : 'Mute background ambience');
      audioButton.title = ambientLockedByPage
        ? 'Background ambience pauses automatically while using projects'
        : (ambientMuted ? 'Unmute ambience' : 'Mute ambience');
      audioButton.textContent = ambientMuted ? 'Unmute' : 'Mute';
    }

    function ensureAmbientContext() {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) {
        if (audioButton) {
          audioButton.disabled = true;
          audioButton.textContent = 'Audio unavailable';
        }
        return false;
      }
      try {
        if (!ambientCtx) {
          ambientCtx = new AudioContextCtor();
          ambientMaster = ambientCtx.createGain();
          ambientMaster.gain.value = 0;
          ambientMaster.connect(ambientCtx.destination);
        }
        if (ambientCtx.state === 'suspended') ambientCtx.resume();
        audioUnlocked = true;
        return true;
      } catch (_) {
        return false;
      }
    }

    function savedDarkTrackTime() {
      try {
        const value = Number(localStorage.getItem(DARK_TRACK_TIME_KEY) || 0);
        return Number.isFinite(value) && value >= 0 ? value : 0;
      } catch (_) {
        return 0;
      }
    }

    function saveDarkTrackTime() {
      if (!darkLicensedAudio) return;
      try {
        const value = Number(darkLicensedAudio.currentTime || 0);
        if (Number.isFinite(value) && value >= 0) localStorage.setItem(DARK_TRACK_TIME_KEY, String(value));
      } catch (_) {}
    }

    function createAudioTrack(src, {loop=true, volume=.18}={}) {
      const audio = new Audio();
      audio.src = src;
      audio.loop = loop;
      audio.preload = 'auto';
      audio.playsInline = true;
      audio.volume = volume;
      return audio;
    }

    function ensureDarkTrackElement() {
      if (darkTrackElement) return darkTrackElement;
      const audio = createAudioTrack(DARK_LICENSED_TRACK, {loop:true, volume:.24});
      audio.id = 'site-dark-theme-audio';
      audio.setAttribute('aria-hidden','true');
      audio.setAttribute('playsinline','');
      audio.autoplay = true;
      audio.style.display = 'none';
      document.body.appendChild(audio);
      audio.addEventListener('loadedmetadata', () => {
        try {
          const saved = savedDarkTrackTime();
          const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
          audio.currentTime = duration ? saved % duration : saved;
        } catch (_) {}
      }, {once:true});
      audio.addEventListener('timeupdate', saveDarkTrackTime);
      audio.addEventListener('error', () => {
        console.warn('Dark-mode soundtrack could not be loaded:', DARK_LICENSED_TRACK);
      });
      try { audio.load(); } catch (_) {}
      darkTrackElement = audio;
      return audio;
    }

    function darkMusicAllowed() {
      return theme === 'dark' && !ambientMuted && !audioSuppressed &&
        !ambientLockedByPage && !lessonIsOpen() && !document.hidden;
    }

    function syncDarkThemeMusic() {
      const audio = ensureDarkTrackElement();
      if (!darkMusicAllowed()) {
        saveDarkTrackTime();
        try { audio.pause(); } catch (_) {}
        if (darkLicensedAudio === audio) darkLicensedAudio = null;
        return false;
      }

      darkLicensedAudio = audio;
      audio.loop = true;
      audio.muted = false;
      audio.volume = .24;

      try {
        const attempt = audio.play();
        if (attempt?.catch) attempt.catch(() => {});
      } catch (_) {}
      return true;
    }

    function stopNatureAmbience() {
      clearTimeout(birdReplayTimer);
      birdReplayTimer = 0;
      [recordedAmbience, birdAudio].forEach(audio => {
        if (!audio) return;
        try { audio.pause(); } catch (_) {}
      });
      recordedAmbience = null;
      birdAudio = null;
    }

    function stopDarkAmbience() {
      const audio = darkLicensedAudio || darkTrackElement;
      if (audio) {
        saveDarkTrackTime();
        try { audio.pause(); } catch (_) {}
      }
      darkLicensedAudio = null;
    }

    function stopRecordedAmbience() {
      stopNatureAmbience();
      stopDarkAmbience();
    }

    function scheduleBeachBirds() {
      clearTimeout(birdReplayTimer);
      if (!ambientAllowed() || theme !== 'light' || LIGHT_SCENES[activeSceneIndex]?.id !== 'birds-water' || !audioUnlocked) return;
      const delay = 6500 + Math.random() * 9000;
      birdReplayTimer = setTimeout(async () => {
        if (!ambientAllowed() || theme !== 'light' || LIGHT_SCENES[activeSceneIndex]?.id !== 'birds-water') return;
        try {
          if (!birdAudio) birdAudio = createAudioTrack(BEACH_BIRDS_AUDIO, {loop:false, volume:.16});
          birdAudio.currentTime = 0;
          await birdAudio.play();
        } catch (_) {}
        scheduleBeachBirds();
      }, delay);
    }

    async function startRecordedAmbience() {
      stopRecordedAmbience();
      if (!ambientAllowed() || !audioUnlocked) return false;

      // Dark mode has its own dedicated native audio player.
      if (theme !== 'light') return false;

      // Nature recordings are strictly light-mode only.
      stopDarkAmbience();
      const scene = LIGHT_SCENES[activeSceneIndex];
      const src = scene && REAL_NATURE_AUDIO[scene.id];
      if (!src) return false;

      const volume = scene.id === 'forest-waterfall' ? .28 : scene.id === 'birds-water' ? .22 : .24;
      const audio = createAudioTrack(src, {loop:true, volume});
      recordedAmbience = audio;
      try {
        await audio.play();
        if (scene.id === 'birds-water') scheduleBeachBirds();
        return true;
      } catch (_) {
        recordedAmbience = null;
        return false;
      }
    }

    function rememberNode(node) {
      ambientNodes.push(node);
      return node;
    }

    function stopAmbientNodes() {
      clearInterval(ambientTimer);
      clearTimeout(birdTimer);
      clearTimeout(birdReplayTimer);
      ambientTimer = 0;
      birdTimer = 0;
      ambientSignature = '';
      const nodes = ambientNodes.splice(0);
      nodes.forEach(node => {
        try { if (typeof node.stop === 'function') node.stop(); } catch (_) {}
        try { node.disconnect(); } catch (_) {}
      });
      if (ambientMaster && ambientCtx) {
        try {
          ambientMaster.gain.cancelScheduledValues(ambientCtx.currentTime);
          ambientMaster.gain.setTargetAtTime(0, ambientCtx.currentTime, .05);
        } catch (_) {}
      }
    }

    function noiseBuffer() {
      const seconds = 2.4;
      const buffer = ambientCtx.createBuffer(1, Math.floor(ambientCtx.sampleRate * seconds), ambientCtx.sampleRate);
      const data = buffer.getChannelData(0);
      let smoothed = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        smoothed = smoothed * .78 + white * .22;
        data[i] = white * .42 + smoothed * .58;
      }
      return buffer;
    }

    function startNoiseBed({gain=.01, lowpass=1800, highpass=70, lfoRate=0, lfoDepth=0}) {
      const source = rememberNode(ambientCtx.createBufferSource());
      source.buffer = noiseBuffer();
      source.loop = true;
      const hp = rememberNode(ambientCtx.createBiquadFilter());
      hp.type = 'highpass';
      hp.frequency.value = highpass;
      const lp = rememberNode(ambientCtx.createBiquadFilter());
      lp.type = 'lowpass';
      lp.frequency.value = lowpass;
      const g = rememberNode(ambientCtx.createGain());
      g.gain.value = gain;
      source.connect(hp).connect(lp).connect(g).connect(ambientMaster);
      if (lfoRate > 0 && lfoDepth > 0) {
        const lfo = rememberNode(ambientCtx.createOscillator());
        const depth = rememberNode(ambientCtx.createGain());
        lfo.type = 'sine';
        lfo.frequency.value = lfoRate;
        depth.gain.value = lfoDepth;
        lfo.connect(depth).connect(g.gain);
        lfo.start();
      }
      source.start();
    }

    function startDarkAmbience() {
      const progression = [
        [65.41, 98.00, 130.81, 196.00],
        [55.00, 82.41, 110.00, 164.81],
        [43.65, 65.41, 87.31, 130.81],
        [49.00, 73.42, 98.00, 146.83]
      ];
      const oscillators = progression[0].map((freq, i) => {
        const o = rememberNode(ambientCtx.createOscillator());
        const g = rememberNode(ambientCtx.createGain());
        const filter = rememberNode(ambientCtx.createBiquadFilter());
        o.type = i === 0 ? 'triangle' : 'sine';
        o.frequency.value = freq;
        filter.type = 'lowpass';
        filter.frequency.value = i === 0 ? 520 : 950;
        g.gain.value = i === 0 ? .0115 : .0082;
        o.connect(filter).connect(g).connect(ambientMaster);
        o.start();
        return o;
      });
      let chord = 0;
      ambientTimer = setInterval(() => {
        if (!ambientCtx || !ambientAllowed() || theme !== 'dark') return;
        chord = (chord + 1) % progression.length;
        const now = ambientCtx.currentTime;
        oscillators.forEach((o, i) => {
          try { o.frequency.exponentialRampToValueAtTime(progression[chord][i], now + 2.8); } catch (_) {}
        });
      }, 12000);
      startNoiseBed({gain:.0048, lowpass:420, highpass:45});
    }

    function scheduleBirds() {
      clearTimeout(birdTimer);
      if (!ambientCtx || !ambientAllowed() || theme !== 'light' || LIGHT_SCENES[activeSceneIndex].id !== 'birds-water') return;
      const chirp = (delay, base) => {
        const o = rememberNode(ambientCtx.createOscillator());
        const g = rememberNode(ambientCtx.createGain());
        o.type = 'sine';
        const start = ambientCtx.currentTime + delay;
        o.frequency.setValueAtTime(base, start);
        o.frequency.exponentialRampToValueAtTime(base * 1.34, start + .13);
        o.frequency.exponentialRampToValueAtTime(base * .92, start + .28);
        g.gain.setValueAtTime(.0001, start);
        g.gain.exponentialRampToValueAtTime(.0064, start + .035);
        g.gain.exponentialRampToValueAtTime(.0001, start + .31);
        o.connect(g).connect(ambientMaster);
        o.start(start);
        o.stop(start + .34);
      };
      chirp(.05, 1750 + Math.random() * 300);
      if (Math.random() > .45) chirp(.42, 2050 + Math.random() * 300);
      birdTimer = setTimeout(scheduleBirds, 4300 + Math.random() * 4200);
    }

    function startLightAmbience() {
      const scene = LIGHT_SCENES[activeSceneIndex];
      if (!scene) return;
      if (scene.id === 'forest-waterfall') {
        startNoiseBed({gain:.028, lowpass:4200, highpass:95, lfoRate:.08, lfoDepth:.0028});
        startNoiseBed({gain:.0095, lowpass:520, highpass:35});
      } else if (scene.id === 'birds-water') {
        startNoiseBed({gain:.020, lowpass:1500, highpass:70, lfoRate:.10, lfoDepth:.0065});
        startNoiseBed({gain:.0072, lowpass:360, highpass:30, lfoRate:.052, lfoDepth:.0030});
        scheduleBirds();
      } else {
        startNoiseBed({gain:.0205, lowpass:1350, highpass:60, lfoRate:.065, lfoDepth:.0041});
        startNoiseBed({gain:.0062, lowpass:320, highpass:28});
      }
    }

    function syncVideoAmbience() {
      const allow = ambientAllowed() && audioUnlocked && theme === 'light';
      [videoA, videoB].forEach(video => {
        try {
          const active = video === activeVideo && allow;
          video.volume = active ? .16 : 0;
          video.muted = !active;
        } catch (_) {}
      });
    }

    function desiredAmbientSignature() {
      if (theme === 'dark') return 'dark';
      const scene = LIGHT_SCENES[activeSceneIndex];
      return 'light:' + (scene?.id || 'default');
    }

    function refreshAmbientAudio(force=false) {
      updateAudioButton();

      if (theme === 'dark') {
        stopNatureAmbience();
        stopDarkAmbience();
        syncVideoAmbience();
        ambientSignature = 'dark';
        return;
      }

      // Light mode remains on the existing, working nature-audio path.
      stopDarkAmbience();
      syncVideoAmbience();

      if (!ambientAllowed()) {
        if (ambientNodes.length) stopAmbientNodes();
        stopNatureAmbience();
        return;
      }
      if (!audioUnlocked) return;

      const wanted = desiredAmbientSignature();
      const recordedPlaying = Boolean(recordedAmbience && !recordedAmbience.paused);
      if (!force && ambientSignature === wanted && recordedPlaying) {
        syncVideoAmbience();
        return;
      }

      stopAmbientNodes();
      stopNatureAmbience();
      if (!ambientAllowed()) return;

      ambientSignature = wanted;
      startRecordedAmbience().catch(() => {});
    }

    function unlockAmbientFromGesture() {
      if (ambientMuted || audioSuppressed || ambientLockedByPage || lessonIsOpen()) return;
      audioUnlocked = true;

      if (theme === 'dark') {
        // Dark music is owned by the unified site-audio.js controller.
        return;
      }

      try { ensureAmbientContext(); } catch (_) {}
      refreshAmbientAudio(true);
    }

    updateAudioButton();
    // Try to continue ambience immediately on browsers that permit it. On
    // iPhone/Safari the context may remain suspended until the next user tap;
    // the gesture handlers below then resume the same persistent loop.
    if (!ambientMuted && !ambientLockedByPage && !lessonIsOpen()) {
      audioUnlocked = true;
      refreshAmbientAudio();
    }

    if (audioButton) {
      audioButton.addEventListener('click', () => {
        ambientMuted = !ambientMuted;
        storeAmbientMuted();
        if (darkTrackElement) darkTrackElement.muted = ambientMuted;
        if (recordedAmbience) recordedAmbience.muted = ambientMuted;
        if (birdAudio) birdAudio.muted = ambientMuted;
        if (!ambientMuted) {
          audioUnlocked = true;
          if (theme === 'dark') {
            // site-audio.js sees the updated mute state on this same click.
            updateAudioButton();
          } else {
            try { ensureAmbientContext(); } catch (_) {}
            refreshAmbientAudio(true);
          }
        } else {
          stopDarkAmbience();
          refreshAmbientAudio(true);
        }
      });
    }

    function updateDayCredit() {
      const scene = LIGHT_SCENES[activeSceneIndex];
      if (dayLink) {
        dayLink.href = scene.page;
        dayLink.textContent = scene.label;
      }
      if (dayCredit) {
        const audioCredit = scene.id === 'forest-waterfall'
          ? ' · Waterfall field audio · CC0'
          : scene.id === 'birds-water'
            ? ' · Ocean waves + seagulls · CC0'
            : ' · Flowing creek/river audio · CC0';
        dayCredit.textContent = 'Video by ' + scene.creator + ' · Pexels License · real nature footage' + audioCredit + '.';
      }
      if (!mediaDisabled) dayFallback.style.backgroundImage = 'url("' + scene.poster + '")';
      document.dispatchEvent(new CustomEvent('portfolio:scene', { detail: { id: scene.id } }));
    }

    function resize() {
      width = innerWidth;
      height = innerHeight;
      dpr = Math.min(devicePixelRatio || 1, constrainedMedia ? (width < 700 ? 1.15 : 1.35) : (width < 700 ? 1.35 : 1.7));
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = mediaDisabled ? 30 : constrainedMedia ? (width < 700 ? 42 : 72) : width < 700 ? 55 : 110;
      const dustCount = mediaDisabled ? 10 : constrainedMedia ? (width < 700 ? 14 : 28) : width < 700 ? 20 : 42;

      stars = Array.from({ length: starCount }, () => ({
        x: random(),
        y: random(),
        r: .3 + random() * 1.05,
        phase: random() * Math.PI * 2,
        rate: .16 + random() * .34,
        depth: .18 + random() * .82
      }));

      dust = Array.from({ length: dustCount }, () => ({
        x: random(),
        y: random(),
        r: .55 + random() * 1.7,
        phase: random() * Math.PI * 2,
        vx: -.22 + random() * .44,
        vy: .04 + random() * .18
      }));

      draw();
    }

    function configureVideo(video, scene) {
      video.pause();
      video.removeAttribute('src');
      video.poster = scene.poster;
      video.src = scene.src;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.loop = true;
      video.preload = mediaDisabled ? 'none' : (constrainedMedia ? 'metadata' : (video === activeVideo ? 'auto' : 'metadata'));
      video.load();
    }

    async function playSafely(video) {
      if (!video || theme !== 'light' || !motionAllowed() || mediaDisabled) return false;
      try {
        await video.play();
        return true;
      } catch (_) {
        return false;
      }
    }

    function pauseVideos() {
      [videoA, videoB].forEach(video => {
        try { video.muted = true; video.volume = 0; } catch (_) {}
        video.pause();
      });
    }

    function loadInitialLightScene() {
      updateDayCredit();
      if (!mediaReady || lightLoaded || mediaDisabled) return;
      lightLoaded = true;
      configureVideo(activeVideo, LIGHT_SCENES[activeSceneIndex]);
      activeVideo.classList.add('is-active');

      const ready = async () => {
        const playing = await playSafely(activeVideo);
        if (playing) dayFallback.classList.add('video-ready');
      };
      const confirmPlaying = () => dayFallback.classList.add('video-ready');
      activeVideo.addEventListener('playing', confirmPlaying);
      activeVideo.addEventListener('error', () => dayFallback.classList.remove('video-ready'));
      if (activeVideo.readyState >= 2) ready();
      else activeVideo.addEventListener('loadeddata', ready, { once: true });
    }

    function waitForVideo(video, timeoutMs) {
      return new Promise(resolve => {
        if (video.readyState >= 3) {
          resolve(true);
          return;
        }
        let done = false;
        const finish = value => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          video.removeEventListener('canplay', ok);
          video.removeEventListener('error', fail);
          resolve(value);
        };
        const ok = () => finish(true);
        const fail = () => finish(false);
        const timer = setTimeout(() => finish(false), timeoutMs || 9000);
        video.addEventListener('canplay', ok, { once: true });
        video.addEventListener('error', fail, { once: true });
      });
    }

    async function rotateLightScene() {
      if (transitionBusy || mediaDisabled || constrainedMedia || theme !== 'light' || !motionAllowed() || LIGHT_SCENES.length < 2) return;
      transitionBusy = true;

      const nextIndex = (activeSceneIndex + 1) % LIGHT_SCENES.length;
      configureVideo(standbyVideo, LIGHT_SCENES[nextIndex]);

      const available = await waitForVideo(standbyVideo, 9000);
      if (!available || theme !== 'light' || !motionAllowed()) {
        standbyVideo.pause();
        transitionBusy = false;
        rotationElapsed = 0;
        return;
      }

      try { standbyVideo.currentTime = 0; } catch (_) {}
      await playSafely(standbyVideo);

      standbyVideo.classList.add('is-active');
      activeVideo.classList.remove('is-active');

      const oldVideo = activeVideo;
      activeVideo = standbyVideo;
      standbyVideo = oldVideo;
      activeSceneIndex = nextIndex;
      updateDayCredit();
      refreshAmbientAudio(true);

      setTimeout(() => {
        standbyVideo.pause();
        try { standbyVideo.currentTime = 0; } catch (_) {}
      }, 1900);

      rotationElapsed = 0;
      transitionBusy = false;
    }

    function drawStars(driftX, driftY) {
      for (const star of stars) {
        const alpha = .34 + Math.sin(time * (star.rate * 1.55) + star.phase) * .24;
        ctx.fillStyle = 'rgba(220,236,250,' + Math.max(.07, alpha).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(
          star.x * width + driftX * star.depth * .36,
          star.y * height + driftY * star.depth * .28,
          star.r,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    function drawDust() {
      for (const p of dust) {
        const x = ((p.x * width + time * 8 * p.vx) % (width + 40) + width + 40) % (width + 40) - 20;
        const y = ((p.y * height + time * 8 * p.vy) % (height + 40) + height + 40) % (height + 40) - 20;
        const a = .04 + Math.sin(time * .34 + p.phase) * .03;
        ctx.fillStyle = 'rgba(229,218,200,' + Math.max(.006, a).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawStreak(dt) {
      nextStreak -= dt;
      if (!streak && nextStreak <= 0) {
        streak = {
          age: 0,
          life: .75 + random() * .45,
          x: width * (.18 + random() * .62),
          y: height * (.08 + random() * .34),
          length: 40 + random() * 50,
          speed: 120 + random() * 100
        };
      }

      if (!streak) return;
      streak.age += dt;
      const u = streak.age / streak.life;
      if (u >= 1) {
        streak = null;
        nextStreak = 14 + random() * 26;
        return;
      }

      const x = streak.x + u * streak.speed;
      const y = streak.y + u * streak.speed * .34;
      const alpha = Math.sin(u * Math.PI) * .13;
      const g = ctx.createLinearGradient(x, y, x - streak.length, y - streak.length * .34);
      g.addColorStop(0, 'rgba(232,244,255,' + alpha.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(232,244,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - streak.length, y - streak.length * .34);
      ctx.stroke();
    }

    function universe(dt) {
      const driftX = Math.sin(time / 10.5) * 26 + Math.sin(time / 24) * 12;
      const driftY = Math.cos(time / 14.5) * 16 + Math.sin(time / 31) * 7;
      const scale = 1.092 + Math.sin(time / 18) * .014;

      night.style.transform =
        'translate3d(' + driftX.toFixed(2) + 'px,' + driftY.toFixed(2) + 'px,0) scale(' + scale.toFixed(4) + ')';

      nightDepth.style.transform =
        'translate3d(' + (-driftX * .46).toFixed(2) + 'px,' + (-driftY * .34).toFixed(2) + 'px,0) scale(' +
        (1.126 - Math.sin(time / 22) * .012).toFixed(4) + ')';

      nightGlow.style.transform =
        'translate3d(' + (Math.sin(time / 8.5) * 38).toFixed(2) + 'px,' + (Math.cos(time / 12.5) * 24).toFixed(2) + 'px,0)';

      drawStars(driftX, driftY);
      drawDust();
      drawStreak(dt);
    }

    function livingEarth() {
      const glowX = width * (.5 + Math.sin(time / 14) * .09);
      const glowY = height * (.26 + Math.cos(time / 19) * .055);
      const radius = Math.max(width, height) * .46;
      const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, radius);
      glow.addColorStop(0, 'rgba(255,238,179,.075)');
      glow.addColorStop(.5, 'rgba(255,238,179,.025)');
      glow.addColorStop(1, 'rgba(255,238,179,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    function draw(dt) {
      ctx.clearRect(0, 0, width, height);
      if (theme === 'dark') universe(dt || .033);
      else livingEarth();
    }

    function frame(now) {
      raf = 0;
      if (document.hidden || !motionAllowed()) return;

      const interval = width < 700 || mediaDisabled ? 1000 / 18 : 1000 / 28;
      if (now - lastFrame >= interval) {
        const dt = Math.min((now - lastFrame) / 1000 || .035, .12);
        lastFrame = now;
        time += dt;

        if (theme === 'light') {
          rotationElapsed += dt;
          if (rotationElapsed >= ROTATE_AFTER) rotateLightScene();
        }

        draw(dt);
      }

      raf = requestAnimationFrame(frame);
    }

    function refresh() {
      cancelAnimationFrame(raf);
      raf = 0;
      theme = appearance.getTheme();
      backdrop.dataset.sceneTheme = theme;

      if (theme === 'light') {
        updateDayCredit();
        if (mediaReady) loadInitialLightScene();
        if (mediaReady && motionAllowed()) playSafely(activeVideo);
        else pauseVideos();
      } else {
        pauseVideos();
      }

      draw(.033);

      if (!document.hidden && motionAllowed()) {
        lastFrame = performance.now();
        raf = requestAnimationFrame(frame);
      }
      refreshAmbientAudio();
    }

    resize();
    refresh();

    function releaseMedia() {
      clearTimeout(mediaTimer);
      // Let navigation, typography and the first content paint settle before
      // starting a remote 1080p background stream. Posters remain immediate.
      mediaTimer = setTimeout(() => {
        mediaReady = true;
        updateDayCredit();
        if (theme === 'light') {
          loadInitialLightScene();
          playSafely(activeVideo);
        }
      }, constrainedMedia ? 700 : 220);
    }

    // The poster is immediate; video loading begins as soon as the DOM exists.
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', releaseMedia, { once: true });
    else releaseMedia();

    const retryLightPlayback = () => {
      if (theme === 'light' && mediaReady && motionAllowed()) {
        playSafely(activeVideo).then(playing => {
          if (playing) dayFallback.classList.add('video-ready');
        });
      }
    };
    document.addEventListener('pointerdown', retryLightPlayback, { passive: true });
    document.addEventListener('touchstart', retryLightPlayback, { passive: true });
    document.addEventListener('keydown', retryLightPlayback);
    // iOS/Safari requires a user gesture before background audio may start.
    // After the first successful unlock, ordinary taps no longer restart the loop.
    document.addEventListener('pointerdown', unlockAmbientFromGesture, { passive: true });
    document.addEventListener('touchstart', unlockAmbientFromGesture, { passive: true });
    document.addEventListener('keydown', unlockAmbientFromGesture);

    ambientWatchdog = setInterval(() => {
      if (theme === 'dark') {
        stopNatureAmbience();
        stopDarkAmbience();
        return;
      }
      if (!ambientAllowed() || !audioUnlocked) return;
      const recordedPlaying = Boolean(recordedAmbience && !recordedAmbience.paused);
      if (!recordedPlaying || ambientSignature !== desiredAmbientSignature()) refreshAmbientAudio(true);
      else syncVideoAmbience();
    }, 2500);
    document.addEventListener('portfolio:ambient-suppression', event => {
      audioSuppressed = Boolean(event.detail && event.detail.active);
      refreshAmbientAudio();
    });

    document.addEventListener('portfolio:theme', refresh);
    document.addEventListener('portfolio:motion', refresh);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseVideos();
        stopAmbientNodes();
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        refresh();
      }
    });

    addEventListener('resize', resize, { passive: true });
    addEventListener('pagehide', () => {
      saveDarkTrackTime();
      pauseVideos();
      stopAmbientNodes();
      stopRecordedAmbience();
      clearInterval(ambientWatchdog);
      clearTimeout(mediaTimer);
      cancelAnimationFrame(raf);
      raf = 0;
    });
    addEventListener('pageshow', refresh);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
