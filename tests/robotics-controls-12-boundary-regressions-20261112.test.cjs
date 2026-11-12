'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lessons = JSON.parse(fs.readFileSync(path.join(__dirname, '../deep-learning/robotics/controls.json'), 'utf8'));
const ids = [
  'robotics-controls-01-forward-kinematics-2r',
  'robotics-controls-02-inverse-kinematics-branches',
  'robotics-controls-03-jacobian-singularity',
  'robotics-controls-04-frame-transform-inverse',
  'robotics-controls-05-differential-wheel-speeds',
  'robotics-controls-06-differential-drive-arc',
  'robotics-controls-07-wheel-encoder-quantization',
  'robotics-controls-08-two-point-calibration',
  'robotics-controls-09-discrete-p-stability',
  'robotics-controls-10-integrator-antiwindup',
  'robotics-controls-11-scalar-kalman-update',
  'robotics-controls-12-trapezoid-profile'
];
const near = (actual, expected, tol=1e-10) => {
  assert.ok(Number.isFinite(actual) && Math.abs(actual-expected) <= tol,
    'expected ' + expected + ', received ' + actual);
};
const lessonLab = (index, evidence) => {
  assert.match(lessons[ids[index]].labPlan.join(' '), evidence, ids[index]);
};

test('pack preserves twelve distinct domain-specific records and synthetic scope', () => {
  assert.deepEqual(Object.keys(lessons), ids);
  for (const id of ids) {
    assert.match(lessons[id].technical.scope, /Synthetic, offline educational case\./);
    assert.equal(lessons[id].reasoningSteps.length, 6);
    assert.ok(lessons[id].labPlan.length >= 3);
  }
});

const fk = (a,b,q1,q2) => [
  a*Math.cos(q1)+b*Math.cos(q1+q2),
  a*Math.sin(q1)+b*Math.sin(q1+q2)
];

test('2R forward kinematics is rotation-equivariant, but the absolute-angle shortcut is not', () => {
  lessonLab(0, /both angles pi\/2/);
  for (const q1 of [-Math.PI, -Math.PI/3, 0, Math.PI/2, Math.PI]) {
    for (const q2 of [-Math.PI, -Math.PI/2, 0, Math.PI/2]) {
      const [x,y] = fk(.4,.3,q1,q2);
      const [xr,yr] = fk(.4,.3,0,q2);
      near(x, Math.cos(q1)*xr-Math.sin(q1)*yr);
      near(y, Math.sin(q1)*xr+Math.cos(q1)*yr);
      near(x*x+y*y, .4*.4+.3*.3+2*.4*.3*Math.cos(q2));
    }
  }
  const [x,y] = fk(.4,.3,Math.PI/2,Math.PI/2);
  near(x,-.3); near(y,.4);
  const wrong = [.4*Math.cos(Math.PI/2)+.3*Math.cos(Math.PI/2),
                 .4*Math.sin(Math.PI/2)+.3*Math.sin(Math.PI/2)];
  assert.ok(Math.hypot(x-wrong[0],y-wrong[1]) > .3);
});

const ik = (x,y,a,b) => {
  const c = (x*x+y*y-a*a-b*b)/(2*a*b);
  if (c < -1-1e-12 || c > 1+1e-12) return null;
  const q2 = Math.acos(Math.max(-1,Math.min(1,c)));
  return [q2,-q2].map(t => [Math.atan2(y,x)-Math.atan2(b*Math.sin(t),a+b*Math.cos(t)),t]);
};

test('inverse kinematics enforces inner and outer annulus before inverse cosine', () => {
  lessonLab(1, /boundary \(0\.70,0\)/);
  for (const [x,y] of [[.4,.3],[.2,.3],[-.4,.3],[-.3,-.2]]) {
    const pairs = ik(x,y,.4,.3);
    assert.ok(pairs && pairs.length===2);
    for (const pair of pairs) {
      const p = fk(.4,.3,...pair);
      near(p[0],x); near(p[1],y);
    }
  }
  assert.equal(ik(.8,0,.4,.3), null);
  assert.equal(ik(.05,0,.4,.3), null);
  for (const boundary of [.1,.7]) {
    const pairs = ik(boundary,0,.4,.3);
    for (const pair of pairs) {
      const p=fk(.4,.3,...pair);
      near(p[0],boundary,1e-9); near(p[1],0,1e-9);
    }
    near(Math.cos(pairs[0][1]),Math.cos(pairs[1][1]));
  }
});

const jac = (a,b,q1,q2) => [
  [-a*Math.sin(q1)-b*Math.sin(q1+q2),-b*Math.sin(q1+q2)],
  [ a*Math.cos(q1)+b*Math.cos(q1+q2), b*Math.cos(q1+q2)]
];

test('Jacobian agrees with central differences and loses rank at collinear links', () => {
  lessonLab(2, /theta2=0/);
  const h=1e-6;
  for (const [q1,q2] of [[0,Math.PI/2],[.31,-.83],[-.6,.72]]) {
    const J=jac(.4,.3,q1,q2);
    for (let axis=0;axis<2;axis++) {
      const plus = fk(.4,.3,q1+(axis===0?h:0),q2+(axis===1?h:0));
      const minus= fk(.4,.3,q1-(axis===0?h:0),q2-(axis===1?h:0));
      for (let component=0;component<2;component++)
        near((plus[component]-minus[component])/(2*h),J[component][axis],1e-9);
    }
    near(J[0][0]*J[1][1]-J[0][1]*J[1][0],.12*Math.sin(q2));
  }
  for(const q2 of [0,Math.PI]) {
    const J=jac(.4,.3,.2,q2);
    near(J[0][0]*J[1][1]-J[0][1]*J[1][0],0);
  }
});

const rot=(p,yaw)=>[
  Math.cos(yaw)*p[0]-Math.sin(yaw)*p[1],
  Math.sin(yaw)*p[0]+Math.cos(yaw)*p[1]
];
test('world-from-base transform inverts exactly and does not commute with translation', () => {
  lessonLab(3, /rotation after translation/);
  const point=[.2,.1],t=[1,2];
  for(const yaw of [0,Math.PI/2,-Math.PI/3,Math.PI]){
    const r=rot(point,yaw), world=[r[0]+t[0],r[1]+t[1]];
    const back=rot([world[0]-t[0],world[1]-t[1]],-yaw);
    near(back[0],point[0]); near(back[1],point[1]);
  }
  const correct=rot(point,Math.PI/2).map((v,i)=>v+t[i]);
  const wrong=rot(point.map((v,i)=>v+t[i]),Math.PI/2);
  near(correct[0],.9); near(correct[1],2.2);
  near(wrong[0],-2.1); near(wrong[1],1.2);
  assert.ok(Math.hypot(correct[0]-wrong[0],correct[1]-wrong[1])>1);
});

const wheels=(v,w,b)=>[v-w*b/2,v+w*b/2];
const chassis=(left,right,b)=>[(left+right)/2,(right-left)/b];
test('differential wheel/chassis mapping round-trips forward and reverse motion', () => {
  lessonLab(4, /change b to 1\.00 m/);
  for(const b of [.2,.5,1])for(const v of [-.6,0,.6])for(const omega of [-1,0,.4,1]){
    const [left,right]=wheels(v,omega,b);
    const [vv,ww]=chassis(left,right,b);
    near(vv,v); near(ww,omega);
  }
  near(chassis(.5,.7,1)[1],.2);
  near(chassis(.6,.6,.5)[1],0);
});

const arc = (left,right,b,heading=0) => {
  const ds=(left+right)/2, dtheta=(right-left)/b, half=dtheta/2;
  const sinc=Math.abs(half)<1e-12 ? 1 : Math.sin(half)/half;
  return [ds*sinc*Math.cos(heading+half),ds*sinc*Math.sin(heading+half),dtheta];
};
test('exact constant-curvature odometry is continuous through zero yaw', () => {
  lessonLab(5, /Set dL=dR=0\.25 m/);
  const p=arc(.2,.3,.5);
  near(p[0],.24833666349382652); near(p[1],.024916777698447967); near(p[2],.2);
  const mirrored=arc(.3,.2,.5);
  near(mirrored[0],p[0]); near(mirrored[1],-p[1]); near(mirrored[2],-p[2]);
  const straight=arc(.25,.25,.5,.7);
  near(straight[0],.25*Math.cos(.7));near(straight[1],.25*Math.sin(.7));near(straight[2],0);
  for(const delta of [1e-8,1e-10,1e-12]){
    const nearStraight=arc(.25-delta/2,.25+delta/2,.5);
    near(nearStraight[0],.25,1e-8);
    assert.ok(Math.abs(nearStraight[1])<1e-8);
  }
});

test('encoder rounding error stays within a half count, including reverse motion', () => {
  lessonLab(6, /misinterpret the effective resolution/);
  const unit=2*Math.PI*.05/2048;
  near(1024*unit,Math.PI*.05);
  for(const distance of [-1,-.312,-.031,0,.017,.157,.5,1]){
    const counts=Math.round(distance/unit);
    assert.ok(Math.abs(counts*unit-distance)<=unit/2+1e-12);
  }
  near(1024*2*Math.PI*.05/1024,2*Math.PI*.05);
});

const calibrate=(x1,y1,x2,y2)=>{
  if(x1===x2)throw new RangeError('distinct references required');
  const gain=(y2-y1)/(x2-x1);
  return [gain,y1-gain*x1];
};
test('two-point affine sensor fit exposes near-coincident reference amplification', () => {
  lessonLab(7, /1001\.05/);
  let [gain,offset]=calibrate(1,1.07,3,3.17);
  near(gain,1.05);near(offset,.02);
  near((2.12-offset)/gain,2);
  [gain]=calibrate(1,1.07,1.000001,1.07000105+.001);
  near(gain,1001.05,1e-6);
  assert.throws(()=>calibrate(1,1,1,1.1),/distinct references/);
});

const runP=(Kp,steps,dt=.1)=>{
  let x=0;const values=[];
  for(let k=0;k<steps;k++){x+=dt*Kp*(1-x);values.push(x);}
  return values;
};
test('sampled P-controller stability rule distinguishes convergence, cycling and divergence', () => {
  lessonLab(8, /Kp=20/);
  const stable=runP(4,3);
  stable.forEach((x,i)=>near(x,[.4,.64,.784][i]));
  near(runP(15,6)[5],1-Math.pow(-.5,6));
  const marginal=runP(20,4);
  marginal.forEach((x,i)=>near(x,i%2===0?2:0));
  const unstable=runP(25,3);
  near(unstable[0],2.5);near(unstable[1],-1.25);
  assert.ok(Math.abs(unstable[2]-1)>Math.abs(unstable[1]-1));
  near(runP(0,5)[4],0);
});

const saturate=(u,limit=1)=>Math.max(-limit,Math.min(limit,u));
test('conditional PI anti-windup prevents accumulated wrong-direction output', () => {
  lessonLab(9, /without first updating I/);
  const kp=2,ki=1,dt=.1,e=2;
  let naive=0,guard=0;
  for(let k=0;k<10;k++){
    naive+=e*dt;
    const raw=kp*e+ki*guard;
    if(!(raw>=1 && e>0) && !(raw<=-1 && e<0))guard+=e*dt;
  }
  near(naive,2);near(guard,0);
  near(kp*e+ki*naive,6);near(kp*e+ki*guard,4);
  near(saturate(kp*e+ki*naive),1);
  near(kp*(-.25)+ki*naive,1.5);
  near(kp*(-.25)+ki*guard,-.5);
});

const kalman=(prior,P,z,R)=>{
  if(P<0||R<0||P+R===0)throw new RangeError('positive total variance required');
  const K=P/(P+R);
  return [prior+K*(z-prior),(1-K)*P,K];
};
test('scalar variance-weighted fusion contracts covariance and honors limiting cases', () => {
  lessonLab(10, /Raise R to 0\.36 m\^2/);
  const [x,P,K]=kalman(2,.25,2.6,.09);
  near(x,2.4411764705882355);near(P,.06617647058823528);near(K,.7352941176470589);
  near(x,(2/.25+2.6/.09)/(1/.25+1/.09));
  const [x2,P2,K2]=kalman(2,.25,2.6,.36);
  near(x2,2.2459016393442623);assert.ok(P2>P&&K2<K);
  for(const R of [.01,.09,.36,1,10]){
    const [posterior,covariance,gain]=kalman(2,.25,2.6,R);
    assert.ok(gain>=0&&gain<=1 && covariance>=0 && covariance<=.25);
    assert.ok(posterior>=2&&posterior<=2.6);
  }
  near(kalman(2,0,2.6,.09)[0],2);
  near(kalman(2,.25,2.6,0)[0],2.6);
  assert.throws(()=>kalman(2,0,2.6,0),/positive total variance/);
});

const profile=(distance,accel,maxSpeed)=>{
  if(distance<0||accel<=0||maxSpeed<=0)throw new RangeError('valid rest-to-rest constraints required');
  const peak=Math.min(maxSpeed,Math.sqrt(distance*accel));
  const ramp=peak/accel,cruise=(distance-peak*peak/accel)/maxSpeed;
  return {peak,ramp,cruise:Math.max(0,cruise),total:2*ramp+Math.max(0,cruise)};
};
test('rest-to-rest velocity profiles meet distance and speed constraints in both regimes', () => {
  lessonLab(11, /regime boundary/);
  for(const distance of [0,.1,.4,1,2,4]){
    const p=profile(distance,1,1);
    near(p.ramp*p.peak+p.cruise*p.peak,distance,1e-9);
    assert.ok(p.peak<=1+1e-12 && p.cruise>=0);
    if(distance<1)near(p.cruise,0);
    if(distance>1)near(p.peak,1);
  }
  const short=profile(.4,1,1);
  near(short.peak,Math.sqrt(.4));near(short.total,2*Math.sqrt(.4));
  const long=profile(2,1,1);
  near(long.ramp,1);near(long.cruise,1);near(long.total,3);
  const boundary=profile(1,1,1);
  near(boundary.cruise,0);near(boundary.total,2);
  assert.throws(()=>profile(1,0,1),/valid rest-to-rest/);
});

test('near-singular Jacobian inverse velocity demands increase as the elbow straightens', () => {
  const lesson = lessons[ids[2]];
  assert.match(lesson.reasoningSteps[4], /theta2=0\.01 rad/);
  assert.match(lesson.labPlan.join(' '), /\+24\.99999167/);
  const jointSpeeds = [];
  for (const [elbow, expect1, expect2] of [
    [0.01, 2.49991667, -5.83330556],
    [0.001, 24.99999167, -58.33333056]
  ]) {
    const J = jac(0.4, 0.3, 0, elbow);
    const determinant = J[0][0]*J[1][1]-J[0][1]*J[1][0];
    assert.ok(Math.abs(determinant) > 1e-6);
    // Solve the 2x2 inverse analytically, then independently reconstruct J*qdot.
    const qdot1 = 0.01*J[1][1]/determinant;
    const qdot2 = -0.01*J[1][0]/determinant;
    near(qdot1, expect1, 1e-7);
    near(qdot2, expect2, 1e-7);
    near(J[0][0]*qdot1+J[0][1]*qdot2, 0.01, 1e-12);
    near(J[1][0]*qdot1+J[1][1]*qdot2, 0, 1e-12);
    jointSpeeds.push([qdot1,qdot2]);
  }
  assert.ok(Math.abs(jointSpeeds[1][0]) > 9*Math.abs(jointSpeeds[0][0]));
  assert.ok(Math.abs(jointSpeeds[1][1]) > 9*Math.abs(jointSpeeds[0][1]));
  const singular = jac(0.4,0.3,0,0);
  near(singular[0][0],0);
  near(singular[0][1],0);
  near(singular[0][0]*singular[1][1]-singular[0][1]*singular[1][0],0);
});
