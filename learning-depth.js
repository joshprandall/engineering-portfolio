/* Progressive learning-depth navigator for the Knowledge Platform. */
(() => {
  'use strict';
  const D=window.JR_KNOWLEDGE;if(!D)return;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const STORE={depth:'jr-knowledge-depth-target-v1',domain:'jr-knowledge-plan-domain-v1',start:'jr-knowledge-start-point-v1',goal:'jr-knowledge-goal-v1'};
  const depths=[
    {id:'orientation',n:'00',title:'Orientation',short:'What is this?',copy:'Plain-language map, vocabulary, and why the subject matters.',difficulty:'Foundation'},
    {id:'foundation',n:'01',title:'Foundations',short:'First principles',copy:'Core definitions, mental models, prerequisites, and simple checks.',difficulty:'Foundation'},
    {id:'core',n:'02',title:'Core',short:'Mechanisms',copy:'How the system works, not just what commands or formulas look like.',difficulty:'Intermediate'},
    {id:'applied',n:'03',title:'Applied',short:'Build + troubleshoot',copy:'Labs, failure modes, scenarios, debugging, and practical decisions.',difficulty:'Intermediate'},
    {id:'undergraduate',n:'04',title:'Undergraduate',short:'Rigorous theory',copy:'Formal models, derivations, quantitative reasoning, and larger projects.',difficulty:'Intermediate'},
    {id:'advanced',n:'05',title:'Advanced',short:'Specialization',copy:'Architecture, performance, edge cases, integration, and deep technical tradeoffs.',difficulty:'Advanced'},
    {id:'graduate',n:'06',title:'Graduate bridge',short:'Methods + papers',copy:'Assumptions, primary literature, reproducibility, and competing approaches.',difficulty:'Advanced'},
    {id:'research',n:'07',title:'Doctoral / Research',short:'Create new knowledge',copy:'Primary literature, open problems, experimental design, replication, and original questions.',difficulty:'Advanced'}
  ];
  const depthById=new Map(depths.map(x=>[x.id,x]));
  const safeGet=(key,fallback)=>{try{return localStorage.getItem(key)||fallback}catch{return fallback}};
  const safeSet=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
  let target=depthById.has(safeGet(STORE.depth,''))?safeGet(STORE.depth,'foundation'):'foundation';
  let planDomain=safeGet(STORE.domain,D.domains[0]?.id||'cloud');
  let start=safeGet(STORE.start,'new');
  let goal=safeGet(STORE.goal,'understand');
  const depthIndex=id=>Math.max(0,depths.findIndex(x=>x.id===id));
  const desiredPathLevel=()=>depthIndex(target)<=1?'Foundation':depthIndex(target)<=4?'Intermediate':'Advanced';
  function targetCopy(){
    const d=depthById.get(target)||depths[1];
    const higher=depthIndex(target)>=6;
    return `<strong>${esc(d.title)}</strong> · ${esc(d.copy)}${higher?' Current verified lessons remain labeled Foundation / Intermediate / Advanced; higher academic stages are treated as a study target until explicitly authored and reviewed.':''}`;
  }
  function counts(){
    const levels={Foundation:0,Intermediate:0,Advanced:0};
    const kinds={Lab:0,'Quick Concept':0,Lesson:0};
    D.lessons.forEach(l=>{if(l.difficulty in levels)levels[l.difficulty]++;if(l.kind in kinds)kinds[l.kind]++});
    return {levels,kinds};
  }
  function setTarget(id){if(!depthById.has(id))return;target=id;safeSet(STORE.depth,id);renderState();}
  function renderState(){
    $$('[data-depth-stage]').forEach(b=>{const active=b.dataset.depthStage===target;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
    $$('[data-depth-target-select]').forEach(s=>s.value=target);
    $$('[data-depth-summary]').forEach(el=>el.innerHTML=targetCopy());
  }
  function scorePath(p){
    let score=0;const text=`${p.title} ${p.description||p.summary||''}`.toLowerCase();
    if(p.domain===planDomain)score+=80;
    const desired=desiredPathLevel8);const level=String(p.level||p.difficulty||'');
    if(level.includes(desired))score+=32;
    if(start==='new'&&level.includes('Foundation'))score+=22;
    if(start==='some'&&(level.includes('Foundation')||level.includes('Intermediate')))score+=15;
    if(start==='practitioner'&&(level.includes('Intermediate')||level.includes('Advanced')))score+=18;
    if(start==='advanced'&&level.includes('Advanced'))score+=24;
    const words={understand:['foundation','core','concept','fundamentals'],build:['lab','build','engineering','software','systems','project'],troubleshoot:['reliable','security','systems','operations','network','recovery'],research:['quantum','advanced','physics','math','hpc','architecture']};
    (words[goal]||[]).forEach(w=>{if(text.includes(w))score+=8});
    score+=Math.min(12,(p.lesson_ids||[]).length);
    return score;
  }
  function bestPath(){return [...D.paths].sort((a,b)=>scorePath(b)-scorePath(a))[0]||D.paths[0]}
  function buildRoute(){
    const p=bestPath();if(!p)return;
    safeSet(STORE.domain,planDomain);safeSet(STORE.start,start);safeSet(STORE.goal,goal);safeSet(STORE.depth,target);
    const u=new URL('learn-paths.html',location.href);u.searchParams.set('path',p.id);u.searchParams.set('targetDepth',target);location.href=u.href;
  }
  function homeSection(){
    const stat=$('.stat-band');if(!stat||$('#learning-depth'))return;
    const c=counts(),section=document.createElement('section');section.id='learning-depth';section.className='depth-system';
    section.innerHTML=`<div class="shell"><div class="depth-heading"><div><p class="eyebrow">PROGRESSIVE MASTERY / BEGINNER → RESEARCH</p><h2>Choose how far you want to go.</h2><p>One subject can begin with intuition and continue through practical engineering, formal theory, graduate-style paper reading, and research questions. The system keeps those stages connected instead of turning them into separate courses.</p></div><div class="depth-coverage"><span><b>${c.levels.Foundation.toLocaleString()}</b> Foundation</span><span><b>${c.levels.Intermediate.toLocaleString()}</b> Intermediate</span><span><b>${c.levels.Advanced.toLocaleString()}</b> Advanced</span><span><b>${c.kinds.Lab.toLocaleString()}</b> Labs</span></div></div><div class="depth-ladder" role="group" aria-label="Target learning depth">${depths.map(d=>`<button type="button" data-depth-stage="${d.id}" aria-pressed="false"><span>${d.n}</span><strong>${esc(d.title)}</strong><small>${esc(d.short)}</small><p>${esc(d.copy)}</p></button>`).join('')}</div><div class="depth-planner"><div class="depth-planner-copy"><p class="eyebrow">BUILD A ROUTE</p><h3>Start where you are. Set where you want to finish.</h3><p data-depth-summary>${targetCopy()}</p></div><div class="depth-controls"><label>Subject<select data-plan-domain>${D.domains.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select></label><label>Starting point<select data-plan-start><option value="new">New to the subject</option><option value="some">Some background</option><option value="practitioner">Working / practical experience</option><option value="advanced">Advanced background</option></select></label><label>Goal<select data-plan-goal><option value="understand">Understand deeply</option><option value="build">Build / implement</option><option value="troubleshoot">Troubleshoot / operate</option><option value="research">Research / extend</option></select></label><label>Target depth<select data-depth-target-select>${depths.map(d=>`<option value="${d.id}">${esc(d.title)}</option>`).join('')}</select></label><button class="button primary" type="button" data-build-route>Build my learning route →</button></div></div><div class="depth-integrity"><strong>Academic-depth rule</strong><p>The ladder is the platform architecture, not a marketing label. Existing lessons keep their verified Foundation, Intermediate, or Advanced difficulty. Graduate, doctoral, and research labels are only attached to content when the mathematics, source literature, methodology, and assessment actually support that claim.</p></div></div>`;
    stat.insertAdjacentElement('afterend',section);bind(section);renderState();
  }
  function contextBar(){
    if((document.body.dataset.libraryPage||'home')==='home'||$('#depth-context'))return;
    const nav=$('.learn-page-nav');if(!nav)return;
    const bar=document.createElement('section');bar.id='depth-context';bar.className='depth-context shell';
    bar.innerHTML=`<div><span class="eyebrow">TARGET DEPTH</span><strong>${esc((depthById.get(target)||depths[1]).title)}</strong><p data-depth-summary>${targetCopy()}</p></div><label>Change target<select data-depth-target-select>${depths.map(d=>`<option value="${d.id}">${esc(d.title)}</option>`).join('')}</select></label><a class="button" href="learn.html#learning-depth">Edit learning plan →</a>`;
    nav.insertAdjacentElement('afterend',bar);bind(bar);renderState();
  }
  function bind(root){
    $$('[data-depth-stage]',root).forEach(b=>b.addEventListener('click',()=>setTarget(b.dataset.depthStage)));
    $$('[data-depth-target-select]',root).forEach(s=>s.addEventListener('change',()=>setTarget(s.value)));
    const domain=$('[data-plan-domain]',root),startEl=$('[data-plan-start]',root),goalEl=$('[data-plan-goal]',root);
    if(domain){domain.value=D.domains.some(d=>d.id===planDomain)?planDomain:D.domains[0].id;domain.onchange=()=>planDomain=domain.value}
    if(startEl){startEl.value=start;startEl.onchange=()=>start=startEl.value}
    if(goalEl){goalEl.value=goal;goalEl.onchange=()=>goal=goalEl.value}
    $('[data-build-route]',root)?.addEventListener('click',buildRoute);
  }
  homeSection();contextBar();
})();
