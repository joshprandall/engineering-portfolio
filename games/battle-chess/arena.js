import {SETS,attackVariant,debrisStep} from './sets.js';
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { squarePosition, captureSquare, rookMotion } from './game.js';
const ease=t=>t*t*(3-2*t);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const materials = (color,metalness=.35,roughness=.45) => new THREE.MeshStandardMaterial({color,metalness,roughness});
function mesh(parent,geometry,material,x=0,y=0,z=0) {const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
const box=(p,m,x,y,z,w,h,d)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
const orb=(p,m,x,y,z,r)=>mesh(p,new THREE.SphereGeometry(r,12,8),m,x,y,z);
const cyl=(p,m,x,y,z,rt,rb,h,n=12)=>mesh(p,new THREE.CylinderGeometry(rt,rb,h,n),m,x,y,z);
function disposeTree(root){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m));});gs.forEach(g=>g.dispose());ms.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}

function warrior(type,color) {
 const root=new THREE.Group(), body=new THREE.Group();root.add(body);
 const ivory=color==='w', armor=materials(ivory?0xe2d8ba:0x323b4a,.6,.32), trim=materials(ivory?0xd0a04d:0xa34958,.7,.25), cloth=materials(ivory?0x335575:0x622b3c,.08,.8), dark=materials(0x141c26,.35,.42), steel=materials(0xb9cbd4,.8,.22), magic=new THREE.MeshStandardMaterial({color:ivory?0x70dce8:0xf17783,emissive:ivory?0x29b8df:0xcb344b,emissiveIntensity:1.3});
 const base=cyl(root,trim,0,.075,0,.49,.55,.15,24);cyl(root,dark,0,.16,0,.46,.48,.1,24);
 const legs=[];
 const scale={p:.87,n:.83,b:1.02,r:.95,q:1.02,k:1.08}[type];body.scale.setScalar(scale);
 let torsoY=1.03;
 if(type==='n') {
  // Four articulated horse legs and an armored rider.
  box(body,cloth,0,.78,0,.52,.5,.85);
  for(const x of [-.2,.2])for(const z of [-.28,.28]){const leg=new THREE.Group();leg.position.set(x,.64,z);body.add(leg);box(leg,dark,0,-.2,0,.14,.45,.17);box(leg,trim,0,-.4,.045,.18,.11,.25);legs.push(leg);}
  const neck=box(body,armor,0,1.05,.4,.31,.66,.34);neck.rotation.x=-.4;
  box(body,armor,0,1.35,.57,.34,.27,.48);box(body,dark,0,1.28,.78,.29,.18,.2);
  for(const x of [-.11,.11]){cyl(body,trim,x,1.59,.46,0,.075,.25,4);orb(body,magic,x*1.5,1.39,.67,.04);}
  const tail=box(body,dark,0,.8,-.58,.12,.6,.14);tail.rotation.x=.6;
  torsoY=1.35;
 } else if(type==='b'||type==='q') {
  cyl(body,cloth,0,.69,0,.22,.4,1.02,10);cyl(body,trim,0,.24,0,.38,.4,.09,16);
 } else {
  for(const x of [-.17,.17]){const leg=new THREE.Group();leg.position.set(x,.72,0);body.add(leg);box(leg,armor,0,-.21,0,.22,.44,.25);box(leg,dark,0,-.45,.09,.25,.14,.38);legs.push(leg);}
 }
 const chest=box(body,armor,0,torsoY,0,type==='r'?.65:.51,.54,.35);
 box(body,trim,0,torsoY-.24,.01,type==='r'?.69:.54,.1,.39);
 box(body,trim,0,torsoY+.04,.2,.11,.3,.035);
 const headY=torsoY+.48;
 orb(body,armor,0,headY,0,.235);box(body,dark,0,headY,.205,.34,.075,.07);
 for(const x of [-.09,.09])box(body,magic,x,headY,.249,.055,.025,.015);
 if(type==='p'||type==='n') {cyl(body,trim,0,headY+.14,0,.23,.25,.13,10);box(body,cloth,0,headY+.29,-.04,.085,.22,.32);}
 if(type==='b') {cyl(body,trim,0,headY+.35,0,0,.24,.58,8);orb(body,magic,0,headY+.64,0,.055);}
 if(type==='r') {box(body,armor,0,headY+.14,0,.54,.18,.48);for(const x of [-.2,0,.2])box(body,trim,x,headY+.28,0,.12,.18,.44);}
 if(type==='q'||type==='k') {cyl(body,trim,0,headY+.15,0,.245,.225,.15,10);for(let i=0;i<6;i++){const a=i*Math.PI/3;cyl(body,trim,Math.sin(a)*.21,headY+.32,Math.cos(a)*.21,0,.075,type==='k'?.28:.22,4);}orb(body,magic,0,headY+.35,0,.09);}
 const right=new THREE.Group(),left=new THREE.Group();right.position.set(.36,torsoY+.16,0);left.position.set(-.36,torsoY+.16,0);body.add(right,left);
 for(const arm of [right,left]) {orb(arm,trim,0,0,0,type==='r'?.21:.17);box(arm,armor,0,-.22,0,.17,.42,.2);orb(arm,dark,0,-.43,.02,.13);}
 if(type==='b'||type==='q') {
  cyl(right,trim,0,-.1,.11,.04,.04,1.5,8);orb(right,magic,0,.68,.11,.16);const halo=mesh(right,new THREE.TorusGeometry(.22,.025,6,18),trim,0,.68,.11);halo.rotation.y=Math.PI/2;
  box(left,cloth,0,-.24,0,.25,.5,.25);
 } else if(type==='r') {
  box(right,trim,0,-.47,.08,.35,.3,.38);box(left,trim,0,-.47,.08,.35,.3,.38);
 } else {
  const length=type==='n'?1.3:type==='k'?.92:.67;
  box(right,trim,0,-.35,.07,.08,.32,.08);box(right,trim,0,-.15,.07,.34,.055,.12);
  box(right,steel,0,.03+length/2,.07,.1,length,.045);cyl(right,steel,0,.07+length,.07,0,.05,.18,4);
  const shield=box(left,trim,0,-.22,.2,.36,.48,.11);box(left,cloth,0,-.2,.27,.24,.34,.03);box(left,trim,0,-.2,.3,.045,.28,.02);
 }
 // Layered cape behind the torso.
 const cape=box(body,cloth,0,torsoY-.08,-.25,.49,.75,.055);cape.rotation.x=-.16;
 root.userData={body,right,left,legs,base,type,color,scale,restY:0};
 root.rotation.y=ivory?Math.PI:0;
 return root;
}

function themedWarrior(type,color,set){
 if(set==='royal')return warrior(type,color);
 const root=new THREE.Group(),body=new THREE.Group(),right=new THREE.Group(),left=new THREE.Group();root.add(body);body.add(right,left);right.position.set(-.38,.95,0);left.position.set(.38,.95,0);
 const palette=SETS[set],main=materials(palette.colors[color==='w'?0:1],set==='clockwork'?.8:.25,.45),trim=materials(color==='w'?0xf4e6b5:0x202433),glow=new THREE.MeshStandardMaterial({color:palette.colors[color==='w'?0:1],emissive:palette.colors[color==='w'?0:1],emissiveIntensity:1});
 const base=cyl(root,trim,0,.08,0,.48,.53,.16,24);const legs=[];
 for(const x of [-.16,.16]){const leg=new THREE.Group();leg.position.set(x,.45,0);body.add(leg);box(leg,main,0,-.1,0,.22,.4,.25);legs.push(leg);}
 box(body,main,0,.78,0,type==='r'?.8:.52,.6,.38);box(right,main,0,-.2,0,.22,.5,.24);box(left,main,0,-.2,0,.22,.5,.24);
 if(set==='brick'){
  box(body,main,0,1.25,0,.44,.42,.42);for(const x of [-.12,.12])for(const z of [-.12,.12])cyl(body,trim,x,1.49,z,.06,.06,.08,8);
  for(const x of [-.11,.11])box(body,trim,x,1.28,.22,.05,.06,.02);
 }else{orb(body,main,0,1.27,0,.25);for(const x of [-.1,.1])orb(body,glow,x,1.3,.22,.055);}
 if(set==='monster'||(set==='space'&&color==='b')){
  for(const x of [-.22,.22]){const horn=cyl(body,trim,x,1.56,0,0,.13,.5,6);horn.rotation.z=-x*1.5;for(let i=0;i<3;i++)cyl(x<0?right:left,trim,(i-1)*.08,-.51,.14,0,.04,.24,5);}
  const tail=mesh(body,new THREE.TorusGeometry(.4,.075,6,12,Math.PI),main,0,.55,-.4);tail.rotation.x=1.1;
 }else if(set==='arcane'){
  cyl(body,main,0,.6,0,.22,.5,.95,12);cyl(body,trim,0,1.67,0,0,.33,.65,12);cyl(right,trim,0,-.05,.1,.035,.035,1.5,8);orb(right,glow,0,.73,.1,.17);
 }else if(set==='clockwork'){
  for(const x of [-.3,.3]){const gear=mesh(body,new THREE.TorusGeometry(.22,.065,4,12),trim,x,.88,0);gear.rotation.y=Math.PI/2;}
  cyl(body,trim,.16,1.61,0,.08,.08,.45,8);box(body,glow,0,.85,.21,.25,.17,.035);
 }else if(set==='ocean'){
  for(let i=0;i<5;i++){const fin=cyl(body,trim,(i-2)*.1,1.52,-.08,0,.085,.45,5);fin.rotation.z=(i-2)*.3;}
  for(let i=0;i<4;i++){const tentacle=mesh(body,new THREE.TorusGeometry(.28,.06,6,12,Math.PI),main,(i-1.5)*.2,.35,-.15);tentacle.rotation.y=i;}
 }else if(set==='space'){box(body,trim,0,1.3,.19,.43,.14,.15);box(right,trim,0,-.25,.3,.19,.24,.55);orb(right,glow,0,-.25,.6,.09);}
 if(type==='n'){box(body,main,0,.52,.3,.55,.42,1.1);cyl(body,trim,0,.88,.7,0,.2,.55,6);body.scale.setScalar(.9);}
 if(type==='b'){cyl(left,trim,0,.03,.1,.04,.04,1.3,8);orb(left,glow,0,.72,.1,.15);}
 if(type==='r'){body.scale.set(1.15,1.05,1.1);for(const x of [-.25,0,.25])box(body,trim,x,1.65,0,.13,.2,.35);}
 if(type==='q'||type==='k'){for(let i=0;i<5;i++)cyl(body,trim,Math.cos(i*Math.PI*.4)*.22,1.65,Math.sin(i*Math.PI*.4)*.22,0,.06,type==='k'?.4:.25,5);body.scale.setScalar(1.12);}
 if(type==='p')body.scale.setScalar(.82);
 root.userData={body,right,left,legs,base,type,color,scale:1,restY:0,set};root.rotation.y=color==='w'?Math.PI:0;return root;
}

export class Arena {
 constructor(container,onSelect) {
  this.sets={w:'brick',b:'monster'};this.speed='cinematic';this.darkEffects=false;this.turnCount=0;this.debris=[];this.container=container;this.onSelect=onSelect;this.pieces=new Map();this.tiles=[];this.markers=[];this.effects=[];this.reduced=false;this.busy=false;this.animation=null;this.flipped=false;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x111720);this.scene.fog=new THREE.FogExp2(0x111720,.025);
  this.camera=new THREE.PerspectiveCamera(39,1,.1,100);this.camera.position.set(10.3,14.8,15.7);
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=window.innerWidth>700;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
  container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','3D chessboard. Use the tactical board for keyboard play.');
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.enablePan=false;this.controls.target.set(0,.3,0);this.controls.minDistance=10;this.controls.maxDistance=33;this.controls.minPolarAngle=.12;this.controls.maxPolarAngle=1.24;
  this.scene.add(new THREE.HemisphereLight(0xcadcf5,0x302624,2.1));
  const key=new THREE.DirectionalLight(0xffe0aa,3.8);key.position.set(-7,14,6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-10;key.shadow.camera.right=10;key.shadow.camera.top=10;key.shadow.camera.bottom=-10;key.shadow.normalBias=.035;this.scene.add(key);
  const rim=new THREE.DirectionalLight(0x809fff,2);rim.position.set(3,6,-10);this.scene.add(rim);
  this.buildBoard();
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();let start=null;
  this.renderer.domElement.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY,id:e.pointerId};});
  this.renderer.domElement.addEventListener('pointerup',e=>{if(!start||start.id!==e.pointerId||Math.hypot(e.clientX-start.x,e.clientY-start.y)>7||this.busy){start=null;return;}start=null;const r=container.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hits=this.ray.intersectObjects([...this.tiles,...this.pieces.values()],true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.square)o=o.parent;if(o)this.onSelect(o.userData.square);}});
  this.renderer.domElement.addEventListener('pointercancel',()=>{start=null;});
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.querySelector('#webgl-error').hidden=false;document.querySelector('#tactical').open=true;});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick);
 }
 buildBoard(){
  const stone=materials(0x252e39,.25,.6),gold=materials(0xb18a4e,.72,.3),edge=materials(0x111822,.3,.55);
  const floor=mesh(this.scene,new THREE.PlaneGeometry(100,100),materials(0x101620,.1,.9),0,-.6,0);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
  const plinth=cyl(this.scene,stone,0,-.38,0,9.7,10,.32,64);cyl(this.scene,gold,0,-.19,0,9.65,9.7,.07,64);cyl(this.scene,edge,0,-.12,0,9.55,9.65,.1,64);
  box(this.scene,gold,0,.03,0,12.8,.3,12.8);box(this.scene,edge,0,.17,0,12.56,.17,12.56);
  for(let rank=1;rank<=8;rank++)for(let file=0;file<8;file++){
   const square=String.fromCharCode(97+file)+rank,{x,z}=squarePosition(square);const m=materials((rank+file)%2===1?0x3b4a57:0xc5b995,.28,.55);
   const tile=box(this.scene,m,x,.29,z,1.485,.13,1.485);tile.userData.square=square;this.tiles.push(tile);
  }
  // Coordinate textures are functional board labels.
  for(let i=0;i<8;i++){this.label(String.fromCharCode(97+i),(i-3.5)*1.5,6.2);this.label(String(i+1),-6.2,(3.5-i)*1.5);}
  for(const x of [-7.2,7.2])for(const z of [-7.2,7.2]){cyl(this.scene,stone,x,.35,z,.24,.36,1,8);cyl(this.scene,gold,x,.88,z,.31,.24,.14,12);const glow=new THREE.MeshStandardMaterial({color:z>0?0xffc875:0xe98080,emissive:z>0?0xffac44:0xcc3654,emissiveIntensity:2});orb(this.scene,glow,x,1.07,z,.18);const light=new THREE.PointLight(z>0?0xffbc65:0xdf6689,8,5);light.position.set(x,1.2,z);this.scene.add(light);}
 }
 label(text,x,z){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#e9ce94';c.font='64px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(text,64,64);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});const o=mesh(this.scene,new THREE.PlaneGeometry(.43,.43),m,x,.27,z);o.rotation.x=-Math.PI/2;}
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.zoom=Math.min(1,(w/h)/1.05);this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);}
 populate(pieces){for(const p of this.pieces.values()){this.scene.remove(p);disposeTree(p);}this.pieces.clear();for(const p of pieces){const actor=themedWarrior(p.type,p.color,this.sets[p.color]),pos=squarePosition(p.square);actor.position.set(pos.x,.36,pos.z);actor.userData.square=p.square;this.scene.add(actor);this.pieces.set(p.square,actor);}this.highlight(null,[]);}
 highlight(selected,moves,lastMove=null){for(const m of this.markers){this.scene.remove(m);disposeTree(m);}this.markers=[];const put=(square,color,ring)=>{const pos=squarePosition(square);const g=ring?new THREE.RingGeometry(.47,.55,32):new THREE.CircleGeometry(.16,24);const o=mesh(this.scene,g,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.86,depthWrite:false}),pos.x,.375,pos.z);o.rotation.x=-Math.PI/2;this.markers.push(o);};if(lastMove){put(lastMove.from,0x8798b3,true);put(lastMove.to,0x8798b3,true);}if(selected)put(selected,0xffcb65,true);for(const move of moves)put(move.to,move.captured?0xf2787f:0x6be3c7,!!move.captured);}
 flip(){this.flipped=!this.flipped;this.resetCamera();}
 resetCamera(){this.camera.position.set(this.flipped?-10.3:10.3,14.8,this.flipped?-15.7:15.7);this.controls.target.set(0,.3,0);this.controls.update();}
 zoom(direction){const delta=this.camera.position.clone().sub(this.controls.target);delta.multiplyScalar(direction>0?.88:1.12);delta.clampLength(10,33);this.camera.position.copy(this.controls.target).add(delta);this.controls.update();}
 setArmy(color,set){if(SETS[set])this.sets[color]=set;}
 skip(){if(this.animation)this.animation.start=performance.now()-this.animation.duration;}
 burst(victim){
  victim.updateMatrixWorld(true);let count=0;victim.traverse(o=>{if(!o.isMesh||count++>90)return;const bit=new THREE.Mesh(o.geometry.clone(),o.material.clone());o.matrixWorld.decompose(bit.position,bit.quaternion,bit.scale);bit.material.transparent=true;const start=bit.position.clone(),scale=bit.scale.clone();this.scene.add(bit);const i=count;this.debris.push({bit,start,scale,born:performance.now(),velocity:{x:Math.sin(i*2.4)*1.3,y:1.4+(i%4)*.3,z:Math.cos(i*2.4)*1.3}});});victim.visible=false;
 }
 setReduced(value){this.reduced=value;this.controls.enableDamping=!value;}
 impact(position,color,spell=false){
  const g=new THREE.Group();g.position.copy(position);g.position.y+=.8;const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:1});
  for(let i=0;i<32;i++){const o=mesh(g,new THREE.TetrahedronGeometry(spell?.065:.045),m);o.userData.velocity=new THREE.Vector3(Math.sin(i*2.4)*(.5+(i%5)*.18),.6+(i%7)*.15,Math.cos(i*2.4)*(.5+(i%5)*.18));}
  this.scene.add(g);this.effects.push({group:g,born:performance.now(),material:m});
 }
 animate(move,onHit=()=>{}){
  if(this.animation)return Promise.reject(new Error('Animation already active'));
  const actor=this.pieces.get(move.from);if(!actor)return Promise.resolve();
  const victim=move.captured?this.pieces.get(captureSquare(move)):null;
  const from=actor.position.clone(),target=squarePosition(move.to),to=new THREE.Vector3(target.x,.36,target.z);const distance=from.distanceTo(to);const heading=Math.atan2(to.x-from.x,to.z-from.z);actor.rotation.y=heading;
  const castling=rookMotion(move),rook=castling?this.pieces.get(castling.from):null,rookFrom=rook?.position.clone(),rookTo=castling?squarePosition(castling.to):null;
  this.busy=true;const duration=this.reduced||this.speed==='instant'?1:(victim?3600:Math.min(1400,650+distance*80))*(this.speed==='quick'?.4:1);this.turnCount++;
  return new Promise(resolve=>{this.animation={variant:attackVariant(move.piece,move.captured||'p',this.turnCount),actor,victim,from,to,heading,duration,start:performance.now(),hit:false,onHit,resolve,rook,rookFrom,rookTo};});
 }
 tick(now){
  this.frame=requestAnimationFrame(this.tick);if(document.hidden)return;
  const a=this.animation;
  if(a){const t=clamp((now-a.start)/a.duration),u=a.actor.userData;let progress=t;
   if(a.victim&&!this.reduced){progress=t<.36?ease(t/.36)*.7:t<.75?.7:.7+.3*ease((t-.75)/.25);}
   else progress=ease(t);
   a.actor.position.lerpVectors(a.from,a.to,progress);
   if(!this.reduced){
    const walk=a.victim?(t<.36||t>.8):true;
    u.legs.forEach((leg,i)=>{leg.rotation.x=walk?Math.sin(t*22+i*Math.PI)*.35:0;});u.body.position.y=walk?Math.abs(Math.sin(t*22))*.055:0;
    if(a.victim){const swing=Math.sin(clamp((t-.33)/.33)*Math.PI);u.right.rotation.x=-swing*(u.type==='r'?2.7:2.2);u.left.rotation.x=-swing*(u.type==='r'?2.7:u.type==='b'||u.type==='q'?1.7:.5);u.body.rotation.x=swing*(u.type==='r'?.25:.13);if(u.type==='b'||u.type==='q')u.body.position.y=swing*.18;if(u.type==='n')a.actor.position.y+=Math.sin(clamp((t-.25)/.4)*Math.PI)*.25;
     if(t>.58){const fall=clamp((t-.58)/.3);a.victim.rotation.z=fall*1.4;a.victim.position.y=.36-fall*.2;a.victim.scale.setScalar(1-fall*.85);}
    }else{u.right.rotation.x=Math.sin(t*16)*.2;u.left.rotation.x=-Math.sin(t*16)*.2;}
   }
   if(a.victim&&!this.reduced&&this.speed!=='instant'){
 const phase=clamp((t-.3)/.4),power=Math.sin(phase*Math.PI),set=this.sets[u.color];
 if(set==='monster'){a.actor.position.y+=power*.8;u.body.rotation.x=-power*.5;}
 if(set==='arcane'){u.body.position.y+=power*.65;u.body.rotation.y=power*Math.PI*(a.variant===1?2:1);}
 if(set==='space'){a.victim.position.y+=power*(a.variant===1?1.4:.3);u.right.rotation.x=-power*1.8;}
 if(set==='clockwork'){u.body.rotation.y=Math.sin(phase*12)*power*.5;}
 if(set==='ocean'){u.body.rotation.y=power*Math.PI*2;}
 if(a.variant===2)u.left.rotation.z=power*1.2;
 if(t>.22&&t<.5){a.victim.userData.right.rotation.x=-Math.sin((t-.22)/.28*Math.PI)*1.2;}
 }
 if(a.victim&&t>=.57&&!a.hit){a.hit=true;a.onHit();if(!this.reduced&&this.speed!=='instant'){this.burst(a.victim);this.impact(a.to,this.darkEffects?0xbc4155:SETS[this.sets[u.color]].colors[u.color==='w'?0:1],u.type==='b'||u.type==='q');}}
   if(a.rook){a.rook.position.x=THREE.MathUtils.lerp(a.rookFrom.x,a.rookTo.x,ease(t));a.rook.position.z=THREE.MathUtils.lerp(a.rookFrom.z,a.rookTo.z,ease(t));}
   if(t>=1){this.animation=null;this.busy=false;a.resolve();}
  }else if(!this.reduced){for(const p of this.pieces.values()){const u=p.userData;u.body.position.y=Math.sin(now*.0018+p.position.x*.7+p.position.z)*.017;}}
  for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i],age=(now-e.born)/1000;e.material.opacity=Math.max(0,1-age/1.1);for(const p of e.group.children){p.position.copy(p.userData.velocity).multiplyScalar(age*2);p.position.y-=age*age*1.5;p.rotation.x=age*4;p.rotation.z=age*3;}if(age>1.1){this.scene.remove(e.group);disposeTree(e.group);this.effects.splice(i,1);}}
  for(let i=this.debris.length-1;i>=0;i--){const d=this.debris[i],t=(now-d.born)/1000,pos=debrisStep(d.start,d.velocity,t);d.bit.position.set(pos.x,pos.y,pos.z);d.bit.scale.copy(d.scale).multiplyScalar(pos.scale);d.bit.rotation.x+=.03;d.bit.rotation.z+=.025;if(t>=2.5){this.scene.remove(d.bit);disposeTree(d.bit);this.debris.splice(i,1);}}
  this.controls.update();this.renderer.render(this.scene,this.camera);
 }
}
