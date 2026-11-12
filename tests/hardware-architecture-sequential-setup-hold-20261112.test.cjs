'use strict';
// Offline, synthetic flip-flop timing model; never a claim about a physical device.
// Run: node --test tests/hardware-architecture-sequential-setup-hold-20261112.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const lessons = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'deep-learning', 'advanced', 'architecture.json'), 'utf8'));
const lesson = lessons['advanced-v05-sequential-logic'];
const clock = [10, 20, 30], setup = 2, hold = 1; // ns, explicitly synthetic
function captured(samples, edge) {
  const sample = samples.find(x => x.from <= edge - setup && x.to >= edge + hold);
  if (!sample) throw new Error('setup/hold not established; physical result unspecified');
  return sample.d;
}
function trace(samples) {
  let q = 0;
  const values = [];
  for (let i = 0; i < clock.length; i++) {
    q = captured(samples, clock[i]);
    values.push(q);
  }
  return values; // each value observed 5 ns after its edge, assumed settled
}
const original = [
  {from: -Infinity, to: 14, d: 1},
  {from: 14, to: 26, d: 0},
  {from: 26, to: Infinity, d: 1}
];
const changed = [{from: -Infinity, to: Infinity, d: 1}];
test('original three samples respect illustrative 2 ns setup and 1 ns hold', () => {
  assert.deepEqual(trace(original), [1, 0, 1]);
});
test('changing only the middle stable sampled value changes Q25, not Q15 or Q35', () => {
  assert.deepEqual(trace(changed), [1, 1, 1]);
  assert.equal(trace(original)[0], trace(changed)[0]);
  assert.equal(trace(original)[2], trace(changed)[2]);
});
test('an exactly coincident D transition at 20 ns invalidates the physical sampling premise', () => {
  const atEdge = [{from: -Infinity, to: 20, d: 1}, {from: 20, to: Infinity, d: 0}];
  assert.throws(() => trace(atEdge), /setup\/hold not established/);
});
test('transitions inside either side of the aperture are also rejected', () => {
  for (const time of [18.5, 19.9, 20.5]) {
    const unstable = [{from: -Infinity, to: time, d: 1}, {from: time, to: Infinity, d: 0}];
    assert.throws(() => trace(unstable), /setup\/hold not established/);
  }
});
test('a sufficiently early input transition gives a deterministic middle sample', () => {
  const stable = [{from: -Infinity, to: 17, d: 1}, {from: 17, to: 26, d: 0}, {from: 26, to: Infinity, d: 1}];
  assert.deepEqual(trace(stable), [1, 0, 1]);
});
test('actual authored lesson documents stable D intervals, falsification, and specific source', () => {
  assert.ok(lesson);
  assert.equal(lesson.reasoningSteps.length, 6);
  assert.equal(lesson.labPlan.length, 6);
  const reasoning = lesson.reasoningSteps.join(' ');
  const lab = lesson.labPlan.join(' ');
  for (const term of ['2ns', '1ns', '20ns', '18ns', '21ns', 'Q(25) changes to1']) assert.ok(reasoning.includes(term), term);
  for (const term of ['[8,11]', '[18,21]', '[28,31]', 'exactly20ns']) assert.ok(lab.includes(term), term);
  assert.ok(reasoning.includes('Switching D exactly at20ns'));
  assert.ok(reasoning.includes('https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c5/c5s1/'));
  assert.ok(lab.includes('https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c5/c5s1/'));
});
