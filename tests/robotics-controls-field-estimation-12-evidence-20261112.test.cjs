'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,'../deep-learning/robotics/field-estimation.json'),'utf8'));
const ids=[
'robotics-controls-25-se2-composition-order',
'robotics-controls-26-timestamp-pose-skew',
'robotics-controls-27-encoder-modulo-rollover',
'robotics-controls-28-effective-track-calibration',
'robotics-controls-29-angular-innovation-gating',
'robotics-controls-30-delay-aware-stopping-bound',
'robotics-controls-31-encoder-clock-jitter',
'robotics-controls-32-pi-backcalculation',
'robotics-controls-33-independent-yaw-consistency',
'robotics-controls-34-three-point-linear-calibration',
'robotics-controls-35-shortest-heading-interpolation',
'robotics-controls-36-robust-pose-clearance'
];
const near=(x,y,tol=1e-9)=>assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=tol,'received '+x+' expected '+y);
const record=n=>pack[ids[n-25]];
const evidence=(n,...needles)=>{let text=record(n).reasoningSteps.join(' ');for(const needle of needles)assert.match(text,needle,'lesson '+n);};
const wrap=(d,m=360)=>((d+m/2)%m+m)%m-m/2;

test('exclusive synthetic pack retains ordered IDs, source links, falsification and dedicated offline labs',()=>{
 assert.deepEqual(Object.keys(pack),ids);
 const existingNames=new Set();
 for(let i=0;i<ids.length;i++){
   const l=pack[ids[i]];
   assert.ok(l.essentialQuestion.length>30&&l.verifiedBoundary.length>80);
   assert.match(l.technical.scope,/^Synthetic, offline educational case\./);
   assert.ok(!/agilityrobotics|private robot|company data/i.test(JSON.stringify(l)));
   assert.equal(l.reasoningSteps.length,6);
   assert.equal(l.labPlan.length,3);
   assert.equal(l.memoryLadder.length,4);
   assert.equal(l.vocabulary.length,2);
   assert.match(l.technical.scope,/https:\/\/(github\.com|docs\.wpilib\.org|itl\.nist\.gov|modernrobotics\.northwestern\.edu)\//);
   assert.match(l.reasoningSteps[4],/Counterexample:/);
   assert.match(l.reasoningSteps[5],/Source: https:\/\//);
   assert.ok(!existingNames.has(l.essentialQuestion));
   existingNames.add(l.essentialQuestion);
 }
});

const rot=(p,a)=>[Math.cos(a)*p[0]-Math.sin(a)*p[1],Math.sin(a)*p[0]+Math.cos(a)*p[1]];
const compose=(a,b)=>{const t=rot(b.t,a.yaw);return {t:[a.t[0]+t[0],a.t[1]+t[1]],yaw:a.yaw+b.yaw};};
test('25: frame-composition order yields distinct translated positions',()=>{
 const a={t:[1,2],yaw:Math.PI/2},b={t:[.2,.1],yaw:-Math.PI/6};
 const ab=compose(a,b),ba=compose(b,a);
 near(ab.t[0],.9);near(ab.t[1],2.2);near(ab.yaw,Math.PI/3);
 near(ba.t[0],2.0660254037844386);near(ba.t[1],1.3320508075688772);
 assert.ok(Math.hypot(ab.t[0]-ba.t[0],ab.t[1]-ba.t[1])>1);
 evidence(25,/2\.066025404/,/1\.332050808/,/0\.9,2\.2/);
});

test('26: time-skew error is signed and acceleration breaks linear interpolation',()=>{
 const p=t=>.5*(t-4);
 near(p(4),0);near(p(4.05),.025);near(p(4.1),.05);
 const accelerated=t=>t*t;
 near((accelerated(0)+accelerated(.1))/2-accelerated(.05),.0025);
 evidence(26,/0\.050.m/,/0\.025.m/,/0\.0025.m/);
});

const modulo=(v,m)=>((v%m)+m)%m;
function shortDelta(a,b,M){if(M<=0||M%2!==0)throw new RangeError('even positive modulus');const r=modulo(b-a+M/2,M)-M/2;if(Math.abs(r)===M/2)throw new RangeError('direction tie');return r;}
test('27: modulo counter recovers small forward/reverse steps but refuses half-range tie',()=>{
 near(shortDelta(4090,6,4096),12);
 near(shortDelta(6,4090,4096),-12);
 near(shortDelta(4090,6,4096)*2*Math.PI*.05/4096,.0009203884727313847);
 assert.equal(modulo(4090+12,4096),modulo(4090-4084,4096));
 assert.throws(()=>shortDelta(0,2048,4096),RangeError);
 evidence(27,/0\.000920388473/,/4084/,/2048-count/);
});

test('28: yaw-based effective-track reconstruction and zero-turn reject',()=>{
 const fit=(left,right,heading)=>{if(heading===0)throw new RangeError('unidentifiable');return (right-left)/heading;};
 near(fit(.45,.55,.25),.4);
 near((.55-.45)/.5,.2);
 near(fit(.55,.45,-.25),.4);
 assert.throws(()=>fit(.45,.55,0),RangeError);
 evidence(28,/0\.40.m/,/0\.20.rad/,/20%/);
});

test('29: independent-variance angular gate distinguishes two synthetic observations',()=>{
 const z=(actual,pred=20,P=9,R=4)=>Math.abs(wrap(actual-pred))/Math.sqrt(P+R);
 near(z(24),1.1094003924504583);
 near(z(36),4.437601569801833);
 near(z(16),z(24));
 near(Math.sqrt(9+4-2*2),3);
 assert.ok(z(24)<2&&z(36)>2);
 evidence(29,/1\.109400392/,/4\.437601570/,/covariance/);
});

test('30: latency plus braking travels farther than braking alone',()=>{
 const stop=(v,tau,a)=>{if(v<0||tau<0||a<=0)throw new RangeError('constraints');return {delay:v*tau,brake:v*v/(2*a),duration:tau+v/a};};
 const s=stop(1,.1,2);
 near(s.delay,.1);near(s.brake,.25);near(s.delay+s.brake,.35);near(s.duration,.6);
 assert.ok(.3<s.delay+s.brake&&.4>s.delay+s.brake);
 assert.throws(()=>stop(1,.1,0),RangeError);
 evidence(30,/0\.35.m/,/0\.25.m/,/0\.60.s/);
});

test('31: actual acquisition interval corrects nominal-period speed error',()=>{
 const speed=(ds,t0,t1)=>{if(t1<=t0)throw new RangeError('timestamps');return ds/(t1-t0);};
 near(speed(.02,1,1.08),.25,1e-12);
 near(.02/.1,.2);near((.02/.1)*.08,.016);
 near(speed(.02,1,1.12),1/6);
 assert.throws(()=>speed(.02,1,1),RangeError);
 evidence(31,/0\.250.m\/s/,/0\.200.m\/s/,/0\.166666667/);
});

const clip=u=>Math.max(-1,Math.min(1,u));
const piBack=(I,e,Kp=2,Ki=1,Kaw=2,dt=.1)=>{const raw=Kp*e+I;return {raw,applied:clip(raw),next:I+Ki*e*dt+Kaw*(clip(raw)-raw)*dt};};
test('32: saturation-feedback integral correction has sign-symmetric behavior',()=>{
 const pos=piBack(.5,1),neg=piBack(-.5,-1);
 near(pos.raw,2.5);near(pos.applied,1);near(pos.next,.3);
 near(neg.raw,-2.5);near(neg.applied,-1);near(neg.next,-.3);
 near(piBack(.5,1,2,1,0).next,.6);
 evidence(32,/I_next=0\.5\+0\.1-0\.3/,/I_next=\+0\.9/,/I_next=-0\.3/);
});

test('33: gyro/wheel consistency gate cannot identify the cause of disagreement',()=>{
 const wheel=(.3-.2)/.5,gyro=.1;
 near(wheel,.2);near(wheel-gyro,.1);
 const sigma=Math.hypot(.03,.03),z=Math.abs(wheel-gyro)/sigma;
 near(sigma,.042426406871192854);near(z,2.3570226039551585);
 assert.ok(z>2);
 near((wheel-wheel)/sigma,0);
 evidence(33,/2\.357022604/,/0\.042426407/,/common/);
});

test('34: three-point least squares retains nonzero falsifying residuals',()=>{
 const x=[0,1,2],y=[.1,1,2.1],xm=x.reduce((s,v)=>s+v,0)/3,ym=y.reduce((s,v)=>s+v,0)/3;
 const slope=x.reduce((s,v,i)=>s+(v-xm)*(y[i]-ym),0)/x.reduce((s,v)=>s+(v-xm)**2,0);
 const offset=ym-slope*xm,r=y.map((v,i)=>v-(slope*x[i]+offset));
 const sse=r.reduce((s,v)=>s+v*v,0);
 near(slope,1);near(offset,1/15);
 r.forEach((v,i)=>near(v,[1/30,-2/30,1/30][i]));
 near(sse,1/150);near(Math.sqrt(sse/3),Math.sqrt(1/450));
 near(y[1]-(x[1]+.1),-.1);
 evidence(34,/0\.006666667/,/0\.047140452/,/-0\.10.m/);
});

test('35: shortest-arc heading interpolation avoids long-way rotation',()=>{
 const lerp=(a,b,f)=>wrap(a+f*wrap(b-a));
 near(lerp(170,-170,.25),175);near(lerp(170,-170,.75),-175);
 near(lerp(170,-170,1),-170);
 near(.75*170+.25*(-170),85);
 assert.equal(Math.abs(wrap(180-0)),180);
 evidence(35,/\+175°/,/-175°/,/\+85°/);
});

test('36: deterministic localization uncertainty changes signed obstacle clearance',()=>{
 const margin=(estimate,error,radius,boundary)=>boundary-estimate-error-radius;
 near(margin(.7,.15,.2,1),-.05);
 near(margin(.6,.15,.2,1),.05);
 near(margin(.7,0,.2,1),.1);
 assert.ok(margin(.7,.15,.2,1)<0);
 evidence(36,/1\.05.m/,/0\.95.m/,/0\.10.m/);
});
