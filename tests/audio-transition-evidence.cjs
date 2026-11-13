'use strict';
// Diagnostic only: preserve the exact existing strict browser predicate.
// No media methods, writes, retries, filtering or success overrides.
function buildAudioTransitionEvidence(transitions) {
 const snapshot=JSON.parse(JSON.stringify(transitions));
 const inspected=snapshot.silenced.beach;
 return {schemaVersion:1,transitions:snapshot,
  inspectedOutputIndices:inspected.map((_,i)=>i+1),
  violations:inspected.flatMap((p,i)=>{
   const reasons=[];
   if(!p.paused)reasons.push('not-paused');
   if(!p.muted)reasons.push('not-muted');
   if(p.level!==0)reasons.push('level-not-exactly-zero');
   return reasons.length?[{outputIndex:i+1,reasons,observed:p}]:[];
  })};
}
module.exports={buildAudioTransitionEvidence};
