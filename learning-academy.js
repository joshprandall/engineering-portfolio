(() => {
'use strict';
const page=(location.pathname.split('/').pop()||'learn.html').toLowerCase();
if(!(page.startsWith('learn')||page==='lesson.html'))return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list=items=>'<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
const loadStyle=()=>{if(document.querySelector('link[data-learning-academy]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='learning-academy.css?v=20261109-v1';l.dataset.learningAcademy='1';document.head.append(l)};
loadStyle();

Promise.all([
 fetch('assets/learning-academy.json?v=20261109-v1',{cache:'no-cache'}).then(r=>r.json()),
 Promise.resolve(window.JR_KNOWLEDGE||null)
]).then(([academy,D])=>{
 const programs=new Map(academy.programs.map(p=>[p.id,p]));
 const domainNames={cloud:'Cloud & Systems',advanced:'Advanced Computing',software:'Software Engineering',cyber:'Cybersecurity',leadership:'Leadership & IT Management',math:'Mathematics',physics:'Physics'};
 const subjectMap={'learn-cloud.html':'cloud','learn-advanced.html':'advanced','learn-software.html':'software','learn-cyber.html':'cyber','learn-leadership.html':'leadership','learn-math.html':'math','learn-physics.html':'physics'};

 function programStats(id){
   if(!D)return {lessons:'—',labs:'—',reviewed:'—'};
   const lessons=D.lessons.filter(l=>l.domain===id);
   return {
     lessons:lessons.length,
     labs:lessons.filter(l=>l.kind==='Lab'||l.interactive||l.flagship).length,
     reviewed:lessons.filter(l=>l.editorialReview?.status==='reviewed').length
   };
 }
 function programCard(p){
   const s=programStats(p.id);
   return '<article class="academy-program-card"><p class="eyebrow">'+esc(p.level)+'</p><h3>'+esc(p.title)+'</h3><p>'+esc(p.description)+'</p><div class="academy-program-meta"><span class="academy-pill">'+esc(s.lessons)+' learning objects</span><span class="academy-pill">'+esc(s.labs)+' labs/interactive</span><span class="academy-pill">'+esc(s.reviewed)+' reviewed source lessons</span></div><strong>Program outcomes</strong>'+list(p.outcomes.slice(0,3))+'<a class="button primary" href="'+esc(p.page)+'">Open program syllabus →</a></article>';
 }
 function overview(){
   if(document.querySelector('.academy-overview'))return;
   const anchor=document.querySelector('#verification-standard')||document.querySelector('.stat-band')||document.querySelector('#domains');
   if(!anchor)return;
   const sec=document.createElement('section');sec.className='academy-overview';sec.innerHTML='<div class="shell"><p class="eyebrow">OPEN ENGINEERING ACADEMY / SELF-PACED</p><h2>A course platform—not a pile of pages.</h2><p class="academy-intro">Programs are organized around prerequisites, outcomes, instruction, practice, labs, source verification, assessment, capstones, and progressive depth from beginner orientation through research-bridge work. No enrollment or certificate claim is required: learners can use the material at their own pace and preserve their own evidence of mastery.</p><div class="academy-standard"><article><span>01 / SYLLABUS</span><h3>Know the route before you start.</h3><p>Each program exposes prerequisites, modules, outcomes, capstone expectations, and the evidence used to judge learning.</p></article><article><span>02 / INSTRUCTION</span><h3>Explain mechanisms, not just vocabulary.</h3><p>Lessons connect plain-language models to technical detail, worked examples, misconceptions, and authoritative sources.</p></article><article><span>03 / PRACTICE</span><h3>Prediction, retrieval, labs, and assessment.</h3><p>Quizzes, active recall, interactive models, downloadable experiments, and guided variations make knowledge testable.</p></article><article><span>04 / MASTERY</span><h3>Explain. Apply. Troubleshoot. Verify.</h3><p>Completion is self-reported; mastery evidence comes from what the learner can reproduce, defend, and independently check.</p></article></div><div class="academy-program-grid">'+academy.programs.map(programCard).join('')+'</div></div>';
   anchor.after(sec);
 }
 function syllabus(id){
   const p=programs.get(id);if(!p||document.querySelector('.academy-syllabus'))return;
   const main=document.querySelector('main');if(!main)return;
   const first=main.querySelector('section');
   const modules=p.categories.map((cat,i)=>'<article class="academy-module"><p class="eyebrow">MODULE '+String(i+1).padStart(2,'0')+'</p><h3>'+esc(cat)+'</h3><p>Progress from first principles into applied reasoning, troubleshooting, verification, and advanced extensions.</p><small>Open the Learn library and filter this program by category to study the full module.</small></article>').join('');
   const sec=document.createElement('section');sec.className='wrap academy-syllabus';sec.innerHTML='<p class="eyebrow">PROGRAM SYLLABUS / '+esc(p.level)+'</p><h2>'+esc(p.title)+'</h2><p class="academy-intro">'+esc(p.description)+'</p><div class="academy-syllabus-grid"><div class="academy-program-outcomes"><article class="academy-contract-card"><span class="academy-contract-label">PREREQUISITES</span><h3>What you should know first</h3>'+list(p.prerequisites)+'</article><article class="academy-contract-card"><span class="academy-contract-label">PROGRAM OUTCOMES</span><h3>What mastery should let you do</h3>'+list(p.outcomes)+'</article><article class="academy-contract-card"><span class="academy-contract-label">CAPSTONE</span><h3>Finish by producing evidence</h3><p>'+esc(p.capstone)+'</p></article></div><div><div class="academy-module-grid">'+modules+'</div></div></div><div class="academy-assessment-grid"><article class="academy-assessment-card"><h3>Formative checks</h3><p>Lesson quizzes and explained answer choices reveal misconceptions early.</p></article><article class="academy-assessment-card"><h3>Labs</h3><p>Predict first, change one variable, observe, explain, and reset.</p></article><article class="academy-assessment-card"><h3>Evidence review</h3><p>Open at least one cited source and state what it does—and does not—support.</p></article><article class="academy-assessment-card"><h3>Capstone review</h3><p>Defend assumptions, reproduce results, explain failure modes, and identify the next experiment.</p></article></div><p><a class="button primary" href="learn-browse.html?domain='+esc(id)+'">Browse all '+esc(domainNames[id]||p.title)+' lessons →</a> <a class="button" href="learn-paths.html">Open guided learning paths →</a></p>';
   if(first)first.after(sec);else main.prepend(sec);
 }
 function currentLesson(){
   if(!D)return null;
   const id=new URL(location.href).searchParams.get('lesson');
   return D.lessons.find(l=>l.id===id)||null;
 }
 function lessonContract(){
   if(page!=='lesson.html'||!D)return;
   const article=document.querySelector('#lesson-article');if(!article)return;
   const l=currentLesson();if(!l)return;
   const existing=article.querySelector('.academy-lesson-contract');if(existing&&existing.dataset.lesson===l.id)return;
   existing?.remove();
   const prereqs=(l.prereq||[]).map(id=>D.lessons.find(x=>x.id===id)?.title).filter(Boolean);
   const objectives=l.objectives?.length?l.objectives:[l.summary,l.takeaway].filter(Boolean);
   const qCount=(l.quiz?1:0)+(l.assessment?.length||0);
   const refs=l.references?.length||0;
   const hasLab=Boolean(l.interactive||l.flagship||l.kind==='Lab');
   const sec=document.createElement('section');sec.className='academy-lesson-contract';sec.dataset.lesson=l.id;
   sec.innerHTML='<div class="academy-contract-head"><div><span class="academy-contract-label">LESSON MASTERY CONTRACT</span><h2>'+esc(l.title)+'</h2><p>Mastery is demonstrated by explanation, application, troubleshooting, and evidence—not by opening the page.</p></div><div class="academy-contract-meta"><span class="academy-pill">'+esc(domainNames[l.domain]||l.domain)+'</span><span class="academy-pill">'+esc(l.category)+'</span><span class="academy-pill">'+esc(l.difficulty)+'</span><span class="academy-pill">'+esc(l.minutes||'—')+' min core</span></div></div><div class="academy-contract-grid"><article class="academy-contract-card"><span class="academy-contract-label">PREREQUISITES</span><h3>Enter with this context</h3>'+(prereqs.length?list(prereqs):'<p>No lesson prerequisite is currently required.</p>')+'</article><article class="academy-contract-card"><span class="academy-contract-label">OBJECTIVES</span><h3>By the end, you should be able to</h3>'+list(objectives)+'</article><article class="academy-contract-card"><span class="academy-contract-label">ASSESSMENT EVIDENCE</span><h3>What the lesson exposes</h3><ul><li>'+qCount+' formative assessment question(s)</li><li>'+refs+' direct reference source(s)</li><li>'+(hasLab?'Hands-on or interactive practice is available':'Guided evidence/application activity is used in place of a dedicated interactive')+'</li><li>'+(l.editorialReview?.status==='reviewed'?'Editorial review recorded':'Source metadata is present; independent verification remains required')+'</li></ul></article><article class="academy-contract-card"><span class="academy-contract-label">MASTERY ASSIGNMENT</span><h3>Produce your own evidence</h3><ol><li>Explain the verified claim without looking.</li><li>Change one condition in the example or lab and predict the result first.</li><li>Explain one plausible failure or misconception.</li><li>Open a cited source and state the exact claim it supports.</li></ol></article></div><div class="academy-mastery-rubric"><article class="academy-rubric-item"><strong>Explain</strong><p>Teach the concept in beginner and technical language without changing the claim.</p></article><article class="academy-rubric-item"><strong>Apply</strong><p>Solve or build a variation that was not copied from the worked example.</p></article><article class="academy-rubric-item"><strong>Troubleshoot</strong><p>Identify a failure mode, wrong assumption, or boundary condition and repair it.</p></article><article class="academy-rubric-item"><strong>Verify</strong><p>Use evidence, calculation, code, or a source to independently check the central claim.</p></article></div>';
   const meta=article.querySelector('.lesson-meta-row');if(meta)meta.after(sec);else article.prepend(sec);
 }
 if(page==='learn.html')overview();
 if(subjectMap[page])syllabus(subjectMap[page]);
 if(page==='lesson.html'){
   const observer=new MutationObserver(()=>lessonContract());observer.observe(document.body,{subtree:true,childList:true});lessonContract();
 }
}).catch(err=>console.error('[learning-academy]',err));
})();