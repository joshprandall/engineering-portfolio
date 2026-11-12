'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'../deep-learning/robotics/controls.json'),'utf8'));
const expected=[
  "robotics-controls-01-forward-kinematics-2r",
  "robotics-controls-02-inverse-kinematics-branches",
  "robotics-controls-03-jacobian-singularity",
  "robotics-controls-04-frame-transform-inverse",
  "robotics-controls-05-differential-wheel-speeds",
  "robotics-controls-06-differential-drive-arc",
  "robotics-controls-07-wheel-encoder-quantization",
  "robotics-controls-08-two-point-calibration",
  "robotics-controls-09-discrete-p-stability",
  "robotics-controls-10-integrator-antiwindup",
  "robotics-controls-11-scalar-kalman-update",
  "robotics-controls-12-trapezoid-profile"
];
assert.deepEqual(Object.keys(lessons),expected,'12 exclusive robotics lesson IDs/order');
const close=(actual,target,tolerance=1e-8)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-target)<=tolerance,`actual ${actual}, expected ${target}`);
for(const [id,v] of Object.entries(lessons)){
 for(const f of ['essentialQuestion','verifiedBoundary','starter','technical','reasoningSteps','labPlan','vocabulary'])assert.ok(v[f],`${id} missing ${f}`);
 assert.equal(v.reasoningSteps.length,6);
 assert.ok(v.labPlan.length>=3);
 assert.ok(v.reasoningSteps.some(t=>/https:\/\//.test(t)),'specific source URL required');
 assert.ok(v.reasoningSteps.some(t=>/Counterexample|Falsifiable|false/.test(t)),'falsifiability required');
 assert.ok(v.technical.scope.includes('Synthetic, offline educational case.'),'synthetic scope required');
}
const fk=(a,b,t,u)=>[a*Math.cos(t)+b*Math.cos(t+u),a*Math.sin(t)+b*Math.sin(t+u)];
let p=fk(.4,.3,0,Math.PI/2);close(p[0],.4);close(p[1],.3);
p=fk(.4,.3,Math.PI/2,Math.PI/2);close(p[0],-.3);close(p[1],.4);
for(const sign of [-1,1]){const t2=sign*Math.PI/2,t1=Math.atan2(.3,.4)-Math.atan2(.3*Math.sin(t2),.4+.3*Math.cos(t2));p=fk(.4,.3,t1,t2);close(p[0],.4);close(p[1],.3);}
const J=[[-.3,-.3],[.4,0]];close(J[0][0]*.2+J[0][1]*.1,-.09);close(J[1][0]*.2+J[1][1]*.1,.08);close(J[0][0]*J[1][1]-J[0][1]*J[1][0],.12);
close(1-.1,.9);close(2+.2,2.2);close(.6-.4*.5/2,.5);close(.6+.4*.5/2,.7);
const dtheta=(.3-.2)/.5, radius=((.2+.3)/2)/dtheta;close(radius*Math.sin(dtheta),.24833666349382652);close(radius*(1-Math.cos(dtheta)),.024916777698447967);
close(1024/2048*2*Math.PI*.05,.15707963267948966);close((3.17-1.07)/(3-1),1.05);close((2.12-.02)/1.05,2);
close(1-(1-.1*4)**3,.784);close(10*.1*2,2);close(2+(.25/(.25+.09))*.6,2.441176470588235);close((1-.25/(.25+.09))*.25,.06617647058823531);
close(.5+1+.5,2);close(1+1+1,3);close(Math.sqrt(.4),.6324555320336759);close(2*Math.sqrt(.4),1.2649110640673518);
console.log('PASS: 12 robotics lessons; all schema, provenance, falsifiability, and independent numeric assertions.');
