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

export const ARENA_THEME_LIGHTS=Object.freeze({
  classic:Object.freeze({keyColor:0xffddb0,rimColor:0x9bdcff,floorGlow:0x42657d,key:2.05,rim:1.20}),
  arcane:Object.freeze({keyColor:0xd8b4fe,rimColor:0x67e8f9,floorGlow:0x7c3aed,key:2.18,rim:1.34}),
  monsters:Object.freeze({keyColor:0xd9f99d,rimColor:0xf59e0b,floorGlow:0x365314,key:2.10,rim:1.22}),
  brick:Object.freeze({keyColor:0xffb86b,rimColor:0x60a5fa,floorGlow:0xb45309,key:2.14,rim:1.18}),
  cosmic:Object.freeze({keyColor:0x67e8f9,rimColor:0xc084fc,floorGlow:0x0ea5e9,key:2.22,rim:1.38})
});

const ROLE_LIGHT_WEIGHT=Object.freeze({p:.86,n:1,b:1.03,r:1.18,q:1.14,k:1.20});
const KIND_LIGHT_WEIGHT=Object.freeze({melee:1,body:1.02,'teleport-melee':1.05,projectile:.94,beam:1.08,area:1.12});
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

export function duelArenaLightingProfile(theme='classic',role='p',kind='melee'){
  const base=ARENA_THEME_LIGHTS[theme]||ARENA_THEME_LIGHTS.classic;
  const roleWeight=ROLE_LIGHT_WEIGHT[role]||ROLE_LIGHT_WEIGHT.p;
  const kindWeight=KIND_LIGHT_WEIGHT[kind]||1;
  return Object.freeze({
    keyColor:base.keyColor,
    rimColor:base.rimColor,
    floorGlow:base.floorGlow,
    keyBase:base.key*roleWeight*kindWeight,
    rimBase:base.rim*(.92+roleWeight*.08)*kindWeight,
    keyPosition:Object.freeze([-2.45,3.15,2.55]),
    rimPosition:Object.freeze([2.75,2.55,-2.85])
  });
}

export function duelArenaLightingCue({time=0,pose,contactAge=-1,theme='classic',role='p',kind='melee'}={}){
  const profile=duelArenaLightingProfile(theme,role,kind);
  const state=pose?.state||'engage';
  const drive=clamp01(pose?.attack||0);
  const follow=clamp01(pose?.follow||0);
  const anticipation=(state==='anticipate') ? .09+.09*(.5+.5*Math.sin(Math.max(0,time)*8.5)) : 0;
  const commit=state==='commit'?drive:drive*.35;
  const followGlow=state==='follow-through'?follow:follow*.25;
  const impact=contactAge>=0?Math.max(0,1-Math.max(0,contactAge)/.62):0;
  const settle=(state==='recover'||state==='complete') ? .92 : 1;
  return {
    ...profile,
    keyIntensity:profile.keyBase*(1+anticipation+commit*.38+followGlow*.10+impact*.72)*settle,
    rimIntensity:profile.rimBase*(1+anticipation*.35+commit*.20+followGlow*.16+impact*1.05)*settle,
    ringEmissive:.30+drive*.12+followGlow*.08+impact*.48,
    ringScale:1+impact*.052,
    floorEmissive:.035+drive*.012+impact*.075,
    impact
  };
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
