'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'learn-math.html'), 'utf8');
const match = source.match(/<section id="induction-proof-lab"\b[\s\S]*?<\/section>/);
assert(match, 'Induction lab section must be present on the mathematics course page');
const lab = match[0];

assert(lab.includes('aria-labelledby="induction-proof-lab-title"'), 'Lab section must have an accessible heading');
assert(lab.includes('id="induction-proof-lab-title"'), 'Accessible heading must be defined');
assert.equal((lab.match(/<details>/g) || []).length, 4, 'Four guided practices should have reasoning checks');
assert.equal((lab.match(/<summary>/g) || []).length, 4, 'Each reasoning check must have a readable summary');
assert(lab.includes('GUIDED PROOF LAB'), 'Do not represent this lab as executable or formally graded');
assert(lab.includes('https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/'), 'Authoritative external proof reference required');
assert(lab.includes('not affiliated with MIT'), 'Source link must not imply endorsement');

for (let n = 1; n <= 200; n++) {
  const sum = Array.from({ length: n }, (_, i) => 2 * i + 1).reduce((a, b) => a + b, 0);
  assert.equal(sum, n * n, 'Sum-of-odds numerical check failed at n=' + n);
}
for (let k = 1; k <= 200; k++) {
  assert.equal(k * k + (2 * k + 1), (k + 1) ** 2, 'Inductive step failed at k=' + k);
}
const counterexample = 40 * 40 + 40 + 41;
assert.equal(counterexample, 41 ** 2, 'Claim-specific counterexample calculation changed');
assert.equal(counterexample % 41, 0);
assert.notEqual(counterexample, 41, 'Counterexample must be composite');

console.log('PASS induction companion: accessible structure, four practice checks, arithmetic and counterexample verified.');
