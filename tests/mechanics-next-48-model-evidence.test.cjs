'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const lessons = JSON.parse(fs.readFileSync(path.join(root,'deep-learning/physics/mechanics.json'),'utf8'));
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname,'mechanics-next-48-model-evidence.fixtures.json'),'utf8'));
const model = {"avgVel":{calc:p=>(p[1]-p[0])/p[2], inverse:(y,p)=>p[1]-y*p[2]},
"momentum":{calc:p=>p[0]*p[1], inverse:(y,p)=>y/p[1]},
"balance":{calc:p=>p[0]+p[1], inverse:(y,p)=>y-p[1]},
"uniformDist":{calc:p=>p[0]*p[1], inverse:(y,p)=>y/p[1]},
"newton":{calc:p=>p[0]/p[1], inverse:(y,p)=>y*p[1]},
"newtonNet":{calc:p=>(p[0]-p[1])/p[2], inverse:(y,p)=>y*p[2]+p[1]},
"third":{calc:p=>-p[0], inverse:y=>-y},
"thirdAcc":{calc:p=>-p[0]/p[2], inverse:(y,p)=>-y*p[2]},
"gravScale":{calc:p=>p[0]/(p[1]*p[1]), inverse:(y,p)=>y*p[1]*p[1]},
"impulse":{calc:p=>p[0]*p[1], inverse:(y,p)=>y/p[1]},
"projectileR":{calc:p=>p[0]*2*p[1]/9.8, inverse:(y,p)=>y*9.8/(2*p[1])},
"torque":{calc:p=>p[0]*p[1]*p[2], inverse:(y,p)=>y/(p[1]*p[2])},
"avgAcc":{calc:p=>(p[1]-p[0])/p[2], inverse:(y,p)=>p[1]-y*p[2]},
"derivAccel":{calc:p=>p[0]+2*p[1]*p[2], inverse:(y,p)=>y-2*p[1]*p[2]},
"angular":{calc:p=>p[0]*p[1], inverse:(y,p)=>y/p[1]},
"segmentedAvg":{calc:p=>(p[0]+p[1])/p[2], inverse:(y,p)=>y*p[2]-p[1]},
"cent":{calc:p=>p[0]*p[0]/p[1], inverse:(y,p)=>Math.sqrt(y*p[1])},
"finalV":{calc:p=>p[0]+p[1]*p[2], inverse:(y,p)=>y-p[1]*p[2]},
"work":{calc:p=>p[0]*p[1]*p[2], inverse:(y,p)=>y/(p[1]*p[2])},
"disp":{calc:p=>p[1]-p[0], inverse:(y,p)=>p[1]-y},
"sumDisp":{calc:p=>p[0]+p[1]+p[2], inverse:(y,p)=>y-p[1]-p[2]},
"particleL":{calc:p=>p[0]*p[1]*p[2], inverse:(y,p)=>y/(p[1]*p[2])},
"pos":{calc:p=>p[0]*p[2]+0.5*p[1]*p[2]**2, inverse:(y,p)=>(y-0.5*p[1]*p[2]**2)/p[2]},
"ke":{calc:p=>0.5*p[0]*p[1]**2, inverse:(y,p)=>2*y/(p[1]**2)},
"hyp":{calc:p=>Math.hypot(p[0],p[1]), inverse:(y,p)=>Math.sqrt(y*y-p[1]*p[1])},
"instV":{calc:p=>p[0]+2*p[1]*p[2], inverse:(y,p)=>y-2*p[1]*p[2]},
"incline":{calc:p=>p[0]*(p[1]-p[3]*p[2]), inverse:(y,p)=>y/(p[1]-p[3]*p[2])},
"normal":{calc:p=>p[0]*p[1]-p[2], inverse:(y,p)=>(y+p[2])/p[1]},
"friction":{calc:p=>p[0]*p[1]*p[2], inverse:(y,p)=>y/(p[1]*p[2])},
"stopTime":{calc:p=>p[0]/p[1], inverse:(y,p)=>y*p[1]},
"collision":{calc:p=>(p[0]*p[1]+p[2]*p[3])/(p[0]+p[2]), inverse:(y,p)=>p[2]*(p[3]-y)/(y-p[1])},
"force":{calc:p=>p[0]*p[1], inverse:(y,p)=>y/p[1]}};
function close(a,b){return Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));}
test('all 120 IDs, target IDs and record order are retained',()=>{
 assert.equal(Object.keys(lessons).length,120);
 assert.deepEqual(Object.keys(lessons).slice(48,96),fixtures.changedIds);
 assert.equal(new Set(fixtures.changedIds).size,48);
});
test('all 48 authored cases preserve original fields and professional evidence boundaries',()=>{
 for(const c of fixtures.cases){const x=lessons[c.id];assert.ok(x);assert.equal(x.essentialQuestion,c.question);
 assert.ok(x.reasoningSteps.length>=6&&x.labPlan.length>=6);
 for(const s of [...x.reasoningSteps,...x.labPlan])assert.ok(typeof s==='string'&&s.length>55);
 assert.ok(x.reasoningSteps.some(s=>s.includes(c.source)));assert.ok(x.labPlan.some(s=>s.includes(c.source)));
 assert.ok(x.labPlan.some(s=>s.includes(c.boundary)));assert.ok(x.reasoningSteps.some(s=>s.includes('synthetic')));
 }
});
for(const c of fixtures.cases){test(c.id+' independent forward/inverse and perturbation checks',()=>{
 const m=model[c.model]; assert.ok(m);const p=c.inputs;
 assert.ok(close(m.calc(p),c.expected),'expected numerical result mismatch');
 assert.ok(close(m.inverse(c.expected,p),c.independentFirstInput),'inverse result mismatch');
 const twice=p.slice();twice[0]*=2;const plus=p.slice();plus[0]*=1.01;
 assert.ok(close(m.calc(twice),c.doubledExpected),'doubled-input result mismatch');
 assert.ok(close(m.calc(plus),c.plusOnePercentExpected),'+1% sensitivity mismatch');
 const combined=[...lessons[c.id].reasoningSteps,...lessons[c.id].labPlan].join(' ');
 assert.ok(combined.includes(c.question)&&combined.includes(c.misconception),'case evidence not embedded');
 });}
