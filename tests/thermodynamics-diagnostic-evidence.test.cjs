'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','physics','thermodynamics.json'),'utf8'));
const cases=[
 ['physics-v09-scenario-analysis-first-law-of-thermodynamics','1,200 J','3-3-first-law-of-thermodynamics'],
 ['physics-v09-worked-example-heat','12,600 J','1-4-heat-transfer-specific-heat-and-calorimetry'],
 ['physics-v09-decision-lab-heat','50.4 kJ','1-4-heat-transfer-specific-heat-and-calorimetry'],
 ['physics-v09-failure-analysis-lab-temperature','20 °C','1-2-thermometers-and-temperature-scales'],
 ['physics-v09-teach-back-lab-temperature','41.8 kJ','1-4-heat-transfer-specific-heat-and-calorimetry'],
 ['physics-v09-evidence-verification-la-temperature-is-not-heat','40 °C','1-4-heat-transfer-specific-heat-and-calorimetry'],
 ['physics-v09-practical-lab-entropy','2/3 J/K','4-6-entropy'],
 ['physics-v09-quick-reference-first-law-of-thermodynamics','−300 J','3-3-first-law-of-thermodynamics'],
 ['physics-v09-design-review-first-law-of-thermodynamics','25%','4-2-heat-engines'],
 ['physics-v09-misconception-clinic-heat','4,180 J','1-4-heat-transfer-specific-heat-and-calorimetry'],
 ['physics-v09-recall-drill-heat','83.25 kJ','1-5-phase-changes'],
 ['physics-v09-scenario-analysis-temperature','10%','2-1-molecular-model-of-an-ideal-gas']
];
function near(a,b,t=1e-8){assert.ok(Number.isFinite(a));assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);}
test('twelve distinct authored diagnostic questions and six falsifiable reasoning/lab steps each',()=>{
 assert.equal(Object.keys(lessons).length,96);
 assert.equal(new Set(cases.map(c=>c[0])).size,12);
 const questions=new Set();
 for(const [id,number,ref] of cases){
  const lesson=lessons[id];assert.ok(lesson,'missing '+id);
  assert.ok(lesson.essentialQuestion.endsWith('?'),id);
  assert.doesNotMatch(lesson.essentialQuestion,/^What does /,id);
  assert.match(lesson.essentialQuestion,/[0-9]/,id);
  assert.ok(lesson.essentialQuestion.includes(number),id+' numerical concept absent from question');
  assert.ok(!questions.has(lesson.essentialQuestion),id+' duplicate');
  questions.add(lesson.essentialQuestion);
  for(const k of ['reasoningSteps','labPlan']){
   assert.equal(lesson[k].length,6,id+' '+k);
   assert.ok(lesson[k].every(s=>typeof s==='string'&&s.length>=250),id+' '+k);
   assert.equal(new Set(lesson[k]).size,6,id+' '+k+' duplicated');
   assert.match(lesson[k].join(' '),/inverse|reconstruct|recover|substitution/i,id+' '+k);
   assert.match(lesson[k].join(' '),/falsif|wrong|violat|error|counterexample/i,id+' '+k);
   assert.match(lesson[k][5],new RegExp('https://openstax\\.org/books/university-physics-volume-2/pages/'+ref+'(?:\\.|\\b)'),id+' '+k);
   assert.match(lesson[k].join(' '),/hypothetical|stipulat|offline|not a measurement|model/i,id+' '+k);
  }
  for(const k of ['verifiedBoundary','analogy','starter','technical','memoryLadder','vocabulary','video']){
   assert.ok(lesson[k],id+' preserved auxiliary field '+k);
  }
 }
});
test('closed system: heat in and system work out close first law with inverse',()=>{
 const Q=1200,W=350,U=Q-W;
 near(U,850);near(U+W,Q);near(Q-2*W,500);
 assert.notEqual(Q+W,U);
});
test('aluminum sensible heating respects mass, units, and inverse delta-T',()=>{
 const m=.35,c=900,dT=40,Q=m*c*dT;
 near(Q,12600);near(Q/(m*c),dT);near(.175*c*dT,Q/2);
});
test('heater energy delivery and losses sum to electrical input',()=>{
 const E=600*120,delivered=.7*E,lost=E-delivered;
 near(E,72000);near(delivered,50400);near(lost,21600);
 near(delivered+lost,E);near(.8*E,57600);
});
test('temperature offset changes ratio not Celsius/Kelvin intervals',()=>{
 const K=C=>C+273.15;
 near(K(20),293.15);near(K(40),313.15);near(K(40)-K(20),20);
 near(K(40)/K(20),313.15/293.15);
 assert.ok(Math.abs(K(40)/K(20)-2)>0.9);
});
test('identical mass and temperature rise do not imply identical heat flow',()=>{
 const m=1,dT=10,Al=m*900*dT,Water=m*4180*dT;
 near(Al,9000);near(Water,41800);near(Water/Al,4180/900);
 near(2*Water,83600);
});
test('calorimetry weighted equilibrium balances signed heat exactly',()=>{
 const c=4180,tf=(mh,Th,mc,Tc)=>(mh*Th+mc*Tc)/(mh+mc);
 near(tf(1,60,1,20),40);near(tf(1,60,2,20),100/3);
 near(1*c*(40-60)+1*c*(40-20),0);
});
test('hot and cold reservoir entropy balance is positive for heat down gradient',()=>{
 const dS=(Q,hot,cold)=>-Q/hot+Q/cold;
 near(dS(800,400,300),2/3);
 near(dS(800,400,320),.5);
 near(-800+800,0);assert.ok(dS(800,400,300)>0);
});
test('negative heat and positive work both decrease system internal energy',()=>{
 const Q=-200,W=100,U=Q-W;
 near(U,-300);near(U+W,Q);near(Q-0,-200);
 assert.notEqual(Q+W,U);
});
test('heat engine cycle conserves energy and measures input heat efficiency',()=>{
 const Qh=1000,Qc=750,W=Qh-Qc;
 near(W,250);near(W/Qh,.25);near(Qh-W,Qc);
 near((Qh-800)/Qh,.2);
});
test('cooling water requires negative signed heat, not positive energy gain',()=>{
 const m=.2,c=4180,Q=m*c*(-5);
 near(Q,-4180);near(-Q,4180);near(m*c*(-10),-8360);
});
test('fusion latent heat remains nonzero for zero temperature change',()=>{
 const m=.25,L=333000,Q=m*L;
 near(Q,83250);near(Q/L,.25);near(.1*L,33300);
 near(0,0);assert.notEqual(Q,m*4180*0);
});
test('rigid ideal-gas vessel scales absolute pressure with kelvin temperature',()=>{
 const P=101.3,T1=300,T2=330,after=P*T2/T1;
 near(after,111.43);near(after/P,1.1);near(after*(T1/T2),P);
 near(P*360/T1,121.56);assert.notEqual(T2/T1,(T2-273.15)/(T1-273.15));
});
test('all numbers and source claims are analytic rather than purported physical measurements',()=>{
 for(const [id] of cases){
  const text=[...lessons[id].reasoningSteps,...lessons[id].labPlan].join(' ');
  assert.doesNotMatch(text,/we measured on hardware|measured on our apparatus|confirmed experimentally by us/i,id);
  assert.match(text,/not a measurement|not a claim|hypothetical/i,id);
 }
});
