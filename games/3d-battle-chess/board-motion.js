const ROLE_MOTION=Object.freeze({
  p:Object.freeze({duration:360,lift:.055,curve:.025,steps:2.0,weight:.90}),
  n:Object.freeze({duration:460,lift:.24,curve:.18,steps:1.25,weight:.72}),
  b:Object.freeze({duration:420,lift:.10,curve:.055,steps:1.45,weight:.86}),
  r:Object.freeze({duration:540,lift:.028,curve:.018,steps:.80,weight:1.35}),
  q:Object.freeze({duration:400,lift:.135,curve:.09,steps:1.65,weight:.80}),
  k:Object.freeze({duration:500,lift:.048,curve:.030,steps:1.00,weight:1.22})
});

const clamp01=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp01(value);return t*t*(3-2*t);};

export function boardMotionProfile(role='p',locomotion=''){
  const base=ROLE_MOTION[role]||ROLE_MOTION.p;
  let duration=base.duration,lift=base.lift,curve=base.curve,steps=base.steps,weight=base.weight;
  const mode=String(locomotion||'').toLowerCase();
  if(/ponderous|lumbering|stomping|tracked-heavy|deliberate/.test(mode)){duration*=1.16;lift*=.55;steps*=.78;weight*=1.15;}
  if(/skitter|spring|charging|jet-assisted/.test(mode)){duration*=.84;steps*=1.30;curve*=1.18;}
  if(/float|glid|hover|zero-g/.test(mode)){duration*=.94;lift*=1.25;steps*=.42;curve*=1.20;}
  if(/stalk|tactical|fencing/.test(mode)){duration*=.92;curve*=1.12;}
  return Object.freeze({duration:Math.round(duration),lift,curve,steps,weight});
}

export function sampleBoardMotion({from,to,profile,t}){
  const k=smooth(t),dx=to.x-from.x,dz=to.y-from.y,length=Math.hypot(dx,dz)||1;
  const px=-dz/length,pz=dx/length;
  const arc=Math.sin(Math.PI*clamp01(t));
  const gait=Math.sin(Math.PI*2*profile.steps*clamp01(t))*arc;
  return {
    x:from.x-3.5+dx*k+px*profile.curve*arc,
    y:profile.lift*arc+Math.abs(gait)*.012/Math.max(.65,profile.weight),
    z:from.y-3.5+dz*k+pz*profile.curve*arc,
    gait,
    progress:k
  };
}

export function applyBoardPresence(group,{time=0,selected=null,turn='w',reducedMotion=false}={}){
  if(!group?.children)return 0;
  let count=0;
  for(const piece of group.children){
    const data=piece?.userData;
    if(!data?.piece)continue;
    const base=data.boardPresenceBase||(data.boardPresenceBase={
      y:piece.position.y,
      scale:piece.scale.x,
      rotationY:piece.rotation?.y||0
    });
    const chosen=!!selected&&selected.x===data.x&&selected.y===data.y;
    const active=data.side===turn;
    const bob=reducedMotion?0:Math.sin(time*1.7+(data.x||0)*.71+(data.y||0)*.43)*(.004+(active?.003:0));
    piece.position.y=base.y+bob+(chosen?.035:0);
    if(piece.scale?.setScalar)piece.scale.setScalar(base.scale*(1+(chosen?.025:0)));
    if(piece.rotation)piece.rotation.y=base.rotationY+(reducedMotion?0:Math.sin(time*.7+(data.x||0))*(chosen?.028:.008));
    count++;
  }
  return count;
}

export function animateBoardMove({
  root,from,to,role='p',locomotion='',reducedMotion=false,
  clock=()=>globalThis.performance?.now?.()??Date.now(),
  requestFrame=globalThis.requestAnimationFrame?.bind(globalThis)||
    (callback=>setTimeout(()=>callback(clock()),16))
}={}){
  if(!root?.position||!from||!to)return Promise.resolve({animated:false,reason:'missing-target'});
  const profile=boardMotionProfile(role,locomotion);
  const baseY=root.position.y;
  const baseRotation=root.rotation?.y||0;
  const dx=to.x-from.x,dz=to.y-from.y;
  const facing=Math.atan2(dx,dz);

  if(reducedMotion){
    root.position.x=to.x-3.5;root.position.y=baseY;root.position.z=to.y-3.5;
    return Promise.resolve({animated:false,reducedMotion:true,profile});
  }

  const started=clock();
  return new Promise(resolve=>{
    const frame=now=>{
      const raw=(now-started)/Math.max(1,profile.duration),t=clamp01(raw);
      const sample=sampleBoardMotion({from,to,profile,t});
      root.position.x=sample.x;root.position.y=baseY+sample.y;root.position.z=sample.z;
      if(root.rotation)root.rotation.y=baseRotation+(facing-baseRotation)*Math.sin(Math.PI*t)*.72;
      if(typeof root.dispatchEvent==='function')root.dispatchEvent({type:'crown-ash-board-motion',progress:sample.progress});
      if(t<1){requestFrame(frame);return;}
      root.position.x=to.x-3.5;root.position.y=baseY;root.position.z=to.y-3.5;
      if(root.rotation)root.rotation.y=baseRotation;
      resolve({animated:true,profile});
    };
    requestFrame(frame);
  });
}
