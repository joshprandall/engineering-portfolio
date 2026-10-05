/* Game-engine learning tools: deterministic local calculators; no game runtime files are modified. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const num=(id,fallback=0)=>{const n=Number($(id)?.value);return Number.isFinite(n)?n:fallback;};

  function frameBudget(){
    const fps=Math.max(15,Math.min(360,num('frame-fps',60)));
    const budget=1000/fps;
    const parts=[
      ['Simulation',Math.max(0,num('budget-sim',20))],
      ['Rendering',Math.max(0,num('budget-render',45))],
      ['Physics',Math.max(0,num('budget-physics',12))],
      ['AI',Math.max(0,num('budget-ai',8))],
      ['Audio / I/O / tools',Math.max(0,num('budget-other',10))]
    ];
    const pct=parts.reduce((a,b)=>a+b[1],0),allocated=budget*pct/100,headroom=budget-allocated;
    const root=$('frame-output'); if(!root)return;
    root.replaceChildren();
    const strong=document.createElement('strong');
    strong.textContent=fps+' FPS gives '+budget.toFixed(2)+' ms per frame.';
    const p=document.createElement('p');
    p.textContent='Modeled subsystem allocation: '+allocated.toFixed(2)+' ms ('+pct.toFixed(1)+'%). '+(headroom>=0?'Headroom: '+headroom.toFixed(2)+' ms.':'Over budget by '+Math.abs(headroom).toFixed(2)+' ms.');
    const ul=document.createElement('ul');
    parts.forEach(([name,v])=>{const li=document.createElement('li');li.textContent=name+': '+(budget*v/100).toFixed(2)+' ms ('+v+'%)';ul.append(li);});
    const note=document.createElement('p');
    note.textContent='This is a planning budget, not a profiler. Real frames include scheduling, driver work, GPU/CPU overlap, uploads, stalls, garbage collection, shader compilation, thermal limits and platform-specific behavior.';
    root.append(strong,p,ul,note);
    $('frame-meter').style.width=Math.min(100,pct)+'%';
  }
  ['frame-fps','budget-sim','budget-render','budget-physics','budget-ai','budget-other'].forEach(id=>$(id)?.addEventListener('input',frameBudget));
  frameBudget();

  function fixedStep(){
    const simHz=Math.max(10,Math.min(1000,num('sim-hz',60)));
    const step=1000/simHz;
    const frame=Math.max(0,Math.min(1000,num('sim-frame-ms',33)));
    const cap=Math.max(1,Math.min(20,Math.round(num('sim-max-steps',5))));
    const raw=Math.floor(frame/step),steps=Math.min(raw,cap),carried=Math.max(0,frame-steps*step);
    const root=$('sim-output'); if(!root)return;
    root.innerHTML='<strong>Fixed step: '+step.toFixed(3)+' ms · '+steps+' simulation step'+(steps===1?'':'s')+' this frame.</strong><p>Unsimulated time after the cap: '+carried.toFixed(3)+' ms. '+(raw>cap?'The step cap prevents a catch-up spiral but the simulation must decide how to handle lost/lagged time.':'The frame can be serviced without hitting the configured catch-up cap.')+'</p><p>Render interpolation can smooth presentation between fixed simulation states. Keep gameplay state independent of render rate when determinism/replays/networking matter.</p>';
  }
  ['sim-hz','sim-frame-ms','sim-max-steps'].forEach(id=>$(id)?.addEventListener('input',fixedStep));
  fixedStep();

  const risks={
    desktop:['window resizing / DPI','keyboard + mouse focus','GPU/driver diversity','installer/update lifecycle','save paths + permissions'],
    handheld:['touch ergonomics','safe areas / browser UI','orientation','thermal/battery limits','gesture/audio policies'],
    controller:['mapping + dead zones','focus without mouse','disconnect/reconnect','glyph differences','simultaneous input ownership'],
    networked:['latency/jitter/loss','authority/cheating','prediction/reconciliation','serialization/versioning','session recovery'],
    vr:['motion comfort','stereo performance','tracking loss','interaction reach','OpenXR runtime differences']
  };
  function platformPlan(){
    const p=$('platform-select')?.value||'desktop',list=$('platform-output'); if(!list)return;
    const ol=document.createElement('ol');
    risks[p].forEach(x=>{const li=document.createElement('li');li.textContent='Test '+x;ol.append(li);});
    list.replaceChildren(ol);
  }
  $('platform-select')?.addEventListener('change',platformPlan);platformPlan();

  const gates=[
    ['rules','Core gameplay/rules tests'],
    ['save','Save/load and migration recovery'],
    ['input','Keyboard/controller/touch input behavior'],
    ['perf','Representative hardware frame/latency budget'],
    ['offline','Offline/package dependency contract'],
    ['install','Install/start/update/uninstall lifecycle'],
    ['a11y','Accessibility and readable UI at supported sizes'],
    ['crash','Unhandled error / crash / recovery path'],
    ['assets','Asset/license/provenance review'],
    ['telemetry','Diagnostic logging without sensitive-data leakage']
  ];
  function buildGate(){
    const root=$('release-gate');if(!root)return;
    root.replaceChildren(...gates.map(([id,text])=>{const l=document.createElement('label');l.className='hub-card';const b=document.createElement('input');b.type='checkbox';b.dataset.release=id;const s=document.createElement('span');s.textContent=text;l.append(b,s);return l;}));
    root.addEventListener('change',scoreGate);scoreGate();
  }
  function scoreGate(){
    const all=[...document.querySelectorAll('[data-release]')],n=all.filter(x=>x.checked).length;
    $('release-score').textContent=n+'/'+all.length+' release gates checked';
    $('release-meter').style.width=(all.length?n/all.length*100:0)+'%';
  }
  buildGate();
})();
