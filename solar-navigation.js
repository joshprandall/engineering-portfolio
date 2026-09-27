/* Cinematic animated solar navigation for portfolio, learning, and AI build routes. */
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const palettes=[
    ['#f4f9ff','#56d8e8','#0d5267'],
    ['#fff2df','#e36f49','#7f2d22'],
    ['#fbf2ff','#b45ee2','#54256f'],
    ['#f3fbff','#76d9e7','#265c72'],
    ['#fff8d9','#e6b94e','#7b5717'],
    ['#e9fbff','#68b8ce','#23485e'],
    ['#fce7ff','#b363d6','#4d255f'],
    ['#f7efe4','#c27655','#5f3025'],
    ['#f1fbef','#7cc891','#2d5b39']
  ];

  function svgEl(name,attrs={}){
    const el=document.createElementNS(NS,name);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));
    return el;
  }
  function paused(){
    return reduced.matches || document.documentElement.dataset.sceneMotion==='paused';
  }
  function config(section,count){
    const kind=section.dataset.solar;
    if(kind==='portfolio'){
      return {cx:400,cy:325,lanes:Math.max(count,1),lane:i=>i,
        radii:i=>({rx:88+i*23,ry:44+i*16}),
        phase:i=>-1.45+i*2.399963,
        speed:i=>0.082-i*0.0052};
    }
    if(kind==='learning'){
      return {cx:400,cy:325,lanes:Math.max(count,1),lane:i=>i,
        radii:i=>({rx:98+i*27,ry:50+i*22}),
        phase:i=>-1.35+i*2.399963,
        speed:i=>0.078-i*0.006};
    }
    return {cx:450,cy:360,lanes:6,lane:i=>i%6,
      radii:i=>({rx:105+i*48,ry:58+i*37}),
      phase:i=>-1.45+i*2.399963,
      speed:i=>(0.07-i*0.007)*(i%2?-1:1)};
  }

  function init(section,index){
    const svg=section.querySelector('.solar-map');
    const links=[...svg.querySelectorAll('.solar-planet-link')];
    if(!svg||!links.length||section.dataset.cinematicSolar==='1')return;
    section.dataset.cinematicSolar='1';
    section.classList.add('cinematic-solar');
    const kind=section.dataset.solar;
    const cfg=config(section,links.length);
    const defs=svg.querySelector('defs')||svg.insertBefore(svgEl('defs'),svg.firstChild);
    const core=svg.querySelector(':scope > circle[data-solar-body]');
    const coreText=svg.querySelector(':scope > text');

    [...svg.querySelectorAll(':scope > ellipse[data-solar-body]')].forEach(e=>e.remove());

    const orbitLayer=svgEl('g',{'class':'cinematic-orbit-layer','aria-hidden':'true'});
    const coreAnchor=core||coreText;
    if(coreAnchor)svg.insertBefore(orbitLayer,coreAnchor);
    else svg.append(orbitLayer);
    for(let lane=0;lane<cfg.lanes;lane++){
      const r=cfg.radii(lane);
      orbitLayer.append(svgEl('ellipse',{cx:cfg.cx,cy:cfg.cy,rx:r.rx,ry:r.ry,'class':'cinematic-orbit'}));
    }

    const sunId=`cinematic-sun-${index}`;
    const sun=svgEl('radialGradient',{id:sunId,cx:'35%',cy:'30%',r:'68%'});
    sun.append(svgEl('stop',{offset:'0%','stop-color':'#fff9df'}));
    sun.append(svgEl('stop',{offset:'18%','stop-color':'#ffd58a'}));
    sun.append(svgEl('stop',{offset:'52%','stop-color':'#ef963f'}));
    sun.append(svgEl('stop',{offset:'100%','stop-color':'#8a351b'}));
    defs.append(sun);
    if(core){
      core.setAttribute('fill',`url(#${sunId})`);
      core.classList.add('cinematic-sun');
    }
    if(coreText)coreText.classList.add('cinematic-core-label');

    const planets=links.map((link,i)=>{
      const group=link.querySelector('g');
      const circle=group?.querySelector('circle');
      const label=group?.querySelector('text');
      if(!group||!circle)return null;
      const bx=parseFloat(circle.getAttribute('cx'))||cfg.cx;
      const by=parseFloat(circle.getAttribute('cy'))||cfg.cy;
      const radius=parseFloat(circle.getAttribute('r'))||45;
      const [hi,mid,lo]=palettes[i%palettes.length];
      const gid=`cinematic-planet-${index}-${i}`;
      const grad=svgEl('radialGradient',{id:gid,cx:'30%',cy:'24%',r:'72%'});
      grad.append(svgEl('stop',{offset:'0%','stop-color':hi}));
      grad.append(svgEl('stop',{offset:'24%','stop-color':mid}));
      grad.append(svgEl('stop',{offset:'100%','stop-color':lo}));
      defs.append(grad);
      circle.setAttribute('fill',`url(#${gid})`);
      circle.setAttribute('stroke','rgba(255,255,255,.42)');
      circle.setAttribute('stroke-width','1');
      circle.classList.add('cinematic-planet');

      if(i%4===2){
        const ring=svgEl('ellipse',{cx:bx,cy:by,rx:radius*1.38,ry:radius*.30,'class':'cinematic-planet-ring',transform:`rotate(-14 ${bx} ${by})`});
        group.insertBefore(ring,label||null);
      }
      if(label){
        const tspans=[...label.querySelectorAll('tspan')];
        const lines=tspans.length||1;
        label.classList.add('cinematic-planet-label');
        label.setAttribute('x',bx);
        label.setAttribute('y',by+radius+14);
        label.setAttribute('dominant-baseline','hanging');
        if(tspans.length){
          tspans.forEach((t,j)=>{
            t.setAttribute('x',bx);
            t.setAttribute('dy',j===0?'0':(kind==='ai-builds'?'15':'17'));
          });
        }
        label.style.setProperty('--label-lines',String(lines));
      }
      link.dataset.solarPlanet=String(i);
      return {link,group,circle,label,bx,by,lane:cfg.lane(i),phase:cfg.phase(i)};
    }).filter(Boolean);

    let raf=0,last=performance.now(),elapsed=0,visible=true;
    function draw(){
      planets.forEach((p,i)=>{
        const r=cfg.radii(p.lane);
        const speed=cfg.speed(p.lane);
        const a=p.phase+elapsed*speed;
        const depth=(Math.sin(a)+1)/2;
        const x=cfg.cx+Math.cos(a)*r.rx;
        const y=cfg.cy+Math.sin(a)*r.ry;
        const scale=.82+depth*.22+(p.link.matches(':hover,:focus-visible')?.08:0);
        p.group.setAttribute('transform',`translate(${(x-p.bx).toFixed(2)} ${(y-p.by).toFixed(2)}) scale(${scale.toFixed(3)})`);
        p.group.style.transformOrigin=`${p.bx}px ${p.by}px`;
        p.group.style.opacity=String(.78+depth*.22);
      });
    }
    function frame(now){
      raf=0;
      const dt=Math.min(50,now-last);last=now;
      if(!paused())elapsed+=dt/1000;
      draw();
      if(visible&&!document.hidden&&!paused())raf=requestAnimationFrame(frame);
    }
    function start(){
      if(raf||!visible||document.hidden||paused())return;
      last=performance.now();raf=requestAnimationFrame(frame);
    }
    function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
    draw();start();

    links.forEach(link=>{
      link.addEventListener('focus',draw);
      link.addEventListener('blur',draw);
      link.addEventListener('pointerenter',draw);
      link.addEventListener('pointerleave',draw);
    });
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>{
        visible=Boolean(entries[0]?.isIntersecting);
        if(visible)start();else stop();
      },{rootMargin:'180px 0px'});
      io.observe(section);
    }
    document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
    document.addEventListener('portfolio:motion',()=>{draw();start()});
    reduced.addEventListener?.('change',()=>{draw();start()});
    new MutationObserver(()=>{draw();start()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-scene-motion']});
  }

  function run(){document.querySelectorAll('.solar-navigation[data-solar]').forEach(init);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();