(() => {
'use strict';

const topics = {
  'future-games': {
    title:'Future Games',
    summary:'Turn a game idea into a buildable release plan instead of a placeholder link.',
    objective:'Model a small vertical-slice roadmap with explicit scope, dependencies, risk, and a playable milestone.',
    steps:['Define the player action and success/failure loop.','Choose the smallest vertical slice that proves the loop.','Separate must-have systems from polish and optional content.','Attach measurable exit criteria to each milestone.','Playtest the slice before expanding scope.'],
    labels:['Scope','Risk buffer','Polish'],
    defaults:[45,30,40],
    demo:'roadmap',
    code:['const milestone = {','  loop: "move → decide → act → feedback",','  exit: ["playable", "repeatable", "measurable"],','  scope: ["input", "rules", "one level", "win/lose"]','};','','function ready(m) {','  return m.exit.every(check => verify(check));','}'].join('\n')
  },
  'engine-architecture': {
    title:'Game Engine Architecture',
    summary:'See how platform, simulation, rendering, audio, assets, and tools remain separate modules with explicit contracts.',
    objective:'Compose an engine from replaceable subsystems so one renderer, physics backend, or platform adapter can change without rewriting game logic.',
    steps:['Define subsystem interfaces before implementations.','Keep deterministic simulation state independent of presentation.','Route assets through one versioned resource boundary.','Give each subsystem init/update/shutdown lifecycle hooks.','Verify each module in isolation before integration.'],
    labels:['Module count','Test coverage','Frame budget'],
    defaults:[60,80,55],
    demo:'architecture',
    code:['class EngineModule {','  init(ctx) {}','  update(dt, ctx) {}','  shutdown() {}','}','','const engine = compose({','  platform, simulation, renderer, audio, assets','});'].join('\n')
  },
  'game-ai': {
    title:'Game AI',
    summary:'Build and inspect a steering agent rather than jumping to a generic learning-library search.',
    objective:'Implement a simple seek/arrival controller that turns an autonomous game agent toward a target while limiting acceleration and speed.',
    steps:['Represent agent position, velocity, target, and limits.','Compute desired velocity toward the target.','Convert velocity error into steering acceleration.','Clamp acceleration and maximum speed.','Integrate state every frame and measure overshoot.'],
    labels:['Max speed','Steering','Arrival radius'],
    defaults:[55,45,22],
    demo:'ai',
    code:['const desired = normalize(sub(target, agent.pos));','scale(desired, maxSpeed);','const steering = clampMag(sub(desired, agent.vel), maxAccel);','agent.vel = clampMag(add(agent.vel, scale(steering, dt)), maxSpeed);','agent.pos = add(agent.pos, scale(agent.vel, dt));'].join('\n')
  },
  'graphics-rendering': {
    title:'Graphics & Rendering',
    summary:'Explore a real projection pipeline with a rotating 3D wireframe cube rendered onto a 2D canvas.',
    objective:'Transform model-space vertices, apply perspective projection, and draw projected edges while changing field of view and camera depth.',
    steps:['Store vertices in model space.','Rotate vertices with a model transform.','Translate them relative to the camera.','Project x/y using z-dependent perspective.','Draw indexed edges and inspect distortion as FOV changes.'],
    labels:['Field of view','Rotation speed','Camera depth'],
    defaults:[52,42,58],
    demo:'graphics',
    code:['function project(p, focal) {','  const z = p.z + cameraDepth;','  return { x: cx + p.x * focal / z, y: cy - p.y * focal / z };','}','','for (const edge of edges) {','  drawLine(project(vertices[edge[0]]), project(vertices[edge[1]]));','}'].join('\n')
  },
  'physics': {
    title:'Game Physics',
    summary:'Run a small deterministic gravity-and-collision simulation directly in the browser.',
    objective:'Integrate velocity under gravity, resolve a floor collision, and control restitution and horizontal impulse.',
    steps:['Store position and velocity explicitly.','Advance velocity from acceleration using dt.','Advance position from velocity.','Detect penetration against the floor.','Correct position and reflect velocity with restitution.'],
    labels:['Gravity','Restitution','Side impulse'],
    defaults:[55,72,46],
    demo:'physics',
    code:['velocity.y += gravity * dt;','position.x += velocity.x * dt;','position.y += velocity.y * dt;','','if (position.y + radius > floor) {','  position.y = floor - radius;','  velocity.y = -Math.abs(velocity.y) * restitution;','}'].join('\n')
  },
  'animation': {
    title:'3D Animation',
    summary:'Inspect a skeletal-animation idea using a two-joint articulated rig, timing, and interpolation.',
    objective:'Drive a simple hierarchy of transforms over time and see how parent rotation changes the child joint and end effector.',
    steps:['Create a joint hierarchy with parent/child transforms.','Define key values for joint rotation.','Interpolate between key values over normalized time.','Compose parent and child transforms.','Render the pose and inspect timing, range, and easing.'],
    labels:['Shoulder range','Elbow range','Playback speed'],
    defaults:[64,72,44],
    demo:'animation',
    code:['const t = (time % duration) / duration;','const shoulder = lerp(key0.shoulder, key1.shoulder, smoothstep(t));','const elbow = lerp(key0.elbow, key1.elbow, smoothstep(t));','','const upper = rotate(shoulder);','const forearm = multiply(upper, translate(upperLen), rotate(elbow));'].join('\n')
  },
  'procedural-generation': {
    title:'Procedural Generation',
    summary:'Generate repeatable map structure from a seed and tune density and smoothing.',
    objective:'Use seeded pseudo-random values to build a reproducible grid, then apply neighborhood smoothing to produce larger connected regions.',
    steps:['Start from a deterministic seed.','Fill a grid using a density threshold.','Count neighboring filled cells.','Apply smoothing rules for several passes.','Verify identical seed/settings reproduce the same map.'],
    labels:['Seed','Fill density','Smoothing'],
    defaults:[38,48,46],
    demo:'procedural',
    code:['let state = seed >>> 0;','const rand = () => ((state = Math.imul(state ^ state >>> 15, 1 | state)) >>> 0) / 4294967296;','','grid[y][x] = rand() < density ? 1 : 0;','grid = smooth(grid, passes);'].join('\n')
  },
  'technical-art': {
    title:'Technical Art',
    summary:'Tune material response while keeping the artistic control tied to explicit rendering parameters.',
    objective:'Explore how roughness, metallic response, and light angle affect a compact material preview.',
    steps:['Separate base color from lighting response.','Choose a normalized light direction.','Compute diffuse response from the surface normal.','Add a specular term controlled by roughness.','Blend metallic response without hiding the underlying parameter values.'],
    labels:['Roughness','Metallic','Light angle'],
    defaults:[40,28,35],
    demo:'material',
    code:['const ndotl = Math.max(0, dot(normal, lightDir));','const diffuse = baseColor * ndotl;','const shininess = lerp(96, 4, roughness);','const specular = Math.pow(Math.max(0, dot(reflectDir, viewDir)), shininess);','const color = mix(diffuse + specular, metallicTint, metallic);'].join('\n')
  },
  'audio': {
    title:'Game Audio',
    summary:'Generate a local synthesized game tone and inspect frequency, modulation, and output level.',
    objective:'Build a minimal Web Audio signal path: oscillator → gain → destination, with user-triggered playback and clean teardown.',
    steps:['Create AudioContext only after a user action.','Create source and gain nodes.','Connect the graph explicitly.','Change parameters without creating duplicate owners.','Stop/disconnect nodes and release background-audio priority.'],
    labels:['Frequency','Modulation','Level'],
    defaults:[44,18,20],
    demo:'audio',
    code:['const ctx = new AudioContext();','const osc = new OscillatorNode(ctx, { frequency: 440 });','const gain = new GainNode(ctx, { gain: 0.08 });','osc.connect(gain).connect(ctx.destination);','osc.start();','','// later','osc.stop();','ctx.close();'].join('\n')
  },
  'multiplayer': {
    title:'Multiplayer',
    summary:'Visualize why networked games separate authoritative state from delayed/interpolated presentation.',
    objective:'Simulate server state, network delay, jitter, and client interpolation without pretending a browser-only demo is a production netcode stack.',
    steps:['Keep one authoritative simulation state.','Timestamp outgoing snapshots.','Delay snapshots to model network latency.','Buffer recent snapshots on the client.','Interpolate presentation behind server time to hide jitter.'],
    labels:['Latency','Jitter','Interpolation'],
    defaults:[48,28,60],
    demo:'network',
    code:['buffer.push({ serverTime, position });','const renderTime = localTime - interpolationDelay;','const [a, b] = snapshotsAround(renderTime);','const alpha = (renderTime - a.time) / (b.time - a.time);','renderPosition = lerp(a.position, b.position, alpha);'].join('\n')
  }
};

const params = new URLSearchParams(location.search);
const requested = params.get('topic') || 'graphics-rendering';
const topic = topics[requested] || topics['graphics-rendering'];
const $ = id => document.getElementById(id);
const canvas = $('tool-canvas');
const ctx = canvas.getContext('2d');
const inputs = [$('control-a'), $('control-b'), $('control-c')];
let running = true, last = performance.now(), elapsed = 0, raf = 0, audioCtx = null, oscillator = null, modOsc = null, gainNode = null;

function value(i){ return Number(inputs[i].value) / 100; }
function resize(){
  const dpr = Math.min(2, devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(320, Math.round(rect.width * dpr));
  const h = Math.max(190, Math.round(rect.width * 7 / 12 * dpr));
  if(canvas.width !== w || canvas.height !== h){ canvas.width=w; canvas.height=h; }
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {w:rect.width,h:rect.width*7/12};
}
function clear(w,h){
  ctx.clearRect(0,0,w,h);
  const grad=ctx.createLinearGradient(0,0,w,h);
  grad.addColorStop(0,'rgba(10,28,38,.94)');
  grad.addColorStop(1,'rgba(5,10,17,.86)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
}
function line(x1,y1,x2,y2,a=1){ctx.strokeStyle='rgba(140,200,209,'+a+')';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function dot(x,y,r=6,fill='rgba(244,165,117,.95)'){ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function label(text,x,y){ctx.fillStyle='rgba(242,242,233,.88)';ctx.font='12px system-ui';ctx.fillText(text,x,y);}
function drawGraphics(w,h,t){
  const fov=160+value(0)*420, speed=.25+value(1)*2.4, depth=3.2+value(2)*5;
  const verts=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  const a=t*speed, ca=Math.cos(a),sa=Math.sin(a), cb=Math.cos(a*.63),sb=Math.sin(a*.63);
  const p=verts.map(v=>{let x=v[0]*ca-v[2]*sa,z=v[0]*sa+v[2]*ca,y=v[1];const yy=y*cb-z*sb,zz=y*sb+z*cb;z=zz+depth;return [w/2+x*fov/z,h/2+yy*fov/z,z];});
  edges.forEach(e=>line(p[e[0]][0],p[e[0]][1],p[e[1]][0],p[e[1]][1],.85));p.forEach(v=>dot(v[0],v[1],3));
  label('model → transform → perspective → raster',18,24);
}
function drawPhysics(w,h,dt){
  if(!drawPhysics.s){drawPhysics.s={x:w*.25,y:40,vx:80,vy:0};}
  const s=drawPhysics.s,g=180+value(0)*900,re=.1+value(1)*.88,imp=(value(2)-.5)*320;
  if(running){s.vx += imp*dt*.18;s.vy += g*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;const floor=h-34;if(s.y+18>floor){s.y=floor-18;s.vy=-Math.abs(s.vy)*re;}if(s.x<18||s.x>w-18){s.x=Math.max(18,Math.min(w-18,s.x));s.vx*=-.9;}}
  line(0,h-34,w,h-34,.45);dot(s.x,s.y,18);label('gravity + collision + restitution',18,24);
}
function drawAnimation(w,h,t){
  const speed=.2+value(2)*2.2, phase=t*speed, sr=(.25+value(0)*1.15)*Math.sin(phase), er=(.2+value(1)*1.5)*Math.sin(phase*1.4+.8);
  const root={x:w*.48,y:h*.58},l1=Math.min(w,h)*.25,l2=l1*.78;
  const elbow={x:root.x+Math.cos(sr)*l1,y:root.y+Math.sin(sr)*l1};
  const wrist={x:elbow.x+Math.cos(sr+er)*l2,y:elbow.y+Math.sin(sr+er)*l2};
  line(root.x,root.y,elbow.x,elbow.y);line(elbow.x,elbow.y,wrist.x,wrist.y);dot(root.x,root.y,8);dot(elbow.x,elbow.y,7);dot(wrist.x,wrist.y,6);
  label('parent joint',root.x-35,root.y+30);label('child joint',elbow.x-20,elbow.y+26);label('end effector',wrist.x-32,wrist.y-14);
}
function seeded(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
function drawProcedural(w,h){
  const cols=30,rows=17,cell=Math.min(w/cols,h/rows),seed=1+Math.floor(value(0)*9999),density=.25+value(1)*.48,passes=Math.floor(value(2)*4);
  const rand=seeded(seed);let g=Array.from({length:rows},()=>Array.from({length:cols},()=>rand()<density?1:0));
  for(let p=0;p<passes;p++){const n=g.map(r=>r.slice());for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){let c=0;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if(xx||yy)c+=g[y+yy][x+xx];n[y][x]=c>=5?1:c<=2?0:g[y][x];}g=n;}
  const ox=(w-cols*cell)/2,oy=(h-rows*cell)/2;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){ctx.fillStyle=g[y][x]?'rgba(140,200,209,.82)':'rgba(244,165,117,.12)';ctx.fillRect(ox+x*cell,oy+y*cell,cell-1,cell-1);}
  label('seed '+seed+' · deterministic grid',18,24);
}
function drawAI(w,h,dt){
  if(!drawAI.s)drawAI.s={x:w*.2,y:h*.6,vx:0,vy:0,tx:w*.78,ty:h*.35};
  const s=drawAI.s,max=30+value(0)*220,steer=25+value(1)*280,arrival=12+value(2)*110;
  if(running){let dx=s.tx-s.x,dy=s.ty-s.y,d=Math.hypot(dx,dy)||1,desired=Math.min(max,max*d/arrival),dvx=dx/d*desired-s.vx,dvy=dy/d*desired-s.vy,dm=Math.hypot(dvx,dvy)||1,scale=Math.min(steer,dm)/dm;s.vx+=dvx*scale*dt;s.vy+=dvy*scale*dt;const vm=Math.hypot(s.vx,s.vy)||1;if(vm>max){s.vx=s.vx/vm*max;s.vy=s.vy/vm*max;}s.x+=s.vx*dt;s.y+=s.vy*dt;}
  dot(s.tx,s.ty,9,'rgba(140,200,209,.9)');dot(s.x,s.y,12);line(s.x,s.y,s.tx,s.ty,.25);label('click/tap canvas to move target',18,24);
}
function drawMaterial(w,h){
  const rough=value(0),metal=value(1),angle=value(2)*Math.PI*2,cx=w*.5,cy=h*.53,r=Math.min(w,h)*.27;
  const lx=cx+Math.cos(angle)*r*.55,ly=cy+Math.sin(angle)*r*.55;
  const grad=ctx.createRadialGradient(lx,ly,r*(.05+.28*rough),cx,cy,r);
  const hot=Math.round(245-70*rough),cool=Math.round(90+95*metal);
  grad.addColorStop(0,'rgb('+hot+','+Math.round(hot*.88)+','+Math.round(hot*.65)+')');grad.addColorStop(.38,'rgb('+cool+','+Math.round(cool*1.25)+','+Math.round(cool*1.35)+')');grad.addColorStop(1,'rgb(12,22,29)');
  ctx.fillStyle=grad;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();dot(lx,ly,5);label('roughness '+rough.toFixed(2)+' · metallic '+metal.toFixed(2),18,24);
}
function drawNetwork(w,h,t){
  const latency=20+value(0)*260,jitter=value(1)*120,interp=20+value(2)*220,period=3.5;
  const server=((t%period)/period)*(w-80)+40;
  const delay=(latency+Math.sin(t*4.7)*jitter*.45)/1000;
  const delayed=(((Math.max(0,t-delay))%period)/period)*(w-80)+40;
  const client=delayed-(interp/1000)*(w-80)/period;
  const y=h*.52;line(40,y,w-40,y,.25);dot(server,y-35,9,'rgba(244,165,117,.95)');dot(delayed,y,9,'rgba(140,200,209,.95)');dot(Math.max(40,client),y+35,9,'rgba(214,171,84,.95)');
  label('authoritative',server-35,y-52);label('received',delayed-25,y-16);label('interpolated',Math.max(40,client)-35,y+62);
}
function drawArchitecture(w,h){
  const names=['Platform','Simulation','Renderer','Audio','Assets','Tools'];const cols=3,bw=Math.min(170,(w-70)/3),bh=62,ox=(w-cols*bw-(cols-1)*20)/2,oy=h*.26;
  names.forEach((n,i)=>{const x=ox+(i%3)*(bw+20),y=oy+Math.floor(i/3)*(bh+38);ctx.fillStyle='rgba(140,200,209,.14)';ctx.strokeStyle='rgba(140,200,209,.65)';ctx.lineWidth=1.5;ctx.fillRect(x,y,bw,bh);ctx.strokeRect(x,y,bw,bh);ctx.fillStyle='rgba(242,242,233,.9)';ctx.font='600 13px system-ui';ctx.fillText(n,x+14,y+35);});
  line(w*.5,oy-45,w*.5,oy-4,.55);label('Game-facing interfaces',w*.5-62,oy-55);label('replaceable modules · explicit lifecycle',18,24);
}
function drawRoadmap(w,h){
  const scope=value(0),risk=value(1),polish=value(2),names=['Core loop','Vertical slice','Playtest','Content','Polish','Release'];
  const x0=45,x1=w-45,y=h*.52;line(x0,y,x1,y,.35);names.forEach((n,i)=>{const x=x0+(x1-x0)*i/(names.length-1),r=7+(i===1?scope*.08:0);dot(x,y,r,i<=2?'rgba(140,200,209,.95)':'rgba(244,165,117,.82)');label(n,x-25,y+30);});label('scope '+Math.round(scope*100)+' · buffer '+Math.round(risk*100)+' · polish '+Math.round(polish*100),18,24);
}
function drawAudio(w,h,t){
  const freq=120+value(0)*1000,mod=value(1)*18,level=value(2);
  ctx.strokeStyle='rgba(140,200,209,.9)';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<w;x++){const xx=x/w,amp=h*.18*(.25+.75*level),y=h*.5+Math.sin(xx*Math.PI*2*(2+freq/180)+Math.sin(t*mod)*.3)*amp;(x?ctx.lineTo(x,y):ctx.moveTo(x,y));}ctx.stroke();label('local oscillator preview · user-triggered audio',18,24);
  if(oscillator){oscillator.frequency.setTargetAtTime(freq,audioCtx.currentTime,.02);gainNode.gain.setTargetAtTime(level*.14,audioCtx.currentTime,.02);modOsc.frequency.setTargetAtTime(mod,audioCtx.currentTime,.02);}
}
function render(now){
  const {w,h}=resize();const dt=Math.min(.033,(now-last)/1000||.016);last=now;if(running)elapsed+=dt;clear(w,h);
  switch(topic.demo){
    case 'graphics':drawGraphics(w,h,elapsed);break;case 'physics':drawPhysics(w,h,dt);break;case 'animation':drawAnimation(w,h,elapsed);break;
    case 'procedural':drawProcedural(w,h);break;case 'ai':drawAI(w,h,dt);break;case 'material':drawMaterial(w,h);break;
    case 'network':drawNetwork(w,h,elapsed);break;case 'architecture':drawArchitecture(w,h);break;case 'roadmap':drawRoadmap(w,h);break;case 'audio':drawAudio(w,h,elapsed);break;
  }
  raf=requestAnimationFrame(render);
}
function applyTopic(){
  document.title=topic.title+' | Game Development | Joshua Randall';
  $('tool-title').textContent=topic.title;$('tool-summary').textContent=topic.summary;$('tool-objective').textContent=topic.objective;$('tool-goal').textContent=topic.objective;
  $('tool-steps').replaceChildren(...topic.steps.map(s=>{const li=document.createElement('li');li.textContent=s;return li;}));$('tool-code').textContent=topic.code;
  topic.labels.forEach((v,i)=>$('control-'+String.fromCharCode(97+i)+'-label').textContent=v);
  topic.defaults.forEach((v,i)=>inputs[i].value=String(v));
  $('demo-title').textContent=topic.title+' model';$('tool-status').textContent='Running';
}
async function startAudio(){
  if(topic.demo!=='audio'||audioCtx)return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC){$('tool-status').textContent='Web Audio unavailable';return;}
  audioCtx=new AC();oscillator=audioCtx.createOscillator();modOsc=audioCtx.createOscillator();const modGain=audioCtx.createGain();gainNode=audioCtx.createGain();
  modGain.gain.value=25;modOsc.connect(modGain).connect(oscillator.frequency);oscillator.connect(gainNode).connect(audioCtx.destination);oscillator.start();modOsc.start();
  document.dispatchEvent(new CustomEvent('portfolio:ambient-suppression',{detail:{reason:'game-tool-audio',active:true}}));
}
async function stopAudio(){if(!audioCtx)return;try{oscillator.stop();modOsc.stop();}catch{}try{await audioCtx.close();}catch{}audioCtx=oscillator=modOsc=gainNode=null;document.dispatchEvent(new CustomEvent('portfolio:ambient-suppression',{detail:{reason:'game-tool-audio',active:false}}));}
$('tool-run').addEventListener('click',async()=>{running=true;if(topic.demo==='audio')await startAudio();$('tool-status').textContent='Running';});
$('tool-reset').addEventListener('click',async()=>{topic.defaults.forEach((v,i)=>inputs[i].value=String(v));drawPhysics.s=null;drawAI.s=null;elapsed=0;await stopAudio();running=true;$('tool-status').textContent='Reset';});
inputs.forEach(i=>i.addEventListener('input',()=>{$('tool-status').textContent='Updated';}));
canvas.addEventListener('pointerdown',e=>{if(topic.demo!=='ai')return;const r=canvas.getBoundingClientRect();drawAI.s??={x:r.width*.2,y:r.height*.6,vx:0,vy:0,tx:r.width*.78,ty:r.height*.35};drawAI.s.tx=e.clientX-r.left;drawAI.s.ty=e.clientY-r.top;});
addEventListener('pagehide',()=>{cancelAnimationFrame(raf);stopAudio();});
applyTopic();raf=requestAnimationFrame(render);
})();