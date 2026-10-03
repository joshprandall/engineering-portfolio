const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'docs/release-evidence/professional-content-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

test('professional content manifest pins the exact release payload', () => {
  assert.match(manifest.version, /^20261003-professional-content-v3$/);
  assert.match(manifest.payloadCommit, /^[a-f0-9]{40}$/);
  assert.equal(manifest.publicUrl, 'https://web.engr.oregonstate.edu/~randjosh/');
  assert.equal(new Set(manifest.files.map(entry => entry.path)).size, manifest.files.length);
  for (const entry of manifest.files) {
    const file = path.join(root, entry.path);
    assert.equal(fs.existsSync(file), true, `${entry.path} exists`);
    assert.equal(digest(file), entry.sha256, `${entry.path} matches its reviewed SHA-256`);
    assert(entry.previousSha256 === null || /^[a-f0-9]{64}$/.test(entry.previousSha256));
  }
});

test('content asset and script cache versions match the manifest release', () => {
  const htmlFiles = manifest.files.filter(entry => entry.path.endsWith('.html'));
  const expected = `?v=${manifest.version}`;
  let references = 0;
  for (const entry of htmlFiles) {
    const html = fs.readFileSync(path.join(root, entry.path), 'utf8');
    for (const match of html.matchAll(/(?:src|poster)="(assets\/content\/[^"]+)"/g)) {
      references += 1;
      assert(match[1].endsWith(expected), `${entry.path} uses ${manifest.version}: ${match[1]}`);
    }
  }
  const security = fs.readFileSync(path.join(root, 'security-research.html'), 'utf8');
  assert(security.includes(`security-research.js${expected}`));
  assert(references >= 20, 'all professional visuals, videos, posters and captions are versioned');
});
