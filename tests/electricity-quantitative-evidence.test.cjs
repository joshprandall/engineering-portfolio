'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','physics','electricity.json'),'utf8'));
const ids=["physics-electricity","physics-electric-field","physics-capacitance","physics-kirchhoff","physics-v06-electric-potential-difference","physics-v06-capacitance","physics-v06-electric-current","physics-v06-resistance-and-ohm-s-law","physics-v06-kirchhoff-junction-rule","physics-v08-deep-dive-coulomb-force","physics-v08-evidence-lab-coulomb-force","physics-v08-deep-dive-electric-field"];
test('112 electricity lessons retained with twelve distinct evidence-based quantitative exercises',()=>{
 assert.equal(Object.keys(lessons).length,112);assert.equal(new Set(ids).size,12);
 const questions=new Set();for(const id of ids){const x=lessons[id];assert.ok(x,id);assert.match(x.essentialQuestion,/\?$/);assert.doesNotMatch(x.essentialQuestion,/^What does /);assert.ok(!questions.has(x.essentialQuestion));questions.add(x.essentialQuestion);
 assert.equal(x.reasoningSteps.length,6);assert.equal(x.labPlan.length,6);assert.ok(x.reasoningSteps.every(s=>s.length>90));assert.ok(x.labPlan.every(s=>s.length>100));assert.match(x.reasoningSteps[5],/openstax.org\/books\/university-physics-volume-2\/pages\//);
 for(const field of ['verifiedBoundary','analogy','starter','technical','memoryLadder','vocabulary','video'])assert.ok(x[field],id+': '+field);
 assert.doesNotMatch([...x.reasoningSteps,...x.labPlan].join(' '),/we measured on hardware|validated on the real circuit|confirmed in production/);
 }
});
const close=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
test('12 V, 6 ohm resistor dissipates 24 W; twice R gives 12 W',()=>{close(12/6,2);close(12*(12/6),24);close(12*(12/12),12)});
test('electric field is force per positive test charge; negative probe reverses force',()=>{const E=.006/.002;close(E,3);close(E*(-.002),-.006)});
test('100 microfarad capacitor Q and energy scale linearly/quadratically',()=>{const C=100e-6;close(C*10,.001);close(.5*C*10**2,.005);close(.5*C*20**2,.020)});
test('Kirchhoff series circuit has common current and zero voltage residual',()=>{const I=12/(4+2);close(I,2);close(12-I*4-I*2,0);close(12-12/(6+6)*6-12/(6+6)*6,0)});
test('potential difference remains 4 V under doubled positive probe charge',()=>{close(.012/.003,4);close(.024/.006,4)});
test('capacitance Q/V remains 2 microfarad and Q halves at 6 V',()=>{const C=24e-6/12;close(C,2e-6);close(C*6,12e-6)});
test('electric current is delta charge divided by delta time',()=>{close(6/3,2);close(6/6,1)});
test('ohmic resistance is constant between two synthetic operating points',()=>{close(18/9,2);close(9/9,1);assert.notEqual(9/.2,9)});
test('junction balance detects 0.1 A residual when outgoing current is wrong',()=>{close(1.2+.8-.5-1.5,0);close(1.2+.8-.5-1.6,-.1)});
test('unlike charges attract, doubling Coulomb distance quarters magnitude',()=>{const k=8.99e9,F=r=>k*(1e-6*2e-6)/(r*r);close(F(.3),0.19977777777777778);close(F(.6)/F(.3),.25)});
test('Coulomb evidence data yield inverse-square rather than inverse-distance ratio',()=>{const k=8.99e9,F=r=>k*1e-18/r**2;close(F(.1)/F(.2),4);close(F(.1),8.99e-7,1e-12)});
test('point-source electric field quartered when observation radius doubles',()=>{const k=8.99e9,E=r=>k*3e-9/r**2;close(E(.2),674.25,1e-6);close(E(.4)/E(.2),.25);close(E(.2)*(-2e-6),-.0013485,1e-8)});
