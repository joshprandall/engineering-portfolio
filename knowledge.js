(() => {
  'use strict';
  const preferences = {
    getItem(key) { try { return localStorage.getItem(key); } catch { try { return sessionStorage.getItem(key); } catch { return null; } } },
    setItem(key, value) { try { localStorage.setItem(key, value); } catch { try { sessionStorage.setItem(key, value); } catch {} } },
    removeItem(key) { try { localStorage.removeItem(key); } catch { try { sessionStorage.removeItem(key); } catch {} } }
  };
  const D = window.JR_KNOWLEDGE;
  if (!D) return;
  if(!document.querySelector('link[href^="handheld-experience.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='handheld-experience.css?v=20260924-release';document.head.append(l);}
  if(!document.querySelector('script[src^="handheld-experience.js"]')){const s=document.createElement('script');s.src='handheld-experience.js?v=20260924-release';s.defer=true;document.body.append(s);}
  if(!document.querySelector('link[href^="learning-depth.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='learning-depth.css?v=20260924-glass-v4';document.head.append(l);}
  if(!document.querySelector('script[src^="learning-depth.js"]')){const s=document.createElement('script');s.src='learning-depth.js?v=20260924-clean-home-v1';s.defer=true;document.body.append(s);}

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const lessonMap = new Map(D.lessons.map(x => [x.id, x]));
  const domainMap = new Map(D.domains.map(x => [x.id, x]));
  const STORAGE = {
    saved:'jr-knowledge-saved', complete:'jr-knowledge-complete', theme:'jr-knowledge-theme',
    sound:'jr-knowledge-sound', motion:'jr-knowledge-motion', recent:'jr-knowledge-recent',
    focus:'jr-knowledge-focus', narrationRate:'jr-knowledge-narration-rate', narrationVoice:'jr-knowledge-narration-voice',
    recall:'jr-knowledge-recall-v1', flashcards:'jr-knowledge-flashcards-v1',
    learnerMode:'jr-knowledge-learner-mode-v1', videoPins:'jr-knowledge-video-pins-v1', reviewPlan:'jr-knowledge-review-plan-v1', teachback:'jr-knowledge-teachback-v1'
  };
  const loadSet = key => { try { return new Set(JSON.parse(preferences.getItem(key)||'[]')); } catch { return new Set(); } };
  const saveSet = (key, set) => preferences.setItem(key, JSON.stringify([...set]));

  let saved = loadSet(STORAGE.saved);
  let completed = loadSet(STORAGE.complete);
  let displayLimit = 18;
  let currentLesson = null;
  let speechState = 'idle';
  let currentUtterance = null;
  let speechQueue = [];
  let speechQueueIndex = 0;
  let availableVoices = [];
  let lessonViewName = 'overview';
  let audioCtx = null;
  let soundMode = preferences.getItem(STORAGE.sound) || 'off';
  let motionPaused = window.PortfolioTheme?.isPaused() || false;
  let curriculumDomain = 'cloud';
  let glossaryLetter = 'all';
  let graphSelection = 'cloud';
  let focusReading = preferences.getItem(STORAGE.focus) === 'on';
  let learnerMode = preferences.getItem(STORAGE.learnerMode) || 'general';
  let videoPins = (()=>{try{return JSON.parse(preferences.getItem(STORAGE.videoPins)||'{}')}catch{return {}}})();
  let reviewPlan = (()=>{try{return JSON.parse(preferences.getItem(STORAGE.reviewPlan)||'{}')}catch{return {}}})();
  let teachbackState = (()=>{try{return JSON.parse(preferences.getItem(STORAGE.teachback)||'{}')}catch{return {}}})();
  const deepLessonCache = new Map(), deepChunkLoads = new Map();
  let recallState = (()=>{try{return JSON.parse(preferences.getItem(STORAGE.recall)||'{}')}catch{return {}}})();
  let flashState = (()=>{try{return JSON.parse(preferences.getItem(STORAGE.flashcards)||'{}')}catch{return {}}})();
  let recallLessonId = null, flashIndex = 0, flashRevealed = false, labLimit = 12, labDomain='all', labDifficulty='all', sprintState=null;

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
    const verified=D.lessons.filter(l=>l.verification?.status==='verified').length;
    const vc=$('#verified-count'); if(vc)vc.textContent=verified.toLocaleString();
    const vr=$('#verification-ratio'); if(vr)vr.textContent=`${verified.toLocaleString()} / ${D.lessons.length.toLocaleString()}`;
    const vd=$('#verification-date'); if(vd)vd.textContent=D.verificationPolicy?.reviewed||D.lastReviewed;
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
      const go=()=>{ location.href=`learn-browse.html?domain=${encodeURIComponent(card.dataset.domain)}`; };
      card.addEventListener('click',go); card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
    });
  }
  function renderFilters(){
    $('#domain-filter').insertAdjacentHTML('beforeend',D.domains.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join(''));
  }

  function renderContinue(){
    const id=preferences.getItem(STORAGE.recent), l=lessonMap.get(id), box=$('#continue-learning');
    if(!l){box.hidden=true;return}
    const d=domainMap.get(l.domain); box.hidden=false;
    $('#continue-title').textContent=l.title;
    $('#continue-copy').textContent=`${d.name} · ${l.category} · ${l.minutes} min · stored only in this browser.`;
    $('#continue-button').onclick=()=>openLesson(l.id);
    $('#clear-history').onclick=()=>{preferences.removeItem(STORAGE.recent);box.hidden=true;toast('Recent lesson cleared')};
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
  function standaloneExperienceURL(l,view='lab'){
    const u=new URL('learn-labs.html',location.href);
    u.searchParams.set('lesson',l.id);u.searchParams.set('view',view);u.searchParams.set('standalone','1');
    return u.href;
  }
  function isInteractiveExperience(l){return Boolean(l.interactive)||l.kind==='Lab';}
  function lessonCard(l){
    const d=domainMap.get(l.domain), isSaved=saved.has(l.id), isDone=completed.has(l.id), pop=isInteractiveExperience(l);
    return `<article class="lesson-card${isDone?' completed':''}${pop?' standalone-tile':''}" tabindex="0" role="link" data-lesson="${esc(l.id)}" data-popout="${pop?'1':'0'}" aria-label="${pop?'Open interactive experience in a new tab: ':'Open '}${esc(l.title)}">
      <div class="topline"><span class="kind">${esc(l.kind)}</span><span>·</span><span>${esc(d.name)}</span><span class="verified-mini" title="Evidence links are available inside this lesson">✓ Verified</span></div>
      <h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p>
      <div class="bottomline"><span>${esc(l.difficulty)} · ${l.minutes} min${pop?' · opens full screen':''}</span><button class="save-mini${isSaved?' saved':''}" type="button" data-save="${esc(l.id)}" aria-label="${isSaved?'Remove from saved':'Save lesson'}">${isSaved?'♥':'♡'}</button></div>
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
      const go=()=>{
        const l=lessonMap.get(card.dataset.lesson);if(!l)return;
        if(card.dataset.popout==='1'){
          window.open(standaloneExperienceURL(l,'lab'),'_blank','noopener,noreferrer');
        }else openLesson(l.id);
      };
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
      return `<article class="path-card"><div><p class="eyebrow">${esc(domainMap.get(p.domain).name)} / ${esc(p.level||p.difficulty||'Mixed')}</p><h3>${esc(p.title)}</h3><p>${esc(p.description||p.summary||'An ordered sequence of learning objects and practice.')}</p>
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
  function evidenceSection(l){
    const refs=l.references||[], v=l.verification||{}, claims=(l.verifiedClaims&&l.verifiedClaims.length?l.verifiedClaims:[l.summary]).filter(Boolean), parent=v.parentLessonId?lessonMap.get(v.parentLessonId):null;
    const links=refs.map((r,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><div><a href="${esc(r[1])}" target="_blank" rel="noopener noreferrer">${esc(r[0])} ↗</a><small>Primary / authoritative evidence used for this learning object</small></div></li>`).join('');
    const ledger=claims.map((c,i)=>`<li><span>✓</span><div><strong>Claim ${i+1}</strong><p>${esc(c)}</p></div></li>`).join('');
    const provenance=parent?`<div class="provenance-box"><p class="eyebrow">DERIVED LEARNING OBJECT</p><h3>Practice built from a verified parent lesson</h3><p>This object changes how you practice the idea; it does not manufacture a new technical fact. Its factual boundary is inherited from the parent lesson.</p><button class="text-button" type="button" data-open-deep="${esc(parent.id)}">Open parent: ${esc(parent.title)} →</button></div>`:'';
    const guide=`<div class="source-reading-guide"><article><span>1</span><strong>Read the claim first</strong><p>Know exactly what statement the evidence is being used to support.</p></article><article><span>2</span><strong>Open the source</strong><p>Locate the relevant standard, official documentation, government guidance, paper, or academic text.</p></article><article><span>3</span><strong>Check scope and version</strong><p>Ask whether the source is current and whether its scope matches the situation you are applying it to.</p></article><article><span>4</span><strong>Separate fact from teaching</strong><p>Analogies, examples, visuals, labs, and YouTube companions help learning; they do not replace the authoritative evidence.</p></article></div>`;
    return section('evidence','Evidence & verification',`<div class="verification-box"><div class="verification-box-head"><span class="verified-seal">✓</span><div><strong>Source-verified</strong><p>${esc(v.method||'Cross-checked against the cited evidence.')}</p></div></div><div class="verification-facts"><span><b>Reviewed</b>${esc(v.reviewed||D.lastReviewed)}</span><span><b>Claim type</b>${esc(v.claimType||'Technical concept')}</span><span><b>Sources</b>${refs.length}</span><span><b>Version-sensitive</b>${l.versionSensitive?'Yes — re-check current docs':'No known version dependency'}</span></div>${l.versionSensitive?'<div class="version-notice"><strong>↻ Version-sensitive</strong><p>This concept or procedure can change as a product, project, or standard evolves. Use the linked current documentation when applying it operationally.</p></div>':''}<div class="claim-ledger"><p class="eyebrow">VERIFIED CLAIM LEDGER</p><ol>${ledger}</ol><small>Every published learning object must expose at least one testable claim and direct evidence. The evidence is provided so you can independently check the site.</small></div>${provenance}<p class="eyebrow">HOW TO CHECK THE SOURCE</p>${guide}<ol class="evidence-list">${links}</ol></div>`);
  }
  const LESSON_VIEWS = [
    ['overview','Overview'],['explain','Explain'],['visual','Visual'],['video','Video'],['lab','Lab'],['practice','Practice'],['review','Review'],['evidence','Evidence']
  ];
  function lessonViewFromURL(){const v=new URL(location.href).searchParams.get('view');return LESSON_VIEWS.some(x=>x[0]===v)?v:'overview'}
  function lessonTabs(){return `<nav class="lesson-page-tabs" aria-label="Lesson pages">${LESSON_VIEWS.map(([id,label])=>`<button type="button" data-lesson-view="${id}" aria-current="${lessonViewName===id?'page':'false'}" class="${lessonViewName===id?'active':''}">${label}</button>`).join('')}</nav>`}
  function deepSlug(v=''){return String(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'general'}
  function deepChunkPath(l){return `deep-learning/${encodeURIComponent(l.domain)}/${deepSlug(l.category)}.json`}
  function deepFallback(l){
    const claim=(l.verifiedClaims&&l.verifiedClaims[0])||l.takeaway||l.summary;
    const analogies={cloud:'Analogy — not literal: picture a city of services with addresses, routes, rules, and responsibilities. Use the picture only to organize the idea.',advanced:'Analogy — not literal: picture a workshop with specialized tools and workers. Different resources do different jobs and coordination matters.',software:'Analogy — not literal: picture a recipe being carried out with ingredients, tools, tests, and feedback.',cyber:'Analogy — not literal: doors, keys, checkpoints, and records can help separate identity, authorization, barriers, and evidence.',leadership:'Analogy — not literal: picture a control room where people need roles, signals, priorities, communication, and feedback.',math:'Analogy — not literal: mathematics can be treated like a language for patterns and relationships; the analogy is not a proof.',physics:'Analogy — not literal: a model is like a carefully labeled map; the map is not the physical system itself.'};
    return {essentialQuestion:`What does ${l.title} mean, why does it matter, how can it be used, and how can the central claim be checked?`,verifiedBoundary:claim,analogy:analogies[l.domain]||'',starter:{plainStart:`Start with one idea: ${l.takeaway||l.summary}`,tryThis:`Use the lesson example as a practice situation: ${l.example}`,helper:'If a word is unfamiliar, pause and define it before adding more detail.'},technical:{scope:'Use the cited evidence to support the verified claim only. Do not infer details that the sources do not establish.',versionCaution:l.versionSensitive?'Check current documentation before operational use.':'Use the cited evidence as the authority for the published claim.',prerequisites:(l.prereq||[]).map(id=>lessonMap.get(id)?.title).filter(Boolean),connections:(l.related||[]).map(id=>lessonMap.get(id)?.title).filter(Boolean)},reasoningSteps:['State the question in your own words.','Identify the verified claim.','Trace the explanation one step at a time.','Apply the idea to the worked example.','Challenge the common misconception.','Open a cited source and verify the claim.'],memoryLadder:[`Explain “${l.title}” in one sentence without looking.`,'List the important vocabulary.','Recreate the example from memory.','Name one misconception to avoid.','Point to the verified claim and its evidence.','Teach the idea once simply and once technically.'],labPlan:['Predict the outcome first.','Write the assumption you are testing.','Run the model or work the scenario.','Compare the result with the verified claim.','Change one condition and explain what changes.','Open the Evidence view and verify the claim.'],vocabulary:[],video:{youtubeId:'',title:'Video companion loading…',channel:'',why:'Supplementary video; evidence remains in the Evidence view.',searchQuery:`${l.title} tutorial`}};
  }
  function deepGuide(l){return deepLessonCache.get(l.id)||deepFallback(l)}
  function ensureDeepLearning(l){
    if(deepLessonCache.has(l.id))return Promise.resolve(deepLessonCache.get(l.id));
    const path=deepChunkPath(l);
    if(!deepChunkLoads.has(path))deepChunkLoads.set(path,fetch(path,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error(`Deep-learning pack ${r.status}`);return r.json()}).then(pack=>{Object.entries(pack).forEach(([id,g])=>deepLessonCache.set(id,g));return pack}).catch(()=>null));
    return deepChunkLoads.get(path).then(()=>deepLessonCache.get(l.id)||deepFallback(l));
  }
  function audienceLabel(){return learnerMode==='starter'?'Starter / young learner':learnerMode==='technical'?'Technical depth':learnerMode==='research'?'Research bridge':'General learner'}
  function modeSwitcherHTML(){return `<div class="learning-mode-bar"><div><span class="eyebrow">LEARNING MODE</span><strong>${esc(audienceLabel())}</strong><small>Same verified claim, different scaffolding. Research Bridge adds paper-reading and reproducibility prompts without pretending a single lesson is a doctoral course.</small></div><label>Depth <select id="learner-mode" aria-label="Learning mode"><option value="starter" ${learnerMode==='starter'?'selected':''}>Starter / young learner</option><option value="general" ${learnerMode==='general'?'selected':''}>General learner</option><option value="technical" ${learnerMode==='technical'?'selected':''}>Technical depth</option><option value="research" ${learnerMode==='research'?'selected':''}>Research bridge</option></select></label></div>`}
  function vocabularyHTML(g){
    const items=(g.vocabulary||[]).filter(x=>x.term&&x.definition);
    if(!items.length)return `<div class="vocab-empty"><strong>Vocabulary strategy</strong><p>Underline unfamiliar words in the explanation, search the site glossary, then return and explain the sentence again.</p></div>`;
    return `<div class="vocab-grid">${items.map(x=>`<details><summary>${esc(x.term)}</summary><p>${esc(x.definition)}</p></details>`).join('')}</div>`;
  }
  function reasoningHTML(g){return `<ol class="reasoning-steps">${(g.reasoningSteps||[]).map((x,i)=>`<li><span>${i+1}</span><p>${esc(x)}</p></li>`).join('')}</ol>`}
  function connectionsHTML(l,g){
    const prereq=(l.prereq||[]).map(id=>lessonMap.get(id)).filter(Boolean), related=(l.related||[]).map(id=>lessonMap.get(id)).filter(Boolean);
    return `<div class="connection-columns"><article><p class="eyebrow">BUILD FIRST</p>${prereq.length?prereq.map(x=>`<button class="text-button" data-open-deep="${esc(x.id)}">${esc(x.title)} →</button>`).join(''):'<p>No formal prerequisite is required for this learning object.</p>'}</article><article><p class="eyebrow">CONNECT NEXT</p>${related.length?related.slice(0,6).map(x=>`<button class="text-button" data-open-deep="${esc(x.id)}">${esc(x.title)} →</button>`).join(''):'<p>Use the learning path and knowledge map to connect this concept.</p>'}</article></div>`;
  }
  function researchBridgeHTML(l,g){
    const refs=(l.references||[]).slice(0,5);
    const prereq=(l.prereq||[]).map(id=>lessonMap.get(id)).filter(Boolean);
    return `<div class="research-bridge"><div class="research-bridge-head"><p class="eyebrow">RESEARCH BRIDGE / EVIDENCE-FIRST STUDY</p><h3>Move from knowing the claim to interrogating it.</h3><p>This mode uses the lesson as a launch point for graduate-style reading habits. It does not label the lesson itself as graduate or doctoral-level unless that depth has been explicitly authored and reviewed.</p></div><div class="research-grid"><article><span>01</span><strong>Assumptions</strong><p>List the assumptions that must hold for the verified claim to remain true. Separate model assumptions from empirical observations.</p></article><article><span>02</span><strong>Primary evidence</strong><p>${refs.length?`Inspect ${refs.length} cited source${refs.length===1?'':'s'} and identify which one most directly supports the claim.`:'Use the Evidence view to identify an authoritative source before extending the claim.'}</p></article><article><span>03</span><strong>Boundary / falsification</strong><p>Describe a condition, counterexample, measurement, or version change that would limit the claim or require a narrower statement.</p></article><article><span>04</span><strong>Reproduce</strong><p>Recreate the worked example, calculation, configuration, or experiment independently. Record inputs, assumptions, and expected output before checking the answer.</p></article><article><span>05</span><strong>Prerequisites</strong><p>${prereq.length?`Required bridge concepts: ${prereq.slice(0,4).map(x=>esc(x.title)).join(' · ')}.`:'No formal prerequisite is encoded; identify any mathematics, systems, or domain knowledge you still need.'}</p></article><article><span>06</span><strong>Research question</strong><p>Write one extension worth investigating: a different scale, environment, assumption, dataset, architecture, error model, or competing explanation.</p></article></div><div class="research-actions"><button class="button primary" type="button" data-jump-view="evidence">Open primary evidence →</button><button class="button" type="button" data-jump-view="lab">Reproduce / test →</button></div></div>`;
  }
  function explainHTML(l,g){
    const misconception=l.misconception?`<div class="misconception"><p>${esc(l.misconception)}</p></div>`:`<div class="misconception"><p>Ask what the verified claim does <em>not</em> establish. Avoid turning an example or analogy into a universal rule.</p></div>`;
    if(learnerMode==='starter')return `${section('big-idea','Start with the big idea',`<div class="starter-card"><p>${esc(g.starter?.plainStart||l.takeaway)}</p></div>`)}${section('analogy','Build a mental picture',`<div class="analogy-card"><strong>Analogy — not literal</strong><p>${esc(g.analogy)}</p></div>`)}${section('concept','Now learn the real concept',paras(l.explanation))}${section('words','Words to know',vocabularyHTML(g))}${section('example','Try the example',`<div class="callout"><strong>Practice situation</strong><p>${esc(l.example)}</p><p class="muted">${esc(g.starter?.tryThis||'Predict first, then compare.')}</p></div>`)}${section('misconception','What can fool you',misconception)}${section('teach-simple','Say it back',`<div class="teach-prompt"><p>Explain this to someone younger than you without losing the verified idea:</p><strong>${esc(g.verifiedBoundary)}</strong></div>`)}<div class="overview-next"><button class="button primary" type="button" data-jump-view="visual">See the Visual →</button></div>`;
    if(learnerMode==='technical')return `${section('claim','Verified claim first',`<div class="claim-focus"><span>✓</span><p>${esc(g.verifiedBoundary)}</p></div>`)}${section('concept','Mechanism / reasoning',paras(l.explanation))}${section('reasoning','Reason through it',reasoningHTML(g))}${section('scope','Technical scope & cautions',`<div class="technical-scope"><p><strong>Evidence boundary.</strong> ${esc(g.technical?.scope)}</p><p><strong>Version check.</strong> ${esc(g.technical?.versionCaution)}</p></div>`)}${section('connections','Prerequisites & connections',connectionsHTML(l,g))}${section('example','Worked application',`<p>${esc(l.example)}</p>`)}${section('misconception','Failure mode in reasoning',misconception)}<div class="overview-next"><button class="button primary" type="button" data-jump-view="visual">Inspect the Visual →</button></div>`;
    if(learnerMode==='research')return `${section('claim','Verified claim first',`<div class="claim-focus"><span>✓</span><p>${esc(g.verifiedBoundary)}</p></div>`)}${section('research-bridge','Research bridge',researchBridgeHTML(l,g))}${section('concept','Mechanism / reasoning',paras(l.explanation))}${section('scope','Scope, assumptions & cautions',`<div class="technical-scope"><p><strong>Evidence boundary.</strong> ${esc(g.technical?.scope)}</p><p><strong>Version check.</strong> ${esc(g.technical?.versionCaution)}</p></div>`)}${section('connections','Prerequisite graph',connectionsHTML(l,g))}${section('reasoning','Reason through it',reasoningHTML(g))}<div class="overview-next"><button class="button primary" type="button" data-jump-view="evidence">Read the Evidence →</button></div>`;
    return `${section('concept','The concept',paras(l.explanation))}${section('why','Why it matters',`<div class="callout"><strong>Why this matters</strong><p>${esc(l.why)}</p></div>`)}${section('reasoning','A six-step way to reason about it',reasoningHTML(g))}${section('words','Vocabulary',vocabularyHTML(g))}${section('example','Worked example',`<p>${esc(l.example)}</p>`)}${section('misconception','Common misconception / evidence boundary',misconception)}${section('connections','Build connections',connectionsHTML(l,g))}<div class="overview-next"><button class="button primary" type="button" data-jump-view="visual">Continue to Visual →</button></div>`;
  }
  function conceptVisualHTML(l,g){
    const refs=(l.references||[]).map(r=>r[0]).slice(0,3).join(' · ')||'See the Evidence view';
    const nodes=[['Verified claim',g.verifiedBoundary],['Why it matters',l.why],['Worked example',l.example],['Watch for',l.misconception||'Do not extend the conclusion beyond the evidence.'],['Remember',l.takeaway],['Evidence',refs]];
    const positions=[[18,20],[82,20],[12,72],[88,72],[50,91],[50,9]];
    return `<div class="concept-visual-wrap"><div class="concept-visual" aria-label="Interactive concept map for ${esc(l.title)}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="50" y1="50" x2="18" y2="20"/><line x1="50" y1="50" x2="82" y2="20"/><line x1="50" y1="50" x2="12" y2="72"/><line x1="50" y1="50" x2="88" y2="72"/><line x1="50" y1="50" x2="50" y2="91"/><line x1="50" y1="50" x2="50" y2="9"/></svg><div class="concept-center-node"><span>CORE CONCEPT</span><strong>${esc(l.title)}</strong></div>${nodes.map((n,i)=>`<button type="button" class="concept-node concept-node-${i}" style="--vx:${positions[i][0]}%;--vy:${positions[i][1]}%" data-visual-node="${i}"><span>${esc(n[0])}</span><strong>${esc(String(n[1]||'').slice(0,72))}${String(n[1]||'').length>72?'…':''}</strong></button>`).join('')}</div><div class="visual-detail" data-visual-detail><span class="eyebrow">SELECT A NODE</span><h3>${esc(nodes[0][0])}</h3><p>${esc(nodes[0][1])}</p></div></div>`;
  }
  function pinnedVideo(l,g){const p=videoPins[l.id];return p&&p.id?{youtubeId:p.id,title:p.title||'Pinned lesson video',channel:p.channel||'YouTube',why:'Pinned locally for this lesson.'}:g.video}
  function videoCompanionHTML(l,g){
    const v=pinnedVideo(l,g)||{}, id=v.youtubeId||'', search=encodeURIComponent(g.video?.searchQuery||`${l.title} tutorial`), src=id?`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`:'';
    return `<div class="video-companion"><div class="video-policy"><span>▶</span><div><strong>Video companion</strong><p>YouTube is supplementary. It does not replace the lesson’s authoritative Evidence view, and it never counts as verification evidence.</p></div></div>${src?`<div class="responsive-video"><iframe loading="lazy" src="${src}" title="${esc(v.title||'Lesson video companion')}" allow="encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`:`<div class="video-missing"><p>The foundation video could not be loaded from the local teaching pack. Use the exact-topic search below.</p></div>`}<div class="video-meta"><p class="eyebrow">FOUNDATION VIDEO</p><h3>${esc(v.title||'Video companion')}</h3><p>${esc(v.channel||'YouTube')} · ${esc(v.why||'Supplementary visual explanation.')}</p></div><div class="video-actions"><a class="button primary" href="https://www.youtube.com/results?search_query=${search}" target="_blank" rel="noopener noreferrer">Find this exact topic on YouTube ↗</a><a class="button" href="https://www.youtube.com/watch?v=${encodeURIComponent(id)}" target="_blank" rel="noopener noreferrer">Open current video ↗</a></div><details class="video-curator"><summary>Pin a more exact YouTube video for this lesson</summary><p>Paste a YouTube watch, share, Shorts, or embed URL. The selection is stored only in this browser.</p><div class="video-pin-row"><input type="url" inputmode="url" data-video-url placeholder="https://www.youtube.com/watch?v=…" aria-label="YouTube URL"><button class="button primary" type="button" data-pin-video>Use this video</button>${videoPins[l.id]?'<button class="button" type="button" data-clear-video>Restore foundation video</button>':''}</div><p class="form-status" data-video-status aria-live="polite"></p></details><div class="young-video-note"><strong>For younger learners</strong><p>YouTube is an external service. A parent or caregiver can choose supervised YouTube or YouTube Kids settings that fit the learner. This site does not autoplay the video.</p></div></div>`;
  }
  function practicalLabHTML(l,g){return `<div class="lab-blueprint"><div><p class="eyebrow">PRACTICAL LAB BLUEPRINT</p><h3>Predict → test → compare → verify → explain.</h3><p>The lab is designed to make you use the idea instead of merely rereading it.</p></div><ol>${(g.labPlan||[]).map((x,i)=>`<li><span>${i+1}</span><p>${esc(x)}</p></li>`).join('')}</ol></div>`}
  function handsOnFallback(l){return `<div class="hands-on-card evidence-lab"><p class="eyebrow">INTERACTIVE EVIDENCE LAB</p><h3>Predict → test → verify → explain.</h3><div class="lab-checks"><label><input type="checkbox"> 1. State the rule from memory before looking.</label><label><input type="checkbox"> 2. Work through the scenario or calculation.</label><label><input type="checkbox"> 3. Open the authoritative source and find the supporting statement.</label><label><input type="checkbox"> 4. Explain any difference between your prediction and the evidence.</label></div><label class="lab-notes">Your prediction / working notes<textarea rows="5" placeholder="Write the answer you expect before revealing the verified claim…"></textarea></label><div class="callout"><strong>Scenario</strong><p>${esc(l.example)}</p></div><details class="evidence-reveal"><summary>Reveal the verified claim</summary><p>${esc((l.verifiedClaims&&l.verifiedClaims[0])||l.takeaway)}</p><p class="muted">Compare this with your prediction, then use the Evidence view to inspect the source itself.</p></details></div>`}
  function memoryLadderHTML(l,g){return `<div class="memory-ladder">${(g.memoryLadder||[]).map((x,i)=>`<article><span>${i+1}</span><div><strong>${i<2?'Recall':i<4?'Apply':'Teach / verify'}</strong><p>${esc(x)}</p></div></article>`).join('')}</div>`}
  function teachBackHTML(l,g){const savedText=teachbackState[l.id]||'';return `<div class="teachback-studio"><div><p class="eyebrow">TEACH-BACK STUDIO</p><h3>If you can explain the boundary, you are less likely to memorize the wrong thing.</h3><p>Write a short explanation for a beginner. Then check it against the rubric. This tool does not automatically grade free-form writing.</p></div><label>Your explanation<textarea rows="6" data-teachback-text placeholder="Explain ${esc(l.title)} in your own words…">${esc(savedText)}</textarea></label><div class="teachback-actions"><button class="button" type="button" data-save-teachback>Save locally</button><button class="button primary" type="button" data-show-rubric>Show self-check rubric</button></div><div class="teachback-rubric" data-teachback-rubric hidden><label><input type="checkbox"> I stated the central idea without contradicting the verified claim.</label><label><input type="checkbox"> I kept analogies clearly separate from literal facts.</label><label><input type="checkbox"> I included an example or application.</label><label><input type="checkbox"> I named at least one limit, misconception, or evidence boundary.</label><label><input type="checkbox"> I can identify where the claim is verified.</label><div class="claim-focus"><span>✓</span><p>${esc(g.verifiedBoundary)}</p></div></div></div>`}
  function reviewHTML(l,g){const due=reviewPlan[l.id]?.date||'';return `${section('memory','Memory ladder',memoryLadderHTML(l,g))}${section('teachback','Teach it back',teachBackHTML(l,g))}${section('confidence','Confidence & revisit plan',`<div class="review-planner"><label>How confident are you right now? <input type="range" min="1" max="5" value="3" data-confidence><output data-confidence-out>3 / 5</output></label><p>Choose when you want this lesson to appear as due in your local review plan. These are scheduling choices, not a claim that one interval is universally optimal.</p><div class="review-buttons"><button class="button" type="button" data-review-days="1">Tomorrow</button><button class="button" type="button" data-review-days="3">3 days</button><button class="button" type="button" data-review-days="7">1 week</button><button class="button" type="button" data-review-days="14">2 weeks</button></div><p class="review-due" data-review-due>${due?`Current revisit date: ${esc(due)}`:'No revisit date set.'}</p></div>`)}${section('finish','Finish the loop',`<div class="practice-complete"><button class="button primary" type="button" data-complete-here>${completed.has(l.id)?'✓ Completed':'Mark this lesson complete'}</button><button class="button" type="button" data-jump-view="evidence">Verify the evidence →</button></div>`)}`}
  function lessonPageHTML(l,view){
    const g=deepGuide(l), obj=l.objectives?.length?section('objectives','What you’ll learn',`<ul>${l.objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`):'';
    if(view==='overview')return `${modeSwitcherHTML()}${section('essential-question','Essential question',`<div class="essential-question"><span>?</span><p>${esc(g.essentialQuestion)}</p></div>`)}${obj}${section('takeaway','Big idea',`<div class="callout"><strong>Remember this</strong><p>${esc(l.takeaway)}</p></div>`)}${section('route','How to learn this deeply',`<div class="lesson-route"><article><span>01</span><strong>Explain</strong><p>Choose Starter, General, Technical, or Research Bridge depth.</p></article><article><span>02</span><strong>See</strong><p>Use the interactive concept visual to connect claim, example, misconception, and evidence.</p></article><article><span>03</span><strong>Watch + Lab</strong><p>Use the video companion, then predict and test in the lab.</p></article><article><span>04</span><strong>Practice + Review</strong><p>Recall, quiz, teach back, and verify before marking complete.</p></article></div>`)}<div class="overview-next"><button class="button primary" type="button" data-jump-view="explain">Begin the Explanation →</button></div>`;
    if(view==='explain')return `${modeSwitcherHTML()}${explainHTML(l,g)}`;
    if(view==='visual')return `${section('visual-map','Concept visual',conceptVisualHTML(l,g))}${section('visual-reasoning','Follow the reasoning path',reasoningHTML(g))}<div class="overview-next"><button class="button primary" type="button" data-jump-view="video">Watch the Video Companion →</button></div>`;
    if(view==='video')return `${section('video-companion','Watch, then question it',videoCompanionHTML(l,g))}${section('video-prompts','Watch actively',`<div class="watch-prompts"><article><strong>Before</strong><p>Write what you expect the video to help explain.</p></article><article><strong>During</strong><p>Pause when a new term appears. Compare it with the site glossary and lesson claim.</p></article><article><strong>After</strong><p>Write one idea the video clarified and one statement you still want to verify using authoritative evidence.</p></article></div>`)}<div class="overview-next"><button class="button primary" type="button" data-jump-view="lab">Go to the Lab →</button></div>`;
    if(view==='lab')return `${section('lab-plan','Lab method',practicalLabHTML(l,g))}${section('example','Scenario / worked example',`<p>${esc(l.example)}</p>`)}${l.interactive?section('interactive','Interactive model',interactiveShell(l.interactive,l)):section('apply','Interactive evidence lab',handsOnFallback(l))}<div class="overview-next"><button class="button primary" type="button" data-jump-view="practice">Practice from Memory →</button></div>`;
    if(view==='practice')return `${section('practice-intro','Practice for retention',`<div class="practice-prompt"><p class="eyebrow">ACTIVE RECALL</p><h3>Close the loop without rereading first.</h3><p>Say or write the central idea from memory. Then answer the check below and compare your reasoning with the explanation.</p></div>`)}${section('memory-preview','Recall ladder',memoryLadderHTML(l,{memoryLadder:(g.memoryLadder||[]).slice(0,4)}))}${l.quiz?section('check','Check your understanding',renderQuiz(l)):section('check','Check your understanding',`<div class="callout"><strong>Recall prompt</strong><p>Explain ${esc(l.title)} and give one correct example without reopening the Explain view.</p></div>`)}<div class="practice-complete"><button class="button primary" type="button" data-jump-view="review">Review & Teach Back →</button><button class="button" type="button" data-jump-view="evidence">Inspect evidence →</button></div>`;
    if(view==='review')return reviewHTML(l,g);
    return evidenceSection(l);
  }
  function standaloneExperienceNav(l){
    const all=D.lessons.filter(x=>isInteractiveExperience(x));
    const i=all.findIndex(x=>x.id===l.id);
    if(i<0)return '';
    const prev=all[(i-1+all.length)%all.length],next=all[(i+1)%all.length];
    const href=x=>esc(standaloneExperienceURL(x,'lab'));
    return `<nav class="standalone-experience-nav" aria-label="Interactive experience navigation">
      <a href="${href(prev)}">← Previous · ${esc(prev.title)}</a>
      <a class="all-experiences" href="learn-labs.html">All Labs</a>
      <a href="${href(next)}">Next · ${esc(next.title)} →</a>
    </nav>`;
  }
  function setAmbientSuppressed(active){
    document.dispatchEvent(new CustomEvent('portfolio:ambient-suppression',{detail:{active:Boolean(active),reason:'lesson'}}));
  }
  function openLesson(id,push=true){
    const l=lessonMap.get(id); if(!l)return;
    setAmbientSuppressed(true);
    const standalone=new URL(location.href).searchParams.get('standalone')==='1';
    document.body.classList.toggle('standalone-experience',standalone);
    stopSpeech(); currentLesson=id; lessonViewName=lessonViewFromURL(); preferences.setItem(STORAGE.recent,id); renderContinue(); const initialView=lessonViewName; ensureDeepLearning(l).then(()=>{if(currentLesson===id&&lessonViewName===initialView){const host=$('#lesson-page-content');if(host){host.innerHTML=lessonPageHTML(l,initialView);bindLessonPage(l);if(initialView==='lab')mountInteractive(l.interactive,l)}}});
    $('#library-view').hidden=true; $('#lesson-view').hidden=false; document.body.classList.add('reading'); $('#lesson-view').classList.toggle('focus-reading',focusReading);
    if(push){const u=new URL(location.href);u.searchParams.set('lesson',id);u.searchParams.set('view','overview');u.searchParams.delete('domain');history.pushState({lesson:id},'',u);lessonViewName='overview'}
    const d=domainMap.get(l.domain);
    $('#lesson-article').innerHTML=`${standalone?standaloneExperienceNav(l):''}
      <div class="breadcrumbs"><button data-home-lesson>Knowledge Library</button><span>/</span><button data-domain-lesson="${esc(l.domain)}">${esc(d.name)}</button><span>/</span><span>${esc(l.category)}</span></div>
      <div class="lesson-kicker"><span>${esc(l.kind)}</span><span>·</span><span>${esc(l.category)}</span></div>
      <h1 class="lesson-title">${esc(l.title)}</h1><p class="lesson-summary">${esc(l.summary)}</p>
      <div class="lesson-meta-row"><span class="pill verified-pill">✓ Source-verified</span><span class="pill deep-pill">◆ Deep learning</span><span class="pill">${esc(l.difficulty)}</span><span class="pill">${l.minutes} min core</span><span class="pill">Reviewed ${esc(l.verification?.reviewed||D.lastReviewed)}</span>${l.versionSensitive?'<span class="pill version-pill">↻ Version-sensitive</span>':''}${l.interactive?'<span class="pill">Interactive</span>':''}</div>
      <div class="lesson-actions"><button class="button primary" id="listen-full">▶ Listen</button><button class="button" id="listen-summary">◖)) Summary</button><button class="button" id="stop-audio" hidden>■ Stop</button><button class="button" id="save-current">${saved.has(l.id)?'♥ Saved':'♡ Save'}</button><button class="button" id="focus-reading">${focusReading?'Exit focus':'Focus reading'}</button><button class="button" id="share-current">Share ↗</button><label class="voice-control">Voice <select id="narration-voice" aria-label="Narration voice"><option value="">Best natural voice</option></select></label><label class="narration-rate">Speed <select id="narration-rate" aria-label="Narration speed"><option value="0.85">0.85×</option><option value="0.95">0.95×</option><option value="1">1×</option><option value="1.15">1.15×</option><option value="1.35">1.35×</option><option value="1.6">1.6×</option><option value="2">2×</option></select></label><button class="text-button" id="preview-voice" type="button">Preview voice</button><span class="audio-state" id="audio-state">Audio starts only when you ask for it.</span></div>
      ${lessonTabs()}
      <div class="lesson-dashboard" id="lesson-dashboard"></div>
      <div class="lesson-body lesson-page-content" id="lesson-page-content">${lessonPageHTML(l,lessonViewName)}</div>`;
    renderLessonDashboard(l); bindLessonUI(l); bindLessonPage(l); populateVoiceSelect(); mountInteractive(lessonViewName==='lab'?l.interactive:null,l); window.scrollTo({top:0,behavior:'auto'}); updateReadingProgress();
  }
  function parseYouTubeId(value=''){
    try{const u=new URL(String(value).trim());if(u.hostname==='youtu.be')return u.pathname.split('/').filter(Boolean)[0]||'';if(u.hostname.endsWith('youtube.com')||u.hostname.endsWith('youtube-nocookie.com')){if(u.searchParams.get('v'))return u.searchParams.get('v');const parts=u.pathname.split('/').filter(Boolean);const marker=parts.findIndex(x=>['embed','shorts','live'].includes(x));if(marker>=0&&parts[marker+1])return parts[marker+1]}}catch{}return /^[A-Za-z0-9_-]{6,20}$/.test(String(value).trim())?String(value).trim():''
  }
  function bindLessonPage(l){
    $$('[data-lesson-view]').forEach(b=>b.onclick=()=>switchLessonView(l,b.dataset.lessonView));
    $$('[data-jump-view]').forEach(b=>b.onclick=()=>switchLessonView(l,b.dataset.jumpView));
    $$('[data-open-deep]').forEach(b=>b.onclick=()=>openLesson(b.dataset.openDeep));
    const done=$('[data-complete-here]'); if(done)done.onclick=()=>toggleLessonComplete(l);
    if(l.quiz){$$('.quiz-options button').forEach(b=>b.onclick=()=>answerQuiz(l,Number(b.dataset.option)))}
    $$('[data-visual-node]').forEach((b,i)=>b.onclick=()=>{const g=deepGuide(l), refs=(l.references||[]).map(r=>r[0]).slice(0,3).join(' · ')||'See Evidence', nodes=[['Verified claim',g.verifiedBoundary],['Why it matters',l.why],['Worked example',l.example],['Watch for',l.misconception||'Do not extend the conclusion beyond the evidence.'],['Remember',l.takeaway],['Evidence',refs]],d=$('[data-visual-detail]');if(d){d.querySelector('h3').textContent=nodes[i][0];d.querySelector('p').textContent=nodes[i][1];$$('[data-visual-node]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');ping(480+i*25,.04,.01)}});
    const pin=$('[data-pin-video]');if(pin)pin.onclick=()=>{const input=$('[data-video-url]'),status=$('[data-video-status]'),id=parseYouTubeId(input?.value||'');if(!id){status.textContent='I could not find a YouTube video ID in that value.';return}videoPins[l.id]={id,title:'Pinned lesson video',channel:'YouTube'};preferences.setItem(STORAGE.videoPins,JSON.stringify(videoPins));status.textContent='Pinned in this browser.';$('#lesson-page-content').innerHTML=lessonPageHTML(l,'video');bindLessonPage(l);toast('Video pinned for this lesson')};
    const clear=$('[data-clear-video]');if(clear)clear.onclick=()=>{delete videoPins[l.id];preferences.setItem(STORAGE.videoPins,JSON.stringify(videoPins));$('#lesson-page-content').innerHTML=lessonPageHTML(l,'video');bindLessonPage(l);toast('Foundation video restored')};
    const saveTeach=$('[data-save-teachback]');if(saveTeach)saveTeach.onclick=()=>{teachbackState[l.id]=$('[data-teachback-text]')?.value||'';preferences.setItem(STORAGE.teachback,JSON.stringify(teachbackState));toast('Teach-back saved in this browser')};
    const rubric=$('[data-show-rubric]');if(rubric)rubric.onclick=()=>{const r=$('[data-teachback-rubric]');r.hidden=!r.hidden;rubric.textContent=r.hidden?'Show self-check rubric':'Hide self-check rubric'};
    const conf=$('[data-confidence]');if(conf)conf.oninput=()=>{$('[data-confidence-out]').textContent=`${conf.value} / 5`};
    $$('[data-review-days]').forEach(b=>b.onclick=()=>{const days=Number(b.dataset.reviewDays)||1,d=new Date();d.setDate(d.getDate()+days);const iso=d.toISOString().slice(0,10);reviewPlan[l.id]={date:iso,days,created:new Date().toISOString()};preferences.setItem(STORAGE.reviewPlan,JSON.stringify(reviewPlan));const out=$('[data-review-due]');if(out)out.textContent=`Revisit planned for ${d.toLocaleDateString()}.`;toast('Local revisit date saved')});
    const mode=$('#learner-mode');if(mode)mode.onchange=()=>{learnerMode=mode.value;preferences.setItem(STORAGE.learnerMode,learnerMode);$('#lesson-page-content').innerHTML=lessonPageHTML(l,lessonViewName);bindLessonPage(l);if(lessonViewName==='lab')mountInteractive(l.interactive,l);toast(`Learning mode: ${audienceLabel()}`)};
  }
  function switchLessonView(l,view,push=true){
    if(!LESSON_VIEWS.some(x=>x[0]===view))view='overview'; stopSpeech(); lessonViewName=view;
    const requestedView=view; ensureDeepLearning(l).then(()=>{if(currentLesson===l.id&&lessonViewName===requestedView&&['overview','explain','visual','video'].includes(requestedView)){const host=$('#lesson-page-content');if(host){host.innerHTML=lessonPageHTML(l,requestedView);bindLessonPage(l)}}});
    if(push){const u=new URL(location.href);u.searchParams.set('lesson',l.id);u.searchParams.set('view',view);history.pushState({lesson:l.id,view},'',u)}
    $$('.lesson-page-tabs button').forEach(b=>{const on=b.dataset.lessonView===view;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false')});
    $('#lesson-page-content').innerHTML=lessonPageHTML(l,view); bindLessonPage(l); mountInteractive(view==='lab'?l.interactive:null,l); window.scrollTo({top:Math.max(0,$('.lesson-page-tabs').getBoundingClientRect().top+scrollY-95),behavior:motionPaused?'auto':'smooth'}); updateReadingProgress();
  }
  function closeLesson(push=true){
    stopSpeech(); currentLesson=null; $('#lesson-view').hidden=true; $('#library-view').hidden=false; document.body.classList.remove('reading','standalone-experience'); setAmbientSuppressed(false);
    if(push){const u=new URL(location.href);u.searchParams.delete('lesson');u.searchParams.delete('view');history.pushState({},'',u)}
    renderLessons(); renderPaths(); renderKnowledgeGraph(); applyLibraryPage(); window.scrollTo({top:0,behavior:'auto'});
  }
  function renderTOC(){}
  function renderLessonDashboard(l){
    const root=$('#lesson-dashboard'); if(!root)return;
    const prereq=(l.prereq||[]).map(id=>lessonMap.get(id)).filter(Boolean), related=(l.related||[]).map(id=>lessonMap.get(id)).filter(Boolean), refs=l.references||[];
    const path=D.paths.find(p=>p.lesson_ids.includes(l.id)), idx=path?path.lesson_ids.indexOf(l.id):-1, next=path&&idx<path.lesson_ids.length-1?lessonMap.get(path.lesson_ids[idx+1]):null;
    root.innerHTML=`<article><span class="eyebrow">PROGRESS</span><strong>${completed.has(l.id)?'✓ Completed':'In progress'}</strong><button class="text-button" data-dashboard-complete>${completed.has(l.id)?'Mark incomplete':'Mark complete'}</button></article>
      <article><span class="eyebrow">GUIDED PATH</span><strong>${path?esc(path.title):'Independent lesson'}</strong>${path?`<small>${idx+1} of ${path.lesson_ids.length}</small>${next?`<button class="text-button" data-open-dashboard="${esc(next.id)}">Next lesson →</button>`:''}`:'<small>Use Learning Paths for a guided sequence.</small>'}</article>
      <article><span class="eyebrow">CONNECTIONS</span><strong>${related.length+prereq.length} linked concepts</strong>${[...prereq,...related].slice(0,2).map(x=>`<button class="text-button" data-open-dashboard="${esc(x.id)}">${esc(x.title)} →</button>`).join('')||'<small>Connections expand as the library grows.</small>'}</article>
      <article class="verified-dashboard"><span class="eyebrow">EVIDENCE</span><strong>✓ ${refs.length} source${refs.length===1?'':'s'}</strong><small>Reviewed ${esc(l.verification?.reviewed||D.lastReviewed)}</small><button class="text-button" data-dashboard-evidence>Inspect evidence →</button></article>`;
    $$('[data-open-dashboard]',root).forEach(b=>b.onclick=()=>openLesson(b.dataset.openDashboard));
    $('[data-dashboard-evidence]',root).onclick=()=>switchLessonView(l,'evidence');
    $('[data-dashboard-complete]',root).onclick=()=>toggleLessonComplete(l);
    $('#progress-label').textContent=completed.has(l.id)?'Completed':'Not completed'; $('#complete-lesson').textContent=completed.has(l.id)?'Mark incomplete':'Mark complete';
  }
  function renderLessonRail(l){renderLessonDashboard(l)}
  function toggleLessonComplete(l){
    if(completed.has(l.id)){completed.delete(l.id);toast('Marked incomplete')}else{completed.add(l.id);toast('Lesson complete');ping(700,.12,.03)}
    saveSet(STORAGE.complete,completed); renderLessonDashboard(l); renderPaths(); const b=$('[data-complete-here]');if(b)b.textContent=completed.has(l.id)?'✓ Completed':'Mark this lesson complete';
  }
  function bindLessonUI(l){
    const standalone=new URL(location.href).searchParams.get('standalone')==='1';
    const back=$('#back-library');
    if(standalone){back.textContent='← All Labs';back.onclick=()=>{location.href='learn-labs.html'};}
    else back.onclick=()=>closeLesson();
    $$('[data-home-lesson]').forEach(b=>b.onclick=()=>{if(standalone)location.href='learn-labs.html';else closeLesson();});
    $$('[data-domain-lesson]').forEach(b=>b.onclick=()=>{const dom=b.dataset.domainLesson;location.href=`learn-browse.html?domain=${encodeURIComponent(dom)}`});
    const rate=$('#narration-rate'); rate.value=preferences.getItem(STORAGE.narrationRate)||'0.95'; rate.onchange=()=>{preferences.setItem(STORAGE.narrationRate,rate.value);toast(`Narration ${rate.options[rate.selectedIndex].text}`)};
    $('#listen-full').onclick=()=>speakLesson(l,false); $('#listen-summary').onclick=()=>speakLesson(l,true); $('#stop-audio').onclick=stopSpeech;
    $('#save-current').onclick=()=>{toggleSaved(l.id);$('#save-current').textContent=saved.has(l.id)?'♥ Saved':'♡ Save'};
    $('#focus-reading').onclick=()=>{focusReading=!focusReading;preferences.setItem(STORAGE.focus,focusReading?'on':'off');$('#lesson-view').classList.toggle('focus-reading',focusReading);$('#focus-reading').textContent=focusReading?'Exit focus':'Focus reading';toast(focusReading?'Focus reading on':'Focus reading off')};
    $('#share-current').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast('Lesson link copied')}catch{toast('Copy the address from your browser')}};
    $('#complete-lesson').onclick=()=>toggleLessonComplete(l); $('#preview-voice').onclick=previewNarrationVoice;
    const mode=$('#learner-mode');if(mode)mode.onchange=()=>{learnerMode=mode.value;preferences.setItem(STORAGE.learnerMode,learnerMode);$('#lesson-page-content').innerHTML=lessonPageHTML(l,lessonViewName);bindLessonPage(l);if(lessonViewName==='lab')mountInteractive(l.interactive,l);toast(`Learning mode: ${audienceLabel()}`)};
  }
  function renderQuiz(l){return `<div class="quiz"><h3>${esc(l.quiz.q)}</h3><div class="quiz-options">${l.quiz.options.map((o,i)=>`<button type="button" data-option="${i}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join('')}</div><div class="quiz-feedback" id="quiz-feedback"></div></div>`}
  function answerQuiz(l,i){
    const correct=l.quiz.answer;recordRecall(l.id,i===correct);const buttons=$$('.quiz-options button');buttons.forEach(b=>b.disabled=true);buttons[correct]?.classList.add('correct');
    if(i!==correct){buttons[i]?.classList.add('wrong');$('#quiz-feedback').textContent=`Not quite. ${l.quiz.explanation}`;ping(220)}else{$('#quiz-feedback').textContent=`Correct. ${l.quiz.explanation}`;ping(740,.1,.03)}
  }
  function speechText(l,summary){
    const g=deepGuide(l);if(summary)return `${l.title}. ${l.summary} Key takeaway: ${l.takeaway}`;
    if(learnerMode==='starter')return `${l.title}. Start with the big idea. ${g.starter?.plainStart||l.takeaway}. ${g.analogy}. Now the real concept. ${l.explanation.replace(/\n+/g,' ')} Example. ${l.example}. Remember. ${l.takeaway}`;
    if(learnerMode==='technical')return `${l.title}. Verified claim. ${g.verifiedBoundary}. Mechanism and reasoning. ${l.explanation.replace(/\n+/g,' ')} Why it matters. ${l.why}. Worked application. ${l.example}. Evidence boundary. ${g.technical?.scope}. Key takeaway. ${l.takeaway}`;
    return `${l.title}. ${l.summary}. ${l.explanation.replace(/\n+/g,' ')} Why it matters. ${l.why}. Worked example. ${l.example}. Key takeaway. ${l.takeaway}`
  }
  function voiceScore(v){
    const n=(v.name||'').toLowerCase(), lang=(v.lang||'').toLowerCase(), user=(navigator.language||'en-us').toLowerCase();let s=0;
    if(lang===user)s+=100;else if(lang.startsWith(user.split('-')[0]))s+=58;
    // Prefer modern, natural-sounding system voices. Names vary by OS, so
    // quality markers matter more than any single vendor or person.
    if(/natural|neural|premium|enhanced|siri/.test(n))s+=220;
    if(/ava|aria|jenny|emma|sonia|samantha|serena|karen|moira|tessa|allison|victoria|zoe|nicky/.test(n))s+=92;
    if(/andrew|brian|ryan|daniel|david|aaron|alex|tom|gordon|jamie/.test(n))s+=84;
    if(/microsoft|google|apple/.test(n))s+=34;
    if(v.default)s+=18;
    if(/compact|espeak|festival|robot|whisper/.test(n))s-=240;
    return s;
  }
  function refreshVoices(){if(!('speechSynthesis'in window))return;availableVoices=speechSynthesis.getVoices().slice().sort((a,b)=>voiceScore(b)-voiceScore(a));populateVoiceSelect()}
  function populateVoiceSelect(){
    const sel=$('#narration-voice');if(!sel)return;
    const savedVoice=preferences.getItem(STORAGE.narrationVoice)||'';
    const english=availableVoices.filter(v=>(v.lang||'').toLowerCase().startsWith('en'));
    const natural=english.filter(v=>voiceScore(v)>=120);
    const choices=(natural.length?natural:english).slice(0,12);
    sel.innerHTML='<option value="">Best natural voice</option>'+choices.map(v=>`<option value="${esc(v.name)}">${esc(v.name)} · ${esc(v.lang)}</option>`).join('');
    sel.value=[...sel.options].some(o=>o.value===savedVoice)?savedVoice:'';
    sel.onchange=()=>{preferences.setItem(STORAGE.narrationVoice,sel.value);toast(sel.value?`Voice: ${sel.value}`:'Using the best natural voice available on this device')}
  }
  function preferredVoice(){
    const chosen=preferences.getItem(STORAGE.narrationVoice);
    const english=availableVoices.filter(v=>(v.lang||'').toLowerCase().startsWith('en'));
    return availableVoices.find(v=>v.name===chosen)||english[0]||availableVoices[0]||null
  }
  function speechChunks(text,max=185){const parts=String(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text];const out=[];let buf='';for(const p0 of parts){const p=p0.trim();if(!p)continue;if((buf+' '+p).length>max&&buf){out.push(buf);buf=p}else buf=(buf+' '+p).trim()}if(buf)out.push(buf);return out}
  function speakQueue(chunks,label='Narrating this lesson…'){
    if(!('speechSynthesis'in window)){toast('This browser does not expose speech synthesis.');return}stopSpeech(false);speechQueue=chunks;speechQueueIndex=0;speechState='speaking';const state=$('#audio-state');if(state)state.textContent=label;const stop=$('#stop-audio');if(stop)stop.hidden=false;
    const next=()=>{if(speechState!=='speaking'||speechQueueIndex>=speechQueue.length){stopSpeech(false);if(state)state.textContent='Narration complete.';return}const u=new SpeechSynthesisUtterance(speechQueue[speechQueueIndex++]);currentUtterance=u;u.voice=preferredVoice();u.lang=u.voice?.lang||navigator.language||'en-US';u.rate=Number(preferences.getItem(STORAGE.narrationRate)||0.95);u.pitch=.96;u.volume=.96;u.onend=()=>setTimeout(next,155);u.onerror=()=>stopSpeech(false);speechSynthesis.speak(u)};next()
  }
  function speakLesson(l,summary){refreshVoices();speakQueue(speechChunks(speechText(l,summary)),summary?'Playing a concise summary…':'Narrating this lesson…')}
  function previewNarrationVoice(){refreshVoices();speakQueue(['This is the selected narration voice. Clear explanations should sound natural, calm, and easy to follow.'],'Previewing voice…')}
  function stopSpeech(update=true){if('speechSynthesis'in window)speechSynthesis.cancel();speechState='idle';currentUtterance=null;speechQueue=[];speechQueueIndex=0;const s=$('#audio-state'),b=$('#stop-audio');if(s&&update)s.textContent='Audio stopped.';if(b)b.hidden=true}

  function interactiveShell(type,l){
    return `<div class="interactive" data-interactive="${esc(type)}"><div class="interactive-head"><h3>${esc(interactiveTitle(type))}</h3><span>Interactive model</span></div><div class="visual-stage" data-stage></div><div class="controls" data-controls></div></div>`;
  }
  function interactiveTitle(t){return ({urljourney:'Follow the request',dns:'Walk a DNS lookup',tcp:'TCP handshake step-through',loadbalancer:'Load balancer traffic lab',subnet:'Subnet calculator',permissions:'Permission decoder',binary:'Binary converter',logic:'Logic-gate truth explorer',cachelatency:'Memory-latency ladder',cpu:'Step through the CPU cycle',amdahl:'Amdahl speedup explorer',qubit:'Single-qubit probability explorer',complexity:'Growth-rate explorer',api:'API request pipeline',queue:'Queue workbench',cia:'Security-property scenarios',threat:'Threat-model prompts',tls:'TLS handshake map',rbac:'RBAC permission matrix',incident:'Incident decision drill',errorbudget:'Error-budget calculator',vector:'Vector playground',derivative:'Tangent-line explorer',matrix:'Matrix rotation explorer',force:'Force / mass / acceleration',projectile:'Projectile-motion explorer',wave:'Waveform + sound',doppler:'Doppler shift + sound',ohm:'Ohm’s law calculator',routetable:'Longest-prefix route explorer',kubeprobe:'Kubernetes probe lab',kubereconcile:'Kubernetes reconciliation lab',cachemap:'Set-associative cache mapper',mpimessage:'MPI message-passing lab',warpdiv:'GPU warp-divergence explorer',quantumgate:'Single-qubit gate lab',btree:'B-tree lookup explorer',zerotrust:'Zero Trust policy drill',toilcalc:'Toil estimator',magnetic:'Magnetic-force explorer',switchlab:'MAC-learning switch lab',kubescheduler:'Kubernetes scheduler lab',quorum:'Quorum / majority explorer',sqljoin:'SQL join visualizer',riskmatrix:'Risk-matrix explorer',integral:'Riemann-sum explorer',seriescircuit:'Series-circuit workbench',dnsttl:'DNS TTL cache timer',natlab:'NAT translation table',firewall:'Firewall rule evaluator',kuberollout:'Kubernetes rolling-update simulator',hpa:'HPA replica calculator',pagemap:'Virtual-address translator',roundrobin:'Round-robin scheduler',branchpred:'One-bit branch predictor',roofline:'Roofline performance bound',reduction:'Parallel reduction tree',bellpair:'Bell-pair circuit + measurement',evidenceworkbench:'Evidence workbench',faulttree:'Fault-isolation tree',sequencebuilder:'Sequence builder',decisionmatrix:'Decision matrix',conceptmap:'Concept-map builder',hypothesis:'Hypothesis tester',teachback:'Teach-back studio',checklistbuilder:'Checklist builder'})[t]||'Explore the concept'}
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
    if(type==='routetable'){
      const routes=[{net:'0.0.0.0',p:0,next:'Internet gateway'},{net:'10.0.0.0',p:8,next:'Core router'},{net:'10.20.0.0',p:16,next:'Site B'},{net:'10.20.30.0',p:24,next:'Server VLAN'}];
      stage.innerHTML='<div class="route-table"><div class="route-row head"><span>Prefix</span><span>Next hop</span><span>Match</span></div>'+routes.map((r,i)=>`<div class="route-row" data-route="${i}"><span>${r.net}/${r.p}</span><span>${r.next}</span><strong>—</strong></div>`).join('')+'</div><div class="route-result" data-route-result>Enter a destination to evaluate all matching routes.</div>';
      controls.innerHTML='<label>Destination IPv4 <input data-route-ip type="text" value="10.20.30.44" inputmode="decimal"></label><button class="button primary" data-route-run>Find route</button><button class="button" data-route-example>Try another</button>';
      const ipInt=ip=>{const a=ip.trim().split('.').map(Number);if(a.length!==4||a.some(x=>!Number.isInteger(x)||x<0||x>255))return null;return ((((a[0]*256+a[1])*256+a[2])*256+a[3])>>>0)};
      const run=()=>{const ip=$('[data-route-ip]',controls).value,x=ipInt(ip);if(x===null){$('[data-route-result]',stage).textContent='Enter a valid IPv4 address.';return}let matches=[];routes.forEach((r,i)=>{const n=ipInt(r.net),mask=r.p===0?0:(0xffffffff<<(32-r.p))>>>0,ok=((x&mask)>>>0)===((n&mask)>>>0);const row=$(`[data-route="${i}"]`,stage);row.classList.toggle('match',ok);row.classList.remove('winner');$('strong',row).textContent=ok?'matches':'—';if(ok)matches.push({r,i})});matches.sort((a,b)=>b.r.p-a.r.p);if(matches[0]){const {r,i}=matches[0];$(`[data-route="${i}"]`,stage).classList.add('winner');$('[data-route-result]',stage).innerHTML=`<strong>${esc(ip)}</strong> uses <b>${r.net}/${r.p}</b> → ${esc(r.next)} because it is the most-specific matching prefix.`;ping(610)}};
      const examples=['8.8.8.8','10.44.1.2','10.20.99.10','10.20.30.44'];let ex=0;$('[data-route-run]',controls).onclick=run;$('[data-route-example]',controls).onclick=()=>{$('[data-route-ip]',controls).value=examples[++ex%examples.length];run()};run();return;
    }
    if(type==='kubeprobe'){
      let ready=true,live=true,restarts=0;
      stage.innerHTML='<div class="kube-flow"><div class="kube-service">Service<br><small>routes only to Ready endpoints</small></div><span>→</span><div class="kube-pod" data-pod><strong>Pod</strong><span data-ready>Ready ✓</span><span data-live>Live ✓</span><small data-restarts>Restarts: 0</small></div></div><p class="muted" data-kube-note>Readiness is passing, so this Pod can receive Service traffic.</p>';
      controls.innerHTML='<button class="button primary" data-ready-toggle>Fail readiness</button><button class="button" data-live-toggle>Fail liveness</button><button class="button" data-kube-reset>Reset</button>';
      const draw=()=>{const pod=$('[data-pod]',stage);pod.classList.toggle('not-ready',!ready);pod.classList.toggle('not-live',!live);$('[data-ready]',stage).textContent=ready?'Ready ✓':'Not Ready ×';$('[data-live]',stage).textContent=live?'Live ✓':'Liveness failing ×';$('[data-restarts]',stage).textContent=`Restarts: ${restarts}`;$('[data-ready-toggle]',controls).textContent=ready?'Fail readiness':'Pass readiness';$('[data-live-toggle]',controls).textContent=live?'Fail liveness':'Pass liveness';$('[data-kube-note]',stage).textContent=!live?'A failed liveness probe can cause kubelet to restart the container according to probe configuration.':!ready?'A failed readiness probe removes the Pod from matching Service endpoints; the container can keep running.':'Readiness is passing, so this Pod can receive Service traffic.'};
      $('[data-ready-toggle]',controls).onclick=()=>{ready=!ready;draw();ping(ready?620:260)};$('[data-live-toggle]',controls).onclick=()=>{live=!live;if(!live){restarts++;ready=false;draw();setTimeout(()=>{live=true;ready=true;draw()},1200)}else draw();ping(live?620:220)};$('[data-kube-reset]',controls).onclick=()=>{ready=live=true;restarts=0;draw()};draw();return;
    }
    if(type==='kubereconcile'){
      let desired=3,actual=3,timer=null;
      stage.innerHTML='<div class="reconcile-summary"><div><span>Desired</span><strong data-desired>3</strong></div><div class="reconcile-arrow">controller loop ⇄</div><div><span>Observed</span><strong data-observed>3</strong></div></div><div class="pod-field" data-pod-field></div><p class="muted" data-reconcile-note>Desired and observed state agree.</p>';
      controls.innerHTML='<label>Desired replicas <input type="range" min="1" max="6" value="3" data-replicas> <b data-rep-label>3</b></label><button class="button primary" data-delete-pod>Delete one Pod</button>';
      const draw=()=>{$('[data-desired]',stage).textContent=desired;$('[data-observed]',stage).textContent=actual;$('[data-rep-label]',controls).textContent=desired;$('[data-pod-field]',stage).innerHTML=Array.from({length:actual},(_,i)=>`<span>Pod ${i+1}</span>`).join('');$('[data-reconcile-note]',stage).textContent=actual===desired?'Desired and observed state agree.':'Observed state differs. The controller works toward the declared replica count.'};
      const reconcile=()=>{clearTimeout(timer);if(actual===desired)return;timer=setTimeout(()=>{actual+=Math.sign(desired-actual);draw();ping(520);reconcile()},500)};
      $('[data-replicas]',controls).oninput=e=>{desired=+e.target.value;draw();reconcile()};$('[data-delete-pod]',controls).onclick=()=>{if(actual>0)actual--;draw();ping(220);reconcile()};draw();return;
    }
    if(type==='cachemap'){
      const SETS=4,WAYS=2;stage.innerHTML='<div class="cache-grid" data-cache-grid></div><div class="route-result" data-cache-out></div>';controls.innerHTML='<label>Memory block <input type="number" min="0" max="255" value="13" data-block></label><button class="button primary" data-map-block>Map block</button><button class="button" data-next-block>Next block</button><span class="muted">Simplified 4-set, 2-way teaching model.</span>';
      const draw=()=>{const b=Math.max(0,Math.floor(+$('[data-block]',controls).value||0)),set=b%SETS,tag=Math.floor(b/SETS);$('[data-cache-grid]',stage).innerHTML=Array.from({length:SETS},(_,s)=>`<div class="cache-set ${s===set?'selected':''}"><strong>Set ${s}</strong><span>Way 0</span><span>Way 1</span></div>`).join('');$('[data-cache-out]',stage).innerHTML=`Block <b>${b}</b> maps to <b>set ${set}</b> because block mod ${SETS} = ${set}. Its simplified tag is <b>${tag}</b>. Either way in that set could hold the block.`;ping(480+set*45)};$('[data-map-block]',controls).onclick=draw;$('[data-next-block]',controls).onclick=()=>{$('[data-block]',controls).value=(+$('[data-block]',controls).value+1)%256;draw()};draw();return;
    }
    if(type==='mpimessage'){
      let seq=0;stage.innerHTML='<div class="mpi-ranks">'+[0,1,2,3].map(i=>`<div class="mpi-rank" data-rank="${i}"><strong>Rank ${i}</strong><span>waiting</span></div>`).join('')+'</div><div class="route-result" data-mpi-out>Choose source and destination ranks.</div>';controls.innerHTML='<label>Source <select data-mpi-src>'+[0,1,2,3].map(i=>`<option>${i}</option>`).join('')+'</select></label><label>Destination <select data-mpi-dst>'+[0,1,2,3].map(i=>`<option>${i}</option>`).join('')+'</select></label><label>Payload <input data-mpi-payload value="[4, 8, 15, 16]"></label><button class="button primary" data-mpi-send>Send message →</button>';
      $('[data-mpi-dst]',controls).value='1';$('[data-mpi-send]',controls).onclick=()=>{const s=+$('[data-mpi-src]',controls).value,d=+$('[data-mpi-dst]',controls).value,p=$('[data-mpi-payload]',controls).value.trim();if(s===d){$('[data-mpi-out]',stage).textContent='Choose two different ranks for this demonstration.';return}seq++;$$('[data-rank]',stage).forEach(x=>x.classList.remove('sending','receiving'));$(`[data-rank="${s}"]`,stage).classList.add('sending');$('span',$(`[data-rank="${s}"]`,stage)).textContent='MPI_Send';$(`[data-rank="${d}"]`,stage).classList.add('receiving');$('span',$(`[data-rank="${d}"]`,stage)).textContent='matching receive';$('[data-mpi-out]',stage).textContent=`Message ${seq}: rank ${s} → rank ${d}, payload ${p||'(empty)'}. MPI matches communication within a communicator using message parameters such as source/destination and tags.`;ping(620);setTimeout(()=>$$('[data-rank]',stage).forEach(x=>{$('span',x).textContent='waiting';x.classList.remove('sending','receiving')}),900)};return;
    }
    if(type==='warpdiv'){
      let threshold=16,phase='both';stage.innerHTML='<div class="warp-lanes" data-warp></div><div class="metric-grid"><div class="metric"><span>Path A lanes</span><strong data-wa>16</strong></div><div class="metric"><span>Path B lanes</span><strong data-wb>16</strong></div><div class="metric"><span>Warp size</span><strong>32</strong></div><div class="metric"><span>Teaching point</span><strong>serialized paths</strong></div></div><p class="muted">Simplified SIMT illustration: divergent branches can require a warp to execute paths with different lane masks.</p>';controls.innerHTML='<label>Branch threshold lane &lt; <input type="range" min="1" max="31" value="16" data-warp-threshold> <b data-wt>16</b></label><button class="button primary" data-warp-a>Show path A</button><button class="button" data-warp-b>Show path B</button><button class="button" data-warp-both>Show both masks</button>';
      const draw=()=>{const lanes=Array.from({length:32},(_,i)=>{const a=i<threshold,active=phase==='both'||(phase==='a'&&a)||(phase==='b'&&!a);return `<span class="${a?'path-a':'path-b'} ${active?'active':'muted-lane'}">${i}</span>`});$('[data-warp]',stage).innerHTML=lanes.join('');$('[data-wa]',stage).textContent=threshold;$('[data-wb]',stage).textContent=32-threshold;$('[data-wt]',controls).textContent=threshold};$('[data-warp-threshold]',controls).oninput=e=>{threshold=+e.target.value;draw()};$('[data-warp-a]',controls).onclick=()=>{phase='a';draw()};$('[data-warp-b]',controls).onclick=()=>{phase='b';draw()};$('[data-warp-both]',controls).onclick=()=>{phase='both';draw()};draw();return;
    }
    if(type==='quantumgate'){
      let a=1,b=0;const rt=Math.SQRT1_2;stage.innerHTML='<div class="quantum-gate-stage"><div class="state-vector"><span>α</span><strong data-alpha>1.000</strong><span>β</span><strong data-beta>0.000</strong></div><div class="prob-bars"><div><span>P(0)</span><i><b data-qbar0></b></i><strong data-qprob0>100%</strong></div><div><span>P(1)</span><i><b data-qbar1></b></i><strong data-qprob1>0%</strong></div></div><p data-qstate class="muted">|ψ⟩ = |0⟩</p></div>';controls.innerHTML='<button class="button primary" data-qg="H">H</button><button class="button" data-qg="X">X</button><button class="button" data-qg="Z">Z</button><button class="button" data-qmeasure>Measure</button><button class="text-button" data-qreset>Reset |0⟩</button>';
      const clean=x=>Math.abs(x)<1e-10?0:x;const draw=()=>{a=clean(a);b=clean(b);const p0=a*a,p1=b*b;$('[data-alpha]',stage).textContent=a.toFixed(3);$('[data-beta]',stage).textContent=b.toFixed(3);$('[data-qprob0]',stage).textContent=(p0*100).toFixed(1)+'%';$('[data-qprob1]',stage).textContent=(p1*100).toFixed(1)+'%';$('[data-qbar0]',stage).style.width=(p0*100)+'%';$('[data-qbar1]',stage).style.width=(p1*100)+'%';$('[data-qstate]',stage).textContent=`|ψ⟩ = ${a.toFixed(3)}|0⟩ ${b<0?'−':'+'} ${Math.abs(b).toFixed(3)}|1⟩`};$$('[data-qg]',controls).forEach(btn=>btn.onclick=()=>{const g=btn.dataset.qg,oa=a,ob=b;if(g==='X'){a=ob;b=oa}else if(g==='Z'){b=-b}else if(g==='H'){a=(oa+ob)*rt;b=(oa-ob)*rt}draw();ping(g==='H'?680:g==='X'?560:470)});$('[data-qmeasure]',controls).onclick=()=>{const r=Math.random()<a*a?0:1;a=r?0:1;b=r?1:0;draw();toast(`Measured |${r}⟩; the state collapsed in this computational-basis model.`);ping(r?700:430)};$('[data-qreset]',controls).onclick=()=>{a=1;b=0;draw()};draw();return;
    }
    if(type==='btree'){
      const tree={root:[20,40],children:[[5,10,15],[25,30,35],[45,50,60]]};stage.innerHTML='<div class="btree"><div class="btree-node root" data-bnode="root">20 · 40</div><div class="btree-links">↓ &nbsp;&nbsp;&nbsp; ↓ &nbsp;&nbsp;&nbsp; ↓</div><div class="btree-children">'+tree.children.map((x,i)=>`<div class="btree-node" data-bnode="${i}">${x.join(' · ')}</div>`).join('')+'</div></div><div class="route-result" data-btree-out>Choose a key to follow a lookup path.</div>';controls.innerHTML='<label>Key <select data-btree-key>'+[5,10,15,20,25,30,35,40,45,50,60].map(x=>`<option>${x}</option>`).join('')+'</select></label><button class="button primary" data-btree-find>Find key</button><span class="muted">Conceptual B-tree-like search illustration; node sizes/storage details are simplified.</span>';
      $('[data-btree-key]',controls).value='35';$('[data-btree-find]',controls).onclick=()=>{const k=+$('[data-btree-key]',controls).value;$$('[data-bnode]',stage).forEach(x=>x.classList.remove('active'));$('[data-bnode="root"]',stage).classList.add('active');if(k===20||k===40){$('[data-btree-out]',stage).textContent=`Key ${k} is found in the root node: one node visit.`;return}const child=k<20?0:k<40?1:2;$(`[data-bnode="${child}"]`,stage).classList.add('active');$('[data-btree-out]',stage).textContent=`Compare at the root, then descend to child ${child+1}. Key ${k} is found after following that branch.`;ping(600)};return;
    }
    if(type==='zerotrust'){
      stage.innerHTML='<div class="zt-flow"><div>Subject identity<br><b data-zt-id>verified</b></div><div>Device posture<br><b data-zt-dev>managed</b></div><div>Resource policy<br><b data-zt-res>sensitive</b></div><strong data-zt-decision>ALLOW</strong></div><p class="muted" data-zt-note>This is an example policy drill, not a universal NIST decision algorithm. Zero Trust requires policy-based access decisions without implicit trust from network location alone.</p>';
      controls.innerHTML='<label class="check-label"><input type="checkbox" data-zt-auth checked> Identity verified</label><label class="check-label"><input type="checkbox" data-zt-device checked> Device meets example policy</label><label>Resource <select data-zt-resource><option value="normal">Standard</option><option value="sensitive" selected>Sensitive</option></select></label>';
      const draw=()=>{const auth=$('[data-zt-auth]',controls).checked,dev=$('[data-zt-device]',controls).checked,sensitive=$('[data-zt-resource]',controls).value==='sensitive',allow=auth&&(!sensitive||dev);$('[data-zt-id]',stage).textContent=auth?'verified':'not verified';$('[data-zt-dev]',stage).textContent=dev?'meets policy':'fails policy';$('[data-zt-res]',stage).textContent=sensitive?'sensitive':'standard';$('[data-zt-decision]',stage).textContent=allow?'ALLOW':'DENY';$('[data-zt-decision]',stage).classList.toggle('deny',!allow)};$$('input,select',controls).forEach(x=>x.onchange=draw);draw();return;
    }
    if(type==='toilcalc'){
      stage.innerHTML='<div class="metric-grid"><div class="metric"><span>Weekly time</span><strong data-toil-week>5 hr</strong></div><div class="metric"><span>Annualized</span><strong data-toil-year>260 hr</strong></div><div class="metric"><span>Automatable share</span><strong data-toil-auto>80%</strong></div><div class="metric"><span>Potential annual reduction</span><strong data-toil-save>208 hr</strong></div></div><div class="toil-checks"><span>Manual</span><span>Repetitive</span><span>Automatable</span><span>Tactical</span><span>No enduring value</span><span>Scales with service growth</span></div><p class="muted">The hour calculation is arithmetic. Google SRE’s toil definition depends on the characteristics above—not on a single numerical threshold.</p>';
      controls.innerHTML='<label>Hours/week <input type="range" min="0" max="30" step="0.5" value="5" data-toil-hours></label><label>Potentially automatable <input type="range" min="0" max="100" step="5" value="80" data-toil-pct></label>';
      const draw=()=>{const h=+$('[data-toil-hours]',controls).value,p=+$('[data-toil-pct]',controls).value,y=h*52,save=y*p/100;$('[data-toil-week]',stage).textContent=h.toFixed(1)+' hr';$('[data-toil-year]',stage).textContent=y.toFixed(0)+' hr';$('[data-toil-auto]',stage).textContent=p+'%';$('[data-toil-save]',stage).textContent=save.toFixed(0)+' hr'};$$('input',controls).forEach(x=>x.oninput=draw);draw();return;
    }
    if(type==='magnetic'){
      stage.innerHTML='<canvas class="math-canvas" width="700" height="220"></canvas><div class="metric-grid"><div class="metric"><span>|q|</span><strong data-mf-q>1.0 μC</strong></div><div class="metric"><span>v</span><strong data-mf-v>20 m/s</strong></div><div class="metric"><span>B</span><strong data-mf-b>0.50 T</strong></div><div class="metric"><span>|F| = |q|vB sinθ</span><strong data-mf-f>10.00 μN</strong></div></div>';
      controls.innerHTML='<label>Charge magnitude <input type="range" min="1" max="10" value="1" data-mf-q></label><label>Speed <input type="range" min="0" max="100" value="20" data-mf-v></label><label>Field B <input type="range" min="1" max="20" value="5" data-mf-b></label><label>Angle θ <input type="range" min="0" max="180" value="90" data-mf-a> <b data-mf-al>90°</b></label>';
      const draw=()=>{const q=+$('[data-mf-q]',controls).value,v=+$('[data-mf-v]',controls).value,B=+$('[data-mf-b]',controls).value/10,a=+$('[data-mf-a]',controls).value,r=a*Math.PI/180,F=q*1e-6*v*B*Math.sin(r),c=$('canvas',stage),ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--line2');ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--muted');ctx.font='14px system-ui';ctx.fillText('velocity v →',60,h/2);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent');ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(160,h/2);ctx.lineTo(430,h/2);ctx.stroke();ctx.beginPath();ctx.moveTo(430,h/2);ctx.lineTo(410,h/2-10);ctx.moveTo(430,h/2);ctx.lineTo(410,h/2+10);ctx.stroke();ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--muted');ctx.fillText(`B at ${a}° to v`,470,h/2-20);$('[data-mf-q]',stage).textContent=q.toFixed(1)+' μC';$('[data-mf-v]',stage).textContent=v+' m/s';$('[data-mf-b]',stage).textContent=B.toFixed(2)+' T';$('[data-mf-f]',stage).textContent=(Math.abs(F)*1e6).toFixed(2)+' μN';$('[data-mf-al]',controls).textContent=a+'°'};$$('input',controls).forEach(x=>x.oninput=draw);draw();return;
    }
    if(type==='dnsttl'){
      stage.innerHTML='<div class="ttl-track"><div class="ttl-fill" data-ttl-fill></div><span data-ttl-state>CACHED</span></div><div class="metric-grid"><div class="metric"><span>TTL</span><strong data-ttl>300 s</strong></div><div class="metric"><span>Elapsed</span><strong data-elapsed>90 s</strong></div><div class="metric"><span>Remaining</span><strong data-remain>210 s</strong></div><div class="metric"><span>Resolver action</span><strong data-action>Reuse cached RR</strong></div></div><p class="muted">RFC 1035 defines TTL as the time interval that a resource record may be cached before it should be discarded. This model shows that expiration boundary.</p>';
      controls.innerHTML='<label>Record TTL <input type="range" min="30" max="900" step="30" value="300" data-ttl-in> <b data-ttl-l>300 s</b></label><label>Elapsed time <input type="range" min="0" max="900" step="10" value="90" data-elapsed-in> <b data-elapsed-l>90 s</b></label><button class="button" type="button" data-ttl-reset>Reset timer</button>';
      const draw=()=>{const ttl=+$('[data-ttl-in]',controls).value,e=+$('[data-elapsed-in]',controls).value,rem=Math.max(0,ttl-e),alive=e<ttl,pct=Math.max(0,Math.min(100,rem/ttl*100));$('[data-ttl]',stage).textContent=ttl+' s';$('[data-elapsed]',stage).textContent=e+' s';$('[data-remain]',stage).textContent=rem+' s';$('[data-action]',stage).textContent=alive?'Reuse cached RR':'Treat as expired';$('[data-ttl-state]',stage).textContent=alive?'CACHED':'EXPIRED';$('[data-ttl-state]',stage).classList.toggle('bad',!alive);$('[data-ttl-fill]',stage).style.width=pct+'%';$('[data-ttl-l]',controls).textContent=ttl+' s';$('[data-elapsed-l]',controls).textContent=e+' s'};$$('input',controls).forEach(x=>x.oninput=draw);$('[data-ttl-reset]',controls).onclick=()=>{$('[data-elapsed-in]',controls).value=0;draw()};draw();return;
    }
    if(type==='natlab'){
      const inside='10.0.0.25',outside='203.0.113.10';let nextPort=40000,rows=[];
      stage.innerHTML='<div class="nat-diagram"><div><strong>Inside host</strong><code>10.0.0.25</code></div><span>→ NAT →</span><div><strong>Public address</strong><code>203.0.113.10</code></div></div><div class="nat-table"><strong>Educational translation table</strong><div data-nat-rows>No mappings yet.</div></div><p class="muted">Simplified NAPT/PAT illustration: real NAT behavior, port selection, timeouts, and protocols vary by implementation. RFC 3022 documents traditional NAT translation concepts.</p>';
      controls.innerHTML='<label>Internal source port <input type="number" min="1024" max="65535" value="51515" data-nat-port></label><label>Destination <select data-nat-dst><option>198.51.100.20:443</option><option>192.0.2.44:53</option><option>198.51.100.55:80</option></select></label><button class="button primary" type="button" data-nat-add>Create mapping</button><button class="button" type="button" data-nat-clear>Clear</button>';
      const draw=()=>{$('[data-nat-rows]',stage).innerHTML=rows.length?rows.map(r=>`<span><code>${inside}:${r.inp}</code><b>↔</b><code>${outside}:${r.outp}</code><small>${esc(r.dst)}</small></span>`).join(''):'No mappings yet.'};$('[data-nat-add]',controls).onclick=()=>{const inp=Math.max(1024,Math.min(65535,+$('[data-nat-port]',controls).value||51515)),dst=$('[data-nat-dst]',controls).value;rows.unshift({inp,outp:nextPort++,dst});rows=rows.slice(0,6);draw();ping(600)};$('[data-nat-clear]',controls).onclick=()=>{rows=[];nextPort=40000;draw()};draw();return;
    }
    if(type==='firewall'){
      const rules=[{n:100,p:'TCP',port:22,src:'203.0.113.0/24',action:'ALLOW'},{n:110,p:'TCP',port:443,src:'0.0.0.0/0',action:'ALLOW'},{n:120,p:'TCP',port:'*',src:'0.0.0.0/0',action:'DENY'},{n:'*',p:'*',port:'*',src:'*',action:'DENY'}];
      stage.innerHTML='<div class="firewall-rules" data-fw-rules>'+rules.map((r,i)=>`<div data-fw-rule="${i}"><b>${r.n}</b><span>${r.p}</span><span>${r.port}</span><span>${r.src}</span><strong>${r.action}</strong></div>`).join('')+'</div><div class="route-result" data-fw-out>Evaluate a packet against the ordered rule list.</div><p class="muted">This models an ordered, stateless first-match list like an AWS network ACL. AWS security groups are different: they are stateful and do not use numbered first-match deny rules.</p>';
      controls.innerHTML='<label>Protocol <select data-fw-proto><option>TCP</option><option>UDP</option></select></label><label>Destination port <input type="number" min="1" max="65535" value="443" data-fw-port></label><label>Source <select data-fw-src><option value="203">203.0.113.25</option><option value="198">198.51.100.20</option></select></label><button class="button primary" type="button" data-fw-go>Evaluate packet</button>';
      $('[data-fw-go]',controls).onclick=()=>{const proto=$('[data-fw-proto]',controls).value,port=+$('[data-fw-port]',controls).value,src=$('[data-fw-src]',controls).value;let hit=3;if(proto==='TCP'&&port===22&&src==='203')hit=0;else if(proto==='TCP'&&port===443)hit=1;else if(proto==='TCP')hit=2;$$('[data-fw-rule]',stage).forEach((el,i)=>el.classList.toggle('active',i===hit));const r=rules[hit];$('[data-fw-out]',stage).innerHTML=`First matching rule: <strong>${r.n}</strong> → <b class="${r.action==='ALLOW'?'good':'bad'}">${r.action}</b>. Evaluation stops at that rule in this model.`;ping(r.action==='ALLOW'?650:220)};return;
    }
    if(type==='kuberollout'){
      let step=0;
      stage.innerHTML='<div class="rollout-pods" data-roll-pods></div><div class="metric-grid"><div class="metric"><span>Desired</span><strong data-r-desired>4</strong></div><div class="metric"><span>Old Pods</span><strong data-r-old>4</strong></div><div class="metric"><span>New Pods</span><strong data-r-new>0</strong></div><div class="metric"><span>Unavailable</span><strong data-r-unavail>0</strong></div></div><p class="muted" data-r-note>Press Next step. This simplified simulator obeys absolute maxSurge and maxUnavailable bounds; real controllers also wait for readiness and other conditions.</p>';
      controls.innerHTML='<label>Desired replicas <input type="number" min="1" max="10" value="4" data-r-d></label><label>maxSurge <input type="number" min="0" max="5" value="1" data-r-s></label><label>maxUnavailable <input type="number" min="0" max="5" value="1" data-r-u></label><button class="button primary" type="button" data-r-next>Next step</button><button class="button" type="button" data-r-reset>Restart</button>';
      const state=()=>{const d=Math.max(1,Math.min(10,+$('[data-r-d]',controls).value||4)),surge=Math.max(0,+$('[data-r-s]',controls).value||0),un=Math.max(0,+$('[data-r-u]',controls).value||0),newN=Math.min(d,step),old=Math.max(0,d-step),total=old+newN;return{d,surge,un,newN,old,total}};
      const draw=()=>{let x=state();const maxTotal=x.d+x.surge,minAvail=Math.max(0,x.d-x.un);let newN=x.newN,old=x.old;if(step>0&&newN< x.d && old+newN<maxTotal)newN=Math.min(x.d,newN+Math.min(x.surge||1,x.d-newN));while(old>0&&old+newN-1>=minAvail&&old+newN>x.d)old--;const unavailable=Math.max(0,x.d-(old+newN));$('[data-roll-pods]',stage).innerHTML=[...Array(old)].map(()=>'<span class="old">old</span>').concat([...Array(newN)].map(()=>'<span class="new">new</span>')).join('');$('[data-r-desired]',stage).textContent=x.d;$('[data-r-old]',stage).textContent=old;$('[data-r-new]',stage).textContent=newN;$('[data-r-unavail]',stage).textContent=unavailable;$('[data-r-note]',stage).textContent=newN>=x.d&&old===0?'Rollout complete in this simplified model.':'Controller goal: replace old replicas while staying within the configured surge and unavailability limits.'};$('[data-r-next]',controls).onclick=()=>{step++;draw();ping(620)};$('[data-r-reset]',controls).onclick=()=>{step=0;draw()};$$('input',controls).forEach(x=>x.onchange=()=>{step=0;draw()});draw();return;
    }
    if(type==='hpa'){
      stage.innerHTML='<div class="hpa-scale"><div data-hpa-pods></div></div><div class="metric-grid"><div class="metric"><span>Current replicas</span><strong data-hpa-r>4</strong></div><div class="metric"><span>Current metric</span><strong data-hpa-c>75%</strong></div><div class="metric"><span>Target metric</span><strong data-hpa-t>50%</strong></div><div class="metric"><span>Formula result</span><strong data-hpa-o>6</strong></div></div><p class="muted">Core formula shown by Kubernetes: ceil(currentReplicas × currentMetric / desiredMetric). The actual HPA controller also applies tolerance, readiness, missing-metric, stabilization, and policy behavior.</p>';
      controls.innerHTML='<label>Current replicas <input type="range" min="1" max="20" value="4" data-hpa-r></label><label>Current metric % <input type="range" min="1" max="200" value="75" data-hpa-c></label><label>Target metric % <input type="range" min="1" max="100" value="50" data-hpa-t></label><label>Min / max <input type="number" min="1" max="20" value="1" data-hpa-min> <input type="number" min="1" max="50" value="20" data-hpa-max></label>';
      const draw=()=>{const r=+$('[data-hpa-r]',controls).value,c=+$('[data-hpa-c]',controls).value,t=Math.max(1,+$('[data-hpa-t]',controls).value),mn=Math.max(1,+$('[data-hpa-min]',controls).value||1),mx=Math.max(mn,+$('[data-hpa-max]',controls).value||20),raw=Math.ceil(r*c/t),out=Math.max(mn,Math.min(mx,raw));$('[data-hpa-r]',stage).textContent=r;$('[data-hpa-c]',stage).textContent=c+'%';$('[data-hpa-t]',stage).textContent=t+'%';$('[data-hpa-o]',stage).textContent=out+(raw!==out?' (clamped)':'');$('[data-hpa-pods]',stage).innerHTML=[...Array(Math.min(out,30))].map((_,i)=>`<span class="${i<r?'current':'new'}">Pod</span>`).join('')};$$('input',controls).forEach(x=>x.oninput=draw);draw();return;
    }
    if(type==='pagemap'){
      const map=[3,12,7,1,15,5,9,2,13,6,4,11,8,14,0,10],ps=4096;
      stage.innerHTML='<div class="page-map"><div><b>Virtual address</b><strong data-pm-va>0x3039</strong></div><span>VPN + offset → page table → PFN + offset</span><div><b>Physical address</b><strong data-pm-pa>0x7039</strong></div></div><div class="metric-grid"><div class="metric"><span>Page size</span><strong>4096 B</strong></div><div class="metric"><span>VPN</span><strong data-pm-vpn>3</strong></div><div class="metric"><span>Offset</span><strong data-pm-off>57</strong></div><div class="metric"><span>Demo PFN</span><strong data-pm-pfn>1</strong></div></div><p class="muted">Schematic 16-page translation table for learning. Real virtual-memory page tables are architecture- and OS-specific and commonly hierarchical.</p>';
      controls.innerHTML='<label>Virtual address 0–65535 <input type="number" min="0" max="65535" value="12345" data-pm-in></label><input type="range" min="0" max="65535" value="12345" data-pm-range>';
      const draw=v=>{v=Math.max(0,Math.min(65535,Math.floor(+v||0)));$('[data-pm-in]',controls).value=v;$('[data-pm-range]',controls).value=v;const vpn=Math.floor(v/ps),off=v%ps,pfn=map[vpn],pa=pfn*ps+off;$('[data-pm-va]',stage).textContent='0x'+v.toString(16).toUpperCase().padStart(4,'0');$('[data-pm-pa]',stage).textContent='0x'+pa.toString(16).toUpperCase().padStart(4,'0');$('[data-pm-vpn]',stage).textContent=vpn;$('[data-pm-off]',stage).textContent=off;$('[data-pm-pfn]',stage).textContent=pfn};$('[data-pm-in]',controls).oninput=e=>draw(e.target.value);$('[data-pm-range]',controls).oninput=e=>draw(e.target.value);draw(12345);return;
    }
    if(type==='roundrobin'){
      let bursts={A:5,B:3,C:7},q=2,queue=[],remain={},timeline=[];
      stage.innerHTML='<div class="rr-timeline" data-rr-line></div><div class="metric-grid"><div class="metric"><span>Quantum</span><strong data-rr-q>2</strong></div><div class="metric"><span>Queue</span><strong data-rr-queue>A B C</strong></div><div class="metric"><span>Completed</span><strong data-rr-done>0 / 3</strong></div><div class="metric"><span>Elapsed slices</span><strong data-rr-slices>0</strong></div></div><p class="muted">Educational SCHED_RR-style model: equal-priority runnable tasks receive bounded turns and unfinished tasks return to the queue tail. It is not the Linux normal scheduler.</p>';
      controls.innerHTML='<label>Quantum <input type="range" min="1" max="4" value="2" data-rr-q></label><button class="button primary" type="button" data-rr-step>Run next slice</button><button class="button" type="button" data-rr-reset>Restart</button>';
      const reset=()=>{q=+$('[data-rr-q]',controls).value;queue=['A','B','C'];remain={...bursts};timeline=[];draw()};const draw=()=>{$('[data-rr-line]',stage).innerHTML=timeline.length?timeline.map(x=>`<span class="task-${x.t}">${x.t}<small>${x.used}u</small></span>`).join(''):'<span class="muted">No CPU slices executed yet.</span>';$('[data-rr-q]',stage).textContent=q;$('[data-rr-queue]',stage).textContent=queue.join(' ')||'empty';$('[data-rr-done]',stage).textContent=`${Object.values(remain).filter(x=>x===0).length} / 3`;$('[data-rr-slices]',stage).textContent=timeline.length};$('[data-rr-step]',controls).onclick=()=>{if(!queue.length)return;const t=queue.shift(),used=Math.min(q,remain[t]);remain[t]-=used;timeline.push({t,used});if(remain[t]>0)queue.push(t);draw();ping(500)};$('[data-rr-reset]',controls).onclick=reset;$('[data-rr-q]',controls).oninput=()=>{q=+$('[data-rr-q]',controls).value;$('[data-rr-q]',stage).textContent=q};reset();return;
    }
    if(type==='branchpred'){
      let seq='TTTNTNTTNNNTT',i=0,pred='T',correct=0;
      stage.innerHTML='<div class="branch-stage"><div><span>Predict</span><strong data-bp-pred>T</strong></div><div>→</div><div><span>Actual</span><strong data-bp-act>—</strong></div><div>→</div><div><span>Update</span><strong data-bp-up>—</strong></div></div><div class="metric-grid"><div class="metric"><span>Step</span><strong data-bp-step>0 / 13</strong></div><div class="metric"><span>Correct</span><strong data-bp-good>0</strong></div><div class="metric"><span>Mispredict</span><strong data-bp-bad>0</strong></div><div class="metric"><span>Accuracy</span><strong data-bp-acc>—</strong></div></div><p class="muted">A one-bit educational predictor simply predicts the previous observed outcome. Modern processors use much more sophisticated mechanisms.</p>';
      controls.innerHTML='<label>Outcome sequence (T/N) <input type="text" value="TTTNTNTTNNNTT" maxlength="30" data-bp-seq></label><button class="button primary" type="button" data-bp-next>Next branch</button><button class="button" type="button" data-bp-reset>Reset</button>';
      const reset=()=>{seq=($('[data-bp-seq]',controls).value.toUpperCase().replace(/[^TN]/g,'')||'T');i=0;pred='T';correct=0;$('[data-bp-pred]',stage).textContent=pred;$('[data-bp-act]',stage).textContent='—';$('[data-bp-up]',stage).textContent='—';draw()};const draw=()=>{$('[data-bp-step]',stage).textContent=`${i} / ${seq.length}`;$('[data-bp-good]',stage).textContent=correct;$('[data-bp-bad]',stage).textContent=i-correct;$('[data-bp-acc]',stage).textContent=i?Math.round(correct/i*100)+'%':'—'};$('[data-bp-next]',controls).onclick=()=>{if(i>=seq.length)return;const actual=seq[i],was=pred,ok=was===actual;if(ok)correct++;pred=actual;i++;$('[data-bp-pred]',stage).textContent=was;$('[data-bp-act]',stage).textContent=actual;$('[data-bp-up]',stage).textContent='next predicts '+pred;$('[data-bp-act]',stage).className=ok?'good':'bad';draw();ping(ok?650:220)};$('[data-bp-reset]',controls).onclick=reset;reset();return;
    }
    if(type==='roofline'){
      stage.innerHTML='<canvas class="math-canvas" width="700" height="260"></canvas><div class="metric-grid"><div class="metric"><span>Peak compute</span><strong data-rf-peak>1000 GFLOP/s</strong></div><div class="metric"><span>Bandwidth</span><strong data-rf-bw>100 GB/s</strong></div><div class="metric"><span>Arithmetic intensity</span><strong data-rf-ai>5 FLOP/B</strong></div><div class="metric"><span>Roofline bound</span><strong data-rf-out>500 GFLOP/s</strong></div></div><p class="muted">Educational roofline upper bound: min(peak compute, memory bandwidth × arithmetic intensity). It is a bound/model, not a guarantee that an application reaches that performance.</p>';
      controls.innerHTML='<label>Peak GFLOP/s <input type="range" min="100" max="5000" step="100" value="1000" data-rf-p></label><label>Bandwidth GB/s <input type="range" min="10" max="1000" step="10" value="100" data-rf-b></label><label>Arithmetic intensity FLOP/B <input type="range" min="1" max="50" value="5" data-rf-a></label>';
      const draw=()=>{const peak=+$('[data-rf-p]',controls).value,bw=+$('[data-rf-b]',controls).value,ai=+$('[data-rf-a]',controls).value,out=Math.min(peak,bw*ai),c=$('canvas',stage),ctx=c.getContext('2d'),w=c.width,h=c.height,pad=45;ctx.clearRect(0,0,w,h);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--line2');ctx.strokeRect(pad,20,w-pad-20,h-pad-20);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent');ctx.lineWidth=3;ctx.beginPath();const x0=pad,y0=h-pad,xk=Math.min(w-20,pad+(peak/bw)/50*(w-pad-20));ctx.moveTo(x0,y0);ctx.lineTo(xk,40);ctx.lineTo(w-20,40);ctx.stroke();const px=pad+ai/50*(w-pad-20),py=y0-(out/peak)*(y0-40);ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent');ctx.beginPath();ctx.arc(px,py,7,0,Math.PI*2);ctx.fill();ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--muted');ctx.font='13px system-ui';ctx.fillText('memory-bound slope',pad+15,h-60);ctx.fillText('compute ceiling',w-160,34);$('[data-rf-peak]',stage).textContent=peak+' GFLOP/s';$('[data-rf-bw]',stage).textContent=bw+' GB/s';$('[data-rf-ai]',stage).textContent=ai+' FLOP/B';$('[data-rf-out]',stage).textContent=out+' GFLOP/s'};$$('input',controls).forEach(x=>x.oninput=draw);draw();return;
    }
    if(type==='reduction'){
      let vals=[1,2,3,4,5,6,7,8],level=0,levels=[vals];
      stage.innerHTML='<div class="reduction-tree" data-red-tree></div><div class="metric-grid"><div class="metric"><span>Input values</span><strong>1…8</strong></div><div class="metric"><span>Stage</span><strong data-red-stage>0</strong></div><div class="metric"><span>Active values</span><strong data-red-count>8</strong></div><div class="metric"><span>Final sum</span><strong data-red-sum>—</strong></div></div><p class="muted">Pairwise tree reduction is an educational parallelization pattern. OpenMP specifies reduction semantics but does not require this exact combination tree or order.</p>';
      controls.innerHTML='<button class="button primary" type="button" data-red-next>Combine next stage</button><button class="button" type="button" data-red-reset>Restart</button>';
      const build=()=>{levels=[vals];while(levels.at(-1).length>1){const a=levels.at(-1),n=[];for(let i=0;i<a.length;i+=2)n.push(i+1<a.length?a[i]+a[i+1]:a[i]);levels.push(n)}};const draw=()=>{$('[data-red-tree]',stage).innerHTML=levels.slice(0,level+1).map((a,i)=>`<div><b>Stage ${i}</b>${a.map(v=>`<span>${v}</span>`).join('')}</div>`).join('');const cur=levels[level];$('[data-red-stage]',stage).textContent=level;$('[data-red-count]',stage).textContent=cur.length;$('[data-red-sum]',stage).textContent=cur.length===1?cur[0]:'—'};build();$('[data-red-next]',controls).onclick=()=>{if(level<levels.length-1){level++;draw();ping(600)}};$('[data-red-reset]',controls).onclick=()=>{level=0;draw()};draw();return;
    }
    if(type==='bellpair'){
      let shots=0,c00=0,c11=0;
      stage.innerHTML='<div class="bell-circuit"><div><code>|0⟩</code><span>── H ──●── M</span></div><div><code>|0⟩</code><span>─────── X── M</span></div></div><div class="metric-grid"><div class="metric"><span>Shots</span><strong data-bell-shots>0</strong></div><div class="metric"><span>00</span><strong data-bell-00>0</strong></div><div class="metric"><span>11</span><strong data-bell-11>0</strong></div><div class="metric"><span>Other</span><strong>0 (ideal model)</strong></div></div><div class="bell-bars"><span><i data-bell-00bar></i><b>00</b></span><span><i data-bell-11bar></i><b>11</b></span></div><p class="muted">Ideal |Φ+⟩ Bell-state model: H on the first qubit followed by CNOT produces (|00⟩ + |11⟩)/√2, so computational-basis measurement yields 00 or 11 with equal theoretical probability. Hardware can show noise.</p>';
      controls.innerHTML='<button class="button primary" type="button" data-bell-one>Measure 1 shot</button><button class="button" type="button" data-bell-100>Run 100 shots</button><button class="button" type="button" data-bell-reset>Reset</button>';
      const one=()=>{shots++;Math.random()<.5?c00++:c11++};const draw=()=>{$('[data-bell-shots]',stage).textContent=shots;$('[data-bell-00]',stage).textContent=c00;$('[data-bell-11]',stage).textContent=c11;$('[data-bell-00bar]',stage).style.width=(shots?c00/shots*100:0)+'%';$('[data-bell-11bar]',stage).style.width=(shots?c11/shots*100:0)+'%'};$('[data-bell-one]',controls).onclick=()=>{one();draw();ping(650)};$('[data-bell-100]',controls).onclick=()=>{for(let i=0;i<100;i++)one();draw();ping(800)};$('[data-bell-reset]',controls).onclick=()=>{shots=c00=c11=0;draw()};draw();return;
    }
    if(type==='evidenceworkbench'){
      const claim=(l.verifiedClaims&&l.verifiedClaims[0])||l.takeaway||'';
      stage.innerHTML='<div class="workflow-grid"><article><span>1</span><h4>Predict</h4><textarea rows="3" data-wb-predict placeholder="Write what you think is true before revealing evidence."></textarea></article><article><span>2</span><h4>Test / reason</h4><textarea rows="3" data-wb-test placeholder="Record the observation, calculation, trace, or reasoning step."></textarea></article><article><span>3</span><h4>Compare</h4><div data-wb-claim class="workflow-claim" hidden></div></article><article><span>4</span><h4>Explain</h4><textarea rows="3" data-wb-explain placeholder="Explain the difference between your prediction and the evidence."></textarea></article></div>';
      controls.innerHTML='<button class="button primary" type="button" data-wb-reveal>Reveal verified claim</button><button class="button" type="button" data-wb-reset>Reset</button><span class="muted" data-wb-status>Prediction first; evidence second.</span>';
      $('[data-wb-reveal]',controls).onclick=()=>{const el=$('[data-wb-claim]',stage);el.hidden=false;el.textContent=claim;$('[data-wb-status]',controls).textContent='Now compare your reasoning with the verified claim.';ping(620)};$('[data-wb-reset]',controls).onclick=()=>{$$('textarea',stage).forEach(x=>x.value='');$('[data-wb-claim]',stage).hidden=true;$('[data-wb-status]',controls).textContent='Prediction first; evidence second.'};return;
    }
    if(type==='faulttree'){
      const claim=(l.verifiedClaims&&l.verifiedClaims[0])||l.takeaway||'';
      stage.innerHTML='<div class="fault-tree"><div class="fault-root">Observed symptom</div><div class="fault-branches"><button type="button" data-fault="A">Hypothesis A</button><button type="button" data-fault="B">Hypothesis B</button><button type="button" data-fault="C">Hypothesis C</button></div><p class="muted" data-fault-out>Select a hypothesis, then define the observation that would eliminate it.</p><textarea rows="3" data-fault-note placeholder="What observation would falsify this hypothesis?"></textarea></div>';
      controls.innerHTML='<button class="button primary" type="button" data-fault-claim>Reveal evidence boundary</button><span class="muted" data-fault-claimtext hidden></span>';
      $$('[data-fault]',stage).forEach(b=>b.onclick=()=>{$$('[data-fault]',stage).forEach(x=>x.classList.remove('selected'));b.classList.add('selected');$('[data-fault-out]',stage).textContent=`${b.textContent}: write a test that can reject it, not merely confirm it.`});$('[data-fault-claim]',controls).onclick=()=>{const e=$('[data-fault-claimtext]',controls);e.hidden=false;e.textContent=claim;ping(560)};return;
    }
    if(type==='sequencebuilder'){
      let steps=[];stage.innerHTML='<div class="sequence-strip" data-seq-list><span class="muted">No steps yet.</span></div><p class="muted">Build a reasoning, event, packet, equation, or state sequence. Then compare the step that depends on the verified claim.</p>';
      controls.innerHTML='<input type="text" data-seq-input maxlength="80" placeholder="Add a step"><button class="button primary" type="button" data-seq-add>Add step</button><button class="button" type="button" data-seq-undo>Undo</button><button class="button" type="button" data-seq-clear>Clear</button>';
      const draw=()=>{$('[data-seq-list]',stage).innerHTML=steps.length?steps.map((s,i)=>`<span><b>${i+1}</b>${esc(s)}</span>`).join(''):'<span class="muted">No steps yet.</span>'};$('[data-seq-add]',controls).onclick=()=>{const i=$('[data-seq-input]',controls),v=i.value.trim();if(v){steps.push(v);i.value='';draw();ping(600)}};$('[data-seq-undo]',controls).onclick=()=>{steps.pop();draw()};$('[data-seq-clear]',controls).onclick=()=>{steps=[];draw()};return;
    }
    if(type==='decisionmatrix'){
      stage.innerHTML='<div class="decision-grid"><div></div><b>Choice A</b><b>Choice B</b><span>Fits verified constraint</span><button type="button" data-dm="a-rule">?</button><button type="button" data-dm="b-rule">?</button><span>Reversible</span><button type="button" data-dm="a-rev">?</button><button type="button" data-dm="b-rev">?</button><span>Needs more evidence</span><button type="button" data-dm="a-ev">?</button><button type="button" data-dm="b-ev">?</button></div><p class="muted" data-dm-out>Tap each cell to cycle Yes → No → Unknown. Only the verified constraint is evidence-backed; other criteria are your scenario assumptions.</p>';
      controls.innerHTML='<button class="button primary" type="button" data-dm-claim>Show verified constraint</button><span class="muted" data-dm-claimtext hidden></span>';const vals=['?','Yes','No'];$$('[data-dm]',stage).forEach(b=>{let i=0;b.onclick=()=>{i=(i+1)%3;b.textContent=vals[i];b.dataset.state=vals[i].toLowerCase()}});$('[data-dm-claim]',controls).onclick=()=>{const x=$('[data-dm-claimtext]',controls);x.hidden=false;x.textContent=(l.verifiedClaims&&l.verifiedClaims[0])||l.takeaway||'';ping(600)};return;
    }
    if(type==='conceptmap'){
      stage.innerHTML='<div class="concept-map"><div class="concept-center">'+esc(l.title.replace(/^[^:]+:\s*/,''))+'</div><div class="concept-slots"><input aria-label="Prerequisite" placeholder="Prerequisite"><input aria-label="Related concept" placeholder="Related concept"><input aria-label="Consequence or use" placeholder="Consequence / use"><input aria-label="Question" placeholder="Open question"></div></div><p class="muted">Use relationship words in your notes: requires, constrains, produces, measures, depends on, differs from.</p>';
      controls.innerHTML='<button class="button primary" type="button" data-cm-evidence>Anchor to verified claim</button><span class="muted" data-cm-out></span>';$('[data-cm-evidence]',controls).onclick=()=>{$('[data-cm-out]',controls).textContent=(l.verifiedClaims&&l.verifiedClaims[0])||l.takeaway||'';ping(640)};return;
    }
    if(type==='hypothesis'){
      stage.innerHTML='<div class="workflow-grid"><article><span>H</span><h4>Hypothesis</h4><textarea rows="3" data-hyp-h placeholder="If…, then…"></textarea></article><article><span>+</span><h4>Supporting observation</h4><textarea rows="3" placeholder="What observation would support it?"></textarea></article><article><span>−</span><h4>Falsifying observation</h4><textarea rows="3" placeholder="What observation would refute it?"></textarea></article><article><span>E</span><h4>Evidence boundary</h4><div data-hyp-e class="workflow-claim" hidden></div></article></div>';
      controls.innerHTML='<button class="button primary" type="button" data-hyp-reveal>Reveal verified claim</button>';$('[data-hyp-reveal]',controls).onclick=()=>{const x=$('[data-hyp-e]',stage);x.hidden=false;x.textContent=(l.verifiedClaims&&l.verifiedClaims[0])||l.takeaway||'';ping(600)};return;
    }
    if(type==='teachback'){
      stage.innerHTML='<div class="teachback"><label>Explain it to a beginner<textarea rows="4" data-tb-simple></textarea></label><label>Explain it to a technical peer<textarea rows="4" data-tb-tech></textarea></label><div class="workflow-claim" data-tb-claim hidden></div></div>';
      controls.innerHTML='<button class="button primary" type="button" data-tb-reveal>Reveal verified claim</button><button class="button" type="button" data-tb-clear>Clear</button>';$('[data-tb-reveal]',controls).onclick=()=>{const x=$('[data-tb-claim]',stage);x.hidden=false;x.textContent=(l.verifiedClaims&&l.verifiedClaims[0])||l.takeaway||'';ping(620)};$('[data-tb-clear]',controls).onclick=()=>{$$('textarea',stage).forEach(x=>x.value='');$('[data-tb-claim]',stage).hidden=true};return;
    }
    if(type==='checklistbuilder'){
      stage.innerHTML='<div class="check-builder" data-cb-list></div><p class="muted">Write observable checks, not vague goals. Label assumptions separately from verified constraints.</p>';
      controls.innerHTML='<input type="text" data-cb-input maxlength="90" placeholder="Add an observable check"><button class="button primary" type="button" data-cb-add>Add</button><button class="button" type="button" data-cb-claim>Show verified constraint</button><span class="muted" data-cb-out></span>';let items=[];const draw=()=>{$('[data-cb-list]',stage).innerHTML=items.length?items.map((x,i)=>`<label><input type="checkbox"> ${esc(x)} <button type="button" data-cb-rm="${i}" aria-label="Remove item">×</button></label>`).join(''):'<span class="muted">No checks yet.</span>';$$('[data-cb-rm]',stage).forEach(b=>b.onclick=()=>{items.splice(+b.dataset.cbRm,1);draw()})};$('[data-cb-add]',controls).onclick=()=>{const i=$('[data-cb-input]',controls),v=i.value.trim();if(v&&items.length<8){items.push(v);i.value='';draw();ping(600)}};$('[data-cb-claim]',controls).onclick=()=>{$('[data-cb-out]',controls).textContent=(l.verifiedClaims&&l.verifiedClaims[0])||l.takeaway||'';ping(620)};draw();return;
    }
    if(['vector','derivative','matrix','force','projectile','wave','doppler','ohm'].includes(type)) return mountMathPhysics(type,stage,controls);
    stage.innerHTML='<p class="muted">This learning object has no interactive model attached.</p>';
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
    if(type==='switchlab'){
      let learned={}; const hosts=[['A','00:00:00:00:00:0A','Port 1'],['B','00:00:00:00:00:0B','Port 2'],['C','00:00:00:00:00:0C','Port 3']];
      stage.innerHTML='<div class="switch-stage"><div class="switch-hosts">'+hosts.map((h,i)=>`<button type="button" data-host="${i}"><b>Host ${h[0]}</b><small>${h[1]} · ${h[2]}</small></button>`).join('')+'</div><div class="switch-core">Ethernet bridge / switch</div><div class="switch-table"><strong>Forwarding database</strong><div data-fdb>Empty — nothing learned yet.</div></div><p class="muted" data-switch-out>Select a source and destination, then send a frame.</p></div>';
      controls.innerHTML='<label>Source <select data-switch-src>'+hosts.map((h,i)=>`<option value="${i}">Host ${h[0]}</option>`).join('')+'</select></label><label>Destination <select data-switch-dst>'+hosts.map((h,i)=>`<option value="${i}">${i?`Host ${h[0]}`:`Host ${hosts[1][0]}`}</option>`).join('')+'</select></label><button class="button primary" type="button" data-switch-send>Send frame →</button><button class="button" type="button" data-switch-reset>Clear table</button>';
      $('[data-switch-dst]',controls).value='1';
      const draw=()=>{$('[data-fdb]',stage).innerHTML=Object.keys(learned).length?Object.entries(learned).map(([m,p])=>`<span><code>${m}</code><b>${p}</b></span>`).join(''):'Empty — nothing learned yet.'};
      $('[data-switch-send]',controls).onclick=()=>{const si=+$('[data-switch-src]',controls).value,di=+$('[data-switch-dst]',controls).value,s=hosts[si],d=hosts[di];if(si===di){$('[data-switch-out]',stage).textContent='Choose two different hosts.';return}learned[s[1]]=s[2];const known=learned[d[1]];$('[data-switch-out]',stage).textContent=known?`The source MAC is learned on ${s[2]}. Destination ${d[1]} is known, so the frame is forwarded to ${known}.`:`The source MAC is learned on ${s[2]}. Destination ${d[1]} is unknown, so this model floods the frame to the other bridge ports.`;draw();ping(known?650:430)};
      $('[data-switch-reset]',controls).onclick=()=>{learned={};draw();$('[data-switch-out]',stage).textContent='Forwarding database cleared.'};draw();return;
    }
    if(type==='kubescheduler'){
      const nodes=[{n:'node-a',cpu:4,mem:8},{n:'node-b',cpu:8,mem:16},{n:'node-c',cpu:2,mem:4}];
      stage.innerHTML='<div class="scheduler-nodes">'+nodes.map((n,i)=>`<div data-knode="${i}"><strong>${n.n}</strong><span>${n.cpu} CPU · ${n.mem} GiB</span><i></i></div>`).join('')+'</div><p class="muted" data-ksched-out>Set Pod requests, then ask the simplified scheduler to find feasible nodes.</p>';
      controls.innerHTML='<label>Pod CPU request <input type="range" min="1" max="10" value="2" data-kcpu> <span data-kcpu-l>2</span></label><label>Pod memory request <input type="range" min="1" max="20" value="4" data-kmem> <span data-kmem-l>4 GiB</span></label><button class="button primary" type="button" data-kschedule>Schedule Pod</button>';
      const upd=()=>{$('[data-kcpu-l]',controls).textContent=$('[data-kcpu]',controls).value;$('[data-kmem-l]',controls).textContent=$('[data-kmem]',controls).value+' GiB'};$$('input',controls).forEach(x=>x.oninput=upd);$('[data-kschedule]',controls).onclick=()=>{const c=+$('[data-kcpu]',controls).value,m=+$('[data-kmem]',controls).value,ok=nodes.map((n,i)=>n.cpu>=c&&n.mem>=m?i:null).filter(x=>x!==null);$$('[data-knode]',stage).forEach((el,i)=>{el.classList.toggle('feasible',ok.includes(i));el.classList.remove('chosen')});if(!ok.length){$('[data-ksched-out]',stage).textContent='No feasible node has enough capacity in this simplified model. The Pod remains unscheduled.';ping(220);return}const chosen=ok.sort((a,b)=>(nodes[b].cpu+nodes[b].mem)-(nodes[a].cpu+nodes[a].mem))[0];$(`[data-knode="${chosen}"]`,stage).classList.add('chosen');$('[data-ksched-out]',stage).textContent=`${ok.length} feasible node${ok.length===1?'':'s'}. This demo selects ${nodes[chosen].n} after filtering; real Kubernetes scoring also considers configured scheduling plugins and policies.`;ping(700)};upd();return;
    }
    if(type==='quorum'){
      stage.innerHTML='<div class="quorum-stage" data-qnodes></div><div class="metric-grid"><div class="metric"><span>Members</span><strong data-qn>5</strong></div><div class="metric"><span>Majority</span><strong data-qmaj>3</strong></div><div class="metric"><span>Failures</span><strong data-qfail>0</strong></div><div class="metric"><span>Can form majority?</span><strong data-qok>Yes</strong></div></div>';
      controls.innerHTML='<label>Cluster size <select data-qsize><option>3</option><option selected>5</option><option>7</option><option>9</option></select></label><label>Failed members <input type="range" min="0" max="4" value="0" data-qfails> <span data-qfails-l>0</span></label>';
      const draw=()=>{const n=+$('[data-qsize]',controls).value,maj=Math.floor(n/2)+1,f=Math.min(n,+$('[data-qfails]',controls).value),alive=n-f,ok=alive>=maj;$('[data-qfails]',controls).max=n;$('[data-qfails]',controls).value=f;$('[data-qfails-l]',controls).textContent=f;$('[data-qnodes]',stage).innerHTML=Array.from({length:n},(_,i)=>`<span class="${i>=alive?'down':'up'}">${i>=alive?'×':'●'}</span>`).join('');$('[data-qn]',stage).textContent=n;$('[data-qmaj]',stage).textContent=maj;$('[data-qfail]',stage).textContent=f;$('[data-qok]',stage).textContent=ok?'Yes':'No';$('[data-qok]',stage).className=ok?'good':'bad'};$('[data-qsize]',controls).onchange=draw;$('[data-qfails]',controls).oninput=draw;draw();return;
    }
    if(type==='sqljoin'){
      const L=[['1','Ada'],['2','Grace'],['4','Linus']],R=[['1','Admin'],['3','Analyst'],['4','Engineer']];
      stage.innerHTML='<div class="join-inputs"><div><strong>People</strong>'+L.map(r=>`<span>${r[0]} · ${r[1]}</span>`).join('')+'</div><div><strong>Roles</strong>'+R.map(r=>`<span>${r[0]} · ${r[1]}</span>`).join('')+'</div></div><div class="join-result"><strong>Result</strong><div data-join-result></div></div>';
      controls.innerHTML='<label>Join type <select data-join-type><option value="inner">INNER JOIN</option><option value="left">LEFT JOIN</option><option value="full">FULL OUTER JOIN</option></select></label>';
      const draw=()=>{const t=$('[data-join-type]',controls).value,ids=[...new Set(t==='inner'?L.map(x=>x[0]).filter(id=>R.some(r=>r[0]===id)):t==='left'?L.map(x=>x[0]):[...L,...R].map(x=>x[0]))].sort(),rows=ids.filter(id=>t!=='inner'||(L.some(x=>x[0]===id)&&R.some(x=>x[0]===id))).map(id=>{const l=L.find(x=>x[0]===id),r=R.find(x=>x[0]===id);return `<span><b>${id}</b>${l?l[1]:'NULL'} · ${r?r[1]:'NULL'}</span>`});$('[data-join-result]',stage).innerHTML=rows.join('')||'<em>No rows</em>'};$('[data-join-type]',controls).onchange=draw;draw();return;
    }
    if(type==='riskmatrix'){
      stage.innerHTML='<div class="risk-grid" data-risk-grid></div><div class="metric-grid"><div class="metric"><span>Likelihood</span><strong data-risk-l>3</strong></div><div class="metric"><span>Impact</span><strong data-risk-i>3</strong></div><div class="metric"><span>Example score</span><strong data-risk-s>9</strong></div><div class="metric"><span>Example band</span><strong data-risk-b>Medium</strong></div></div><p class="muted">This 1–5 × 1–5 scoring scheme is an educational example, not a universal NIST scoring formula. Organizations define their own likelihood, impact, and acceptance thresholds.</p>';
      controls.innerHTML='<label>Likelihood <input type="range" min="1" max="5" value="3" data-rl></label><label>Impact <input type="range" min="1" max="5" value="3" data-ri></label>';
      const draw=()=>{const l=+$('[data-rl]',controls).value,i=+$('[data-ri]',controls).value,s=l*i,b=s<=4?'Low':s<=12?'Medium':'High';$('[data-risk-l]',stage).textContent=l;$('[data-risk-i]',stage).textContent=i;$('[data-risk-s]',stage).textContent=s;$('[data-risk-b]',stage).textContent=b;$('[data-risk-grid]',stage).innerHTML=Array.from({length:25},(_,k)=>{const y=5-Math.floor(k/5),x=k%5+1,on=x===l&&y===i;return `<span class="${on?'selected':''}" title="Likelihood ${x}, impact ${y}">${x}×${y}</span>`}).join('')};$$('input',controls).forEach(x=>x.oninput=draw);draw();return;
    }
    if(type==='integral'){
      stage.innerHTML='<canvas class="wave-canvas" width="700" height="260"></canvas><div class="metric-grid"><div class="metric"><span>Function</span><strong>f(x)=x²</strong></div><div class="metric"><span>Interval</span><strong>0 → 3</strong></div><div class="metric"><span>Rectangles</span><strong data-int-n>8</strong></div><div class="metric"><span>Left-sum estimate</span><strong data-int-a>—</strong></div></div>';
      controls.innerHTML='<label>Rectangles <input type="range" min="2" max="60" value="8" data-int-range> <span data-int-l>8</span></label>';
      const draw=()=>{const n=+$('[data-int-range]',controls).value,a=0,b=3,dx=(b-a)/n,sum=0,c=$('canvas',stage),ctx=c.getContext('2d'),w=c.width,h=c.height,p=30,sx=(w-2*p)/(b-a),sy=(h-2*p)/9;ctx.clearRect(0,0,w,h);ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--line2');ctx.beginPath();ctx.moveTo(p,h-p);ctx.lineTo(w-p,h-p);ctx.stroke();ctx.fillStyle='rgba(220,120,60,.18)';ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent');for(let j=0;j<n;j++){const x=a+j*dx,y=x*x;sum+=y*dx;ctx.fillRect(p+(x-a)*sx,h-p-y*sy,dx*sx,y*sy);ctx.strokeRect(p+(x-a)*sx,h-p-y*sy,dx*sx,y*sy)}ctx.beginPath();for(let k=0;k<=160;k++){const x=a+(b-a)*k/160,y=x*x,px=p+(x-a)*sx,py=h-p-y*sy;k?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.stroke();$('[data-int-n]',stage).textContent=n;$('[data-int-a]',stage).textContent=sum.toFixed(4);$('[data-int-l]',controls).textContent=n};$('[data-int-range]',controls).oninput=draw;draw();return;
    }
    if(type==='seriescircuit'){
      stage.innerHTML='<div class="series-diagram"><span>+ source −</span><i>R₁</i><i>R₂</i><i>R₃</i></div><div class="metric-grid"><div class="metric"><span>Total R</span><strong data-sr>30 Ω</strong></div><div class="metric"><span>Current</span><strong data-si>0.40 A</strong></div><div class="metric"><span>V₁</span><strong data-sv1>4.0 V</strong></div><div class="metric"><span>V₂ + V₃</span><strong data-sv23>8.0 V</strong></div></div>';
      controls.innerHTML='<label>Source voltage <input type="range" min="1" max="48" value="12" data-svv> <span data-svv-l>12 V</span></label><label>R₁ <input type="range" min="1" max="50" value="10" data-sr1></label><label>R₂ <input type="range" min="1" max="50" value="10" data-sr2></label><label>R₃ <input type="range" min="1" max="50" value="10" data-sr3></label>';
      const draw=()=>{const v=+$('[data-svv]',controls).value,r1=+$('[data-sr1]',controls).value,r2=+$('[data-sr2]',controls).value,r3=+$('[data-sr3]',controls).value,r=r1+r2+r3,i=v/r;$('[data-sr]',stage).textContent=r.toFixed(1)+' Ω';$('[data-si]',stage).textContent=i.toFixed(3)+' A';$('[data-sv1]',stage).textContent=(i*r1).toFixed(2)+' V';$('[data-sv23]',stage).textContent=(i*(r2+r3)).toFixed(2)+' V';$('[data-svv-l]',controls).textContent=v+' V'};$$('input',controls).forEach(x=>x.oninput=draw);draw();return;
    }
    if(type==='ohm'){
      stage.innerHTML='<div class="metric-grid"><div class="metric"><span>Voltage</span><strong data-v>12 V</strong></div><div class="metric"><span>Resistance</span><strong data-r>6 Ω</strong></div><div class="metric"><span>Current</span><strong data-i>2 A</strong></div><div class="metric"><span>Power</span><strong data-p>24 W</strong></div></div>';controls.innerHTML='<label>Voltage <input type="range" min="1" max="48" value="12" data-vr></label><label>Resistance <input type="range" min="1" max="100" value="6" data-rr></label>';const upd=()=>{let v=+$('[data-vr]',controls).value,r=+$('[data-rr]',controls).value,i=v/r;$('[data-v]',stage).textContent=v+' V';$('[data-r]',stage).textContent=r+' Ω';$('[data-i]',stage).textContent=i.toFixed(2)+' A';$('[data-p]',stage).textContent=(v*i).toFixed(2)+' W'};$$('input',controls).forEach(x=>x.oninput=upd);upd();return;
    }
  }

  function saveRecall(){try{preferences.setItem(STORAGE.recall,JSON.stringify(recallState))}catch{}}
  function saveFlash(){try{preferences.setItem(STORAGE.flashcards,JSON.stringify(flashState))}catch{}}
  function recordRecall(id,correct){const r=recallState[id]||{correct:0,total:0,last:0};r.total++;if(correct)r.correct++;r.last=Date.now();recallState[id]=r;saveRecall();renderRetentionStats()}
  function renderRetentionStats(){const vals=Object.values(recallState),attempts=vals.reduce((a,r)=>a+(r.total||0),0),correct=vals.reduce((a,r)=>a+(r.correct||0),0),mastered=Object.values(flashState).filter(x=>x==='got').length;const a=$('#recall-attempts'),acc=$('#recall-accuracy'),fm=$('#flash-mastered');if(a)a.textContent=attempts;if(acc)acc.textContent=attempts?Math.round(correct/attempts*100)+'%':'—';if(fm)fm.textContent=mastered}
  function newRecallChallenge(preferWeak=false){const pool=D.lessons.filter(l=>l.quiz);if(!pool.length)return;let candidates=pool;if(preferWeak){const weak=pool.filter(l=>recallState[l.id]?.total&&recallState[l.id].correct/recallState[l.id].total<.75);if(weak.length)candidates=weak}const l=candidates[Math.floor(Math.random()*candidates.length)];recallLessonId=l.id;const q=l.quiz,stage=$('#recall-stage');if(!stage)return;stage.innerHTML=`<p class="challenge-domain">${esc(domainMap.get(l.domain)?.name||l.domain)} · ${esc(l.category)}</p><h4>${esc(q.q)}</h4><div class="recall-options">${q.options.map((o,i)=>`<button type="button" data-recall-option="${i}">${esc(o)}</button>`).join('')}</div><p class="recall-feedback muted" data-recall-feedback>Answer from memory before opening the lesson.</p>`;$$('[data-recall-option]',stage).forEach(b=>b.onclick=()=>{const i=+b.dataset.recallOption,correct=i===q.answer;$$('[data-recall-option]',stage).forEach(x=>x.disabled=true);b.classList.add(correct?'correct':'wrong');const cb=$(`[data-recall-option="${q.answer}"]`,stage);if(cb)cb.classList.add('correct');$('[data-recall-feedback]',stage).textContent=(correct?'Correct. ':'Not yet. ')+(q.explain||l.takeaway);recordRecall(l.id,correct);ping(correct?720:240,.1,.025);$('#recall-open').hidden=false});$('#recall-open').hidden=true}
  function nextFlashcard(){const all=D.glossary||[];if(!all.length)return;flashIndex=(flashIndex+1)%all.length;flashRevealed=false;renderFlashcard()}
  function renderFlashcard(){const all=D.glossary||[],g=all[flashIndex%Math.max(1,all.length)],stage=$('#flashcard-stage');if(!g||!stage)return;stage.innerHTML=`<span class="flash-domain">${esc(domainMap.get(g.domain)?.name||g.domain)}</span><strong>${esc(g.term)}</strong><p>${flashRevealed?esc(g.definition):'Define this term from memory, then reveal the answer.'}</p>`;$('#flash-reveal').hidden=flashRevealed;$('#flash-again').hidden=!flashRevealed;$('#flash-got').hidden=!flashRevealed}
  function markFlash(status){const g=(D.glossary||[])[flashIndex%(D.glossary||[]).length];if(!g)return;flashState[g.term]=status;saveFlash();renderRetentionStats();nextFlashcard()}
  function renderLabGallery(){
    const grid=$('#lab-grid');if(!grid)return;let labs=D.lessons.filter(l=>isInteractiveExperience(l));
    if(labDomain!=='all')labs=labs.filter(l=>l.domain===labDomain);if(labDifficulty!=='all')labs=labs.filter(l=>l.difficulty===labDifficulty);
    const visible=labs.slice(0,labLimit);const count=$('#lab-count');if(count)count.textContent=`${labs.length} matching interactive learning object${labs.length===1?'':'s'} · showing ${Math.min(labLimit,labs.length)}`;
    grid.innerHTML=visible.map(l=>`<a class="lab-card lab-tile-link" href="${esc(standaloneExperienceURL(l,'lab'))}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(l.title)} in a full-screen lab page">
      <div class="lab-visual" aria-hidden="true"><span>${esc(domainMap.get(l.domain)?.icon||'◇')}</span><i></i><i></i><i></i></div>
      <p class="eyebrow">${esc(domainMap.get(l.domain)?.name||l.domain)} / ${esc(l.kind)}</p><h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p>
      <div><span>${esc(l.difficulty)} · ${l.minutes} min</span><span class="text-button">Launch ${l.interactive?'model':'lab'} ↗</span></div>
    </a>`).join('')||'<article class="lab-card"><h3>No labs match these filters.</h3><p>Change the domain or difficulty to see more.</p></article>';
    const tog=$('#toggle-labs');if(tog){tog.hidden=labLimit>=labs.length;tog.textContent='Show 12 more labs';}
  }
  function renderLabFilters(){const d=$('#lab-domain');if(d&&d.options.length===1)d.insertAdjacentHTML('beforeend',D.domains.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join(''));if(d)d.value=labDomain;const lv=$('#lab-level');if(lv)lv.value=labDifficulty}
  function startSprint(){const pool=D.lessons.filter(l=>l.quiz);const shuffled=[...pool].sort(()=>Math.random()-.5).slice(0,5);sprintState={items:shuffled,index:0,score:0,answered:false};renderSprint()}
  function renderSprint(){const stage=$('#sprint-stage');if(!stage)return;if(!sprintState){stage.innerHTML='<p class="muted">Five source-verified recall questions. No timer, no penalty—just retrieval practice.</p>';return}if(sprintState.index>=sprintState.items.length){stage.innerHTML=`<div class="sprint-finish"><strong>${sprintState.score} / ${sprintState.items.length}</strong><p>${sprintState.score===5?'Perfect retrieval.':sprintState.score>=4?'Strong recall. Revisit the one that missed.':'Useful signal. Review the missed concepts, then try again later.'}</p><button class="button primary" type="button" data-sprint-again>Run another five</button></div>`;$('[data-sprint-again]',stage).onclick=startSprint;return}const l=sprintState.items[sprintState.index],q=l.quiz;stage.innerHTML=`<p class="challenge-domain">Question ${sprintState.index+1} / ${sprintState.items.length} · ${esc(domainMap.get(l.domain)?.name||l.domain)}</p><h4>${esc(q.q)}</h4><div class="recall-options">${q.options.map((o,i)=>`<button type="button" data-sprint-option="${i}">${esc(o)}</button>`).join('')}</div><p class="recall-feedback muted" data-sprint-feedback>Retrieve first. Then choose.</p>`;$$('[data-sprint-option]',stage).forEach(b=>b.onclick=()=>{if(sprintState.answered)return;sprintState.answered=true;const i=+b.dataset.sprintOption,ok=i===q.answer;if(ok)sprintState.score++;recordRecall(l.id,ok);$$('[data-sprint-option]',stage).forEach(x=>x.disabled=true);b.classList.add(ok?'correct':'wrong');const c=$(`[data-sprint-option="${q.answer}"]`,stage);if(c)c.classList.add('correct');$('[data-sprint-feedback]',stage).innerHTML=`${ok?'Correct.':'Not yet.'} ${esc(q.explanation||l.takeaway)} <button class="text-button" type="button" data-sprint-next>${sprintState.index===4?'Finish':'Next question →'}</button>`;$('[data-sprint-next]',stage).onclick=()=>{sprintState.index++;sprintState.answered=false;renderSprint()};ping(ok?720:230)});}
  function initPractice(){renderRetentionStats();newRecallChallenge();renderFlashcard();renderLabFilters();renderLabGallery();renderSprint();const rn=$('#recall-next');if(rn)rn.onclick=()=>newRecallChallenge();const ro=$('#recall-open');if(ro)ro.onclick=()=>recallLessonId&&openLesson(recallLessonId);const fr=$('#flash-reveal');if(fr)fr.onclick=()=>{flashRevealed=true;renderFlashcard()};const fa=$('#flash-again');if(fa)fa.onclick=()=>markFlash('again');const fg=$('#flash-got');if(fg)fg.onclick=()=>markFlash('got');const fs=$('#flashcard-stage');if(fs)fs.onclick=()=>{if(!flashRevealed){flashRevealed=true;renderFlashcard()}};const rw=$('#review-weak');if(rw)rw.onclick=()=>newRecallChallenge(true);const tl=$('#toggle-labs');if(tl)tl.onclick=()=>{labLimit+=12;renderLabGallery()};const ld=$('#lab-domain');if(ld)ld.onchange=()=>{labDomain=ld.value;labLimit=12;renderLabGallery()};const ll=$('#lab-level');if(ll)ll.onchange=()=>{labDifficulty=ll.value;labLimit=12;renderLabGallery()};const lr=$('#random-lab');if(lr)lr.onclick=()=>{let pool=D.lessons.filter(l=>(l.interactive||l.kind==='Lab')&&(labDomain==='all'||l.domain===labDomain)&&(labDifficulty==='all'||l.difficulty===labDifficulty));if(pool.length){const pick=pool[Math.floor(Math.random()*pool.length)];window.open(standaloneExperienceURL(pick,'lab'),'_blank','noopener,noreferrer')}};const ss=$('#sprint-start');if(ss)ss.onclick=startSprint;}

  function renderMastery(){
    const grid=$('#mastery-grid'); if(!grid)return;
    const rows=D.domains.map(d=>{
      const ls=D.lessons.filter(l=>l.domain===d.id), done=ls.filter(l=>completed.has(l.id)).length;
      const attempts=ls.reduce((n,l)=>n+(recallState[l.id]?.total||0),0), correct=ls.reduce((n,l)=>n+(recallState[l.id]?.correct||0),0);
      const recall=attempts?Math.round(correct/attempts*100):null, pct=ls.length?Math.round(done/ls.length*100):0;
      return {d,total:ls.length,done,pct,attempts,recall};
    });
    grid.innerHTML=rows.map(r=>`<article class="mastery-domain"><div class="mastery-domain-head"><span>${esc(r.d.icon)}</span><div><p class="eyebrow">${esc(r.d.name)}</p><h3>${r.done} / ${r.total} completed</h3></div></div><div class="mastery-bar"><i style="width:${r.pct}%"></i></div><div class="mastery-metrics"><span><strong>${r.pct}%</strong> completion</span><span><strong>${r.recall===null?'—':r.recall+'%'}</strong> recall</span><span><strong>${r.attempts}</strong> attempts</span></div><a class="text-button" href="learn-browse.html?domain=${encodeURIComponent(r.d.id)}">Study ${esc(r.d.name)} ↗</a></article>`).join('');
    const weak=D.lessons.filter(l=>recallState[l.id]?.total).map(l=>({l,r:recallState[l.id],rate:recallState[l.id].correct/recallState[l.id].total})).sort((a,b)=>a.rate-b.rate||b.r.total-a.r.total).slice(0,5);
    const weakBox=$('#mastery-weak'); if(weakBox)weakBox.innerHTML=weak.length?`<div class="mastery-list">${weak.map(x=>`<button type="button" data-master-lesson="${esc(x.l.id)}"><span>${esc(x.l.title)}</span><strong>${Math.round(x.rate*100)}%</strong></button>`).join('')}</div>`:'<p class="muted">Answer some recall questions first. Missed answers will appear here so review is evidence-driven.</p>';
    const nextBox=$('#mastery-next'); if(nextBox){const unfinished=D.lessons.filter(l=>!completed.has(l.id));const recent=preferences.getItem(STORAGE.recent);const pick=(recent&&lessonMap.get(recent)&&!completed.has(recent))?lessonMap.get(recent):unfinished[Math.floor(Math.random()*Math.max(1,unfinished.length))];nextBox.innerHTML=pick?`<p>${esc(pick.summary)}</p><button class="button primary" type="button" data-master-lesson="${esc(pick.id)}">Continue with ${esc(pick.title)} ↗</button>`:'<p>You have completed every published object in this browser. That is an extraordinary amount of study.</p>'}
    $$('[data-master-lesson]').forEach(b=>b.onclick=()=>openLesson(b.dataset.masterLesson));
  }

  function applyLibraryPage(){
    const page=document.body.dataset.libraryPage||'home';
    const map={home:[],browse:['curriculum','discover','atlas'],paths:['paths'],practice:['practice'],mastery:['mastery'],labs:['labs'],glossary:['glossary'],map:['connections'],verify:['verification-standard','evidence-guide']};
    const labels={browse:['02 / BROWSE + SEARCH','Browse the knowledge library.','Use the curriculum, filters, search, and roadmap without scrolling past every other learning tool.'],paths:['03 / GUIDED LEARNING','Follow a path.','Curated sequences connect prerequisites and show exactly what to learn next.'],practice:['04 / ACTIVE RECALL','Practice for retention.','Quizzes and flashcards make you retrieve knowledge instead of merely rereading it.'],mastery:['05 / MASTERY','See what is sticking.','Use completion and recall history stored in this browser to choose what to review next.'],labs:['05 / INTERACTIVE LABS','Learn by changing the system.','Launch interactive models and guided labs across systems, security, HPC, mathematics, physics, Kubernetes, and quantum computing.'],glossary:['06 / GLOSSARY','Remove the vocabulary barrier.','Search technical terms and jump straight into the strongest related lesson.'],map:['07 / KNOWLEDGE MAP','See how everything connects.','Explore cross-domain relationships without searching through a long document.'],verify:['08 / EVIDENCE','Verify the claim yourself.','Every published object links directly to the standards, official documentation, government guidance, primary paper, or academic source used to support it.']};
    const all=['verification-standard','continue-learning','domains','curriculum','discover','practice','mastery','labs','paths','connections','atlas','glossary','evidence-guide'];
    all.forEach(id=>{const el=$('#'+id);if(el)el.hidden=!(map[page]||map.home).includes(id)});
    const hero=$('#library-view > .hero'),stats=$('.stat-band'),intro=$('#learn-page-intro');
    if(hero)hero.hidden=page!=='home';
    if(stats){stats.hidden=true;stats.style.display='none';}
    const principles=$('.principles');
    if(principles){principles.hidden=true;principles.style.display='none';}
    if(intro){intro.hidden=page==='home';if(page!=='home'){const x=labels[page]||labels.browse;$('#learn-page-kicker').textContent=x[0];$('#learn-page-title').textContent=x[1];$('#learn-page-copy').textContent=x[2]}}
    $('[data-learn-page]').forEach(a=>{if(a.dataset.learnPage===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  }

  function randomLesson(){const l=D.lessons[Math.floor(Math.random()*D.lessons.length)];openLesson(l.id);ping(610)}
  function clearFilters(){ $('#knowledge-search').value='';$('#domain-filter').value='all';$('#level-filter').value='all';$('#type-filter').value='all';$('#saved-filter').checked=false;displayLimit=18;renderLessons(); }

  function updateReadingProgress(){
    if(!currentLesson)return; const doc=document.documentElement, max=doc.scrollHeight-innerHeight, pct=max>0?scrollY/max*100:0; $('#reading-progress').style.width=Math.min(100,Math.max(0,pct))+'%';
  }
  function constellation(){
    const canvas=$('#constellation');if(!canvas)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;let nodes=[],raf=0;
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
    $('#sound-mode').onclick=()=>{soundMode=soundMode==='off'?'educational':soundMode==='educational'?'full':'off';preferences.setItem(STORAGE.sound,soundMode);updateSoundButton();toast(`Sound: ${soundMode}`);if(soundMode!=='off')ping(590)};
    document.addEventListener('portfolio:motion',()=>{motionPaused=window.PortfolioTheme?.isPaused()||false;});
    document.addEventListener('portfolio:theme',()=>renderKnowledgeGraph());
    const primaryNav=$('.site-header nav'),mobileMenu=$('#mobile-menu');
    if(primaryNav&&mobileMenu){
      primaryNav.id=primaryNav.id||'primary-nav';
      mobileMenu.setAttribute('aria-controls',primaryNav.id);

      if(!primaryNav.querySelector('a[href="index.html#direction"]')){
        const direction=document.createElement('a');direction.href='index.html#direction';direction.textContent='Direction';primaryNav.append(direction);
      }
      if(!primaryNav.querySelector('.nav-games')){
        const games=document.createElement('details');games.className='nav-games';
        games.innerHTML='<summary>Game Development</summary><div class="nav-games-menu"><a href="project-battle-chess.html">3D Battle Chess</a><a href="play-evil-wizard.html">Defeat the Evil Wizard</a></div>';
        primaryNav.append(games);
      }
      const closePrimaryNav=()=>{
        primaryNav.classList.remove('open');
        primaryNav.querySelector('.nav-games')?.removeAttribute('open');
        mobileMenu.setAttribute('aria-expanded','false');
        mobileMenu.setAttribute('aria-label','Open navigation');
      };
      mobileMenu.onclick=e=>{
        e.preventDefault();e.stopPropagation();
        const open=primaryNav.classList.toggle('open');
        if(!open)primaryNav.querySelector('.nav-games')?.removeAttribute('open');
        mobileMenu.setAttribute('aria-expanded',String(open));
        mobileMenu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
      };
      primaryNav.addEventListener('click',e=>{if(e.target.closest('a'))closePrimaryNav()});
      document.addEventListener('click',e=>{
        const games=primaryNav.querySelector('.nav-games');
        if(games?.open&&!games.contains(e.target))games.removeAttribute('open');
        if(primaryNav.classList.contains('open')&&!primaryNav.contains(e.target)&&!mobileMenu.contains(e.target))closePrimaryNav();
      });
      document.addEventListener('keydown',e=>{if(e.key==='Escape'&&primaryNav.classList.contains('open')){closePrimaryNav();mobileMenu.focus()}});
      addEventListener('resize',()=>{if(innerWidth>820)closePrimaryNav()});
    }
    document.addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);if((e.key==='/'||(e.key.toLowerCase()==='k'&&(e.ctrlKey||e.metaKey)))&&!typing){e.preventDefault();if(currentLesson)closeLesson();setTimeout(()=>$('#knowledge-search').focus(),0)}if(e.key==='Escape'&&currentLesson)closeLesson();if((e.key==='r'||e.key==='R')&&!typing&&!currentLesson)randomLesson();if((e.key==='g'||e.key==='G')&&!typing&&!currentLesson){e.preventDefault();$('#glossary').scrollIntoView({behavior:motionPaused?'auto':'smooth'});setTimeout(()=>$('#glossary-search').focus(),250)}});
    window.addEventListener('scroll',()=>requestAnimationFrame(updateReadingProgress),{passive:true});
    let graphResize;window.addEventListener('resize',()=>{clearTimeout(graphResize);graphResize=setTimeout(renderKnowledgeGraph,120)});
    window.addEventListener('popstate',()=>route(false));
    document.addEventListener('click',e=>{if(soundMode==='full'&&e.target.closest('button,a'))ping(330,.035,.012)});
  }
  function route(push=false){
    const u=new URL(location.href), lesson=u.searchParams.get('lesson'), dom=u.searchParams.get('domain'), q=u.searchParams.get('q');
    if(lesson&&lessonMap.has(lesson)){openLesson(lesson,false);return}
    if((dom||q)&&(document.body.dataset.libraryPage||'home')==='home'){const dest=new URL('learn-browse.html',location.href);if(dom)dest.searchParams.set('domain',dom);if(q)dest.searchParams.set('q',q);location.replace(dest);return}
    if(currentLesson) closeLesson(false);
    applyLibraryPage();
    if(dom&&domainMap.has(dom)) $('#domain-filter').value=dom;
    if(q) $('#knowledge-search').value=q;
    renderLessons();
  }

  initPrefs(); renderStats(); renderFilters(); renderDomains(); renderContinue(); renderCurriculum(); renderLessons(); renderPaths(); renderAtlas(); renderGlossary(); renderKnowledgeGraph(); initPractice(); renderMastery(); initEvents(); if((document.body.dataset.libraryPage||'home')==='home') constellation(); refreshVoices(); if('speechSynthesis' in window)speechSynthesis.onvoiceschanged=refreshVoices; applyLibraryPage(); route(false);
})();
