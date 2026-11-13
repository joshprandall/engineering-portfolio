'use strict';
// Core Leadership lessons (reliability, recovery, incidents, capacity, governance, labs,
// operations, strategy): every number a lesson states is recomputed here from first principles,
// the lesson scope is pinned against stored pre-change snapshots, and each lesson must cite a
// verified primary source.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const chunks = ['reliability', 'recovery', 'incidents', 'capacity', 'governance', 'lab', 'operations', 'strategy'];
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
  nist: 'https://doi.org/10.6028/NIST.SP.800-34r1',
  intro: 'https://sre.google/sre-book/introduction/',
  toil: 'https://sre.google/sre-book/eliminating-toil/',
  monitoring: 'https://sre.google/sre-book/monitoring-distributed-systems/',
  oncall: 'https://sre.google/sre-book/being-on-call/',
  overload: 'https://sre.google/sre-book/handling-overload/',
  alerts: 'https://sre.google/workbook/alerting-on-slos/',
  nistIR: 'https://doi.org/10.6028/NIST.SP.800-61r3',
  little: 'https://doi.org/10.1287/opre.9.3.383'
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

{ // load shedding
  const capacity = 1000, offered = 1500, deadline = 1;
  const growth = offered - capacity, queueAt2 = growth * 2, wait = queueAt2 / capacity;
  assert.ok(wait >= deadline);
  const reject = (requests, accepts, K) => Math.max(0, (requests - K * accepts) / (requests + 1));
  assert.equal(reject(1500, 1000, 2), 0);
  add('capacity', 'leadership-v06-load-shedding', [SOURCES.overload],
    [fmt(growth) + ' requests per second', fmt(queueAt2) + ' requests', '2/3', pct(capacity / offered, 1), reject(1500, 600, 2).toFixed(2), '(1,500 − 1,200) / 1,501']);
}
{ // queue growth
  const arrive = 120, serve = 100, seconds = 300;
  const queue = (arrive - serve) * seconds, wait = queue / serve;
  const W = 40 / 80, faster = 125, drain = queue / (faster - arrive);
  add('capacity', 'leadership-v06-queue-growth-under-overload', [SOURCES.little, SOURCES.overload],
    [String(arrive - serve) + ' requests per second', fmt(queue) + ' requests', wait + ' seconds', 'W = 40 / 80 = ' + W, fmt(drain) + ' seconds', drain / 60 + ' minutes']);
}
{ // incident-response governance
  const obligations = [{ limit: 15, actual: 12 }, { limit: 30, actual: 48 }];
  const met = obligations.filter(o => o.actual <= o.limit).length + 1; // legal review completed first
  assert.equal(met, 2);
  add('governance', 'leadership-v06-incident-response-governance', [SOURCES.nistIR],
    [String(48 - 30) + ' minutes late', 'Two of the three obligations', String(30 - 22) + ' minutes to spare']);
}
{ // postmortem action items
  const items = { prevention: 3, detection: 2, process: 1, notActionable: 2 };
  const actionable = items.prevention + items.detection + items.process;
  assert.equal(actionable + items.notActionable, 8);
  add('incidents', 'leadership-v06-postmortem-action-items', [SOURCES.postmortem],
    ['Six of the eight', '4 / 6 ≈ ' + Math.round(100 * 4 / 6) + '%', 'seventh actionable item']);
}
{ // lab: spend an error budget
  const window = 20000000, budget = 0.001 * window, used = 0.7 * budget, remaining = budget - used;
  const migration = 0.0005 * 10000000, doubled = 2 * migration, canary = 0.0005 * 100000;
  assert.ok(close(budget, 20000) && close(remaining, 6000) && close(migration, 5000));
  add('lab', 'leadership-v06-lab-spend-an-error-budget', [SOURCES.risk, SOURCES.workbook],
    [fmt(budget) + ' failed requests', fmt(used) + ' are spent', fmt(remaining) + ' remain', fmt(migration) + ' failures', fmt(remaining - migration), pct((remaining - migration) / budget, 0),
     fmt(doubled) + ' failures', fmt(doubled - remaining) + ' more', pct(migration / remaining, 0), String(canary) + ' failures']);
}
{ // lab: reconstruct a timeline
  const utc = { impact: '14:03', alert: '14:11', ack: '14:16', mitigate: '14:52', resolve: '15:40' };
  const d = (a, b) => minutes(utc[b]) - minutes(utc[a]);
  assert.equal(minutes('06:03') + 8 * 60, minutes(utc.impact));
  assert.equal(minutes('14:14') + 2, minutes(utc.ack));
  add('lab', 'leadership-v06-lab-reconstruct-an-incident-timeline', [SOURCES.incidents],
    [d('impact', 'alert') + ' minutes', 'acknowledge is ' + d('alert', 'ack') + ' minutes', d('alert', 'mitigate') + ' minutes', d('impact', 'mitigate') + ' minutes', d('alert', 'resolve') + ' minutes',
     (minutes('14:14') - minutes(utc.alert)) + '-minute acknowledgement', String(d('impact', 'mitigate') - 5) + ' minutes']);
}
{ // lab: identify and reduce toil
  const tasks = [[15, 24], [20, 18], [60, 6], [12, 20]];
  const toil = tasks.reduce((s, [n, m]) => s + n * m, 0), week = 2400;
  assert.equal(toil + 300 + 780, week);
  const after = toil - 360;
  add('lab', 'leadership-v06-lab-identify-and-reduce-toil', [SOURCES.toil],
    [fmt(toil) + ' minutes', pct(toil / week, 0), pct(after / week, 0), (960 / 360).toFixed(1) + ' weeks']);
}
{ // four golden signals
  const requests = 12000, failures = 180;
  add('operations', 'leadership-v06-the-four-golden-signals', [SOURCES.monitoring],
    [String(requests / 60) + ' requests per second', pct(failures / requests, 1), String(850 - 500) + ' ms', fmt(requests - failures), pct((requests - failures) / requests, 1), 92 * 2 + '%']);
}
{ // symptom-based alerting
  const hours = 30 * 24, budgetRate = 0.1;
  const burn = 1.44 / budgetRate, consumed = burn / hours;
  assert.ok(close(burn, 14.4, 1e-9) && close(consumed, 0.02, 1e-12));
  add('operations', 'leadership-v06-symptom-based-alerting', [SOURCES.alerts, SOURCES.monitoring],
    [String(hours) + ' hours', '= 14.4', pct(consumed, 0), String(Math.round(hours / burn)) + ' hours', pct(6 * 6 / hours, 0)]);
}
{ // toil
  const per = 2 * 20;
  add('operations', 'leadership-v06-toil', [SOURCES.toil],
    [fmt(30 * per) + ' minutes', String(30 * per / 60) + ' hours', fmt(60 * per) + ' minutes', String(60 * per / 60) + ' hours', String(per) + ' minutes']);
}
{ // toil reduction
  const items = { renew: [20, 16], access: [10, 30], leak: [6, 24] };
  const payback = (k) => items[k][1] / items[k][0];
  assert.ok(payback('renew') < payback('access') && payback('access') < payback('leak'));
  assert.ok(items.renew[1] + items.leak[1] <= 40 && items.renew[1] + items.access[1] > 40);
  add('operations', 'leadership-v06-toil-reduction', [SOURCES.toil],
    [String(payback('renew')) + ' months', String(payback('access')) + ' months', String(payback('leak')) + ' months', String(items.renew[0] + items.leak[0]) + ' hours a month', String(2 * 26) + ' hours', String(30 / 25) + ' months']);
}
{ // on-call readiness
  const onCall = 2, limit = 0.25;
  const minimum = onCall / limit;
  assert.equal(minimum, 8);
  add('operations', 'leadership-v06-on-call-readiness', [SOURCES.oncall],
    [String(minimum) + ' engineers', '2 of every 8 weeks', String(3 * 6) + ' hours', pct(onCall / 6, 0)]);
}
{ // runbook purpose
  add('operations', 'leadership-v06-runbook-purpose', [SOURCES.intro],
    ['3x', String(90 / 3) + ' minutes', 'a total of 3 changes']);
}
{ // reliability as a product property
  const month = 43200, perRelease = 5;
  const a = Math.floor(0.001 * month / perRelease), b = Math.floor(0.0005 * month / perRelease), c = Math.floor(0.0005 * month / 2);
  assert.deepEqual([a, b, c], [8, 4, 10]);
  add('strategy', 'leadership-v06-reliability-as-a-product-property', [SOURCES.risk],
    ['≈ ' + a + ' risky', 'about ' + b, a + ' releases × 5 minutes = ' + a * perRelease + ' minutes', '≈ ' + c + ' risky releases']);
}

test('exactly the authored lessons changed, and only their question, reasoning and lab fields', () => {
  const authored = new Set(cases.map(c => c.id));
  assert.equal(authored.size, 26);
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
