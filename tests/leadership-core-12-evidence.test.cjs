'use strict';
// Twelve core Leadership lessons (reliability, recovery, incidents): every number a lesson
// states is recomputed here from first principles, the lesson scope is pinned against a stored
// pre-change snapshot, and each lesson must cite a verified primary source.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const chunks = ['reliability', 'recovery', 'incidents'];
const current = {};
const baseline = {};
for (const c of chunks) {
  current[c] = JSON.parse(fs.readFileSync(path.join(root, 'deep-learning/leadership', c + '.json'), 'utf8'));
  baseline[c] = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'baselines', 'leadership-' + c + '.json.gz'))).toString('utf8'));
}

const SOURCES = {
  slo: 'https://sre.google/sre-book/service-level-objectives/',
  risk: 'https://sre.google/sre-book/embracing-risk/',
  workbook: 'https://sre.google/workbook/implementing-slos/',
  cascade: 'https://sre.google/sre-book/addressing-cascading-failures/',
  incidents: 'https://sre.google/sre-book/managing-incidents/',
  postmortem: 'https://sre.google/sre-book/postmortem-culture/',
  nist: 'https://doi.org/10.6028/NIST.SP.800-34r1'
};

const fmt = (x, digits = 0) => x.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (x, digits) => (100 * x).toFixed(digits) + '%';
const minutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return 60 * h + m; };
const close = (a, b, eps = 1e-12) => Math.abs(a - b) <= eps;

// Each case: chunk, lesson ID, required sources, and strings computed here that the lesson must state.
const cases = [];
const add = (chunk, id, sources, expectations) => cases.push({ chunk, id, sources, expectations });

{ // SLI
  const valid = 10000, good = 9950, probes = 2000, slow = 300;
  const sli = good / valid, alt = 1 - (valid - good) / valid;
  assert.ok(close(sli, alt));
  const inflated = (good + probes) / (valid + probes);
  const tightened = (good - slow) / valid;
  add('reliability', 'leadership-v06-service-level-indicator', [SOURCES.slo],
    [fmt(good), fmt(valid), String(sli), pct(sli, 1), String(valid - good), inflated.toFixed(4), pct(inflated, 2), fmt(good - slow), pct(tightened, 1)]);
}
{ // SLO
  const window = 30 * 24 * 60, slo = 0.999;
  const allowed = (1 - slo) * window;
  assert.ok(close(allowed, 43.2, 1e-9));
  const yearlyHours = 0.001 * 365 * 24;
  const stricter = 0.0005 * window;
  add('reliability', 'leadership-v06-service-level-objective', [SOURCES.slo],
    [fmt(window), '43.2', fmt(window - 43.2, 1), yearlyHours.toFixed(2), fmt(365 * 24), stricter.toFixed(1), '99.95%']);
  assert.ok(yearlyHours * 60 / allowed > 12 && yearlyHours * 60 / allowed < 12.5, 'roughly twelvefold');
}
{ // error budget
  const requests = 2000000, failures = 1200;
  const budget = Math.round(0.001 * requests);
  const success = (requests - failures) / requests;
  const halved = requests / 2, budget2 = Math.round(0.001 * halved);
  add('reliability', 'leadership-v06-error-budget', [SOURCES.risk, SOURCES.workbook],
    [fmt(budget), fmt(budget - failures), pct(failures / budget, 0), String(success), fmt(budget2), pct(failures / budget2, 0), String((halved - failures) / halved)]);
  assert.ok(success >= 0.999);
  assert.ok((halved - failures) / halved < 0.999);
}
{ // cascading failure
  const replicas = 4, cap = 1000, load = 3600;
  const before = load / replicas, after = load / (replicas - 1), served = (replicas - 1) * cap, unserved = load - served;
  const needed = Math.ceil(load / cap);
  add('reliability', 'leadership-v06-cascading-failure', [SOURCES.cascade],
    [fmt(before) + ' rps', fmt(after) + ' rps', fmt(served) + ' rps', fmt(unserved) + ' rps', 'N+1 = ' + (needed + 1), fmt(load + unserved) + ' rps', '20%', '90%']);
  assert.equal(load / (needed + 1 - 1), 900);
}
{ // graceful degradation
  const catalog = 0.9995, recs = 0.98;
  const hard = catalog * recs;
  assert.ok(close(hard, 0.97951));
  add('reliability', 'leadership-v06-graceful-degradation', [SOURCES.cascade],
    ['0.97951', pct(hard, 2), fmt(Math.round(100000 * (1 - hard))), fmt(Math.round(100000 * (1 - catalog))), fmt(100000 * (1 - recs)), '99.95%']);
}
{ // reliability targets
  const window = 43200;
  const allowance = 0.0001 * window;
  const ceiling = 0.9995 * 0.9995;
  const pairUnavailable = 0.0005 ** 2;
  const redundant = (1 - pairUnavailable) ** 2;
  assert.ok(close(ceiling, 0.99900025));
  add('reliability', 'leadership-v06-reliability-target-tradeoffs', [SOURCES.risk],
    [allowance.toFixed(2), '0.99900025', '0.00000025', pct(1 - pairUnavailable, 6), pct(redundant, 5)]);
  assert.ok(ceiling < 0.9999 && redundant > 0.9999);
}
{ // RTO
  const phases = [45, 30, 120], rto = 240;
  const total = phases.reduce((a, b) => a + b, 0), slower = 45 + 30 + 180;
  add('recovery', 'leadership-v06-recovery-time-objective', [SOURCES.nist],
    [total + ' minutes', String(rto - total) + ' minutes', String(phases[0] + phases[1]) + ' minutes', slower + ' minutes', String(slower - rto) + ' minutes']);
}
{ // RPO
  const interval = 6 * 60, failure = minutes('11:59'), lastBackup = minutes('06:00');
  const lost = failure - lastBackup;
  assert.ok(lost < interval);
  add('recovery', 'leadership-v06-recovery-point-objective', [SOURCES.nist],
    [Math.floor(lost / 60) + ' hours ' + (lost % 60) + ' minutes', '06:00', '11:59', '30 minutes']);
}
{ // contingency plan testing
  const claims = { a: 'untested', b: 'discussed', c: 'measured', d: 'measured', e: 'discussed' };
  const count = (k) => Object.values(claims).filter(v => v === k).length;
  assert.deepEqual([count('measured'), count('discussed'), count('untested')], [2, 2, 1]);
  assert.ok(110 <= 120 && 25 <= 30);
  add('recovery', 'leadership-v06-contingency-plan-testing', [SOURCES.nist],
    ['110 minutes', '25 minutes', '22 minutes', String(22 - 15) + ' minutes', 'two have measured timing evidence (c, d), two have discussion evidence only (b, e) and one (a) is untested']);
}
{ // incident command
  const pairs = (n) => n * (n - 1) / 2;
  const names = ['A', 'B', 'C', 'D'];
  const listed = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) listed.push(names[i] + names[j]);
  assert.equal(listed.length, pairs(4));
  add('incidents', 'leadership-v06-incident-command', [SOURCES.incidents],
    ['4 × 3 / 2 = ' + pairs(4), '6 × 5 / 2 = ' + pairs(6), listed.slice(0, -1).join(', ') + ' and ' + listed.at(-1)]);
}
{ // incident timeline
  const t = { impact: '08:58', alert: '09:12', ack: '09:17', mitigate: '10:05', resolve: '11:40' };
  const d = (a, b) => minutes(t[b]) - minutes(t[a]);
  const tta = d('alert', 'ack'), ttm = d('alert', 'mitigate'), ttr = d('alert', 'resolve');
  assert.equal(tta + d('ack', 'mitigate') + d('mitigate', 'resolve'), ttr);
  const skewedAck = minutes('09:17') - 3 - minutes(t.alert);
  add('incidents', 'leadership-v06-incident-timeline', [SOURCES.incidents],
    [tta + ' minutes', ttm + ' minutes', ttr + ' minutes', '2 hours 28 minutes', d('ack', 'mitigate') + ' minutes', d('mitigate', 'resolve') + ' minutes',
     d('impact', 'mitigate') + ' minutes', d('impact', 'alert') + ' minutes', skewedAck + ' minutes']);
}
{ // blameless postmortem
  const items = { prevention: 4, detection: 1, notActionable: 1 };
  const actionable = items.prevention + items.detection, total = actionable + items.notActionable;
  add('incidents', 'leadership-v06-blameless-postmortems', [SOURCES.postmortem],
    [actionable + ' of the ' + total, '40 minutes']);
}

test('exactly the twelve authored lessons changed, and only their question, reasoning and lab fields', () => {
  const authored = new Set(cases.map(c => c.id));
  assert.equal(authored.size, 12);
  for (const c of chunks) {
    assert.deepEqual(Object.keys(current[c]), Object.keys(baseline[c]), c + ': lesson IDs and order are unchanged');
    for (const id of Object.keys(baseline[c])) {
      const before = baseline[c][id], after = current[c][id];
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
    assert.match(lesson.reasoningSteps[0], /invented|illustrative|synthetic|model/i, c.id + ': states its model boundary');
    assert.doesNotMatch(text, /we measured|in production we observed|proven in the field/i);
  });
}
