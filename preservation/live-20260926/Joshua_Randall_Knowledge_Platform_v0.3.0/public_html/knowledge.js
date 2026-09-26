(() => {
  'use strict';
  const D = window.JR_KNOWLEDGE;
  if (!D) return;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const lessonMap = new Map(D.lessons.map(x => [x.id, x]));
  const domainMap = new Map(D.domains.map(x => [x.id, x]));
  const STORAGE = {
    saved:'jr-knowledge-saved', complete:'jr-knowledge-complete', theme:'jr-knowledge-theme',
    sound:'jr-knowledge-sound', motion:'jr-knowledge-motion', recent:'jr-knowledge-recent',
    focus:'jr-knowledge-focus', narrationRate:'jr-knowledge-narration-rate'
  };
  const loadSet = key => { try { return new Set(JSON.parse(localStorage.getItem(key)||'[]')); } catch { return new Set(); } };
  const saveSet = (key, set) => localStorage.setItem(key, JSON.stringify([...set]));

  let saved = loadSet(STORAGE.saved);
  let completed = loadSet(STORAGE.complete);
  let displayLimit = 18;
  let currentLesson = null;
  let speechState = 'idle';
  let currentUtterance = null;
  let audioCtx = null;
  let soundMode = localStorage.getItem(STORAGE.sound) || 'off';
  let motionPaused = localStorage.getItem(STORAGE.motion) === 'paused';
  let curriculumDomain = 'cloud';
  let glossaryLetter = 'all';
  let graphSelection = 'cloud';
  let focusReading = localStorage.getItem(STORAGE.focus) === 'on';

  function toast(msg){
    const t=$('#toast'); t.textContent=msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),2200);
  }
  function ping(freq=520,duration=.06,volume=.025){
    if(soundMode==='off') return;
    try{
      audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
      const o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.frequency.value=freq; o.type='sine'; g.gain.value=volume;
      o.connect(g).connect(audioCtx.destination); o.start();
      g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);
      o.stop(audioCtx.currentTime+duration);
    }catch{}
  }
  function explicitTone(freq=440,duration=.22,volume=.025){
    try{
      audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended') audioCtx.resume();
      const o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.frequency.value=freq; o.type='sine'; g.gain.setValueAtTime(volume,audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);
      o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+duration);
    }catch{}
  }

  function initPrefs(){
    const theme = localStorage.getItem(STORAGE.theme) || 'dark';
    document.documentElement.dataset.theme = theme;
    document.body.classList.toggle('motion-paused',motionPaused);
    updateSoundButton();
    $('#motion-mode').textContent = motionPaused ? '▶' : '◫';
    $('#motion-mode').setAttribute('aria-label', motionPaused ? 'Resume animation' : 'Pause animation');
  }
  function updateSoundButton(){
    const b=$('#sound-mode');
    const map={off:['◖×','Sound mode: off'],educational:['◖)','Sound mode: educational'],full:['◖))','Sound mode: full']};
    b.textContent=map[soundMode][0]; b.setAttribute('aria-label',map[soundMode][1]); b.title=map[soundMode][1];
  }

  function renderStats(){
    $('#published-count').textContent=D.lessons.length.toLocaleString();
    $('#atlas-count').textContent=Object.values(D.atlas).reduce((a,b)=>a+b.length,0).toLocaleString();
    $('#path-count').textContent=D.paths.length;
    $('#glossary-count').textContent=(D.glossary||[]).length.toLocaleString();
  }
  function publishedForDomain(id){return D.lessons.filter(l=>l.domain===id).length}
  function renderDomains(){
    $('#domain-grid').innerHTML=D.domains.map((d,i)=>{
      const wide = i===5 ? ' wide' : '';
      return `<article class="domain-card${wide}" tabindex="0" role="button" data-domain="${esc(d.id)}" aria-label="Explore ${esc(d.name)}">
        <div class="domain-icon">${esc(d.icon)}</div><p class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(d.categories[0])}</p>
        <h3>${esc(d.name)}</h3><p>${esc(d.short)}</p>
        <div class="domain-meta"><span>${publishedForDomain(d.id)} published</span><span>Target ${esc(d.target)} ↗</span></div></article>`;
    }).join('');
    $$('.domain-card').forEach(card=>{
      const go=()=>{ $('#domain-filter').value=card.dataset.domain; displayLimit=18; renderLessons(); $('#discover').scrollIntoView({behavior:motionPaused?'auto':'smooth'}); };
      card.addEventListener('click',go); card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
    });
  }
  function renderFilters(){
    $('#domain-filter').insertAdjacentHTML('beforeend',D.domains.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join(''));
  }

  function renderContinue(){
    const id=localStorage.getItem(STORAGE.recent), l=lessonMap.get(id), box=$('#continue-learning');
    if(!l){box.hidden=true;return}
    const d=domainMap.get(l.domain); box.hidden=false;
    $('#continue-title').textContent=l.title;
    $('#continue-copy').textContent=`${d.name} · ${l.category} · ${l.minutes} min · stored only in this browser.`;
    $('#continue-button').onclick=()=>openLesson(l.id);
    $('#clear-history').onclick=()=>{localStorage.removeItem(STORAGE.recent);box.hidden=true;toast('Recent lesson cleared')};
  }

  function renderCurriculum(){
    const tabs=$('#curriculum-tabs'), panel=$('#curriculum-panel');
    if(!tabs||!panel)return;
    tabs.innerHTML=D.domains.map(d=>`<button type="button" role="tab" aria-selected="${d.id===curriculumDomain}" class="${d.id===curriculumDomain?'active':''}" data-curriculum-domain="${esc(d.id)}"><span>${esc(d.icon)}</span>${esc(d.name)}</button>`).join('');
    const d=domainMap.get(curriculumDomain)||D.domains[0], published=D.lessons.filter(l=>l.domain===d.id);
    panel.innerHTML=`<div class="curriculum-summary"><div><p class="eyebrow">${esc(d.name)}</p><h3>${published.length} published · ${(D.atlas[d.id]||[]).length} mapped next</h3></div><span>Target ${esc(d.target)}</span></div>
      <div class="curriculum-categories">${d.categories.map((cat,i)=>{const items=published.filter(l=>l.category===cat);return `<article class="curriculum-category"><div class="curriculum-number">${String(i+1).padStart(2,'0')}</div><div><h4>${esc(cat)}</h4><p>${items.length?`${items.length} published learning object${items.length===1?'':'s'}`:'Curriculum mapped; publication pending.'}</p>${items.length?`<div class="curriculum-links">${items.slice(0,4).map(l=>`<button data-open-curriculum="${esc(l.id)}">${esc(l.title)}</button>`).join('')}</div>`:''}<button class="text-button" data-browse-category="${esc(cat)}" data-browse-domain="${esc(d.id)}">Browse ${esc(cat)} ↗</button></div></article>`}).join('')}</div>`;
    $$('[data-curriculum-domain]').forEach(b=>b.onclick=()=>{curriculumDomain=b.dataset.curriculumDomain;renderCurriculum();ping(420,.04,.012)});
    $$('[data-open-curriculum]').forEach(b=>b.onclick=()=>openLesson(b.dataset.openCurriculum));
    $$('[data-browse-category]').forEach(b=>b.onclick=()=>{
      $('#domain-filter').value=b.dataset.browseDomain; $('#knowledge-search').value=b.dataset.browseCategory; displayLimit=18; renderLessons();
      $('#discover').scrollIntoView({behavior:motionPaused?'auto':'smooth'});
    });
  }

  const SEARCH_ALIASES={
    ad:['active directory'],aad:['entra','active directory'],entra:['azure ad','identity'],
    auth:['authentication','authorization'],iam:['identity','access'],mfa:['multi factor','multifactor'],
    vm:['virtual machine','virtual memory'],k8s:['kubernetes'],ha:['high availability'],dr:['disaster recovery','recovery'],
    dns:['domain name system'],dhcp:['dynamic host configuration'],tcp:['transmission control protocol'],
    gpu:['graphics processing unit','cuda'],cpu:['processor','central processing unit'],hpc:['high performance computing'],
    rto:['recovery time objective'],rpo:['recovery point objective'],slo:['service level objective'],sla:['service level agreement'],
    api:['application programming interface'],ci:['continuous integration'],cd:['continuous delivery','continuous deployment'],
    sql:['database','query'],rbac:['role based access control'],pki:['public key infrastructure'],
    qubit:['quantum bit','quantum'],numa:['non uniform memory access']
  };
  const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9+.#/-]+/g,' ').trim();
  function queryGroups(q){
    return norm(q).split(/\s+/).filter(Boolean).map(token=>[token,...(SEARCH_ALIASES[token]||[]).map(norm)]);
  }
  function searchText(l){return norm([l.title,l.summary,l.explanation,l.why,l.example,l.takeaway,l.category,l.kind,l.difficulty,domainMap.get(l.domain)?.name,...l.tags].join(' '))}
  function textMatchesQuery(text,q){
    const hay=norm(text), groups=queryGroups(q);
    return !groups.length || groups.every(group=>group.some(term=>hay.includes(term)));
  }
  function lessonScore(l,q){
    if(!q) return 1;
    const groups=queryGroups(q), title=norm(l.title), tags=norm((l.tags||[]).join(' ')), category=norm(l.category), summary=norm(l.summary), body=searchText(l);
    if(!groups.every(group=>group.some(term=>body.includes(term)))) return 0;
    let score=1;
    groups.forEach(group=>{
      const best=Math.max(...group.map(term=>title===term?40:title.startsWith(term)?24:title.includes(term)?18:tags.includes(term)?14:category.includes(term)?10:summary.includes(term)?6:body.includes(term)?2:0));
      score+=best;
    });
    const phrase=norm(q); if(phrase&&title.includes(phrase)) score+=24;
    return score;
  }
  function getFiltered(){
    const q=$('#knowledge-search').value.trim();
    const dom=$('#domain-filter').value, lvl=$('#level-filter').value, typ=$('#type-filter').value;
    const onlySaved=$('#saved-filter').checked;
    return D.lessons.map(l=>({l,score:lessonScore(l,q)})).filter(x => x.score>0 && (dom==='all'||x.l.domain===dom) && (lvl==='all'||x.l.difficulty===lvl) && (typ==='all'||x.l.kind===typ) && (!onlySaved||saved.has(x.l.id))).sort((a,b)=>q?b.score-a.score:0).map(x=>x.l);
  }
  function lessonCard(l){
    const d=domainMap.get(l.domain), isSaved=saved.has(l.id), isDone=completed.has(l.id);
    return `<article class="lesson-card${isDone?' completed':''}" tabindex="0" role="button" data-lesson="${esc(l.id)}" aria-label="Open ${esc(l.title)}">
      <div class="topline"><span class="kind">${esc(l.kind)}</span><span>·</span><span>${esc(d.name)}</span></div>
      <h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p>
      <div class="bottomline"><span>${esc(l.difficulty)} · ${l.minutes} min</span><button class="save-mini${isSaved?' saved':''}" type="button" data-save="${esc(l.id)}" aria-label="${isSaved?'Remove from saved':'Save lesson'}">${isSaved?'♥':'♡'}</button></div>
    </article>`;
  }
  function renderLessons(){
    const all=getFiltered(); const visible=all.slice(0,displayLimit);
    $('#lesson-grid').innerHTML=visible.map(lessonCard).join('') || `<div class="lesson-card"><h3>No published lesson matches yet.</h3><p>Check the glossary and roadmap suggestions above, try a broader search, or reset the filters.</p></div>`;
    $('#result-count').textContent=`${all.length} learning object${all.length===1?'':'s'}`;
    const dom=$('#domain-filter').value;
    $('#active-context').textContent=dom==='all'?'All knowledge':domainMap.get(dom).name;
    $('#load-more').hidden=displayLimit>=all.length;
    renderSearchExtras(); bindLessonCards();
  }
  function renderSearchExtras(){
    const q=$('#knowledge-search').value.trim(), box=$('#search-extras');
    if(!box||!q){if(box)box.hidden=true;return}
    const glossary=(D.glossary||[]).filter(g=>textMatchesQuery(`${g.term} ${g.definition}`,q)).slice(0,5);
    const roadmap=[]; D.domains.forEach(d=>(D.atlas[d.id]||[]).forEach(topic=>{if(textMatchesQuery(`${topic} ${d.name}`,q))roadmap.push({topic,domain:d.id})}));
    const atlasMatches=roadmap.slice(0,5);
    if(!glossary.length&&!atlasMatches.length){box.hidden=true;return}
    box.hidden=false; box.innerHTML=`${glossary.length?`<div><span class="eyebrow">GLOSSARY</span><div class="extra-links">${glossary.map(g=>`<button data-glossary-jump="${esc(g.term)}">${esc(g.term)}</button>`).join('')}</div></div>`:''}${atlasMatches.length?`<div><span class="eyebrow">ROADMAP</span><div class="extra-links">${atlasMatches.map(x=>`<button data-atlas-domain="${esc(x.domain)}" data-atlas-topic="${esc(x.topic)}">${esc(x.topic)} <small>planned</small></button>`).join('')}</div></div>`:''}`;
    $$('[data-glossary-jump]',box).forEach(b=>b.onclick=()=>{const input=$('#glossary-search');input.value=b.dataset.glossaryJump;glossaryLetter='all';renderGlossary();$('#glossary').scrollIntoView({behavior:motionPaused?'auto':'smooth'});setTimeout(()=>input.focus(),300)});
    $$('[data-atlas-topic]',box).forEach(b=>b.onclick=()=>jumpAtlas(b.dataset.atlasDomain,b.dataset.atlasTopic));
  }
  function jumpAtlas(domain,topic){
    const cards=$$('.atlas-card'); const idx=D.domains.findIndex(d=>d.id===domain); const card=cards[idx];
    if(card){card.open=true;$$('.atlas-topics span',card).forEach(x=>x.classList.toggle('highlight',x.textContent===topic));$('#atlas').scrollIntoView({behavior:motionPaused?'auto':'smooth'});setTimeout(()=>$$('.atlas-topics span',card).forEach(x=>x.classList.remove('highlight')),2600)}
  }
  function bindLessonCards(){
    $$('.lesson-card[data-lesson]').forEach(card=>{
      const go=()=>openLesson(card.dataset.lesson);
      card.addEventListener('click',e=>{if(!e.target.closest('[data-save]'))go()});
      card.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('[data-save]')){e.preventDefault();go()}});
    });
    $$('[data-save]').forEach(b=>b.addEventListener('click',e=>{
      e.stopPropagation(); toggleSaved(b.dataset.save); renderLessons();
    }));
  }
  function toggleSaved(id){
    if(saved.has(id)){saved.delete(id);toast('Removed from saved lessons')} else {saved.add(id);toast('Saved for later');ping(620)}
    saveSet(STORAGE.saved,saved);
    if(currentLesson===id) renderLessonRail(lessonMap.get(id));
  }

  function renderPaths(){
    $('#path-grid').innerHTML=D.paths.map(p=>{
      const done=p.lesson_ids.filter(id=>completed.has(id)).length;
      const pct=Math.round(done/p.lesson_ids.length*100);
      return `<article class="path-card"><div><p class="eyebrow">${esc(domainMap.get(p.domain).name)} / ${esc(p.level)}</p><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
        <div class="path-steps" aria-label="${done} of ${p.lesson_ids.length} complete">${p.lesson_ids.map(id=>`<span class="${completed.has(id)?'done':''}"></span>`).join('')}</div>
        <button class="text-button" data-path="${esc(p.id)}">${done?'Continue':'Start'} path ↗</button></div><div class="path-count">${pct}%<small>${p.lesson_ids.length} lessons</small></div></article>`;
    }).join('');
    $$('[data-path]').forEach(b=>b.addEventListener('click',()=>{
      const p=D.paths.find(x=>x.id===b.dataset.path); const next=p.lesson_ids.find(id=>!completed.has(id))||p.lesson_ids[0]; openLesson(next);
    }));
  }
  function renderAtlas(){
    $('#atlas-grid').innerHTML=D.domains.map(d=>{
      const topics=D.atlas[d.id]||[];
      return `<details class="atlas-card"><summary><h3>${esc(d.name)}</h3><span>${topics.length} mapped topics + ${publishedForDomain(d.id)} published</span></summary><div class="atlas-topics">${topics.map(t=>`<span>${esc(t)}</span>`).join('')}</div></details>`;
    }).join('');
  }

  function renderGlossary(){
    const input=$('#glossary-search'), grid=$('#glossary-grid'), letters=$('#glossary-letters');
    if(!input||!grid||!letters)return;
    const all=D.glossary||[], available=[...new Set(all.map(g=>g.term[0].toUpperCase()))].sort();
    letters.innerHTML=`<button class="${glossaryLetter==='all'?'active':''}" data-letter="all">All</button>${available.map(x=>`<button class="${glossaryLetter===x?'active':''}" data-letter="${esc(x)}">${esc(x)}</button>`).join('')}`;
    const q=input.value.trim();
    const items=all.filter(g=>(glossaryLetter==='all'||g.term[0].toUpperCase()===glossaryLetter)&&(!q||textMatchesQuery(`${g.term} ${g.definition} ${domainMap.get(g.domain)?.name}`,q))).sort((a,b)=>a.term.localeCompare(b.term));
    grid.innerHTML=items.map(g=>`<article class="glossary-card"><div class="glossary-term"><h3>${esc(g.term)}</h3><span>${esc(domainMap.get(g.domain)?.name||g.domain)}</span></div><p>${esc(g.definition)}</p>${g.lesson_id&&lessonMap.has(g.lesson_id)?`<button class="text-button" data-glossary-lesson="${esc(g.lesson_id)}">Learn this concept ↗</button>`:''}</article>`).join('')||`<div class="glossary-card"><h3>No glossary matches.</h3><p>Try another term or clear the letter filter.</p></div>`;
    $$('[data-letter]',letters).forEach(b=>b.onclick=()=>{glossaryLetter=b.dataset.letter;renderGlossary()});
    $$('[data-glossary-lesson]',grid).forEach(b=>b.onclick=()=>openLesson(b.dataset.glossaryLesson));
  }

  function graphEdgeCounts(){
    const counts=new Map();
    const add=(a,b)=>{if(!a||!b||a===b)return;const key=[a,b].sort().join('|');counts.set(key,(counts.get(key)||0)+1)};
    D.lessons.forEach(l=>[...(l.related||[]),...(l.prereq||[])].forEach(id=>{const other=lessonMap.get(id);if(other)add(l.domain,other.domain)}));
    D.paths.forEach(p=>{for(let i=1;i<p.lesson_ids.length;i++){const a=lessonMap.get(p.lesson_ids[i-1]),b=lessonMap.get(p.lesson_ids[i]);if(a&&b)add(a.domain,b.domain)}});
    return counts;
  }
  const graphEdges=graphEdgeCounts();
  function renderKnowledgeGraph(){
    const canvas=$('#knowledge-graph'), detail=$('#graph-detail'), buttons=$('#graph-buttons'); if(!canvas||!detail||!buttons)return;
    buttons.innerHTML=D.domains.map(d=>`<button class="${d.id===graphSelection?'active':''}" data-graph-domain="${esc(d.id)}">${esc(d.name)}</button>`).join('');
    $$('[data-graph-domain]',buttons).forEach(b=>b.onclick=()=>{graphSelection=b.dataset.graphDomain;renderKnowledgeGraph();ping(480,.05,.012)});
    const selected=domainMap.get(graphSelection), connections=D.domains.filter(d=>d.id!==graphSelection).map(d=>({d,count:graphEdges.get([d.id,graphSelection].sort().join('|'))||0})).sort((a,b)=>b.count-a.count);
    const bridges=D.lessons.filter(l=>l.domain===graphSelection&&[...(l.related||[]),...(l.prereq||[])].some(id=>lessonMap.get(id)&&lessonMap.get(id).domain!==graphSelection)).slice(0,5);
    detail.querySelector('p.eyebrow').textContent='SELECTED DOMAIN'; detail.querySelector('h3').textContent=selected.name;
    const paragraphs=detail.querySelectorAll(':scope > p'); if(paragraphs[1])paragraphs[1].textContent=connections[0]?.count?`Strongest current cross-domain link: ${connections[0].d.name}. The map gets denser automatically as related lessons and learning paths grow.`:'Cross-domain links will appear as the library grows.';
    let existing=detail.querySelector('.graph-bridges');if(existing)existing.remove();
    if(bridges.length){const div=document.createElement('div');div.className='graph-bridges';div.innerHTML=`<p class="eyebrow">BRIDGE LESSONS</p>${bridges.map(l=>`<button data-graph-lesson="${esc(l.id)}">${esc(l.title)}</button>`).join('')}`;buttons.before(div);$$('[data-graph-lesson]',div).forEach(b=>b.onclick=()=>openLesson(b.dataset.graphLesson))}
    drawKnowledgeGraph(canvas);
  }
  function drawKnowledgeGraph(canvas){
    const rect=canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2), w=Math.max(320,rect.width), h=Math.max(360,rect.height);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
    const css=getComputedStyle(document.documentElement), line=css.getPropertyValue('--line2'), accent=css.getPropertyValue('--accent'), text=css.getPropertyValue('--text'), muted=css.getPropertyValue('--muted'), panel=css.getPropertyValue('--panel2');
    const cx=w/2,cy=h/2,r=Math.min(w,h)*.34;
    const nodes=D.domains.map((d,i)=>({d,x:cx+Math.cos(-Math.PI/2+i*Math.PI*2/D.domains.length)*r,y:cy+Math.sin(-Math.PI/2+i*Math.PI*2/D.domains.length)*r}));
    canvas._nodes=nodes;ctx.clearRect(0,0,w,h);
    graphEdges.forEach((count,key)=>{const [a,b]=key.split('|'),na=nodes.find(n=>n.d.id===a),nb=nodes.find(n=>n.d.id===b);if(!na||!nb)return;ctx.strokeStyle=(a===graphSelection||b===graphSelection)?accent:line;ctx.globalAlpha=(a===graphSelection||b===graphSelection)?.8:.25;ctx.lineWidth=Math.min(4,1+count*.18);ctx.beginPath();ctx.moveTo(na.x,na.y);ctx.lineTo(nb.x,nb.y);ctx.stroke()});
    ctx.globalAlpha=1;nodes.forEach(n=>{const active=n.d.id===graphSelection;ctx.fillStyle=active?accent:panel;ctx.strokeStyle=active?accent:line;ctx.lineWidth=active?2:1;ctx.beginPath();ctx.arc(n.x,n.y,active?35:29,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=active?'#161412':text;ctx.font=`${active?'700':'600'} 11px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';const words=n.d.name.split(' ');ctx.fillText(words[0],n.x,n.y-(words.length>1?6:0));if(words.length>1)ctx.fillText(words.slice(1).join(' '),n.x,n.y+8)});
    canvas.onclick=e=>{const rr=canvas.getBoundingClientRect(),x=e.clientX-rr.left,y=e.clientY-rr.top,n=canvas._nodes?.map(n=>({...n,dist:Math.hypot(n.x-x,n.y-y)})).sort((a,b)=>a.dist-b.dist)[0];if(n&&n.dist<48){graphSelection=n.d.id;renderKnowledgeGraph();ping(500,.05,.012)}};
  }

  function paras(text){return String(text).split(/\n\n+/).map(p=>`<p>${esc(p)}</p>`).join('')}
  function section(id,title,body){return `<section id="${id}"><h2>${esc(title)}</h2>${body}</section>`}
  function openLesson(id,push=true){
    const l=lessonMap.get(id); if(!l)return;
    stopSpeech(); currentLesson=id; localStorage.setItem(STORAGE.recent,id); renderContinue();
    $('#library-view').hidden=true; $('#lesson-view').hidden=false; document.body.classList.add('reading'); $('#lesson-view').classList.toggle('focus-reading',focusReading);
    if(push){const u=new URL(location.href);u.searchParams.set('lesson',id);u.searchParams.delete('domain');history.pushState({lesson:id},'',u)}
    const d=domainMap.get(l.domain);
    const obj=l.objectives?.length?section('objectives','What you’ll learn',`<ul>${l.objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`):'';
    const misconception=l.misconception?section('misconception','Common misconception',`<div class="misconception"><p>${esc(l.misconception)}</p></div>`):'';
    const interactive=l.interactive?section('interactive','See it in action',interactiveShell(l.interactive,l)):'';
    const quiz=l.quiz?section('check','Check your understanding',renderQuiz(l)):'';
    $('#lesson-article').innerHTML=`
      <div class="breadcrumbs"><button data-home-lesson>Knowledge Library</button><span>/</span><button data-domain-lesson="${esc(l.domain)}">${esc(d.name)}</button><span>/</span><span>${esc(l.category)}</span></div>
      <div class="lesson-kicker"><span>${esc(l.kind)}</span><span>·</span><span>${esc(l.category)}</span></div>
      <h1 class="lesson-title">${esc(l.title)}</h1><p class="lesson-summary">${esc(l.summary)}</p>
      <div class="lesson-meta-row"><span class="pill">${esc(l.difficulty)}</span><span class="pill">${l.minutes} min</span><span class="pill">Reviewed ${esc(D.lastReviewed)}</span>${l.interactive?'<span class="pill">Interactive</span>':''}</div>
      <div class="lesson-actions"><button class="button primary" id="listen-full">▶ Listen</button><button class="button" id="listen-summary">◖)) 60-sec summary</button><button class="button" id="stop-audio" hidden>■ Stop</button><button class="button" id="save-current">${saved.has(l.id)?'♥ Saved':'♡ Save'}</button><button class="button" id="focus-reading">${focusReading?'Exit focus':'Focus reading'}</button><button class="button" id="share-current">Share ↗</button><label class="narration-rate">Narration <select id="narration-rate" aria-label="Narration speed"><option value="0.85">0.85×</option><option value="1">1×</option><option value="1.15">1.15×</option><option value="1.35">1.35×</option><option value="1.6">1.6×</option><option value="2">2×</option></select></label><span class="audio-state" id="audio-state">Audio starts only when you ask for it.</span></div>
      <div class="lesson-body">
        ${obj}
        ${section('concept','The concept',paras(l.explanation))}
        ${section('why','Why it matters',`<div class="callout"><strong>Why this matters</strong><p>${esc(l.why)}</p></div>`)}
        ${section('example','Example',`<p>${esc(l.example)}</p>`)}
        ${interactive}
        ${misconception}
        ${section('takeaway','Key takeaway',`<div class="callout"><strong>Remember this</strong><p>${esc(l.takeaway)}</p></div>`)}
        ${quiz}
      </div>`;
    renderTOC(); renderLessonRail(l); bindLessonUI(l); mountInteractive(l.interactive,l); window.scrollTo({top:0,behavior:'auto'}); updateReadingProgress();
  }
  function closeLesson(push=true){
    stopSpeech(); currentLesson=null; $('#lesson-view').hidden=true; $('#library-view').hidden=false; document.body.classList.remove('reading');
    if(push){const u=new URL(location.href);u.searchParams.delete('lesson');history.pushState({},'',u)}
    renderLessons(); renderPaths(); renderKnowledgeGraph(); window.scrollTo({top:document.querySelector('#discover').offsetTop-90,behavior:'auto'});
  }
  function renderTOC(){
    const secs=$$('.lesson-body section');
    $('#lesson-toc').innerHTML=`<span class="eyebrow">ON THIS PAGE</span>${secs.map(s=>`<a href="#${s.id}">${esc($('h2',s)?.textContent||s.id)}</a>`).join('')}`;
  }
  function renderLessonRail(l){
    const prereq=l.prereq.map(id=>lessonMap.get(id)).filter(Boolean);
    const related=l.related.map(id=>lessonMap.get(id)).filter(Boolean);
    const refs=l.references||[];
    const path=D.paths.find(p=>p.lesson_ids.includes(l.id)); const pathIndex=path?path.lesson_ids.indexOf(l.id):-1; const prev=pathIndex>0?lessonMap.get(path.lesson_ids[pathIndex-1]):null; const next=path&&pathIndex<path.lesson_ids.length-1?lessonMap.get(path.lesson_ids[pathIndex+1]):null;
    $('#lesson-rail').innerHTML=`
      ${path?`<div class="rail-card path-rail"><p class="eyebrow">GUIDED PATH</p><h3>${esc(path.title)}</h3><div class="path-mini-progress"><span style="width:${Math.round((pathIndex+1)/path.lesson_ids.length*100)}%"></span></div><p>${pathIndex+1} of ${path.lesson_ids.length}</p>${prev?`<button data-open="${esc(prev.id)}">← ${esc(prev.title)}</button>`:''}${next?`<button data-open="${esc(next.id)}">Next: ${esc(next.title)} →</button>`:'<span class="muted">You reached the end of this path.</span>'}</div>`:''}
      <div class="rail-card"><h3>Knowledge connections</h3>${prereq.length?'<p class="eyebrow">Prerequisites</p>'+prereq.map(x=>`<button data-open="${x.id}">${esc(x.title)}</button>`).join(''):''}<p class="eyebrow">Related</p>${related.length?related.map(x=>`<button data-open="${x.id}">${esc(x.title)}</button>`).join(''):'<span class="muted">More connections coming.</span>'}</div>
      <div class="rail-card"><h3>References</h3><ul class="reference-list">${refs.map(r=>`<li><a href="${esc(r[1])}" target="_blank" rel="noopener noreferrer">${esc(r[0])} ↗</a></li>`).join('')}</ul></div>
      <div class="rail-card"><h3>Learning tools</h3><button id="rail-random">Surprise me</button><button id="rail-save">${saved.has(l.id)?'♥ Saved':'♡ Save this lesson'}</button><button data-domain-jump="${l.domain}">Browse ${esc(domainMap.get(l.domain).name)}</button></div>`;
    $$('[data-open]', $('#lesson-rail')).forEach(b=>b.addEventListener('click',()=>openLesson(b.dataset.open)));
    $('#rail-random').addEventListener('click',randomLesson); $('#rail-save').addEventListener('click',()=>{toggleSaved(l.id);$('#save-current').textContent=saved.has(l.id)?'♥ Saved':'♡ Save';renderLessonRail(l)});
    $('[data-domain-jump]', $('#lesson-rail')).addEventListener('click',e=>{const dom=e.currentTarget.dataset.domainJump;closeLesson(false);$('#domain-filter').value=dom;renderLessons();history.pushState({},'',`learn.html?domain=${encodeURIComponent(dom)}`)});
    $('#progress-label').textContent=completed.has(l.id)?'Completed':'Not completed'; $('#complete-lesson').textContent=completed.has(l.id)?'Mark incomplete':'Mark complete';
  }
  function bindLessonUI(l){
    $('#back-library').onclick=()=>closeLesson(); $$('[data-home-lesson]').forEach(b=>b.onclick=()=>closeLesson());
    $$('[data-domain-lesson]').forEach(b=>b.onclick=()=>{const dom=b.dataset.domainLesson;closeLesson(false);$('#domain-filter').value=dom;renderLessons();history.pushState({},'',`learn.html?domain=${encodeURIComponent(dom)}`)});
    const rate=$('#narration-rate'); rate.value=localStorage.getItem(STORAGE.narrationRate)||'1'; rate.onchange=()=>{localStorage.setItem(STORAGE.narrationRate,rate.value);toast(`Narration ${rate.options[rate.selectedIndex].text}`)};
    $('#listen-full').onclick=()=>speakLesson(l,false); $('#listen-summary').onclick=()=>speakLesson(l,true); $('#stop-audio').onclick=stopSpeech;
    $('#save-current').onclick=()=>{toggleSaved(l.id);$('#save-current').textContent=saved.has(l.id)?'♥ Saved':'♡ Save';renderLessonRail(l)};
    $('#focus-reading').onclick=()=>{focusReading=!focusReading;localStorage.setItem(STORAGE.focus,focusReading?'on':'off');$('#lesson-view').classList.toggle('focus-reading',focusReading);$('#focus-reading').textContent=focusReading?'Exit focus':'Focus reading';toast(focusReading?'Focus reading on':'Focus reading off')};
    $('#share-current').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast('Lesson link copied')}catch{toast('Copy the address from your browser')}};
    $('#complete-lesson').onclick=()=>{
      if(completed.has(l.id)){completed.delete(l.id);toast('Marked incomplete')} else {completed.add(l.id);toast('Lesson complete');ping(700,.12,.03)}
      saveSet(STORAGE.complete,completed); renderLessonRail(l); renderPaths();
    };
    if(l.quiz){$$('.quiz-options button').forEach(b=>b.onclick=()=>answerQuiz(l,Number(b.dataset.option)))}
  }
  function renderQuiz(l){
    return `<div class="quiz"><h3>${esc(l.quiz.q)}</h3><div class="quiz-options">${l.quiz.options.map((o,i)=>`<button type="button" data-option="${i}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join('')}</div><div class="quiz-feedback" id="quiz-feedback"></div></div>`;
  }
  function answerQuiz(l,i){
    const correct=l.quiz.answer; const buttons=$$('.quiz-options button'); buttons.forEach(b=>b.disabled=true); buttons[correct].classList.add('correct');
    if(i!==correct){buttons[i].classList.add('wrong');$('#quiz-feedback').textContent=`Not quite. ${l.quiz.explanation}`;ping(220)} else {$('#quiz-feedback').textContent=`Correct. ${l.quiz.explanation}`;ping(740,.1,.03)}
  }

  function speechText(l,summary){
    if(summary) return `${l.title}. ${l.summary} Key takeaway: ${l.takeaway}`;
    return `${l.title}. ${l.summary}. ${l.explanation.replace(/\n+/g,' ')} Why it matters. ${l.why}. Example. ${l.example}. Key takeaway. ${l.takeaway}`;
  }
  function speakLesson(l,summary){
    if(!('speechSynthesis' in window)){toast('This browser does not expose speech synthesis.');return}
    stopSpeech(false); const u=new SpeechSynthesisUtterance(speechText(l,summary)); currentUtterance=u; speechState='speaking';
    const base=Number(localStorage.getItem(STORAGE.narrationRate)||1); u.rate=summary?Math.min(2,base*1.05):base; u.pitch=1; u.onend=()=>stopSpeech(false); u.onerror=()=>stopSpeech(false);
    $('#audio-state').textContent=summary?'Playing the short summary…':'Narrating this lesson…'; $('#stop-audio').hidden=false; speechSynthesis.speak(u);
  }
  function stopSpeech(update=true){
    if('speechSynthesis' in window) speechSynthesis.cancel(); speechState='idle'; currentUtterance=null;
    const s=$('#audio-state'), b=$('#stop-audio'); if(s&&update)s.textContent='Audio stopped.'; if(b)b.hidden=true;
  }

  function interactiveShell(type,l){
    return `<div class="interactive" data-interactive="${esc(type)}"><div class="interactive-head"><h3>${esc(interactiveTitle(type))}</h3><span>Interactive model</span></div><div class="visual-stage" data-stage></div><div class="controls" data-controls></div></div>`;
  }
  function interactiveTitle(t){return ({urljourney:'Follow the request',dns:'Walk a DNS lookup',tcp:'TCP handshake step-through',loadbalancer:'Load balancer traffic lab',subnet:'Subnet calculator',permissions:'Permission decoder',binary:'Binary converter',logic:'Logic-gate truth explorer',cachelatency:'Memory-latency ladder',cpu:'Step through the CPU cycle',amdahl:'Amdahl speedup explorer',qubit:'Single-qubit probability explorer',complexity:'Growth-rate explorer',api:'API request pipeline',queue:'Queue workbench',cia:'Security-property scenarios',threat:'Threat-model prompts',tls:'TLS handshake map',rbac:'RBAC permission matrix',incident:'Incident decision drill',errorbudget:'Error-budget calculator',vector:'Vector playground',derivative:'Tangent-line explorer',matrix:'Matrix rotation explorer',force:'Force / mass / acceleration',projectile:'Projectile-motion explorer',wave:'Waveform + sound',doppler:'Doppler shift + sound',ohm:'Ohm’s law calculator'})[t]||'Explore the concept'}
  function mountInteractive(type,l){
    if(!type)return; const root=$('[data-interactive]'); if(!root)return; const stage=$('[data-stage]',root), controls=$('[data-controls]',root);
    const nodeRow=(names)=>{stage.innerHTML=`<div class="diagram-row">${names.map((n,i)=>`<div class="diagram-node" data-node="${i}">${esc(n)}</div>${i<names.length-1?'<span class="diagram-arrow">→</span>':''}`).join('')}</div>`};
    const animateNodes=(names)=>{nodeRow(names);controls.innerHTML='<button class="button primary" type="button">▶ Run</button><span class="muted" data-status>Ready.</span>';let timers=[];$('button',controls).onclick=()=>{timers.forEach(clearTimeout);$$('.diagram-node',stage).forEach(n=>n.classList.remove('active'));$('[data-status]',controls).textContent='Tracing…';names.forEach((n,i)=>timers.push(setTimeout(()=>{$$('.diagram-node',stage).forEach(x=>x.classList.remove('active'));$(`[data-node="${i}"]`,stage).classList.add('active');$('[data-status]',controls).textContent=n;ping(420+i*45)},i*650)));timers.push(setTimeout(()=>$('[data-status]',controls).textContent='Complete.',names.length*650))}};
    if(type==='urljourney') return animateNodes(['URL parsed','DNS','Gateway / routing','TCP','TLS','HTTP','Render']);
    if(type==='dns') return animateNodes(['Browser / OS cache','Recursive resolver','Root','TLD','Authoritative','Answer cached']);
    if(type==='api') return animateNodes(['Client','TLS','Authn','Routing','Validation','Authorization','Handler','Database','Response']);
    if(type==='tls') return animateNodes(['Client hello','Server hello','Certificate','Key agreement','Session keys','Encrypted HTTP']);
    if(type==='tcp') return animateNodes(['Client: SYN','Server: SYN + ACK','Client: ACK','Connection established']);
    if(type==='loadbalancer'){
      stage.innerHTML='<div class="lb-wrap"><div class="lb-client">Client</div><div class="lb-arrow">→</div><div class="lb-core">Load balancer</div><div class="lb-arrow">→</div><div class="lb-backends"><button data-backend="0">App 01 <span>healthy</span></button><button data-backend="1">App 02 <span>healthy</span></button><button data-backend="2">App 03 <span>healthy</span></button></div></div><p data-lb-out class="muted">Toggle backend health, then send requests.</p>';
      controls.innerHTML='<button class="button primary" data-send-request>Send request →</button><span class="muted">Click a backend to toggle healthy/unhealthy.</span>';let rr=0,health=[true,true,true];
      $$('[data-backend]',stage).forEach(b=>b.onclick=()=>{const i=+b.dataset.backend;health[i]=!health[i];b.classList.toggle('down',!health[i]);$('span',b).textContent=health[i]?'healthy':'unhealthy';ping(health[i]?600:220)});
      $('[data-send-request]',controls).onclick=()=>{const healthy=health.map((ok,i)=>ok?i:null).filter(i=>i!==null);if(!healthy.length){$('[data-lb-out]',stage).textContent='No healthy backends: the load balancer has nowhere safe to send the request.';ping(180);return}const target=healthy[rr++%healthy.length];$$('[data-backend]',stage).forEach(x=>x.classList.remove('selected'));$(`[data-backend="${target}"]`,stage).classList.add('selected');$('[data-lb-out]',stage).textContent=`Request routed to App 0${target+1}. Only healthy backends participate in this simple round-robin model.`;ping(520+target*70)};return;
    }
    if(type==='binary'){
      stage.innerHTML='<div class="binary-bits" data-bits></div><div class="metric-grid"><div class="metric"><span>Decimal</span><strong data-decimal>22</strong></div><div class="metric"><span>Binary</span><strong data-binary>00010110</strong></div><div class="metric"><span>Hex</span><strong data-hex>16</strong></div><div class="metric"><span>Set bits</span><strong data-pop>3</strong></div></div>';
      controls.innerHTML='<label>Decimal 0–255 <input type="number" min="0" max="255" value="22" data-dec></label><input type="range" min="0" max="255" value="22" data-dec-range>';
      const upd=v=>{v=Math.max(0,Math.min(255,Math.floor(Number(v)||0)));$('[data-dec]',controls).value=v;$('[data-dec-range]',controls).value=v;const bits=v.toString(2).padStart(8,'0');$('[data-bits]',stage).innerHTML=bits.split('').map((bit,i)=>`<span class="${bit==='1'?'on':''}"><b>${bit}</b><small>${2**(7-i)}</small></span>`).join('');$('[data-decimal]',stage).textContent=v;$('[data-binary]',stage).textContent=bits;$('[data-hex]',stage).textContent=v.toString(16).toUpperCase().padStart(2,'0');$('[data-pop]',stage).textContent=[...bits].filter(x=>x==='1').length};$('[data-dec]',controls).oninput=e=>upd(e.target.value);$('[data-dec-range]',controls).oninput=e=>upd(e.target.value);upd(22);return;
    }
    if(type==='logic'){
      stage.innerHTML='<div class="logic-stage"><button data-logic-a aria-pressed="true">A = 1</button><div class="logic-gate" data-gate>AND</div><button data-logic-b aria-pressed="true">B = 1</button><div class="logic-result">OUT = <strong data-logic-out>1</strong></div></div>';
      controls.innerHTML='<label>Gate <select data-gate-select><option>AND</option><option>OR</option><option>XOR</option><option>NAND</option><option>NOR</option></select></label><span class="muted" data-logic-text>AND is true only when both inputs are true.</span>';let a=1,b=1;const calc=()=>{const g=$('[data-gate-select]',controls).value;let out=g==='AND'?(a&&b):g==='OR'?(a||b):g==='XOR'?(a!==b):g==='NAND'?!(a&&b):!(a||b);$('[data-gate]',stage).textContent=g;$('[data-logic-out]',stage).textContent=out?1:0;$('[data-logic-text]',controls).textContent={AND:'AND is true only when both inputs are true.',OR:'OR is true when either input is true.',XOR:'XOR is true when the inputs differ.',NAND:'NAND is the inverse of AND.',NOR:'NOR is the inverse of OR.'}[g];};const setBtn=(sel,val,label)=>{const el=$(sel,stage);el.textContent=`${label} = ${val}`;el.setAttribute('aria-pressed',String(Boolean(val)))};$('[data-logic-a]',stage).onclick=()=>{a=+!a;setBtn('[data-logic-a]',a,'A');calc()};$('[data-logic-b]',stage).onclick=()=>{b=+!b;setBtn('[data-logic-b]',b,'B');calc()};$('[data-gate-select]',controls).onchange=calc;calc();return;
    }
    if(type==='cachelatency'){
      const levels=[['Register',1],['L1 cache',4],['L2 cache',12],['L3 cache',40],['Main memory',180],['NVMe storage',80000]];stage.innerHTML='<div class="latency-ladder">'+levels.map(([n,v],i)=>`<button data-lat="${i}"><span>${n}</span><i style="width:${Math.max(5,Math.log10(v+1)/Math.log10(80001)*100)}%"></i><b>${v===1?'baseline':v+'× illustrative'}</b></button>`).join('')+'</div><p data-lat-out class="muted">Relative values are illustrative—not universal hardware timings. Click a level.</p>';$$('[data-lat]',stage).forEach(b=>b.onclick=()=>{const [name,v]=levels[+b.dataset.lat];$$('[data-lat]',stage).forEach(x=>x.classList.remove('selected'));b.classList.add('selected');$('[data-lat-out]',stage).textContent=`${name}: roughly ${v}× this model’s register baseline. The point is the scale gap, not a universal nanosecond value.`;ping(650-Math.min(400,Math.log10(v+1)*90))});return;
    }
    if(type==='queue'){
      let items=['A','B','C'];stage.innerHTML='<div class="queue-stage"><span class="queue-label">FRONT</span><div data-queue-items></div><span class="queue-label">BACK</span></div><p data-queue-out class="muted">FIFO removes from the front in arrival order.</p>';controls.innerHTML='<input type="text" data-queue-input maxlength="12" placeholder="Item D"><button class="button primary" data-enqueue>Enqueue</button><button class="button" data-dequeue>Dequeue</button>';const draw=()=>{$('[data-queue-items]',stage).innerHTML=items.map(x=>`<span>${esc(x)}</span>`).join('')||'<em>empty</em>'};$('[data-enqueue]',controls).onclick=()=>{const v=$('[data-queue-input]',controls).value.trim()||`Item ${items.length+1}`;items.push(v);$('[data-queue-input]',controls).value='';$('[data-queue-out]',stage).textContent=`Enqueued ${v} at the back.`;draw();ping(610)};$('[data-dequeue]',controls).onclick=()=>{const v=items.shift();$('[data-queue-out]',stage).textContent=v?`Dequeued ${v} from the front.`:'The queue is empty.';draw();ping(v?420:200)};draw();return;
    }
    if(type==='rbac'){
      const roles={HelpDesk:['Reset password','Unlock account'],ServerOps:['Restart service','View logs','Deploy approved change'],SecurityAdmin:['Review roles','Revoke sessions','Manage MFA policy']};stage.innerHTML='<div class="rbac-stage"><div class="rbac-roles">'+Object.keys(roles).map((r,i)=>`<button data-role="${esc(r)}" class="${i===0?'selected':''}">${esc(r)}</button>`).join('')+'</div><div class="rbac-perms" data-role-perms></div></div>';const show=r=>{$('[data-role-perms]',stage).innerHTML=`<h4>${esc(r)}</h4>${roles[r].map(x=>`<span>✓ ${esc(x)}</span>`).join('')}<span class="denied">× Anything not granted by this role</span>`;$$('[data-role]',stage).forEach(x=>x.classList.toggle('selected',x.dataset.role===r))};$$('[data-role]',stage).forEach(b=>b.onclick=()=>{show(b.dataset.role);ping(500)});show('HelpDesk');return;
    }
    if(type==='errorbudget'){
      stage.innerHTML='<div class="metric-grid"><div class="metric"><span>SLO</span><strong data-slo>99.90%</strong></div><div class="metric"><span>Window</span><strong data-window>30 days</strong></div><div class="metric"><span>Error budget</span><strong data-budget>43.2 min</strong></div><div class="metric"><span>After 20 min outage</span><strong data-remain>23.2 min</strong></div></div>';controls.innerHTML='<label>SLO <input type="range" min="95" max="99.99" step="0.01" value="99.9" data-slo-range></label><label>Days <input type="range" min="1" max="90" value="30" data-window-range></label><label>Outage minutes <input type="number" min="0" value="20" data-outage style="width:80px"></label>';const upd=()=>{const slo=+$('[data-slo-range]',controls).value,days=+$('[data-window-range]',controls).value,outage=Math.max(0,+$('[data-outage]',controls).value||0),budget=days*24*60*(1-slo/100),remain=budget-outage;$('[data-slo]',stage).textContent=slo.toFixed(2)+'%';$('[data-window]',stage).textContent=days+' days';$('[data-budget]',stage).textContent=budget<60?budget.toFixed(1)+' min':(budget/60).toFixed(2)+' hr';$('[data-remain]',stage).textContent=(remain<0?'OVER by '+Math.abs(remain).toFixed(1):remain.toFixed(1))+' min'};$$('input',controls).forEach(x=>x.oninput=upd);upd();return;
    }
    if(type==='subnet'){
      stage.innerHTML='<div class="metric-grid"><div class="metric"><span>Network</span><strong data-net>—</strong></div><div class="metric"><span>Broadcast</span><strong data-bcast>—</strong></div><div class="metric"><span>Total addresses</span><strong data-total>—</strong></div><div class="metric"><span>Conventional hosts</span><strong data-hosts>—</strong></div></div>';
      controls.innerHTML='<label>IPv4 <input type="text" value="192.168.10.42" data-ip size="15"></label><label>Prefix /<input type="number" min="0" max="32" value="26" data-prefix style="width:70px"></label><button class="button primary" type="button">Calculate</button>';
      const calc=()=>{const ip=$('[data-ip]',controls).value.trim().split('.').map(Number),p=Number($('[data-prefix]',controls).value);if(ip.length!==4||ip.some(n=>!Number.isInteger(n)||n<0||n>255)||p<0||p>32){toast('Enter a valid IPv4 address and prefix.');return}let x=((ip[0]<<24)|(ip[1]<<16)|(ip[2]<<8)|ip[3])>>>0;let mask=p===0?0:(0xffffffff<<(32-p))>>>0;let net=(x&mask)>>>0,bcast=(net|(~mask>>>0))>>>0;const fmt=n=>[n>>>24,(n>>>16)&255,(n>>>8)&255,n&255].join('.');const total=2**(32-p),hosts=p<=30?Math.max(0,total-2):total;$('[data-net]',stage).textContent=`${fmt(net)}/${p}`;$('[data-bcast]',stage).textContent=fmt(bcast);$('[data-total]',stage).textContent=total.toLocaleString();$('[data-hosts]',stage).textContent=hosts.toLocaleString();ping(560)};$('button',controls).onclick=calc;calc();return;
    }
    if(type==='permissions'){
      stage.innerHTML='<div class="permission-display"><span data-symbolic>rw-r-----</span> <small data-mode>640</small></div>';
      controls.innerHTML=['Owner','Group','Other'].map((n,i)=>`<label>${n} <input type="range" min="0" max="7" step="1" value="${[6,4,0][i]}" data-perm="${i}"> <span data-pv="${i}">${[6,4,0][i]}</span></label>`).join('');
      const sym=n=>(n&4?'r':'-')+(n&2?'w':'-')+(n&1?'x':'-');const upd=()=>{const v=$$('[data-perm]',controls).map(x=>Number(x.value));v.forEach((n,i)=>$(`[data-pv="${i}"]`,controls).textContent=n);$('[data-mode]',stage).textContent=v.join('');$('[data-symbolic]',stage).textContent=v.map(sym).join('')};$$('input',controls).forEach(x=>x.oninput=upd);upd();return;
    }
    if(type==='cpu'){
      const steps=['FETCH','DECODE','EXECUTE','WRITEBACK'];stage.innerHTML=`<div class="cpu-stage">${steps.map((s,i)=>`<div class="cpu-box" data-cpu="${i}"><strong>${s}</strong><br><small>${['Read instruction at PC','Interpret opcode + operands','Perform operation','Commit result'][i]}</small></div>`).join('')}</div>`;controls.innerHTML='<button class="button primary">Step →</button><span data-cpu-state>PC = 0x0040</span>';let i=-1;$('button',controls).onclick=()=>{i=(i+1)%steps.length;$$('.cpu-box',stage).forEach(x=>x.classList.remove('active'));$(`[data-cpu="${i}"]`,stage).classList.add('active');$('[data-cpu-state]',controls).textContent=i===0?'PC = 0x0040 → instruction fetched':i===1?'opcode = ADD, operands = R1,R2,R3':i===2?'ALU computes R2 + R3': 'R1 updated; PC advances';ping(380+i*80)};return;
    }
    if(type==='amdahl'){
      stage.innerHTML='<div class="metric-grid"><div class="metric"><span>Parallel fraction</span><strong data-pf>90%</strong></div><div class="metric"><span>Processors</span><strong data-procs>8</strong></div><div class="metric"><span>Ideal speedup</span><strong data-speed>—</strong></div><div class="metric"><span>Infinite-core ceiling</span><strong data-ceil>—</strong></div></div>';
      controls.innerHTML='<label>Parallel % <input type="range" min="0" max="99" value="90" data-p></label><label>Processors <input type="range" min="1" max="128" value="8" data-n></label>';
      const upd=()=>{let p=Number($('[data-p]',controls).value)/100,n=Number($('[data-n]',controls).value),s=1/((1-p)+p/n),c=1/(1-p||.000001);$('[data-pf]',stage).textContent=Math.round(p*100)+'%';$('[data-procs]',stage).textContent=n;$('[data-speed]',stage).textContent=s.toFixed(2)+'×';$('[data-ceil]',stage).textContent=(p>=.999?'∞':c.toFixed(1)+'×')};$$('input',controls).forEach(x=>x.oninput=upd);upd();return;
    }
    if(type==='qubit'){
      stage.innerHTML='<div class="qubit-viz"><span class="qubit-dot"></span></div><div class="metric-grid" style="margin-top:15px"><div class="metric"><span>P(0)</span><strong data-p0>100%</strong></div><div class="metric"><span>P(1)</span><strong data-p1>0%</strong></div><div class="metric"><span>State angle</span><strong data-theta>0°</strong></div><div class="metric"><span>One sample</span><strong data-sample>—</strong></div></div>';
      controls.innerHTML='<label>θ <input type="range" min="0" max="180" value="0" data-theta-range></label><button class="button primary" data-measure>Measure</button>';
      const upd=()=>{const deg=Number($('[data-theta-range]',controls).value),r=deg*Math.PI/180,p0=Math.cos(r/2)**2,p1=1-p0;$('[data-p0]',stage).textContent=(p0*100).toFixed(1)+'%';$('[data-p1]',stage).textContent=(p1*100).toFixed(1)+'%';$('[data-theta]',stage).textContent=deg+'°';const y=4+(deg/180)*190;$('.qubit-dot',stage).style.top=`${y}px`;stage.dataset.p0=p0};$('[data-theta-range]',controls).oninput=upd;$('[data-measure]',controls).onclick=()=>{const r=Math.random()<Number(stage.dataset.p0)?0:1;$('[data-sample]',stage).textContent='|'+r+'⟩';ping(r?660:440,.12,.03)};upd();return;
    }
    if(type==='complexity'){
      stage.innerHTML='<div class="metric-grid"><div class="metric"><span>n</span><strong data-nv>100</strong></div><div class="metric"><span>O(log n)</span><strong data-log>—</strong></div><div class="metric"><span>O(n)</span><strong data-lin>—</strong></div><div class="metric"><span>O(n²)</span><strong data-sq>—</strong></div></div>';
      controls.innerHTML='<label>Input size <input type="range" min="10" max="10000" step="10" value="100" data-size></label>';
      const upd=()=>{const n=Number($('[data-size]',controls).value);$('[data-nv]',stage).textContent=n.toLocaleString();$('[data-log]',stage).textContent=Math.ceil(Math.log2(n)).toLocaleString();$('[data-lin]',stage).textContent=n.toLocaleString();$('[data-sq]',stage).textContent=(n*n).toLocaleString()};$('input',controls).oninput=upd;upd();return;
    }
    if(type==='cia'){
      stage.innerHTML='<div class="incident-stage"><button data-cia="Confidentiality">Payroll data is exposed publicly.</button><button data-cia="Integrity">A configuration is changed without authorization.</button><button data-cia="Availability">A service is unreachable during business hours.</button></div><p data-cia-out class="muted">Choose a scenario.</p>';$$('button',stage).forEach(b=>b.onclick=()=>{$('[data-cia-out]',stage).textContent=`Primary property: ${b.dataset.cia}. Real incidents can affect more than one property.`;ping(520)});return;
    }
    if(type==='threat'){
      stage.innerHTML='<div class="incident-stage"><button data-threat="Identity">Can an attacker impersonate a user or service?</button><button data-threat="Boundary">Where does data cross a trust boundary?</button><button data-threat="Privilege">Can a low-privilege principal reach a high-impact action?</button><button data-threat="Availability">What single dependency can deny service?</button></div><p data-threat-out class="muted">Choose a prompt to reveal the engineering question.</p>';$$('button',stage).forEach(b=>b.onclick=()=>{$('[data-threat-out]',stage).textContent=`${b.dataset.threat}: write down the asset, current assumption, evidence, and one mitigation.`;ping(500)});return;
    }
    if(type==='incident'){
      stage.innerHTML='<p><strong>Scenario:</strong> Login failures spike to 80% after a change. The cause is unknown.</p><div class="incident-stage"><button data-inc="good">Declare incident severity, assign roles, freeze unrelated changes, and split investigation workstreams.</button><button data-inc="weak">Have everyone independently restart systems until something works.</button><button data-inc="weak">Wait silently for the root cause before communicating impact.</button></div><p data-inc-out class="muted">Choose the first coordination move.</p>';$$('button',stage).forEach(b=>b.onclick=()=>{const good=b.dataset.inc==='good';$('[data-inc-out]',stage).textContent=good?'Strong move: it creates ownership, protects evidence, and preserves specialist attention.':'Risky move: it increases ambiguity or destroys coordination. Prefer explicit roles, evidence, and update cadence.';ping(good?720:220)});return;
    }
    if(['vector','derivative','matrix','force','projectile','wave','doppler','ohm'].includes(type)) return mountMathPhysics(type,stage,controls);
    stage.innerHTML='<p class="muted">Interactive model coming in a later library release.</p>';
  }

  function mountMathPhysics(type,stage,controls){
    if(type==='vector'){
      stage.innerHTML='<canvas class="math-canvas" width="700" height="220"></canvas><div class="metric-grid"><div class="metric"><span>a + b</span><strong data-sum>—</strong></div><div class="metric"><span>a · b</span><strong data-dot>—</strong></div><div class="metric"><span>|a|</span><strong data-ma>—</strong></div><div class="metric"><span>|b|</span><strong data-mb>—</strong></div></div>';
      controls.innerHTML='<label>aₓ <input type="range" min="-5" max="5" value="3" data-ax></label><label>aᵧ <input type="range" min="-5" max="5" value="0" data-ay></label><label>bₓ <input type="range" min="-5" max="5" value="0" data-bx></label><label>bᵧ <input type="range" min="-5" max="5" value="4" data-by></label>';
      const draw=()=>{let ax=+$('[data-ax]',controls).value,ay=+$('[data-ay]',controls).value,bx=+$('[data-bx]',controls).value,by=+$('[data-by]',controls).value,c=$('canvas',stage),ctx=c.getContext('2d'),w=c.width,h=c.height,cx=w/2,cy=h/2,s=18;ctx.clearRect(0,0,w,h);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--line2');ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.stroke();const arrow=(x,y,label,off=0)=>{ctx.strokeStyle=off?'#86b89c':getComputedStyle(document.documentElement).getPropertyValue('--accent');ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+x*s,cy-y*s);ctx.stroke();ctx.fillText(label,cx+x*s+5,cy-y*s-5)};arrow(ax,ay,'a');arrow(bx,by,'b',1);arrow(ax+bx,ay+by,'a+b',2);$('[data-sum]',stage).textContent=`(${ax+bx}, ${ay+by})`;$('[data-dot]',stage).textContent=ax*bx+ay*by;$('[data-ma]',stage).textContent=Math.hypot(ax,ay).toFixed(2);$('[data-mb]',stage).textContent=Math.hypot(bx,by).toFixed(2)};$$('input',controls).forEach(x=>x.oninput=draw);draw();return;
    }
    if(type==='derivative'){
      stage.innerHTML='<canvas class="math-canvas" width="700" height="260"></canvas><p data-slope class="muted"></p>';controls.innerHTML='<label>x <input type="range" min="-4" max="4" step="0.1" value="2" data-x></label>';
      const draw=()=>{const x0=+$('[data-x]',controls).value,c=$('canvas',stage),ctx=c.getContext('2d'),w=c.width,h=c.height,cx=w/2,cy=h*.8,sx=65,sy=14;ctx.clearRect(0,0,w,h);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--line2');ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.stroke();ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent');ctx.lineWidth=2;ctx.beginPath();for(let px=0;px<w;px++){let x=(px-cx)/sx,y=x*x,py=cy-y*sy;if(px===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();const m=2*x0,y0=x0*x0;ctx.strokeStyle='#86b89c';ctx.beginPath();for(let x=-6;x<=6;x+=.1){let y=y0+m*(x-x0),px=cx+x*sx,py=cy-y*sy;if(x===-6)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();$('[data-slope]',stage).textContent=`For f(x)=x² at x=${x0.toFixed(1)}, the tangent slope f′(x)=2x is ${m.toFixed(1)}.`};$('input',controls).oninput=draw;draw();return;
    }
    if(type==='matrix'){
      stage.innerHTML='<canvas class="math-canvas" width="700" height="250"></canvas><p data-mat class="muted"></p>';controls.innerHTML='<label>Rotation angle <input type="range" min="0" max="360" value="35" data-angle></label>';
      const draw=()=>{let deg=+$('[data-angle]',controls).value,r=deg*Math.PI/180,c=$('canvas',stage),ctx=c.getContext('2d'),w=c.width,h=c.height,cx=w/2,cy=h/2,s=55;ctx.clearRect(0,0,w,h);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--line2');ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.stroke();let x=Math.cos(r),y=Math.sin(r);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent');ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+x*s*2,cy-y*s*2);ctx.stroke();$('[data-mat]',stage).textContent=`Rotation matrix ≈ [[${Math.cos(r).toFixed(2)}, ${(-Math.sin(r)).toFixed(2)}], [${Math.sin(r).toFixed(2)}, ${Math.cos(r).toFixed(2)}]]`};$('input',controls).oninput=draw;draw();return;
    }
    if(type==='force'){
      stage.innerHTML='<div class="metric-grid"><div class="metric"><span>Force</span><strong data-force>20 N</strong></div><div class="metric"><span>Mass</span><strong data-mass>10 kg</strong></div><div class="metric"><span>Acceleration</span><strong data-acc>2.00 m/s²</strong></div><div class="metric"><span>Model</span><strong>F = ma</strong></div></div>';controls.innerHTML='<label>Force <input type="range" min="-100" max="100" value="20" data-f> N</label><label>Mass <input type="range" min="1" max="50" value="10" data-m> kg</label>';const upd=()=>{let f=+$('[data-f]',controls).value,m=+$('[data-m]',controls).value;$('[data-force]',stage).textContent=f+' N';$('[data-mass]',stage).textContent=m+' kg';$('[data-acc]',stage).textContent=(f/m).toFixed(2)+' m/s²'};$$('input',controls).forEach(x=>x.oninput=upd);upd();return;
    }
    if(type==='projectile'){
      stage.innerHTML='<canvas class="math-canvas" width="700" height="260"></canvas><div class="metric-grid"><div class="metric"><span>Range</span><strong data-range>—</strong></div><div class="metric"><span>Flight time</span><strong data-flight>—</strong></div><div class="metric"><span>Max height</span><strong data-height>—</strong></div><div class="metric"><span>Gravity</span><strong>9.81 m/s²</strong></div></div>';
      controls.innerHTML='<label>Launch speed <input type="range" min="5" max="50" value="25" data-v0> <span data-v0-label>25 m/s</span></label><label>Angle <input type="range" min="10" max="80" value="45" data-angle0> <span data-angle-label>45°</span></label>';
      const draw=()=>{const v=+$('[data-v0]',controls).value,deg=+$('[data-angle0]',controls).value,th=deg*Math.PI/180,g=9.81,T=2*v*Math.sin(th)/g,R=v*v*Math.sin(2*th)/g,H=(v*Math.sin(th))**2/(2*g),c=$('canvas',stage),ctx=c.getContext('2d'),w=c.width,h=c.height,pad=34,sx=(w-pad*2)/Math.max(R,1),sy=(h-pad*2)/Math.max(H*1.25,1);ctx.clearRect(0,0,w,h);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--line2');ctx.beginPath();ctx.moveTo(pad,h-pad);ctx.lineTo(w-pad,h-pad);ctx.stroke();ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent');ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=100;i++){const t=T*i/100,x=v*Math.cos(th)*t,y=v*Math.sin(th)*t-.5*g*t*t,px=pad+x*sx,py=h-pad-y*sy;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.stroke();$('[data-range]',stage).textContent=R.toFixed(1)+' m';$('[data-flight]',stage).textContent=T.toFixed(2)+' s';$('[data-height]',stage).textContent=H.toFixed(1)+' m';$('[data-v0-label]',controls).textContent=v+' m/s';$('[data-angle-label]',controls).textContent=deg+'°'};$$('input',controls).forEach(x=>x.oninput=draw);draw();return;
    }
    if(type==='doppler'){
      stage.innerHTML='<canvas class="wave-canvas" width="700" height="220"></canvas><div class="metric-grid"><div class="metric"><span>Emitted</span><strong data-dop-f>440 Hz</strong></div><div class="metric"><span>Source speed</span><strong data-dop-vs>30 m/s</strong></div><div class="metric"><span>Observed</span><strong data-dop-out>482 Hz</strong></div><div class="metric"><span>Motion</span><strong data-dop-dir>Approaching</strong></div></div>';
      controls.innerHTML='<label>Source frequency <input type="range" min="180" max="700" value="440" data-df></label><label>Source speed <input type="range" min="0" max="100" value="30" data-dvs></label><label>Direction <select data-ddir><option value="approach">Approaching</option><option value="recede">Receding</option></select></label><button class="button" data-hear-source>▶ Emitted</button><button class="button primary" data-hear-observed>▶ Observed</button>';
      const calc=()=>{const f=+$('[data-df]',controls).value,vs=+$('[data-dvs]',controls).value,dir=$('[data-ddir]',controls).value,cSound=343,obs=dir==='approach'?f*cSound/(cSound-vs):f*cSound/(cSound+vs),canvas=$('canvas',stage),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,center=w*.38;ctx.clearRect(0,0,w,h);ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent');ctx.beginPath();ctx.arc(center,h/2,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--line2');const spacing=Math.max(12,50*(dir==='approach'?(cSound-vs)/cSound:(cSound+vs)/cSound));for(let x=center+spacing;x<w;x+=spacing){ctx.beginPath();ctx.arc(center,h/2,x-center,-Math.PI/3,Math.PI/3);ctx.stroke()}for(let x=center-spacing;x>0;x-=Math.max(12,50*(dir==='approach'?(cSound+vs)/cSound:(cSound-vs)/cSound))){ctx.beginPath();ctx.arc(center,h/2,center-x,Math.PI-Math.PI/3,Math.PI+Math.PI/3);ctx.stroke()}$('[data-dop-f]',stage).textContent=Math.round(f)+' Hz';$('[data-dop-vs]',stage).textContent=vs+' m/s';$('[data-dop-out]',stage).textContent=Math.round(obs)+' Hz';$('[data-dop-dir]',stage).textContent=dir==='approach'?'Approaching':'Receding';stage.dataset.obs=obs;stage.dataset.src=f};$$('input,select',controls).forEach(x=>x.oninput=calc);$('[data-hear-source]',controls).onclick=()=>explicitTone(Math.min(1000,+stage.dataset.src),.6,.025);$('[data-hear-observed]',controls).onclick=()=>explicitTone(Math.min(1000,+stage.dataset.obs),.6,.025);calc();return;
    }
    if(type==='wave'){
      stage.innerHTML='<canvas class="wave-canvas" width="700" height="220"></canvas><div class="metric-grid"><div class="metric"><span>Frequency</span><strong data-freq>440 Hz</strong></div><div class="metric"><span>Amplitude</span><strong data-amp>50%</strong></div><div class="metric"><span>Period</span><strong data-period>2.27 ms</strong></div><div class="metric"><span>Audio</span><strong data-audio>Off</strong></div></div>';
      controls.innerHTML='<label>Frequency <input type="range" min="110" max="880" value="440" data-freq-range></label><label>Amplitude <input type="range" min="5" max="80" value="50" data-amp-range></label><button class="button primary" data-hear>▶ Hear wave</button><button class="button" data-stop-wave hidden>■ Stop</button>';
      let osc=null,gain=null; const draw=()=>{let f=+$('[data-freq-range]',controls).value,a=+$('[data-amp-range]',controls).value/100,c=$('canvas',stage),ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--line2');ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent');ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<w;x++){let cycles=(f/110)*2,y=h/2-Math.sin((x/w)*Math.PI*2*cycles)*a*(h*.42);x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();$('[data-freq]',stage).textContent=f+' Hz';$('[data-amp]',stage).textContent=Math.round(a*100)+'%';$('[data-period]',stage).textContent=(1000/f).toFixed(2)+' ms';if(osc){osc.frequency.setValueAtTime(f,audioCtx.currentTime);gain.gain.setValueAtTime(Math.min(.04,a*.04),audioCtx.currentTime)}};$$('input',controls).forEach(x=>x.oninput=draw);$('[data-hear]',controls).onclick=()=>{try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.type='sine';osc.connect(gain).connect(audioCtx.destination);osc.start();$('[data-hear]',controls).hidden=true;$('[data-stop-wave]',controls).hidden=false;$('[data-audio]',stage).textContent='Playing';draw()}catch{toast('Audio oscillator unavailable in this browser')}};$('[data-stop-wave]',controls).onclick=()=>{try{osc?.stop()}catch{}osc=null;gain=null;$('[data-hear]',controls).hidden=false;$('[data-stop-wave]',controls).hidden=true;$('[data-audio]',stage).textContent='Off'};draw();return;
    }
    if(type==='ohm'){
      stage.innerHTML='<div class="metric-grid"><div class="metric"><span>Voltage</span><strong data-v>12 V</strong></div><div class="metric"><span>Resistance</span><strong data-r>6 Ω</strong></div><div class="metric"><span>Current</span><strong data-i>2 A</strong></div><div class="metric"><span>Power</span><strong data-p>24 W</strong></div></div>';controls.innerHTML='<label>Voltage <input type="range" min="1" max="48" value="12" data-vr></label><label>Resistance <input type="range" min="1" max="100" value="6" data-rr></label>';const upd=()=>{let v=+$('[data-vr]',controls).value,r=+$('[data-rr]',controls).value,i=v/r;$('[data-v]',stage).textContent=v+' V';$('[data-r]',stage).textContent=r+' Ω';$('[data-i]',stage).textContent=i.toFixed(2)+' A';$('[data-p]',stage).textContent=(v*i).toFixed(2)+' W'};$$('input',controls).forEach(x=>x.oninput=upd);upd();return;
    }
  }

  function randomLesson(){const l=D.lessons[Math.floor(Math.random()*D.lessons.length)];openLesson(l.id);ping(610)}
  function clearFilters(){ $('#knowledge-search').value='';$('#domain-filter').value='all';$('#level-filter').value='all';$('#type-filter').value='all';$('#saved-filter').checked=false;displayLimit=18;renderLessons(); }

  function updateReadingProgress(){
    if(!currentLesson)return; const doc=document.documentElement, max=doc.scrollHeight-innerHeight, pct=max>0?scrollY/max*100:0; $('#reading-progress').style.width=Math.min(100,Math.max(0,pct))+'%';
  }
  function constellation(){
    const canvas=$('#constellation'),ctx=canvas.getContext('2d');let nodes=[],raf=0;
    function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);const w=r.width,h=r.height;if(!nodes.length)nodes=D.domains.map((d,i)=>({x:w*(.18+.65*((i*37)%100)/100),y:h*(.18+.65*((i*61)%100)/100),vx:(i%2?.12:-.1),vy:(i%3?.08:-.07),label:d.name.split(' ')[0]}))}
    function draw(){const r=canvas.getBoundingClientRect(),w=r.width,h=r.height,styles=getComputedStyle(document.documentElement),line=styles.getPropertyValue('--line2'),accent=styles.getPropertyValue('--accent'),text=styles.getPropertyValue('--muted');ctx.clearRect(0,0,w,h);ctx.lineWidth=1;for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){let a=nodes[i],b=nodes[j],dist=Math.hypot(a.x-b.x,a.y-b.y);if(dist<220){ctx.globalAlpha=Math.max(0,.45-dist/500);ctx.strokeStyle=line;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}ctx.globalAlpha=1;nodes.forEach((n,i)=>{if(!motionPaused){n.x+=n.vx;n.y+=n.vy;if(n.x<35||n.x>w-35)n.vx*=-1;if(n.y<30||n.y>h-30)n.vy*=-1}ctx.fillStyle=i===0?accent:text;ctx.beginPath();ctx.arc(n.x,n.y,i===0?5:3,0,Math.PI*2);ctx.fill();ctx.font='11px system-ui';ctx.fillStyle=text;ctx.fillText(n.label,n.x+9,n.y+4)});raf=requestAnimationFrame(draw)}
    resize();draw();window.addEventListener('resize',()=>{nodes=[];resize()});
  }

  function initEvents(){
    ['input','change'].forEach(ev=>$('#knowledge-search').addEventListener(ev,()=>{displayLimit=18;renderLessons()}));
    ['domain-filter','level-filter','type-filter','saved-filter'].forEach(id=>$('#'+id).addEventListener('change',()=>{displayLimit=18;renderLessons()}));
    $('#glossary-search').addEventListener('input',()=>{glossaryLetter='all';renderGlossary()});
    $('#load-more').onclick=()=>{displayLimit+=18;renderLessons()};$('#clear-filters').onclick=clearFilters;$('#surprise-me').onclick=randomLesson;
    $$('[data-scroll]').forEach(b=>b.onclick=()=>$(b.dataset.scroll).scrollIntoView({behavior:motionPaused?'auto':'smooth'}));
    $('#sound-mode').onclick=()=>{soundMode=soundMode==='off'?'educational':soundMode==='educational'?'full':'off';localStorage.setItem(STORAGE.sound,soundMode);updateSoundButton();toast(`Sound: ${soundMode}`);if(soundMode!=='off')ping(590)};
    $('#motion-mode').onclick=()=>{motionPaused=!motionPaused;document.body.classList.toggle('motion-paused',motionPaused);localStorage.setItem(STORAGE.motion,motionPaused?'paused':'active');$('#motion-mode').textContent=motionPaused?'▶':'◫';$('#motion-mode').setAttribute('aria-label',motionPaused?'Resume animation':'Pause animation');toast(motionPaused?'Animation paused':'Animation resumed')};
    $('#theme-mode').onclick=()=>{const next=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=next;localStorage.setItem(STORAGE.theme,next);renderKnowledgeGraph();toast(`${next[0].toUpperCase()+next.slice(1)} theme`)};
    $('#mobile-menu').onclick=()=>{const nav=$('.site-header nav'),open=nav.classList.toggle('open');$('#mobile-menu').setAttribute('aria-expanded',String(open))};
    document.addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);if((e.key==='/'||(e.key.toLowerCase()==='k'&&(e.ctrlKey||e.metaKey)))&&!typing){e.preventDefault();if(currentLesson)closeLesson();setTimeout(()=>$('#knowledge-search').focus(),0)}if(e.key==='Escape'&&currentLesson)closeLesson();if((e.key==='r'||e.key==='R')&&!typing&&!currentLesson)randomLesson();if((e.key==='g'||e.key==='G')&&!typing&&!currentLesson){e.preventDefault();$('#glossary').scrollIntoView({behavior:motionPaused?'auto':'smooth'});setTimeout(()=>$('#glossary-search').focus(),250)}});
    window.addEventListener('scroll',()=>requestAnimationFrame(updateReadingProgress),{passive:true});
    let graphResize;window.addEventListener('resize',()=>{clearTimeout(graphResize);graphResize=setTimeout(renderKnowledgeGraph,120)});
    window.addEventListener('popstate',()=>route(false));
    document.addEventListener('click',e=>{if(soundMode==='full'&&e.target.closest('button,a'))ping(330,.035,.012)});
  }
  function route(push=false){
    const u=new URL(location.href), lesson=u.searchParams.get('lesson'), dom=u.searchParams.get('domain'), q=u.searchParams.get('q');
    if(lesson&&lessonMap.has(lesson)){openLesson(lesson,false);return}
    if(currentLesson) closeLesson(false);
    if(dom&&domainMap.has(dom)) $('#domain-filter').value=dom;
    if(q) $('#knowledge-search').value=q;
    renderLessons();
  }

  initPrefs(); renderStats(); renderFilters(); renderDomains(); renderContinue(); renderCurriculum(); renderLessons(); renderPaths(); renderAtlas(); renderGlossary(); renderKnowledgeGraph(); initEvents(); constellation(); route(false);
})();
