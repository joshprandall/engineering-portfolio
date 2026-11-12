'use strict';
// Synthetic, independently calculated mechanics counterexamples. Offline only.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../deep-learning/physics/mechanics.json'),'utf8'));
function close(a,b,t=1e-10){assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
const sources=[
  [
    "physics-v09-decision-lab-average-velocity",
    "3-1-position-displacement-and-average-velocity"
  ],
  [
    "physics-v09-design-review-torque-the-rotational-effect-of-force",
    "10-6-torque"
  ],
  [
    "physics-v09-teach-back-lab-newtonian-gravity",
    "13-1-newtons-law-of-universal-gravitation"
  ],
  [
    "physics-v09-failure-analysis-lab-newton-third-law",
    "5-5-newtons-third-law"
  ],
  [
    "physics-v09-quick-reference-predict-a-projectile-before-running-the-simulation",
    "4-3-projectile-motion"
  ],
  [
    "physics-v09-scenario-analysis-angular-momentum-2",
    "11-2-angular-momentum"
  ],
  [
    "physics-v10-mistake-hunt-momentum",
    "9-3-conservation-of-linear-momentum"
  ],
  [
    "physics-v10-worked-walkthrough-free-body-diagrams",
    "5-4-mass-and-weight"
  ],
  [
    "physics-v10-field-note-friction-forces",
    "6-2-friction"
  ],
  [
    "physics-v10-concept-mapping-lab-free-body-diagram",
    "6-2-friction"
  ],
  [
    "physics-v09-recall-drill-acceleration",
    "3-3-average-and-instantaneous-acceleration"
  ],
  [
    "physics-v10-reasoning-check-displacement-velocity-and-acceleration",
    "3-2-instantaneous-velocity-and-speed"
  ],
  [
    "physics-v10-prediction-lab-circular-motion-acceleration-without-changing-speed",
    "6-3-centripetal-force"
  ],
  [
    "physics-v09-worked-example-newton-second-law",
    "5-3-newtons-second-law"
  ]
];
function record(i){const [id,section]=sources[i];const rec=lessons[id];assert.ok(rec,`Missing ${id}`);assert.ok(Array.isArray(rec.reasoningSteps)&&Array.isArray(rec.labPlan));assert.ok(rec.reasoningSteps.join(' ').includes('https://openstax.org/books/university-physics-volume-1/pages/'+section));return rec;}
test("signed velocity versus speed",()=>{const rec=record(0);const d=8-3,t=5; close(d/t,1);close((8+3)/t,2.2);assert.match(rec.reasoningSteps.join(' '),/11 m/);});
test("torque direction is underdetermined without force orientation",()=>{const rec=record(1);const rx=.4,fy=50*.5;close(rx*fy,10);close(rx*(-fy),-10);assert.match(rec.reasoningSteps.join(' '),/sign needs an explicitly chosen rotation axis/);});
test("inverse-square force at 2r and 4r",()=>{const rec=record(2);const F=k=>80/k**2;close(F(2),20);close(F(4),5);assert.notEqual(F(4),20);});
test("third law unequal accelerations and zero net impulse",()=>{const rec=record(3);const m1=6,m2=12,f=48,dt=.125;close(f/m1,8);close(-f/m2,-4);close(m1*(f/m1)+m2*(-f/m2),0);close(f*dt+(-f)*dt,0);});
test("projectile range changes for lower landing elevation",()=>{const rec=record(4);const vx=14,vy=9.8,g=9.8,R=dy=>vx*(vy+Math.sqrt(vy*vy-2*g*dy))/g;close(R(0),28);close(R(-4.9),14*(1+Math.sqrt(2)));assert.match(rec.reasoningSteps.join(' '),/same launch and landing elevation/);});
test("angular momentum and rotational kinetic energy are distinct",()=>{const rec=record(5);const I=.75,w=8;close(I*w,6);close(I*w*w/2,24);assert.match(rec.reasoningSteps.join(' '),/principal fixed axis/);});
test("inelastic collision loses 98 over 3 joules",()=>{const rec=record(6);const m1=2,v1=6,m2=4,v2=-1,v=(m1*v1+m2*v2)/(m1+m2),Ki=(m1*v1*v1+m2*v2*v2)/2,Kf=(m1+m2)*v*v/2;close(v,4/3);close((m1+m2)*v,8);close(Ki,38);close(Kf,16/3);close(Ki-Kf,98/3);assert.match(rec.reasoningSteps.join(' '),/mechanical energy is not conserved/);});
test("normal force vanishes at loss of contact",()=>{const rec=record(7);const N=up=>Math.max(0,6*9.8-up);close(N(9),49.8);close(N(70),0);assert.match(rec.reasoningSteps.join(' '),/Contact is maintained/);});
test("kinetic friction reverses direction when motion reverses",()=>{const rec=record(8);const f=v=>-Math.sign(v)*.35*8*9.8;close(f(1),-27.44);close(f(-1),27.44);assert.match(rec.reasoningSteps.join(' '),/speed nonzero/);});
test("incline sliding acceleration changes sign with kinetic friction",()=>{const rec=record(9);const a=mu=>9.8*(.6-mu*.8);close(a(.25),3.92);close(a(.75),0);close(a(1),-1.96);assert.match(rec.reasoningSteps.join(' '),/Kinetic sliding assumed/);});
test("quadratic velocity derivative agrees with centered difference",()=>{const rec=record(10);const v=t=>5+6*t-.8*t*t,h=.001;close((v(5+h)-v(5-h))/(2*h),-2,1e-9);close(6-1.6*5,-2);});
test("positive displacement can coexist with negative instantaneous velocity",()=>{const rec=record(11);const dx=t=>2*t-.5*t*t,v=t=>2-t;close(dx(3),1.5);close(v(3),-1);assert.ok(dx(3)>0&&v(3)<0);});
test("centripetal acceleration is not angular frequency",()=>{const rec=record(12);const v=9,r=3;close(v*v/r,27);close(v/r,3);assert.notEqual(v*v/r,v/r);});
test("net horizontal force subtracts resistance",()=>{const rec=record(13);const drive=50,resist=14,m=9;close((drive-resist)/m,4);close(drive-resist,36);assert.notEqual(drive/m,4);});
