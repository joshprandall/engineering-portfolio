const clamp01=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp01(value);return t*t*(3-2*t);};

export const CAMERA_ROLE_PROFILES=Object.freeze({
  p:Object.freeze({lane:-.28,height:0,distance:0,impact:.055}),
  n:Object.freeze({lane:.52,height:.10,distance:-.12,impact:.085}),
  b:Object.freeze({lane:-.42,height:.18,distance:.08,impact:.050}),
  r:Object.freeze({lane:.18,height:-.08,distance:-.20,impact:.120}),
  q:Object.freeze({lane:.68,height:.15,distance:-.08,impact:.075}),
  k:Object.freeze({lane:-.58,height:.08,distance:-.16,impact:.100})
});

export const CAMERA_KIND_DISTANCE=Object.freeze({
  melee:5.55,
  body:5.30,
  'teleport-melee':5.15,
  projectile:6.25,
  beam:6.45,
  area:6.65
});

const themeHeight=theme=>({classic:0,arcane:.06,monsters:-.08,brick:-.03,cosmic:.11})[theme]||0;

function phaseForPose(pose){
  const state=pose?.state||'engage',t=clamp01(pose?.t||0);
  if(state==='engage'||state==='approach')return .10+t*.12;
  if(state==='anticipate')return .22+t*.20;
  if(state==='commit')return .42+t*.58;
  if(state==='contact'||state==='follow-through')return 1;
  if(state==='recover')return 1-t*.22;
  if(state==='complete')return .78;
  return .10;
}

export function duelCameraCue({time=0,pose,contactAge=-1,role='p',kind='melee',mobile=false,theme='classic'}={}){
  const profile=CAMERA_ROLE_PROFILES[role]||CAMERA_ROLE_PROFILES.p;
  const phase=phaseForPose(pose);
  const hit=contactAge>=0?Math.exp(-Math.max(0,contactAge)*6.2):0;
  const anticipation=pose?.state==='anticipate'?Math.sin(clamp01(pose.t||0)*Math.PI):0;
  const lane=profile.lane*(.30+phase*.70);
  const baseDistance=(CAMERA_KIND_DISTANCE[kind]||5.8)+profile.distance+(mobile?.52:0);
  const trackIn=phase*.46+hit*.26-anticipation*.10;
  const baseHeight=(mobile?2.22:2.48)+profile.height+themeHeight(theme)+(kind==='area'?.15:kind==='body'?-.02:0);
  const shake=hit*profile.impact;
  const shakeX=Math.sin(time*52.0+role.charCodeAt(0)) * shake;
  const shakeY=Math.sin(time*41.0+kind.length) * shake*.55;
  const shakeZ=Math.sin(time*47.0+3.1) * shake*.65;

  return {
    position:[lane+shakeX,baseHeight+hit*.07+shakeY,baseDistance-trackIn+shakeZ],
    target:[lane*.08+shakeX*.15,1.04+hit*.05+shakeY*.12,0],
    blend:ease(time/.34),
    phase,
    impact:hit,
    shot:pose?.state==='anticipate'?'anticipation':hit>.05?'impact':pose?.state==='recover'?'recovery':'tracking'
  };
}
