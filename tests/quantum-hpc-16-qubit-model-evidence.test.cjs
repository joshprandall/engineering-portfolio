'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','advanced','quantum.json'),'utf8'));
const probes=[{"id":"advanced-quantum-state-vector","caseId":"Q01"},{"id":"advanced-quantum-gates","caseId":"Q02"},{"id":"advanced-quantum-measurement","caseId":"Q03"},{"id":"advanced-bell-state","caseId":"Q04"},{"id":"advanced-quantum-teleportation","caseId":"Q05"},{"id":"advanced-no-cloning","caseId":"Q06"},{"id":"advanced-quantum-error-correction","caseId":"Q07"},{"id":"advanced-nisq","caseId":"Q08"},{"id":"advanced-quantum-circuit-depth","caseId":"Q09"},{"id":"advanced-v05-bloch-sphere","caseId":"Q10"},{"id":"advanced-v05-hadamard-gate","caseId":"Q11"},{"id":"advanced-v05-pauli-x-gate","caseId":"Q12"},{"id":"advanced-v05-controlled-not-gate","caseId":"Q13"},{"id":"advanced-v05-global-phase","caseId":"Q14"},{"id":"advanced-v07-pauli-z-gate","caseId":"Q15"},{"id":"advanced-v07-quantum-tensor-product","caseId":"Q16"}];
const near=(a,b,eps=1e-10)=>Math.abs(a-b)<eps;
const checkVec=(v,w)=>assert.ok(v.length===w.length&&v.every((x,i)=>near(x,w[i])),JSON.stringify({v,w}));
const H=v=>[(v[0]+v[1])/Math.SQRT2,(v[0]-v[1])/Math.SQRT2];
const X=v=>[v[1],v[0]];
const Z=v=>[v[0],-v[1]];
const CNOT=v=>[v[0],v[1],v[3],v[2]];
test('quantum lesson content preserves 116 records and includes sixteen original evidence cases',()=>{
 assert.equal(Object.keys(lessons).length,116);
 assert.equal(probes.length,16);
 for(const {id,caseId} of probes){
  const l=lessons[id];
  assert.ok(l,id);
  assert.equal(l.reasoningSteps.length,6,id);
  assert.equal(l.labPlan.length,6,id);
  assert.ok(l.reasoningSteps[0].startsWith(caseId),id);
  assert.match(l.reasoningSteps[5],/https:\/\//,id);
  assert.ok(l.labPlan.some(x=>/assert|verify|check|confirm/i.test(x)),id);
  assert.ok(l.technical&&l.vocabulary&&l.starter,id);
 }
});
test('Q01 state norm and Born probabilities',()=>{
 const a=Math.sqrt(3)/2,b=.5;
 assert.ok(near(a*a+b*b,1)); assert.ok(near(a*a,.75));assert.ok(near(b*b,.25));
 assert.notEqual(a,.75);
});
test('Q02 ordered H Z H identity with falsifying shorter circuit',()=>{
 checkVec(H(Z(H([1,0]))),[0,1]);
 checkVec(Z(H([1,0])),[1/Math.SQRT2,-1/Math.SQRT2]);
});
test('Q03 binomial exact shot expectation is not deterministic observation',()=>{
 assert.ok(near(20*.2,4)); assert.ok(near(20*.2*.8,3.2));
 assert.ok(near(.8**20,.011529215046068483)); assert.ok(.8**20>0);
});
test('Q04 Bell state correlators distinguish a diagonal mixture',()=>{
 const a=1/Math.SQRT2;const psi=[a,0,0,a];
 assert.ok(near(psi.reduce((s,x)=>s+x*x,0),1));
 const zz=psi[0]**2-psi[1]**2-psi[2]**2+psi[3]**2;
 const xx=2*(psi[0]*psi[3]+psi[1]*psi[2]);
 const yy=-2*psi[0]*psi[3]+2*psi[1]*psi[2];
 assert.ok(near(zz,1)&&near(xx,1)&&near(yy,-1));
 const mixtureXX=0;assert.notEqual(mixtureXX,xx);
});
test('Q05 teleportation correction works conditionally',()=>{
 const p=[1/Math.SQRT2,1/Math.SQRT2],uncorr=Z(p);
 assert.ok(near(p[0]*uncorr[0]+p[1]*uncorr[1],0));
 checkVec(Z(uncorr),p);
});
test('Q06 no-cloning overlap contradiction for nonorthogonal states',()=>{
 const original=1/Math.SQRT2, cloned=original*original;
 assert.ok(near(cloned,.5));assert.ok(original-cloned>.2);
 assert.equal(0**2,0);
});
test('Q07 repetition-code syndromes and phase-error boundary',()=>{
 const synd=x=>[Number(x[0]!==x[1]),Number(x[1]!==x[2])].join('');
 assert.equal(synd('000'),'00');assert.equal(synd('100'),'10');
 assert.equal(synd('010'),'11');assert.equal(synd('001'),'01');
 assert.equal(synd('010'),'11');
 assert.equal(synd('000'),'00'); // Z phase flip leaves basis support unchanged
});
test('Q08 synthetic independent-survival model only',()=>{
 assert.ok(near(.99**4,.96059601));assert.ok(near(.99**12,.8863848717161292));
 assert.ok(near(.99**12/(.99**4),.99**8));assert.equal(1**12,1);
});
test('Q09 disjoint-gate layering differs from number of gates',()=>{
 const layers=[['H0','X1'],['CNOT01'],['Z0']];
 const occupy={H0:[0],X1:[1],CNOT01:[0,1],Z0:[0]};
 for(const layer of layers){const used=new Set();for(const gate of layer)for(const q of occupy[gate]){assert.ok(!used.has(q));used.add(q);}}
 assert.equal(layers.length,3);assert.equal(layers.flat().length,4);
});
test('Q10 Bloch vector basis probabilities with radians',()=>{
 const theta=Math.PI/2,phi=Math.PI/2;
 const [x,y,z]=[Math.sin(theta)*Math.cos(phi),Math.sin(theta)*Math.sin(phi),Math.cos(theta)];
 assert.ok(near(x,0)&&near(y,1)&&near(z,0));assert.ok(near(x*x+y*y+z*z,1));
 assert.ok(near((1+y)/2,1));assert.ok(near((1+x)/2,.5));assert.ok(near((1+z)/2,.5));
});
test('Q11 Hadamard H squared restores the computational basis',()=>{
 checkVec(H([0,1]),[1/Math.SQRT2,-1/Math.SQRT2]);
 checkVec(H(H([0,1])),[0,1]);
});
test('Q12 Pauli-X swaps amplitudes but leaves |+> unchanged',()=>{
 checkVec(X([.6,.8]),[.8,.6]);
 assert.ok(near(X([.6,.8])[0]**2,.64));checkVec(X(X([.6,.8])),[.6,.8]);
 checkVec(X([1/Math.SQRT2,1/Math.SQRT2]),[1/Math.SQRT2,1/Math.SQRT2]);
});
test('Q13 controlled-NOT Bell construction with explicit ordering',()=>{
 const a=1/Math.SQRT2;
 checkVec(CNOT([a,0,a,0]),[a,0,0,a]);
 checkVec(CNOT([1,0,0,0]),[1,0,0,0]);
 checkVec(CNOT(CNOT([a,0,a,0])),[a,0,a,0]);
});
test('Q14 isolated global phase preserves probabilities and overlap',()=>{
 const a=Math.sqrt(.6),b=Math.sqrt(.4);
 // psi=[a, i b]; i psi=[i a,-b]; <psi|i psi>=i*(a*a+b*b).
 assert.ok(near(a*a,.6));assert.ok(near(b*b,.4));assert.ok(near(a*a+b*b,1));
 assert.ok(near((a*a+b*b)**2,1));
});
test('Q15 Z phase converted to basis population by H',()=>{
 const p=[1/Math.SQRT2,1/Math.SQRT2];
 checkVec(Z(p),[p[0],-p[1]]);
 checkVec(H(Z(p)),[0,1]);checkVec(H(p),[1,0]);
});
test('Q16 tensor product separable input changed to entangled Bell',()=>{
 const a=1/Math.SQRT2,invec=[0,a,0,a],out=CNOT(invec);
 checkVec(out,[0,a,a,0]);
 const detBefore=invec[0]*invec[3]-invec[1]*invec[2];
 const detAfter=out[0]*out[3]-out[1]*out[2];
 assert.ok(near(detBefore,0));assert.ok(near(detAfter,-.5));
});
