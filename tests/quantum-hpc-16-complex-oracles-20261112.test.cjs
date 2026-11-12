'use strict';
// Independent exact-state educational checks; no physical-device operations.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const lessons = JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','advanced','quantum.json'),'utf8'));
const near=(a,b,eps=1e-10)=>Math.abs(a-b)<eps;
const C=(r,i=0)=>[r,i];
const add=(x,y)=>C(x[0]+y[0],x[1]+y[1]);
const mul=(x,y)=>C(x[0]*y[0]-x[1]*y[1],x[0]*y[1]+x[1]*y[0]);
const conj=x=>C(x[0],-x[1]);
const abs2=x=>x[0]*x[0]+x[1]*x[1];
const inner=(v,w)=>v.reduce((s,x,i)=>add(s,mul(conj(x),w[i])),C(0));
const fidelity=(v,w)=>abs2(inner(v,w));
const Xc=v=>[v[1],v[0]];
const Zc=v=>[v[0],mul(C(-1),v[1])];
const vecNear=(v,w)=>assert.ok(v.length===w.length&&v.every((x,i)=>near(x[0],w[i][0])&&near(x[1],w[i][1])));
const anchorCases={
 'advanced-quantum-state-vector':['P(0)=0.75','P(1)=0.25','7.5'],
 'advanced-quantum-gates':['HZH|0>=|1>','P(1)=1','H then Z only'],
 'advanced-quantum-measurement':['np=4','3.2','0.011529'],
 'advanced-bell-state':['E(ZZ)=+1','E(XX)=+1','E(YY)=−1'],
 'advanced-quantum-teleportation':['fidelity','two classical bits','branch'],
 'advanced-no-cloning':['1/√2','1/2','unitarity'],
 'advanced-quantum-error-correction':['syndrome','11','phase'],
 'advanced-nisq':['0.96059601','0.8863848717','correlated'],
 'advanced-quantum-circuit-depth':['depth is three','Gate count is four','layer 3'],
 'advanced-v05-bloch-sphere':['P(Y+)=1','P(X+)=0.5','P(Z+)=0.5'],
 'advanced-v05-hadamard-gate':['H²=I','H|->=|1>','coherent'],
 'advanced-v05-pauli-x-gate':['P(0)=0.64','P(1)=0.36','X²'],
 'advanced-v05-controlled-not-gate':['P(00)=P(11)=0.5','Bell','product'],
 'advanced-v05-global-phase':['[0.6,0.4]','|<ψ|iψ>|²=1','relative phase'],
 'advanced-v07-pauli-z-gate':['HZ|+>=|1>','P(1)=1','[0.5,0.5]'],
 'advanced-v07-quantum-tensor-product':['[0,0.5,0,0.5]','entangled','determinant']
};
test('sixteen quantum records contain 48 checkable numerical and boundary anchors',()=>{
 assert.equal(Object.keys(lessons).length,116);
 for(const [id,anchors] of Object.entries(anchorCases)){
  const doc=lessons[id];
  assert.ok(doc&&Array.isArray(doc.reasoningSteps)&&Array.isArray(doc.labPlan),id);
  const passage=[...doc.reasoningSteps,...doc.labPlan].join(' ');
  for(const phrase of anchors)assert.ok(passage.includes(phrase),id+' missing '+phrase);
 }
});
test('Bell correlations derived with complex Pauli tensor matrices',()=>{
 const X=[[C(0),C(1)],[C(1),C(0)]];
 const Y=[[C(0),C(0,-1)],[C(0,1),C(0)]];
 const Z=[[C(1),C(0)],[C(0),C(-1)]];
 const tensor=(a,b)=>Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>mul(a[Math.floor(r/2)][Math.floor(c/2)],b[r%2][c%2])));
 const apply=(m,v)=>m.map(row=>row.reduce((s,x,j)=>add(s,mul(x,v[j])),C(0)));
 const bell=[C(1/Math.SQRT2),C(0),C(0),C(1/Math.SQRT2)];
 for(const [p,value] of [[X,1],[Y,-1],[Z,1]]){
  const got=inner(bell,apply(tensor(p,p),bell));
  assert.ok(near(got[0],value)&&near(got[1],0));
 }
 const zero=[C(1),C(0),C(0),C(0)],one=[C(0),C(0),C(0),C(1)];
 const mixtureXX=(inner(zero,apply(tensor(X,X),zero))[0]+inner(one,apply(tensor(X,X),one))[0])/2;
 assert.ok(near(mixtureXX,0));
});
test('teleportation four Pauli correction branches recover an arbitrary complex state up to global phase',()=>{
 const original=[C(Math.sqrt(.3)),C(0,Math.sqrt(.7))];
 for(let a=0;a<2;a++)for(let b=0;b<2;b++){
  const received=(b?Xc:v=>v)(a?Zc(original):original);
  const corrected=(a?Zc:v=>v)((b?Xc:v=>v)(received));
  assert.ok(near(fidelity(original,corrected),1),JSON.stringify({a,b}));
 }
 const plus=[C(1/Math.SQRT2),C(1/Math.SQRT2)];
 assert.ok(near(fidelity(plus,Zc(plus)),0));
});
test('repetition code syndrome and recovery distinguish bit errors from an undetected phase error',()=>{
 const alpha=Math.sqrt(.3),beta=Math.sqrt(.7),original=Array(8).fill(0);
 original[0]=alpha;original[7]=beta;
 const flipMid=v=>v.map((_,i)=>v[i^2]);
 const phaseMid=v=>v.map((x,i)=>(i&2)?-x:x);
 const check=(v,left,right)=>v.reduce((s,a,k)=>s+((((k>>(2-left))^(k>>(2-right)))&1)?-1:1)*a*a,0);
 const syndrome=v=>[check(v,0,1),check(v,1,2)].map(x=>near(x,-1)?'1':'0').join('');
 const damaged=flipMid(original);
 assert.equal(syndrome(original),'00');
 assert.equal(syndrome(damaged),'11');
 assert.equal(syndrome(phaseMid(original)),'00');
 const recovered=flipMid(damaged);
 for(let i=0;i<8;i++)assert.ok(near(recovered[i],original[i]));
 const overlap=original.reduce((s,x,i)=>s+x*phaseMid(original)[i],0);
 assert.ok(near(overlap,-.4)&&near(overlap*overlap,.16));
});
test('complex global phase preserves all observables but single-amplitude change alters X-basis interference',()=>{
 const a=Math.sqrt(.6),b=Math.sqrt(.4),psi=[C(a),C(0,b)];
 const global=psi.map(x=>mul(C(0,1),x));
 const relative=[psi[0],mul(C(0,1),psi[1])];
 vecNear(global,[C(0,a),C(-b)]);
 assert.ok(near(fidelity(psi,global),1));
 assert.ok(near(abs2(global[0]),.6)&&near(abs2(global[1]),.4));
 const probXplus=v=>abs2(mul(C(1/Math.SQRT2),add(v[0],v[1])));
 assert.ok(near(probXplus(psi),.5));
 assert.ok(near(probXplus(global),.5));
 assert.ok(near(probXplus(relative),.5-a*b));
 assert.ok(Math.abs(probXplus(relative)-probXplus(global))>.48);
});
test('gate dependencies allow parallel disjoint gates but not overlapping resources',()=>{
 const tasks=[
  {name:'H0',q:[0],parents:[]},{name:'X1',q:[1],parents:[]},
  {name:'CNOT01',q:[0,1],parents:['H0','X1']},
  {name:'Z0',q:[0],parents:['CNOT01']},{name:'Z1',q:[1],parents:['CNOT01']}
 ];
 const layers=new Map();
 for(const gate of tasks)layers.set(gate.name,1+Math.max(0,...gate.parents.map(p=>layers.get(p))));
 assert.deepEqual([...layers.values()],[1,1,2,3,3]);
 for(const level of [1,2,3]){
  const used=new Set();
  for(const gate of tasks.filter(g=>layers.get(g.name)===level)){
   for(const q of gate.q){assert.ok(!used.has(q));used.add(q);}
  }
 }
 assert.equal(Math.max(...layers.values()),3);
});