'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lessons = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'deep-learning', 'cloud', 'observability.json'), 'utf8'));
const selected = [
  'cloud-observability-signals',
  'cloud-v07-observability-logs',
  'cloud-v07-observability-metrics',
  'cloud-v07-observability-traces',
  'cloud-v07-prometheus-time-series',
  'cloud-v07-promql-instant-vector',
];
const terms = {
  'cloud-observability-signals': ['T42','10%','220ms','payment'],
  'cloud-v07-observability-logs': ['T42','T99','clock','redact'],
  'cloud-v07-observability-metrics': ['120 requests','10%','reset','latency'],
  'cloud-v07-observability-traces': ['220ms','115ms','385ms','span'],
  'cloud-v07-prometheus-time-series': ['400','route','request_id','series'],
  'cloud-v07-promql-instant-vector': ['11:54:00','11:59:20','stale','five-minute'],
};
const boilerplate = /state the question in your own words|identify the exact verified claim|predict the outcome before manipulating|run the interactive model or work through/i;

test('preserve all 97 observability lessons while improving six without losing reviewed evidence fields', () => {
  assert.equal(Object.keys(lessons).length, 97);
  const questions = new Set(), openings = new Set();
  for (const key of selected) {
    const entry = lessons[key];
    assert.ok(entry, 'missing ' + key);
    assert.ok(entry.verifiedBoundary, 'missing verified claim ' + key);
    assert.ok(Array.isArray(entry.vocabulary) && entry.vocabulary.length > 0, 'lost vocabulary');
    assert.ok(entry.technical && entry.technical.scope, 'lost technical provenance caveat');
    assert.ok(entry.memoryLadder && entry.memoryLadder.length === 6, 'lost recall scaffold');
    assert.equal(entry.reasoningSteps.length, 6);
    assert.equal(entry.labPlan.length, 6);
    assert.match(entry.essentialQuestion, /\?$/);
    assert.doesNotMatch(entry.essentialQuestion, boilerplate);
    assert.ok(!questions.has(entry.essentialQuestion), 'duplicate essential question');
    assert.ok(!openings.has(entry.reasoningSteps[0]), 'duplicate reasoning opening');
    questions.add(entry.essentialQuestion);
    openings.add(entry.reasoningSteps[0]);
    for (const line of [...entry.reasoningSteps, ...entry.labPlan]) {
      assert.ok(line.length >= 75, 'underspecified learning action in ' + key);
      assert.doesNotMatch(line, boilerplate);
      assert.doesNotMatch(line, /we measured in production|our real traffic|observed in our system/i);
    }
    const all = [entry.essentialQuestion, ...entry.reasoningSteps, ...entry.labPlan].join(' ');
    for (const marker of terms[key]) assert.ok(all.includes(marker), key + ' missing ' + marker);
    assert.match(entry.labPlan.join(' '), /synthetic|fictional|fabricated|invented/i);
  }
});

test('counter windows, resets and error fractions are independently reproducible', () => {
  const first = {requests:300,errors:10}, last = {requests:420,errors:22};
  const requests = last.requests - first.requests;
  const errors = last.errors - first.errors;
  assert.equal(requests, 120);
  assert.equal(errors, 12);
  assert.equal(errors / requests, 0.1);
  assert.equal(requests / 120, 1);
  assert.equal((16 - first.errors) / requests, 0.05);
  assert.ok(12 - last.requests < 0, 'reset must not be treated as a negative request count');
  const text = lessons['cloud-v07-observability-metrics'].labPlan.join(' ');
  for (const token of ['300','420','10','22','12 failures','10%','5%']) assert.ok(text.includes(token));
});

test('trace nesting and log correlation preserve request context and avoid double counting', () => {
  const logs = [
    {time:'12:00:01Z',trace:'T42',event:'request_received'},
    {time:'12:00:02Z',trace:'T99',event:'retry'},
    {time:'12:00:03Z',trace:'T42',event:'downstream_timeout'}
  ];
  assert.deepEqual(logs.filter(x => x.trace === 'T42').map(x => x.event), ['request_received','downstream_timeout']);
  const root=220-0, auth=65-15, payment=195-80;
  assert.deepEqual([root,auth,payment],[220,50,115]);
  assert.equal(root+auth+payment,385);
  assert.notEqual(root,root+auth+payment);
  assert.equal(205-80,125);
  assert.equal(root,220,'root interval remains 220ms after isolated child duration change');
  for (const key of ['cloud-observability-signals','cloud-v07-observability-traces']) {
    assert.match(lessons[key].labPlan.join(' '), /220ms/);
  }
});

test('Prometheus series cardinality fixture uses exact bounded label combinations', () => {
  const routes=['/v1/orders','/v1/cart'];
  const statuses=['200','500'];
  const combos=routes.flatMap(route=>statuses.map(status=>({route,status})));
  assert.equal(combos.length,4);
  assert.equal(new Set(combos.map(x=>JSON.stringify(x))).size,4);
  assert.equal(combos.length * 100,400,'100 per-request values per combination');
  assert.equal(combos.length * 2,8,'two bounded environments at most double four series');
  const lab=lessons['cloud-v07-prometheus-time-series'].labPlan.join(' ');
  assert.match(lab,/400/);
  assert.match(lab,/eight/);
  assert.match(lab,/https:\/\/prometheus\.io\/docs\/concepts\/data_model\//);
});

test('instant-vector fixture accounts for default lookback and explicit staleness', () => {
  const evalTime = Date.parse('2026-11-10T12:00:00Z');
  const series = [
    {id:'A',sample:Date.parse('2026-11-10T11:59:20Z')},
    {id:'B',sample:Date.parse('2026-11-10T11:54:00Z')},
    {id:'C',sample:Date.parse('2026-11-10T11:59:30Z'),stale:Date.parse('2026-11-10T11:59:50Z')}
  ];
  const included = s => (evalTime - s.sample < 5*60*1000)
                         && s.sample <= evalTime
                         && !(s.stale && s.stale > s.sample && s.stale <= evalTime);
  assert.deepEqual(series.filter(included).map(s=>s.id),['A']);
  series[1].sample=Date.parse('2026-11-10T11:58:00Z');
  assert.deepEqual(series.filter(included).map(s=>s.id),['A','B']);
  delete series[2].stale;
  assert.deepEqual(series.filter(included).map(s=>s.id),['A','B','C']);
  assert.match(lessons['cloud-v07-promql-instant-vector'].labPlan.join(' '), /https:\/\/prometheus\.io\/docs\/prometheus\/latest\/querying\/basics\//);
});
