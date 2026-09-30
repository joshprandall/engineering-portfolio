/* Living portfolio environments.
   Dark: real JWST imagery + layered cinematic motion.
   Light: real licensed nature footage + graceful real-image fallback.
*/
(() => {
  'use strict';

  const SCENE_SCRIPT_URL = new URL(document.currentScript?.src || location.href, location.href);
  const SITE_BASE = new URL('./', SCENE_SCRIPT_URL);
  const BRANCH_PREVIEW_HOST = /(?:^|\.)raw\.githack\.com$/i.test(location.hostname) ||
    new URL(location.href).searchParams.get('previewHost') === '1';
  const previewSceneUrls = new Map();
  const previewSceneLoads = new Map();
  const PREVIEW_SCENE_ASSETS = Object.freeze({
    'forest-waterfall': Object.freeze({
      video: { mime: 'video/mp4', parts: [
        'preservation/ambience/0dd180961c009c20f5218a2801679b36b82be0837bc3e727908e1affffecd4a3/0.bin',
        'preservation/ambience/0dd180961c009c20f5218a2801679b36b82be0837bc3e727908e1affffecd4a3/1.bin'
      ] },
      poster: { mime: 'image/jpeg', parts: ['preservation/ambience/1a668f48c1dda23df4d5b621e754993f5efed6fe887342e55a4a485cb9040e8c/0.bin'] }
    }),
    'forest-river': Object.freeze({
      video: { mime: 'video/mp4', parts: [
        'preservation/ambience/cd0a5c3823b6a773545ecf7f6c3c4c5eeb69a71c0c41135ecdff45b3601e5112/0.bin',
        'preservation/ambience/cd0a5c3823b6a773545ecf7f6c3c4c5eeb69a71c0c41135ecdff45b3601e5112/1.bin'
      ] },
      poster: { mime: 'image/jpeg', parts: ['preservation/ambience/7ccbf50f35e2bf2c9cbe6c02d03bef4896be9a917460aaa45993c2697dd6834a/0.bin'] }
    }),
    'birds-water': Object.freeze({
      video: { mime: 'video/mp4', parts: ['preservation/ambience/54af202eb77b482086a041e64fd005e995dffc56defb8b118ae82dd118fdf7a4/0.bin'] },
      poster: { mime: 'image/jpeg', parts: ['preservation/ambience/1cef768c65f80887f2e77787229033a108f974ad80e823c037d1090bd6f944ed/0.bin'] }
    })
  });
  async function previewSceneAssetUrl(scene, kind = 'video') {
    if (!BRANCH_PREVIEW_HOST) return '';
    const key = scene.id + ':' + kind;
    if (previewSceneUrls.has(key)) return previewSceneUrls.get(key);
    if (previewSceneLoads.has(key)) return previewSceneLoads.get(key);
    const spec = PREVIEW_SCENE_ASSETS[scene.id]?.[kind];
    if (!spec) return '';
    const load = (async () => {
      const buffers = [];
      for (const part of spec.parts) {
        const response = await fetch(new URL(part, SITE_BASE), { cache: 'force-cache' });
        if (!response.ok) throw new Error('Preview scene HTTP ' + response.status + ': ' + part);
        buffers.push(await response.arrayBuffer());
      }
      const url = URL.createObjectURL(new Blob(buffers, { type: spec.mime }));
      previewSceneUrls.set(key, url);
      return url;
    })().finally(() => previewSceneLoads.delete(key));
    previewSceneLoads.set(key, load);
    return load;
  }
  const previewSceneUrl = scene => previewSceneAssetUrl(scene, 'video');
  const previewPosterUrl = scene => previewSceneAssetUrl(scene, 'poster');

  const LIGHT_SCENES = [
    {
      id: 'forest-waterfall',
      src: new URL('assets/scenes/day/waterfall.mp4', SITE_BASE).href,
      mobileSrc: new URL('assets/scenes/day/waterfall-mobile.mp4', SITE_BASE).href,
      remoteSrc: 'https://videos.pexels.com/video-files/7351460/7351460-hd_1920_1080_24fps.mp4',
      poster: new URL('assets/scenes/day/waterfall-poster.jpg', SITE_BASE).href,
      page: 'https://www.pexels.com/video/waterfall-in-the-forest-7351460/',
      creator: 'K',
      label: 'Forest waterfall'
    },
    {
      id: 'forest-river',
      src: new URL('assets/scenes/day/river.mp4', SITE_BASE).href,
      mobileSrc: new URL('assets/scenes/day/river-mobile.mp4', SITE_BASE).href,
      remoteSrc: 'https://videos.pexels.com/video-files/33886656/14381142_1920_1080_25fps.mp4',
      poster: new URL('assets/scenes/day/river-poster.jpg', SITE_BASE).href,
      page: 'https://www.pexels.com/video/serene-forest-river-scene-in-daylight-33886656/',
      creator: 'Christophe Génot',
      label: 'Forest river'
    },
    {
      id: 'birds-water',
      src: new URL('assets/scenes/day/beach-birds.mp4', SITE_BASE).href,
      mobileSrc: new URL('assets/scenes/day/beach-birds-mobile.mp4', SITE_BASE).href,
      remoteSrc: 'https://videos.pexels.com/video-files/9982425/9982425-hd_1920_1080_30fps.mp4',
      poster: new URL('assets/scenes/day/beach-birds-poster.jpg', SITE_BASE).href,
      page: 'https://www.pexels.com/video/birds-flying-above-beach-at-sunset-9982425/',
      creator: 'Daniel Feldman',
      label: 'Beach at sunset'
    }
  ];

  // Cycle the light-mode scenes while keeping each scene spatially fixed.
  const ROTATE_AFTER = 28;
  // Version bump resets old saved ordering so light mode starts with waterfall.
  const LIGHT_SCENE_KEY = 'jr-site-light-scene-v2';
  function storedLightSceneIndex() {
    try {
      const id = localStorage.getItem(LIGHT_SCENE_KEY);
      const index = LIGHT_SCENES.findIndex(scene => scene.id === id);
      return index >= 0 ? index : 0;
    } catch (_) {
      return 0;
    }
  }

  const boot = () => {
    if (document.getElementById('site-scene') || !window.PortfolioTheme) return;

    const appearance = window.PortfolioTheme;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = Boolean(connection && connection.saveData);
    // Preview and CI exercise the same media path as production.
    const mediaDisabled = false;
    const inAppBrowser = /FBAN|FBAV|Instagram|Messenger|Line\/|; wv\)/i.test(navigator.userAgent || '');
    const constrainedMedia = Boolean(
      inAppBrowser ||
      /(^|-)2g$/.test(connection?.effectiveType || '') ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    );


    const compactMedia = saveData || constrainedMedia || matchMedia('(max-width: 900px), (pointer: coarse)').matches;

    // Warm image/video connections immediately so the background appears before
    // the rest of the page has finished settling.
    [
      new URL('assets/scenes/webb-cosmic-cliffs.webp', SITE_BASE).href,
      ...LIGHT_SCENES.map(scene => scene.poster)
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

        '</p>' +
        '<p class="scene-source-day">Living Earth · ' +
          '<a class="scene-day-link" href="#" target="_blank" rel="noopener noreferrer">real licensed nature footage</a><br>' +
          '<small class="scene-day-credit">Pexels License · real wind, water, birds, and landscape motion.</small>' +
        '</p>' +
      '</div>'; 

    document.body.append(options);
    appearance.bind(options);

    const canvas = backdrop.querySelector('.scene-canvas');
    let ctx = null;
    try { ctx = canvas.getContext('2d', { alpha: true }); } catch (_) {}

    const night = backdrop.querySelector('.scene-night');
    const nightDepth = backdrop.querySelector('.scene-night-depth');
    const nightGlow = backdrop.querySelector('.scene-night-glow');
    const dayFallback = backdrop.querySelector('.scene-day-fallback');
    const videoA = backdrop.querySelector('.scene-video-a');
    const videoB = backdrop.querySelector('.scene-video-b');
    const dayLink = options.querySelector('.scene-day-link');
    const dayCredit = options.querySelector('.scene-day-credit');
    const dayPosters = new Map();
    if (!mediaDisabled) LIGHT_SCENES.forEach(scene => {
      const poster = new Image();
      dayPosters.set(scene.id, poster);
      if (BRANCH_PREVIEW_HOST) {
        previewPosterUrl(scene).then(src => {
          if (!src) return;
          poster.src = src;
          if (scene.id === LIGHT_SCENES[activeSceneIndex].id) dayFallback.style.backgroundImage = 'url("' + src + '")';
        }).catch(error => console.error('JR preview poster fallback failed:', scene.id, error));
      } else {
        poster.src = scene.poster;
      }
    });
    let activeVideo = videoA;
    let standbyVideo = videoB;
    let activeSceneIndex = storedLightSceneIndex();
    let mediaReady = false;
    let mediaTimer = 0;
    let lightLoaded = false;
    let sceneLoadId = 0;
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

    const motionAllowed = () => !appearance.isPaused();
    const reducedMotion = () => Boolean(appearance.isReducedMotion?.());

    function announceDaySceneWillChange(index) {
      const scene = LIGHT_SCENES[index];
      if (!scene) return;
      backdrop.dataset.pendingDayScene = scene.id;
      document.dispatchEvent(new CustomEvent('portfolio:scene-will-change', { detail: { id: scene.id } }));
    }

    function commitVisibleDayScene(scene) {
      if (scene.id !== LIGHT_SCENES[activeSceneIndex].id) return;
      if (backdrop.dataset.visibleDayScene === scene.id && !backdrop.dataset.pendingDayScene) return;
      backdrop.dataset.visibleDayScene = scene.id;
      delete backdrop.dataset.pendingDayScene;
      document.dispatchEvent(new CustomEvent('portfolio:scene', { detail: { id: scene.id } }));
    }

    function updateDayCredit() {
      const scene = LIGHT_SCENES[activeSceneIndex];
      try { localStorage.setItem(LIGHT_SCENE_KEY, scene.id); } catch (_) {}
      if (dayLink) {
        dayLink.href = scene.page;
        dayLink.textContent = scene.label;
      }
      if (dayCredit) {
        const audioCredit = scene.id === 'forest-waterfall'
          ? ' · Waterfall field audio by Benzband · CC BY-SA 3.0'
          : scene.id === 'birds-water'
            ? ' · Ocean waves + seagulls · U.S. Fish and Wildlife Service · public domain'
            : ' · Flowing creek/river audio · CC0';
        dayCredit.textContent = 'Video by ' + scene.creator + ' · Pexels License · real nature footage' + audioCredit + '.';
      }
      const poster = dayPosters.get(scene.id);
      const posterUrl = poster?.currentSrc || poster?.src || scene.poster;
      if (!mediaDisabled && posterUrl) dayFallback.style.backgroundImage = 'url("' + posterUrl + '")';
      if (backdrop.dataset.visibleDayScene === scene.id && !backdrop.dataset.pendingDayScene) return;
      if (backdrop.dataset.pendingDayScene !== scene.id) announceDaySceneWillChange(activeSceneIndex);
      // Announce audio only after the matching local image or a video frame is
      // ready. An old image load must never commit sound for a later scene.
      if (mediaDisabled || (poster?.complete && poster.naturalWidth > 0)) commitVisibleDayScene(scene);
      else poster?.addEventListener('load', () => commitVisibleDayScene(scene), { once: true });
    }

    function resize() {
      // Measure the fixed scene itself instead of innerHeight. On iOS Safari,
      // browser chrome changes innerHeight while scrolling and used to make the
      // cover media recalculate, visibly jump/zoom, and re-seed the star field.
      const rect = backdrop.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width || innerWidth));
      const nextHeight = Math.max(1, Math.round(rect.height || innerHeight));
      const nextDpr = Math.min(devicePixelRatio || 1, constrainedMedia ? (nextWidth < 700 ? 1.15 : 1.35) : (nextWidth < 700 ? 1.35 : 1.7));

      // Ignore dynamic-toolbar height notifications when the stable backdrop
      // geometry has not actually changed.
      if (width === nextWidth && height === nextHeight && Math.abs(dpr - nextDpr) < .01) return;

      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = mediaDisabled ? 34 : constrainedMedia ? (width < 700 ? 56 : 84) : width < 700 ? 68 : 124;
      const dustCount = mediaDisabled ? 10 : constrainedMedia ? (width < 700 ? 14 : 28) : width < 700 ? 20 : 42;

      stars = Array.from({ length: starCount }, () => ({
        x: random(),
        y: random(),
        r: .58 + random() * 1.42,
        phase: random() * Math.PI * 2,
        rate: .28 + random() * .58,
        depth: .18 + random() * .82,
        twinkle: random() < .76,
        twinkleRate: 1.8 + random() * 2.4,
        twinkleStrength: .72 + random() * .72
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

    function configureVideo(video, scene, source) {
      if (videoFrames.has(video)) {
        video.cancelVideoFrameCallback?.(videoFrames.get(video));
        videoFrames.delete(video);
      }
      clearVideoMotionWatch(video);
      video.pause();
      video.removeAttribute('src');
      video.poster = scene.poster;
      video.src = source || scene.src;
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('muted','');
      video.playsInline = true;
      video.setAttribute('playsinline','');
      video.setAttribute('webkit-playsinline','');
      video.autoplay = theme === 'light' && motionAllowed() && !document.hidden;
      video.loop = true;
      video.controls = false;
      video.disablePictureInPicture = true;
      video.preload = mediaDisabled ? 'none' : 'auto';
      video.load();
    }

    async function playSafely(video, timeoutMs = 30000) {
      // Day mode must remain visually alive. OS reduced-motion removes extra
      // camera effects but does not replace real waterfall/river/beach footage
      // with a frozen poster. Only an explicit site pause or media-unavailable
      // condition may stop playback.
      if (!video || theme !== 'light' || !motionAllowed() || mediaDisabled || document.hidden) return false;
      video.autoplay = true;
      // A play promise may stay pending while buffering or in an in-app
      // browser. Never let it hold the scene rotation indefinitely.
      return new Promise(resolve => {
        let settled = false;
        const finish = playing => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(playing);
        };
        const timer = setTimeout(() => finish(false), timeoutMs);
        try { Promise.resolve(video.play()).then(() => finish(true), () => finish(false)); }
        catch (_) { finish(false); }
      });
    }

    const videoFrames = new WeakMap();
    const videoMotionTimers = new WeakMap();

    function clearVideoMotionWatch(video) {
      const timer = videoMotionTimers.get(video);
      if (!timer) return;
      clearTimeout(timer);
      videoMotionTimers.delete(video);
    }

    function prewarmNextLightScene() {
      if (!BRANCH_PREVIEW_HOST || mediaDisabled || LIGHT_SCENES.length < 2) return;
      const next = LIGHT_SCENES[(activeSceneIndex + 1) % LIGHT_SCENES.length];
      previewPosterUrl(next).then(src => {
        const poster = dayPosters.get(next.id);
        if (poster && src && !poster.src) poster.src = src;
      }).catch(() => {});
      previewSceneUrl(next).catch(() => {});
    }

    function revealVideo(video, loadId = sceneLoadId, confirmedProgress = false) {
      const current = () => video === activeVideo && loadId === sceneLoadId &&
        theme === 'light' && !document.hidden && motionAllowed() &&
        !video.paused && video.readyState >= 2 && video.currentSrc === video.src;
      if (!current()) return;
      const reveal = () => {
        videoFrames.delete(video);
        clearVideoMotionWatch(video);
        if (!current()) return;
        dayFallback.classList.add('video-ready');
        commitVisibleDayScene(LIGHT_SCENES[activeSceneIndex]);
        prewarmNextLightScene();
      };
      // Real iPhone/WKWebView can expose requestVideoFrameCallback yet fail to
      // deliver it for a composited background. Timeline movement is also
      // proof that the Day clip is alive and safe to reveal.
      if (confirmedProgress || typeof video.requestVideoFrameCallback !== 'function') { reveal(); return; }
      if (!videoFrames.has(video)) videoFrames.set(video, video.requestVideoFrameCallback(reveal));
    }

    function watchVideoMotion(video, scene, loadId = sceneLoadId) {
      clearVideoMotionWatch(video);
      const start = Number(video.currentTime || 0);
      const timer = setTimeout(async () => {
        videoMotionTimers.delete(video);
        if (video !== activeVideo || loadId !== sceneLoadId || theme !== 'light' ||
            document.hidden || !motionAllowed() || video.paused || video.readyState < 2) return;

        const now = Number(video.currentTime || 0);
        const duration = Number(video.duration || 0);
        let advance = now - start;
        if (advance < 0 && duration > 0 && start > duration - 2 && now < 2) advance += duration;
        if (advance > .05) {
          revealVideo(video, loadId, true);
          return;
        }

        // Raw previews reconstruct approved MP4 bytes as a Blob. Some real
        // iPhone WebViews decode that Blob's first frame but never advance it.
        // In that case use the original direct licensed stream for this scene.
        const currentSrc = video.currentSrc || video.src || '';
        if (BRANCH_PREVIEW_HOST && currentSrc.startsWith('blob:') && scene?.remoteSrc) {
          configureVideo(video, scene, scene.remoteSrc);
          const playing = await playSafely(video, 12000);
          if (video !== activeVideo || loadId !== sceneLoadId || theme !== 'light' ||
              document.hidden || !motionAllowed()) return;
          if (playing) {
            revealVideo(video, loadId);
            watchVideoMotion(video, scene, loadId);
          }
          return;
        }

        const playing = await playSafely(video, 12000);
        if (video !== activeVideo || loadId !== sceneLoadId || theme !== 'light' ||
            document.hidden || !motionAllowed()) return;
        if (playing) {
          revealVideo(video, loadId);
          watchVideoMotion(video, scene, loadId);
        }
      }, 1800);
      videoMotionTimers.set(video, timer);
    }

    function pauseVideos() {
      [videoA, videoB].forEach(video => {
        try { video.muted = true; video.volume = 0; } catch (_) {}
        video.autoplay = false;
        clearVideoMotionWatch(video);
        video.pause();
      });
    }

    [videoA, videoB].forEach(video => {
      video.addEventListener('playing', () => {
        if (video === activeVideo && !video.paused && video.readyState >= 2 &&
            video.currentSrc === video.src && theme === 'light' && !document.hidden && motionAllowed()) {
          revealVideo(video);
          watchVideoMotion(video, LIGHT_SCENES[activeSceneIndex], sceneLoadId);
        }
      });
      video.addEventListener('timeupdate', () => {
        if (video === activeVideo && !video.paused && video.readyState >= 2 &&
            video.currentSrc === video.src && theme === 'light' && !document.hidden &&
            motionAllowed() && Number(video.currentTime || 0) > .05) {
          revealVideo(video, sceneLoadId, true);
        }
      });
      video.addEventListener('error', () => {
        if (video === activeVideo) dayFallback.classList.remove('video-ready');
      });
    });

    function loadInitialLightScene() {
      updateDayCredit();
      if (!mediaReady || lightLoaded || mediaDisabled || !motionAllowed()) return;
      lightLoaded = true;
      activeVideo.classList.add('is-active');

      prepareAndPlay(activeVideo, LIGHT_SCENES[activeSceneIndex]).then(playing => {
        if (playing) revealVideo(activeVideo);
      });
    }

    async function prepareAndPlay(video, scene) {
      const loadId = ++sceneLoadId;
      // Raw branch previews do not reconstruct the preserved large-media chunks.
      // Use the already-approved original Pexels clip there; production still
      // prefers the preserved local master/mobile renditions.
      let previewSrc = '';
      if (BRANCH_PREVIEW_HOST) {
        try { previewSrc = await previewSceneUrl(scene); } catch (error) { console.error('JR preview scene fallback failed:', scene.id, error); }
      }
      const sources = (BRANCH_PREVIEW_HOST
        ? [previewSrc, scene.remoteSrc, scene.mobileSrc, scene.src]
        : compactMedia
          ? [scene.mobileSrc, scene.src, scene.remoteSrc]
          : [scene.src, scene.mobileSrc, scene.remoteSrc]
      ).filter(Boolean);
      for (const source of sources) {
        configureVideo(video, scene, source);
        // Start playback immediately: waiting for canplay before play can
        // prevent mobile browsers from fetching enough video to become ready.
        const playing = await playSafely(video, 30000);
        if (loadId !== sceneLoadId || video !== activeVideo || theme !== 'light' || !motionAllowed() || document.hidden) return false;
        if (playing) {
          watchVideoMotion(video, scene, loadId);
          return true;
        }
        // A loaded video blocked by autoplay can resume on the next user tap.
        // Switching its source would discard useful buffered frames.
        if (video.readyState >= 2 && !video.error) return false;
      }
      return false;
    }

    function rotateLightScene() {
      if (mediaDisabled || theme !== 'light' || !motionAllowed() || LIGHT_SCENES.length < 2) return;
      const nextIndex = (activeSceneIndex + 1) % LIGHT_SCENES.length;
      const nextScene = LIGHT_SCENES[nextIndex];
      const nextPoster = dayPosters.get(nextScene.id);
      if (!mediaDisabled && (!nextPoster || !nextPoster.complete || nextPoster.naturalWidth <= 0)) {
        if (BRANCH_PREVIEW_HOST && nextPoster && !nextPoster.src) {
          previewPosterUrl(nextScene).then(src => { if (src && !nextPoster.src) nextPoster.src = src; }).catch(() => {});
        }
        return;
      }
      announceDaySceneWillChange(nextIndex);
      const oldVideo = activeVideo;
      activeVideo = standbyVideo;
      standbyVideo = oldVideo;
      activeSceneIndex = nextIndex;
      updateDayCredit();
      dayFallback.classList.remove('video-ready');
      // Commit the scene on its own clock. The licensed poster appears while
      // its video starts, and a stalled play promise cannot freeze the cycle.
      activeVideo.classList.add('is-active');
      oldVideo.classList.remove('is-active');
      prepareAndPlay(activeVideo, nextScene).then(playing => {
        if (playing) revealVideo(activeVideo);
      });

      setTimeout(() => {
        if (oldVideo === activeVideo) return;
        oldVideo.autoplay = false;
        oldVideo.pause();
        // Pausing alone leaves the outgoing download competing with the next
        // scene. Release it after the crossfade, and discard its old frame.
        oldVideo.removeAttribute('src');
        oldVideo.load();
      }, 1900);

      rotationElapsed = 0;
    }

    function drawStars(cameraX, cameraY) {
      for (const star of stars) {
        const slow = Math.sin(time * (star.rate * 1.15) + star.phase);
        const twinkleWave = Math.sin(time * star.twinkleRate + star.phase * 1.7);
        // Twinkling must read on a phone: frequent independent peaks, brighter
        // contrast, and a small four-point flare at the top of each sparkle.
        const sparkle = star.twinkle ? Math.pow(Math.max(0, twinkleWave), 4) : 0;
        const baseAlpha = .26 + star.depth * .30;
        const twinkleScale = reducedMotion() ? .46 : 1;
        const alpha = star.twinkle
          ? baseAlpha + slow * .055 * twinkleScale + sparkle * (.56 + .30 * star.twinkleStrength) * twinkleScale
          : baseAlpha + slow * .035 * twinkleScale;
        const pulse = star.twinkle ? 1 + sparkle * (.58 + .28 * star.twinkleStrength) * twinkleScale : 1;
        // The generated stars share the exact master camera transform with
        // the JWST background. Their only independent behavior is twinkling,
        // so the two star fields never appear to slide past each other.
        const x = star.x * width + cameraX;
        const y = star.y * height + cameraY;
        const radius = star.r * pulse;
        const visibleAlpha = Math.max(.12, Math.min(.98, alpha));

        ctx.fillStyle = 'rgba(232,244,255,' + visibleAlpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        if (star.twinkle && sparkle > .16) {
          const flare = (2.4 + star.r * 2.3 + sparkle * 4.8) * twinkleScale;
          const flareAlpha = Math.min(.92, .24 + sparkle * .68 * star.twinkleStrength) * twinkleScale;
          ctx.strokeStyle = 'rgba(238,248,255,' + flareAlpha.toFixed(3) + ')';
          ctx.lineWidth = Math.max(.65, .72 * twinkleScale);
          ctx.beginPath();
          ctx.moveTo(x - flare, y); ctx.lineTo(x + flare, y);
          ctx.moveTo(x, y - flare); ctx.lineTo(x, y + flare);
          ctx.stroke();
        }
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

    function nightCameraLimits() {
      // Derive the safe camera travel from the actual overscanned scene layer,
      // not a fixed pixel guess. This keeps the image covering the viewport on
      // phones, tablets, desktop, orientation changes, and Safari viewport shifts.
      const availableX = Math.max(0, (night.offsetWidth - width) / 2 - 4);
      const availableY = Math.max(0, (night.offsetHeight - height) / 2 - 4);
      return {
        x: Math.min(22, availableX),
        y: Math.min(26, availableY)
      };
    }

    function universe(dt) {
      // One coherent camera drives the JWST background, its depth/glow treatment,
      // and the generated stars. Movement is deliberately slow enough to feel
      // atmospheric, while the overscan-derived limits guarantee full coverage.
      const limits = nightCameraLimits();
      const scale = reducedMotion() ? .18 : 1;
      const cameraX = Math.sin(time * .18) * limits.x * scale;
      const cameraY = Math.cos(time * .15) * limits.y * scale;

      night.style.transform = 'translate3d(' + cameraX.toFixed(2) + 'px,' + cameraY.toFixed(2) + 'px,0)';
      nightDepth.style.transform = 'translate3d(' + (cameraX * 1.04).toFixed(2) + 'px,' + (cameraY * 1.04).toFixed(2) + 'px,0)';
      nightGlow.style.transform = 'translate3d(' + (cameraX * .72).toFixed(2) + 'px,' + (cameraY * .72).toFixed(2) + 'px,0)';

      if (!ctx) return;
      drawStars(cameraX, cameraY);
      if (!reducedMotion()) {
        drawDust();
        drawStreak(dt);
      }
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

      // The visible poster fallback has its own CSS camera animation so it
      // remains alive even if the browser throttles this canvas loop or the
      // remote Day video cannot play.
    }

    function draw(dt) {
      ctx?.clearRect(0, 0, width, height);
      if (theme === 'dark') universe(dt || .033);
      else if (ctx) livingEarth();
    }

    function frame(now) {
      raf = 0;
      if (document.hidden || !motionAllowed()) return;

      const interval = reducedMotion() ? 1000 / 12 : (width < 700 || mediaDisabled ? 1000 / 22 : 1000 / 30);
      if (now - lastFrame >= interval) {
        const elapsed = (now - lastFrame) / 1000 || .035;
        const dt = Math.min(elapsed, .12);
        lastFrame = now;
        time += dt;

        if (theme === 'light') {
          rotationElapsed += elapsed;
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
        const video = activeVideo;
        const loadId = sceneLoadId;
        playSafely(video).then(playing => {
          if (playing && video === activeVideo && loadId === sceneLoadId) revealVideo(video, loadId);
        });
      }
    };
    document.addEventListener('pointerdown', retryLightPlayback, { passive: true });
    document.addEventListener('touchstart', retryLightPlayback, { passive: true });
    document.addEventListener('keydown', retryLightPlayback);
    document.addEventListener('portfolio:theme', refresh);
    document.addEventListener('portfolio:motion', refresh);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseVideos();
        
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        refresh();
      }
    });

    addEventListener('resize', resize, { passive: true });
    addEventListener('pagehide', () => {
      previewSceneUrls.forEach(url => { try { URL.revokeObjectURL(url); } catch (_) {} });
      previewSceneUrls.clear();
      
      pauseVideos();
      
      
      
      clearTimeout(mediaTimer);
      cancelAnimationFrame(raf);
      raf = 0;
    });
    addEventListener('pageshow', () => {
      if (!mediaReady) releaseMedia();
      refresh();
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
