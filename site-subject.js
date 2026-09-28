/* Subject plans reuse library record IDs and stay local to this browser. */
(() => {
  const id = document.currentScript.dataset.domain;
  let limit = 18, selected = new Set(), domain;
  const level = document.querySelector('#subject-level'), type = document.querySelector('#subject-type');
  const list = document.querySelector('#subject-lessons'), status = document.querySelector('#subject-status');
  const more = document.querySelector('#subject-more'), save = document.querySelector('#save-subject-plan'), clear = document.querySelector('#clear-subject-plan');
  const controls = [level, type, more, save, clear];
  const retry = document.createElement('button');
  retry.type = 'button'; retry.className = 'subject-retry'; retry.textContent = 'Retry subject index'; retry.hidden = true;
  status.after(retry); status.setAttribute('role', 'status');
  function render() {
    if (!domain) return;
    const lessons = domain.lessons.filter(l => (!level.value || l.level === level.value) && (!type.value || l.type === type.value));
    list.replaceChildren(...lessons.slice(0, limit).map(l => {
      const card = document.createElement('article'); card.className = 'destination-card';
      const check = document.createElement('input'); check.type = 'checkbox'; check.checked = selected.has(l.id);
      check.addEventListener('change', () => { check.checked ? selected.add(l.id) : selected.delete(l.id); status.textContent = `${lessons.length} matching records. ${selected.size} selected; save to keep this plan.`; });
      const label = document.createElement('label'); label.append(check, ' Add to my plan');
      const a = document.createElement('a'); a.href = 'lesson.html?lesson=' + encodeURIComponent(l.id); a.textContent = l.title;
      const p = document.createElement('p'); p.textContent = [l.level, l.type, l.category].filter(Boolean).join(' · ');
      card.append(a, p, label); return card;
    }));
    status.textContent = `${lessons.length} matching records. ${selected.size} selected.`;
    more.hidden = limit >= lessons.length;
  }
  async function load() {
    controls.forEach(el => el.disabled = true); retry.hidden = true; status.textContent = 'Loading subject records…';
    try {
      const response = await fetch('assets/site-subjects.json');
      if (!response.ok) throw Error('Subject index response');
      const data = await response.json(); domain = data.domains.find(d => d.id === id);
      if (!domain || !Array.isArray(domain.lessons)) throw Error('Subject missing');
      try { const stored = JSON.parse(localStorage.getItem('jr-subject-plan-' + id) || '[]'); if (Array.isArray(stored)) selected = new Set(stored); } catch {}
      for (const [el, key] of [[level, 'level'], [type, 'type']]) {
        while (el.options.length > 1) el.remove(1);
        for (const value of [...new Set(domain.lessons.map(l => l[key]))].filter(Boolean).sort()) {
          const option = document.createElement('option'); option.value = value; option.textContent = value; el.append(option);
        }
      }
      controls.forEach(el => el.disabled = false); render();
    } catch { domain = null; status.textContent = 'Subject index unavailable. Retry or use the browse links below.'; retry.hidden = false; }
  }
  retry.onclick = load;
  for (const el of [level, type]) el.addEventListener('change', () => { limit = 18; render(); });
  more.onclick = () => { limit += 18; render(); };
  save.onclick = () => {
    try { localStorage.setItem('jr-subject-plan-' + id, JSON.stringify([...selected])); status.textContent = `Saved ${selected.size} lessons in this browser. No account synchronization.`; }
    catch { status.textContent = 'Storage unavailable. Your selections remain for this visit.'; }
  };
  clear.onclick = () => {
    selected.clear(); let failed = false;
    try { localStorage.removeItem('jr-subject-plan-' + id); } catch { failed = true; }
    render(); if (failed) status.textContent = 'Selection cleared for this visit. Saved storage could not be changed.';
  };
  load();
})();
