'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {snapshotFramePredicate,observeFrameFailure}=require('./frame-predicate-diagnostics.cjs');
test('successful gate retains result and never evaluates a snapshot',async()=>{
 const report={};assert.equal(await observeFrameFailure(async()=>17,{evaluate(){throw Error('unexpected');}},report),17);
 assert.deepEqual(report,{});
});
test('failure snapshot retains original error identity and all false conjuncts',async()=>{
 const original=new Error('original timeout'),report={},state={activeVideo:true,timelineAdvanced:false,playing:false,posterReady:false};
 await assert.rejects(observeFrameFailure(async()=>{throw original;},{evaluate:async()=>state},report),e=>e===original);
 assert.deepEqual(report.iphoneFrameCallbackFailure,state);
});
test('failed observation cannot mask gate failure',async()=>{
 const original=new Error('gate'),report={};
 await assert.rejects(observeFrameFailure(async()=>{throw original;},{evaluate:async()=>{throw Error('page closed');}},report),e=>e===original);
 assert.equal(report.iphoneFrameCallbackFailure.observationUnavailable,'page closed');
});
test('hung observation is bounded and still rejects the original gate',async()=>{
 const original=new Error('gate'),report={};
 await assert.rejects(observeFrameFailure(async()=>{throw original;},{evaluate:()=>new Promise(()=>{})},report,10),e=>e===original);
 assert.equal(report.iphoneFrameCallbackFailure.observationUnavailable,'diagnostic budget exceeded');
});
const snapshot=(v,f)=>JSON.parse(JSON.stringify(vm.runInNewContext('('+snapshotFramePredicate.toString()+')()',{
 document:{querySelector:s=>s.includes('is-active')?v:f,readyState:'complete',visibilityState:'visible'}
})));
test('absent nodes yield false predicate flags and null media data',()=>{
 const s=snapshot(null,null);for(const k of ['activeVideo','timelineAdvanced','playing','posterReady'])assert.equal(s[k],false);
 assert.equal(s.time,null);assert.equal(s.mediaErrorCode,null);
});
test('strict timeline threshold, paused state and poster are independently observed',()=>{
 const v={currentTime:.15,paused:true,readyState:2,networkState:2,error:{code:3},currentSrc:'local.mp4'};
 let s=snapshot(v,{classList:{contains:()=>false}});
 assert.equal(s.activeVideo,true);assert.equal(s.timelineAdvanced,false);assert.equal(s.playing,false);assert.equal(s.posterReady,false);assert.equal(s.mediaErrorCode,3);
 s=snapshot({...v,currentTime:.151,paused:false},{classList:{contains:()=>true}});
 for(const k of ['activeVideo','timelineAdvanced','playing','posterReady'])assert.equal(s[k],true);
});
test('integration preserves original predicate, argument and assertions',()=>{
 const s=require('node:fs').readFileSync(require('node:path').join(__dirname,'media-playback.test.cjs'),'utf8');
 assert.ok(s.includes("await observeFrameFailure(()=>iphonePage.waitForFunction(()=>{const v=document.querySelector('.scene-video.is-active'),f=document.querySelector('.scene-day-fallback');return v&&v.currentTime>.15&&!v.paused&&f?.classList.contains('video-ready')},{timeout:20000}),iphonePage,report);"));
 assert.ok(s.includes('assert.deepEqual(report.errors,[])'));assert.ok(s.includes('report.passed=true'));
});
