'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const files=['controls.json','advanced-controls.json','field-estimation.json'];
const pack=files.map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,'../deep-learning/robotics',f),'utf8')));
const records=Object.assign({},...pack);
const get=n=>{
 const prefix='robotics-controls-'+String(n).padStart(2,'0')+'-';
 const entries=Object.entries(records).filter(([id])=>id.startsWith(prefix));
 assert.equal(entries.length,1,'unique lesson '+n);
 return entries[0][1];
};
const near=(a,b,tol=1e-9)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,'expected '+b+', got '+a);
const wrap=x=>((x+180)%360+360)%360-180;
const rotate=(p,t)=>[Math.cos(t)*p[0]-Math.sin(t)*p[1],Math.sin(t)*p[0]+Math.cos(t)*p[1]];
const compose=(a,b)=>{const t=rotate([b[0],b[1]],a[2]);return [a[0]+t[0],a[1]+t[1],a[2]+b[2]];};
test('36 independent robotics records are original, ordered, referenced and synthetic',()=>{
 assert.deepEqual(pack.map(p=>Object.keys(p).length),[12,12,12]);
 assert.equal(Object.keys(records).length,36);
 for(let i=1;i<=36;i++){
  const l=get(i);assert.equal(l.reasoningSteps.length,6);assert.ok(l.labPlan.length>=3);
  assert.match(l.technical.scope,/Synthetic, offline educational case/);
  assert.match(l.reasoningSteps.join(' '),/https:\/\//);
  assert.match(l.reasoningSteps.join(' '),/Counterexample|Falsifiable/i);
  assert.doesNotMatch(JSON.stringify(l),/agilityrobotics|private company network/i);
 }
 assert.doesNotMatch(get(1).reasoningSteps.join(' '),/osrobotics\.org/);
 assert.match(get(1).reasoningSteps[5],/modernrobotics\.northwestern\.edu/);
});
test('25: transform associativity, inverse rotation and order sensitivity',()=>{
 const A=[1,2,Math.PI/2],B=[.2,.1,-Math.PI/6],C=[-.4,.3,.13];
 const AB=compose(A,B),BA=compose(B,A);
 near(AB[0],.9);near(AB[1],2.2);near(AB[2],Math.PI/3);
 near(BA[0],2.0660254037844384);near(BA[1],1.3320508075688775);
 for(const a of [-Math.PI,-.4,0,1.1,Math.PI]){
  const T=[1.5,-.7,a],left=compose(compose(T,B),C),right=compose(T,compose(B,C));
  left.forEach((v,i)=>near(v,right[i]));
  const neg=rotate([-T[0],-T[1]],-a),identity=compose(T,[neg[0],neg[1],-a]);
  identity.forEach(v=>near(v,0));
 }
 assert.match(get(25).reasoningSteps.join(' '),/noncommut|not.*same|reversed composition/i);
});
test('26: constant-velocity interpolation and accelerating counterexample',()=>{
 const p=t=>.5*(t-4);
 near(p(4.05),.025);near((p(4)+p(4.10))/2,p(4.05));
 near((0**2+.1**2)/2-.05**2,.0025);
 near(-.5*.1,-.05);
 assert.match(get(26).reasoningSteps.join(' '),/accelerated displacement/);
});
test('27: shortest modular encoder delta, alias and exact tie rejection',()=>{
 const M=4096;
 const delta=(a,b)=>{const d=((b-a)%M+M)%M;if(d===M/2)throw new RangeError();return d>M/2?d-M:d;};
 near(delta(4090,6),12);near(delta(6,4090),-12);
 near(12*2*Math.PI*.05/M,.0009203884727313846,1e-12);
 for(const k of [-3,-1,0,2,5])near(delta(4090,6+k*M),12);
 assert.throws(()=>delta(0,2048),RangeError);
 assert.equal((4090+12)%M,(4090-4084+2*M)%M);
 assert.match(get(27).reasoningSteps.join(' '),/2048-count/);
});
test('28: effective track is signed and ill-conditioned at small yaw',()=>{
 const track=(l,r,t)=>{if(!t)throw new RangeError();return (r-l)/t;};
 near(track(.45,.55,.25),.4);near(track(.55,.45,-.25),.4);
 near((.55-.45)/.5,.2);near((.55-.45)/.01,10);
 assert.throws(()=>track(.45,.55,0),RangeError);
});
test('29: wrapped innovation and correlated variance counterexample',()=>{
 const score=(a,b,P,R,C=0)=>Math.abs(wrap(b-a))/Math.sqrt(P+R-2*C);
 near(score(20,24,9,4),4/Math.sqrt(13));
 near(score(20,36,9,4),16/Math.sqrt(13));
 near(score(179,-177,9,4),4/Math.sqrt(13));
 near(score(20,24,9,4,2),4/3);
 assert.ok(score(20,24,9,4)<2&&score(20,36,9,4)>2);
 assert.match(get(29).reasoningSteps.join(' '),/covariance C=2/);
});
test('30: stopping bound includes reaction time and decreases with braking',()=>{
 const stop=(v,t,a)=>{if(v<0||t<0||a<=0)throw new RangeError();return v*t+v*v/(2*a);};
 near(stop(1,.1,2),.35);near(stop(1,0,2),.25);near(stop(1,.2,2)-stop(1,.1,2),.1);
 assert.ok(stop(1,.1,2)>.3&&stop(1,.1,2)<.4);
 assert.throws(()=>stop(1,.1,0),RangeError);
 assert.match(get(30).reasoningSteps.join(' '),/reaction latency/);
});
test('31: measured timebase, nominal-time error and timestamp rejection',()=>{
 const speed=(d,t0,t1)=>{if(!(t1>t0))throw new RangeError();return d/(t1-t0);};
 near(speed(.02,1,1.08),.25);near(speed(.02,1,1.12),1/6);
 near(.02/.1,.2);near(.25*.08,.02);near(.2*.08,.016);
 assert.throws(()=>speed(.02,1,1),RangeError);
 assert.throws(()=>speed(.02,1,.99),RangeError);
});
test('32: saturation feedback sign and update ordering',()=>{
 const next=(e,I,k)=>{const raw=2*e+I,sat=Math.max(-1,Math.min(1,raw));return [raw,sat,I+e*.1+k*(sat-raw)*.1];};
 const p=next(1,.5,2),n=next(-1,-.5,2);
 near(p[0],2.5);near(p[1],1);near(p[2],.3);near(n[2],-.3);
 near(next(1,.5,0)[2],.6);assert.ok(next(1,.5,-2)[2]>.6);
 assert.match(get(32).reasoningSteps.join(' '),/residual sign/);
});
test('33: independent-sensor consistency is not ground truth',()=>{
 const wheel=(.3-.2)/.5,sigma=Math.hypot(.03,.03);
 near(wheel,.2);near((wheel-.1)/sigma,2.3570226039551585);
 assert.ok(wheel-.1>2*sigma);near(.2-.2,0);
 assert.match(get(33).reasoningSteps.join(' '),/systematic error/);
});
test('34: least squares normal equations, residuals and lack of exact fit',()=>{
 const x=[0,1,2],y=[.1,1,2.1],xm=1,ym=y.reduce((a,b)=>a+b)/3;
 const g=x.reduce((s,xi,i)=>s+(xi-xm)*(y[i]-ym),0)/2,b=ym-g*xm;
 const r=x.map((xi,i)=>y[i]-g*xi-b);
 near(g,1);near(b,1/15);near(r.reduce((a,b)=>a+b,0),0);
 near(r.reduce((s,v,i)=>s+v*x[i],0),0);
 near(r.reduce((s,v)=>s+v*v,0),1/150);
 near(Math.sqrt(r.reduce((s,v)=>s+v*v,0)/3),Math.sqrt(1/450));
 near(y[1]-(x[1]+.1),-.1);
});
test('35: short-arc heading interpolation and antipodal tie',()=>{
 const lerp=(a,b,f)=>wrap(a+f*wrap(b-a));
 near(lerp(170,-170,.25),175);near(lerp(170,-170,.75),-175);
 near(lerp(-170,170,.25),-175);near(lerp(170,-170,1),-170);
 near(.75*170+.25*-170,85);near(Math.abs(wrap(180)),180);
 assert.match(get(35).reasoningSteps.join(' '),/both rotation directions/);
});
test('36: bounded-localization error can reverse the obstacle decision',()=>{
 const clear=(x,e,r,o)=>o-x-e-r;
 near(clear(.7,.15,.2,1),-.05);near(clear(.6,.15,.2,1),.05);
 near(clear(.7,0,.2,1),.1);
 for(const e of [0,.02,.1,.15])assert.ok(clear(.7,e+.01,.2,1)<clear(.7,e,.2,1));
 assert.match(get(36).reasoningSteps.join(' '),/3σ interval is probabilistic/);
});
