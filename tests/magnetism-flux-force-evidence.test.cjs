'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','physics','magnetism.json'),'utf8'));
const ids=[
'physics-faraday','physics-magnetic-force','physics-v06-magnetic-force-on-a-charge',
'physics-v06-faraday-s-law','physics-v08-deep-dive-magnetic-force-on-moving-charge',
'physics-v08-evidence-lab-magnetic-force-on-moving-charge','physics-v08-deep-dive-faraday-law',
'physics-v08-evidence-lab-faraday-law','physics-v09-teach-back-lab-faraday-law',
'physics-v09-evidence-verification-la-faraday-law','physics-v09-troubleshooting-lab-faraday-s-law',
'physics-v09-practical-lab-faraday-s-law-changing-magnetic-flux-creates-emf'
];
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol,String(a)+' != '+String(b));
test('97 magnetism records retained; twelve distinctly authored scientific lessons',()=>{
 assert.equal(Object.keys(data).length,97);assert.equal(new Set(ids).size,12);
 const qs=new Set();
 for(const id of ids){
  const lesson=data[id];assert.ok(lesson,id);
  assert.match(lesson.essentialQuestion,/\?$/);
  assert.doesNotMatch(lesson.essentialQuestion,/^What does /);
  assert.ok(!qs.has(lesson.essentialQuestion),id);qs.add(lesson.essentialQuestion);
  assert.equal(lesson.reasoningSteps.length,6,id);
  assert.equal(lesson.labPlan.length,6,id);
  assert.equal(new Set(lesson.reasoningSteps).size,6,id);
  assert.equal(new Set(lesson.labPlan).size,6,id);
  assert.ok(lesson.reasoningSteps.every(x=>x.length>=105),id+': reasoning detail');
  assert.ok(lesson.labPlan.every(x=>x.length>=110),id+': offline exercise detail');
  assert.match(lesson.reasoningSteps[5],/https:\/\/openstax.org\/books\/university-physics-volume-2\/pages\//);
  for(const field of ['verifiedBoundary','analogy','starter','technical','memoryLadder','vocabulary','video'])assert.ok(lesson[field],id+': preserved '+field);
  assert.doesNotMatch([...lesson.reasoningSteps,...lesson.labPlan].join(' '),/we measured on hardware|validated on the real coil|confirmed in production/);
 }
});
test('20-turn coil: 0.012 Wb per turn in 0.2 s induces -1.2 V',()=>{near((.4-.1)*.04,.012);near(-20*(.4-.1)*.04/.2,-1.2)});
test('cross product: x velocity and y field give positive z force',()=>{
 const q=2e-6,v=[3,0,0],b=[0,.5,0];
 const F=[v[1]*b[2]-v[2]*b[1],v[2]*b[0]-v[0]*b[2],v[0]*b[1]-v[1]*b[0]].map(x=>x*q);
 assert.deepEqual(F,[0,0,3e-6]);near(F.reduce((s,x,i)=>s+x*v[i],0),0);
});
test('force has sine-angle dependence for 0, 30 and 90 degrees',()=>{
 const F=t=>4e-6*5*.2*Math.sin(t*Math.PI/180);
 near(F(0),0);near(F(30),2e-6);near(F(90),4e-6);
});
test('coil rotation produces +0.4 V despite unchanging B',()=>{
 const phi=t=>.4*.1*Math.cos(t*Math.PI/180);
 near(phi(0),.04);near(phi(60),.02);near(-10*(phi(60)-phi(0))/.5,.4);
});
test('electron force and curvature follow charge sign and inverse B',()=>{
 const mass=9.11e-31,q=1.602e-19,v=2e6,B=.02;
 near(q*v*B,6.408e-15,1e-22);
 near(mass*v/(q*B),5.68664e-4,1e-9);
 near((mass*v/(q*2*B))/(mass*v/(q*B)),.5);
});
test('transverse-force scaling is proportional to B; parallel force vanishes',()=>{
 const F=(q,v,B,t)=>q*v*B*Math.sin(t);
 near(F(1e-6,4,.3,Math.PI/2),1.2e-6);
 near(F(1e-6,4,.6,Math.PI/2),2.4e-6);near(F(1e-6,4,.3,0),0);
});
test('changing coil area with fixed field creates average 3 V',()=>{
 near(-30*.5*(.03-.08)/.25,3);
 assert.match(data[ids[6]].labPlan.join(' '),/B-change-only algorithm/);
});
test('decreasing-field emf sign reverses on rising field and vanishes on hold',()=>{
 const e=(b1,b2)=>-100*.01*(b2-b1)/.1;
 near(e(.1,.06),.4);near(e(.06,.1),-.4);near(e(.06,.06),0);
});
test('five-turn teach-back separates open emf from closed-circuit current',()=>{
 near(-5*.02*(.15-.25)/.05,.2);
 assert.match(data[ids[8]].reasoningSteps.join(' '),/open-circuit/);
});
test('50-turn field-ramp rate and endpoint forms agree but are not independent evidence',()=>{
 const N=50,A=.02,rate=.4,time=.5;
 near(N*A*rate,.4);near(N*A*(rate*time)/time,.4);
 assert.match(data[ids[9]].reasoningSteps.join(' '),/not independent laboratory validation/);
});
test('missing ten-turn factor explains 0.08 V instead of 0.8 V',()=>{
 const single=.04*.2/.1;near(single,.08);near(single*10,.8);near(single*20,1.6);
});
test('field-ramp reversal changes polarity and half-speed change halves magnitude',()=>{
 const e=(dB,dt)=>-80*.01*dB/dt;
 near(e(.3,.4),-.6);near(e(-.3,.4),.6);
 near(e(.3,.8),-.3);near(e(0,.4),0);
});
