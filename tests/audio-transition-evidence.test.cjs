'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildAudioTransitionEvidence}=require('./audio-transition-evidence.cjs');
const wrap=beach=>({beach:{scene:'birds-water',key:'beach'},silenced:{pending:'forest-waterfall',beach},waterfall:{scene:'forest-waterfall'}});
test('diagnostic uses the original slice-one output indices, not a guessed beach-only subset',()=>{
 const data=wrap(Array.from({length:4},()=>({paused:true,muted:true,level:0})));
 const report=buildAudioTransitionEvidence(data);
 assert.deepEqual(report.inspectedOutputIndices,[1,2,3,4]);assert.deepEqual(report.violations,[]);
 assert.deepEqual(report.transitions,data);
});
test('each original strict predicate failure is retained, including a silent but nonzero level',()=>{
 const report=buildAudioTransitionEvidence(wrap([{paused:false,muted:true,level:0},{paused:true,muted:false,level:0},{paused:true,muted:true,level:.000001}]));
 assert.deepEqual(report.violations.map(v=>v.reasons),[['not-paused'],['not-muted'],['level-not-exactly-zero']]);
 assert.equal(report.violations[2].observed.level,.000001);
});
test('diagnostics cannot mutate the captured transition or alias it',()=>{
 const data=wrap([{paused:true,muted:true,level:.2}]),before=JSON.stringify(data);
 Object.freeze(data.silenced.beach[0]);Object.freeze(data.silenced.beach);Object.freeze(data.silenced);Object.freeze(data);
 const report=buildAudioTransitionEvidence(data);report.transitions.beach.scene='changed';
 assert.equal(JSON.stringify(data),before);assert.notEqual(report.transitions,data);
});
test('missing level remains a failure rather than being coerced to zero',()=>{
 const report=buildAudioTransitionEvidence(wrap([{paused:true,muted:true}]));
 assert.deepEqual(report.violations[0].reasons,['level-not-exactly-zero']);
});
