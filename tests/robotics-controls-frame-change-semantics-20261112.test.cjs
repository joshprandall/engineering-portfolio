'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lessons = JSON.parse(fs.readFileSync(path.join(__dirname, '../deep-learning/robotics/controls.json'), 'utf8'));
const lesson = lessons['robotics-controls-04-frame-transform-inverse'];
const tolerance = 1e-12;

function close(actual, expected, context) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < tolerance,
    context + ': expected ' + expected + ', received ' + actual);
}
function nearPoint(actual, expected, context) {
  close(actual[0], expected[0], context + ' x');
  close(actual[1], expected[1], context + ' y');
}
function toWorld(local, yaw, origin) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [origin[0] + c * local[0] - s * local[1],
          origin[1] + s * local[0] + c * local[1]];
}
function fromWorld(world, yaw, origin) {
  const x = world[0] - origin[0], y = world[1] - origin[1];
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [c * x + s * y, -s * x + c * y];
}

test('the published teaching record explicitly separates physical rotation from frame re-expression', () => {
  assert.ok(lesson);
  const explanation = lesson.reasoningSteps[4];
  assert.match(explanation, /physically moves its world position/);
  assert.match(explanation, /world point remains at/);
  assert.match(explanation, /coordinates in that new frame/);
  assert.match(lesson.labPlan[3], /active and passive frame changes offline/);
});

test('original world-from-base pose yields the documented world point and inverse', () => {
  const origin = [1, 2], local = [.2, .1];
  const world = toWorld(local, Math.PI / 2, origin);
  nearPoint(world, [.9, 2.2], '90-degree transform');
  nearPoint(fromWorld(world, Math.PI / 2, origin), local, 'inverse');
});

test('active body rotation changes the location of a body-fixed point', () => {
  const origin = [1, 2], local = [.2, .1];
  const before = toWorld(local, Math.PI / 2, origin);
  const after = toWorld(local, 0, origin);
  nearPoint(before, [.9, 2.2], 'before');
  nearPoint(after, [1.2, 2.1], 'after');
  close(Math.hypot(after[0] - before[0], after[1] - before[1]),
    Math.sqrt(.1), 'displacement magnitude');
});

test('passive change of coordinates preserves a stationary world point', () => {
  const origin = [1, 2];
  const world = [.9, 2.2];
  const oldCoordinates = fromWorld(world, Math.PI / 2, origin);
  const newCoordinates = fromWorld(world, 0, origin);
  nearPoint(oldCoordinates, [.2, .1], 'rotated local axes');
  nearPoint(newCoordinates, [-.1, .2], 'world-aligned local axes');
  nearPoint(toWorld(oldCoordinates, Math.PI / 2, origin), world, 'old-frame round trip');
  nearPoint(toWorld(newCoordinates, 0, origin), world, 'new-frame round trip');
  assert.ok(Math.hypot(oldCoordinates[0] - newCoordinates[0],
    oldCoordinates[1] - newCoordinates[1]) > .2);
});

test('reusing the same local point in a newly oriented frame is not a passive re-expression', () => {
  const origin = [1, 2], oldLocal = [.2, .1];
  const firstWorld = toWorld(oldLocal, Math.PI / 2, origin);
  const mistakenWorld = toWorld(oldLocal, 0, origin);
  assert.ok(Math.hypot(firstWorld[0] - mistakenWorld[0],
    firstWorld[1] - mistakenWorld[1]) > .3);
});

test('fixed-world coordinate conversions round-trip over positive and negative yaw', () => {
  const origin = [1, 2];
  for (const world of [[.9,2.2], [1,2], [-2.5,.4], [10,-3]]) {
    for (const yaw of [-Math.PI, -1.3, -.001, 0, .25, Math.PI/2, Math.PI]) {
      nearPoint(toWorld(fromWorld(world, yaw, origin), yaw, origin),
        world, 'world-space invariant');
    }
  }
});
