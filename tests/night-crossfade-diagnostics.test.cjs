'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {snapshotNightCrossfade,observeNightCrossfadeFailure}=require('./night-crossfade-diagnostics.cjs');
test('success leaves report and media observation untouched',async()=>{
 const report={};assert.equal(await observeNightCrossfadeFailure(async()=>7,{evaluate(){throw Error('unexpected');}},report,2),7);assert.deepEqual(report,{});
});
test('failed gate retains exact original error and expected owner target',async()=>{
 const e=new Error('gate'),r={};await assert.rejects(observeNightCrossfadeFailure(async()=>{throw e;},{evaluate:async()=>({owners:1,media:[]})},r,2),x=>x===e);
 assert.deepEqual(r.nightCrossfadeFailure,{expectedOwners:2,owners:1,media:[]});
});
test('snapshot error never replaces gate error',async()=>{
 const e=new Error('gate'),r={};await assert.rejects(observeNightCrossfadeFailure(async()=>{throw e;},{evaluate:async()=>{throw Error('closed');}},r,1),x=>x===e);
 assert.deepEqual(r.nightCrossfadeFailure,{expectedOwners:1,observationUnavailable:'closed'});
});
test('hung observation is bounded without waiving failure',async()=>{
 const e=new Error('gate'),r={};await assert.rejects(observeNightCrossfadeFailure(async()=>{throw e;},{evaluate:()=>new Promise(()=>{})},r,2,10),x=>x===e);
 assert.equal(r.nightCrossfadeFailure.observationUnavailable,'diagnostic budget exceeded');
});
const snap=site=>JSON.parse(JSON.stringify(vm.runInNewContext('('+snapshotNightCrossfade.toString()+')()',{SiteAudio:site,document:{visibilityState:'visible'}})));
const ranges={length:1,start:()=>0,end:()=>12};
const player={currentTime:4,duration:12,paused:false,muted:false,ended:false,seeking:false,readyState:4,networkState:1,error:null,currentSrc:'local.wav',volume:1,buffered:ranges,seekable:ranges};
test('snapshot reports owner conjunction and retained media state',()=>{
 const s=snap({darkElements:[player,{...player,paused:true,seeking:true,error:{code:3}}],volume:.05,muted:false,volumeBackend:'gain',outputLevels:[{level:.05}]});
 assert.equal(s.owners,1);assert.equal(s.media[1].seeking,true);assert.equal(s.media[1].mediaErrorCode,3);assert.deepEqual(s.media[0].buffered,[[0,12]]);
 assert.equal(s.selectedVolume,.05);assert.equal(s.backend,'gain');assert.deepEqual(s.outputLevels,[{level:.05}]);
 assert.equal(snap({darkElements:[player,{...player,muted:true}]}).owners,1);
});
test('absent site and nonfinite duration are explicit, ranges bounded',()=>{
 assert.equal(snap(undefined).siteAvailable,false);assert.equal(snap(undefined).owners,0);
 const s=snap({darkElements:[{...player,duration:Infinity,buffered:{length:100,start:i=>i,end:i=>i+1}}]});
 assert.equal(s.media[0].duration,null);assert.equal(s.media[0].buffered.length,8);
});
test('snapshot performs no media mutations',()=>{
 const frozen=Object.freeze({...player,play(){throw Error('play');},pause(){throw Error('pause');},load(){throw Error('load');}});
 assert.equal(snap({darkElements:[frozen]}).owners,1);assert.equal(frozen.currentTime,4);
});
test('integration preserves both original predicates and timeout options',()=>{
 const s=fs.readFileSync(path.join(__dirname,'media-playback.test.cjs'),'utf8');
 for(const n of [2,1])assert.ok(s.includes('await observeNightCrossfadeFailure(()=>p.waitForFunction(()=>SiteAudio.darkElements.filter(a=>!a.paused&&!a.muted).length==='+n+',null,{timeout:6000}),p,report,'+n+');'));
 assert.ok(s.includes("assert.deepEqual(report.errors,[])"));assert.ok(s.includes('report.passed=true'));
});
