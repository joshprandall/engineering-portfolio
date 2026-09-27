/* Approved cinematic solar navigation: equal spacing, realistic front/back depth,
   large tap targets, and route-specific destinations. */
(() => {
  'use strict';

  const NS='http://www.w3.org/2000/svg';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const palettes=[
    ['#e9fcff','#37cce2','#13576a'],
    ['#fff1dc','#e26c45','#762a21'],
    ['#f8eaff','#b255df','#542269'],
    ['#eaf8ff','#5db3d2','#234e69'],
    ['#fff5c9','#d9aa35','#755116'],
    ['#edf8ef','#69b77d','#295539'],
    ['#fae8ff','#a65bd0','#4b235f'],
    ['#f8ede4','#c16e4d','#5b3025'],
    ['#eaf7ff','#5d9ec2','#234258']
  ];

  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const E=(name,attrs={})=>{
    const el=document.createElementNS(NS,name);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));
    return el;
  };
  const paused=()=>reduced.matches||document.documentElement.dataset.sceneMotion==='paused';

  const config={
    portfolio:{
      viewBox:'0 0 760 560',cx:380,cy:280,sun:38,speed:.105,
      rings:[{rx:245,ry:118}]
    },
    learning:{
      viewBox:'0 0 760 560',cx:380,cy:280,sun:38,speed:.10,
      rings:[{rx:245,ry:118}]
    },
    'ai-builds':{
      viewBox:'0 0 820 620',cx:410,cy:310,sun:42,speed:.075,
      rings:[
        {rx:145,ry:70,count:6,offset:0},
        {rx:235,ry:128,count:6,offset:.33},
        {rx:325,ry:205,count:7,offset:.66}
      ]
    }
  };

  function labelLines(name){
    const special={
      'Expertise & Experience':['Expertise &','Experience'],
      'Game Development':['Game','Development'],
      'AI Development':['AI','Development'],
      'Cloud & Systems':['Cloud &','Systems'],
      'Advanced Computing':['Advanced','Computing'],
      'Software Engineering':['Software','Engineering'],
      'Leadership & IT Management':['Leadership &','IT Management'],
      'Machine Learning':['Machine','Learning'],
      'Deep Learning':['Deep','Learning'],
      'Generative AI':['Generative','AI'],
      'Multimodal AI':['Multimodal','AI'],
      'Computer Vision':['Computer','Vision'],
      'Reinforcement Learning':['Reinforcement','Learning'],
      'Graph Neural Networks':['Graph Neural','Networks'],
      'Neuro-symbolic AI':['Neuro-symbolic','AI'],
      'Multi-agent systems':['Multi-agent','systems'],
      'Embodied / Robotic AI':['Embodied /','Robotic AI'],
      'AI memory / retrieval':['AI memory /','retrieval'],
      'Build Your Own AI':['Build Your','Own AI'],
      'Project MIND':['Project','MIND'],
      'Personal development agent':['Personal','development','agent']
    };
    return special[name]||[name];
  }

  function ensureDefs(svg,id){
    let defs=q('defs',svg);
    if(!defs){defs=E('defs');svg.insertBefore(defs,svg.firstChild);}
    const sunId=`approved-sun-${id}`;
    const sun=E('radialGradient',{id:sunId,cx:'34%',cy:'29%',r:'70%'});
    [['0%','#fffbe9'],['16%','#ffd98e'],['49%','#f19a42'],['100%','#7e2b18']].forEach(([o,c])=>sun.append(E('stop',{offset:o,'stop-color':c})));
    defs.append(sun);

    palettes.forEach((p,i)=>{
      const gid=`approved-planet-${id}-${i}`;
      const g=E('radialGradient',{id:gid,cx:'30%',cy:'24%',r:'72%'});
      [['0%',p[0]],['28%',p[1]],['100%',p[2]]].forEach(([o,c])=>g.append(E('stop',{offset:o,'stop-color':c})));
      defs.append(g);
    });
    return {sunId};
  }

  function ringAssignments(kind,count,cfg){
    if(kind!=='ai-builds')return Array.from({length:count},(_,i)=>({ring:0,index:i,total:count,offset:0}));
    const out=[];let cursor=0;
    cfg.rings.forEach((ring,ri)=>{
      const total=Math.min(ring.count,count-cursor);
      for(let i=0;i<total;i++)out.push({ring:ri,index:i,total,offset:ring.offset||0});
      cursor+=total;
    });
    return out;
  }

  function init(section,sectionIndex){
    if(section.dataset.approvedSolar==='1')return;
    const kind=section.dataset.solar;
    const cfg=config[kind];
    const svg=q('.solar-map',section);
    const links=qa('.solar-planet-link',svg);
    if(!cfg||!svg||!links.length)return;

    section.dataset.approvedSolar='1';
    section.classList.add('approved-cinematic-solar');
    svg.setAttribute('viewBox',cfg.viewBox);

    const {sunId}=ensureDefs(svg,sectionIndex);

    // Replace static orbit geometry with the approved cinematic structure.
    qa(':scope > ellipse[data-solar-body]',svg).forEach(n=>n.remove());
    const oldCore=q(':scope > circle[data-solar-body]',svg);
    const oldCoreText=q(':scope > text',svg);
    if(oldCore)oldCore.remove();
    if(oldCoreText)oldCoreText.remove();

    const orbitLayer=E('g',{'class':'approved-orbit-layer','aria-hidden':'true'});
    const backLayer=E('g',{'class':'approved-depth approved-depth-back'});
    const sunGlow=E('circle',{cx:cfg.cx,cy:cfg.cy,r:cfg.sun+30,'class':'approved-sun-glow','aria-hidden':'true'});
    const sun=E('circle',{cx:cfg.cx,cy:cfg.cy,r:cfg.sun,fill:`url(#${sunId})`,'class':'approved-sun','aria-hidden':'true'});
    const frontLayer=E('g',{'class':'approved-depth approved-depth-front'});

    cfg.rings.forEach(r=>orbitLayer.append(E('ellipse',{cx:cfg.cx,cy:cfg.cy,rx:r.rx,ry:r.ry,'class':'approved-orbit'})));
    svg.append(orbitLayer,backLayer,sunGlow,sun,frontLayer);

    const assigns=ringAssignments(kind,links.length,cfg);
    const planets=links.map((link,i)=>{
      const oldGroup=q('g',link);
      const oldCircle=q('circle',oldGroup);
      const name=link.getAttribute('aria-label')||(q('text',oldGroup)?.textContent||'').replace(/\s+/g,' ').trim();
      const destination=link.getAttribute('href')||'#';
      const ringInfo=assigns[i];
      const ring=cfg.rings[ringInfo.ring];
      const size=kind==='ai-builds'?(ringInfo.ring===0?21:ringInfo.ring===1?19:18):22;
      const group=E('g',{'class':'approved-planet-link','role':'link','tabindex':'0','aria-label':name});
      const body=E('circle',{r:size,fill:`url(#approved-planet-${sectionIndex}-${i%palettes.length})`,'class':'approved-planet-body'});
      group.append(body);

      if((i+ringInfo.ring)%4===2){
        group.append(E('ellipse',{rx:size*1.48,ry:size*.34,'class':'approved-ring',transform:'rotate(-16)'}));
      }

      // Deliberately larger invisible interaction target for phones/tablets.
      group.append(E('circle',{r:Math.max(30,size+12),'class':'approved-hit','aria-hidden':'true'}));

      const text=E('text',{y:size+10,'class':`approved-label${kind==='ai-builds'?' approved-ai-label':''}`});
      labelLines(name).forEach((line,j)=>{
        const t=E('tspan',{x:0,dy:j===0?0:(kind==='ai-builds'?12:15)});
        t.textContent=line;text.append(t);
      });
      group.append(text);

      const activate=()=>{
        if(destination.startsWith('#')){
          const target=document.querySelector(destination);
          if(target){
            history.replaceState(null,'',destination);
            target.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});
            return;
          }
        }
        location.assign(destination);
      };
      group.addEventListener('click',activate);
      group.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}
      });

      // Keep semantic link as a fallback, but move it off the painted layer.
      link.setAttribute('aria-hidden','true');
      link.setAttribute('tabindex','-1');
      link.style.display='none';

      backLayer.append(group);
      return {
        link,group,name,destination,ringInfo,ring,size,
        phase:-Math.PI/2+(Math.PI*2*ringInfo.index/ringInfo.total)+ringInfo.offset
      };
    });

    let raf=0,last=performance.now(),elapsed=0,visible=true;

    function draw(){
      const positioned=planets.map((p,index)=>{
        const direction=kind==='ai-builds'&&p.ringInfo.ring===1?-1:1;
        const a=p.phase+elapsed*cfg.speed*direction;
        const x=cfg.cx+Math.cos(a)*p.ring.rx;
        const y=cfg.cy+Math.sin(a)*p.ring.ry;
        const depth=Math.sin(a);
        const selected=p.group.matches(':hover,:focus-visible');
        const scale=.90+(depth+1)*.08+(selected?.06:0);
        return {...p,index,x,y,depth,scale};
      });

      // Same-ring planets keep equal angular spacing forever. Ring offsets are fixed,
      // so different rings also maintain stable clearance instead of drifting into collisions.
      const behind=positioned.filter(p=>p.depth<0).sort((a,b)=>a.y-b.y);
      const ahead=positioned.filter(p=>p.depth>=0).sort((a,b)=>a.y-b.y);

      behind.forEach(p=>{
        p.group.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) scale(${p.scale.toFixed(3)})`);
        p.group.style.opacity=String(.72+(p.depth+1)*.16);
        backLayer.append(p.group);
      });
      ahead.forEach(p=>{
        p.group.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) scale(${p.scale.toFixed(3)})`);
        p.group.style.opacity='1';
        frontLayer.append(p.group);
      });
    }

    function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
    function frame(now){
      raf=0;
      const dt=Math.min(40,now-last);last=now;
      if(!paused())elapsed+=dt/1000;
      draw();
      if(visible&&!document.hidden&&!paused())raf=requestAnimationFrame(frame);
    }
    function start(){
      if(raf||!visible||document.hidden||paused())return;
      last=performance.now();
      raf=requestAnimationFrame(frame);
    }

    draw();start();

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

  function run(){qa('.solar-orbits,.solar-capabilities').forEach(n=>n.remove());qa('.solar-navigation[data-solar]').forEach(init);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();