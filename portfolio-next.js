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
    // Project detail pages use the global header only. Remove any stale pager
    // left in older markup so Previous / All / Next navigation cannot return.
    $$('.vnext-project-nav').forEach(nav=>nav.remove());
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
    const stage=document.createElement('section');
    stage.className='vnext-system vnext-cosmos';
    stage.setAttribute('aria-label','Interactive Connected Systems solar-system model');
    stage.innerHTML=`<div class="vnext-cosmos-scene" aria-label="Animated solar-system capability scene">
        <canvas class="vnext-cosmos-canvas" role="img" aria-label="Five linked capability nodes orbiting a central systems core"></canvas>
        <div class="vnext-cosmos-core" aria-hidden="true"></div>
        <div class="vnext-cosmos-worlds" role="group" aria-label="Select a connected-systems capability"></div>
      </div>
      <div class="vnext-sys-detail" id="vnext-detail" aria-live="polite">
        <div class="vnext-sys-meta">ACTIVE CAPABILITY</div>
        <h2 id="vnext-title"></h2>
        <p id="vnext-copy"></p>
        <a class="vnext-cta" id="vnext-link"></a>
      </div>`;
    old.replaceWith(stage);

    const scene=$('.vnext-cosmos-scene',stage);
    const canvas=$('.vnext-cosmos-canvas',stage);
    const worlds=$('.vnext-cosmos-worlds',stage);
    const coreEl=$('.vnext-cosmos-core',stage);
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx)return;
    const worldEls=[];
    const orbit=[
      {rx:.22,ry:.105,speed:.24,phase:-2.15,size:58,kind:'architect'},
      {rx:.31,ry:.145,speed:.18,phase:-.35,size:52,kind:'build'},
      {rx:.40,ry:.19,speed:.145,phase:.78,size:49,kind:'secure'},
      {rx:.49,ry:.225,speed:.115,phase:2.45,size:46,kind:'automate'},
      {rx:.58,ry:.265,speed:.09,phase:1.62,size:55,kind:'evolve'}
    ];
    let selected=0, raf=0, last=0, t=0, width=0, height=0, dpr=1, parallaxX=0, parallaxY=0, targetX=0, targetY=0;
    const positions=modes.map(()=>({x:0,y:0,scale:1,depth:0}));

    modes.forEach((mode,i)=>{
      const world=document.createElement('button');
      world.type='button';
      world.className=`vnext-world vnext-world-${orbit[i].kind}`;
      world.dataset.capability=String(i);
      world.setAttribute('aria-label',`Select ${mode.name}`);
      world.setAttribute('aria-pressed','false');
      world.title=mode.name;
      world.innerHTML=`<span class="vnext-planet" aria-hidden="true"><span class="vnext-planet-shine"></span><span class="vnext-planet-ring"></span></span><strong>${mode.name}</strong>`;
      world.addEventListener('click',()=>select(i));
      world.addEventListener('keydown',e=>{
        if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
        e.preventDefault();
        const n=e.key==='Home'?0:e.key==='End'?modes.length-1:(i+(e.key==='ArrowRight'?1:-1)+modes.length)%modes.length;
        select(n);worldEls[n]?.focus();
      });
      worlds.append(world);
      worldEls.push(world);
    });

    function select(i){
      selected=i;const mode=modes[i];stage.dataset.mode=mode.name.toLowerCase();
      worldEls.forEach((n,j)=>{const on=j===i;n.classList.toggle('selected',on);n.setAttribute('aria-pressed',String(on));});
      $('.vnext-sys-meta',stage).textContent=`ACTIVE CAPABILITY / ${mode.name.toUpperCase()}`;
      $('#vnext-title',stage).textContent=mode.heading;
      $('#vnext-copy',stage).textContent=mode.description;
      const link=$('#vnext-link',stage);link.href=mode.url;link.textContent=mode.cta+' ↗';
      canvas.setAttribute('aria-label',`${mode.name} selected. Five linked capability nodes orbit a central systems core.`);
      draw();
    }

    function resize(){
      const r=scene.getBoundingClientRect();
      width=Math.max(2,r.width);height=Math.max(2,r.height);
      dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      canvas.style.width=width+'px';canvas.style.height=height+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      draw();
    }

    // Solar orbit v11: restore the original cinematic angle and motion.
    // The old desktop clamp made the outer tracks share the same horizontal
    // endpoints. These radii preserve the original perspective while widening
    // every lane so the drawn orbit paths remain distinct.
    function orbitRadius(o){
      const i=orbit.indexOf(o);
      if(width<520){
        const mobileRx=[.24,.31,.38,.45,.52];
        const mobileRy=[.105,.145,.185,.225,.265];
        return {rx:mobileRx[i]??o.rx,ry:mobileRy[i]??o.ry};
      }
      return {rx:o.rx,ry:o.ry};
    }

    function worldPosition(i,time){
      const o=orbit[i],r=orbitRadius(o);
      const motion=reduced.matches?0:time*o.speed;
      const a=o.phase+motion;
      const cx=width*.5+parallaxX*10;
      const cy=height*.45+parallaxY*6;
      const depth=(Math.sin(a)+1)/2;
      return {x:cx+Math.cos(a)*width*r.rx,y:cy+Math.sin(a)*height*r.ry,depth,scale:.72+depth*.38};
    }

    function draw(){
      if(!width||!height)return;
      ctx.clearRect(0,0,width,height);
      const cx=width*.5+parallaxX*10,cy=height*.45+parallaxY*6;

      orbit.forEach((o,i)=>{
        const r=orbitRadius(o);
        ctx.save();
        ctx.strokeStyle=i===selected?'rgba(155,91,48,.52)':'rgba(55,114,125,.26)';
        ctx.lineWidth=i===selected?1.7:1;
        ctx.beginPath();ctx.ellipse(cx,cy,width*r.rx,height*r.ry,0,0,Math.PI*2);ctx.stroke();ctx.restore();
      });
      coreEl.style.transform=`translate(calc(-50% + ${parallaxX*10}px), calc(-50% + ${parallaxY*6}px))`;
      positions.forEach((_,i)=>Object.assign(positions[i],worldPosition(i,t)));

      const pairs=[[0,1],[1,2],[2,3],[3,4],[4,0],[0,2],[1,3]];
      pairs.forEach(([a,b],idx)=>{
        const p=positions[a],q=positions[b],active=a===selected||b===selected;
        ctx.save();ctx.strokeStyle=active?'rgba(155,91,48,.62)':'rgba(37,119,133,.24)';ctx.lineWidth=active?1.7:1;
        ctx.setLineDash(active?[7,6]:[3,8]);ctx.lineDashOffset=-(t*28+idx*11);
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.restore();
      });
      positions.forEach((p,i)=>{
        ctx.save();ctx.strokeStyle=i===selected?'rgba(169,91,43,.72)':'rgba(43,125,140,.26)';ctx.lineWidth=i===selected?2.2:1.1;
        ctx.setLineDash(i===selected?[8,5]:[3,8]);ctx.lineDashOffset=-t*34;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(p.x,p.y);ctx.stroke();
        const q=((t*.38+i*.17)%1),px=cx+(p.x-cx)*q,py=cy+(p.y-cy)*q;
        ctx.fillStyle=i===selected?'#d16f37':'#4baebf';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(px,py,i===selected?2.7:1.8,0,Math.PI*2);ctx.fill();ctx.restore();
      });

      const coreGlow=ctx.createRadialGradient(cx-8,cy-10,2,cx,cy,54);
      coreGlow.addColorStop(0,'#fff9df');coreGlow.addColorStop(.14,'#ffd99c');coreGlow.addColorStop(.42,'rgba(255,169,82,.48)');coreGlow.addColorStop(1,'rgba(255,140,60,0)');
      ctx.fillStyle=coreGlow;ctx.beginPath();ctx.arc(cx,cy,54,0,Math.PI*2);ctx.fill();

      worldEls.forEach((el,i)=>{
        const p=positions[i],o=orbit[i],base=Math.min(o.size,width<480?44:o.size);
        el.style.setProperty('--world-size',`${base}px`);
        const depthScale=.80+p.depth*.28;
        el.style.transform=`translate3d(${p.x}px,${p.y}px,0) translate(-50%,-50%) scale(${depthScale})`;
        el.style.zIndex=String(20+Math.round(p.depth*30)+(i===selected?40:0));
        el.style.opacity=String(i===selected?1:(.86+p.depth*.14));
      });
    }

    function frame(now){
      if(!stage.isConnected)return;
      if(document.hidden){last=now;raf=requestAnimationFrame(frame);return;}
      const dt=Math.min(40,now-last||16);last=now;
      if(!reduced.matches && document.body.dataset.motion!=='paused')t+=dt/1000;
      parallaxX+=(targetX-parallaxX)*.045;parallaxY+=(targetY-parallaxY)*.045;
      draw();raf=requestAnimationFrame(frame);
    }

    scene.addEventListener('pointermove',e=>{
      if(e.pointerType==='touch')return;
      const r=scene.getBoundingClientRect();
      targetX=((e.clientX-r.left)/r.width-.5)*2;targetY=((e.clientY-r.top)/r.height-.5)*2;
    });
    scene.addEventListener('pointerleave',()=>{targetX=0;targetY=0});
    reduced.addEventListener?.('change',()=>draw());
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(scene);
    else addEventListener('resize',resize,{passive:true});
    select(0);resize();raf=requestAnimationFrame(frame);
  }

  function strengthenNavigation(){
    const nav=$('#primary-nav');if(!nav)return;
    // site-resilience.js owns the Game Development submenu. Remove any legacy standalone
    // Battle Chess link left by an older cached enhancement.
    nav.querySelectorAll(':scope > a[href="project-battle-chess.html"]').forEach(link=>link.remove());
  }
  function loadScienceExperiments(){
    const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    const enabled=new Set(['project-recovery.html','project-dependency.html','project-lifecycle.html','project-fusion.html','project-portfolio.html','project-qubit.html','project-learning-library.html','project-advanced-computing.html','project-asset-inventory.html','project-kubernetes-lab.html','project-qpe.html','project-emergent.html','project-mind.html']);
    if(!enabled.has(page))return;
    if(!document.querySelector('link[href="science-experiments.css?v=20260924-release"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='science-experiments.css?v=20260924-release';document.head.append(l);}
    if(!document.querySelector('script[src="science-experiments.js?v=20260924-release"]')){const s=document.createElement('script');s.src='science-experiments.js?v=20260924-release';s.defer=true;document.body.append(s);}
  }
  function init(){
    const steps=[loadScienceExperiments,strengthenNavigation,enhanceProjectCards,enhanceProjectNavigation,restoreEducation,interactiveSystems];
    steps.forEach(step=>{
      try{step();}
      catch(error){console.error('[portfolio enhancement]',step.name,error);}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
