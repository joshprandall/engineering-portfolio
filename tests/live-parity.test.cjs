'use strict';
// Live-site parity pins. The public OSU site is the authority for appearance. These hashes were
// taken from the live files on 2026-11-12 and reproduced from repository bytes; a change to any
// pinned file must be a deliberate, reviewed decision, not a side effect of content work.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const read = (name) => fs.readFileSync(path.join(root, name));

const LIVE = {
  'index.html': 'c43093cbed6421a9d464d757d7d04df3c8652f1a2d70b4adc8c2b0d81906af5d',
  'learning-academy.js': '9e0e22aaab7dd303fcd72588ae912029f3bf519f8d6865fb2f8caa58b98930c5',
  'styles.css': '1302db176b50a2a48a0136a79fca499bfa6612c534d1eddeb84221cdc0f76100'
};

test('learning-academy.js and styles.css are byte-identical to the live files', () => {
  assert.equal(sha256(read('learning-academy.js')), LIVE['learning-academy.js']);
  assert.equal(sha256(read('styles.css')), LIVE['styles.css']);
});

test('index.html differs from the live homepage only by two asset references', () => {
  // The live homepage loads a stylesheet version and an isolated solar navigation build that is
  // not in this repository. Reproducing the live bytes from the repository therefore takes
  // exactly these two substitutions, and nothing else may differ.
  const substitutions = [
    ['site-responsive.css?v=20261109-unified-hero-v1', 'site-responsive.css?v=20261109-site-uniform-v1'],
    ['src="solar-navigation.js"', 'src="solar-v7-isolated-20261109/solar-navigation.js?v=20261109-solar-v8-home-stage"']
  ];
  let text = read('index.html').toString('latin1');
  for (const [from, to] of substitutions) {
    assert.equal(text.split(from).length - 1, 1, 'exactly one occurrence of ' + from);
    text = text.replace(from, to);
  }
  assert.equal(sha256(Buffer.from(text, 'latin1')), LIVE['index.html']);
});
