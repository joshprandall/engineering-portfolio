/* A transparent syllabus and learning checks for the existing Knowledge Platform. */
(() => {
  'use strict';
  if (document.body.dataset.libraryPage !== 'paths' || !window.JR_KNOWLEDGE) return;
  const D=window.JR_KNOWLEDGE,root=document.getElementById('path-grid');if(!root)return;
  const byId=new Map(D.lessons.map(l=>[l.id,l]));
  const depthOrder=['orientation','foundation','core','applied','undergraduate','advanced','graduate','research'];
  const depthNames={orientation:'Orientation',foundation:'Foundations',core:'Core',applied:'Applied',undergraduate:'Undergraduate',advanced:'Advanced',graduate:'Graduate bridge',research:'Doctoral / Research'};
  const urlTarget=new URL(location.href).searchParams.get('targetDepth');
  let storedTarget='foundation';try{storedTarget=localStorage.getItem('jr-knowledge-depth-target-v1')||'foundation'}catch{}
  const targetDepth=depthOrder.includes(urlTarget)?urlTarget:(depthOrder.includes(storedTarget)?storedTarget:'foundation');
  const depthIndex=Math.max(0,depthOrder.indexOf(targetDepth));
  const targetBand=depthIndex<=1?'foundation':depthIndex<=4?'intermediate':'advanced';
  const featured=['systems-foundation','advanced-systems','software-core','security-foundation','it-leadership','math-for-computing','physics-foundation','quantum-onramp'];
  const outcomes={cloud:'Trace and troubleshoot a service from a client to the underlying infrastructure.',advanced:'Model a compute bottleneck, identify its limiting resources, and explain assumptions.',software:'Design, test, and document a small implementation with meaningful edge cases.',cyber:'Explain a trust boundary, demonstrate the control, and describe how it could fail.',leadership:'Write an operational decision, an owner, a check, and a clear follow-up.',math:'Show the derivation, assumptions, units, and a numerical verification.',physics:'Describe the model, list its physical assumptions, and check a limiting case.'};
  const q=s=>document.querySelector(s);
  const initial=document.createElement('div');initial.className='vnext-path-intro';initial.innerHTML=`<div><p class="eyebrow">GUIDED LEARNING / REAL SEQUENCES</p><h2>Choose a goal, then work the sequence.</h2><p>Open a path to inspect every lesson and its checkpoints. Completion is saved in this browser. Your current mastery target is <strong>${depthNames[targetDepth]}</strong>. Existing paths keep their verified Foundation / Intermediate / Advanced band while the platform grows toward the full depth ladder.</p></div><label>Find a path <input id="vnext-path-search" type="search" placeholder="Try quantum, Linux, security…" aria-label="Find a learning path"></label><label>Path band <select id="vnext-path-band" aria-label="Filter learning paths by current verified band"><option value="all">All verified bands</option><option value="foundation">Foundation</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label><input id="vnext-featured-only" type="checkbox" ${depthIndex<=1?'checked':''}> Show foundational routes first</label><p id="vnext-path-results" role="status"></p>`;
  root.before(initial);
  const input=q('#vnext-path-search'),levelFilter=q('#vnext-path-band'),featuredOnly=q('#vnext-featured-only'),status=q('#vnext-path-results');
  levelFilter.value=targetBand;
  const cards=[...root.querySelectorAll('.path-card')];
  if(cards.length!==D.paths.length){status.textContent='Learning paths could not be indexed. Reload before starting a path.';return;}
  D.paths.forEach((p,i)=>{
    const card=cards[i],title=card.querySelector('h3'),progress=card.querySelector('.path-count');if(!title)return;card.id='path-'+p.id;
    const details=document.createElement('details');details.className='vnext-syllabus';
    const sum=document.createElement('summary');sum.textContent=`View syllabus · ${p.lesson_ids.length} ordered learning objects`;
    details.append(sum);
    const outcome=document.createElement('p');outcome.className='vnext-path-outcome';outcome.textContent='Practice goal: '+(outcomes[p.domain]||'Use the concept in a new, explainable situation.');details.append(outcome);
    const list=document.createElement('ol');list.className='vnext-syllabus-list';
    p.lesson_ids.forEach((id,n)=>{
      const l=byId.get(id),li=document.createElement('li');if(!l){li.textContent='Missing lesson: '+id;li.className='vnext-syllabus-missing'}
      else{
        const a=document.createElement('a');a.href=`learn-paths.html?lesson=${encodeURIComponent(id)}`;a.textContent=l.title;a.setAttribute('aria-label',`Open lesson ${n+1}: ${l.title}`);
        const desc=document.createElement('small');desc.textContent=`${l.kind||'Lesson'} · ${l.minutes||'?'} min · ${l.difficulty||'All levels'} · ${l.summary}`;
        li.append(a,desc);
      }list.append(li);
    });
    details.append(list);
    const check=document.createElement('div');check.className='vnext-path-check';
    check.innerHTML='<h4>Apply what you learned</h4><p>Before marking this path complete, explain its core model without notes, reproduce a practical example, change one assumption, and use evidence to evaluate the result.</p><label><input type="checkbox"> I can explain the model and show an independently checked example.</label><p class="vnext-check-result" role="status"></p>';
    const storageKey=`jr-path-check-${p.id}`;
    const checkbox=check.querySelector('input'),result=check.querySelector('.vnext-check-result');
    try{checkbox.checked=localStorage.getItem(storageKey)==='true'}catch{}
    checkbox.addEventListener('change',()=>{try{localStorage.setItem(storageKey,String(checkbox.checked))}catch{} result.textContent=checkbox.checked?'Reflection recorded on this device. Lesson completion is tracked separately.':'Reflection cleared.'});
    details.append(check);
    if(featured.includes(p.id)){
      const cap=document.createElement('a');cap.className='vnext-capstone-link';
      cap.href=`learn-capstones.html?path=${encodeURIComponent(p.id)}`;
      cap.textContent='Work the authored foundation capstone →';
      details.append(cap);
    }
    card.append(details);
    if(featured.includes(p.id))card.classList.add('vnext-featured-path');
    progress?.setAttribute('aria-label',`Progress for ${p.title}`);
  });
  function filter(){const term=input.value.trim().toLocaleLowerCase(),first=featuredOnly.checked,band=levelFilter.value;let visible=0;
    cards.forEach((card,i)=>{const p=D.paths[i],lessonTitles=p.lesson_ids.map(id=>byId.get(id)?.title||'').join(' '),level=String(p.level||p.difficulty||'').toLocaleLowerCase();
      const bandMatch=band==='all'||level===band;
      const matches=bandMatch&&(!first||featured.includes(p.id))&&(!term||`${p.title} ${p.description||p.summary||''} ${lessonTitles}`.toLocaleLowerCase().includes(term));
      card.hidden=!matches;if(matches)visible++});
    status.textContent=`${visible} of ${D.paths.length} published path sequences shown · target: ${depthNames[targetDepth]}.`;
  }
  input.addEventListener('input',filter);levelFilter.addEventListener('change',filter);featuredOnly.addEventListener('change',filter);
  const chosenPath=new URL(location.href).searchParams.get('path');
  if(chosenPath){
    const index=D.paths.findIndex(p=>p.id===chosenPath);
    if(index>=0){featuredOnly.checked=false;levelFilter.value='all';input.value=D.paths[index].title;}
  }
  filter();
  if(chosenPath){const card=document.getElementById('path-'+chosenPath);if(card&&!card.hidden){const details=card.querySelector('details.vnext-syllabus');if(details)details.open=true;}}

})();
