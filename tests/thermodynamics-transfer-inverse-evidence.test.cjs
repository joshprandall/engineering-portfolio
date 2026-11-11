'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','physics','thermodynamics.json'),'utf8'));
const cases=[["physics-v09-worked-example-temperature","18","1-2-thermometers-and-temperature-scales"],["physics-v09-decision-lab-temperature-is-not-heat","0.30","1-4-heat-transfer-specific-heat-and-calorimetry"],["physics-v09-failure-analysis-lab-the-ideal-gas-law","3.00","2-1-molecular-model-of-an-ideal-gas"],["physics-v09-teach-back-lab-entropy","900","4-6-entropy"],["physics-v09-evidence-verification-la-first-law-of-thermodynamics","1,200","3-3-first-law-of-thermodynamics"],["physics-v09-troubleshooting-lab-first-law-of-thermodynamics","450","3-3-first-law-of-thermodynamics"],["physics-v09-practical-lab-heat","0.8","1-6-mechanisms-of-heat-transfer"],["physics-v09-quick-reference-heat","5,400","1-4-heat-transfer-specific-heat-and-calorimetry"],["physics-v09-design-review-temperature","20.0","1-2-thermometers-and-temperature-scales"],["physics-v09-misconception-clinic-temperature","10","1-2-thermometers-and-temperature-scales"],["physics-v09-recall-drill-temperature-is-not-heat","1.00","1-4-heat-transfer-specific-heat-and-calorimetry"],["physics-v09-scenario-analysis-the-ideal-gas-law","100","2-1-molecular-model-of-an-ideal-gas"]];
function near(a,b,t=1e-7){assert.ok(Math.abs(a-b)<t,String(a)+' != '+String(b));}
test('twelve distinct, falsifiable, source-grounded thermodynamics teaching cases',()=>{
 assert.equal(Object.keys(lessons).length,96);assert.equal(new Set(cases.map(x=>x[0])).size,12);
 let questions=new Set();for(const [id,anchor,src] of cases){
 const l=lessons[id];assert.ok(l,id);assert.ok(!l.essentialQuestion.startsWith('What does '),id);
 assert.ok(l.essentialQuestion.includes(anchor),id+' missing numerical question');
 assert.ok(!questions.has(l.essentialQuestion),id+' duplicate');questions.add(l.essentialQuestion);
 for(const key of ['reasoningSteps','labPlan']){const steps=l[key];assert.equal(steps.length,6,id);
 assert.ok(steps.every(s=>typeof s==='string'&&s.length>=145),id+' incomplete '+key);
 assert.ok(steps[5].includes('https://openstax.org/books/university-physics-volume-2/pages/'+src),id);
 assert.match(steps.join(' '),/inverse|reconstruct|recover/i,id);
 assert.match(steps.join(' '),/counterexample|falsif|invalid|false|incorrect|violat|error|contradiction/i,id);
 }
 assert.ok(l.verifiedBoundary&&l.starter&&l.technical&&l.memoryLadder&&l.vocabulary,id);
 }});
const numerical=[
 ['Kelvin endpoints and interval',()=>{near(18+273.15,291.15);near(23+273.15,296.15);near((23+273.15)-(18+273.15),5);}],
 ['sensible heat proportionality',()=>{near(.3*4180*4,5016);near(5016/(.3*4180),4);near(.6*4180*4,10032);}],
 ['ideal gas energy and pressure units',()=>{const p=3*8.314462618*320/.08;near(p,99773.551416);near(p*.08,3*8.314462618*320);near(3*8.314462618*320/.16,p/2);}],
 ['reversible entropy and inverse',()=>{near(900/450,2);near(2*450,900);near(900/300,3);}],
 ['closed system first law positive work',()=>{near(1200-500,700);near(700+500,1200);near(1200-1000,200);}],
 ['closed system first law incoming work',()=>{near(-450-(-200),-250);near(-250+(-200),-450);near(-450-(-500),50);}],
 ['steady conduction power and time',()=>{near(.8*.5*12/.04,120);near(120*600,72000);near(.8*.5*12/.08,60);}],
 ['signed heat cooling and mass sensitivity',()=>{near(.4*900*(-15),-5400);near(-5400/(.4*900),-15);near(.8*900*(-15),-10800);}],
 ['worst case thermometer intervals',()=>{near(21.5-20.5,1);near(22.5-19.5,3);near(21-20.5,.5);near(23-19.5,3.5);}],
 ['kelvin temperature percentage',()=>{near(-10+273.15,263.15);near(10+273.15,283.15);near((283.15-263.15)/263.15*100,20/263.15*100);}],
 ['water heat relative to reference',()=>{near(.25*4180*60,62700);near(1*4180*20,83600);near(.5*4180*20,41800);}],
 ['rigid ideal-gas pressure ratio',()=>{near(100*350/280,125);near(125*280/350,100);near(100*420/280,150);}]
];
for(const [title,fn] of numerical)test(title,fn);
