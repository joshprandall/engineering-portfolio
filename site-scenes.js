/* Atmospheric motion behind the content. No video loops, sound, or pointer capture. */
(() => {
  'use strict';
  const boot = () => {
    if (document.getElementById('site-scene') || !window.PortfolioTheme) return;
    const appearance = window.PortfolioTheme;
    document.body.classList.add('living-scenes');
    const backdrop = document.createElement('div');
    backdrop.id = 'site-scene';
    backdrop.className = 'scene-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.innerHTML = '<div class="scene-image scene-night"></div><div class="scene-image scene-day"></div><canvas class="scene-canvas"></canvas><div class="scene-veil"></div>';
    document.body.prepend(backdrop);
    const options = document.createElement('div');
    options.className = 'scene-options';
    options.innerHTML = '<div><p class="scene-source-night">Webb’s Cosmic Cliffs · <a href="https://esawebb.org/images/weic2205a/" target="_blank" rel="noopener noreferrer">NASA, ESA, CSA, and STScI</a><br><small><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · Decorative motion added; not a time-lapse.</small></p><p class="scene-source-day">Mountain valley · Clouds, wind, and flowing water.</p></div><button data-scene-motion type="button">Pause motion</button>';
    const footerMotion = document.querySelector('footer button[data-scene-motion]');
    if (footerMotion) options.querySelector('button').replaceWith(footerMotion);
    document.body.append(options);
    appearance.bind(options);
    const canvas = backdrop.querySelector('canvas');
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    const night = backdrop.querySelector('.scene-night');
    let width = 0, height = 0, dpr = 1, raf = 0, lastFrame = 0, time = 0;
    let theme = appearance.getTheme();
    let stars = [], clouds = [], flock = null, nextFlock = 24;
    const seedArray = new Uint32Array(1);
    if (window.crypto?.getRandomValues) crypto.getRandomValues(seedArray);
    else seedArray[0] = Date.now() >>> 0;
    let seed = seedArray[0];
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    const cloudSprite = document.createElement('canvas');
    cloudSprite.width = 420; cloudSprite.height = 140;
    const cloudContext = cloudSprite.getContext('2d');
    if (cloudContext) {
      for (let i = 0; i < 12; i++) {
        const x = 55 + random() * 310, y = 52 + random() * 28, r = 30 + random() * 33;
        const glow = cloudContext.createRadialGradient(x, y, 0, x, y, r);
        glow.addColorStop(0, 'rgba(255,252,236,.16)'); glow.addColorStop(1, 'rgba(255,252,236,0)');
        cloudContext.fillStyle = glow; cloudContext.fillRect(x-r, y-r, r*2, r*2);
      }
    }
    const pines = Array.from({ length: 10 }, (_, i) => ({
      x: i < 5 ? 25 + i * 65 : 1310 + (i-5) * 72,
      y: 1020 + random() * 22, h: 170 + random() * 130, phase: random() * 8
    }));
    function spawnFlock(initial = false) {
      const leftToRight = random() > .35;
      flock = { age: initial ? 22 : 0, duration: 62 + random() * 30, y: .12 + random() * .2,
        arc: random() * 50 - 25, direction: leftToRight ? 1 : -1,
        birds: Array.from({ length: 4 + Math.floor(random() * 5) }, (_, i) => ({
          x: -Math.ceil(i / 2) * (11 + random() * 5), y: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 6,
          phase: random() * Math.PI * 2, size: 2.2 + random() * 1.3, cadence: 3.6 + random() * 1.7
        })) };
    }
    spawnFlock(true);
    function resize() {
      width = innerWidth; height = innerHeight;
      dpr = Math.min(devicePixelRatio || 1, width < 700 ? 1.5 : 1.75);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = navigator.connection?.saveData ? 28 : width < 700 ? 45 : 85;
      stars = Array.from({ length: count }, () => ({ x: random(), y: random(), r: .35 + random() * .9, phase: random() * 50, rate: .09 + random() * .16 }));
      clouds = Array.from({ length: 6 }, () => ({ x: random() * (width + 500) - 300, y: height * (.03 + random() * .43), scale: .65 + random() * 1.7, rate: .6 + random() * 1.15 }));
      draw();
    }
    function universe() {
      // A slow viewpoint drift; no distortion of the observed nebula structures.
      const x = Math.sin(time / 173) * 10 + Math.sin(time / 277) * 4;
      const y = Math.cos(time / 211) * 7;
      night.style.transform = `translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,0) scale(1.04)`;
      for (const star of stars) {
        const alpha = .28 + .11 * Math.sin(time * star.rate + star.phase);
        ctx.fillStyle = `rgba(215,233,250,${alpha})`;
        ctx.beginPath(); ctx.arc(star.x * width + x * .25, star.y * height + y * .25, star.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    function bird(x, y, size, flap) {
      ctx.beginPath(); ctx.moveTo(x-size*2.1, y-flap);
      ctx.quadraticCurveTo(x-size*.8, y-size*.6-flap*.3, x, y+size*.18);
      ctx.quadraticCurveTo(x+size*.8, y-size*.6-flap*.3, x+size*2.1, y-flap);
      ctx.stroke();
    }
    function landscape() {
      for (const cloud of clouds) {
        const span = width + 700;
        const x = ((cloud.x + time * cloud.rate + 500) % span) - 500;
        ctx.drawImage(cloudSprite, x, cloud.y, 420 * cloud.scale, 140 * cloud.scale);
      }
      // Match the cover mapping of the landscape artwork, including portrait screens.
      const scale = Math.max(width/1600, height/1000);
      const ox = (width - 1600 * scale)/2, oy = (height - 1000 * scale)/2;
      ctx.save(); ctx.translate(ox, oy); ctx.scale(scale, scale);
      // River highlights flow downstream at different speeds and fade at both ends.
      for (let i = 0; i < 32; i++) {
        const u = (i / 32 + time * (.009 + (i % 3) * .0014)) % 1;
        const x = riverX(u), y = 635 + u * 365;
        const a = Math.sin(Math.PI*u) * .28;
        ctx.strokeStyle = `rgba(252,253,225,${a})`; ctx.lineWidth = .7 + u * .8;
        ctx.beginPath(); ctx.ellipse(x + Math.sin(i * 8.3) * u * 26, y, 2 + u * 11, .25 + u * .65, 0, 0, Math.PI); ctx.stroke();
      }
      pines.forEach(tree => {
        const gust = Math.sin(time * .19 + tree.phase) * .005 + Math.sin(time * .071 + tree.phase) * .004;
        ctx.save(); ctx.translate(tree.x, tree.y); ctx.rotate(gust);
        ctx.fillStyle = '#476e637a'; ctx.fillRect(-1.2, -tree.h, 2.4, tree.h);
        for (let j = 0; j < 11; j++) {
          const y = -tree.h + j * tree.h/12, spread = (j + 1) * tree.h * .022;
          const sway = Math.sin(time*.27+tree.phase+j*.21)*(11-j)*.18;
          ctx.beginPath();ctx.moveTo(sway,y-12);ctx.lineTo(spread+sway,y+tree.h*.09);ctx.lineTo(sway,y+tree.h*.063);ctx.lineTo(-spread+sway,y+tree.h*.09);ctx.closePath();ctx.fill();
        }
        ctx.restore();
      });
      ctx.restore();
      if (flock) {
        const t = flock.age / flock.duration;
        const travel = flock.direction > 0 ? t : 1-t;
        const x = -120 + travel * (width+240);
        const y = height * flock.y + Math.sin(t * Math.PI) * flock.arc;
        ctx.lineWidth = .9; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(57,84,88,.5)';
        flock.birds.forEach(b => {
          // Wing beats alternate with gliding; individuals never flap in lockstep.
          const glide = Math.sin(time*.14+b.phase) > .48;
          const flap = glide ? .7 : Math.sin(time*b.cadence+b.phase)*b.size;
          bird(x+b.x*flock.direction, y+b.y+Math.sin(time*.3+b.phase)*2, b.size, flap);
        });
      }
    }
    function riverX(u) { return 835 + Math.sin(u * 6.1) * (18 + u * 115) + u * 9; }
    function draw() {
      ctx.clearRect(0, 0, width, height);
      if (theme === 'dark') universe(); else landscape();
    }
    function frame(now) {
      raf = 0;
      if (document.hidden || appearance.isPaused()) return;
      const interval = width < 700 || navigator.connection?.saveData ? 1000/18 : 1000/24;
      if (now - lastFrame >= interval) {
        const dt = Math.min((now - lastFrame)/1000 || .04, .12);
        lastFrame = now; time += dt;
        if (theme === 'light') {
          if (flock) { flock.age += dt; if (flock.age > flock.duration) { flock = null; nextFlock = 35 + random()*55; } }
          else { nextFlock -= dt; if (nextFlock <= 0) spawnFlock(); }
        }
        draw();
      }
      raf = requestAnimationFrame(frame);
    }
    function refresh() {
      cancelAnimationFrame(raf); raf = 0;
      theme = appearance.getTheme();
      draw();
      if (!document.hidden && !appearance.isPaused()) { lastFrame = performance.now(); raf = requestAnimationFrame(frame); }
    }
    resize(); refresh();
    document.addEventListener('portfolio:theme', refresh);
    document.addEventListener('portfolio:motion', refresh);
    document.addEventListener('visibilitychange', refresh);
    addEventListener('resize', resize, { passive: true });
    addEventListener('pagehide', () => { cancelAnimationFrame(raf); raf = 0; });
    addEventListener('pageshow', refresh);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
