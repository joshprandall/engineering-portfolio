/* Shared appearance preference. Load before styles so navigation never flashes the wrong theme. */
(() => {
  'use strict';
  if (window.PortfolioTheme) return;
  const root = document.documentElement;
  const THEME_KEY = 'jr-site-theme';
  const MOTION_KEY = 'jr-site-motion';
  const legacyThemes = ['portfolio-theme', 'jr-knowledge-theme', 'jr-geometry-theme'];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const read = key => { try { const value = localStorage.getItem(key); if (value !== null) return value; } catch {} try { return sessionStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { try { sessionStorage.setItem(key, value); } catch {} } };
  const validTheme = value => value === 'dark' || value === 'light';
  const initialKey = /\/learn(?:[-.]|$)/.test(location.pathname) ? 'jr-knowledge-theme' : /\/geometric-lab\//.test(location.pathname) ? 'jr-geometry-theme' : 'portfolio-theme';
  let theme = read(THEME_KEY);
  if (!validTheme(theme)) theme = [read(initialKey), ...legacyThemes.map(read)].find(validTheme) || 'dark';
  let motion = read(MOTION_KEY) === 'paused' ? 'paused' : 'running';
  const isPaused = () => motion === 'paused' || reduced.matches;
  const icons = {
    dark: '<path d="M20.5 13.4A8.7 8.7 0 0 1 10.6 3.5 8.8 8.8 0 1 0 20.5 13.4Z"/><path d="m17 3 .5 1.5L19 5l-1.5.5L17 7l-.5-1.5L15 5l1.5-.5Z"/>',
    light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
  };
  function renderControls() {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.classList.add('appearance-toggle');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(theme === 'light'));
      button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      button.title = theme === 'dark' ? 'Night · switch to Day' : 'Day · switch to Night';
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[theme]}</svg><span>${theme === 'dark' ? 'Night' : 'Day'}</span>`;
    });
    document.querySelectorAll('button[data-scene-motion]').forEach(button => {
      button.type = 'button';
      button.setAttribute('aria-pressed', String(isPaused()));
      button.setAttribute('aria-label', isPaused() ? 'Resume animations' : 'Pause animations');
      if (button.id === 'motion-mode') {
        button.textContent = isPaused() ? '▶' : '◫';
        button.title = isPaused() ? 'Resume motion' : 'Pause motion';
      } else button.textContent = isPaused() ? 'Resume motion' : 'Pause motion';
    });
  }
  function syncDocument() {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    root.dataset.sceneMotion = isPaused() ? 'paused' : 'running';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101416' : '#eef2ed');
    if (document.body) {
      document.body.dataset.motion = isPaused() ? 'paused' : 'running';
      document.body.classList.toggle('motion-paused', isPaused());
    }
    renderControls();
  }
  function setTheme(value, persist = true) {
    if (!validTheme(value)) return;
    theme = value;
    if (persist) {
      write(THEME_KEY, theme);
      legacyThemes.forEach(key => write(key, theme));
      write('portfolio-theme-default-20260923', '1');
    }
    syncDocument();
    document.dispatchEvent(new CustomEvent('portfolio:theme', { detail: { theme } }));
  }
  function setMotion(value, persist = true) {
    motion = value === 'paused' ? 'paused' : 'running';
    if (persist) {
      write(MOTION_KEY, motion);
      write('jr-knowledge-motion', isPaused() ? 'paused' : 'active');
    }
    syncDocument();
    document.dispatchEvent(new CustomEvent('portfolio:motion', { detail: { paused: isPaused() } }));
  }
  function bind(rootNode = document) {
    rootNode.querySelectorAll('[data-theme-toggle]').forEach(button => {
      if (button.dataset.appearanceBound) return;
      button.dataset.appearanceBound = 'true';
      button.addEventListener('click', () => setTheme(theme === 'dark' ? 'light' : 'dark'));
    });
    rootNode.querySelectorAll('button[data-scene-motion]').forEach(button => {
      button.hidden = false; button.removeAttribute('aria-hidden'); button.tabIndex = 0;
      if (!button.dataset.motionBound) { button.dataset.motionBound='true'; button.addEventListener('click',()=>setMotion(motion==='paused'?'running':'paused')); }
    });
    syncDocument();
  }
  window.PortfolioTheme = Object.freeze({ setTheme, setMotion, bind, isPaused, getTheme: () => theme });
  setTheme(theme);
  const ready = () => { bind(); setMotion(motion, false); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
  addEventListener('storage', event => {
    if (event.key === THEME_KEY && validTheme(event.newValue)) setTheme(event.newValue, false);
    if (event.key === MOTION_KEY) setMotion(event.newValue, false);
  });
  addEventListener('pageshow', () => {
    const stored = read(THEME_KEY);
    if (validTheme(stored) && stored !== theme) setTheme(stored, false);
    setMotion(read(MOTION_KEY), false);
  });
  reduced.addEventListener?.('change', () => setMotion(motion, false));
})();
