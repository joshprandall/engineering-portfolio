'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'ai-machine-learning.html'), 'utf8');
const match = html.match(/<section id="evaluation-repro-lab"[\s\S]*?<\/section>/);
assert(match, 'The authored AI evaluation lab must be present');
const lab = match[0];
assert(lab.includes('aria-labelledby="evaluation-repro-lab-title"'));
assert(lab.includes('id="evaluation-repro-lab-title"'));
assert.equal((lab.match(/<details>/g) || []).length, 4);
assert.equal((lab.match(/<summary>/g) || []).length, 4);
assert(lab.includes('synthetic') && lab.includes('not a deployed model'), 'The evidence boundary must be explicit');
assert(lab.includes('https://scikit-learn.org/stable/modules/generated/sklearn.metrics.f1_score.html'));
assert(lab.includes('https://www.nist.gov/itl/ai-risk-management-framework'));
assert(lab.includes('data-evaluation-example="python"'), 'Replication must be provided');

function count(name) {
  const m = lab.match(new RegExp('data-case="' + name + '" data-count="(\\d+)"'));
  assert(m, 'Missing count for ' + name);
  return Number(m[1]);
}
function metric(name) {
  const m = lab.match(new RegExp('data-metric="' + name + '" data-value="([0-9.]+)"'));
  assert(m, 'Missing displayed metric for ' + name);
  return Number(m[1]);
}
const tp = count('tp'), fp = count('fp'), fn = count('fn'), tn = count('tn');
assert.deepEqual({tp, fp, fn, tn}, {tp:9,fp:11,fn:3,tn:77});
assert.equal(tp + fp + fn + tn, 100);
assert.equal(tp + fn, 12);
assert.equal(tn + fp, 88);

const expected = {
  precision: tp/(tp+fp), recall: tp/(tp+fn),
  specificity: tn/(tn+fp), accuracy: (tp+tn)/100,
  f1: 2*tp/(2*tp+fp+fn),
  'balanced-accuracy': (tp/(tp+fn) + tn/(tn+fp))/2,
  'model-cost': 2*fp + 20*fn,
  'baseline-cost': 20*(tp+fn),
};
for(const [name, value] of Object.entries(expected)){
  assert.equal(metric(name), value, 'Metric mismatch: '+name);
}
assert.equal(9/(9+16),0.36);
assert.equal((tn+fp)/100,0.88, 'Always-negative baseline accuracy must be 88%');
assert(metric('accuracy') < 0.88, 'Lesson must teach the imbalanced accuracy pitfall');
console.log('PASS AI metrics lab: accessibility, four independent explanations, synthetic arithmetic, baseline and cost.');
