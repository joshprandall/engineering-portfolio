/* Portfolio experience vNext: accurate education, five interactive systems, cinematic Bell-pair model and project routing. */
(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const mobile = matchMedia('(max-width: 700px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const safeText = text => document.createTextNode(text);
  const modes = [
    {name:'Architect', heading:'Design the whole system.', description:'Translate needs into a system that can be built, operated, secured and improved.', bullets:['Map dependencies and failure domains','Make interfaces and ownership explicit','Choose evidence-based trade-offs'], cta:'Explore infrastructure architecture', url:'project-dependency.html', labels:['Requirements','Compute','Network','Storage','Observability','People'], edges:[[0,1],[0,2],[1,3],[2,3],[3,4],[4,5],[5,0]]},
    {name:'Build', heading:'Turn the design into working systems.', description:'Implement, integrate and test the smallest complete unit before scaling it.', bullets:['Provision infrastructure and services','Validate deployment and recovery','Document repeatable handoffs'], cta:'Explore the engineering projects', url:'projects.html#project-list', labels:['Source','CI','Build','Test','Deploy','Observe'],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[3,1]]},
    {name:'Secure', heading:'Make trust visible and testable.', description:'Use identity, least privilege, hardening and evidence to make system boundaries explicit.', bullets:['Model identity and access','Reduce exposed attack paths','Verify controls and recovery'], cta:'Explore security learning', url:'learn-browse.html?domain=cyber',labels:['Identity','MFA','Policy','Endpoint','Audit','Recovery'],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,3]]},
    {name:'Automate', heading:'Make the dependable path repeatable.', description:'Use scripts, tests and observable feedback to remove toil without losing human oversight.', bullets:['Define inputs and checks','Run reviewed automation','Measure outcomes and handle errors'], cta:'Explore the automation projects', url:'project-lifecycle.html', labels:['Trigger','Validate','Plan','Approve','Execute','Verify'],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[5,2]]},
    {name:'Evolve', heading:'Learn, measure, improve.', description:'Connect practical systems engineering with HPC, computer architecture and quantum engineering study.', bullets:['Investigate hard questions','Test models against evidence','Turn learning into a reproducible lab'], cta:'Explore advanced computing', url:'learn-browse.html?domain=advanced',labels:['Question','Model','Measure','Analyze','Explain','Improve'],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[1,4]]}
  ];

  function enhanceProjectCards() {
    $$('.project-card').forEach(card => {
      const title = $('h2, h3',card)?.textContent.trim() || 'project';
      const links=$$('a[href]',card);
      if (!links.length) return;
      // A card is a genuine link via a stretched, semantic primary anchor; other links stay above it.
      let primary=links.find(a=>a.classList.contains('tile-open'))||links[0];
      const isChess=card.id==='battle-chess', isQubit=card.id==='quantum';
      if(isChess) primary.href='project-battle-chess.html';
      if(isQubit) primary.href='project-qubit.html';
      primary.classList.add('vnext-card-link');
      primary.removeAttribute('target'); primary.removeAttribute('rel');
      primary.setAttribute('aria-label',`Open ${title} project details`);
      links.filter(a=>a!==primary).forEach(a=>{
        a.classList.add('vnext-secondary-link');
        if(a.href.startsWith('https://github.com/')){a.target='_blank';a.rel='noopener noreferrer';}
      });
      if(isChess && !links.some(a=>a.getAttribute('href')==='games/3d-battle-chess/index.html')){
        const link=document.createElement('a');link.className='vnext-secondary-link';link.href='games/3d-battle-chess/index.html';link.textContent='Play game ↗';
        $('.card-bottom',card)?.append(link);
      }
      if(isQubit && !links.some(a=>a.getAttribute('href')==='qubit-preview-20260921/')){
        const link=document.createElement('a');link.className='vnext-secondary-link';link.href='qubit-preview-20260921/';link.textContent='Open interactive lab ↗';
        $('.card-bottom',card)?.append(link);
      }
    });
    // Keep the project catalog concise. An embedded exercise is linked from its own project page.
    const embedded=$('#quantum');
    if(embedded && !embedded.classList.contains('project-card')) {
      const detail = document.createElement('p');detail.className='vnext-embedded-note';
      detail.innerHTML='<a class="button" href="project-qubit.html">Explore the single-qubit model and its lesson ↗</a>';
      embedded.replaceWith(detail);
    }
  }

  function restoreEducation(){
    const section=$('#direction'); if(!section)return;
    const existing=$('.study',section);if(!existing)return;
    const education=document.createElement('div');education.className='vnext-education';
    education.innerHTML=`<div class="vnext-school"><div class="vnext-school-mark vnext-osu" role="img" aria-label="OSU monogram"><img src="assets/osu-logo.png" alt="Oregon State University logo" width="150" height="50" onerror="this.replaceWith(document.createTextNode('OSU'))"></div><div><strong>Oregon State University</strong><p>Bachelor’s studies in Computer Science and Electrical &amp; Computer Engineering</p><small>Minors: Data Science, Mathematics and Physics · Ecampus</small></div></div>
      <div class="vnext-school"><div class="vnext-school-mark vnext-mit" role="img" aria-label="MIT wordmark">MIT</div><div><strong>Massachusetts Institute of Technology</strong><p>Quantum Engineering program · concurrent enrollment</p><small>Program participation; credit and degree status not stated</small></div></div>`;
    existing.replaceWith(education);
    const next=education.nextElementSibling;
    if(next && next.tagName==='P' && /Planned study includes/i.test(next.textContent)){
      next.textContent='My focus combines computer science, electrical and computer engineering, mathematics, physics and data science with quantum engineering study. The academic programs listed above are in progress.';
    }
  }

  function interactiveSystems(){
    const old=$('.system-visual');if(!old)return;
    const stage=document.createElement('section');stage.className='vnext-system';stage.setAttribute('aria-label','Interactive systems architecture map');
    stage.innerHTML=`<div class="vnext-sys-top"><span>CONNECTED SYSTEMS / EXPLORE A CAPABILITY</span><span id="vnext-count">01 / 05</span></div>
      <div class="vnext-system-tabs" role="tablist" aria-label="Choose a systems capability"></div>
      <svg viewBox="0 0 560 340" class="vnext-sys-svg" role="img" aria-label="Architect system network with six connected nodes" preserveAspectRatio="xMidYMid meet"><defs><filter id="vnext-glow"><feGaussianBlur stdDeviation="4"/></filter></defs><g class="vnext-edges"></g><g class="vnext-nodes"></g></svg>
      <div class="vnext-sys-detail" id="vnext-detail" role="tabpanel" tabindex="0"><div class="vnext-sys-meta">SELECT A CAPABILITY · INTERACTIVE NODE MAP</div><h2 id="vnext-title"></h2><p id="vnext-copy"></p><ul id="vnext-bullets"></ul><a class="vnext-cta" id="vnext-link"></a><p class="vnext-node-note" id="vnext-node-note" aria-live="polite">Select a node to inspect its role.</p></div>`;
    old.replaceWith(stage);
    const t=$('.vnext-system-tabs',stage), edges=$('.vnext-edges',stage),nodes=$('.vnext-nodes',stage);
    const svgNS='http://www.w3.org/2000/svg';
    const pts=[[280,40],[440,115],[435,255],[280,303],[125,255],[120,115]];
    modes.forEach((mode,i)=>{
      const b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.textContent=mode.name;b.id=`vnext-tab-${i}`;b.setAttribute('aria-controls','vnext-detail');
      b.onclick=()=>select(i);b.addEventListener('keydown',e=>{
        if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
        e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?modes.length-1:(i+(e.key==='ArrowRight'?1:-1)+modes.length)%modes.length;
        select(n);t.children[n].focus();
      });t.append(b);
    });
    function el(tag,attrs){const x=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([k,v])=>x.setAttribute(k,v));return x;}
    function select(i){
      const mode=modes[i];stage.dataset.mode=mode.name.toLowerCase();
      [...t.children].forEach((b,j)=>{b.setAttribute('aria-selected',String(j===i));b.tabIndex=j===i?0:-1});
      $('#vnext-count',stage).textContent=`0${i+1} / 05`;$('#vnext-title',stage).textContent=mode.heading;$('#vnext-copy',stage).textContent=mode.description;
      $('#vnext-bullets',stage).replaceChildren(...mode.bullets.map(s=>{const li=document.createElement('li');li.textContent=s;return li}));
      const link=$('#vnext-link',stage);link.href=mode.url;link.textContent=mode.cta+' ↗';
      edges.replaceChildren();nodes.replaceChildren();$('#vnext-node-note',stage).textContent='Select a node to inspect its role.';
      mode.edges.forEach(([a,b],j)=>{
        edges.append(el('path',{d:`M${pts[a][0]} ${pts[a][1]} Q280 ${170+(j%3-1)*38} ${pts[b][0]} ${pts[b][1]}`,class:'vnext-edge',style:`--delay:${j*.13}s` }));
      });
      mode.labels.forEach((label,j)=>{
        const [x,y]=pts[j],g=el('g',{class:'vnext-node',role:'button',tabindex:'0','aria-label':`Inspect ${label} node`});
        g.append(el('circle',{cx:x,cy:y,r:30,class:'vnext-node-hit'}),el('circle',{cx:x,cy:y,r:17,class:'vnext-node-orb'}));
        const txt=el('text',{x,y:y+48,'text-anchor':'middle',class:'vnext-node-label'});txt.textContent=label;g.append(txt);
        const activate=()=>{$$('.vnext-node',nodes).forEach(n=>n.classList.remove('selected'));g.classList.add('selected');$('#vnext-node-note',stage).textContent=`${label} · ${mode.name}: ${mode.bullets[j%mode.bullets.length]}.`};
        g.addEventListener('click',activate);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}});nodes.append(g);
      });
      $('.vnext-sys-svg',stage).setAttribute('aria-label',`${mode.name}: ${mode.labels.join(', ')}; ${mode.edges.length} system links.`);
    }
    select(0);
  }

  function entanglementArtwork(){
    const old=$('.direction-image');if(!old)return;
    const frame=document.createElement('div');frame.className='vnext-quantum';
    frame.innerHTML=`<div class="vnext-quantum-head"><span>QUANTUM ENGINEERING / INTERACTIVE MODEL</span><span class="vnext-quantum-tag">TWO-QUBIT BELL PAIR</span></div>
      <canvas id="vnext-quantum-canvas" role="img" aria-label="Animated conceptual photonic laboratory with two linked qubit states"></canvas>
      <div class="vnext-quantum-floor"><div class="vnext-ket">|Φ⁺⟩ = (|00⟩ + |11⟩) / √2</div><p>Entanglement is a property of a <em>joint</em> quantum state. The beams are an artistic visualization, not a literal connection between particles.</p>
        <div class="vnext-measures"><label for="vnext-basis">Measurement bases</label><select id="vnext-basis"><option value="ZZ">Z / Z</option><option value="XX">X / X</option><option value="ZX">Z / X</option><option value="YY">Y / Y</option></select><button id="vnext-measure" type="button">Simulate 1,000 measurements</button></div>
        <p id="vnext-measure-result" role="status" aria-live="polite">In the same Z basis, the two ideal outcomes are perfectly correlated: 00 or 11.</p></div>`;
    old.replaceWith(frame);
    const canvas=$('#vnext-quantum-canvas',frame),ctx=canvas.getContext('2d');
    let step=0, running=!reduced.matches, pulse=0;
    const photo=new Image();photo.decoding='async';photo.src='assets/quantum-lab-reference.jpg';photo.onload=()=>draw();
    function size(){const rect=canvas.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(2,Math.floor(rect.width*d));canvas.height=Math.max(2,Math.floor(rect.height*d));ctx.setTransform(d,0,0,d,0,0);return [rect.width,rect.height]}
    function beam(a,b,t,w=2){const g=ctx.createLinearGradient(a[0],a[1],b[0],b[1]);g.addColorStop(0,'#047c9b');g.addColorStop(.5,'#91f4ff');g.addColorStop(1,'#2fb8e2');ctx.strokeStyle=g;ctx.shadowColor='#44e0ff';ctx.shadowBlur=19+w*3;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();ctx.shadowBlur=0;
      for(let i=0;i<4;i++){const q=((t*.24+i*.25)%1);ctx.fillStyle='#a6f8ff';ctx.beginPath();ctx.arc(a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q,1.2,0,Math.PI*2);ctx.fill()}}
    function box(x,y,r){ctx.save();ctx.translate(x,y);ctx.strokeStyle='#87def0';ctx.lineWidth=1.3;ctx.shadowColor='#45d9ff';ctx.shadowBlur=10;
      for(let k=0;k<2;k++){let a=k*r*.26;ctx.strokeRect(-r/2+a,-r/2-a,r,r)}
      ctx.beginPath();[[-r/2,-r/2],[r/2,-r/2],[r/2,r/2],[-r/2,r/2]].forEach(([px,py],i)=>{if(i===0)ctx.moveTo(px,py);ctx.lineTo(px+r*.26,py-r*.26)});ctx.stroke();ctx.restore()}
    function node(x,y,r,t){ctx.save();let g=ctx.createRadialGradient(x-r*.3,y-r*.3,1,x,y,r*1.4);g.addColorStop(0,'#effcff');g.addColorStop(.2,'#36d9fd');g.addColorStop(1,'#00324b00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*1.4,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#86e8ff9a';ctx.lineWidth=1.1;
      for(let n=0;n<3;n++){ctx.beginPath();ctx.ellipse(x,y,r*.95,r*(.27+n*.13),t*.35+n*Math.PI/3,0,Math.PI*2);ctx.stroke()}
      ctx.fillStyle='#dcfbff';ctx.beginPath();ctx.arc(x,y,r*.2,0,Math.PI*2);ctx.fill();ctx.restore()}
    function draw(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w<1||h<1)return;
      ctx.clearRect(0,0,w,h);const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#030c14');bg.addColorStop(.54,'#142a36');bg.addColorStop(1,'#040d13');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      if(photo.complete && photo.naturalWidth){const scale=Math.max(w/photo.width,h/photo.height),pw=photo.width*scale,ph=photo.height*scale;ctx.drawImage(photo,(w-pw)/2,(h-ph)/2,pw,ph);ctx.fillStyle='#020b16a3';ctx.fillRect(0,0,w,h);}
      // Photonic bench grid and perspective optical hardware, inspired by the supplied lab references.
      ctx.save();ctx.strokeStyle='#547b8970';ctx.lineWidth=.8;
      if(!(photo.complete&&photo.naturalWidth)){
      const horizon=h*.69;for(let i=-8;i<=8;i++){ctx.beginPath();ctx.moveTo(w*.5+i*w*.035,horizon);ctx.lineTo(w*.5+i*w*.22,h);ctx.stroke()}
      for(let j=0;j<8;j++){const z=(j/8)**1.75;const y=horizon+(h-horizon)*z;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
      }
      const a=[w*.23,h*.46],b=[w*.77,h*.46],mid=[w*.5,h*.48];
      if(!(photo.complete&&photo.naturalWidth))[[a[0]-46,a[1]-45],[b[0]+46,b[1]-45]].forEach(([x,y])=>{ctx.fillStyle='#16242c';ctx.strokeStyle='#6c8894';ctx.lineWidth=2;ctx.fillRect(x-19,y-10,38,85);ctx.strokeRect(x-19,y-10,38,85);ctx.fillStyle='#335462';ctx.fillRect(x-8,y-25,16,21)});
      beam(a,mid,step,2.3);beam(mid,b,step,2.3);
      ctx.strokeStyle='#38d9ff6b';ctx.lineWidth=1.3;ctx.beginPath();for(let i=0;i<=110;i++){const u=i/110,x=a[0]+(b[0]-a[0])*u,y=a[1]+Math.sin(u*7*Math.PI-step*1.1)*Math.sin(Math.PI*u)*14;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();
      if(!(photo.complete&&photo.naturalWidth))box(...mid,Math.min(w*.15,66));node(a[0],a[1],Math.min(w*.077,33),step);node(b[0],b[1],Math.min(w*.077,33),-step);
      ctx.font=`${Math.max(11,Math.min(w*.024,15))}px system-ui`;ctx.fillStyle='#d8f7ff';ctx.textAlign='center';ctx.fillText('QUBIT A',a[0],a[1]+68);ctx.fillText('QUBIT B',b[0],b[1]+68);
      ctx.fillStyle='#ddae82';ctx.font=`${Math.max(10,Math.min(w*.021,12))}px system-ui`;ctx.fillText('JOINT STATE · Φ⁺',mid[0],mid[1]-60);
      ctx.restore();
    }
    const resize=()=>{size();draw()};new ResizeObserver(resize).observe(canvas);resize();
    function tick(){if(!canvas.isConnected)return;if(running && !document.hidden){step+=.012;draw()}requestAnimationFrame(tick)}
    requestAnimationFrame(tick);
    reduced.addEventListener?.('change',e=>{running=!e.matches;draw()});
    $('#vnext-basis',frame).onchange=()=>{$('#vnext-measure-result',frame).textContent='Select “Simulate 1,000 measurements” to compare joint outcomes for this basis.'};
    $('#vnext-measure',frame).onclick=()=>{
      const basis=$('#vnext-basis',frame).value;const counts={'00':0,'01':0,'10':0,'11':0};
      for(let i=0;i<1000;i++){let a=Math.random()<.5?0:1,b;
        b=basis==='ZZ'||basis==='XX'?a:basis==='YY'?1-a:(Math.random()<.5?0:1);counts[`${a}${b}`]++}
      const character=basis==='ZZ'||basis==='XX'?'ideal perfect correlation':basis==='YY'?'ideal perfect anti-correlation':'independent results in different bases';
      $('#vnext-measure-result',frame).textContent=`${basis}: ${character}. 00 ${counts['00']}, 01 ${counts['01']}, 10 ${counts['10']}, 11 ${counts['11']} (illustrative random sampling, not real hardware).`;
      pulse+=1;step+=pulse*.08;draw();
    };
  }
  function strengthenNavigation(){
    if(!$('#primary-nav'))return;
    const nav=$('#primary-nav');
    if(!nav.querySelector('a[href="project-battle-chess.html"]')){
      const link=document.createElement('a');link.href='project-battle-chess.html';link.textContent='3D Chess';nav.append(link);
    }
  }
  function init(){strengthenNavigation();enhanceProjectCards();restoreEducation();interactiveSystems();entanglementArtwork();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
