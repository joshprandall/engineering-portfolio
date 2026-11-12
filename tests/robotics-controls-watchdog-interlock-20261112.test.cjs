'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lessons = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../deep-learning/robotics/advanced-controls.json'), 'utf8'));
const lesson = lessons['robotics-controls-20-watchdog-stop-latch'];

// This is a synthetic event-state model, not a functional safety implementation.
// All timestamps are monotonic integer milliseconds; the only time source is the test.
function watchdog(timeout = 100) {
  if (!Number.isInteger(timeout) || timeout <= 0) throw new RangeError('timeout');
  let state = 'READY', lastHeartbeat = 20, lastEvent = 20;
  let heartbeatAfterLatch = false, faultsCleared = false;
  const types = new Set(['poll', 'heartbeat', 'fault-cleared', 'reset']);
  const snapshot = () => ({
    state, lastHeartbeat, lastEvent, heartbeatAfterLatch, faultsCleared,
    abstractStop: state === 'STOP_LATCHED'
  });
  const dispatch = (type, time) => {
    // Reject before touching state: malformed or future-dated events must not poison time.
    if (!types.has(type)) throw new RangeError('unknown event');
    if (!Number.isSafeInteger(time) || time < 0 || time < lastEvent)
      throw new RangeError('invalid event time');
    lastEvent = time;
    if (type === 'heartbeat') {
      lastHeartbeat = time;
      if (state === 'STOP_LATCHED') heartbeatAfterLatch = true;
    } else if (type === 'poll') {
      if (state === 'READY' && time - lastHeartbeat >= timeout) {
        state = 'STOP_LATCHED';
        heartbeatAfterLatch = false;
        faultsCleared = false;
      }
    } else if (type === 'fault-cleared') {
      // Deliberate synthetic input; this flag does NOT establish physical fault clearance.
      if (state === 'STOP_LATCHED') faultsCleared = true;
    } else if (
      type === 'reset' && state === 'STOP_LATCHED' && heartbeatAfterLatch &&
      faultsCleared && time - lastHeartbeat < timeout
    ) {
      state = 'READY';
      heartbeatAfterLatch = false;
      faultsCleared = false;
    }
    return snapshot();
  };
  return {dispatch, snapshot};
}

test('lesson explains independent recovery predicates and atomic input rejection', () => {
  assert.equal(Object.keys(lessons).length, 12);
  assert.match(lesson.technical.scope, /Synthetic, offline educational case/);
  assert.match(lesson.reasoningSteps[3], /faultsCleared/);
  assert.match(lesson.reasoningSteps[4], /validation must precede all state mutation/);
  assert.match(lesson.labPlan[2], /snapshot is unchanged/);
  assert.match(lesson.technical.versionCaution, /No real robot actuation/);
});

test('timeout equality transitions READY to STOP_LATCHED at exactly 100 ms', () => {
  const model = watchdog();
  assert.equal(model.dispatch('poll', 100).state, 'READY');
  assert.equal(model.dispatch('poll', 119).state, 'READY');
  assert.deepEqual(model.dispatch('poll', 120), {
    state: 'STOP_LATCHED', lastHeartbeat: 20, lastEvent: 120,
    heartbeatAfterLatch: false, faultsCleared: false, abstractStop: true
  });
  assert.equal(model.dispatch('poll', 130).state, 'STOP_LATCHED');
});

test('heartbeat cannot clear latch; explicit reset requires an independent cleared-fault flag', () => {
  const model = watchdog();
  model.dispatch('poll', 120);
  assert.equal(model.dispatch('heartbeat', 140).state, 'STOP_LATCHED');
  assert.equal(model.dispatch('reset', 141).abstractStop, true);
  assert.equal(model.dispatch('fault-cleared', 142).state, 'STOP_LATCHED');
  assert.deepEqual(model.dispatch('reset', 143), {
    state: 'READY', lastHeartbeat: 140, lastEvent: 143,
    heartbeatAfterLatch: false, faultsCleared: false, abstractStop: false
  });
});

test('pre-latch heartbeat does not authorize post-latch reset', () => {
  const model = watchdog();
  model.dispatch('heartbeat', 100);
  model.dispatch('poll', 200);
  assert.equal(model.snapshot().abstractStop, true);
  model.dispatch('fault-cleared', 201);
  assert.equal(model.dispatch('reset', 202).state, 'STOP_LATCHED');
  model.dispatch('heartbeat', 203);
  assert.equal(model.dispatch('reset', 204).state, 'READY');
});

test('fault clearance without post-latch freshness is insufficient', () => {
  const model = watchdog();
  model.dispatch('poll', 120);
  model.dispatch('fault-cleared', 121);
  assert.equal(model.dispatch('reset', 122).state, 'STOP_LATCHED');
  assert.equal(model.dispatch('heartbeat', 123).abstractStop, true);
  assert.equal(model.dispatch('reset', 124).state, 'READY');
});

test('a post-latch heartbeat expires if reset is delayed beyond the threshold', () => {
  const model = watchdog();
  model.dispatch('poll', 120);
  model.dispatch('heartbeat', 140);
  model.dispatch('fault-cleared', 141);
  assert.equal(model.dispatch('reset', 240).state, 'STOP_LATCHED');
  assert.equal(model.dispatch('heartbeat', 241).state, 'STOP_LATCHED');
  assert.equal(model.dispatch('reset', 242).state, 'READY');
});

test('validation is atomic for unknown, fractional, negative and nonmonotonic timestamps', () => {
  const model = watchdog();
  model.dispatch('poll', 120);
  const before = model.snapshot();
  for (const [type, time] of [
    ['unexpected', 1000], ['heartbeat', 120.5], ['reset', -1],
    ['heartbeat', 119], ['poll', Number.MAX_SAFE_INTEGER + 1],
    ['heartbeat', Number.NaN]
  ]) {
    assert.throws(() => model.dispatch(type, time), RangeError);
    assert.deepEqual(model.snapshot(), before, String(type) + ':' + String(time));
  }
  // If a rejected future event had advanced lastEvent, this valid event would fail.
  assert.equal(model.dispatch('heartbeat', 140).lastHeartbeat, 140);
});

test('invalid event cannot satisfy either reset guard', () => {
  const model = watchdog();
  model.dispatch('poll', 120);
  assert.throws(() => model.dispatch('fault-clearance-claimed', 121), RangeError);
  assert.throws(() => model.dispatch('heartbeat', Infinity), RangeError);
  assert.equal(model.dispatch('reset', 122).state, 'STOP_LATCHED');
});

test('repeated poll or heartbeat cannot automatically reset a latched condition', () => {
  const model = watchdog();
  model.dispatch('poll', 120);
  for (const t of [130, 160, 200]) {
    model.dispatch('heartbeat', t);
    assert.equal(model.dispatch('poll', t).abstractStop, true);
  }
});

test('a no-poll interval cannot be misrepresented as verified timeout detection', () => {
  const model = watchdog();
  // The modeled state transition is sampled at a poll, not continuously.
  assert.equal(model.dispatch('heartbeat', 30).state, 'READY');
  assert.equal(model.dispatch('poll', 129).state, 'READY');
  assert.equal(model.dispatch('poll', 130).state, 'STOP_LATCHED');
});

test('strict time ordering retains a reproducible event history', () => {
  const events = [
    ['poll', 100], ['poll', 120], ['heartbeat', 140],
    ['reset', 141], ['fault-cleared', 142], ['reset', 143]
  ];
  const execute = () => {
    const m = watchdog();
    return events.map(([type, t]) => m.dispatch(type, t));
  };
  assert.deepEqual(execute(), execute());
  assert.equal(execute().at(-1).state, 'READY');
});

test('invalid construction and late reset do not weaken the abstract stop invariant', () => {
  assert.throws(() => watchdog(0), RangeError);
  assert.throws(() => watchdog(1.5), RangeError);
  const model = watchdog(100);
  model.dispatch('poll', 120);
  model.dispatch('fault-cleared', 121);
  model.dispatch('reset', 122);
  assert.equal(model.snapshot().abstractStop, true);
});
