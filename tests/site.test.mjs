import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const root = path.resolve(import.meta.dirname, '..');
const exists = file => fs.existsSync(path.join(root, file));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
for (const file of ['index.html','projects.html','styles.css','app.js','portfolio-next.js','portfolio-next.css','handheld-experience.js','handheld-experience.css','science-experiments.js','science-experiments.css','learn.html','learn-browse.html','knowledge-data.js','knowledge.js','knowledge.css','deep-learning/index.json','verification-manifest.json','play-evil-wizard.html','qubit-preview-20260921/index.html','games/3d-battle-chess/index.html']) assert.ok(exists(file), `Missing required release file: ${file}`);
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
for (const [id, route] of [['evil-wizard','games/evil-wizard/play.html'],['quantum','qubit-preview-20260921/'],['battle-chess','project-battle-chess.html'],['geometric-ai','project-geometric-ai.html'],['qpe','project-qpe.html'],['emergent','project-emergent.html'],['mind-agents','project-mind.html']]) {
  assert.match(projects, new RegExp(`id=["']${id}["']`), `Missing project card ${id}`);
  assert.ok(projects.includes(`href="${route}"`), `${id}: missing expected route ${route}`);
}
assert.match(read('play-evil-wizard.html'), /games\/evil-wizard\/play\.html/, 'Game launcher must keep the adaptive browser-play URL');
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
assert.match(vnext,/Interactive Connected Systems solar-system model/,'Connected Systems solar-system model missing');
assert.match(vnext,/vnext-cosmos-canvas/,'Solar-system canvas missing');
assert.match(vnext,/vnext-cosmos-worlds/,'Selectable capability worlds missing');
assert.match(vnext,/const coreEl=.*vnext-cosmos-core/,'Cosmos core DOM reference must remain distinct from canvas gradients');
assert.doesNotMatch(vnext,/const core=ctx\.createRadialGradient/,'Cosmos renderer must not shadow the core DOM reference');
assert.match(read('portfolio-next.css'),/vnext-cosmos-scene/,'Solar-system presentation styles missing');
assert.match(vnext,/enhanceProjectNavigation/,'Project detail navigation enhancer missing');
assert.match(vnext,/target='_blank'/,'Project-card pop-out behavior missing');

const primaryTiles=[...projects.matchAll(/<a\b[^>]*class=["'][^"']*tile-open[^"']*["'][^>]*>/gi)].map(x=>x[0]);
assert.equal(primaryTiles.length,16,'Every project card must have one primary tile link');
for (const tile of primaryTiles) assert.match(tile,/target=["']_blank["']/i,'Every primary project tile must open its dedicated page in a new tab');

const detailPages=fs.readdirSync(root).filter(x=>/^project-.*\.html$/.test(x));
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

const portfolioNext=read('portfolio-next.js');
assert.doesNotMatch(portfolioNext,/const core=ctx\.createRadialGradient/,'Solar renderer must not shadow the DOM core element');
assert.match(portfolioNext,/const coreGlow=ctx\.createRadialGradient/,'Solar core glow should use a non-shadowing variable');
assert.match(read('portfolio-next.css'),/\.vnext-cosmos \.vnext-tab-dot\{[^}]*flex:0 0 7px!important/,'Solar tab dots must not stretch under generic tab span flex rules');
const handheldCss=read('handheld-experience.css');
assert.match(handheldCss,/\.hx-phone-dock\{[^}]*background:rgba\(12,18,22,\.94\)/,'Phone dock must use theme-independent dark chrome');
assert.match(handheldCss,/\.hx-action\{[^}]*background:transparent!important/,'Handheld action buttons must not inherit light theme button chrome');
assert.match(read('styles.css'),/:focus-visible/,'Visible keyboard focus styling missing');
assert.ok(!projects.includes('id="roadmap"'),'Removed projects roadmap must not return');
const handheld=read('handheld-experience.js'),science=read('science-experiments.js');
for(const protectedStem of ['project-geometric-ai','project-battle-chess','play-evil-wizard']) assert.ok(handheld.includes(protectedStem),`Protected route ${protectedStem} must be excluded from handheld enhancements`);
assert.match(science,/geometric-ai\|battle-chess\|play-evil-wizard/,'Science experiment layer must explicitly exclude games and Geometric AI');
assert.match(read('knowledge.js'),/handheld-experience\.js/,'Learning platform must load the device-specific handheld layer');
const overlayWorkflow=read('.github/workflows/build-osu-overlay.yml');
assert.match(overlayWorkflow,/forbidden_prefixes=\('games\/',\s*'geometric-lab\/'\)/,'OSU overlay must forbid game and Geometric AI trees');
assert.match(overlayWorkflow,/protected_root\s*=\s*\{[\s\S]*project-battle-chess\.html[\s\S]*project-geometric-ai\.html[\s\S]*play-evil-wizard\.html/,'OSU overlay must omit protected root pages');
const deployScript=read('tools/deploy_osu_live.py');
assert.match(deployScript,/WEB_COMMIT = "b2112406346d7101d17d56901df3c06bc1026a08"/,'OSU deploy must remain pinned to the visually validated science release');
const webDirs=deployScript.match(/WEB_DIRS = \(([\s\S]*?)\)\n\n/)?.[1]||'';
assert.ok(!/games\/|geometric-lab|project-sources/.test(webDirs),'OSU deploy WEB_DIRS must not overwrite protected or repository-only trees');
assert.match(deployScript,/PROTECTED_ROOT_FILES = \{[\s\S]*project-battle-chess\.html[\s\S]*project-geometric-ai\.html[\s\S]*play-evil-wizard\.html/,'OSU deploy must skip protected root pages');

for (const file of ['app.js','portfolio-next.js','handheld-experience.js','science-experiments.js','knowledge.js','agent-workbench.mjs','labs/qpe.mjs','labs/emergent.mjs','qubit-preview-20260921/app.js','qubit-preview-20260921/qubit.js','games/3d-battle-chess/battle.js','games/3d-battle-chess/engine.js']) execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});

const q=await import(pathToFileURL(path.join(root,'qubit-preview-20260921/qubit.js')).href+'?test='+Date.now());
const plus=q.stateFromAngles(90,0),minus=q.stateFromAngles(90,180),plusI=q.stateFromAngles(90,90),north=q.stateFromAngles(0,123);
assert.ok(Math.abs(q.measurementProbabilities(plus,'X').p0-1)<1e-12,'|+> must be deterministic in X');
assert.ok(Math.abs(q.measurementProbabilities(minus,'X').p0)<1e-12,'|-> must be deterministic in X');
assert.ok(Math.abs(q.measurementProbabilities(plusI,'Y').p0-1)<1e-12,'|+i> must be deterministic in Y');
assert.ok(Math.abs(q.measurementProbabilities(north,'Z').p0-1)<1e-12,'|0> must be deterministic in Z');
assert.ok(Math.abs(plus.normalization-1)<1e-12,'Qubit normalization drift');

const qpe=await import(pathToFileURL(path.join(root,'labs/qpe.mjs')).href+'?test='+Date.now());
const exact=qpe.distribution(.125,3,0),peak=exact.reduce((a,b)=>b.ideal>a.ideal?b:a);
assert.equal(peak.bits,'001','QPE exact 1/8 phase should peak at 001');
assert.ok(Math.abs(exact.reduce((s,x)=>s+x.mixed,0)-1)<1e-10,'QPE distribution must normalize');

const emergent=await import(pathToFileURL(path.join(root,'labs/emergent.mjs')).href+'?test='+Date.now());
const eg=emergent.create(12,.2,42),r0=emergent.order(eg);emergent.advance(eg,10,1.2);
assert.equal(eg.step,10,'Emergent model step counter mismatch');
assert.ok(r0>=0&&r0<=1&&emergent.order(eg)>=0&&emergent.order(eg)<=1,'Kuramoto order parameter must remain in [0,1]');

const mind=await import(pathToFileURL(path.join(root,'agent-workbench.mjs')).href+'?test='+Date.now());
const mr=mind.run('Repair a test regression',{evidence:['Reproduction steps','CI test output','Rollback review']});
assert.ok(mr.requiresApproval,'MIND workbench must preserve human approval boundary');
assert.ok(mr.evidenceCoverage>0,'MIND evidence coverage should respond to evidence');
console.log('Science-experiment release validation passed: 16 projects, 8,000 manifest records, orbital systems scene, deterministic science math and protected experience exclusions.');
