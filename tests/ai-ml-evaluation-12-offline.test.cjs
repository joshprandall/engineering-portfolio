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
