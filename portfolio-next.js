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
    const old=$('.system-visual');if(!old)return;
    const stage=document.createElement('section');
    stage.className='vnext-system vnext-cosmos';
    stage.setAttribute('aria-label','Interactive Connected Systems solar-system model');
    stage.innerHTML=`<div class="vnext-sys-top"><span>CONNECTED SYSTEMS / SELECT A WORLD</span><span id="vnext-count">01 / 05</span></div>
      <div class="vnext-system-tabs" role="tablist" aria-label="Connected systems capabilities"></div>
      <div class="vnext-cosmos-scene" aria-label="Animated solar-system capability scene">
        <canvas class="vnext-cosmos-canvas" role="img" aria-label="Five linked capability nodes orbiting a central systems core"></canvas>
        <div class="vnext-cosmos-core" aria-hidden="true"><span>JR</span><small>SYSTEMS CORE</small></div>
        <div class="vnext-cosmos-worlds"></div>
        <div class="vnext-cosmos-hint">SELECT A WORLD · CONNECTIONS MOVE WITH THE SYSTEM</div>
      </div>
      <div class="vnext-sys-detail" id="vnext-detail" role="tabpanel" tabindex="0">
        <div class="vnext-sys-meta">ACTIVE CAPABILITY</div>
        <div class="vnext-detail-grid"><div><h2 id="vnext-title"></h2><p id="vnext-copy"></p></div><div><ul id="vnext-bullets"></ul><a class="vnext-cta" id="vnext-link"></a></div></div>
      </div>`;
    old.replaceWith(stage);

    const tabs=$('.vnext-system-tabs',stage);
    const scene=$('.vnext-cosmos-scene',stage);
    const canvas=$('.vnext-cosmos-canvas',stage);
    const worlds=$('.vnext-cosmos-worlds',stage);
    const coreEl=$('.vnext-cosmos-core',stage);
    const ctx=canvas.getContext('2d',{alpha:true});
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
      const tab=document.createElement('button');
      tab.type='button';tab.setAttribute('role','tab');tab.id=`vnext-tab-${i}`;tab.setAttribute('aria-controls','vnext-detail');
      tab.innerHTML=`<span class="vnext-tab-dot" aria-hidden="true"></span><span>${mode.name}</span>`;
      tab.addEventListener('click',()=>select(i,true));
      tab.addEventListener('keydown',e=>{
        if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
        e.preventDefault();
        const n=e.key==='Home'?0:e.key==='End'?modes.length-1:(i+(e.key==='ArrowRight'?1:-1)+modes.length)%modes.length;
        select(n,true);tabs.children[n].focus();
      });
      tabs.append(tab);

      const world=document.createElement('button');
      world.type='button';
      world.className=`vnext-world vnext-world-${orbit[i].kind}`;
      world.dataset.capability=String(i);
      world.setAttribute('aria-label',`Select ${mode.name}`);
      world.innerHTML=`<span class="vnext-planet" aria-hidden="true"><span class="vnext-planet-shine"></span><span class="vnext-planet-ring"></span></span><strong>${mode.name}</strong><small>0${i+1}</small>`;
      world.addEventListener('click',()=>select(i,true));
      world.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(i,true);}});
      worlds.append(world);
    });

    function select(i,focusDetail=false){
      selected=i;const mode=modes[i];stage.dataset.mode=mode.name.toLowerCase();
      [...tabs.children].forEach((b,j)=>{const on=j===i;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;b.classList.toggle('selected',on);});
      $$('.vnext-world',worlds).forEach((n,j)=>{const on=j===i;n.classList.toggle('selected',on);n.setAttribute('aria-pressed',String(on));});
      $('#vnext-count',stage).textContent=`0${i+1} / 05`;
      $('.vnext-sys-meta',stage).textContent=`ACTIVE CAPABILITY / ${mode.name.toUpperCase()}`;
      $('#vnext-title',stage).textContent=mode.heading;
      $('#vnext-copy',stage).textContent=mode.description;
      $('#vnext-bullets',stage).replaceChildren(...mode.bullets.map(s=>{const li=document.createElement('li');li.textContent=s;return li;}));
      const link=$('#vnext-link',stage);link.href=mode.url;link.textContent=mode.cta+' ↗';
      canvas.setAttribute('aria-label',`${mode.name} selected. Five linked capability nodes orbit a central systems core.`);
      if(focusDetail) $('#vnext-detail',stage)?.focus({preventScroll:true});
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

    function orbitRadius(o){
      if(width<520){
        const i=orbit.indexOf(o);
        const mobileRx=[.28,.32,.355,.385,.415];
        const mobileRy=[.12,.15,.18,.21,.235];
        return {rx:mobileRx[i]??Math.min(o.rx,.415),ry:mobileRy[i]??Math.min(o.ry,.235)};
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
      return {
        x:cx+Math.cos(a)*width*r.rx,
        y:cy+Math.sin(a)*height*r.ry,
        depth,
        scale:.72+depth*.38
      };
    }

    function star(x,y,r,a){
      ctx.globalAlpha=a;ctx.fillStyle='#dff7ff';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    }

    function draw(){
      if(!width||!height)return;
      ctx.clearRect(0,0,width,height);
      const bg=ctx.createRadialGradient(width*.46,height*.42,12,width*.5,height*.48,width*.72);
      bg.addColorStop(0,'#0b2535');bg.addColorStop(.38,'#07131e');bg.addColorStop(1,'#02060b');
      ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);

      const nebula=ctx.createRadialGradient(width*.18+parallaxX*18,height*.22+parallaxY*10,0,width*.18,height*.22,width*.34);
      nebula.addColorStop(0,'rgba(30,130,190,.23)');nebula.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=nebula;ctx.fillRect(0,0,width,height);
      const nebula2=ctx.createRadialGradient(width*.83-parallaxX*14,height*.19-parallaxY*10,0,width*.83,height*.19,width*.28);
      nebula2.addColorStop(0,'rgba(126,54,165,.17)');nebula2.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=nebula2;ctx.fillRect(0,0,width,height);

      const seed=113;
      for(let i=0;i<135;i++){
        const x=((i*83+seed*17)%997)/997*width;
        const y=((i*47+seed*29)%991)/991*height;
        const pulse=.48+.34*Math.sin(t*.7+i*.91);
        star(x+parallaxX*(i%3),y+parallaxY*(i%5)*.5,(i%11===0?1.5:.65),Math.max(.18,pulse));
      }
      ctx.globalAlpha=1;

      const cx=width*.5+parallaxX*10,cy=height*.45+parallaxY*6;
      orbit.forEach((o,i)=>{
        const r=orbitRadius(o);
        ctx.save();ctx.strokeStyle=i===selected?'rgba(255,190,145,.34)':'rgba(94,183,215,.16)';ctx.lineWidth=i===selected?1.5:1;
        ctx.beginPath();ctx.ellipse(cx,cy,width*r.rx,height*r.ry,0,0,Math.PI*2);ctx.stroke();ctx.restore();
      });
      coreEl.style.transform=`translate(calc(-50% + ${parallaxX*10}px), calc(-50% + ${parallaxY*6}px))`;

      positions.forEach((_,i)=>Object.assign(positions[i],worldPosition(i,t)));

      const pairs=[[0,1],[1,2],[2,3],[3,4],[4,0],[0,2],[1,3]];
      pairs.forEach(([a,b],idx)=>{
        const p=positions[a],q=positions[b],active=a===selected||b===selected;
        ctx.save();ctx.strokeStyle=active?'rgba(255,190,145,.58)':'rgba(76,196,226,.20)';ctx.lineWidth=active?1.7:1;
        ctx.setLineDash(active?[7,6]:[3,8]);ctx.lineDashOffset=-(t*28+idx*11);
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.restore();
      });
      positions.forEach((p,i)=>{
        ctx.save();ctx.strokeStyle=i===selected?'rgba(255,194,151,.78)':'rgba(85,205,235,.28)';ctx.lineWidth=i===selected?2.2:1.1;
        ctx.setLineDash(i===selected?[8,5]:[3,8]);ctx.lineDashOffset=-t*34;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(p.x,p.y);ctx.stroke();
        const q=((t*.38+i*.17)%1),px=cx+(p.x-cx)*q,py=cy+(p.y-cy)*q;
        ctx.fillStyle=i===selected?'#ffd0ad':'#81e5f4';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(px,py,i===selected?2.7:1.8,0,Math.PI*2);ctx.fill();ctx.restore();
      });

      const coreGlow=ctx.createRadialGradient(cx-8,cy-10,2,cx,cy,54);
      coreGlow.addColorStop(0,'#fff9df');coreGlow.addColorStop(.14,'#ffd99c');coreGlow.addColorStop(.42,'rgba(255,169,82,.48)');coreGlow.addColorStop(1,'rgba(255,140,60,0)');
      ctx.fillStyle=coreGlow;ctx.beginPath();ctx.arc(cx,cy,54,0,Math.PI*2);ctx.fill();

      $$('.vnext-world',worlds).forEach((el,i)=>{
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
      const dt=Math.min(40,now-last||16);last=now;
      if(!reduced.matches && !document.hidden)t+=dt/1000;
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
    if(typeof ResizeObserver!=='undefined'){
      new ResizeObserver(resize).observe(scene);
    }else{
      addEventListener('resize',resize,{passive:true});
    }
    select(0,false);resize();raf=requestAnimationFrame(frame);
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
    const resize=()=>{size();draw()};
    if(typeof ResizeObserver!=='undefined') new ResizeObserver(resize).observe(canvas);
    else addEventListener('resize',resize,{passive:true});
    resize();
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
    const nav=$('#primary-nav');if(!nav)return;
    // app.js owns the Game Development submenu. Remove any legacy standalone
    // Battle Chess link left by an older cached enhancement.
    nav.querySelectorAll(':scope > a[href="project-battle-chess.html"]').forEach(link=>link.remove());
  }
  function loadScienceExperiments(){
    const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    const enabled=new Set(['project-recovery.html','project-dependency.html','project-lifecycle.html','project-fusion.html','project-portfolio.html','project-qubit.html','project-learning-library.html','project-advanced-computing.html','project-asset-inventory.html','project-kubernetes-lab.html','project-qpe.html','project-emergent.html','project-mind.html']);
    if(!enabled.has(page))return;
    if(!document.querySelector('link[href="science-experiments.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='science-experiments.css';document.head.append(l);}
    if(!document.querySelector('script[src="science-experiments.js"]')){const s=document.createElement('script');s.src='science-experiments.js';s.defer=true;document.body.append(s);}
  }
  function init(){
    const steps=[loadScienceExperiments,strengthenNavigation,enhanceProjectCards,enhanceProjectNavigation,restoreEducation,interactiveSystems,entanglementArtwork];
    steps.forEach(step=>{
      try{step();}
      catch(error){console.error('[portfolio enhancement]',step.name,error);}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
