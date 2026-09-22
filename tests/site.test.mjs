import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
for (const file of ['index.html','projects.html','styles.css','app.js','README.md']) {
  assert.ok(fs.existsSync(path.join(root,file)), `missing ${file}`);
}
for (const file of ['index.html','projects.html']) {
  const page=read(file);
  assert.match(page, /<html[^>]*lang=["']en["']/i, `${file}: missing language`);
  assert.match(page, /<main[^>]*id=["']main["']/i, `${file}: missing main`);
  assert.match(page, /<meta[^>]*name=["']viewport["']/i, `${file}: missing viewport`);
  const ids=[...page.matchAll(/\sid=["']([^"']+)["']/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length,`${file}: duplicate IDs`);
  for (const src of [...page.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)].map(match=>match[1])) {
    if (/^(https?:|#|mailto:)/.test(src)) continue;
    assert.ok(fs.existsSync(path.join(root,src.split('?')[0])) || src.startsWith('assets/'),`${file}: missing ${src}`);
  }
}
const projects=read('projects.html');
const cards=[...projects.matchAll(/<article\b[^>]*class=["'][^"']*project-card[^"']*["']/gi)];
assert.ok(cards.length>=8,'Too few project cards');
const count=projects.match(/id=["']filter-count["'][^>]*>(\d+) projects/i);
assert.equal(Number(count?.[1]),cards.length,'Project card count differs from filter badge');
assert.match(projects,/id=["']evil-wizard["']/,'Game card disappeared');
if (fs.existsSync(path.join(root,'verification-manifest.json'))) {
  const manifest=JSON.parse(read('verification-manifest.json'));
  assert.equal(manifest.count,8000,'Expected 8000 release verification records');
  assert.equal(manifest.records.length,8000,'Evidence record count mismatch');
  for (const file of ['learn.html','knowledge-data.js','knowledge.js','knowledge.css','deep-learning/index.json','site-resilience.js','site-resilience.css']) {
    assert.ok(fs.existsSync(path.join(root,file)),`Missing release file ${file}`);
  }
  assert.match(projects,/id=["']quantum["']/,'Qubit demo disappeared');
  assert.match(projects,/site-resilience\.js/,'Qubit repair script not loaded');
  assert.match(read('index.html'),/id=["']primary-nav["']/,'Mobile navigation target missing');
}
assert.match(read('styles.css'),/:focus-visible/,'Focus styling missing');
console.log(`Site validation passed (${cards.length} project cards).`);
