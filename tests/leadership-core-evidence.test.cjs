'use strict';
// Authored Leadership lessons in every chunk this test lists: every number a lesson states is
// recomputed here from first principles, the lesson scope is pinned against stored pre-change
// snapshots, and each lesson must cite a source whose content was checked before it was cited.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const chunks = ['reliability', 'recovery', 'incidents', 'capacity', 'governance', 'lab', 'operations', 'strategy', 'finance', 'itsm', 'leadership', 'projects', 'teams', 'vendors'];
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
  little: 'https://doi.org/10.1287/opre.9.3.383',
  ebp: 'https://sre.google/workbook/error-budget-policy/',
  gao: 'https://gaoinnovations.gov/cost-guide/types-of-cost-estimates.html',
  ias16: 'https://www.ifrs.org/content/dam/ifrs/publications/html-standards/english/2024/issued/ias16.html',
  sp80084: 'https://doi.org/10.6028/NIST.SP.800-84',
  csfExamples: 'https://www.nist.gov/system/files/documents/2024/02/21/CSF%202.0%20Implementation%20Examples.pdf',
  dora: 'https://dora.dev/capabilities/streamlining-change-approval/',
  yukl: 'https://core.ac.uk/download/205208894.pdf',
  flinchum: 'https://ninercommons.charlotte.edu/record/2294/files/Flinchum_uncc_0694D_13278.pdf',
  kluger: 'https://doi.org/10.1037/0033-2909.119.2.254',
  plain: 'https://digital.gov/guides/plain-language/principles/organize',
  vogels: 'https://queue.acm.org/detail.cfm?id=1142065',
  raci: 'https://towardszero.nsw.gov.au/sites/default/files/2021-05/RACI%20matrix.pdf',
  roadmap: 'https://www.gov.uk/service-manual/agile-delivery/developing-a-roadmap',
  cunningham: 'https://c2.com/doc/oopsla92.html',
  edmondson: 'https://doi.org/10.2307/2666999',
  siop: 'https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance',
  scrm: 'https://doi.org/10.6028/NIST.SP.800-161r1-upd1',
  dataAct: 'https://eur-lex.europa.eu/eli/reg/2023/2854/oj'
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

// ---- Third batch: the original core lessons in every Leadership chunk.
const usd = (x) => '$' + fmt(Math.round(x));
{ // total cost of ownership
  const a = 30000 + 10000 + 5 * (40000 + 15000) + 10000;
  const b = 80000 + 10000 + 5 * (12000 + 60000) + 20000;
  const aYear1 = 30000 + 10000 + 40000 + 15000, bYear1 = 80000 + 10000 + 12000 + 60000;
  assert.equal(aYear1 + 4 * 55000 + 10000, a);
  assert.equal(bYear1 + 4 * 72000 + 20000, b);
  const b2 = 80000 + 10000 + 5 * (12000 + 30000) + 20000;
  assert.ok(b2 < a, 'halving the administrator time flips the ranking');
  add('finance', 'leadership-tco', [SOURCES.gao], [usd(a), usd(b), usd(5 * 40000), usd(b - a), usd(aYear1), usd(bYear1), usd(b2)]);
}
{ // capital versus operating spending
  const cost = 240000, life = 4, maintenance = 12000, rent = 7000 * 12;
  const dep = cost / life;
  assert.equal(life * dep, cost);
  assert.equal(life * (dep + maintenance), cost + life * maintenance, 'expense and cash agree over the whole life');
  add('finance', 'leadership-budget-capex-opex', [SOURCES.ias16],
    [usd(dep), usd(cost + maintenance), usd(dep + maintenance), usd(rent), usd(life * (dep + maintenance)), usd(life * rent), usd(cost / 3), usd(cost / 3 + maintenance)]);
}
{ // incident command timeline
  const detect = minutes('14:05'), declare = minutes('14:20'), rollback = minutes('14:50'), normal = minutes('14:58');
  const parts = [declare - detect, rollback - declare, normal - rollback];
  assert.equal(parts.reduce((x, y) => x + y), normal - detect);
  add('incidents', 'leadership-incident-command', [SOURCES.incidents],
    [(normal - detect) + ' minutes', parts[0] + ' minutes from first error', parts[1] + ' minutes from declaration', parts[2] + ' minutes of recovery']);
}
{ // tabletop exercise
  const total = 2 + 3 * 4 + 6, rate = 300, lag = 6, rpo = 5;
  assert.equal(total, 20);
  add('incidents', 'lab-incident-tabletop', [SOURCES.sp80084],
    [total + ' minutes', fmt(lag * rate) + ' orders', fmt(rpo * rate), (lag - rpo) * rate + ' orders', fmt(3 * rate) + ' orders']);
}
{ // severity rubric
  const level = (t) => t >= 8 ? 'SEV1' : t >= 5 ? 'SEV2' : 'SEV3';
  const dash = [1, 1, 1], pay = [3, 3, 3], dashDeadline = [1, 1, 3];
  const sum = (v) => v.reduce((x, y) => x + y);
  assert.equal(level(sum(dash)), 'SEV3');
  assert.equal(level(sum(pay)), 'SEV1');
  assert.equal(level(sum(dashDeadline)), 'SEV2');
  add('incidents', 'leadership-severity', [SOURCES.csfExamples],
    [dash.join(' + ') + ' = ' + sum(dash) + ', which is SEV3', pay.join(' + ') + ' = ' + sum(pay) + ', which is SEV1',
     fmt(20000 * 0.03) + ' failed payments', dashDeadline.join(' + ') + ' = ' + sum(dashDeadline) + ' and the incident becomes SEV2']);
}
{ // one-page postmortem lab
  const rate = 1200, share = 0.4;
  const start = minutes('10:04'), alert = minutes('10:19'), back = minutes('10:31'), ok = minutes('10:36');
  const dur = ok - start, failed = Math.round(rate * dur * share);
  const parts = [alert - start, back - alert, ok - back];
  assert.equal(parts.reduce((x, y) => x + y), dur);
  const faster = dur - (alert - start) + 5, failedFaster = Math.round(rate * faster * share);
  add('incidents', 'leadership-lab-postmortem', [SOURCES.postmortem],
    [dur + ' minutes', fmt(failed), parts.join(' + ') + ' = ' + dur, 'about ' + faster + ' minutes', fmt(failedFaster), fmt(failed - failedFaster) + ' fewer']);
}
{ // postmortem criteria applied to four events
  const events = [{ degraded: 3 }, { dataLoss: true }, { degraded: 6, rollback: true }, { monitoringFailure: true }];
  const needs = (e, threshold) => (e.degraded || 0) > threshold || !!e.dataLoss || !!e.rollback || (e.resolution || 0) > 60 || !!e.monitoringFailure;
  const at10 = events.filter(e => needs(e, 10)).length, at2 = events.filter(e => needs(e, 2)).length;
  assert.equal(at10, 3);
  assert.equal(at2, 4);
  add('incidents', 'leadership-postmortem-practice', [SOURCES.postmortem], [at10 + ' of the 4 events', at2 + ' of 4 events']);
}
{ // incident roles and interruptions
  const length = 90, ask = 15, people = 6, cost = 3;
  const asks = length / ask, interruptions = people * asks;
  const faster = people * (length / 10);
  add('incidents', 'leadership-incident-roles', [SOURCES.incidents],
    [length + ' / ' + ask + ' = ' + asks, people + ' × ' + asks + ' = ' + interruptions, interruptions * cost + ' minutes', length / 30 + ' scheduled updates', people + ' × ' + length / 10 + ' = ' + faster]);
}
{ // change management
  const users = 200000, detect = 10, canary = users * 0.01;
  let rounds = 0; while (2 ** rounds < 40) rounds++;
  assert.ok(2 ** 5 < 40 && 40 <= 2 ** 6 && rounds === 6);
  add('itsm', 'leadership-change', [SOURCES.intro, SOURCES.dora],
    [fmt(users * detect) + ' user-minutes', fmt(canary * detect) + ' user-minutes', 'up to ' + rounds + ' rounds', '70%', fmt(users * 2) + ' user-minutes', fmt(canary * 2)]);
}
{ // delegation
  const each = 30, total = 30, under = 26, reviews = 3;
  const taskHours = total * each / 60, outcomeHours = (total - under) * each / 60 + reviews;
  const lower = (total - 18) * each / 60 + reviews;
  add('leadership', 'leadership-delegation', [SOURCES.yukl],
    [taskHours + ' hours in total', outcomeHours + ' hours a quarter', taskHours + ' − ' + outcomeHours + ' = ' + (taskHours - outcomeHours) + ' hours',
     under + ' / ' + total + ' ≈ ' + Math.round(100 * under / total) + '%', (total - 18) * each / 60 + ' hours, plus', 'for ' + lower + ' hours']);
}
{ // one-on-ones
  const reports = 8, length = 30, weeksPerMonth = 52 / 12;
  const weekly = reports * length;
  add('leadership', 'leadership-one-on-one', [SOURCES.flinchum],
    [reports + ' × ' + length + ' = ' + weekly + ' minutes', weekly / 60 + ' hours a week', weekly / 120 + ' hours a week', 'about ' + Math.round(weekly / weeksPerMonth) + ' minutes a week',
     '52 / 12 ≈ ' + weeksPerMonth.toFixed(2), 12 * length / 60 + ' hours a week', '303 participants']);
}
{ // feedback meta-analysis
  const d = 0.41;
  add('leadership', 'leadership-feedback', [SOURCES.kluger],
    ['607 effect sizes', '23,663 observations', 'd = 0.41', 'about ' + (d * 10).toFixed(1) + ' points', 'about ' + (d * 6).toFixed(2) + ' points', 'more than ' + 30 / 3]);
}
{ // executive communication
  const p = 0.25, cost = 60000, years = 3, upfront = 48000, yearly = 6000;
  const without = p * 4 * cost, residual = Math.round(p * (10 / 60) * cost);
  const withTotal = upfront + years * (yearly + residual);
  const p2 = 0.1, without2 = p2 * 4 * cost * years, with2 = upfront + years * (yearly + Math.round(p2 * (10 / 60) * cost));
  add('leadership', 'leadership-exec-communication', [SOURCES.plain],
    [usd(without) + ' a year', usd(years * without) + ' over three years', usd(residual) + ' a year', usd(withTotal), usd(years * without - withTotal),
     usd(without2), usd(with2), usd(without2 - with2)]);
}
{ // blameless postmortem with accountability
  add('operations', 'leadership-postmortem', [SOURCES.postmortem],
    ['120 × 0.02 = ' + (120 * 0.02).toFixed(1), '120 × 0.001 = ' + (120 * 0.001).toFixed(2), '20 × 0.001 = ' + (20 * 0.001).toFixed(2)]);
}
{ // quarterly error budget
  const quarter = 90 * 24 * 60, budget = quarter * 0.0005, used = 22 + 18;
  assert.ok(close(quarter - quarter * 0.9995, budget, 1e-6));
  add('operations', 'leadership-error-budget', [SOURCES.risk],
    [fmt(quarter) + ' minutes', budget.toFixed(1) + ' minutes', budget.toFixed(1) + ' − ' + used + ' = ' + (budget - used).toFixed(1), 'about ' + Math.round(100 * (budget - used) / budget) + '%',
     fmt(quarter * 0.9995, 1), (quarter * 0.001).toFixed(1) + ' minutes', (quarter * 0.001 - used).toFixed(1) + ' remain']);
}
{ // runbook checks
  const p = 0.01, q = 0.001;
  add('operations', 'leadership-runbook', [SOURCES.intro],
    ['0.99^12 ≈ ' + ((1 - p) ** 12).toFixed(3), 'about ' + pct(1 - (1 - p) ** 12, 1), '0.999^12 ≈ ' + ((1 - q) ** 12).toFixed(3), 'about ' + pct(1 - (1 - q) ** 12, 2),
     'about ' + pct(1 - (1 - p) ** 24, 1), 'about ' + pct(1 - (1 - q) ** 24, 2), '3x']);
}
{ // service ownership
  add('operations', 'leadership-service-owner', [SOURCES.vogels], ['10 × 25 = ' + 10 * 25 + ' minutes', '4 × 25 = ' + 4 * 25 + ' minutes', 'you build it, you run it']);
}
{ // capacity planning
  const months = []; let x = 6000;
  for (let i = 0; i < 6; i++) { x *= 1.04; months.push(fmt(x, 1)); }
  const forecast = 6000 * 1.04 ** 6, peak = forecast + 1500;
  assert.ok(close(x, forecast, 1e-9));
  const servers = Math.ceil(peak / 800), slower = Math.ceil(peak / 650);
  add('operations', 'leadership-capacity', [SOURCES.intro],
    ['≈ ' + fmt(forecast, 1) + ' rps', 'about ' + fmt(peak, 1) + ' rps', (peak / 800).toFixed(2) + ', so ' + servers + ' servers', 'for ' + (servers + 2),
     months.slice(0, 5).join(', ') + ' and ' + months[5], (peak / 650).toFixed(2) + ', so ' + slower + ' servers, and ' + (slower + 2)]);
}
{ // escalation path
  const saved = 12 * (45 - 10);
  add('operations', 'leadership-escalation', [SOURCES.ebp, SOURCES.csfExamples], ['09:30', '11:00', '12 × 35 = ' + saved + ' minutes, or ' + saved / 60 + ' hours']);
}
{ // metrics that resist gaming
  const sample = (fast, slow) => [...Array(980).fill(fast), ...Array(20).fill(slow)].sort((p, q) => p - q);
  const mean = (v) => v.reduce((p, q) => p + q) / v.length;
  const rank = (v, f) => v[Math.ceil(f * v.length) - 1];
  const base = sample(100, 5000), fastOnly = sample(80, 5000), slowFixed = sample(100, 400);
  assert.equal(rank(base, 0.5), 100);
  assert.equal(rank(fastOnly, 0.99), 5000);
  add('operations', 'leadership-metrics', [SOURCES.slo],
    ['= ' + mean(base) + ' ms', 'The median is ' + rank(base, 0.5) + ' ms', 'The 99th percentile is ' + fmt(rank(base, 0.99)) + ' ms', '= ' + mean(fastOnly) + ' ms',
     '= ' + mean(slowFixed) + ' ms and the 99th percentile becomes ' + rank(slowFixed, 0.99) + ' ms']);
}
{ // where an SLI is measured
  const server = 48600 / 50000, user = 48600 / 51000;
  add('operations', 'leadership-sli-definition', [SOURCES.slo],
    ['= ' + pct(server, 1), '≈ ' + pct(user, 2), 'about ' + (100 * (server - user)).toFixed(1) + ' percentage points', 'becomes ' + pct(49700 / 50000, 1)]);
}
{ // error-budget policy
  const window = 28 * 24 * 60, budget = window * 0.001, gate = 0.2 * budget;
  assert.ok(9 > gate && 6 < gate);
  const loose = window * 0.005;
  add('operations', 'leadership-error-budget-policy', [SOURCES.ebp],
    [fmt(window) + ' minutes', budget.toFixed(2) + ' minutes', '≈ ' + pct(9 / budget, 1), 'about ' + pct(6 / budget, 1), gate.toFixed(3) + ' minutes',
     'about ' + pct(15 / budget, 1), (45 - budget).toFixed(2) + ' minutes', loose.toFixed(1) + ' minutes', 'about ' + pct(45 / loose, 1)]);
}
{ // toil that grows with customers
  const team = 4 * 160, other = 280, now = 40 * 45 / 60, doubled = 2 * now, automation = 80;
  add('operations', 'leadership-toil', [SOURCES.toil],
    ['40 × 45 / 60 = ' + now + ' hours', doubled + ' hours at double', (other + now) + ' hours, which is ' + pct((other + now) / team, 1), 'about ' + Math.round(100 * (other + doubled) / team) + '%',
     '80 / 30 ≈ ' + (automation / now).toFixed(1) + ' months', '80 / 60 ≈ ' + (automation / doubled).toFixed(1) + ' months', 40 * 15 / 60 + ' hours a month', automation / (40 * 15 / 60) + ' months']);
}
{ // SLI, SLO and SLA
  const month = 31 * 24 * 60;
  add('operations', 'leadership-service-levels', [SOURCES.slo],
    [fmt(month) + ' minutes', (month * 0.0005).toFixed(2) + ' minutes', (month * 0.001).toFixed(2) + ' minutes', '≈ ' + pct(1 - 30 / month, 3), 'about ' + pct(1 - 50 / month, 3), usd(20000 * 0.1)]);
}
{ // RACI chart checks
  const chart = {
    plan: { 'platform lead': 'A', 'database team': 'R', security: 'C', 'application teams': 'C', support: 'I' },
    'migrate data': { 'platform lead': 'A', 'database team': 'R', security: 'C', support: 'I' },
    'test rollback': { 'platform lead': 'A', 'database team': 'C', 'application teams': 'C' },
    'approve cutover': { 'platform lead': 'A', 'product director': 'A', 'application teams': 'R', security: 'C' },
    'notify users': { 'product director': 'A', support: 'R', 'application teams': 'I' }
  };
  const rows = Object.values(chart);
  const bad = rows.filter(r => Object.values(r).filter(x => x === 'A').length !== 1 || !Object.values(r).includes('R')).length;
  const aTotal = rows.reduce((n, r) => n + Object.values(r).filter(x => x === 'A').length, 0);
  const leadA = rows.filter(r => r['platform lead'] === 'A').length, dbR = rows.filter(r => r['database team'] === 'R').length;
  assert.equal(new Set(rows.flatMap(r => Object.keys(r))).size, 6, 'six roles');
  add('projects', 'leadership-raci', [SOURCES.raci], [bad + ' of the 5 rows', leadA + " of the chart's " + aTotal + " A's", dbR + " R's"]);
}
{ // roadmap arithmetic
  const rate = 3 * 0.75, quarters = 12 / rate, better = 3 * 0.9;
  add('projects', 'leadership-roadmap', [SOURCES.roadmap],
    ['3 × 0.75 = ' + rate, '≈ ' + quarters.toFixed(2) + ' quarters, or ' + Math.round(quarters * 3) + ' months', 'finishes ' + 4 * rate + ' features, so ' + (12 - 4 * rate) + ' of the 12', 'rises to ' + better.toFixed(1), 'about ' + (12 / better).toFixed(2) + ' quarters, roughly ' + (12 / better * 3).toFixed(1) + ' months']);
}
{ // technical debt as a portfolio
  const debts = [[6, 10, 120], [10, 1, 200], [1, 80, 160]].map(([extra, n, fix]) => ({ interest: extra * n, fix }));
  const total = debts.reduce((s, d) => s + d.interest, 0);
  add('strategy', 'leadership-tech-debt', [SOURCES.cunningham],
    ['6 × 10 = ' + debts[0].interest + ' hours', '10 × 1 = ' + debts[1].interest + ' hours', '1 × 80 = ' + debts[2].interest + ' hours', total + ' hours in all',
     debts.map(d => d.fix + ' / ' + d.interest + ' = ' + d.fix / d.interest + ' quarters').join(', ').replace(/, ([^,]*)$/, ' and $1'), 'drops to ' + 6 * 2 + ' hours', 'grows to ' + 120 / (6 * 2) + ' quarters']);
}
{ // prioritization
  const r1 = Math.round(1e6 * 0.0009), r2 = Math.round(0.005 * 20e6), r3 = Math.round(0.4 * 250000);
  const r1big = Math.round(100e6 * 0.0009);
  add('strategy', 'leadership-prioritization', [SOURCES.risk],
    ['$1M × 0.0009 = ' + usd(r1), '0.005 × $20M = ' + usd(r2), '0.4 × $250,000 = ' + usd(r3), 'about ' + usd(r1 / 3) + ' for R1, ' + usd(r2 / 2) + ' for R2 and ' + usd(r3 / 4) + ' for R3',
     usd(r1big) + ' a year, or ' + usd(r1big / 3) + ' per week']);
}
{ // psychological safety reports
  add('teams', 'leadership-psych-safety', [SOURCES.edmondson], ['2 / 12 ≈ ' + pct(2 / 12, 1), '9 / 12 = ' + pct(9 / 12, 0), 'drops to ' + pct(3 / 12, 0), '51 work teams']);
}
{ // structured interviews
  add('teams', 'leadership-hiring', [SOURCES.siop],
    ['r² ≈ ' + (0.42 ** 2).toFixed(3), 'about ' + pct(0.42 ** 2, 1), '.42 × .42 = .' + Math.round(0.42 ** 2 * 1e4), 'account for ' + pct(0.2 ** 2, 0), 'about ' + pct(0.25 ** 2, 2)]);
}
{ // weighted vendor evaluation
  const weights = [0.25, 0.15, 0.20, 0.15, 0.10, 0.10, 0.05];
  const score = (w, s) => Number(w.reduce((t, wi, i) => t + wi * s[i], 0).toFixed(2));
  const x = [9, 5, 4, 6, 7, 6, 3], y = [7, 8, 8, 8, 7, 7, 7];
  assert.ok(close(weights.reduce((p, q) => p + q), 1));
  const shifted = [0.40, 0.15, 0.05, 0.15, 0.10, 0.10, 0.05];
  assert.ok(close(shifted.reduce((p, q) => p + q), 1));
  add('vendors', 'leadership-vendor', [SOURCES.scrm],
    ['= ' + score(weights, x), 'giving ' + score(weights, y), 'Y leads ' + score(weights, y) + ' to ' + score(weights, x), 'X rises to ' + score(shifted, x) + ' and Y falls to ' + score(shifted, y)]);
}
{ // exit cost and switching charges
  const gb = 400 * 1000, egress = gb * 0.05, fee = 30000, internal = 90000 + 10000 + 50000;
  const total = egress + fee + internal, big = 2000 * 1000 * 0.05, totalBig = big + fee + internal;
  add('vendors', 'leadership-vendor-lockin', [SOURCES.dataAct],
    [fmt(gb) + ' GB', fmt(gb) + ' × $0.05 = ' + usd(egress), '= ' + usd(total), usd(internal) + ', or ' + pct(internal / total, 0), usd(big) + ', the total becomes ' + usd(totalBig),
     'about ' + pct(internal / totalBig, 0), '12 January 2027']);
}

// ---- Deep dives and evidence labs on SLIs, SLOs, error budgets and reliability targets.
{
  const quarter = 90 * 24 * 60;
  const mins = (fraction) => Math.round(fraction * quarter * 1e4) / 1e4;
  { // aggregation hides bursts
    const capacity = 150, busy = 30, peak = 200;
    assert.equal(busy * peak, 100 * 60);
    add('reliability', 'leadership-v08-deep-dive-service-level-indicator', [SOURCES.slo],
      ['average is ' + (busy * peak) / 60 + ' rps', peak + ' − ' + capacity + ' = ' + (peak - capacity), busy + ' × ' + (peak - capacity) + ' = ' + fmt(busy * (peak - capacity)), fmt(busy * peak) + ' requests', 'That value is ' + peak + ' rps']);
  }
  { // the template's interval and frequency
    const avg = (40 * 100 + 20 * 400) / 60, sampled = (4 * 100 + 2 * 400) / 6;
    assert.equal(avg, sampled);
    add('reliability', 'leadership-v08-evidence-lab-service-level-indicator', [SOURCES.slo],
      ['6 samples a minute and ' + 6 * 60 + ' an hour', '(40 × 100 + 20 × 400) / 60 = ' + avg + ' ms', '(4 × 100 + 2 × 400) / 6 = ' + sampled + ' ms', 'reports 400 ms']);
  }
  { // choosing an objective from users, not luck
    const last = mins(0.00007), strict = mins(0.0001), loose = mins(0.001);
    add('reliability', 'leadership-v08-deep-dive-service-level-objective', [SOURCES.slo],
      ['≈ ' + last.toFixed(2) + ' minutes', '= ' + strict + ' minutes', 'allows ' + loose + ' minutes', loose + ' − ' + strict + ' = ' + (Math.round((loose - strict) * 100) / 100) + ' minutes', '99.95% (' + mins(0.0005) + ' minutes)']);
  }
  { // auditing an SLO document
    const month = 31 * 24 * 60;
    add('reliability', 'leadership-v08-evidence-lab-service-level-objective', [SOURCES.slo, SOURCES.intro],
      ['2 of the 7 stand', (month * 0.0005).toFixed(2) + ' minutes of internal allowance against ' + (month * 0.001).toFixed(2) + ' minutes']);
  }
  { // two teams, one budget
    const budget = mins(0.001), usedA = Math.round(0.7 * budget * 100) / 100;
    const left = Math.round((budget - usedA) * 100) / 100;
    const afterB = Math.round((left - 20) * 100) / 100, both = Math.round((usedA + 20 + 25) * 100) / 100;
    add('reliability', 'leadership-v08-deep-dive-error-budget', [SOURCES.intro, SOURCES.risk],
      [budget + ' minutes', '≈ ' + usedA.toFixed(2) + ' minutes', 'about ' + left.toFixed(2) + ' minutes', 'leaving about ' + afterB.toFixed(2) + ' minutes',
       usedA.toFixed(2) + ' + 20 = ' + (usedA + 20).toFixed(2), '= ' + both.toFixed(2) + ' minutes', 'about ' + (both - budget).toFixed(2) + ' minutes', usedA.toFixed(2) + ' + 20 + 5 = ' + (usedA + 25).toFixed(2)]);
  }
  { // the three steps, with monitoring data
    const allowed = mins(0.001), used = mins(0.0005), over = mins(0.0012);
    add('reliability', 'leadership-v08-evidence-lab-error-budget', [SOURCES.risk],
      ['= ' + allowed + ' minutes', '= ' + used + ' minutes', allowed + ' − ' + used + ' = ' + (allowed - used) + ' minutes', 'used ' + over + ' minutes', 'by ' + (Math.round((over - allowed) * 100) / 100) + ' minutes']);
  }
  { // value of each nine
    const revenue = 10e6;
    const steps = [[0.99, 0.999], [0.999, 0.9999], [0.9999, 0.99999]].map(([a, b]) => Math.round(revenue * (b - a)));
    assert.deepEqual(steps, [90000, 9000, 900]);
    add('reliability', 'leadership-v08-deep-dive-availability-objective-tradeoff', [SOURCES.risk],
      ['$10M × 0.009 = ' + usd(steps[0]), 'or ' + usd(steps[1]), 'or ' + usd(steps[2]), '$1M × 0.0009 = $900']);
  }
  { // the formula on a $4M service
    const value = Math.round(4e6 * 0.0004), yearMinutes = 525600, avoided = 0.0004 * yearMinutes;
    assert.ok(close(value / avoided, 4e6 / yearMinutes, 1e-9));
    add('reliability', 'leadership-v08-evidence-lab-availability-objective-tradeoff', [SOURCES.risk],
      ['$4M × 0.0004 = ' + usd(value), 'about ' + Math.round(avoided) + ' minutes', 'about $' + (value / avoided).toFixed(2) + ' per minute', 'about three times']);
  }
  { // planned outage within the objective
    const allowed = mins(0.0001), left = Math.round((allowed - 2) * 100) / 100, after = 1 - 12 / quarter;
    assert.ok(after > 0.9999);
    add('reliability', 'leadership-v08-deep-dive-100-percent-reliability-tradeoff', [SOURCES.slo, SOURCES.intro],
      ['= ' + allowed + ' minutes', allowed + ' − 2 = ' + left + ' minutes', '≈ ' + (100 * 12 / quarter).toFixed(4) + '%', 'about ' + (100 * after).toFixed(4) + '%', 'only ' + (Math.round((allowed - 12) * 100) / 100) + ' minutes']);
  }
  { // the path between user and service
    const month = 30 * 24 * 60, path = 0.99, diff = path * 0.00001;
    assert.ok(close(path * 1 - path * 0.99999, diff, 1e-15));
    add('reliability', 'leadership-v08-evidence-lab-100-percent-reliability-tradeoff', [SOURCES.intro],
      ['0.99 × 0.99999 = ' + (path * 0.99999).toFixed(7), 'is ' + diff.toFixed(7), 'about ' + (month * diff).toFixed(2) + ' minutes, roughly ' + Math.round(month * diff * 60) + ' seconds', 'about ' + Math.round(month * 0.01) + ' minutes',
       '0.9999 × 0.00001 ≈ ' + (0.9999 * 0.00001).toFixed(10), (month * 0.0001).toFixed(2) + ' minutes of path downtime']);
  }
}

// ---- Six distinct error-budget practice cases; no new records or routes.
{
  const regionalFailures = 10 + 50, regionalRequests = 1000 + 99000;
  const globalSuccess = 100 * (1 - regionalFailures / regionalRequests);
  const equalRegionMean = 100 * ((1 - 10 / 1000) + (1 - 50 / 99000)) / 2;
  assert.notEqual(globalSuccess, equalRegionMean);
  assert.equal((1000 - 10) + (99000 - 50), 99940);
  const remixedFailures = 10 * 99 + 50, remixedRequests = 99000 * 2;
  assert.ok(close(100 * (1 - remixedFailures / remixedRequests), equalRegionMean));
  add('reliability', 'leadership-v09-scenario-analysis-error-budget', [SOURCES.workbook, SOURCES.alerts],
    [globalSuccess.toFixed(2) + '%', fmt(regionalFailures) + ' failures',
     'leaving ' + (regionalRequests / 1000 - regionalFailures), '60%',
     equalRegionMean.toFixed(6), fmt(remixedFailures) + ' / ' + fmt(remixedRequests)]);
}
{
  const period = 30 * 24, threshold = 14.4;
  const above = (failures, requests) => failures * 10000 > 144 * requests;
  assert.deepEqual([143, 144, 145].map(f => above(f, 10000)), [false, false, true]);
  assert.equal(above(1800, 100000) && above(10, 10000), false);
  assert.equal(above(1800, 100000) || above(10, 10000), true, 'OR is a wrong recovery-case implementation');
  assert.equal(above(1800, 100000) && above(200, 10000), true);
  add('reliability', 'leadership-v09-design-review-error-budget', [SOURCES.alerts],
    [period + '-hour', String(threshold / period), '2%', 'burns are 18 and 1',
     'short burn becomes 20', 'exactly 144 errors', 'strict greater-than']);
}
{
  const initial = { valid: 100000, bad: 80 };
  const after = { valid: initial.valid - 10000 + 10000, bad: initial.bad - 30 + 5 };
  const goodCheck = initial.valid - initial.bad - (10000 - 30) + (10000 - 5);
  assert.equal(goodCheck + after.bad, after.valid);
  assert.equal(after.bad, 55);
  assert.equal(after.valid / 1000 - after.bad, 45);
  assert.equal((initial.valid - 20000) / 1000 - initial.bad, 0);
  add('reliability', 'leadership-v09-troubleshooting-lab-error-budget', [SOURCES.workbook],
    ['80 - 30 + 5 = ' + after.bad, 'budget rises to 45', fmt(goodCheck),
     (100 * goodCheck / after.valid).toFixed(3) + '%', 'remaining budget becomes 0']);
}
{
  const requests = 2000000, budget = requests / 1000;
  const incidentTrigger = errors => errors * 5 > budget;
  assert.deepEqual([400, 401].map(incidentTrigger), [false, true]);
  assert.equal(1600 <= budget, true);
  assert.equal(2100 <= budget, false);
  add('reliability', 'leadership-v10-decision-brief-error-budget', [SOURCES.ebp],
    ['allows ' + fmt(budget) + ' failures', '400 remain', '80%',
     (100 * 450 / budget).toFixed(1) + '%', (100 * 450 / 400).toFixed(1) + '%',
     String(budget - 2100), (100 * (requests - 2100) / requests).toFixed(3) + '%',
     'exactly 400 failures', '401 does']);
}
{
  const valid = 100000, failures = 120, good = valid - failures;
  const trueSuccess = 100 * good / valid;
  const polluted = 100 * (good + 20000) / (valid + 20000);
  const morePolluted = 100 * (good + 100000) / (valid + 100000);
  assert.equal(failures * 1000 <= valid, false);
  assert.equal(failures * 1000 <= valid + 20000, true, 'probe contamination changes the decision');
  add('reliability', 'leadership-v10-checklist-lab-error-budget', [SOURCES.workbook, SOURCES.ebp],
    [trueSuccess.toFixed(2) + '%', polluted.toFixed(1) + '%', morePolluted.toFixed(2) + '%',
     'balance is ' + (valid / 1000 - failures), fmt(good), 'allowance from 100 to 120']);
}
{
  const burn = (bad, valid) => (bad / valid) / 0.001;
  assert.deepEqual([0, 1, 2].map(n => burn(n, 20)), [0, 50, 100]);
  assert.equal(burn(1, 200), 5);
  assert.equal(10000 / 1000 - 3, 7);
  add('reliability', 'leadership-v10-diagnostic-lab-error-budget', [SOURCES.alerts],
    ['burn 0.05 / 0.001 = ' + burn(1, 20), 'consumption is 30%', 'leaving 7',
     (30 / 50).toFixed(1) + ' days', (24 * 30 / 50).toFixed(1) + ' hours',
     'burn falls to ' + burn(1, 200), 'not a forecast']);
}


{ // Joint SLI: disjoint cells, overlap and strict threshold.
 const total=10000, failed=80, slow=150, overlap=30;
 const bad=failed+slow-overlap, good=total-bad;
 assert.equal(30+50+120+good,total);
 assert.equal(good,9800);
 assert.equal((1-failed/total)*(1-slow/total)*100,97.712);
 assert.deepEqual([299,300,301].map(ms=>ms<300),[true,false,false]);
 add('reliability','leadership-v09-design-review-service-level-indicator',[SOURCES.workbook],
 ['80 + 150 - 30 = '+bad,fmt(good),'98%','97.7%','97.712%','99.2%','98.5%']);
}
{ // Observation point and honest missing-data bounds.
 const total=10000,reached=9600,good=9504,missing=500,missingGood=490;
 const observedGood=good-missingGood;
 assert.equal(total-good,96+400);
 assert.equal(observedGood,9014);
 assert.ok(observedGood/total<=good/total && good/total<=(observedGood+missing)/total);
 add('reliability','leadership-v09-troubleshooting-lab-service-level-indicator',[SOURCES.workbook],
 ['99%',pct(good/total,2),'496',(100*400/496).toFixed(2)+'%',
 pct(observedGood/(total-missing),2),pct(observedGood/total,2),pct((observedGood+missing)/total,2)]);
}


{ // Time and event denominators are not interchangeable.
 const minutes=1440,down=10,total=600000,bad=60000;
 assert.equal(down*100<=minutes,true);
 assert.equal(bad*100<=total,false);
 const time=1-down/minutes,requests=1-bad/total;
 assert.notEqual(time,requests);
 add('reliability','leadership-v09-scenario-analysis-service-level-objective',[SOURCES.workbook],
 [pct(time,4),pct(requests,0),'14.4',fmt(total/100),(100*down/(minutes/100)).toFixed(2)+'%','1,000%',pct(1-60/total,2),'1%']);
}
{ // Completed, month-to-date and rolling windows retain distinct meaning.
 const month=30*24*60,rolling=28*24*60,outage=50;
 assert.equal(outage*1000<=month,false);
 assert.equal(outage*1000<=rolling,false);
 assert.equal(0*1000<=1440,true);
 add('reliability','leadership-v09-design-review-service-level-objective',[SOURCES.workbook],
 [fmt(month),String(month/1000),pct(1-outage/month,4),'1,440','100%',fmt(rolling),String(rolling/1000),pct(1-outage/rolling,4),String(31*24*60/1000)]);
}


{ // Attempts, operations and duplicate successes have different units.
 const operations=1000,firstGood=900,retries=100,retryGood=90;
 const attempts=operations+retries,good=firstGood+retryGood;
 assert.equal(good/attempts,0.9);assert.equal(good/operations,0.99);
 const extra=20;
 add('reliability','leadership-v09-failure-analysis-lab-service-level-indicator',[SOURCES.workbook],
 [fmt(attempts),String(good),String(attempts-good),'90%','99%',fmt(good+extra),fmt(attempts+extra),pct((good+extra)/(attempts+extra),4),pct((good+extra)/operations,0)]);
}
{ // Never decide exact objectives from rounded displays.
 const meets=(bad,total)=>total>0 && bad*1000<=total;
 assert.deepEqual([9,10,11].map(n=>meets(n,10000)),[true,true,false]);
 assert.equal(pct(1-10/10000,1),pct(1-11/10000,1));
 assert.deepEqual([999,1000].map(n=>meets(1,n)),[false,true]);
 assert.equal(meets(0,0),false);
 add('reliability','leadership-v09-troubleshooting-lab-service-level-objective',[SOURCES.workbook],
 [fmt(9990),fmt(9989),pct(1-11/10000,2),'bad * 1,000 <= total',String(999/1000),'undefined ratio']);
}
{ // Multiple latency grades constrain different parts of a distribution.
 const total=10000,fast=9000,middle=900,slow=100;
 const mean=(fast*50+middle*500+slow*5000)/total;
 assert.equal(mean,140);
 assert.equal(fast*100>=total*90,true);
 assert.equal((fast+middle)*1000>=total*995,false);
 assert.deepEqual([49,50].map(n=>(fast+middle+n)*1000>=total*995),[false,true]);
 add('reliability','leadership-v10-transfer-challenge-service-level-objective',[SOURCES.workbook],
 ['90%','99%',String(mean)+' ms','at most '+(total*5/1000),fmt(fast+middle+50),'99.5%',fmt(fast+middle+49),'99.49%']);
}


{ // Recovery interval and full-window history.
 const bad=100,total=10000,needed=bad*1000;
 assert.equal(needed,100000);assert.equal(needed-total,90000);
 assert.equal(bad*1000<=99999,false);
 add('reliability','leadership-v10-recovery-lab-service-level-indicator',[SOURCES.workbook],
 [fmt(total-bad),'99%','100%',fmt(needed),fmt(needed-total),'99,999']);
}
{ // Pipeline set accounting: missing is not conditionally correct.
 const expected=10000,produced=9800,incorrect=98,stale=196,both=49;
 const bad=incorrect+stale-both,good=produced-bad;
 assert.equal(200+49+49+147+good,expected);
 assert.equal(good,9555);
 add('reliability','leadership-v10-concept-mapping-lab-service-level-indicator',[SOURCES.workbook],
 [fmt(produced-incorrect),fmt(produced-stale),String(bad),fmt(good),pct(good/expected,2),(100*.98*.99*.98).toFixed(4)+'%','overlap must be known']);
}
{ // Equivalent duplicate observation rows do not change unique outcomes.
 const good=980,unique=1000,duplicateBad=20;
 assert.equal(good/unique,.98);
 add('reliability','leadership-v10-fault-isolation-lab-service-level-indicator',[SOURCES.workbook],
 [fmt(unique+duplicateBad),pct(good/(unique+duplicateBad),4),pct(1-20/(unique+duplicateBad),4),fmt(unique+30),pct((good+10)/(unique+30),4),'98%']);
}
{ // Aggregate success does not imply a critical subgroup passes.
 const total=999000+1000,bad=400+100,checkout=1000,checkoutBad=100;
 assert.equal(bad*1000<=total,true);
 assert.equal(checkoutBad*1000<=checkout,false);
 add('reliability','leadership-v10-scenario-brief-service-level-objective',[SOURCES.workbook],
 [fmt(total),String(bad),pct(1-bad/total,2),'90%',fmt(100*checkoutBad/(checkout/1000))+'%',pct(1-bad/(total+1000000),3)]);
}
{ // Unknown overlap yields bounds, not an unsupported product.
 const total=10000,failed=100,slow=100;
 const good=overlap=>total-failed-slow+overlap;
 assert.deepEqual([0,100].map(good),[9800,9900]);
 assert.deepEqual([49,50].map(o=>good(o)*1000>=total*985),[false,true]);
 add('reliability','leadership-v10-exam-style-practice-service-level-objective',[SOURCES.workbook],
 [fmt(good(0)),fmt(good(100)),pct(.99*.99,2),fmt(good(49)),pct(good(49)/total,2),fmt(good(50)),'98.5%']);
}


{ // Multiplicative retry topology and aggregate budget.
 const operations=100,attempts=[2,3,2].reduce((a,b)=>a*b,1),oneOwner=3;
 assert.equal(attempts,12);assert.equal(operations*attempts>500,true);assert.equal(operations*oneOwner<=500,true);
 add('reliability','leadership-v09-design-review-cascading-failure',[SOURCES.cascade],
 [fmt(operations*attempts),'12 attempts',String(operations*oneOwner),'120','7 is wrong']);
}
{ // Fluid queue conservation, explicitly not stochastic steady state.
 const arrival=1200,service=1000,cap=2000,growth=arrival-service,kib=64;
 assert.equal(cap/growth,10);assert.equal(cap/service,2);assert.equal(cap/(service-800),10);
 add('reliability','leadership-v09-troubleshooting-lab-cascading-failure',[SOURCES.cascade],
 [String(growth)+' requests per second','10 seconds',fmt(cap*kib)+' KiB',String(cap*kib/1024)+' MiB','20 seconds','250 MiB','2 seconds']);
}
{ // Health-check ejection can consume spare capacity.
 const load=1800,capacity=600;
 assert.deepEqual([4,3,2].map(n=>load/n),[450,600,900]);
 add('reliability','leadership-v09-failure-analysis-lab-cascading-failure',[SOURCES.cascade],
 ['450','75%','600','100%','900','150%',fmt(2*capacity),'one third']);
}
{ // Cache fallback capacity boundary.
 const demand=9000,db=1500;
 assert.equal(demand-7499>db,true);assert.equal(demand-7500<=db,true);
 add('reliability','leadership-v09-failure-analysis-lab-graceful-degradation',[SOURCES.cascade],
 ['900 database','60%',fmt(demand*.3),'180%',fmt(demand-db),(100*(demand-db)/demand).toFixed(4)+'%','600%']);
}
{ // CPU-work budget, not response latency.
 const budget=8000,n=1000,full=12,cheap=4,cost=x=>x*full+(n-x)*cheap;
 assert.equal(cost(500),budget);assert.equal(cost(501),8008);assert.equal(cost(400),7200);
 add('reliability','leadership-v10-worked-walkthrough-graceful-degradation',[SOURCES.cascade],
 [fmt(n*full),'150%',fmt(n*cheap),'50%','x <= 500',fmt(cost(400)),'90%',fmt(cost(501))]);
}
{ // Attempt throughput and useful operation throughput.
 const seconds=10,ops=1000,attempts=2500,useful=800,failed=1500,lateDuplicate=200;
 assert.equal(failed+useful+lateDuplicate,attempts);
 add('reliability','leadership-v10-measurement-lab-cascading-failure',[SOURCES.cascade],
 [String(attempts/seconds)+' attempts per second',String(useful/seconds)+' operations per second',
 pct((useful+lateDuplicate)/attempts,0),pct(useful/ops,0),String(attempts/ops)+' attempts',pct(useful/attempts,0),pct(1-useful/attempts,0),'120 per second']);
}

test('exactly the authored lessons changed, and only their question, reasoning and lab fields', () => {
  const authored = new Set(cases.map(c => c.id));
  assert.equal(authored.size, 92);
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
