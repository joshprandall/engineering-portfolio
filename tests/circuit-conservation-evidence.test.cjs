'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','physics','electricity.json'),'utf8'));
const ids=[
'physics-v10-configuration-lab-capacitance',
'physics-v10-reasoning-check-electric-current',
'physics-v10-fault-isolation-lab-kirchhoff-s-circuit-laws',
'physics-v10-transfer-challenge-ohm-law',
'physics-v10-measurement-lab-kirchhoff-junction-rule',
'physics-v10-counterexample-lab-kirchhoff-loop-rule'
];
const generic=/state the question in your own words|identify the exact verified claim|what does .+ mean, why does it matter|predict the outcome before manipulating|run the interactive model or work through/i;
test('six authored circuit lessons keep 112 records and preserved detailed learning fields',()=>{
 assert.equal(Object.keys(pack).length,112);
 const unique=new Set();
 for(const id of ids){
  const l=pack[id];assert.ok(l,id);
  assert.equal(l.reasoningSteps.length,6,id);assert.equal(l.labPlan.length,6,id);
  assert.ok(l.essentialQuestion.endsWith('?'),id);
  assert.doesNotMatch(l.essentialQuestion,generic,id);
  assert.ok(!unique.has(l.essentialQuestion),id);unique.add(l.essentialQuestion);
  assert.equal(new Set(l.reasoningSteps).size,6,id);
  assert.equal(new Set(l.labPlan).size,6,id);
  for(const stage of [...l.reasoningSteps,...l.labPlan]){
   assert.ok(stage.length>=100,id+': underdeveloped instruction');
   assert.doesNotMatch(stage,generic);
  }
  assert.ok(l.technical&&l.verifiedBoundary&&l.memoryLadder&&l.starter&&l.video&&l.vocabulary,id);
  const lab=l.labPlan.join(' ');
  assert.match(lab,/synthetic|fictional|invented|illustrative/i,id);
  assert.match(lab,/https:\/\/openstax\.org\/books\/university-physics-volume-2\/pages\//,id);
  assert.doesNotMatch(JSON.stringify({eq:l.essentialQuestion,r:l.reasoningSteps,lab:l.labPlan}),/live customer|measured on our production|verified in our physical lab/i);
 }
});
test('capacitor charge and energy scaling are dimensionally consistent',()=>{
 const C=100e-6;
 const charge=V=>C*V, energy=V=>.5*C*V**2;
 assert.ok(Math.abs(charge(12)-.0012)<1e-12);
 assert.ok(Math.abs(charge(6)-.0006)<1e-12);
 assert.ok(Math.abs(energy(12)-.0072)<1e-12);
 assert.ok(Math.abs(energy(6)-.0018)<1e-12);
 assert.equal(energy(6)/energy(12),.25);
 assert.match(pack[ids[0]].reasoningSteps.join(' '),/isolated|disconnect/i);
});
test('time-binned charge transfer disproves constant instantaneous current inference',()=>{
 const bins=[{q:.12,t:.1},{q:.48,t:.1}];
 const total=bins.reduce((a,b)=>a+b.q,0)/bins.reduce((a,b)=>a+b.t,0);
 assert.ok(Math.abs(total-3)<1e-12);
 assert.ok(Math.abs(bins[0].q/bins[0].t-1.2)<1e-12);
 assert.ok(Math.abs(bins[1].q/bins[1].t-4.8)<1e-12);
 assert.notEqual(bins[0].q/bins[0].t,bins[1].q/bins[1].t);
});
test('series loop residual flags inconsistent hypothetical measurements, not violated conservation',()=>{
 const I=12/(2+4);
 assert.equal(I,2);
 assert.equal(12-I*2-I*4,0);
 assert.equal(12-4-7.5,.5);
 assert.equal(11.5-4-7.5,0);
 assert.match(pack[ids[2]].reasoningSteps.join(' '),/probe|source|temperature/i);
});
test('Ohmic fixed-voltage and fixed-current scenarios must not be conflated',()=>{
 const I=R=>9/R, Pv=R=>81/R, Pi=R=>9*R;
 assert.equal(I(3),3);assert.equal(I(6),1.5);
 assert.equal(Pv(3),27);assert.equal(Pv(6),13.5);
 assert.equal(Pi(3),27);assert.equal(Pi(6),54);
 assert.match(pack[ids[3]].labPlan.join(' '),/LED|filament/i);
});
test('junction current residual is compared with a deterministic, not statistical, bound',()=>{
 const residual=out2=>2.4-.8-out2;
 assert.ok(Math.abs(residual(1.6))<1e-12);
 assert.ok(Math.abs(residual(1.35)-.25)<1e-12);
 assert.ok(Math.abs(residual(1.50)-.10)<1e-12);
 const maximum=.05+.05+.05;
 assert.ok(.25>maximum);
 assert.ok(Math.abs(residual(1.5))<maximum);
 assert.match(pack[ids[4]].reasoningSteps.join(' '),/95%/);
});
test('loop sign invariance survives both traversal reversal and resistor perturbation',()=>{
 const series=(R1,R2)=>{const I=12/(R1+R2);return {I,forward:12-I*R1-I*R2,reverse:-12+I*R1+I*R2};};
 assert.deepEqual(series(2,4),{I:2,forward:0,reverse:0});
 const next=series(2,3);
 assert.ok(Math.abs(next.I-2.4)<1e-12);
 assert.ok(Math.abs(next.forward)<1e-12);
 assert.ok(Math.abs(next.reverse)<1e-12);
 assert.equal(12+4+8,24);
 assert.match(pack[ids[5]].reasoningSteps.join(' '),/induction|magnetic flux/i);
});
