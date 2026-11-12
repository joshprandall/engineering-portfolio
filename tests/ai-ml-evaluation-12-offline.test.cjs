'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'../deep-learning/ai/model-evaluation.json'),'utf8'));
const expected={
  "ai-ml-evidence-confusion-matrix": 0.75,
  "ai-ml-evidence-majority-class-baseline": 0.5,
  "ai-ml-evidence-threshold-cost-selection": 2,
  "ai-ml-evidence-average-precision-ranking": 0.8333333333333334,
  "ai-ml-evidence-brier-probability-score": 0.175,
  "ai-ml-evidence-calibration-bin-ece": 0.25,
  "ai-ml-evidence-preprocessing-leakage": 9,
  "ai-ml-evidence-stable-binary-logit-loss": 0.31566773421529676,
  "ai-ml-evidence-logistic-gradient-update": 0.549833997312478,
  "ai-ml-evidence-ridge-regularized-parameter": 1.5,
  "ai-ml-evidence-kmeans-one-lloyd-update": 1,
  "ai-ml-evidence-prevalence-and-precision-shift": 0.47058823529411764
};

test('AI/ML curriculum: exact 12 proposed, isolated records',()=>{
 assert.deepEqual(Object.keys(lessons),Object.keys(expected));
 for(const [id,r] of Object.entries(lessons)){
  for(const key of ['essentialQuestion','verifiedBoundary','reasoningSteps','labPlan','counterexample','workedExample','offlineLab','evidence'])assert.ok(r[key],id+': '+key);
  assert.ok(r.reasoningSteps.length>=3&&r.labPlan.length>=3,id);
  assert.match(r.offlineLab.runtime,/offline|no network/i,id);
  assert.equal(r.workedExample.answer,expected[id],id+': declared numerical solution');
  assert.ok(r.evidence[0].url.startsWith('https://'),id);
 }
});
for(const [id,record] of Object.entries(lessons))test('Synthetic offline falsification: '+id,()=>{
 assert.doesNotThrow(()=>vm.runInNewContext(record.offlineLab.code,{require},{timeout:1200,filename:id+'.js'}));
});

const measuredUnits={
  "ai-ml-evidence-confusion-matrix": "dimensionless precision proportion",
  "ai-ml-evidence-majority-class-baseline": "dimensionless balanced-accuracy proportion",
  "ai-ml-evidence-threshold-cost-selection": "total cost units across six observations",
  "ai-ml-evidence-average-precision-ranking": "dimensionless average-precision score",
  "ai-ml-evidence-brier-probability-score": "dimensionless mean squared probability error",
  "ai-ml-evidence-calibration-bin-ece": "dimensionless absolute probability gap",
  "ai-ml-evidence-preprocessing-leakage": "feature units (centered held-out value)",
  "ai-ml-evidence-stable-binary-logit-loss": "nats per observation (mean binary log loss)",
  "ai-ml-evidence-logistic-gradient-update": "dimensionless predicted positive-class probability",
  "ai-ml-evidence-ridge-regularized-parameter": "scalar parameter units (same units as target in this toy objective)",
  "ai-ml-evidence-kmeans-one-lloyd-update": "squared feature units (sum of squared distances)",
  "ai-ml-evidence-prevalence-and-precision-shift": "dimensionless positive predictive probability"
};
const independentOracles=[
 ()=>{const y=[1,1,0,0,1,0,0,0,1,0],h=[1,1,1,0,1,0,0,0,0,0];return y.filter((v,i)=>v===1&&h[i]===1).length/h.filter(Boolean).length;},
 ()=>(0/5+95/95)/2,
 ()=>{const y=[1,1,0,0,1,0],p=[.9,.6,.55,.4,.3,.2];return y.reduce((s,v,i)=>s+(p[i]>=.3?(v===0?1:0):(v===1?4:0)),0);},
 ()=>{let n=0,s=0;[1,0,1,0].forEach((v,i)=>{if(v){n++;s+=n/(i+1);}});return s/n;},
 ()=>{const p=[.8,.7,.6,.1],y=[1,0,1,0];return p.reduce((s,v,i)=>s+(v-y[i])**2,0)/4;},
 ()=>{const p=[.1,.4,.6,.9],y=[0,1,0,1];return [[0,1],[2,3]].reduce((s,ix)=>s+ix.length/4*Math.abs(ix.reduce((t,i)=>t+p[i]-y[i],0)/ix.length),0);},
 ()=>10-(0+2)/2,
 ()=>{const z=[0,2,-2],y=[1,1,0];return z.reduce((s,v,i)=>s+Math.max(v,0)-v*y[i]+Math.log1p(Math.exp(-Math.abs(v))),0)/3;},
 ()=>1/(1+Math.exp(-.2)),
 ()=>3/2,
 ()=>[0,1,8,9].reduce((s,v)=>s+Math.min((v-.5)**2,(v-8.5)**2),0),
 ()=>.8*.1/(.8*.1+.1*.9)
];
test('Twelve independent worked-answer units',()=>{
 assert.deepEqual(Object.keys(measuredUnits),Object.keys(lessons));
 for(const id of Object.keys(lessons))assert.equal(lessons[id].workedExample.units,measuredUnits[id],id);
});
Object.keys(lessons).forEach((id,i)=>{
 test('Independent numerical prediction: '+id,()=>{
  const computed=independentOracles[i](),declared=lessons[id].workedExample.answer;
  assert.ok(Number.isFinite(computed)&&Math.abs(declared-computed)<1e-11,id);
  assert.ok(Math.abs((declared+.05)-computed)>.049,id+' deliberate corruption undetected');
 });
});
test('Counterexample boundary checks',()=>{
 assert.ok(Number.isNaN(0/0),'precision undefined with no positive predictions');
 assert.equal(0/5,0,'always-negative recall');
 const y=[1,1,0,0,1,0],p=[.9,.6,.55,.4,.3,.2];
 const c=(t,fn)=>y.reduce((s,v,i)=>s+(p[i]>=t?(v?0:1):(v?fn:0)),0);
 assert.ok(c(.5,.1)<c(.3,.1),'asymmetric costs reverse threshold ranking');
 assert.ok((.5+2/3)/2<5/6,'moving positive rank reduces AP');
 assert.ok((.04+.99**2+.16+.01)/4>independentOracles[4](),'wrong overconfidence increases Brier');
 assert.equal((.2+.8)/2,(0+1)/2,'coarse calibration bins may hide within-bin deviations');
 assert.equal(10-(0+2+10)/3,6,'pooled test feature leaks into center');
 const stable=(z,t)=>Math.max(z,0)-z*t+Math.log1p(Math.exp(-Math.abs(z)));
 assert.ok(Number.isFinite(stable(-1000,1))&&Number.isFinite(stable(-1000,0)));
 assert.ok(Math.log1p(Math.exp(.2))>Math.log(2),'wrong-sign gradient step worsens loss');
 assert.notEqual(independentOracles[9](),0,'L2 solution need not be sparse');
 assert.ok(independentOracles[10]()<2,'inertia drops in Lloyd fixture');
 const ppv=pi=>(.8*pi)/(.8*pi+.1*(1-pi));assert.ok(ppv(.5)>ppv(.1));
});


test('Twelve lessons retain model-specific derivations, not generic placeholders',()=>{
 const cues={
 'confusion-matrix':'Precision conditions',
 'majority-class-baseline':'Accuracy=0.95',
 'threshold-cost-selection':'Sort the six distinct scores',
 'average-precision-ranking':'DeltaRecall',
 'brier-probability-score':'Bernoulli',
 'calibration-bin-ece':'low-bin',
 'preprocessing-leakage':'pooled mean',
 'stable-binary-logit-loss':'softplus',
 'logistic-gradient-update':'derivative',
 'ridge-regularized-parameter':"J''",
 'kmeans-one-lloyd-update':'within-cluster',
 'prevalence-and-precision-shift':"Bayes' rule"
 };
 assert.equal(Object.keys(cues).length,12);
 for(const [suffix,cue] of Object.entries(cues)){
   const row=lessons['ai-ml-evidence-'+suffix];
   assert.ok(row&&row.reasoningSteps[1].includes(cue),suffix+': missing derivation');
   assert.ok(row.reasoningSteps[1].length>100,suffix+': underspecified argument');
   assert.doesNotMatch(row.reasoningSteps[1],/Identify the exact denominator, score ordering or optimization convention/,suffix);
 }
});

test('Bernoulli Brier expectation is minimized at the true probability',()=>{
 const risk=(p,q)=>q*(1-p)**2+(1-q)*p**2;
 for(const q of [0,.1,.25,.5,.75,.9,1])for(const p of [0,.1,.25,.5,.75,.9,1]){
   assert.ok(risk(p,q)>=risk(q,q)-1e-14);
   assert.ok(Math.abs(risk(p,q)-((p-q)**2+q*(1-q)))<1e-14);
 }
});

test('Ridge scalar optimum is globally minimal for varied penalties',()=>{
 for(const lambda of [0,.001,.1,1,4,10,100]){
   const w=3/(1+lambda),J=x=>(x-3)**2+lambda*x*x;
   for(const offset of [-3,-1,-.1,-.001,0,.001,.1,1,3])
     assert.ok(J(w+offset)>=J(w)-1e-12);
   assert.ok(2*(1+lambda)>0);
 }
});

test('Lloyd centroids minimize fixed-cluster squared loss',()=>{
 const clusters=[[0,1],[8,9]],sse=(a,c)=>a.reduce((sum,x)=>sum+(x-c)**2,0);
 const means=clusters.map(a=>a.reduce((x,y)=>x+y,0)/a.length);
 assert.deepEqual(means,[.5,8.5]);
 for(const d of [-2,-1,-.25,0,.25,1,2])
   assert.ok(sse(clusters[0],means[0]+d)+sse(clusters[1],means[1]-d)>=1-1e-12);
});
