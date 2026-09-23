import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const exists = file => fs.existsSync(path.join(root, file));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
for (const file of ['index.html','projects.html','styles.css','app.js','learn.html','learn-browse.html','knowledge-data.js','knowledge.js','knowledge.css','deep-learning/index.json','verification-manifest.json','play-evil-wizard.html','qubit-preview-20260921/index.html','games/3d-battle-chess/index.html']) assert.ok(exists(file), `Missing required release file: ${file}`);
for (const file of ['index.html','projects.html','learn.html','play-evil-wizard.html']) {
  const html = read(file);
  assert.match(html, /<html[^>]*lang=["']en["']/i, `${file}: missing document language`);
  assert.match(html, /<main\b/i, `${file}: missing main landmark`);
  assert.match(html, /<meta[^>]*name=["']viewport["']/i, `${file}: missing viewport`);
  const ids=[...html.matchAll(/\sid=["']([^"']+)["']/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate IDs`);
}
const projects=read('projects.html');
const cards=[...projects.matchAll(/<article\b[^>]*class=["'][^"']*project-card[^"']*["']/gi)];
assert.equal(cards.length,16,'Reconciled release must preserve all 16 project cards');
const count=projects.match(/id=["']filter-count["'][^>]*>(\d+) projects/i);
assert.equal(Number(count?.[1]),cards.length,'Project filter count differs from card count');
for (const [id, route] of [['evil-wizard','play-evil-wizard.html'],['quantum','qubit-preview-20260921/'],['battle-chess','project-battle-chess.html'],['geometric-ai','project-geometric-ai.html'],['qpe','project-qpe.html'],['emergent','project-emergent.html'],['mind-agents','project-mind.html']]) {
  assert.match(projects, new RegExp(`id=["']${id}["']`), `Missing project card ${id}`);
  assert.ok(projects.includes(`href="${route}"`), `${id}: missing expected route ${route}`);
}
assert.match(read('play-evil-wizard.html'), /games\/evil-wizard\/index\.html/, 'Game launcher must keep the browser-play URL');
if (!exists('games/evil-wizard/index.html')) console.warn('HOST-DEPENDENT GAME: games/evil-wizard/index.html is NOT in this repository. Preserve and verify the existing OSU web export before deploying. Browser play has NOT been validated by this test.');
const manifest=JSON.parse(read('verification-manifest.json'));
assert.equal(manifest.count,8000,'Expected 8,000 release manifest entries');
assert.equal(manifest.records.length,8000,'Manifest record count mismatch');
assert.equal(new Set(manifest.records.map(x=>x.id)).size,8000,'Duplicate manifest IDs');

const vnext=read('portfolio-next.js');
assert.equal((vnext.match(/name:'(?:Architect|Build|Secure|Automate|Evolve)'/g)||[]).length,5,'Connected Systems must expose exactly five capability models');
for (const name of ['Architect','Build','Secure','Automate','Evolve']) {
  assert.match(vnext,new RegExp(`data-capability|\\${name}`),'Capability selector implementation missing');
}
assert.match(vnext,/Five linked capability nodes/,'Connected Systems five-node SVG missing');
assert.match(vnext,/enhanceProjectNavigation/,'Project detail navigation enhancer missing');
assert.match(vnext,/target='_blank'/,'Project-card pop-out behavior missing');

const primaryTiles=[...projects.matchAll(/<a\\b[^>]*class=["'][^"']*tile-open[^"']*["'][^>]*>/gi)].map(x=>x[0]);
assert.equal(primaryTiles.length,16,'Every project card must have one primary tile link');
for (const tile of primaryTiles) assert.match(tile,/target=["']_blank["']/i,'Every primary project tile must open its dedicated page in a new tab');

const detailPages=fs.readdirSync(root).filter(x=>/^project-.*\\.html$/.test(x));
assert.ok(detailPages.length>=15,'Expected dedicated project pages for the catalog');
for (const file of detailPages) {
  const html=read(file);
  assert.match(html,/vnext-project-nav/,`${file}: missing Previous / All / Next project navigation`);
}
assert.match(read('play-evil-wizard.html'),/vnext-project-nav/,'Evil Wizard project page must have Previous / All / Next navigation');

const knowledge=read('knowledge.js');
assert.match(knowledge,/standaloneExperienceURL/,'Standalone lab URL helper missing');
assert.match(knowledge,/standalone-experience-nav/,'Standalone lab Previous / All / Next navigation missing');
assert.match(knowledge,/lab-tile-link/,'Interactive lab tiles must launch dedicated experience pages');
assert.match(knowledge,/window\.open\(standaloneExperienceURL/,'Interactive learning objects must pop out into their own page');

assert.match(read('styles.css'),/:focus-visible/,'Visible keyboard focus styling missing');
for (const file of ['app.js','portfolio-next.js','knowledge.js','agent-workbench.mjs','games/3d-battle-chess/battle.js','games/3d-battle-chess/engine.js']) execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});
console.log('Static release integration passed: 16 projects, 8,000 unique manifest IDs, required routes and JavaScript syntax. OSU game export and media require separate live verification.');
