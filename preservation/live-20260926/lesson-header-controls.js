(() => {
  const sound = document.getElementById('sound-mode');
  const motion = document.getElementById('motion-mode');
  if (!sound || !motion) return;
  function sync() {
    const host = document.querySelector('.lesson-actions');
    if (!host) return;
    for (const [source, key] of [[sound, 'sound'], [motion, 'motion']]) {
      let button = host.querySelector('[data-lesson-preference="' + key + '"]');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'button';
        button.dataset.lessonPreference = key;
        button.onclick = () => { source.click(); sync(); };
        host.appendChild(button);
      }
      const label = source.getAttribute('aria-label') || source.title;
      if (button.textContent !== label) button.textContent = label;
    }
  }
  new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
  for (const source of [sound, motion])
    new MutationObserver(sync).observe(source, { attributes: true, attributeFilter: ['aria-label'] });
  sync();
})();
