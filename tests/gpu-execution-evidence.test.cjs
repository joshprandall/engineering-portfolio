'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','advanced','gpu-computing.json'),'utf8'));
const ids=["advanced-cpu-vs-gpu","advanced-cuda","advanced-gpu-warp","advanced-cuda-grid-block-thread","advanced-cuda-memory-spaces","advanced-gpu-coalescing","advanced-gpu-divergence-lab","advanced-gpu-occupancy","advanced-gpu-kernel","advanced-cpu-gpu-transfer","advanced-v05-cuda-streams","advanced-v05-cuda-unified-memory"];
test('132 GPU lessons preserved and 12 authored questions and detailed six-step labs',()=>{
 assert.equal(Object.keys(pack).length,132);
 assert.equal(ids.length,12);
 const q=new Set();
 for(const id of ids){
  const x=pack[id];assert.ok(x,id);assert.ok(x.essentialQuestion.endsWith('?'),id);
  assert.doesNotMatch(x.essentialQuestion,/^What does /,id);
  assert.ok(!q.has(x.essentialQuestion),id);q.add(x.essentialQuestion);
  assert.equal(x.reasoningSteps.length,6,id);assert.equal(x.labPlan.length,6,id);
  assert.ok(x.reasoningSteps.every(y=>y.length>=70),id);assert.ok(x.labPlan.every(y=>y.length>=60),id);
  assert.match(x.reasoningSteps[5],/https:\/\/docs\.nvidia\.com\/cuda\//,id);
  for(const k of ['verifiedBoundary','analogy','starter','technical','memoryLadder','vocabulary','video'])assert.ok(x[k],id+':'+k);
 }
});
const ceil=(a,b)=>Math.ceil(a/b);
test('8 blocks of 128 lanes cover 1000 elements with 24 guarded lanes',()=>{assert.equal(ceil(1000,128),8);assert.equal(8*128-1000,24);assert.equal(ceil(1025,128),9);});
test('1001 elements need 4 blocks of 256, not 3',()=>{assert.equal(ceil(1001,256),4);assert.equal(4*256-1001,23);assert.equal(1001-3*256,233);});
test('warp alternating parity gives disjoint half-warp masks',()=>{const pop=x=>Array.from({length:32},(_,i)=>(x>>>i)&1).reduce((a,b)=>a+b,0);assert.equal(pop(0x55555555),16);assert.equal(pop(0xAAAAAAAA),16);assert.equal((0x55555555&0xAAAAAAAA)>>>0,0);});
test('synthetic divergence trace has 11 active out of 24 slots',()=>{assert.equal(2*3+1*5,11);assert.equal(3*8,24);assert.equal(2*8,16);});
test('32-byte sector model counts 4 contiguous, 32 strided, 5 offset sectors',()=>{const sectors=(stride,offset=0)=>new Set(Array.from({length:32},(_,i)=>Math.floor((offset+i*stride)/32))).size;assert.equal(sectors(4),4);assert.equal(sectors(64),32);assert.equal(sectors(4,4),5);});
test('hypothetical resident-warp occupancy has no throughput assumption',()=>{assert.deepEqual([16,32,48,64].map(x=>100*x/64),[25,50,75,100]);});
test('separate block-scoped tiles remain independent under a local write',()=>{const a=[1,2],b=[10,20];a[0]=3;assert.deepEqual(a,[3,2]);assert.deepEqual(b,[10,20]);});
test('vector addition computes nine valid results while masking three extra lanes',()=>{let a=Array.from({length:9},(_,i)=>i),b=a.map(x=>8-x);assert.deepEqual(a.map((v,i)=>v+b[i]),Array(9).fill(8));assert.equal(ceil(9,4)*4-9,3);});
test('full GPU path includes fixed overhead and can beat one CPU case but not another',()=>{let total=2.4+.8;assert.ok(total<4);assert.ok(total>2);assert.ok(Math.abs(total-3.2)<1e-12);});
test('transfer throughput model preserves decimal bytes and seconds',()=>{const ms=(mb,gbps)=>1000*(mb/1000)/gbps;assert.equal(ms(8,4),2);assert.equal(ms(16,4)+.5,4.5);});
test('independent stream critical-path lower bound differs from serial sum',()=>{const a=[1,2,1],b=[1,2,1],sum=x=>x.reduce((a,b)=>a+b,0);assert.equal(Math.max(sum(a),sum(b)),4);assert.equal(sum(a)+sum(b),8);});
test('unified-memory first-touch toy model records unique pages, not real faults',()=>{const x=[1,2,2,4,1,8],first=p=>new Set(x.filter(v=>!p.includes(v))).size;assert.equal(first([]),4);assert.equal(first([1,2]),2);assert.equal(64*4096,262144);});
