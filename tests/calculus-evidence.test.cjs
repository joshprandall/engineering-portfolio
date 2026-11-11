'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','math','calculus.json'),'utf8'));
const ids=['math-derivatives','math-rate-change','math-integral','math-limits','math-chain-rule','math-gradient'];
const generic=/state the question in your own words|identify the exact verified claim|what does .+ mean, why does it matter|predict the outcome before manipulating|run the interactive model or work through/i;
const close=(a,b,epsilon=1e-9)=>assert.ok(Math.abs(a-b)<epsilon,'expected '+b+' but got '+a);
test('six authored calculus lessons preserve 141-record schema and cite primary instructional sources',()=>{
 assert.equal(Object.keys(lessons).length,141);
 const questions=new Set();
 for(const id of ids){
  const l=lessons[id];assert.ok(l,id);assert.ok(l.essentialQuestion.endsWith('?'),id);
  assert.doesNotMatch(l.essentialQuestion,generic,id);assert.ok(!questions.has(l.essentialQuestion),id);questions.add(l.essentialQuestion);
  assert.equal(l.reasoningSteps.length,6,id);assert.equal(l.labPlan.length,6,id);
  assert.equal(new Set(l.reasoningSteps).size,6,id);assert.equal(new Set(l.labPlan).size,6,id);
  for(const step of [...l.reasoningSteps,...l.labPlan]){
   assert.ok(step.length>=110,id+' step too short');assert.doesNotMatch(step,generic,id);
  }
  for(const field of ['technical','verifiedBoundary','memoryLadder','starter','video','vocabulary'])assert.ok(l[field],id+' missing '+field);
  assert.match(l.labPlan.join(' '),/synthetic|hypothetical|fictional/i,id+' not labeled');
  assert.match(l.reasoningSteps.join(' '),/https:\/\/openstax\.org\/books\/calculus-volume-[13]\/pages\//,id+' no source');
 }
});
test('difference quotient tends to six from both signs without h=0 evaluation',()=>{
 const q=(h)=>((3+h)**2-9)/h;
 for(const [h,expected] of [[-.1,5.9],[-.01,5.99],[.01,6.01],[.1,6.1]])close(q(h),expected);
 close(q(1e-4),6.0001,1e-8);close(q(-1e-4),5.9999,1e-8);
 assert.ok(Number.isNaN(q(0)));
 const absQ=(h)=>Math.abs(h)/h;
 assert.equal(absQ(.01),1);assert.equal(absQ(-.01),-1);
});
test('average velocity depends on interval and cubic midpoint is a counterexample',()=>{
 const s=t=>10+2*t+t*t, v=t=>2+2*t;
 close((s(3)-s(1))/2,6);close(v(2),6);
 close((s(3)-s(0))/3,5);close(s(3),25);
 const cubic=t=>t*t*t;
 close((cubic(3)-cubic(1))/2,13);close(3*2*2,12);
});
test('linearly increasing synthetic power yields exact 390 Wh and converging Riemann bounds',()=>{
 const P=t=>100+20*t;
 const sum=(n,where)=>{const h=3/n;return h*Array.from({length:n},(_,i)=>P((i+where)*h)).reduce((a,b)=>a+b,0);};
 close(sum(3,0),360);close(sum(3,1),420);close(sum(3,.5),390);
 close(sum(6,0),375);close(sum(6,1),405);close(sum(6,.5),390);
 close(100*3+10*3**2,390);
 assert.ok(sum(6,1)-sum(6,0)<sum(3,1)-sum(3,0));
});
test('removable discontinuity has limit two despite value 99; jump has no common side limit',()=>{
 const f=x=>x===1?99:(x*x-1)/(x-1);
 for(const [x,y] of [[.9,1.9],[.99,1.99],[1.01,2.01],[1.1,2.1]])close(f(x),y);
 assert.equal(f(1),99);
 const g=x=>x<1?0:1;assert.equal(g(.999),0);assert.equal(g(1.001),1);
 assert.notEqual(g(.999),g(1.001));
});
test('chain rule includes inner derivative; centered difference matches symbolic derivative',()=>{
 const y=x=>(3*x+1)**2;
 const derivative=x=>6*(3*x+1);
 assert.equal(derivative(2),42);assert.notEqual(2*(3*2+1),42);
 for(const h of [.1,.01,.001])close((y(2+h)-y(2-h))/(2*h),42,1e-8);
 assert.equal(9*(3*2+1)**2,441);
});
test('gradient gives directional rates and first-order remainder under Euclidean norm',()=>{
 const f=(x,y)=>x*x+2*y*y,grad=(x,y)=>[2*x,4*y];
 const g=grad(1,-2);
 assert.deepEqual(g,[2,-8]);close(f(1,-2),9);
 const norm=Math.hypot(...g), dot=u=>g[0]*u[0]+g[1]*u[1];
 close(norm,Math.sqrt(68));close(dot([0,1]),-8);close(dot([0,-1]),8);close(dot([1,0]),2);
 close(dot(g.map(v=>v/norm)),norm);close(dot(g.map(v=>-v/norm)),-norm);
 close(f(1.01,-2),9.0201);close(f(1.01,-2)-(9+2*.01),.0001);
});
