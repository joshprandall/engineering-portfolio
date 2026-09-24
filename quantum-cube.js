/* A geometric Bell-state illustration and ideal joint-measurement sampler. */
(() => {
  'use strict';
  const canvas = document.getElementById('quantum-cube');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pause = document.getElementById('cube-pause');
  const basis = document.getElementById('bell-basis');
  const result = document.getElementById('bell-result');
  const bars = [...document.querySelectorAll('.bell-bars > div')];
  let width = 0, height = 0, time = 0, last = 0, paused = reduced.matches, visible = true, raf = 0;
  const vertices = Array.from({length:8}, (_,i) => [i&1?1:-1, i&2?1:-1, i&4?1:-1]);
  const edges = [];
  for (let i=0;i<8;i++) for (let j=i+1;j<8;j++) if ([1,2,4].includes(i^j)) edges.push([i,j]);

  function project(v, angle, cx, cy, size) {
    const a = angle, b = .38 + Math.sin(angle * .6) * .17;
    const x = v[0]*Math.cos(a)-v[2]*Math.sin(a), z = v[0]*Math.sin(a)+v[2]*Math.cos(a);
    const y = v[1]*Math.cos(b)-z*Math.sin(b), depth=v[1]*Math.sin(b)+z*Math.cos(b);
    const p=4.7/(4.7+depth);
    return [cx+x*size*p,cy+y*size*p,depth];
  }
  function cube(cx,cy,size,angle,color) {
    const points=vertices.map(v=>project(v,angle,cx,cy,size));
    ctx.strokeStyle=color;ctx.lineWidth=1.15;
    for (const [a,b] of edges) {
      const depth=(points[a][2]+points[b][2])/2;
      ctx.globalAlpha=.4+(2-depth)*.13;
      ctx.shadowBlur=depth<0?9:2;ctx.shadowColor=color;
      ctx.beginPath();ctx.moveTo(points[a][0],points[a][1]);ctx.lineTo(points[b][0],points[b][1]);ctx.stroke();
    }
    ctx.globalAlpha=1;ctx.shadowBlur=7;ctx.fillStyle='#e4fbff';
    for (const p of points) {ctx.beginPath();ctx.arc(p[0],p[1],1.7,0,Math.PI*2);ctx.fill();}
    ctx.shadowBlur=0;
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,size*.7);
    g.addColorStop(0,'#d7fcffb0');g.addColorStop(.1,color+'90');g.addColorStop(1,color+'00');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,size*.7,0,Math.PI*2);ctx.fill();
  }
  function draw() {
    if(!width||!height)return;
    const w=width,h=height,cx=w/2,cy=h*.46;
    ctx.clearRect(0,0,w,h);
    const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,w*.6);
    bg.addColorStop(0,'#122d3a');bg.addColorStop(1,'#040d16');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    ctx.lineWidth=.5;ctx.strokeStyle='#50728224';
    for(let i=-7;i<=7;i++){ctx.beginPath();ctx.moveTo(cx+i*w*.024,h*.63);ctx.lineTo(cx+i*w*.17,h);ctx.stroke();}
    for(let i=0;i<6;i++){const y=h*.65+(h*.35)*(i/5)**1.7;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    for(let i=0;i<48;i++){const x=((i*137+41)%997)/997*w,y=((i*191+67)%991)/991*h*.72;ctx.fillStyle=`rgba(150,205,220,${.16+(i%4)*.08})`;ctx.fillRect(x,y,1,1);}
    const ax=w*.25,bx=w*.75,s=Math.min(38,w*.083);
    // Shared-state ribbon: conceptual artwork, not a propagating physical signal.
    for(let n=0;n<2;n++){
      ctx.beginPath();ctx.lineWidth=1;ctx.strokeStyle=n?'#eab68765':'#78ddec95';
      for(let i=0;i<=100;i++){const u=i/100,x=ax+(bx-ax)*u,y=cy+Math.sin(u*Math.PI*4+time*.7+n*Math.PI)*Math.sin(u*Math.PI)*h*.09;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
      ctx.stroke();
    }
    cube(ax,cy,s,time*.26,'#86e0ed');cube(bx,cy,s,-time*.26+.7,'#edbc91');
    cube(cx,cy,s*.46,time*.18+.3,'#a7e9f0');
    ctx.fillStyle='#aec9d4';ctx.textAlign='center';ctx.font='10px system-ui,sans-serif';ctx.fillText('QUBIT A',ax,cy+s*2.1);ctx.fillText('QUBIT B',bx,cy+s*2.1);
    ctx.fillStyle='#79b2c1';ctx.font='9px system-ui,sans-serif';ctx.fillText('ONE JOINT QUANTUM STATE',cx,h*.9);
  }
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);width=r.width;height=r.height;canvas.width=Math.max(2,Math.round(width*d));canvas.height=Math.max(2,Math.round(height*d));ctx.setTransform(d,0,0,d,0,0);draw();}
  function tick(now){raf=0;const dt=Math.min((now-last)/1000||.016,.04);last=now;if(!paused&&!reduced.matches&&document.body.dataset.motion!=='paused')time+=dt;draw();schedule();}
  function schedule(){if(!raf&&visible&&!document.hidden&&!paused&&!reduced.matches&&document.body.dataset.motion!=='paused'){last=performance.now();raf=requestAnimationFrame(tick);}}
  function pauseLabel(){pause.textContent=paused?'Resume cubes':'Pause cubes';pause.setAttribute('aria-pressed',String(paused));}
  pause.addEventListener('click',()=>{paused=!paused;pauseLabel();draw();schedule();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;pauseLabel();draw();schedule();});
  document.addEventListener('portfolio:motion',()=>{draw();schedule();});
  document.addEventListener('visibilitychange',schedule);
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();},{rootMargin:'120px'}).observe(canvas);

  const ideal=()=>basis.value==='YY'?[0,.5,.5,0]:basis.value==='ZX'?[.25,.25,.25,.25]:[.5,0,0,.5];
  function show(values,sampled=false){values.forEach((p,i)=>{bars[i].querySelector('i').style.setProperty('--p',`${p*100}%`);bars[i].querySelector('output').textContent=`${(p*100).toFixed(sampled?1:0)}%`;});}
  basis.addEventListener('change',()=>{show(ideal());result.textContent=basis.value==='YY'?'Ideal probabilities: 01 and 10 each occur with probability 50%.':basis.value==='ZX'?'Ideal probabilities: all four joint outcomes occur with probability 25%.':'Ideal probabilities: 00 and 11 each occur with probability 50%.';});
  document.getElementById('bell-measure').addEventListener('click',()=>{
    const probabilities=ideal(),counts=[0,0,0,0];
    for(let n=0;n<1000;n++){let r=Math.random(),i=0;while(i<3&&r>=probabilities[i])r-=probabilities[i++];counts[i]++;}
    show(counts.map(n=>n/1000),true);
    result.textContent=`${basis.value[0]} / ${basis.value[1]} · 1,000 simulated pairs: 00 = ${counts[0]}, 01 = ${counts[1]}, 10 = ${counts[2]}, 11 = ${counts[3]}. Each individual result remains random.`;
  });
  pauseLabel();resize();schedule();
})();
