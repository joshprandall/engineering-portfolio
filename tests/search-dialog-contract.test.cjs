'use strict';
// site-search.js exits silently when its dialog is missing, which leaves a visible Search button
// that does nothing. Every page that loads the script must carry the elements it requires.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));

test('every page that loads site-search.js has the search dialog it needs', () => {
  const broken = [];
  let checked = 0;
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    if (!/<script[^>]+src="site-search\.js/.test(html) || !html.includes('id="search-open"')) continue;
    checked++;
    for (const id of ['search-dialog', 'search-input', 'search-results']) {
      if (!html.includes('id="' + id + '"')) broken.push(page + ' lacks #' + id);
    }
  }
  assert.ok(checked > 50, 'expected the shared search on most pages, found ' + checked);
  assert.deepEqual(broken, []);
});
