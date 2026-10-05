const clamp01=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp01(x);return x*x*(3-2*x);};

const ROLE_GUARDS={
 p:{guard:.88,brace:.82,crouch:.10,lean:-.10,turn:.05,head:-.06,leftX:.20,rightX:-.18,leftZ:-.16,rightZ:.12,stepBias:-.08},
 n:{guard:.46,brace:.42,crouch:.05,lean:-.16,turn:.30,head:-.04,leftX:-.08,rightX:-.32,leftZ:.18,rightZ:-.22,stepBias:-.28,torsoRoll:.12},
 b:{guard:.78,brace:.66,crouch:.06,lean:-.07,turn:-.14,head:-.10,leftX:-.20,rightX:-.16,leftZ:-.22,rightZ:.24,stepBias:-.12,weapon:.18},
 r:{guard:1.0,brace:1.0,crouch:.18,lean:-.22,turn:0,head:-.14,leftX:.12,rightX:.08,leftZ:-.08,rightZ:.08,stepBias:-.04},
 q:{guard:.62,brace:.40,crouch:.04,lean:-.12,turn:.38,head:-.03,leftX:-.12,rightX:-.38,leftZ:.25,rightZ:-.32,stepBias:-.34,torsoRoll:-.15},
 k:{guard:.92,brace:.90,crouch:.12,lean:-.12,turn:.10,head:-.10,leftX:-.18,rightX:-.22,leftZ:-.18,rightZ:.16,stepBias:-.08,weapon:.12}
};

const KIND_MODIFIERS={
 melee:{guard:.10,brace:.14,crouch:.04,turn:0},
 body:{guard:.05,brace:.22,crouch:.08,turn:0},
 'teleport-melee':{guard:.14,brace:.08,crouch:.03,turn:.16},
 projectile:{guard:.18,brace:.02,crouch:.02,turn:.10},
 beam:{guard:.24,brace:.04,crouch:.02,turn:.06},
 area:{guard:.30,brace:.10,crouch:.08,turn:0}
};

function readiness(pose={}){
 if(pose.state==='engage')return .20*smooth(pose.t||0);
 if(pose.state==='approach')return .25+.35*smooth(pose.t||0);
 if(pose.state==='anticipate')return .60+.40*smooth(pose.t||0);
 if(pose.state==='commit')return 1;
 return 0;
}

export function defensePose(definition,{attackerPose={},attackKind='melee'}={}){
 const role=definition?.role||'p',base=ROLE_GUARDS[role]||ROLE_GUARDS.p,mod=KIND_MODIFIERS[attackKind]||KIND_MODIFIERS.melee;
 const ready=readiness(attackerPose),caster=definition?.rig==='caster-biped',heavy=definition?.rig==='heavy-biped'||definition?.rig==='mech';
 const evade=(role==='n'||role==='q')&&!heavy;
 return {
  guard:(base.guard+mod.guard+(caster?.08:0))*ready,
  brace:(base.brace+mod.brace+(heavy?.12:0))*ready,
  crouch:(base.crouch+mod.crouch)*ready,
  lean:base.lean*ready,
  turn:(base.turn+mod.turn*(role==='n'||role==='q'?1:-.4))*ready,
  head:base.head*ready,
  leftX:base.leftX*ready,
  rightX:base.rightX*ready,
  leftZ:base.leftZ*ready,
  rightZ:base.rightZ*ready,
  stepBias:(base.stepBias+(evade?-.18:0))*ready,
  torsoRoll:(base.torsoRoll||0)*ready,
  weapon:(base.weapon||0)*ready,
  leftLegX:(evade?.18:heavy?.08:.05)*ready,
  rightLegX:(evade?-.24:heavy?-.08:-.05)*ready,
  leftKnee:(base.crouch*.55)*ready,
  rightKnee:(base.crouch*.72)*ready,
  defenseReadiness:ready
 };
}

export function defenseFingerprint(definition,attackKind='melee'){
 const pose=defensePose(definition,{attackKind,attackerPose:{state:'anticipate',t:.75}});
 const keys=['guard','brace','crouch','lean','turn','head','leftX','rightX','leftZ','rightZ','stepBias','torsoRoll','weapon','leftLegX','rightLegX'];
 return JSON.stringify(keys.map(key=>Number((pose[key]||0).toFixed(3))));
}
