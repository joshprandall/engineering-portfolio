'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'../deep-learning/robotics/advanced-controls.json'),'utf8'));
const ids=Array.from({length:12},(_,i)=>String(13+i));
const entries=Object.entries(lessons);
const near=(actual,expected,tol=1e-9)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tol,'computed '+actual+', expected '+expected);
const record=n=>{const entry=entries[n-13];assert.ok(entry&&entry[0].startsWith('robotics-controls-'+n+'-'));return entry[1];};
const prove=(n,pattern)=>assert.match(record(n).reasoningSteps.join(' '),pattern,'teaching evidence '+n);
const lab=(n,pattern)=>assert.match(record(n).labPlan.join(' '),pattern,'lab evidence '+n);
test('twelve distinct original records preserve schema, source, offline scope and falsification',()=>{
 assert.equal(entries.length,12);assert.equal(new Set(entries.map(([key])=>key)).size,12);
 for(let n=13;n<=24;n++){
  const v=record(n);
  for(const key of ['essentialQuestion','verifiedBoundary','analogy','technical','starter','memoryLadder','vocabulary'])assert.ok(v[key],n+' '+key);
  assert.equal(v.reasoningSteps.length,6);
  assert.ok(v.labPlan.length>=3);
  assert.equal(v.vocabulary.length,2);
  assert.match(v.technical.scope,/^Synthetic, offline educational case/);
  assert.match(v.technical.versionCaution,/No real robot actuation/);
  assert.match(v.reasoningSteps[5],/https:\/\//);
  assert.match(v.reasoningSteps.join(' '),/Counterexample|counterexample/);
 }
});
test('13: gyro stationary bias accumulates at correct angular rate',()=>{
 let integrated=0;for(let n=0;n<600;n++)integrated+=.5*.1;
 near(integrated,30);near((.4+.5+.6)/3,.5);near(-.25*60,-15);
 prove(13,/30\.0° spurious heading/);
 lab(13,/600 constant/);
});
const wrap=angle=>((angle+180)%360+360)%360-180;
test('14: heading innovation crosses branch cut by the short route',()=>{
 near(wrap(-358),2);near(wrap(358),-2);
 near(179+.1*wrap(-358),179.2);near(-179+.1*wrap(358),-179.2);
 near(.9*179+.1*-179,143.2);
 prove(14,/false 35\.8° correction/);
 lab(14,/143\.2° arithmetic average/);
});
test('15: two equal range circles yield reflected, not unique, robot coordinates',()=>{
 const d=4,r2=13,x=(r2-r2+d*d)/(2*d),y=Math.sqrt(r2-x*x);
 near(x,2);near(y,3);
 near(Math.hypot(x,y-4),Math.sqrt(5));near(Math.hypot(x,-y-4),Math.sqrt(53));
 prove(15,/two valid candidate locations/);lab(15,/no-intersection/);
});
test('16: single-pole exact discretization differs from implicit Euler',()=>{
 const a=1-Math.exp(-.1/.4),b=.1/(.4+.1);
 let exact=0,euler=0;for(let k=0;k<3;k++){exact+=a*(1-exact);euler+=b*(1-euler);}
 near(a,.22119921692859512);near(exact,1-Math.exp(-.75));near(euler,.488);
 near(exact-euler,.03963344725898527);
 prove(16,/0\.527633447/);prove(16,/0\.488/);
});
const slew=(current,target,dt,rate)=>current+Math.min(rate*dt,Math.max(-rate*dt,target-current));
test('17: velocity-command slew bounds forward and reverse transitions',()=>{
 let v=0;for(const expected of [.2,.4,.6,.8,1]){v=slew(v,1,.1,2);near(v,expected);}
 v=slew(v,-1,.1,2);near(v,.8);
 for(let k=1;k<10;k++)v=slew(v,-1,.1,2);
 near(v,-1);assert.ok(2/.1>2);
 prove(17,/factor of ten/);lab(17,/first value \+0\.8 m\/s/);
});
test('18: derivative-on-error setpoint kick differs from derivative-on-measurement',()=>{
 const kd=.1,dt=.02,y0=0,y1=0,r0=0,r1=1;
 near(kd*((r1-y1)-(r0-y0))/dt,5);
 near(-kd*(y1-y0)/dt,0);
 near(-kd*.01/dt,-.05);
 prove(18,/measured robot position did not move/);lab(18,/respective terms \+5 and 0/);
});
test('19: one-step delayed integrator has a stricter stable gain region',()=>{
 let previous=0,current=0;const got=[];
 for(let i=0;i<4;i++){const next=current+.5*(1-previous);got.push(next);previous=current;current=next;}
 [.5,1,1.25,1.25].forEach((v,i)=>near(got[i],v));
 near(Math.hypot(.5,.5),Math.sqrt(.5));
 assert.ok(Math.sqrt(1.2)>1&&Math.abs(1-1.2)<1);
 prove(19,/1\.095445115>1/);lab(19,/marginal/);
});
test('20: stale heartbeat reaches a latched stop exactly on the timeout boundary',()=>{
 const timeout=100;let last=20,state='READY';
 const check=t=>{if(state==='READY'&&t-last>=timeout)state='STOP_LATCHED';};
 check(100);assert.equal(state,'READY');check(120);assert.equal(state,'STOP_LATCHED');
 last=140;check(140);assert.equal(state,'STOP_LATCHED');
 assert.ok(120-20===timeout);
 prove(20,/predicate elapsed>=100 ms/);lab(20,/non-monotonic event timestamps/);
});
const intersects=(a,b,c,d)=>Math.max(a,c)<=Math.min(b,d);
test('21: swept collision catches obstacle between clear sampled endpoints',()=>{
 const expanded=[.48-.05,.52+.05];
 near(expanded[0],.43);near(expanded[1],.57);
 assert.ok(intersects(0,1,...expanded));
 for(const x of [0,.2,.4,.6,.8,1])assert.ok(!intersects(x,x,...expanded));
 assert.ok(!intersects(0,1,1.15,1.35));
 prove(21,/Both sampled endpoints/);lab(21,/touching the expanded boundary/);
});
test('22: rounded encoder difference admits nearly a full count error',()=>{
 const pitch=2*Math.PI*.05/2048;
 near(pitch,.00015339807878856412);
 near(pitch*100,.015339807878856412);
 const counted=Math.round(199.51)-Math.round(100.49);
 near(counted,100);near(counted-(199.51-100.49),.98);
 assert.ok(.98>.5&&.98<1);
 prove(22,/error of \+0\.98 count/);lab(22,/half a count/);
});
test('23: wheel radius mismatch induces yaw and lateral odometry drift',()=>{
 const left=1,right=1.02,track=.5,ds=(left+right)/2,yaw=(right-left)/track;
 near(yaw,.04);
 near(ds*Math.sin(yaw)/yaw,1.0097306882125126,1e-12);
 near(ds*(1-Math.cos(yaw))/yaw,.020197306810307625,1e-12);
 near((left-right)/track,-.04);
 prove(23,/25\.25 m/);lab(23,/negative lateral drift/);
});
test('24: rigid rotation transforms covariance, not deterministic translation',()=>{
 const c=Math.cos(Math.PI/2),s=Math.sin(Math.PI/2),a=.04,b=.01;
 const xx=c*c*a+s*s*b,yy=s*s*a+c*c*b,xy=c*s*(a-b);
 near(xx,.01);near(yy,.04);near(xy,0);
 near(xx+yy,.05);near(xx*yy-xy*xy,.0004);
 prove(24,/diag\(0\.01,0\.04\)/);lab(24,/translation and assert covariance unchanged/);
});
