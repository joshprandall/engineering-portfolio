'use strict';
// Robotics and machine-learning worked examples in eight math lessons. Every number a lesson
// states is recomputed here, each lesson must cite a source whose content was checked before it
// was cited, and every other record in the touched chunks is pinned against a stored snapshot.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const chunks = ['algebra', 'calculus', 'discrete-math', 'functions', 'linear-algebra'];
const current = {};
const baseline = {};
for (const c of chunks) {
  current[c] = JSON.parse(fs.readFileSync(path.join(root, 'deep-learning/math', c + '.json'), 'utf8'));
  baseline[c] = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'baselines', 'math-' + c + '.json.gz'))).toString('utf8'));
}

const SOURCES = {
  unitCircle: 'https://openstax.org/books/algebra-and-trigonometry/pages/7-3-unit-circle',
  singularities: 'https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-3-singularities/',
  derivative: 'https://openstax.org/books/calculus-volume-1/pages/3-1-defining-the-derivative',
  metrics: 'https://scikit-learn.org/stable/modules/model_evaluation.html',
  grid: 'https://scikit-learn.org/1.7/modules/grid_search.html',
  linear: 'https://scikit-learn.org/stable/modules/linear_model.html',
  vectors: 'https://openstax.org/books/university-physics-volume-1/pages/2-1-scalars-and-vectors'
};

const deg = (d) => d * Math.PI / 180;
const fmt = (x, digits = 0) => x.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
// Lessons print negative numbers with a true minus sign (U+2212).
const minus = (s) => String(s).replace(/-/g, '\u2212');
const cases = [];
const add = (chunk, id, sources, expectations) => cases.push({ chunk, id, sources, expectations });

{ // two-link arm forward kinematics
  const l1 = 0.5, l2 = 0.3, t1 = deg(30), t2 = deg(45);
  const x = l1 * Math.cos(t1) + l2 * Math.cos(t1 + t2), y = l1 * Math.sin(t1) + l2 * Math.sin(t1 + t2);
  const r2 = l1 ** 2 + l2 ** 2 + 2 * l1 * l2 * Math.cos(t2);
  assert.ok(close(x * x + y * y, r2, 1e-12), 'law of cosines agrees with the coordinates');
  const wrong = [l1 * Math.cos(30) + l2 * Math.cos(75), l1 * Math.sin(30) + l2 * Math.sin(75)];
  const turned = [l1 * Math.cos(deg(390)) + l2 * Math.cos(deg(435)), l1 * Math.sin(deg(390)) + l2 * Math.sin(deg(435))];
  assert.ok(close(turned[0], x, 1e-12) && close(turned[1], y, 1e-12), '390° matches 30°');
  add('algebra', 'math-trig', [SOURCES.unitCircle],
    ['≈ ' + (l1 * Math.cos(t1)).toFixed(3) + ' + ' + (l2 * Math.cos(t1 + t2)).toFixed(3) + ' = ' + x.toFixed(3) + ' m',
     '≈ ' + (l1 * Math.sin(t1)).toFixed(3) + ' + ' + (l2 * Math.sin(t1 + t2)).toFixed(3) + ' = ' + y.toFixed(3) + ' m',
     '≈ ' + r2.toFixed(4), 'r ≈ ' + Math.sqrt(r2).toFixed(3) + ' m', '≈ ' + Math.cos(30).toFixed(3), '≈ ' + minus(Math.sin(30).toFixed(3)),
     '(' + wrong[0].toFixed(3) + ', ' + minus(wrong[1].toFixed(3)) + ')', '(' + (0.8 * Math.cos(t1)).toFixed(3) + ', ' + (0.8 * Math.sin(t1)).toFixed(3) + ')', (Math.PI / 6).toFixed(4)]);
}
{ // Jacobian columns and linear dependence
  const l1 = 0.5, l2 = 0.3;
  const jac = (a, b) => [[-l1 * Math.sin(a) - l2 * Math.sin(a + b), l1 * Math.cos(a) + l2 * Math.cos(a + b)], [-l2 * Math.sin(a + b), l2 * Math.cos(a + b)]];
  const det = ([c1, c2]) => c1[0] * c2[1] - c1[1] * c2[0];
  const posed = jac(deg(30), deg(45)), straight = jac(deg(30), 0), folded = jac(deg(30), deg(180));
  assert.ok(close(det(posed), l1 * l2 * Math.sin(deg(45)), 1e-12), 'determinant formula');
  assert.ok(close(det(straight), 0, 1e-12) && close(det(folded), 0, 1e-12));
  const [c1, c2] = straight;
  assert.ok(close(3 * c1[0] - 8 * c2[0], 0, 1e-12) && close(3 * c1[1] - 8 * c2[1], 0, 1e-12), '3 J1 − 8 J2 = 0');
  add('linear-algebra', 'math-linear-independence', [SOURCES.singularities],
    ['0.5 × 0.3 × sin θ2 = ' + l1 * l2 + ' sin θ2', 'about ' + det(posed).toFixed(3), 'J1 ≈ (' + minus(c1[0].toFixed(1)) + ', ' + c1[1].toFixed(3) + ')', 'J2 ≈ (' + minus(c2[0].toFixed(2)) + ', ' + c2[1].toFixed(3) + ')',
     '8/3 ≈ ' + (c1[0] / c2[0]).toFixed(3), '3 J1 − 8 J2 = 0', fmt(Math.abs(l1 - l2), 1) + ' m from the base']);
}
{ // finite differences from encoder samples
  const theta = (t) => 0.5 * t * t, h = 0.001, noise = 0.0005;
  const forward = (theta(2 + h) - theta(2)) / h, central = (theta(2 + h) - theta(2 - h)) / (2 * h);
  assert.ok(close(forward, 2.0005, 1e-9) && close(central, 2, 1e-9));
  add('calculus', 'math-derivatives', [SOURCES.derivative],
    ['(' + theta(2 + h).toFixed(7) + ' − 2) / 0.001 = ' + forward.toFixed(4) + ' rad/s', '(' + theta(2 + h).toFixed(7) + ' − ' + theta(2 - h).toFixed(7) + ') / 0.002 = 2 rad/s',
     'off by ' + (forward - 2).toFixed(4) + ' rad/s', '/ 0.001 = ' + (2 * noise / h).toFixed(1) + ' rad/s', '/ 0.01 = ' + (2 * noise / 0.01).toFixed(1) + ' rad/s', '0.5 × 0.01 × 1 = ' + (0.5 * 0.01 * 1).toFixed(3) + ' rad/s']);
}
{ // precision and recall as set operations
  const universe = 1000, flagged = 120, both = 90, missed = 30, actual = both + missed;
  const union = flagged + actual - both, negatives = universe - union;
  assert.equal(both + (flagged - both) + missed + negatives, universe);
  add('discrete-math', 'math-sets-logic', [SOURCES.metrics],
    ['120 − 90 = ' + (flagged - both), '90 / 120 = ' + both / flagged, '120 + 120 − 90 = ' + union, '1,000 − 150 = ' + negatives, 'accounts for every part',
     '(90 + 850) / 1,000 = ' + Math.round(100 * (both + negatives) / universe) + '%', '(1,000 − 120) / 1,000 = ' + Math.round(100 * (universe - actual) / universe) + '%',
     '110 / 200 = ' + 110 / 200, '110 / 120 ≈ ' + (110 / 120).toFixed(3)]);
}
{ // logarithms, underflow and log loss
  const product = 0.5 ** 1000;
  assert.ok(product > 0 && 0.5 ** 1100 === 0, 'double precision underflows between 1,000 and 1,100 factors');
  const [mantissa, exponent] = product.toExponential(2).split('e');
  const loss = (p) => -Math.log(p);
  add('algebra', 'math-logarithms', [SOURCES.metrics],
    ['≈ ' + mantissa + ' × 10^−' + exponent.slice(1), '≈ ' + minus((1000 * Math.log(0.5)).toFixed(2)), '≈ ' + loss(0.9).toFixed(3), '≈ ' + loss(0.5).toFixed(3), '≈ ' + loss(0.01).toFixed(3),
     'about ' + Math.round(loss(0.01) / loss(0.9)) + ' times', '≈ ' + (-Math.log2(0.01)).toFixed(3) + ' bits', 'e^−0.105 ≈ ' + Math.exp(-0.105).toFixed(2), 'e^4.605 ≈ ' + Math.round(Math.exp(4.605))]);
}
{ // grid search counting
  const linear = 4, rbf = 4 * 2, folds = 5;
  const pairs = []; for (const c of [1, 10, 100, 1000]) for (const g of [0.001, 0.0001]) pairs.push([c, g]);
  assert.equal(pairs.length, rbf);
  let c20 = 1; for (let i = 0; i < 3; i++) c20 = c20 * (20 - i) / (i + 1);
  add('discrete-math', 'math-combinatorics', [SOURCES.grid],
    ['4 × 2 = ' + rbf, '4 + 8 = ' + (linear + rbf), '12 × 5 = ' + (linear + rbf) * folds, '2^20 − 1 = ' + fmt(2 ** 20 - 1), fmt((2 ** 20 - 1) * folds) + ' fits',
     '4^3 = ' + 4 ** 3, '5^3 = ' + 5 ** 3, '20 × 5 = ' + 20 * folds, 'C(20, 3) = ' + fmt(c20)]);
}
{ // the logistic function
  const p = (z) => 1 / (1 + Math.exp(-z));
  assert.ok(close(p(-2) + p(2), 1, 1e-12) && close(Math.log(p(2) / (1 - p(2))), 2, 1e-9));
  assert.ok(close(p(Math.log(4)), 0.8, 1e-12));
  add('functions', 'math-functions', [SOURCES.linear],
    ['1 / (1 + 1) = 0.5', '≈ ' + p(2).toFixed(3), '≈ ' + p(-2).toFixed(3), p(-2).toFixed(3) + ' + ' + p(2).toFixed(3) + ' = 1', 'ln 4 ≈ ' + Math.log(4).toFixed(3), 'about ' + p(1).toFixed(3)]);
}
{ // odometry by vector addition
  const legs = [[3, 0], [0, 4], [-1, 0]];
  const sum = (vs) => vs.reduce((a, v) => [a[0] + v[0], a[1] + v[1]], [0, 0]);
  const end = sum(legs), reordered = sum([legs[1], legs[2], legs[0]]);
  assert.deepEqual(end, reordered);
  const drifted = [4 * Math.cos(deg(95)), 4 * Math.sin(deg(95))];
  const actual = sum([legs[0], drifted, legs[2]]);
  const error = Math.hypot(actual[0] - end[0], actual[1] - end[1]);
  add('linear-algebra', 'lab-vector-playground', [SOURCES.vectors],
    ['= (' + end.join(', ') + ')', '√20 ≈ ' + Math.hypot(...end).toFixed(3) + ' m', 'about ' + (Math.atan2(end[1], end[0]) * 180 / Math.PI).toFixed(1) + '°', '3 + 4 + 1 = 8 m',
     'd1 · d2 = 3 × 0 + 0 × 4 = 0', '(' + minus(drifted[0].toFixed(3)) + ', ' + drifted[1].toFixed(3) + ')', '(' + actual[0].toFixed(3) + ', ' + actual[1].toFixed(3) + ')', 'about ' + error.toFixed(3) + ' m']);
}

test('original eight lessons retain exact scoped changes through later independent checkpoints', () => {
  // Keep the original historical scope audit and original authored records exact.
  // New disjoint records have their own baseline/scope/numeric tests.
  const scopeCurrent = {...current};
  for (const [chunk, file] of [['calculus', 'calculus-rule-foundations.json.gz'], ['algebra', 'algebra-function-foundations.json.gz'], ['discrete-math', 'discrete-set-counting-foundations.json.gz']]) {
    const checkpoint = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'baselines', file))).toString('utf8'));
    scopeCurrent[chunk] = checkpoint;
    assert.deepEqual(Object.keys(current[chunk]), Object.keys(checkpoint));
    for (const c of cases) if(c.chunk === chunk) assert.deepEqual(current[chunk][c.id], checkpoint[c.id], c.id + ': original authored record preserved');
  }
  const authored = new Set(cases.map(c => c.id));
  assert.equal(authored.size, 8);
  for (const c of chunks) {
    assert.deepEqual(Object.keys(scopeCurrent[c]), Object.keys(baseline[c]), c + ': lesson IDs and order are unchanged');
    for (const id of Object.keys(baseline[c])) {
      const before = baseline[c][id], after = scopeCurrent[c][id];
      const diff = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(f => JSON.stringify(before[f]) !== JSON.stringify(after[f]));
      if (authored.has(id)) assert.deepEqual(diff.sort(), ['essentialQuestion', 'labPlan', 'reasoningSteps'], id);
      else assert.deepEqual(diff, [], id + ' must be untouched');
    }
  }
});

for (const c of cases) {
  test(c.id + ': structure, sources and independently computed values', () => {
    const lesson = current[c.chunk][c.id];
    assert.ok(lesson, c.id);
    assert.ok(!/^What does .* mean/.test(lesson.essentialQuestion), c.id + ': specific question');
    assert.equal(lesson.reasoningSteps.length, 6);
    assert.equal(lesson.labPlan.length, 6);
    assert.equal(new Set(lesson.reasoningSteps).size, 6);
    assert.equal(new Set(lesson.labPlan).size, 6);
    const text = [lesson.essentialQuestion, ...lesson.reasoningSteps, ...lesson.labPlan].join(' ');
    for (const src of c.sources) assert.ok(lesson.reasoningSteps[5].includes(src), c.id + ' cites ' + src);
    const urls = text.match(/https?:\/\/[^\s,)]+/g) || [];
    for (const u of urls) assert.ok(Object.values(SOURCES).includes(u.replace(/[.;:]$/, '')), c.id + ': unverified URL ' + u);
    const reasoning = lesson.reasoningSteps.join(' ');
    for (const value of c.expectations) assert.ok(reasoning.includes(value), c.id + ' reasoning states ' + value);
    assert.match(lesson.reasoningSteps[0], /invented|illustrative|idealized|model/i, c.id + ': states its model boundary');
  });
}
