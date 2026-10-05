/* AI engineering page tools are deterministic local planning/evaluation aids. They do not call a model or external service. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const workloads={
    assistant:{label:'Knowledge assistant',base:['retrieval layer','grounded generation','citation/evidence capture','feedback + eval set']},
    agent:{label:'Tool-using agent',base:['typed tools','state machine / agent loop','approval boundary','trace + replay','recovery / idempotency']},
    extraction:{label:'Structured extraction',base:['schema-constrained output','validation','deterministic post-processing','golden test corpus']},
    vision:{label:'Vision / multimodal',base:['media preprocessing','multimodal model','structured task output','human-review lane','dataset drift checks']},
    science:{label:'Scientific / research assistant',base:['source retrieval','calculation/simulation tools','provenance ledger','claim-level verification','reproducible notebooks']}
  };
  function planner(){
    const w=workloads[$('ai-workload').value],aut=$('ai-autonomy').value,data=$('ai-data').value,lat=$('ai-latency').value;
    const architecture=[...w.base];
    if(data==='restricted')architecture.unshift('private data boundary + least-privilege identity');
    if(data==='regulated')architecture.unshift('formal data governance + retention/audit controls');
    if(aut==='none')architecture.push('no autonomous side effects');
    if(aut==='review')architecture.push('human approval before consequential actions');
    if(aut==='bounded')architecture.push('allowlisted low-risk actions + policy engine + kill switch');
    if(lat==='realtime')architecture.push('streaming + latency budgets + fallback path');
    if(lat==='batch')architecture.push('queue + resumable jobs + cost/throughput scheduling');
    const ul=document.createElement('ul');architecture.forEach(x=>{const li=document.createElement('li');li.textContent=x;ul.append(li);});
    const risk=(data==='regulated'?3:data==='restricted'?2:1)+(aut==='bounded'?3:aut==='review'?2:1)+(lat==='realtime'?1:0);
    const target=$('ai-plan-output');target.replaceChildren();
    const h=document.createElement('h3');h.textContent=w.label+' architecture';target.append(h,ul);
    const p=document.createElement('p');p.textContent='Control intensity: '+(risk>=6?'high':risk>=4?'moderate-high':'moderate')+'. Start with the smallest workflow that can be evaluated end-to-end before adding more agents, tools, memory, or autonomy.';target.append(p);
  }
  ['ai-workload','ai-autonomy','ai-data','ai-latency'].forEach(id=>$(id)?.addEventListener('change',planner));planner();

  function wilson(k,n,z=1.96){
    if(!n)return [0,1];const p=k/n,den=1+z*z/n,center=(p+z*z/(2*n))/den,half=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/den;return [Math.max(0,center-half),Math.min(1,center+half)];
  }
  function evalCalc(){
    const n=Math.max(1,Math.min(100000,Math.round(Number($('eval-n').value)||100))),pass=Math.max(0,Math.min(n,Math.round(Number($('eval-pass').value)||0)));
    $('eval-pass').max=String(n);const p=pass/n,[lo,hi]=wilson(pass,n);
    $('eval-output').innerHTML='<strong>Observed pass rate: '+(p*100).toFixed(1)+'%</strong><p>Approximate 95% Wilson interval: '+(lo*100).toFixed(1)+'%–'+(hi*100).toFixed(1)+'%. A single aggregate score can hide severe failure modes; stratify by task, risk, user group, tool, language, adversarial case and cost/latency.</p>';
  }
  ['eval-n','eval-pass'].forEach(id=>$(id)?.addEventListener('input',evalCalc));evalCalc();

  const checks=[
    ['goal','Can the system goal be stated as a bounded task with explicit non-goals?'],
    ['evidence','Is there an eval set with expected outcomes and failure cases?'],
    ['tools','Are tool schemas typed, allowlisted and validated?'],
    ['identity','Does every external action run with least privilege and attributable identity?'],
    ['approval','Are consequential actions gated by explicit human approval or policy?'],
    ['untrusted','Is retrieved/web/user content treated as untrusted data rather than instructions?'],
    ['secrets','Are secrets outside prompts/logs and scoped to the minimum runtime?'],
    ['memory','Can stored memory be inspected, corrected, expired and separated by user/task?'],
    ['trace','Can a failed run be reconstructed from model/tool/handoff/policy traces?'],
    ['fallback','Is there a deterministic failure/retry/fallback path and a way to stop the agent?'],
    ['cost','Are token, tool, latency and infrastructure budgets measurable?'],
    ['security','Are prompt injection, tool misuse, identity abuse and supply-chain risks tested?']
  ];
  function buildChecklist(){
    const root=$('ai-checklist');if(!root)return;root.replaceChildren(...checks.map(([id,text])=>{
      const label=document.createElement('label');label.className='hub-card';const cb=document.createElement('input');cb.type='checkbox';cb.dataset.aiCheck=id;const span=document.createElement('span');span.textContent=text;label.append(cb,span);return label;
    }));
    root.addEventListener('change',scoreChecklist);scoreChecklist();
  }
  function scoreChecklist(){
    const boxes=[...document.querySelectorAll('[data-ai-check]')],done=boxes.filter(x=>x.checked).length,pct=boxes.length?done/boxes.length*100:0;
    $('ai-check-score').textContent=done+'/'+boxes.length+' controls addressed';
    $('ai-check-meter').style.width=pct+'%';
  }
  buildChecklist();
})();
