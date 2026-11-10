(() => {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const relevant = page === 'projects.html' || page === 'play-evil-wizard.html' || page.startsWith('project-');
  if (!relevant || document.documentElement.dataset.projectMasteryLoaded) return;
  document.documentElement.dataset.projectMasteryLoaded = 'true';

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'project-mastery.css?v=20261109-v1';
  css.dataset.projectMastery = 'style';
  document.head.append(css);

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const list = (items, ordered = false) => {
    const tag = ordered ? 'ol' : 'ul';
    return '<' + tag + '>' + (items || []).map(item => '<li>' + esc(item) + '</li>').join('') + '</' + tag + '>';
  };

  const familyLabel = (family) => ({
    established: 'Established portfolio',
    advanced: 'Advanced systems / network engineering',
    software: 'Software engineering'
  }[family] || family || 'Engineering');

  const collectEvidenceLinks = () => {
    const seen = new Set();
    const explicit = [];
    if (document.querySelector('.showcase-lab[data-showcase-lab]')) {
      explicit.push({ href: 'project-showcase.js', text: 'Inspect advanced-systems lab implementation' });
    }
    if (document.querySelector('.showcase-lab[data-software-lab]')) {
      explicit.push({ href: 'software-showcase.js', text: 'Inspect software-engineering lab implementation' });
    }
    return [
      ...explicit,
      ...[...document.querySelectorAll('a[href]')]
        .map(a => ({ href: a.getAttribute('href') || '', text: (a.textContent || '').replace(/\s+/g,' ').trim() }))
        .filter(({href,text}) => /github|source|download|archive|methods|working lab|interactive|play|documentation|validation|notebook/i.test(href + ' ' + text))
    ]
      .filter(({href}) => href && !href.startsWith('#') && !seen.has(href) && seen.add(href))
      .slice(0, 8);
  };

  function enhanceCards(projects) {
    document.querySelectorAll('.project-card').forEach(card => {
      if (card.querySelector('.project-eval-card-badges')) return;
      const a = [...card.querySelectorAll('a[href]')].find(link => {
        const href = (link.getAttribute('href') || '').split(/[?#]/)[0].split('/').pop();
        return href && projects[href];
      });
      if (!a) return;
      const href = (a.getAttribute('href') || '').split(/[?#]/)[0].split('/').pop();
      const meta = projects[href];
      const holder = document.createElement('div');
      holder.className = 'project-eval-card-badges';
      holder.innerHTML =
        '<span class="project-eval-badge">' + esc(familyLabel(meta.family)) + '</span>' +
        '<span class="project-eval-badge evidence">' + esc(meta.posture) + '</span>';
      const bottom = card.querySelector('.card-bottom');
      if (bottom) card.insertBefore(holder, bottom);
      else card.append(holder);
    });
  }

  function renderOverview(data) {
    if (document.querySelector('.project-eval-overview')) return;
    const projects = data.projects || {};
    const values = Object.values(projects);
    const counts = values.reduce((acc, p) => {
      acc[p.family] = (acc[p.family] || 0) + 1;
      return acc;
    }, {});
    const section = document.createElement('section');
    section.className = 'wrap project-eval-overview';
    section.setAttribute('aria-labelledby', 'evaluation-standard-title');
    section.innerHTML = `
      <p class="eyebrow">EVALUATION STANDARD / EVIDENCE FIRST</p>
      <h2 id="evaluation-standard-title">Every project is presented as an engineering claim that must be inspectable.</h2>
      <p class="lead">The portfolio separates implemented behavior from aspiration. Source-backed tools, working browser labs, playable builds, coursework artifacts, and research models are labeled by what they actually prove—not by how polished the page looks.</p>
      <div class="project-eval-stats">
        <div class="project-eval-stat"><span>Projects</span><strong>${values.length}</strong></div>
        <div class="project-eval-stat"><span>Established</span><strong>${counts.established || 0}</strong></div>
        <div class="project-eval-stat"><span>Advanced systems</span><strong>${counts.advanced || 0}</strong></div>
        <div class="project-eval-stat"><span>Software engineering</span><strong>${counts.software || 0}</strong></div>
      </div>
      <div class="project-eval-standard">
        <article><h3>1. Problem & constraints</h3><p>What engineering problem exists, and which constraints make the problem non-trivial?</p></article>
        <article><h3>2. Architecture & decisions</h3><p>How is the system decomposed, and which tradeoffs or invariants drive the design?</p></article>
        <article><h3>3. Verification & reproduction</h3><p>What can an evaluator run, inspect, recompute, or compare independently?</p></article>
        <article><h3>4. Limits & non-claims</h3><p>What has not been demonstrated, and what evidence would be required to extend the claim?</p></article>
      </div>`;
    const hero = document.querySelector('.projects-hero');
    if (hero) hero.after(section);
    enhanceCards(projects);
  }

  function renderDossier(meta) {
    if (!meta || document.querySelector('.project-evaluation-dossier')) return;
    const section = document.createElement('section');
    section.className = 'wrap project-evaluation-dossier';
    section.setAttribute('aria-labelledby', 'project-evaluation-title');

    const evidenceLinks = collectEvidenceLinks();
    const linksHtml = evidenceLinks.length
      ? '<div class="project-eval-evidence-links">' + evidenceLinks.map(link =>
          '<a href="' + esc(link.href) + '">' + esc(link.text || link.href) + '</a>'
        ).join('') + '</div>'
      : '<p class="project-eval-no-links">This page is the primary interactive artifact; additional source/evidence links are not exposed on this surface.</p>';

    section.innerHTML = `
      <div class="project-eval-head">
        <div>
          <p class="eyebrow">TECHNICAL EVALUATION DOSSIER</p>
          <h2 id="project-evaluation-title">How to evaluate ${esc(meta.title)}.</h2>
          <p class="lead">${esc(meta.problem)}</p>
        </div>
        <div class="project-eval-meta">
          <div><span>Implementation posture</span><strong>${esc(meta.posture)}</strong></div>
          <div><span>Evidence base</span><strong>${esc(meta.evidence)}</strong></div>
          <div><span>Portfolio family</span><strong>${esc(familyLabel(meta.family))}</strong></div>
        </div>
      </div>

      <div class="project-eval-grid">
        <article class="project-eval-card">
          <span class="project-eval-label">CONSTRAINTS / INVARIANTS</span>
          <h3>What the design must preserve.</h3>
          ${list(meta.constraints)}
        </article>
        <article class="project-eval-card">
          <span class="project-eval-label">ARCHITECTURE / DECISIONS</span>
          <h3>How the system is structured.</h3>
          ${list(meta.architecture)}
        </article>
        <article class="project-eval-card">
          <span class="project-eval-label">VERIFICATION / EVIDENCE</span>
          <h3>What has actually been checked.</h3>
          ${list(meta.verification)}
        </article>
        <article class="project-eval-card">
          <span class="project-eval-label">REPRODUCIBILITY</span>
          <h3>A reviewer can follow this path.</h3>
          ${list(meta.reproduce, true)}
        </article>
      </div>

      <div class="project-eval-boundary">
        <strong>Claim boundary</strong>
        <span>${esc(meta.limitations)}</span>
      </div>

      <div class="project-eval-signals" aria-label="Competency signals">
        ${(meta.signals || []).map(signal => '<span>' + esc(signal) + '</span>').join('')}
      </div>

      <div class="project-eval-evidence">
        <h3>Direct evidence and implementation links</h3>
        ${linksHtml}
      </div>`;

    const hero = document.querySelector('main .projects-hero, main .game-project, main .showcase-hero, main > section:first-of-type');
    if (hero) hero.after(section);
    else document.querySelector('main')?.prepend(section);
  }

  fetch('assets/project-evaluation.json?v=20261109-v1', { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error('Project evaluation metadata unavailable');
      return response.json();
    })
    .then(data => {
      if (page === 'projects.html') renderOverview(data);
      else renderDossier((data.projects || {})[page]);
    })
    .catch(error => console.error('[project-mastery]', error));
})();