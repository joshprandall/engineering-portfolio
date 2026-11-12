'use strict';
const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','math','numerical-methods.json'),'utf8'));
const ids=['math-numerical-error','math-lab-gradient-descent','math-v09-worked-example-floating-point-error-computers-approximate-real-numbers','math-v09-failure-analysis-lab-walk-down-a-function-with-gradient-descent','math-v09-evidence-verification-la-floating-point-error-computers-approximate-real-numbers','math-v09-practical-lab-walk-down-a-function-with-gradient-descent'];
const approx=(a,b,eps=1e-10)=>assert.ok(Math.abs(a-b)<=eps,'expected '+b+', got '+a);
test('six authored numerical lessons retain 98 records and evidence gates',()=>{
 assert.equal(Object.keys(lessons).length,98);
 for(const id of ids){
  const l=lessons[id];assert.ok(l,id);
  assert.ok(l.essentialQuestion.endsWith('?'));
  assert.doesNotMatch(l.essentialQuestion,/what does .+ mean, why does it matter/i);
  for(const field of ['reasoningSteps','labPlan']){
   assert.equal(l[field].length,6,id+' '+field);
   assert.equal(new Set(l[field]).size,6);
   for(const step of l[field]) assert.ok(step.length>=110,id+' '+field);
  }
  assert.match(l.reasoningSteps.join(' '),/https:\/\/(docs\.python\.org|cs231n\.github\.io)\//);
  assert.match(l.labPlan.join(' '),/synthetic/i);
  for(const field of ['verifiedBoundary','technical','memoryLadder','starter','vocabulary','video']) assert.ok(l[field],id+' '+field);
 }
});
test('binary64 approximation and explicit comparison contract',()=>{
 assert.notEqual(0.1+0.2,0.3);
 approx(0.1+0.2,0.3,1e-15);
 const isClose=(a,b,rt=1e-9,at=0)=>Math.abs(a-b)<=Math.max(rt*Math.max(Math.abs(a),Math.abs(b)),at);
 assert.equal(isClose(0.1+0.2,0.3),true);
 assert.equal(isClose(1e-12,2e-12),false);
 assert.equal(isClose(1e-12,2e-12,1e-9,1e-11),true);
});
test('three-addend order changes binary64 rounding',()=>{
 assert.equal((1e16+1)-1e16,0);
 assert.equal(1e16+(-1e16)+1,1);
 assert.equal((10n**16n+1n)-10n**16n,1n);
 const xs=[1e16,1,-1e16];
 assert.equal(xs.reduce((a,b)=>a+b,0),0);
 assert.equal([1e16,-1e16,1].reduce((a,b)=>a+b,0),1);
});
test('synthetic decimal money represented in exact integer cents',()=>{
 assert.equal(10+20,30);
 assert.notEqual(0.1+0.2,0.3);
 const parseCents=s=>{assert.match(s,/^-?\d+\.\d{2}$/);const neg=s.startsWith('-');const [major,minor]=(neg?s.slice(1):s).split('.');return BigInt((neg?'-':'')+(BigInt(major)*100n+BigInt(minor)).toString());};
 assert.equal(parseCents('0.10')+parseCents('0.20'),parseCents('0.30'));
 assert.equal(parseCents('-0.20')+parseCents('0.10'),-10n);
 assert.throws(()=>parseCents('0.005'));
});
test('one dimensional quadratic converges only inside strict step bound',()=>{
 const update=(x,eta)=>x-eta*2*x;
 const series=(eta,n=4)=>{let x=8,arr=[x];for(let i=1;i<n;i++)arr.push(x=update(x,eta));return arr;};
 assert.deepEqual(series(.25),[8,4,2,1]);
 assert.deepEqual(series(1),[8,-8,8,-8]);
 assert.deepEqual(series(1.25),[8,-12,18,-27]);
 for(const eta of [.1,.25,.75,.99])assert.ok(Math.abs(1-2*eta)<1);
 for(const eta of [0,1,1.1])assert.ok(Math.abs(1-2*eta)>=1);
});
test('shifted quadratic isolates overshoot from opposite-gradient coding error',()=>{
 const f=x=>(x-3)**2,grad=x=>2*(x-3);
 let x=7;assert.equal(f(x),16);
 x-=.25*grad(x);assert.equal(x,5);assert.equal(f(x),4);
 x-=.25*grad(x);assert.equal(x,4);assert.equal(f(x),1);
 const oversized=7-1.1*grad(7);
 approx(oversized,-1.8);approx(f(oversized),23.04);
 assert.ok(f(7+.25*grad(7))>f(7));
});
test('two-dimensional convex gradient steps reproduce fixed fixtures',()=>{
 const f=([x,y])=>(x-1)**2+2*(y+2)**2;
 const step=([x,y],eta)=>[x-eta*2*(x-1),y-eta*4*(y+2)];
 let p=[3,0];assert.equal(f(p),12);
 p=step(p,.2);approx(p[0],2.2);approx(p[1],-1.6);approx(f(p),1.76);
 p=step(p,.2);approx(p[0],1.72);approx(p[1],-1.92);approx(f(p),.5312);
});
test('unequal curvature restricts stable gradient step size',()=>{
 const eta=.6,fx=1-2*eta,fy=1-4*eta;
 approx(fx,-.2);approx(fy,-1.4);
 assert.ok(Math.abs(fx)<1);assert.ok(Math.abs(fy)>1);
 const f=([x,y])=>(x-1)**2+2*(y+2)**2;
 let p=[3,0],p1=[p[0]-eta*2*(p[0]-1),p[1]-eta*4*(p[1]+2)];
 assert.ok(f(p1)>f(p));
});
