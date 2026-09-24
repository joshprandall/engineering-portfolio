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
  const assetBase = new URL('.', document.currentScript.src);

  const boot = () => {
    if (document.getElementById('site-scene') || !window.PortfolioTheme) return;

    const appearance = window.PortfolioTheme;
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);
    const localTestHost = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    const mediaDisabled = saveData || localTestHost;
    const solidWorkspace = () => document.documentElement.dataset.sceneSurface === 'solid' || document.body.classList.contains('reading');

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
        '<video class="scene-video scene-video-a" muted playsinline loop preload="none" tabindex="-1"></video>' +
        '<video class="scene-video scene-video-b" muted playsinline loop preload="none" tabindex="-1"></video>' +
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
    // A missing decorative canvas must not disable the video player or controls.

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
    let mediaReady = true;
    let fadeTimer = 0;
    let nextAttempt = 0;
    let startingVideo = false;
    let nextPlayAttempt = 0;
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
    let nextStreak = 6;

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
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

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

    const canPlay = () => theme === 'light' && motionAllowed() && !mediaDisabled && !document.hidden && !solidWorkspace();

    function configureVideo(video, index) {
      if (video.dataset.sceneIndex === String(index) && video.getAttribute('src')) return;
      const scene = LIGHT_SCENES[index];
      video.pause();
      if (video !== activeVideo) video.classList.remove('is-active');
      video.dataset.sceneIndex = String(index);
      delete video.dataset.corsRetry;
      video.crossOrigin = 'anonymous';
      video.poster = scene.poster;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = false;
      video.loop = true;
      video.preload = 'auto';
      video.src = scene.src;
      video.load();
    }

    // Some video CDNs omit CORS. Keep playback working, with conservative contrast.
    for (const video of [videoA, videoB]) {
      video.addEventListener('error', () => {
        if (video.dataset.corsRetry || !video.getAttribute('src')) return;
        video.dataset.corsRetry = 'true';
        video.removeAttribute('crossorigin');
        video.load();
        if (video === activeVideo && canPlay()) startActiveVideo();
      });
    }

    function presentedFrame(video, timeout = 6000) {
      return new Promise(resolve => {
        let handle = 0;
        let done = false;
        const finish = value => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          if (handle && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(handle);
          video.removeEventListener('timeupdate', updated);
          resolve(value);
        };
        const updated = () => { if (video.readyState >= 2 && !video.paused && video.currentTime > 0) finish(true); };
        const timer = setTimeout(() => finish(false), timeout);
        if (video.requestVideoFrameCallback) handle = video.requestVideoFrameCallback(() => finish(true));
        else video.addEventListener('timeupdate', updated);
      });
    }

    async function playSafely(video) {
      if (!canPlay()) return false;
      try {
        // A resolved play() alone is not enough: wait for a decoded, presented frame.
        const presented = presentedFrame(video);
        const started = Promise.resolve(video.play()).then(() => true, () => false);
        const okay = await Promise.race([
          Promise.all([started, presented]).then(([playing, frame]) => playing && frame),
          new Promise(resolve => setTimeout(() => resolve(false), 6500))
        ]);
        if (!okay || !canPlay()) { video.pause(); return false; }
        return true;
      } catch (_) { return false; }
    }

    function pauseVideos() { videoA.pause(); videoB.pause(); }

    async function startActiveVideo() {
      if (startingVideo || !canPlay()) return;
      startingVideo = true;
      const video = activeVideo;
      const playing = await playSafely(video);
      if (playing && video === activeVideo && canPlay()) {
        video.classList.add('is-active');
        dayFallback.classList.add('video-ready');
        backdrop.dataset.playback = 'playing';
      } else if (!dayFallback.classList.contains('video-ready')) backdrop.dataset.playback = 'poster';
      startingVideo = false;
    }

    function loadInitialLightScene() {
      updateDayCredit();
      if (!mediaReady || mediaDisabled || solidWorkspace()) return;
      if (!lightLoaded) { lightLoaded = true; configureVideo(activeVideo, activeSceneIndex); }
      if (activeVideo.paused) startActiveVideo();
    }

    function warmNextScene() {
      if (!canPlay() || transitionBusy) return;
      configureVideo(standbyVideo, (activeSceneIndex + 1) % LIGHT_SCENES.length);
    }

    async function rotateLightScene() {
      if (transitionBusy || !canPlay() || time < nextAttempt) return;
      transitionBusy = true;
      const incoming = standbyVideo;
      const outgoing = activeVideo;
      const nextIndex = (activeSceneIndex + 1) % LIGHT_SCENES.length;
      configureVideo(incoming, nextIndex);
      const playing = await playSafely(incoming);
      if (!playing || !canPlay()) {
        incoming.pause();
        transitionBusy = false;
        nextAttempt = time + 6;
        // Leave the existing video visible and playing throughout a network delay.
        if (canPlay() && outgoing.paused) startActiveVideo();
        return;
      }
      incoming.style.zIndex = '1';
      outgoing.style.zIndex = '0';
      incoming.classList.add('is-active');
      activeVideo = incoming;
      standbyVideo = outgoing;
      activeSceneIndex = nextIndex;
      updateDayCredit();
      rotationElapsed = 0;
      backdrop.dataset.playback = 'crossfade';
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => {
        // Capture the outgoing element, never a mutable standby pointer.
        outgoing.pause();
        outgoing.classList.remove('is-active');
        transitionBusy = false;
        backdrop.dataset.playback = activeVideo.paused ? 'paused' : 'playing';
        if (canPlay()) warmNextScene();
      }, 1500);
    }

    function drawStars(driftX, driftY) {
      for (const star of stars) {
        const alpha = .56 + Math.sin(time * (star.rate * 1.6) + star.phase) * .28;
        ctx.fillStyle = 'rgba(220,236,250,' + Math.max(.07, alpha).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(
          star.x * width + driftX * star.depth * .85,
          star.y * height + driftY * star.depth * .65,
          star.r,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    function drawDust() {
      for (const p of dust) {
        const x = ((p.x * width + time * 15 * p.vx) % (width + 40) + width + 40) % (width + 40) - 20;
        const y = ((p.y * height + time * 15 * p.vy) % (height + 40) + height + 40) % (height + 40) - 20;
        const a = .14 + Math.sin(time * .34 + p.phase) * .055;
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
        nextStreak = 9 + random() * 17;
        return;
      }

      const x = streak.x + u * streak.speed;
      const y = streak.y + u * streak.speed * .34;
      const alpha = Math.sin(u * Math.PI) * .36;
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
      const driftX = Math.sin(time / 8.5) * Math.min(width * .04, 48) + Math.sin(time / 21) * 10;
      const driftY = Math.cos(time / 12) * Math.min(height * .035, 30) + Math.sin(time / 27) * 8;
      const scale = 1.17 + Math.sin(time / 16) * .024;

      night.style.transform =
        'translate3d(' + driftX.toFixed(2) + 'px,' + driftY.toFixed(2) + 'px,0) scale(' + scale.toFixed(4) + ')';

      nightDepth.style.transform =
        'translate3d(' + (-driftX * .46).toFixed(2) + 'px,' + (-driftY * .34).toFixed(2) + 'px,0) scale(' +
        (1.19 - Math.sin(time / 22) * .022).toFixed(4) + ')';

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
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      if (theme === 'dark') universe(dt || .033);
      else livingEarth();
    }

    function frame(now) {
      raf = 0;
      if (document.hidden || !motionAllowed() || solidWorkspace()) return;

      const interval = width < 700 || mediaDisabled ? 1000 / 24 : 1000 / 30;
      if (now - lastFrame >= interval) {
        const dt = Math.min((now - lastFrame) / 1000 || .035, .12);
        lastFrame = now;
        time += dt;

        if (canPlay() && activeVideo.paused && !startingVideo && time > nextPlayAttempt) {
          nextPlayAttempt = time + 8; loadInitialLightScene();
        }
        if (theme === 'light' && !activeVideo.paused && activeVideo.readyState >= 3) {
          rotationElapsed += dt;
          const duration = Number.isFinite(activeVideo.duration) ? activeVideo.duration : ROTATE_AFTER + 4;
          const deadline = Math.min(ROTATE_AFTER, Math.max(4, duration - 2));
          if (rotationElapsed > 2) warmNextScene();
          if (rotationElapsed >= deadline) rotateLightScene();
        }
        if (now - lastContrast > 850) { updateContrast(); lastContrast = now; }

        draw(dt);
      }

      raf = requestAnimationFrame(frame);
    }

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 64; sampleCanvas.height = 48;
    let sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
    const nightImage = new Image();
    nightImage.src = new URL('assets/scenes/webb-cosmic-cliffs.webp', assetBase).href;
    const fallbackImage = new Image();
    fallbackImage.src = new URL('assets/scenes/mountain-valley.svg', assetBase).href;
    const unreadable = new WeakSet();
    let contrastNodes = [];
    let lastContrast = 0;
    let contrastTimer = 0;
    const copySelector = '.hero-copy,.about-copy,.section-heading,.portrait-caption,.quantum-intro,.projects-hero,.contact>div,.vnext-sys-detail,.scene-options>div,footer.wrap,.site-footer,.vnext-sys-top,.learn-page-intro,.education-section>.text-link';
    const glassSelector = '.home-project,.project-card,.education-cards article,.domain-card,.principle-grid article,.home-spotlight,.stat-band,.verification-strip,.resume-strip,.learn-page-nav,.credentials-detail';
    function collectSurfaces() {
      if (document.documentElement.dataset.sceneSurface !== 'glass') return;
      document.querySelectorAll(copySelector).forEach(el => el.classList.add('scene-copy'));
      document.querySelectorAll(glassSelector).forEach(el => el.classList.add('glass-surface'));
      contrastNodes = [...document.querySelectorAll('.scene-copy,.glass-surface')];
      updateContrast();
    }
    const linear = x => { x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; };
    const luminance = rgb => .2126 * linear(rgb[0]) + .7152 * linear(rgb[1]) + .0722 * linear(rgb[2]);
    const ratio = (a, b) => (Math.max(a,b) + .05) / (Math.min(a,b) + .05);

    function updateContrast(force = false) {
      if (solidWorkspace()) return;
      const light = theme === 'light';
      let source = light ? activeVideo : nightImage;
      let sampled = false, pixels;
      if (light && (activeVideo.readyState < 2 || unreadable.has(activeVideo))) source = fallbackImage;
      try {
        const sw = source.videoWidth || source.naturalWidth, sh = source.videoHeight || source.naturalHeight;
        if (sampleContext && sw && sh) {
          const scale = Math.max(width / sw, height / sh);
          const cw = width / scale, ch = height / scale;
          sampleContext.drawImage(source, (sw-cw)/2, (sh-ch)/2, cw, ch, 0, 0, 64, 48);
          pixels = sampleContext.getImageData(0,0,64,48).data;
          // A remote video without CORS needs conservative surfaces, not guessed pixel colors.
          sampled = !light || source === activeVideo;
        }
      } catch (_) {
        unreadable.add(source);
        sampleCanvas.width = 64; // clear the tainted backing store before the next sample
        sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
      }
      backdrop.dataset.contrast = sampled ? 'sampled' : 'conservative';
      for (const el of contrastNodes) {
        const rect = el.getBoundingClientRect();
        if (!rect.width || rect.bottom < 0 || rect.top > height) continue;
        let sum = 0, n = 0, worst = light ? 255 : 0;
        if (sampled && pixels) {
          const x0=Math.max(0,Math.floor(rect.left/width*64)), x1=Math.min(64,Math.ceil(rect.right/width*64));
          const y0=Math.max(0,Math.floor(rect.top/height*48)), y1=Math.min(48,Math.ceil(rect.bottom/height*48));
          for(let y=y0;y<y1;y+=2) for(let x=x0;x<x1;x+=2) {
            const i=(y*64+x)*4, v=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];
            sum+=v; n++; worst=light?Math.min(worst,v):Math.max(worst,v);
          }
        }
        const mean=n?sum/n:light?95:160;
        const strength=light?1-mean/255:mean/255;
        const ink=light?[8+Math.round((1-strength)*8),30+Math.round((1-strength)*8),26+Math.round((1-strength)*6)]:[237+Math.round(strength*12),245+Math.round(strength*8),246+Math.round(strength*7)];
        const muted=light?[30,55,46]:[203,220,224];
        const accent=light?[120,46,16]:[255,201,160];
        const link=light?[16,68,77]:[175,235,241];
        const tint=light?[247,252,248]:[13,27,34];
        // Bound the unseen/high-frequency detail beyond the sparse sample, too.
        const raw=n?(light?Math.max(0,worst-40):Math.min(255,worst+40)):(light?0:255);
        const wash=light?.15:.27, veil=light?235:12;
        const backdropValue=raw*(1-wash)+veil*wash;
        let alpha=.56;
        for(;alpha<.88;alpha+=.01) {
          const bg=luminance(tint.map(v=>v*alpha+backdropValue*(1-alpha)));
          if ([ink,muted,accent,link].every(rgb=>ratio(luminance(rgb),bg)>=5)) break;
        }
        // Strengthen immediately; ease only toward greater transparency.
        const old=Number(el.dataset.glassAlpha)||alpha;
        if (!force && alpha<old) alpha=old*.7+alpha*.3;
        const value=alpha.toFixed(3);
        el.dataset.glassAlpha=value;
        el.style.setProperty('--glass-alpha',value);
        el.style.setProperty('--copy-alpha',value);
        el.style.setProperty('--scene-surface',`rgba(${tint.join(',')},${value})`);
        for(const [key,rgb] of [['ink',ink],['text',ink],['muted',muted],['accent',accent],['blue',link]]) el.style.setProperty('--'+key,`rgb(${rgb.join(',')})`);
      }
    }
    new MutationObserver(() => {
      clearTimeout(contrastTimer);
      contrastTimer=setTimeout(collectSurfaces,120);
    }).observe(document.body,{childList:true,subtree:true});
    collectSurfaces();
    nightImage.addEventListener('load',()=>updateContrast(true));
    addEventListener('scroll',()=>{if(!raf) updateContrast();},{passive:true});

    function refresh() {
      cancelAnimationFrame(raf);
      raf = 0;
      theme = appearance.getTheme();
      backdrop.dataset.sceneTheme = theme;
      if (canPlay()) loadInitialLightScene();
      else { pauseVideos(); backdrop.dataset.playback = 'paused'; }
      updateContrast(true);
      draw(0);
      if (!document.hidden && motionAllowed() && !solidWorkspace()) {
        lastFrame = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }

    // Start at DOM readiness, not after all 8,000 learning records and images load.
    resize();
    refresh();
    const retryLightPlayback = () => { if (activeVideo.paused && canPlay()) loadInitialLightScene(); };
    document.addEventListener('pointerdown', retryLightPlayback, { passive: true });
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
      clearTimeout(fadeTimer);
      standbyVideo.classList.remove('is-active');
      transitionBusy = false;
      cancelAnimationFrame(raf);
      raf = 0;
    });
    addEventListener('pageshow', refresh);
    let wasSolid = solidWorkspace();
    new MutationObserver(() => {
      const solid = solidWorkspace();
      if (solid !== wasSolid) { wasSolid = solid; refresh(); }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
