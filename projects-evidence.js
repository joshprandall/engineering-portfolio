/* Project portfolio evidence browser. Enhances the index only; project artifacts remain independent. */
(() => {
  'use strict';
  const grid=document.querySelector('#project-list .project-grid');
  const controls=document.querySelector('#project-controls');
  if(!grid||!controls)return;
  const cards=[...grid.querySelectorAll('.project-card')];
  const q=document.querySelector('#project-filter');
  const status=document.querySelector('#project-filter-status');
  const buttons=[...controls.querySelectorAll('[data-project-category]')];
  let category='all';

  function normalize(s=''){return s.toLowerCase().replace(/\s+/g,' ').trim();}
  function apply(){
    const term=normalize(q?.value||'');
    let shown=0;
    cards.forEach(card=>{
      const cats=(card.dataset.category||'').split(/\s+/).filter(Boolean);
      const text=normalize(card.textContent);
      const categoryMatch=category==='all'||cats.includes(category);
      const textMatch=!term||text.includes(term);
      const visible=categoryMatch&&textMatch;
      card.hidden=!visible;if(visible)shown++;
    });
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.projectCategory===category)));
    if(status)status.textContent=shown+' of '+cards.length+' projects shown';
  }
  buttons.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.projectCategory||'all';apply();}));
  q?.addEventListener('input',apply);
  apply();

  const lenses={
    system:'Problem → architecture → failure modes → recovery evidence',
    software:'Requirements → interfaces → tests → release artifact → limitations',
    research:'Question → model → assumptions → experiment → evidence → uncertainty',
    security:'Asset → threat boundary → controlled test → mitigation → regression check',
    learning:'Concept → prerequisite → prediction → experiment → explanation → extension',
    game:'Player loop → state → presentation → inputs → performance → release QA'
  };
  const select=document.querySelector('#evidence-lens');
  const output=document.querySelector('#evidence-lens-output');
  function lens(){
    const key=select?.value||'system';
    if(output)output.textContent=lenses[key];
  }
  select?.addEventListener('change',lens);lens();
})();
