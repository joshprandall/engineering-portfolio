'use strict';
// Independent, review-only software/API evidence gate. No network, server, database,
// production data, or shared runner modifications. Intentionally RED on PR #177:
// its "incorrect assertions" are presently correct under their stated contracts.
// To run numerical and original-prose checks only:
// node --test --test-name-pattern="^(fixture|numeric|baseline prose|mutation sensitivity)" tests/software-api-falsification-gate.test.cjs
// To check publication readiness (expected to fail until the 48 lessons are corrected):
// node --test tests/software-api-falsification-gate.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'software-testing-evidence-48-cases.json'), 'utf8'));
const pack = JSON.parse(fs.readFileSync(path.join(root, 'deep-learning/software/testing.json'), 'utf8'));

function reference(c, x) {
  switch (c.kind) {
    case 'boundary':
    case 'schema':
      return x.values.filter(v => typeof v === 'number' && Number.isSafeInteger(v) && v >= x.min && v <= x.max).length;
    case 'bisect': {
      const predicate = i => i >= x.first;
      for (let i = 0; i < x.n; i += 1) if (predicate(i)) return i;
      return x.n;
    }
    case 'coverage':
      return [...new Set(x.seen)].filter(v => x.branches.includes(v)).length;
    case 'mutation':
      return { killed: x.killed, eligible: x.killed + x.survived };
    case 'retry': {
      let p = 1;
      for (let i = 0; i < x.attempts; i += 1) p *= x.p;
      return p;
    }
    case 'timeout':
      return x.now >= x.issued + x.ttl;
    case 'transaction': {
      const inserted = new Set();
      for (const key of x.ids) {
        if (inserted.has(key)) return 0; // explicit atomic rollback assumption
        inserted.add(key);
      }
      return inserted.size;
    }
    case 'permutation':
      return x.numbers.reduce((sum, n) => sum + n, 0);
    case 'mock':
      return x.tasks + (x.retry && x.failedAt >= 0 && x.failedAt < x.tasks ? 1 : 0);
    case 'binary':
      return [Math.floor(x.value / 256), x.value % 256];
    case 'percentile':
      return [...x.values].sort((a, b) => a - b)[Math.ceil(x.values.length * 0.95) - 1];
    default:
      throw Error('Unknown evidence model: ' + c.kind);
  }
}

// Intentionally defective *executable* alternative. This is the incorrect
// implementation, not an instruction to deliberately contradict a true rule.
function flawed(c, x) {
  switch (c.kind) {
    case 'boundary':
      return x.values.filter(v => typeof v === 'number' && Number.isSafeInteger(v) && v >= x.min).length; // drops upper bound
    case 'schema':
      return x.values.filter(v => {
        const n = Math.round(Number(v)); // incorrectly coerces/rounds types
        return Number.isSafeInteger(n) && n >= x.min && n <= x.max;
      }).length;
    case 'bisect': return x.n - 1; // presumes only final revision can first fail
    case 'coverage': return x.branches.length; // counts unvisited outcomes
    case 'mutation': return { killed: x.killed + x.survived, eligible: x.killed + x.survived };
    case 'retry': return x.p; // ignores repeated independent trials
    case 'timeout': return x.now >= x.issued; // ignores the allowed lifetime
    case 'transaction': {
      const inserted = new Set();
      for (const key of x.ids) {
        if (inserted.has(key)) return inserted.size; // erroneously keeps partial work
        inserted.add(key);
      }
      return inserted.size;
    }
    case 'permutation':
      if (c.context === 'signed test scores') return x.numbers.filter(n => n >= 0).reduce((s, n) => s + n, 0);
      if (c.context === 'expense summation') return x.numbers.reduce((s, n) => s + n, 0) + 1; // off-by-one accumulator
      return [...new Set(x.numbers)].reduce((s, n) => s + n, 0); // incorrectly deduplicates repeated items
    case 'mock': return x.tasks; // omits retry invocation
    case 'binary': return [x.value % 256, Math.floor(x.value / 256)]; // reverses byte order
    case 'percentile': return x.values.reduce((s, n) => s + n, 0) / x.values.length; // substitutes mean for p95
    default: throw Error('Unknown flawed model: ' + c.kind);
  }
}
function same(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-12;
  return JSON.stringify(a) === JSON.stringify(b);
}
function counterexample(c) {
  const candidate = [c.input, c.variation].find(x => !same(reference(c, x), flawed(c, x)));
  assert.ok(candidate, 'No discriminating counterexample for ' + c.id);
  return { input: candidate, correct: reference(c, candidate), incorrect: flawed(c, candidate) };
}
function proposedFalseClaim(c, w) {
  return 'For ' + c.context + ', the asserted ' + c.kind + ' result for ' +
    JSON.stringify(w.input) + ' is ' + JSON.stringify(w.incorrect) + '.';
}
function resultMarker(c) {
  const v = c.expected;
  const x = c.input;
  switch (c.kind) {
    case 'boundary':
    case 'schema': return 'Exactly ' + v + ' inputs satisfy both predicates';
    case 'bisect': return 'first bad index is ' + v;
    case 'coverage': return 'Unique covered outcomes=' + v + ';';
    case 'mutation': return '=' + x.killed + '/(' + x.killed + '+' + x.survived + ')=';
    case 'retry': return 'P(all ' + x.attempts + ' fail)=' + x.p + '^' + x.attempts + '=' + v;
    case 'timeout': return 't>=expiry is ' + v;
    case 'transaction': return v === 0 ? 'zero rows persist' : 'COMMIT all ' + v + ' rows';
    case 'permutation': return 'to get ' + v + '.';
    case 'mock':
      return 'Total calls=' + x.tasks + '+' + (v - x.tasks) + '=' + v + '.';
    case 'binary': return 'emitted network-order bytes ' + JSON.stringify(v);
    case 'percentile': return 'selecting ' + v + '.';
    default: throw Error('Unknown kind');
  }
}

test('fixture: 48 distinct existing records and bounded source provenance', () => {
  assert.equal(cases.length, 48);
  assert.equal(new Set(cases.map(c => c.id)).size, 48);
  for (const c of cases) {
    assert.ok(pack[c.id], c.id);
    assert.equal(pack[c.id].essentialQuestion, c.question);
    assert.deepEqual(pack[c.id].reasoningSteps, c.reasoningSteps);
    assert.deepEqual(pack[c.id].labPlan, c.labPlan);
    assert.ok(c.source.startsWith('https://'));
  }
});

test('fixture: independent baseline and perturbation calculations, 96 total', () => {
  for (const c of cases) {
    assert.ok(same(reference(c, c.input), c.expected), c.id + ': baseline mismatch');
    assert.ok(same(reference(c, c.variation), c.variationExpected), c.id + ': variation mismatch');
    assert.ok(counterexample(c), c.id + ': counterexample missing');
  }
});

for (const c of cases) {
  test('baseline prose: ' + c.id, () => {
    const step = pack[c.id].reasoningSteps[1];
    const marker = resultMarker(c);
    assert.ok(step.includes(marker), c.id + ': prose does not contain independently verified answer marker ' + marker);
    const mutated = step.replace(marker, '[INCORRECT NUMERICAL RESULT]');
    assert.ok(!mutated.includes(marker), c.id + ': injected numerical mutation escaped detection');
  });

  test('falsification authenticity: ' + c.id, () => {
    const w = counterexample(c);
    const incorrect = proposedFalseClaim(c, w);
    // A legitimate falsification lab must propose an actually incorrect,
    // executable claim and exhibit its concrete counterexample.
    assert.equal(c.incorrectAssertion, incorrect, c.id + ': current "incorrectAssertion" is truthful or has no executable falsifier; propose ' + incorrect +
      ' / correct output ' + JSON.stringify(w.correct));
    const detail = pack[c.id].reasoningSteps[4];
    assert.ok(detail.includes(incorrect) &&
      detail.includes(JSON.stringify(w.correct)) &&
      detail.includes(JSON.stringify(w.input)),
      c.id + ': show the actual input, wrong output, and independently verified correct result in the explanation');
    const lab = pack[c.id].labPlan[4];
    assert.ok(lab.includes(incorrect) && lab.includes(JSON.stringify(w.input)),
      c.id + ': the reproducible lab must use the same stated counterexample');
  });
}

test('mutation sensitivity: a wrong fixture baseline cannot masquerade as correct', () => {
  const c = cases[0];
  const tampered = c.expected + 1;
  assert.ok(!same(reference(c, c.input), tampered));
  const original = pack[c.id].reasoningSteps[1];
  const marker = resultMarker(c);
  assert.ok(original.includes(marker));
  assert.ok(!original.replace(marker, '[WRONG ANSWER]').includes(marker));
});
