/* Portfolio experience vNext: accurate education, five interactive systems, cinematic Bell-pair model and project routing. */
(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const mobile = matchMedia('(max-width: 700px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const safeText = text => document.createTextNode(text);
  const modes = [
    {name:'Architect',heading:'Architect resilient systems before they become expensive problems.',description:'Translate requirements into a coherent design by mapping dependencies, boundaries, ownership, failure modes and recovery before implementation begins.',bullets:['Map dependencies and failure domains','Define interfaces, ownership and recovery','Make trade-offs explicit and reviewable'],cta:'Explore infrastructure architecture',url:'project-dependency.html'},
    {name:'Build',heading:'Build the smallest complete system, then scale what works.',description:'Turn architecture into tested working systems by integrating infrastructure, software and automation in reproducible increments with clear validation.',bullets:['Implement from a defined design','Test behavior before scaling','Document repeatable deployment and handoff'],cta:'Explore engineering projects',url:'projects.html#project-list'},
    {name:'Secure',heading:'Make trust explicit, limited and verifiable.',description:'Use identity, least privilege, hardening, observability and recovery controls so access and risk can be inspected instead of merely assumed.',bullets:['Model identity and authorization','Reduce unnecessary exposure','Verify controls, evidence and recovery'],cta:'Explore security learning',url:'learn-browse.html?domain=cyber'},
    {name:'Automate',heading:'Turn repeatable work into reviewable systems.',description:'Replace fragile manual steps with scripts, tests, approvals, telemetry and safe failure handling while keeping humans responsible for consequential decisions.',bullets:['Define inputs, checks and failure states','Automate reviewed repeatable work','Measure results and preserve auditability'],cta:'Explore automation engineering',url:'project-lifecycle.html'},
    {name:'Evolve',heading:'Use evidence to improve what comes next.',description:'Connect operational learning with HPC, computer architecture, AI and quantum engineering by turning questions into measurable experiments and reusable knowledge.',bullets:['Ask precise technical questions','Test models against evidence','Convert learning into reproducible labs'],cta:'Explore advanced computing',url:'project-advanced-computing.html'}
  ];

  function enhanceProjectCards() {
    $$('.project-card').forEach(card => {
      const title = $('h2, h3',card)?.textContent.replace(/\s+/g,' ').trim() || 'project';
      const links=$$('a[href]',card);
      if (!links.length) return;
      let primary=links.find(a=>a.classList.contains('tile-open'))||links[0];
      const isChess=card.id==='battle-chess', isQubit=card.id==='quantum';
      if(isChess) primary.href='project-battle-chess.html';
      if(isQubit) primary.href='project-qubit.html';

      primary.classList.add('vnext-card-link');
      primary.target='_blank';
      primary.rel='noopener noreferrer';
      primary.setAttribute('aria-label',`Open ${title} project page in a new tab`);

      links.filter(a=>a!==primary).forEach(a=>{
        a.classList.add('vnext-secondary-link');
        const text=(a.textContent||'').toLowerCase();
        const href=a.getAttribute('href')||'';
        if(/^https?:/.test(href) || /play|demo|interactive|lab|source|github/.test(text)){
          a.target='_blank';a.rel='noopener noreferrer';
        }
      });

      if(isChess && !links.some(a=>a.getAttribute('href')==='games/3d-battle-chess/index.html')){
        const link=document.createElement('a');link.className='vnext-secondary-link';link.href='games/3d-battle-chess/index.html';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Play game ↗';
        $('.card-bottom',card)?.append(link);
      }
      if(isQubit && !links.some(a=>a.getAttribute('href')==='qubit-preview-20260921/')){
        const link=document.createElement('a');link.className='vnext-secondary-link';link.href='qubit-preview-20260921/';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open interactive lab ↗';
        $('.card-bottom',card)?.append(link);
      }
    });
    const embedded=$('#quantum');
    if(embedded && !embedded.classList.contains('project-card')) embedded.remove();
  }

  function enhanceProjectNavigation(){
    const nav=$('.vnext-project-nav');if(!nav)return;
    const links=$$('a[href]',nav);if(links.length<3)return;
    const clean=s=>(s||'').replace(/[←→↗]/g,'').replace(/\s+/g,' ').trim();
    const previous=links[0];
    const all=links.find(a=>/projects\.html(?:$|[#?])/.test(a.getAttribute('href')||''))||links[1];
    const next=links[links.length-1];
    previous.dataset.projectNav='previous';all.dataset.projectNav='all';next.dataset.projectNav='next';
    previous.textContent=`← Previous · ${clean(previous.textContent)}`;
    all.textContent='All Projects';
    next.textContent=`Next · ${clean(next.textContent)} →`;
    [previous,all,next].forEach(a=>{a.removeAttribute('target');a.removeAttribute('rel');});
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
    const old=$('.system-visual'); if(!old)return;
    const stage=document.createElement('section');
    stage.className='vnext-system vnext-solar-system';
    stage.setAttribute('aria-label','Interactive connected-systems solar system');
    stage.innerHTML=`<div class="vnext-sys-top"><span>CONNECTED SYSTEMS / EXPLORE A CAPABILITY WORLD</span><span id="vnext-count">01 / 05</span></div>
      <div class="vnext-space-scene">
        <canvas class="vnext-space-canvas" aria-hidden="true"></canvas>
        <div class="vnext-system-core" aria-hidden="true"><span>JR</span><small>SYSTEMS CORE</small></div>
        <div class="vnext-world-layer"></div>
        <div class="vnext-space-caption">SELECT A WORLD · ORBITS AND LINKS ARE LIVE</div>
      </div>
      <div class="vnext-system-tabs" role="tablist" aria-label="Connected systems capability worlds"></div>
      <div class="vnext-sys-detail" id="vnext-detail" role="tabpanel" tabindex="0">
        <div class="vnext-sys-meta">ACTIVE WORLD / <span id="vnext-world-name">ARCHITECT</span></div>
        <h2 id="vnext-title"></h2><p id="vnext-copy"></p><ul id="vnext-bullets"></ul><a class="vnext-cta" id="vnext-link"></a>
      </div>`;
    old.replaceWith(stage);

    const scene=$('.vnext-space-scene',stage);
    const canvas=$('.vnext-space-canvas',stage), ctx=canvas.getContext('2d');
    const layer=$('.vnext-world-layer',stage), tabs=$('.vnext-system-tabs',stage);
    const worlds=[
      {radius:.22,squash:.34,speed:.000030,phase:4.05,size:48,planet:'architect'},
      {radius:.31,squash:.27,speed:.000023,phase:5.62,size:42,planet:'build'},
      {radius:.40,squash:.31,speed:.000019,phase:.62,size:45,planet:'secure'},
      {radius:.49,squash:.23,speed:.000015,phase:2.62,size:43,planet:'automate'},
      {radius:.58,squash:.29,speed:.000012,phase:1.55,size:50,planet:'evolve'}
    ];
    const stars=Array.from({length:180},(_,i)=>({
      x:((i*73)%181)/181,y:((i*109+31)%191)/191,
      r:i%17===0?1.8:i%5===0?1.15:.65,a:.25+((i*37)%70)/100
    }));
    let selected=0,last=performance.now(),px=0,py=0,targetX=0,targetY=0,raf=0;
    const planetButtons=[];

    function makeTab(mode,i){
      const b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.id=`vnext-tab-${i}`;b.setAttribute('aria-controls','vnext-detail');
      b.innerHTML=`<span class="vnext-tab-dot" aria-hidden="true"></span><span>${mode.name}</span>`;
      b.addEventListener('click',()=>select(i,true));
      b.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?modes.length-1:(i+(e.key==='ArrowRight'?1:-1)+modes.length)%modes.length;select(n,true);tabs.children[n].focus();});
      tabs.append(b);
    }
    modes.forEach(makeTab);
    modes.forEach((mode,i)=>{
      const b=document.createElement('button'); b.type='button'; b.className=`vnext-world vnext-world-${worlds[i].planet}`; b.dataset.capability=String(i);
      b.setAttribute('aria-label',`Select ${mode.name} capability world`);
      b.innerHTML=`<span class="vnext-planet" aria-hidden="true"><i></i></span><strong>${mode.name}</strong>`;
      b.addEventListener('click',()=>select(i,true));
      b.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const n=(i+(e.key==='ArrowRight'?1:-1)+modes.length)%modes.length;select(n,false);planetButtons[n].focus();}});
      layer.append(b);planetButtons.push(b);
    });

    function select(i,focusDetail=false){
      selected=i;const mode=modes[i];stage.dataset.mode=mode.name.toLowerCase();
      [...tabs.children].forEach((b,j)=>{const on=j===i;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;b.classList.toggle('selected',on);});
      planetButtons.forEach((b,j)=>{const on=j===i;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
      $('#vnext-count',stage).textContent=`0${i+1} / 05`; $('#vnext-world-name',stage).textContent=mode.name.toUpperCase();
      $('#vnext-title',stage).textContent=mode.heading; $('#vnext-copy',stage).textContent=mode.description;
      $('#vnext-bullets',stage).replaceChildren(...mode.bullets.map(s=>{const li=document.createElement('li');li.textContent=s;return li;}));
      const link=$('#vnext-link',stage);link.href=mode.url;link.textContent=mode.cta+' ↗';
      if(focusDetail) $('#vnext-detail',stage)?.focus({preventScroll:true});
    }

    function resize(){
      const r=scene.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.max(2,Math.floor(r.width*d));canvas.height=Math.max(2,Math.floor(r.height*d));
      canvas.style.width=r.width+'px';canvas.style.height=r.height+'px';ctx.setTransform(d,0,0,d,0,0);
    }
    const ro=new ResizeObserver(resize);ro.observe(scene);resize();
    scene.addEventListener('pointermove',e=>{const r=scene.getBoundingClientRect();targetX=((e.clientX-r.left)/r.width-.5)*18;targetY=((e.clientY-r.top)/r.height-.5)*12;});
    scene.addEventListener('pointerleave',()=>{targetX=0;targetY=0;});

    function orbitPoint(w,h,index,time){
      const spec=worlds[index],running=!reduced.matches&&document.body.dataset.motion!=='paused';
      const t=spec.phase+(running?time*spec.speed:0);
      const depth=(Math.sin(t)+1)/2,rx=w*spec.radius*.72,ry=h*spec.squash;
      return {x:w*.5+Math.cos(t)*rx+px*(.25+depth*.4),y:h*.47+Math.sin(t)*ry+py*(.18+depth*.25),depth,scale:.74+depth*.36,t};
    }
    function glow(x,y,r,color,alpha=.16){
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color.replace('ALPHA',alpha));g.addColorStop(1,color.replace('ALPHA','0'));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
    function draw(time){
      if(!scene.isConnected){cancelAnimationFrame(raf);return}
      const r=scene.getBoundingClientRect(),w=r.width,h=r.height;if(w<2||h<2){raf=requestAnimationFrame(draw);return}
      const dt=Math.min(50,time-last);last=time;px+=(targetX-px)*Math.min(1,dt*.006);py+=(targetY-py)*Math.min(1,dt*.006);
      ctx.clearRect(0,0,w,h);
      const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#02070c');bg.addColorStop(.48,'#071722');bg.addColorStop(1,'#02050a');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      glow(w*.18+px*.4,h*.22+py*.3,Math.min(w,h)*.42,'rgba(15,115,175,ALPHA)',.15);
      glow(w*.82-px*.25,h*.3-py*.2,Math.min(w,h)*.36,'rgba(111,45,150,ALPHA)',.12);
      glow(w*.54,h*.88,Math.min(w,h)*.30,'rgba(206,104,39,ALPHA)',.08);
      stars.forEach((s,i)=>{const twinkle=.62+.38*Math.sin(time*.001+(i%11));ctx.fillStyle=`rgba(205,235,250,${Math.max(.08,s.a*twinkle)})`;ctx.beginPath();ctx.arc(s.x*w+px*(s.r*.08),s.y*h+py*(s.r*.08),s.r,0,Math.PI*2);ctx.fill();});

      const cx=w*.5+px*.1,cy=h*.47+py*.08;
      worlds.forEach((spec,i)=>{ctx.save();ctx.strokeStyle=i===selected?'rgba(244,165,117,.30)':'rgba(117,191,221,.13)';ctx.lineWidth=i===selected?1.4:.8;ctx.setLineDash(i===selected?[6,9]:[]);ctx.beginPath();ctx.ellipse(cx,cy,w*spec.radius*.72,h*spec.squash,0,0,Math.PI*2);ctx.stroke();ctx.restore();});
      const pts=worlds.map((_,i)=>orbitPoint(w,h,i,time));
      pts.forEach((p,i)=>{
        const active=i===selected;const g=ctx.createLinearGradient(cx,cy,p.x,p.y);g.addColorStop(0,active?'rgba(255,196,148,.92)':'rgba(96,204,232,.18)');g.addColorStop(1,active?'rgba(255,211,181,.58)':'rgba(96,204,232,.38)');
        ctx.strokeStyle=g;ctx.lineWidth=active?2.1:1;ctx.setLineDash(active?[8,7]:[3,9]);ctx.lineDashOffset=-time*.018;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(p.x,p.y);ctx.stroke();
        const q=((time*.00018+i*.17)%1);ctx.fillStyle=active?'#ffd4b8':'#8ee8f4';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=9;ctx.beginPath();ctx.arc(cx+(p.x-cx)*q,cy+(p.y-cy)*q,active?2.2:1.4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      });
      [[0,2],[1,3],[2,4]].forEach(([a,b])=>{ctx.strokeStyle='rgba(92,195,224,.12)';ctx.lineWidth=.8;ctx.setLineDash([2,8]);ctx.beginPath();ctx.moveTo(pts[a].x,pts[a].y);ctx.lineTo(pts[b].x,pts[b].y);ctx.stroke();});
      ctx.setLineDash([]);
      const core=ctx.createRadialGradient(cx-5,cy-7,2,cx,cy,42);core.addColorStop(0,'#fffbea');core.addColorStop(.2,'#ffd39a');core.addColorStop(.52,'#f49b56');core.addColorStop(1,'rgba(244,155,86,0)');ctx.fillStyle=core;ctx.beginPath();ctx.arc(cx,cy,42,0,Math.PI*2);ctx.fill();
      pts.forEach((p,i)=>{const b=planetButtons[i];b.style.left=`${p.x}px`;b.style.top=`${p.y}px`;b.style.zIndex=String(20+Math.round(p.depth*20));b.style.setProperty('--world-scale',p.scale.toFixed(3));b.style.setProperty('--world-depth',p.depth.toFixed(3));});
      raf=requestAnimationFrame(draw);
    }
    select(0,false);raf=requestAnimationFrame(draw);
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
  function init(){strengthenNavigation();enhanceProjectCards();enhanceProjectNavigation();restoreEducation();interactiveSystems();entanglementArtwork();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
