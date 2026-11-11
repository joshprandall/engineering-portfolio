'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','physics','thermodynamics.json'),'utf8'));
const ids=[
 'physics-entropy','physics-heat-temp','physics-ideal-gas','physics-v08-deep-dive-temperature',
 'physics-v08-evidence-lab-temperature','physics-v08-deep-dive-heat',
 'physics-v08-evidence-lab-heat','physics-v08-deep-dive-first-law-of-thermodynamics',
 'physics-v08-evidence-lab-first-law-of-thermodynamics','physics-v09-misconception-clinic-entropy',
 'physics-v09-recall-drill-first-law-of-thermodynamics','physics-v09-troubleshooting-lab-the-ideal-gas-law'
];
function near(actual,expected,tolerance=1e-8){
 assert.ok(Number.isFinite(actual),'non-finite calculated value: '+actual);
 assert.ok(Math.abs(actual-expected)<=tolerance,actual+' != '+expected);
}
test('all 96 lessons retained; twelve authored fields are complete, distinct, scoped and falsifiable',()=>{
 assert.equal(Object.keys(lessons).length,96);
 assert.equal(new Set(ids).size,12);
 const questions=new Set();
 for(const id of ids){
  const lesson=lessons[id];assert.ok(lesson,'missing '+id);
  assert.ok(lesson.essentialQuestion.endsWith('?'),id);
  assert.doesNotMatch(lesson.essentialQuestion,/^What does /,id);
  assert.ok(!questions.has(lesson.essentialQuestion),'duplicate question '+id);
  questions.add(lesson.essentialQuestion);
  for(const key of ['reasoningSteps','labPlan']){
   assert.equal(lesson[key].length,6,id+' '+key);
   assert.equal(new Set(lesson[key]).size,6,id+' '+key);
   assert.ok(lesson[key].every(s=>s.length>=110),id+' '+key);
   assert.ok(lesson[key].some(s=>/Adversarial|Failure-mode|counterexample/i.test(s)),id+' '+key);
  }
  assert.match(lesson.reasoningSteps[5],/https:\/\/openstax\.org\/books\/university-physics-volume-2\/pages\//,id);
  assert.match(lesson.labPlan[5],/https:\/\/openstax\.org\/books\/university-physics-volume-2\/pages\//,id);
  assert.match(lesson.reasoningSteps.join(' '),/synthetic|model|stipulated|hypothetical|assume|illustrative/i,id);
  for(const key of ['verifiedBoundary','analogy','starter','technical','memoryLadder','vocabulary','video']){
   assert.ok(lesson[key],id+' '+key+' must remain intact');
  }
  assert.doesNotMatch(lesson.reasoningSteps.join(' ')+' '+lesson.labPlan.join(' '),/we measured on hardware|confirmed in a laboratory|real sensor reading/i,id);
 }
});
test('reversible isothermal entropy uses absolute temperature and inverse Q check',()=>{
 const entropy=(Q,T)=>Q/T;
 near(entropy(600,300),2);near(entropy(600,400),1.5);
 near(entropy(600,300)*300,600);near(entropy(-600,300),-2);
 assert.notEqual(entropy(600,300),entropy(600,400));
});
test('calorimetry respects heat-capacity units and changing sample mass',()=>{
 const heat=(mass,capacity,deltaT)=>mass*capacity*deltaT;
 near(heat(.5,4180,10),20900);
 near(heat(1,4180,10),41800);
 near(heat(.5,4180,5),10450);
 near(heat(.5,4180,10)/(.5*4180),10);
});
test('ideal gas pressure and inverse PV both agree in SI units',()=>{
 const R=8.314462618, P=(n,T,V)=>n*R*T/V;
 near(P(2,300,.05),99773.551416,1e-7);
 near(P(2,300,.1),49886.775708,1e-7);
 near(P(2,300,.05)*.05,2*R*300);
 near(P(2,600,.05),2*P(2,300,.05));
});
test('Celsius-Kelvin conversions preserve intervals but not absolute ratios',()=>{
 const K=C=>C+273.15, C=K=>K-273.15;
 near(K(25),298.15);near(K(-10),263.15);
 near(C(2*K(25)),323.15);near(C(K(-10)),-10);
 near(K(25)-K(-10),35);assert.notEqual(C(2*K(25)),50);
});
test('insulated water mixing conserves energy and responds to unequal masses',()=>{
 const final=(mh,th,mc,tc)=>(mh*th+mc*tc)/(mh+mc);
 near(final(.2,80,.2,20),50);
 near(final(.4,80,.2,20),60);
 const Tf=final(.2,80,.2,20);
 near(.2*4180*(Tf-80)+.2*4180*(Tf-20),0);
});
test('constant thermal power integrates to joules, not degrees',()=>{
 const Q=(P,seconds)=>P*seconds;
 near(Q(120,100),12000);near(Q(80,100),8000);
 near(Q(120,200),24000);near(Q(120,100)/100,120);
});
test('steady one-dimensional slab conduction predicts inverse-thickness scaling',()=>{
 const transfer=(k,A,deltaT,L,seconds)=>k*A*deltaT*seconds/L;
 near(transfer(.8,.5,20,.1,300),24000);
 near(transfer(.8,.5,20,.2,300),12000);
 near(transfer(.8,.5,20,.05,300),48000);
 near(transfer(.8,.5,20,.1,300)/300,80);
});
test('first-law work-by sign convention supports positive, negative and work-on cases',()=>{
 const dU=(Q,Wby)=>Q-Wby;
 near(dU(750,200),550);near(dU(750,800),-50);
 near(dU(750,-200),950);near(dU(750,200)+200,750);
});
test('rigid monatomic ideal gas has zero boundary work and correct heat capacity',()=>{
 const R=8.314462618;
 const deltaT=(Q,n)=>Q/(1.5*n*R);
 near(deltaT(500,1),40.09078501498091,1e-8);
 near(deltaT(500,2),deltaT(500,1)/2);
 near(deltaT(1000,1),deltaT(500,1)*2);
 near(1.5*R*deltaT(500,1),500);
});
test('hot-to-cold reservoir entropy production is positive for isolated transfer',()=>{
 const total=(Q,Th,Tc)=>-Q/Th+Q/Tc;
 near(total(1000,400,300),5/6);
 near(total(1000,400,350),5/14,1e-12);
 near(total(1000,300,400),-5/6);
 assert.ok(total(1000,400,300)>0);
});
test('complete thermodynamic cycle has zero internal-energy change',()=>{
 const Q=400,W=400;near(Q-W,0);
 const legs=[120,-70,-50];near(legs.reduce((a,b)=>a+b,0),0);
 near(250-250,0);assert.notEqual(400-200,0);
});
test('Kelvin conversion rejects gas-law pressure underestimation by >11x',()=>{
 const R=8.314462618,n=1,V=.024;
 const P=T=>n*R*T/V;
 near(P(300.15),103982.74811636249,1e-8);
 near(P(27),9353.77044525,1e-8);
 near(P(300.15)/P(27),300.15/27,1e-10);
 near(P(300.15)*V,n*R*300.15,1e-9);
});
test('entropy, temperature and first-law source references use the intended chapters',()=>{
 assert.match(lessons['physics-entropy'].reasoningSteps[5],/4-6-entropy/);
 assert.match(lessons['physics-ideal-gas'].reasoningSteps[5],/2-1-molecular-model/);
 assert.match(lessons['physics-v08-deep-dive-first-law-of-thermodynamics'].reasoningSteps[5],/3-3-first-law/);
 assert.match(lessons['physics-v08-evidence-lab-heat'].reasoningSteps[5],/1-6-mechanisms-of-heat-transfer/);
});
