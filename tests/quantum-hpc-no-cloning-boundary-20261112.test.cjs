'use strict';
// Offline ideal-state algebra; this is not a quantum device test.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lesson=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','advanced','quantum.json'),'utf8'))['advanced-no-cloning'];
const C=(r,i=0)=>[r,i];
const mul=(a,b)=>C(a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]);
const add=(a,b)=>C(a[0]+b[0],a[1]+b[1]);
const conj=a=>C(a[0],-a[1]);
const inner=(u,v)=>u.reduce((s,x,k)=>add(s,mul(conj(x),v[k])),C(0));
const abs=a=>Math.hypot(a[0],a[1]);
const normalized=v=>Math.abs(v.reduce((s,x)=>s+abs(x)**2,0)-1)<1e-12;
const close=(a,b)=>Math.abs(a-b)<1e-12;
const pairs=[
  ['zero vs plus',[C(1),C(0)],[C(Math.SQRT1_2),C(Math.SQRT1_2)],1/Math.SQRT2],
  ['zero vs weighted',[C(1),C(0)],[C(Math.sqrt(3)/2),C(0,.5)],Math.sqrt(3)/2],
  ['plus vs complex plus',[C(Math.SQRT1_2),C(Math.SQRT1_2)],[C(Math.SQRT1_2),C(0,Math.SQRT1_2)],Math.SQRT1_2],
];

test('no-cloning lesson cites the quantum-information theorem and states its assumption',()=>{
 assert.ok(lesson&&lesson.reasoningSteps.length===6&&lesson.labPlan.length===6);
 const text=lesson.reasoningSteps.join(' ');
 assert.match(text,/unitar(?:y|ity)|inner products/i);
 assert.match(text,/s=s²/);
 assert.match(text,/https:\/\/quantum\.cloud\.ibm\.com\/learning\/en\/courses\/basics-of-quantum-information\/quantum-circuits\/limitations-on-quantum-information/);
 assert.match(text,/approximate cloning/i);
});

test('three normalized nonorthogonal state pairs contradict exact universal cloning',()=>{
 for(const [label,u,v,expectedMagnitude] of pairs){
   assert.ok(normalized(u)&&normalized(v),label+' normalization');
   const original=inner(u,v);
   assert.ok(close(abs(original),expectedMagnitude),label+' overlap');
   const cloned=mul(original,original);
   assert.ok(abs(add(original,mul(C(-1),cloned)))>0.1,label+' impossible equality');
 }
});

test('orthogonal and identical special cases are not ruled out by overlap equality',()=>{
 for(const [u,v,expected] of [
  [[C(1),C(0)],[C(0),C(1)],0],
  [[C(Math.SQRT1_2),C(Math.SQRT1_2)],[C(Math.SQRT1_2),C(Math.SQRT1_2)],1]
 ]){
  const original=inner(u,v);
  assert.ok(close(abs(original),expected));
  const cloned=mul(original,original);
  assert.ok(close(abs(add(original,mul(C(-1),cloned))),0));
 }
});
