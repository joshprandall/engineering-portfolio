/* Global metadata search. Does not load or inspect isolated project internals. */
(() => {
  const base=new URL('./',document.currentScript.src),dialog=document.querySelector('#search-dialog'),input=document.querySelector('#search-input'),results=document.querySelector('#search-results'),open=document.querySelector('#search-open');
  if(!dialog||!input||!results||!open)return;
  let entries=[],loading,previous;
  const render=()=>{const words=input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);const found=entries.filter(e=>words.every(w=>(e.title+' '+e.text).toLowerCase().includes(w))).slice(0,30);results.replaceChildren(...found.map(e=>{const a=document.createElement('a');a.href=e.path;const title=document.createElement('strong');title.textContent=e.title;const detail=document.createElement('small');detail.textContent=e.text.slice(0,170);a.append(title,document.createElement('br'),detail);return a;}));if(!found.length)results.textContent=entries.length?'No matches. Try a subject, skill, project or lesson title.':'Loading search…';};
  const show=(event)=>{previous=event?.type==='click'?open:document.activeElement;if(!dialog.open)dialog.showModal();input.focus();if(!loading)loading=fetch(new URL('assets/site-search.json',base)).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{entries=data.entries||[];const guaranteed=[
{path:'learn-coding.html',title:'Coding',text:'Programming language atlas, paradigms, algorithms, sandboxed browser code lab, debugging, testing, web, systems, data, AI, games, embedded, GPU, HPC, hardware description and quantum programming.'},
{path:'learn-quantum.html',title:'Quantum',text:'Quantum foundations, qubits, complex amplitudes, circuits, algorithms, density operators, noise, error correction, hardware, quantum programming, post-quantum cryptography and current research.'},
{path:'security-research.html',title:'Security Research',text:'Authorized local security labs: vulnerability analysis, deterministic fuzzing, Linux and Active Directory models, containers, attack surface, agentic AI boundaries, software supply chain and post-quantum readiness.'},
{path:'ai-development.html',title:'AI Development',text:'AI systems engineering, models, retrieval, tools, memory, agents, evaluation, observability, security, deployment, governance and Project MIND.'},
{path:'game-development.html',title:'Game Development',text:'Playable games plus engine architecture, rendering, physics, animation, AI, audio, networking, performance, platform QA and release engineering.'},
{path:'projects.html',title:'Projects',text:'Engineering projects with evidence, verification, limitations, reproducibility, interactive labs, systems, AI, quantum, games and learning tools.'}
];for(const entry of guaranteed)if(!entries.some(e=>e.path===entry.path))entries.unshift(entry);render();}).catch(()=>{results.textContent='Search is unavailable. Use the navigation links to browse.';loading=null;});render();};
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dialog.close();}});
  open.addEventListener('click',show);input.addEventListener('input',render);
  dialog.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>previous?.focus());
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)&&!document.activeElement?.isContentEditable){e.preventDefault();show();}});
})();
