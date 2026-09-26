(() => {
  'use strict';

  if (window.__JR_HEADER_SOUND_CONTROL_V25__) return;
  window.__JR_HEADER_SOUND_CONTROL_V25__ = true;

  const MUTE_KEY = 'jr-site-ambient-muted-v3';
  const VOLUME_KEY = 'jr-site-ambient-volume-v2';
  const DEFAULT_VOLUME = 0.05;
  const MAX_VOLUME = 0.10;
  const SCRIPT_URL = new URL(document.currentScript?.src || location.href, location.href);
  const SITE_BASE = new URL('./', SCRIPT_URL);

  const clampVolume = value => Math.min(MAX_VOLUME, Math.max(0, Number(value) || 0));

  function storedVolume() {
    try {
      const saved = Number(localStorage.getItem(VOLUME_KEY));
      if (Number.isFinite(saved)) return clampVolume(saved);
    } catch (_) {}
    return DEFAULT_VOLUME;
  }

  function isMuted() {
    try { return localStorage.getItem(MUTE_KEY) === '1'; }
    catch (_) { return false; }
  }

  function storeMuted(value) {
    try { localStorage.setItem(MUTE_KEY, value ? '1' : '0'); }
    catch (_) {}
  }

  function storeVolume(value) {
    const next = clampVolume(value);
    try { localStorage.setItem(VOLUME_KEY, String(next)); }
    catch (_) {}
    try { window.SiteAudio?.setVolume?.(next); }
    catch (_) {}
    return next;
  }

  function ensureAudioController(onReady) {
    if (window.SiteAudio) {
      onReady?.();
      return;
    }

    let script = document.getElementById('jr-site-audio-controller');
    if (!script) {
      script = document.createElement('script');
      script.id = 'jr-site-audio-controller';
      script.src = new URL('site-audio.js?v=20260925-main-autoplay-v26', SITE_BASE).href;
      script.async = false;
      (document.head || document.documentElement).appendChild(script);
    }

    if (onReady) {
      script.addEventListener('load', onReady, { once: true });
    }
  }

  function boot() {
    const headerTools = document.querySelector('header .tools');
    if (!headerTools) return;

    const themeButton = headerTools.querySelector('[data-theme-toggle], #theme');

    // If site-scenes.js already built the complete control, keep it and simply
    // make sure it sits beside the Day/Night button.
    let wrapper = headerTools.querySelector('.scene-sound-control');
    if (!wrapper) {
      const existingComplete = [...document.querySelectorAll('.scene-sound-control')]
        .find(node => node.querySelector('[data-scene-audio]') && node.querySelector('.scene-sound-panel'));

      if (existingComplete) {
        wrapper = existingComplete;
        headerTools.insertBefore(wrapper, themeButton || headerTools.lastElementChild);
        ensureAudioController(() => {
          try { window.SiteAudio?.sync?.(true); } catch (_) {}
        });
        return;
      }
    }

    if (wrapper?.querySelector('.scene-sound-panel')) {
      ensureAudioController(() => {
        try { window.SiteAudio?.sync?.(true); } catch (_) {}
      });
      return;
    }

    // Build an independent header control. This is intentionally separate from
    // the animated scene code so a canvas/video failure can never remove audio UI.
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'scene-sound-control';
      headerTools.insertBefore(wrapper, themeButton || headerTools.lastElementChild);
    }

    let button = wrapper.querySelector('[data-scene-audio]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('data-scene-audio', '');
      wrapper.appendChild(button);
    }

    const panel = document.createElement('div');
    panel.className = 'scene-sound-panel';
    panel.hidden = true;
    panel.innerHTML =
      '<label><span>Ambient sound</span><output>5%</output></label>' +
      '<input type="range" min="0" max="10" step="0.5" value="5" aria-label="Ambient sound volume, zero to ten percent">' +
      '<button type="button" class="scene-sound-mute">Mute</button>';
    wrapper.appendChild(panel);

    const slider = panel.querySelector('input[type="range"]');
    const output = panel.querySelector('output');
    const muteButton = panel.querySelector('.scene-sound-mute');

    function render() {
      const muted = isMuted();
      const volume = storedVolume();
      const pct = Math.round(volume * 1000) / 10;

      slider.value = String(pct);
      output.textContent = muted ? 'Muted' : (pct === 0 ? 'Off' : pct.toFixed(pct % 1 ? 1 : 0) + '%');
      muteButton.textContent = muted ? 'Unmute' : 'Mute';

      button.type = 'button';
      button.setAttribute('aria-label', 'Background sound control');
      button.setAttribute('aria-expanded', String(!panel.hidden));
      button.setAttribute('aria-pressed', String(!muted && pct > 0));
      button.title = window.SiteAudio?.autoplayBlocked ? 'Background sound — tap to start' : 'Background sound';
      button.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4z"></path><path d="M17 9c1 1 1 5 0 6"></path><path d="M19 7c2 2 2 8 0 10"></path></svg>' +
        '<span>Sound</span>';
    }

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      panel.hidden = !panel.hidden;
      render();
    });

    slider.addEventListener('input', event => {
      event.stopPropagation();
      const pct = Math.min(10, Math.max(0, Number(event.currentTarget.value) || 0));
      const value = storeVolume(pct / 100);

      if (value > 0 && isMuted()) storeMuted(false);

      ensureAudioController(() => {
        try {
          window.SiteAudio?.setVolume?.(value);
          window.SiteAudio?.sync?.(true);
        } catch (_) {}
      });

      render();
    });

    muteButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      const nextMuted = !isMuted();
      storeMuted(nextMuted);

      if (!nextMuted && storedVolume() <= 0) {
        storeVolume(DEFAULT_VOLUME);
      }

      ensureAudioController(() => {
        try { window.SiteAudio?.sync?.(true); } catch (_) {}
      });

      render();
    });

    document.addEventListener('click', event => {
      if (panel.hidden) return;
      if (event.target instanceof Node && wrapper.contains(event.target)) return;
      panel.hidden = true;
      render();
    });

    document.addEventListener('portfolio:ambient-volume', render);
    document.addEventListener('portfolio:ambient-autoplay', render);
    document.addEventListener('portfolio:theme', () => {
      ensureAudioController(() => {
        try { window.SiteAudio?.sync?.(true); } catch (_) {}
      });
      render();
    });

    addEventListener('storage', event => {
      if (event.key === MUTE_KEY || event.key === VOLUME_KEY) render();
    });

    render();
    ensureAudioController(() => {
      try {
        window.SiteAudio?.setVolume?.(storedVolume());
        window.SiteAudio?.sync?.(true);
      } catch (_) {}
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();