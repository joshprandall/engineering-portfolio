/* Living portfolio environments.
   Dark: real JWST imagery + layered cinematic motion.
   Light: real licensed nature footage + graceful real-image fallback.
*/
(() => {
  'use strict';

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

  const boot = () => {
    if (document.getElementById('site-scene') || !window.PortfolioTheme) return;

    const appearance = window.PortfolioTheme;
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);
    const localTestHost = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    const mediaDisabled = saveData || localTestHost;

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
          '<small>Real astronomical imagery with decorative environmental motion; not an observational time-lapse.</small>' +
        '</p>' +
        '<p class="scene-source-day">Living Earth · ' +
          '<a class="scene-day-link" href="#" target="_blank" rel="noopener noreferrer">real licensed nature footage</a><br>' +
          '<small class="scene-day-credit">Pexels License · real wind, water, birds, and landscape motion.</small>' +
        '</p>' +
      '</div>' +
      '<button data-scene-motion type="button">Pause motion</button>';

    const footerMotion = document.querySelector('footer button[data-scene-motion]');
    if (footerMotion && options.querySelector('button')) options.querySelector('button').replaceWith(footerMotion);
    document.body.append(options);
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

    const motionAllowed = () => !appearance.isPaused();

    function updateDayCredit() {
      const scene = LIGHT_SCENES[activeSceneIndex];
      if (dayLink) {
        dayLink.href = scene.page;
        dayLink.textContent = scene.label;
      }
      if (dayCredit) {
        dayCredit.textContent = 'Video by ' + scene.creator + ' · Pexels License · real nature footage.';
      }
      if (mediaReady && !mediaDisabled) dayFallback.style.backgroundImage = 'url("' + scene.poster + '")';
    }

    function resize() {
      width = innerWidth;
      height = innerHeight;
      dpr = Math.min(devicePixelRatio || 1, width < 700 ? 1.35 : 1.75);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = mediaDisabled ? 30 : width < 700 ? 55 : 110;
      const dustCount = mediaDisabled ? 10 : width < 700 ? 20 : 42;

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
      video.preload = mediaDisabled ? 'none' : 'metadata';
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
      videoA.pause();
      videoB.pause();
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
      if (transitionBusy || mediaDisabled || theme !== 'light' || !motionAllowed() || LIGHT_SCENES.length < 2) return;
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
    }

    resize();
    refresh();

    function releaseMedia() {
      clearTimeout(mediaTimer);
      mediaTimer = setTimeout(() => {
        mediaReady = true;
        updateDayCredit();
        if (theme === 'light') {
          loadInitialLightScene();
          if (motionAllowed()) playSafely(activeVideo);
        }
      }, 1200);
    }

    if (document.readyState === 'complete') releaseMedia();
    else addEventListener('load', releaseMedia, { once: true });

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
      pauseVideos();
      clearTimeout(mediaTimer);
      cancelAnimationFrame(raf);
      raf = 0;
    });
    addEventListener('pageshow', refresh);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
