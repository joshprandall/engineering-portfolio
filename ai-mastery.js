(() => {
'use strict';
const page=(location.pathname.split('/').pop()||'ai-development.html').toLowerCase();
if(!(page==='ai-development.html'||page.startsWith('ai-')))return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list=items=>'<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
if(!document.querySelector('link[data-ai-mastery]')){const l=document.createElement('link');l.rel='stylesheet';l.href='ai-mastery.css?v=20261109-v1';l.dataset.aiMastery='1';document.head.append(l);}
fetch('assets/ai-build-mastery.json?v=20261109-v1',{cache:'no-cache'}).then(r=>r.json()).then(data=>{
 const systems=new Map(data.systems.map(x=>[x.id,x]));
 function card(s){return '<article class="ai-builder-card"><p class="eyebrow">'+esc(s.stack[0]||'AI BUILD')+'</p><h3>'+esc(s.title)+'</h3><p>'+esc(s.goal)+'</p><div class="ai-builder-meta"><span class="academy-pill">'+s.steps.length+' build gates</span><span class="academy-pill">'+s.metrics.length+' evaluation dimensions</span></div><a class="button primary" href="'+esc(s.page)+'">Build this system →</a></article>'}
 function overview(){
   if(document.querySelector('.ai-mastery-overview'))return;
   const main=document.querySelector('main');if(!main)return;
   const first=main.querySelector('section');
   const sec=document.createElement('section');sec.className='wrap ai-mastery-overview';sec.innerHTML='<p class="eyebrow">AI BUILDER ACADEMY / WORKING SYSTEMS</p><h2>Learn the mechanism. Build the baseline. Measure the failure. Then scale.</h2><p class="lead">Every build path starts with a measurable task and the smallest working baseline. The advanced architecture is added only when a specific failure justifies it. Each page includes an interactive concept lab, implementation sequence, evaluation plan, failure modes, safety controls, and a starter scaffold.</p><div class="ai-build-checklist"><article><strong>1. Define</strong><p>Task, input/output contract, non-goals, data provenance.</p></article><article><strong>2. Baseline</strong><p>Build the simplest system that creates a measurable reference.</p></article><article><strong>3. Evaluate</strong><p>Held-out cases, error slices, latency/cost, safety and regressions.</p></article><article><strong>4. Productionize</strong><p>Version, observe, constrain, approve side effects, and retain rollback.</p></article></div><div class="ai-builder-grid">'+data.systems.map(card).join('')+'</div>';
   first?first.after(sec):main.prepend(sec);
 }
 function buildPage(){
   const id=document.body.dataset.aiBuild;if(!id)return;
   const s=systems.get(id);if(!s||document.querySelector('.ai-build-master'))return;
   const main=document.querySelector('main');if(!main)return;
   const hero=main.querySelector('section');
   const steps=s.steps.map((x,i)=>'<article class="ai-build-step"><span>STEP '+String(i+1).padStart(2,'0')+'</span><strong>'+esc(x)+'</strong><p>Do not advance until the current step produces evidence you can inspect.</p></article>').join('');
   const metrics=s.metrics.map(x=>'<article class="ai-build-metric"><strong>'+esc(x)+'</strong><p>Define the target and acceptable regression before promotion.</p></article>').join('');
   const code=esc(s.starter);
   const sec=document.createElement('section');sec.className='wrap ai-build-master';sec.innerHTML='<p class="eyebrow">BUILD THIS AI / ENGINEERING PATH</p><h2>'+esc(s.title)+': from first baseline to a system you can evaluate.</h2><p class="lead">'+esc(s.goal)+'</p><div class="ai-build-grid"><div class="ai-build-stack"><article class="ai-build-panel"><p class="eyebrow">PREREQUISITES</p><h3>Know this before you scale complexity.</h3>'+list(s.prereq)+'</article><article class="ai-build-panel"><p class="eyebrow">DATA / INPUT CONTRACT</p><h3>Define the evidence before the model.</h3><p>'+esc(s.data)+'</p></article><article class="ai-build-panel"><p class="eyebrow">BASELINE</p><h3>Start with something you can beat.</h3><p>'+esc(s.baseline)+'</p></article><article class="ai-build-panel"><p class="eyebrow">STACK</p><h3>Suggested implementation path</h3>'+list(s.stack)+'</article></div><div><div class="ai-build-steps">'+steps+'</div><h3 style="margin-top:1.4rem">Evaluation contract</h3><div class="ai-build-metrics">'+metrics+'</div></div></div><div class="ai-build-grid" style="margin-top:1rem"><article class="ai-build-panel"><p class="eyebrow">FAILURE MODES</p><h3>Break it before production does.</h3>'+list(s.failures)+'</article><article class="ai-build-panel"><p class="eyebrow">PRODUCTION CHECKLIST</p><h3>Operationalize the evidence.</h3>'+list(s.production)+'</article></div><div class="ai-build-code"><header><strong>Starter scaffold</strong><button class="button" type="button" data-copy-ai-code>Copy code</button></header><pre><code>'+code+'</code></pre></div><div class="ai-build-checklist"><article><strong>Mechanism</strong><p>I can explain the underlying algorithm without product names.</p></article><article><strong>Implementation</strong><p>I can build the baseline and reproduce its result.</p></article><article><strong>Evaluation</strong><p>I can show a held-out failure case and the metric that exposes it.</p></article><article><strong>Operations</strong><p>I can state the safety boundary, monitoring signal, and rollback path.</p></article></div>';
   hero?hero.after(sec):main.prepend(sec);
   sec.querySelector('[data-copy-ai-code]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(s.starter);sec.querySelector('[data-copy-ai-code]').textContent='Copied ✓'}catch{sec.querySelector('[data-copy-ai-code]').textContent='Select code to copy'}});
 }
 if(page==='ai-development.html')overview();else buildPage();
}).catch(err=>console.error('[ai-mastery]',err));
})();