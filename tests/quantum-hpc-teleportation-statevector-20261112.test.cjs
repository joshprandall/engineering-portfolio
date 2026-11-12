'use strict';
// Exact three-qubit statevector model; no hardware, calibrated noise, or empirical fidelity.
// Protocol: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/entanglement-in-action/quantum-teleportation
const { test } = require('node:test');
const assert = require('node:assert/strict');

const complex = (re, im = 0) => [re, im];
const add = (u, v) => complex(u[0] + v[0], u[1] + v[1]);
const sub = (u, v) => complex(u[0] - v[0], u[1] - v[1]);
const scale = (z, k) => complex(z[0] * k, z[1] * k);
const mul = (u, v) => complex(u[0] * v[0] - u[1] * v[1], u[0] * v[1] + u[1] * v[0]);
const conjugate = z => complex(z[0], -z[1]);
const squared = z => z[0] ** 2 + z[1] ** 2;
const near = (a, b, tol = 1e-12) => Math.abs(a - b) <= tol;
const closeComplex = (a, b) => near(a[0], b[0]) && near(a[1], b[1]);
const inner = (u, v) => u.reduce((z, x, i) => add(z, mul(conjugate(x), v[i])), complex(0));
const fidelity = (u, v) => squared(inner(u, v));
const norm = state => state.reduce((acc, z) => acc + squared(z), 0);
const zero = () => Array.from({ length: 8 }, () => complex(0));

// q0, q1, q2 are ordered most-significant to least-significant.
const hadamard = (state, q) => {
  const mask = 1 << (2 - q), out = state.map(z => z.slice());
  for (let i = 0; i < 8; i++) {
    if (i & mask) continue;
    const j = i | mask;
    out[i] = scale(add(state[i], state[j]), Math.SQRT1_2);
    out[j] = scale(sub(state[i], state[j]), Math.SQRT1_2);
  }
  return out;
};
const controlledX = (state, control, target) => {
  const cmask = 1 << (2 - control), tmask = 1 << (2 - target);
  assert.notEqual(control, target);
  const out = state.map(z => z.slice());
  for (let i = 0; i < 8; i++) {
    if (!(i & cmask) || (i & tmask)) continue;
    const j = i | tmask;
    out[i] = state[j].slice();
    out[j] = state[i].slice();
  }
  return out;
};
const prepare = ([a, b], entangled = true) => {
  const state = zero();
  state[0] = a.slice();
  state[4] = b.slice();
  let prepared = state;
  if (entangled) {
    prepared = hadamard(prepared, 1);
    prepared = controlledX(prepared, 1, 2);
  }
  prepared = controlledX(prepared, 0, 1);
  return hadamard(prepared, 0);
};
const branches = state => {
  const results = [];
  for (let a = 0; a <= 1; a++) for (let b = 0; b <= 1; b++) {
    const raw = [state[4 * a + 2 * b], state[4 * a + 2 * b + 1]];
    const probability = norm(raw);
    assert.ok(probability > 0, 'this fixture must reach all four outcomes');
    const bob = raw.map(z => scale(z, 1 / Math.sqrt(probability)));
    const corrected = bob.map(z => z.slice());
    if (b) corrected.reverse(); // X correction conditioned on q1 measurement.
    if (a) corrected[1] = scale(corrected[1], -1); // Z conditioned on q0 measurement.
    results.push({ a, b, raw, probability, bob, corrected });
  }
  return results;
};
const inputs = [
  ['zero', [complex(1), complex(0)]],
  ['one', [complex(0), complex(1)]],
  ['plus', [complex(Math.SQRT1_2), complex(Math.SQRT1_2)]],
  ['minus', [complex(Math.SQRT1_2), complex(-Math.SQRT1_2)]],
  ['complex', [complex(Math.sqrt(0.3)), complex(0, Math.sqrt(0.7))]],
  ['relative-phase', [complex(Math.sqrt(0.7)), complex(-Math.sqrt(0.15), Math.sqrt(0.15))]],
];

test('full Bell-pair teleportation circuit yields four equiprobable branches and corrected unit fidelity', () => {
  for (const [name, original] of inputs) {
    assert.ok(near(norm(original), 1), name + ': input normalization');
    const state = prepare(original);
    assert.ok(near(norm(state), 1), name + ': unitary circuit norm');
    const outcomes = branches(state);
    for (const { a, b, probability, corrected } of outcomes) {
      assert.ok(near(probability, 0.25), name + ': P(' + a + b + ')=' + probability);
      assert.ok(near(norm(corrected), 1), name + ': Bob norm');
      assert.ok(near(fidelity(original, corrected), 1), name + ': corrected ' + a + b);
    }
    assert.ok(near(outcomes.reduce((s, x) => s + x.probability, 0), 1));
  }
});

test('without the classical two bits, Bob sees I/2 for every secret input', () => {
  for (const [name, original] of inputs) {
    const raw = branches(prepare(original)).map(x => x.raw);
    const diag0 = raw.reduce((s, x) => s + squared(x[0]), 0);
    const diag1 = raw.reduce((s, x) => s + squared(x[1]), 0);
    const offdiag = raw.reduce((s, x) => add(s, mul(x[0], conjugate(x[1]))), complex(0));
    assert.ok(near(diag0, 0.5) && near(diag1, 0.5), name + ': mixed diagonal');
    assert.ok(closeComplex(offdiag, complex(0)), name + ': mixed off-diagonal');
  }
});

test('classical corrections and the shared Bell pair are both necessary in a nontrivial case', () => {
  const original = inputs.find(([name]) => name === 'complex')[1];
  const proper = branches(prepare(original));
  assert.ok(proper.some(x => fidelity(original, x.bob) < 0.99), 'raw branches need correction');
  const noPair = branches(prepare(original, false));
  assert.ok(noPair.some(x => fidelity(original, x.corrected) < 0.99), 'without entanglement cannot transmit the state');
});
