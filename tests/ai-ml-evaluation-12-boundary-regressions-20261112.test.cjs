'use strict';
// Independent boundary and falsification oracles for twelve synthetic AI/ML lessons.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const records = JSON.parse(fs.readFileSync(path.join(__dirname, '../deep-learning/ai/model-evaluation.json'), 'utf8'));
const key = name => 'ai-ml-evidence-' + name;
const answer = name => {
  assert.ok(records[key(name)], 'missing authored lesson: ' + name);
  return records[key(name)].workedExample.answer;
};
const near = (actual, expected, label, tolerance = 1e-11) =>
  assert.ok(Number.isFinite(actual) && Math.abs(actual-expected) <= tolerance,
    label + ': observed ' + actual + ', expected ' + expected);
const mismatch = (actual, expected, label) =>
  assert.ok(Math.abs(actual-expected) > 1e-5, label + ': counterfactual was not detected');

test('Confusion-matrix partition, false alarms, and undefined precision', () => {
  const y=[1,1,0,0,1,0,0,0,1,0], h=[1,1,1,0,1,0,0,0,0,0];
  const c={tp:0,fp:0,fn:0,tn:0};
  y.forEach((label,i)=>{if(label===1&&h[i]===1)c.tp++;
    else if(label===0&&h[i]===1)c.fp++;
    else if(label===1)c.fn++;else c.tn++;});
  assert.deepEqual([c.tp,c.fp,c.fn,c.tn],[3,1,1,5]);
  assert.equal(Object.values(c).reduce((a,b)=>a+b,0),y.length);
  near(c.tp/(c.tp+c.fp),answer('confusion-matrix'),'positive precision');
  assert.ok(Number.isNaN(0/0),'precision has no mathematical value when no positives are predicted');
  mismatch(c.tp/(c.tp+c.fp),c.tp/(c.tp+c.fp+c.fn),'wrong denominator');
});

test('Imbalanced classifier: high accuracy but zero recall', () => {
  const y=[...Array(95).fill(0),...Array(5).fill(1)];
  const predict=Array(100).fill(0);
  const recall=y.filter((v,i)=>v===1&&predict[i]===1).length/5;
  const specificity=y.filter((v,i)=>v===0&&predict[i]===0).length/95;
  const accuracy=y.filter((v,i)=>v===predict[i]).length/100;
  near((recall+specificity)/2,answer('majority-class-baseline'),'balanced accuracy');
  assert.equal(accuracy,.95);
  assert.equal(recall,0);
  mismatch(accuracy,answer('majority-class-baseline'),'accuracy substituted for balanced accuracy');
});

test('Threshold tie at 0.3: inclusive versus exclusive comparison', () => {
  const y=[1,1,0,0,1,0], p=[.9,.6,.55,.4,.3,.2];
  const cost=(t,inclusive,fp=1,fn=4)=>y.reduce((s,v,i)=>{
    const yes=inclusive?p[i]>=t:p[i]>t;
    return s+(yes?(v===0?fp:0):(v===1?fn:0));
  },0);
  assert.ok(p.includes(.3),'the threshold is exactly a sample score');
  assert.equal(cost(.5,true),5);
  assert.equal(cost(.3,true),2);
  assert.equal(cost(.3,false),6);
  // Exhaustive fixed-score decision sets: no threshold between scores can yield a new labeling.
  const cutoffs=[Infinity,.9,.6,.55,.4,.3,.2];
  const expectedHigh=[12,8,4,5,6,2,3];
  const expectedLow=[.3,.2,.1,1.1,2.1,2,3];
  cutoffs.forEach((t,i)=>{
    near(cost(t,true,1,4),expectedHigh[i],'cost at high FN penalty and t='+t);
    near(cost(t,true,1,.1),expectedLow[i],'cost at low FN penalty and t='+t);
  });
  assert.equal(Math.min(...expectedHigh),cost(.3,true,1,4));
  near(Math.min(...expectedLow),cost(.6,true,1,.1),'new global minimum at threshold .6');
  // Each between-score threshold yields the same predictions as an adjacent observed-score cutoff under p >= t.
  near(cost(.65,true),cost(.9,true),'cutoff in (.6,.9] for observed scores');
  near(cost(.5,true),cost(.55,true),'cutoff in (.4,.55] for observed scores');
  assert.equal(cost(.5,true,1,.1),1.1);
  near(cost(.3,true),answer('threshold-cost-selection'),'inclusive threshold cost');
  mismatch(cost(.3,false),answer('threshold-cost-selection'),'strict boundary changes the answer');
});

test('Average precision is non-interpolated precision at positive ranks', () => {
  const ap=labels=>{let seen=0,total=0;labels.forEach((v,i)=>{if(v===1){seen++;total+=seen/(i+1);}});
    return total/seen;};
  near(ap([1,0,1,0]),answer('average-precision-ranking'),'AP of source ranking');
  near(ap([1,1,0,0]),1,'perfect ranking AP');
  near(ap([0,1,0,1]),.5,'reversed ranking AP');
  mismatch(ap([0,1,0,1]),answer('average-precision-ranking'),'rank permutation');
});

test('Brier scoring preserves probability information discarded by accuracy', () => {
  const y=[1,0,1,0],p=[.8,.7,.6,.1];
  const brier=q=>q.reduce((s,x,i)=>s+(x-y[i])**2,0)/q.length;
  near(brier(p),answer('brier-probability-score'),'four-sample Brier');
  const worse=p.slice();worse[1]=.99;
  near(brier(worse),.297525,'more confident false positive');
  assert.ok(brier(worse)>brier(p));
  assert.equal(brier(y),0);
});

test('ECE coarse-bin cancellation is not proof of probability calibration', () => {
  const ece=(p,y,bins)=>bins.reduce((total,indices)=>{
    const pred=indices.reduce((s,i)=>s+p[i],0)/indices.length;
    const truth=indices.reduce((s,i)=>s+y[i],0)/indices.length;
    return total+(indices.length/p.length)*Math.abs(pred-truth);
  },0);
  near(ece([.1,.4,.6,.9],[0,1,0,1],[[0,1],[2,3]]),
    answer('calibration-bin-ece'),'two-bin ECE');
  assert.equal(ece([.1,.9],[1,0],[[0,1]]),0);
  assert.ok((Math.pow(.1-1,2)+Math.pow(.9-0,2))/2>.8,
    'zero pooled ECE can coexist with very poor individual probabilities');
});

test('Train-only fit differs from contaminated pooled test-feature fit', () => {
  const train=[0,2], heldOut=10;
  const mean=x=>x.reduce((s,v)=>s+v,0)/x.length;
  near(heldOut-mean(train),answer('preprocessing-leakage'),'frozen train mean');
  near(heldOut-mean([...train,heldOut]),6,'pooled mean leakage witness');
  mismatch(heldOut-mean([...train,heldOut]),answer('preprocessing-leakage'),'contaminated transform');
  assert.equal(100-mean(train),99);
});

test('Stable binary logit loss at extreme positive and negative logits', () => {
  const loss=(z,y)=>Math.max(z,0)-z*y+Math.log1p(Math.exp(-Math.abs(z)));
  const z=[0,2,-2],y=[1,1,0];
  near(z.reduce((s,v,i)=>s+loss(v,y[i]),0)/3,
    answer('stable-binary-logit-loss'),'mean stable loss');
  for(const logit of [-1000,-100,-20,0,20,100,1000]){
    for(const label of [0,1]) assert.ok(Number.isFinite(loss(logit,label)));
    near(loss(logit,1),loss(-logit,0),'logit-label symmetry');
  }
  assert.equal(loss(-1000,1),1000);
  assert.equal(loss(1000,0),1000);
});


test('Extreme logits: binary64 underflow is not an exact mathematical zero', () => {
  const stable=(z,y)=>Math.max(z,0)-z*y+Math.log1p(Math.exp(-Math.abs(z)));
  assert.equal(Math.exp(-1000),0,'exp(-1000) underflows in binary64');
  assert.equal(stable(-1000,0),0,'representable loss rounds to zero');
  assert.equal(stable(-1000,1),1000);
  assert.ok(stable(-700,0)>0,'the stable formula retains a positive subnormal-range loss');
  assert.ok(stable(-700,0)<1e-300);
  assert.equal(stable(1000,0),1000);
  assert.match(records[key('stable-binary-logit-loss')].counterexample,/round/i);
});

test('Logistic gradient agrees with finite difference and descends for small step', () => {
  const sigmoid=z=>1/(1+Math.exp(-z));
  const loss=w=>Math.log1p(Math.exp(-2*w));
  const grad=w=>2*(sigmoid(2*w)-1);
  const h=1e-5;
  for(const w of [-.4,0,.2]){
    near(grad(w),(loss(w+h)-loss(w-h))/(2*h),'central difference at w='+w,1e-9);
  }
  const next=-.1*grad(0);
  near(sigmoid(2*next),answer('logistic-gradient-update'),'gradient update');
  assert.ok(loss(next)<loss(0));
  assert.ok(loss(-next)>loss(0),'wrong gradient sign must worsen the loss');
});

test('Regularized scalar optimum and local quadratic perturbations', () => {
  const J=(w,lam)=>(w-3)**2+lam*w*w;
  for(const lam of [0,.1,1,2,4,10]){
    const star=3/(1+lam);
    assert.ok(J(star,lam)<J(star-.05,lam));
    assert.ok(J(star,lam)<J(star+.05,lam));
  }
  near(3/(1+1),answer('ridge-regularized-parameter'),'L2 optimum at lambda 1');
  assert.equal(3/(1+0),3,'unpenalized optimum');
  assert.ok(3/(1+4)>0,'finite L2 penalty does not impose a zero coefficient');
});

test('Lloyd update reduces squared inertia on the disclosed synthetic data', () => {
  const x=[0,1,8,9],initial=[0,8];
  const groups=x.map(v=>Math.abs(v-initial[0])<=Math.abs(v-initial[1])?0:1);
  assert.deepEqual(groups,[0,0,1,1]);
  const means=[0,1].map(k=>{
    const values=x.filter((_,i)=>groups[i]===k);
    return values.reduce((s,v)=>s+v,0)/values.length;
  });
  assert.deepEqual(means,[.5,8.5]);
  const inertia=c=>x.reduce((s,v,i)=>s+(v-c[groups[i]])**2,0);
  assert.equal(inertia(initial),2);
  near(inertia(means),answer('kmeans-one-lloyd-update'),'centroid inertia');
  assert.ok(inertia([.4,8.5])>inertia(means));
});


test('A stable Lloyd fixed point can be worse than another stable partition', () => {
  const x=[0,1,5,6,10,12], local=[.5,8.25], better=[3,11];
  const assign=centers=>x.map(value=>
    Math.abs(value-centers[0])<=Math.abs(value-centers[1])?0:1);
  const centroid=(assignment,group)=>{
    const points=x.filter((_,i)=>assignment[i]===group);
    return points.reduce((sum,value)=>sum+value,0)/points.length;
  };
  const sse=centers=>x.reduce((sum,value)=>
    sum+Math.min((value-centers[0])**2,(value-centers[1])**2),0);
  assert.deepEqual(assign(local),[0,0,1,1,1,1]);
  assert.deepEqual(assign(better),[0,0,0,0,1,1]);
  for(const centers of [local,better]){
    const groups=assign(centers);
    assert.deepEqual([centroid(groups,0),centroid(groups,1)],centers,
      'both partitions are stationary under Lloyd centroid updates');
  }
  assert.equal(sse(local),33.25);
  assert.equal(sse(better),28);
  assert.ok(sse(better)<sse(local),'the first Lloyd fixed point is suboptimal');
  assert.match(records[key('kmeans-one-lloyd-update')].counterexample,/33\.25/);
});

test('Prevalence shift changes positive predictive value with fixed rates', () => {
  const ppv=pi=>(.8*pi)/(.8*pi+.1*(1-pi));
  near(ppv(.1),answer('prevalence-and-precision-shift'),'base prevalence PPV');
  near(ppv(.5),8/9,'higher prevalence PPV');
  assert.equal(ppv(0),0);
  assert.equal(ppv(1),1);
  assert.ok(ppv(.1)<ppv(.2)&&ppv(.2)<ppv(.5));
  assert.ok(Number.isNaN(0/0),'PPV is undefined with no predicted positives');
});

test('All twelve reviewed lessons retain explicit falsification and offline evidence', () => {
  assert.equal(Object.keys(records).length,12);
  for(const [id,lesson] of Object.entries(records)){
    assert.ok(Array.isArray(lesson.reasoningSteps)&&lesson.reasoningSteps.length>=3,id);
    assert.ok(Array.isArray(lesson.labPlan)&&lesson.labPlan.length>=3,id);
    assert.ok(lesson.offlineLab.runtime.includes('Node.js'),id);
    assert.ok(lesson.offlineLab.code.includes("node:assert/strict"),id);
    assert.ok(lesson.counterexample&&lesson.counterexample.length>30,id);
    assert.ok(lesson.workedExample.assumptions&&lesson.workedExample.units,id);
  }
});
