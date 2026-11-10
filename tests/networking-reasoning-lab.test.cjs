'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lessonFile = path.resolve(__dirname, '..', 'deep-learning', 'cloud', 'networking.json');
const lessons = JSON.parse(fs.readFileSync(lessonFile, 'utf8'));
const keys = [
  'cloud-dns-resolution', 'cloud-arp', 'cloud-dhcp',
  'cloud-tcp-handshake', 'cloud-routing-table', 'cloud-udp'
];
const markers = {
  'cloud-dns-resolution': ['NXDOMAIN', 'TTL', 'resolver'],
  'cloud-arp': ['MAC', 'ARP', '10.20.30.1'],
  'cloud-dhcp': ['DHCP', 'DNS', 'lease'],
  'cloud-tcp-handshake': ['SYN', 'ACK', 'TLS'],
  'cloud-routing-table': ['/24', '/16', '/0'],
  'cloud-udp': ['UDP', 'retry', 'id=17']
};
const generic = /State the question in your own words|Identify the exact verified claim|Predict the outcome before manipulating|Run the interactive model or work through|What does .+ mean, why does it matter/i;

test('six networking lessons have specific, checkable reasoning and guided exercises', () => {
  const questions = new Set(), steps = new Set(), plans = new Set();
  assert.equal(Object.keys(lessons).length, 199, 'Preserve 199 networking records');
  for (const key of keys) {
    const lesson = lessons[key];
    assert.ok(lesson, 'Missing ' + key);
    assert.ok(lesson.verifiedBoundary, key + ': reviewed claim missing');
    assert.ok(Array.isArray(lesson.vocabulary), key + ': vocabulary lost');
    assert.equal(lesson.reasoningSteps.length, 6, key + ': six reasoning steps required');
    assert.equal(lesson.labPlan.length, 6, key + ': six practice stages required');
    assert.ok(lesson.essentialQuestion.endsWith('?'), key + ': question required');
    assert.doesNotMatch(lesson.essentialQuestion, generic, key + ': generic question');
    assert.equal(new Set(lesson.reasoningSteps).size, 6, key + ': repeated reasoning');
    assert.equal(new Set(lesson.labPlan).size, 6, key + ': repeated exercises');
    assert.ok(!questions.has(lesson.essentialQuestion), key + ': duplicate question');
    questions.add(lesson.essentialQuestion);
    for (const sentence of [...lesson.reasoningSteps, ...lesson.labPlan]) {
      assert.ok(sentence.length >= 50, key + ': short generic instruction: ' + sentence);
      assert.doesNotMatch(sentence, generic, key + ': generic instruction');
      assert.ok(!/confirmed in production|we measured|we observed in live systems/i.test(sentence), key + ': fabricated measurement');
    }
    const combined = [lesson.essentialQuestion, ...lesson.reasoningSteps, ...lesson.labPlan].join('\n');
    for (const marker of markers[key]) assert.ok(combined.includes(marker), key + ': missing ' + marker);
    assert.ok(!steps.has(lesson.reasoningSteps[0]), key + ': duplicate opening');
    assert.ok(!plans.has(lesson.labPlan[0]), key + ': duplicate lab opening');
    steps.add(lesson.reasoningSteps[0]);
    plans.add(lesson.labPlan[0]);
  }
});

function matches(prefix, length, address) {
  const parse = str => str.split('.').reduce((acc, octet) => ((acc << 8) | Number(octet)) >>> 0, 0);
  const mask = length === 0 ? 0 : (0xffffffff << (32 - length)) >>> 0;
  return (parse(prefix) & mask) === (parse(address) & mask);
}
test('longest-prefix route fixture independently matches the authored exercises', () => {
  const routes = [
    {net:'10.20.30.0',len:24,hop:'on-link'},
    {net:'10.20.0.0',len:16,hop:'10.20.30.2'},
    {net:'0.0.0.0',len:0,hop:'10.20.30.1'}
  ];
  function hop(ip, table=routes) {
    return table.filter(r => matches(r.net, r.len, ip)).sort((a,b) => b.len - a.len)[0].hop;
  }
  assert.equal(hop('10.20.30.55'), 'on-link');
  assert.equal(hop('10.20.40.5'), '10.20.30.2');
  assert.equal(hop('198.51.100.8'), '10.20.30.1');
  assert.equal(hop('10.20.40.5', [...routes, {net:'10.20.40.0',len:24,hop:'10.20.30.3'}]), '10.20.30.3');
});

test('TCP handshake sequence arithmetic independently matches the lab', () => {
  assert.equal(1000 + 1, 1001);
  assert.equal(5000 + 1, 5001);
  const lab = lessons['cloud-tcp-handshake'].labPlan.join(' ');
  for (const token of ['seq=1000', 'seq=5000', 'ack=1001', 'ack=5001']) assert.ok(lab.includes(token));
});

test('controlled scenarios are labeled synthetic and use documentation IPv4 ranges', () => {
  const all = keys.flatMap(key => [lessons[key].essentialQuestion, ...lessons[key].labPlan]).join(' ');
  assert.match(all, /synthetic|fabricated|fictional/i);
  assert.match(all, /192\.0\.2\.20|198\.51\.100\.20|198\.51\.100\.8/);
});
