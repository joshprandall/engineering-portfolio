const P={
 p:{fallAxis:'z',fall:.62,twist:.20,stagger:1.10,knee:.18,weapon:.20},
 n:{fallAxis:'x',fall:.48,twist:.42,stagger:.82,knee:.10,weapon:.42},
 b:{fallAxis:'z',fall:.55,twist:.26,stagger:.92,knee:.22,weapon:.30},
 r:{fallAxis:'x',fall:.34,twist:.15,stagger:.55,knee:.30,weapon:.16},
 q:{fallAxis:'z',fall:.52,twist:.52,stagger:.88,knee:.14,weapon:.58},
 k:{fallAxis:'x',fall:.40,twist:.24,stagger:.68,knee:.38,weapon:.26}
};
const THEME={
 classic:{collapse:1,spin:.8,head:1},
 arcane:{collapse:.8,spin:1.25,head:.72},
 monsters:{collapse:1.15,spin:1.0,head:1.20},
 brick:{collapse:.9,spin:1.5,head:.82},
 cosmic:{collapse:.75,spin:.65,head:.64}
};

function defeatMode(id=''){
 if(/kneel/.test(id))return {fall:.52,crouch:.42,turn:.62,roll:.45,weapon:.60,knee:1.35};
 if(/dissolve|systems-fail|shutdown|energy-collapse|void-collapse/.test(id))return {fall:.48,crouch:.22,turn:.82,roll:.52,weapon:1.15,knee:.72};
 if(/burst|break|shatter/.test(id))return {fall:.88,crouch:.26,turn:1.32,roll:1.25,weapon:1.30,knee:.85};
 if(/roll|tumble|sprawl|crash/.test(id))return {fall:1.18,crouch:.18,turn:1.48,roll:1.52,weapon:.92,knee:.62};
 if(/collapse|wilt/.test(id))return {fall:.84,crouch:.36,turn:.78,roll:.82,weapon:.76,knee:1.08};
 if(/topple|fall/.test(id))return {fall:1.05,crouch:.24,turn:1.08,roll:1.16,weapon:.86,knee:.78};
 return {fall:.92,crouch:.26,turn:1,roll:1,weapon:1,knee:1};
}

export function defeatPose(definition,reaction,elapsed=0){
 if(!reaction)return {lean:0,turn:0,head:0,crouch:0,fall:0};
 const p=P[definition.role]||P.p,t=THEME[definition.theme]||THEME.classic,m=defeatMode(definition.defeat);
 const s=Math.min(1,(reaction.stagger||0)*(.75+elapsed*.65)),fallen=reaction.fall?1:.45;
 const axis=p.fallAxis==='x'?1:-1,queen=definition.role==='q'?-1:1;
 return {
  lean:p.fall*t.collapse*m.fall*s*fallen,
  turn:p.twist*t.spin*m.turn*s*queen,
  head:.28*t.head*s,
  crouch:(reaction.fall?m.crouch:.10)*s,
  fall:reaction.fall?s*m.fall:0,
  torsoRoll:axis*(p.fall*m.roll*s),
  weaponRoll:axis*p.weapon*m.weapon*s,
  leftLegX:p.knee*m.knee*s*(reaction.fall?.75:.35),
  rightLegX:-p.knee*m.knee*s,
  leftKnee:p.knee*m.knee*s*.80,
  rightKnee:p.knee*m.knee*s,
  defeatStyle:definition.defeat
 };
}

export function defeatFingerprint(definition){
 const pose=defeatPose(definition,{fall:true,stagger:1.05},.72);
 const keys=['lean','turn','head','crouch','fall','torsoRoll','weaponRoll','leftLegX','rightLegX','leftKnee','rightKnee'];
 return JSON.stringify(keys.map(key=>Number((pose[key]||0).toFixed(3))));
}
