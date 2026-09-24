(() => {
  'use strict';

  // Compatibility shim retained for older cached pages. Background playback is
  // owned exclusively by site-audio.js; this file never creates an audio node.
  if (window.__JR_DARK_MUSIC_SHIM_V14__) return;
  window.__JR_DARK_MUSIC_SHIM_V14__ = true;

  const controller = () => window.SiteAudio || null;

  window.DarkThemeMusic = Object.freeze({
    play() { controller()?.sync?.(true); },
    pause() { controller()?.stop?.(); },
    sync() { controller()?.sync?.(true); },
    get element() { return controller()?.element || null; },
    get allowed() {
      const c = controller();
      return Boolean(c && c.theme === 'dark' && !c.muted && !c.suppressed);
    }
  });
})();