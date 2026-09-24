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
assert.doesNotMatch(projects,/class=["'][^"']*filter-bar[^"']*["']/i,'Removed project filter bar must not return');
assert.doesNotMatch(projects,/id=["']filter-count["']/i,'Removed project filter count must not return');
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
assert.match(vnext,/enhanceProjectNavigation/,'Project pager cleanup missing');
assert.match(vnext,/\$\$\('\.vnext-project-nav'\)\.forEach\(nav=>nav\.remove\(\)\)/,'Stale project pagers must be removed by the shared experience layer');
assert.match(vnext,/target='_blank'/,'Project-card pop-out behavior missing');

const primaryTiles=[...projects.matchAll(/<a\b[^>]*class=["'][^"']*tile-open[^"']*["'][^>]*>/gi)].map(x=>x[0]);
assert.equal(primaryTiles.length,16,'Every project card must have one primary tile link');
for (const tile of primaryTiles) assert.match(tile,/target=["']_blank["']/i,'Every primary project tile must open its dedicated page in a new tab');

const detailPages=fs.readdirSync(root).filter(x=>/^project-.*\.html$/.test(x));
assert.ok(detailPages.length>=15,'Expected dedicated project pages for the catalog');
for (const file of detailPages) {
  const html=read(file);
  assert.doesNotMatch(html,/vnext-project-nav/,`${file}: redundant Previous / All / Next project navigation must not return`);
}
const evilWrapper=read('play-evil-wizard.html');
assert.doesNotMatch(evilWrapper,/vnext-project-nav/,'Evil Wizard wrapper must use only the shared header navigation');
assert.doesNotMatch(evilWrapper,/<iframe\b[^>]*games\/evil-wizard\/play\.html/i,'Evil Wizard project page must not embed the playable game');
assert.match(evilWrapper,/class="game-launch"[^>]*href="games\/evil-wizard\/play\.html"/,'Evil Wizard project page must launch the dedicated game from a clickable cover');
const chessWrapper=read('project-battle-chess.html');
assert.doesNotMatch(chessWrapper,/<iframe\b[^>]*games\/3d-battle-chess/i,'Battle Chess project page must not embed the playable game');
assert.match(chessWrapper,/class="battle-launch"[^>]*href="games\/3d-battle-chess\//,'Battle Chess project page must launch the dedicated game from a clickable cover');

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
const handheldJs=read('handheld-experience.js');
assert.doesNotMatch(handheldCss,/\.hx-phone-dock\{position:fixed/,'Floating phone navigation must not return');
assert.doesNotMatch(handheldCss,/\.hx-tablet-rail\{position:fixed/,'Floating tablet navigation must not return');
assert.match(handheldJs,/removeLegacyFloatingNavigation/,'Handheld layer must actively remove stale floating navigation');
assert.match(read('styles.css'),/:focus-visible/,'Visible keyboard focus styling missing');
const resilience=read('site-resilience.js');
assert.match(resilience,/Game Development/,'Primary navigation must include the Game Development category');
assert.match(resilience,/project-battle-chess\.html/,'Game Development navigation must include 3D Battle Chess');
assert.match(resilience,/play-evil-wizard\.html/,'Game Development navigation must include Defeat the Evil Wizard');
assert.match(resilience,/menu\.onclick=/,'Shared header must have a single explicit hamburger owner');
assert.match(resilience,/project-shell/,'Project pages must be marked for hamburger-only header navigation');
assert.match(read('site-resilience.css'),/body\.project-shell #menu\{display:inline-flex!important/,'Project pages must expose the hamburger at all viewport sizes');
assert.match(read('site-scenes.css'),/body\.project-shell \.tools #theme\.appearance-toggle/,'Project pages must expose the shared appearance control');
assert.doesNotMatch(read('app.js'),/menu\.addEventListener\("click"/,'app.js must not register a competing hamburger handler');
assert.match(read('site-resilience.css'),/\.nav-games-menu/,'Game Development submenu styling is missing');
assert.match(read('knowledge.js'),/closePrimaryNav/,'Knowledge Library must use robust top navigation close behavior');
assert.match(read('knowledge.js'),/Game Development/,'Knowledge Library top navigation must include Game Development');
assert.match(read('play-evil-wizard.html'),/id="primary-nav"/,'Evil Wizard wrapper must use the shared top navigation');
assert.match(read('play-evil-wizard.html'),/site-resilience\.js\?v=[A-Za-z0-9._-]+/,'Evil Wizard wrapper must load the versioned shared navigation asset');
assert.ok(!projects.includes('id="roadmap"'),'Removed projects roadmap must not return');
const battleIndex=read('games/3d-battle-chess/index.html'),battleRuntime=read('games/3d-battle-chess/battle.js');
assert.match(battleIndex,/id="setupScreen"/,'Battle Chess must open on a dedicated setup screen');
assert.match(battleIndex,/id="startGameBtn"/,'Battle Chess setup must provide an explicit Start Game action');
assert.match(battleIndex,/id="rotateGate"/,'Battle Chess must provide a handheld landscape-orientation gate');
assert.doesNotMatch(battleIndex,/class="site-nav"|backToProjects|backToHome/,'Battle Chess must not restore redundant portfolio navigation inside the game');
assert.match(battleRuntime,/function launchFromSetup\(\)/,'Battle Chess must launch gameplay from setup');
assert.match(battleRuntime,/void enterFullscreen\(\)/,'Battle Chess Start must request immersive fullscreen');
assert.match(battleRuntime,/needsLandscape/,'Battle Chess must enforce landscape play on handheld devices');
const handheld=read('handheld-experience.js'),science=read('science-experiments.js');
for(const protectedStem of ['project-geometric-ai','project-battle-chess','play-evil-wizard']) assert.ok(handheld.includes(protectedStem),`Protected route ${protectedStem} must be excluded from handheld enhancements`);
assert.match(science,/geometric-ai\|battle-chess\|play-evil-wizard/,'Science experiment layer must explicitly exclude games and Geometric AI');
assert.match(read('knowledge.js'),/handheld-experience\.js/,'Learning platform must load the device-specific handheld layer');
const learningDepth=read('learning-depth.js'),learningDepthCss=read('learning-depth.css'),learningNext=read('learning-next.js');
assert.match(read('knowledge.js'),/learning-depth\.js/,'Knowledge Platform must load the progressive mastery layer');
assert.match(read('knowledge.js'),/learning-depth\.css/,'Knowledge Platform must load progressive mastery styling');
assert.match(learningDepth,/Doctoral \/ Research/,'Mastery ladder must include a doctoral/research target');
for(const stage of ['Orientation','Foundations','Core','Applied','Undergraduate','Advanced','Graduate bridge','Doctoral / Research']) assert.ok(learningDepth.includes(stage),`Mastery ladder missing ${stage}`);
assert.match(learningDepth,/Existing lessons keep their verified Foundation, Intermediate, or Advanced difficulty/,'Mastery layer must preserve verified difficulty labels');
assert.match(learningDepth,/Build my learning route/,'Mastery layer must provide a route planner');
assert.match(learningDepth,/dataset\.libraryPage\|\|'home'\)!=='home'/,'Full mastery landing section must be scoped to the Learn home page');
assert.match(read('knowledge.js'),/Research bridge/,'Lesson learning modes must include Research Bridge');
assert.match(read('knowledge.js'),/graduate-style reading habits/,'Research Bridge must explain its academic-depth boundary');
assert.match(learningNext,/vnext-path-band/,'Learning paths must expose verified path-band filtering');
assert.match(learningNext,/jr-knowledge-depth-target-v1/,'Learning paths must respect the selected mastery target');
assert.match(learningDepth,/data-depth-summary="compact"/,'Subpage target-depth context must avoid repeating the target title');
assert.match(read('learning-next.css'),/data-library-page="paths"[^}]*learn-page-intro/,'Learning Paths must suppress the redundant generic page intro');
assert.match(learningDepthCss,/\.depth-ladder/,'Progressive mastery ladder styling missing');
const overlayWorkflow=read('.github/workflows/build-osu-overlay.yml');
assert.match(overlayWorkflow,/forbidden_prefixes=\('games\/',\s*'geometric-lab\/'\)/,'OSU overlay must forbid game and Geometric AI trees');
assert.match(overlayWorkflow,/protected_root\s*=\s*set\(\)/,'OSU overlay must allow project wrapper HTML to receive navigation fixes');
assert.match(overlayWorkflow,/forbidden_prefixes=\('games\/',\s*'geometric-lab\/'\)/,'OSU overlay must continue protecting actual game and Geometry Lab trees');
const deployScript=read('tools/deploy_osu_live.py');
assert.match(deployScript,/parser\.add_argument\('--commit',required=True/,'Deployments must explicitly select the exact tested commit');
assert.doesNotMatch(deployScript,/WEB_COMMIT =/,'A stale hardcoded deploy pin must not override the tested release');
const webDirs=deployScript.match(/WEB_DIRS = \(([^)]*)\)/)?.[1]||'';
assert.ok(!/games\/|geometric-lab|project-sources/.test(webDirs),'OSU deploy WEB_DIRS must not overwrite protected or repository-only trees');
assert.match(deployScript,/PROTECTED_ROOT_FILES = set\(\)/,'OSU deploy must allow project wrapper HTML updates');


for (const file of ['site-theme.js','site-scenes.js','geometric-lab/app.js','app.js','portfolio-next.js','handheld-experience.js','science-experiments.js','quantum-cube.js','knowledge.js','learning-depth.js','learning-next.js','agent-workbench.js','labs/qpe.js','labs/emergent.js','qubit-preview-20260921/app.js','qubit-preview-20260921/qubit.js','games/3d-battle-chess/battle.js','games/3d-battle-chess/engine.js']) execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});

const q=await import(pathToFileURL(path.join(root,'qubit-preview-20260921/qubit.js')).href+'?test='+Date.now());
const plus=q.stateFromAngles(90,0),minus=q.stateFromAngles(90,180),plusI=q.stateFromAngles(90,90),north=q.stateFromAngles(0,123);
assert.ok(Math.abs(q.measurementProbabilities(plus,'X').p0-1)<1e-12,'|+> must be deterministic in X');
assert.ok(Math.abs(q.measurementProbabilities(minus,'X').p0)<1e-12,'|-> must be deterministic in X');
assert.ok(Math.abs(q.measurementProbabilities(plusI,'Y').p0-1)<1e-12,'|+i> must be deterministic in Y');
assert.ok(Math.abs(q.measurementProbabilities(north,'Z').p0-1)<1e-12,'|0> must be deterministic in Z');
assert.ok(Math.abs(plus.normalization-1)<1e-12,'Qubit normalization drift');

const qpe=await import(pathToFileURL(path.join(root,'labs/qpe.js')).href+'?test='+Date.now());
const exact=qpe.distribution(.125,3,0),peak=exact.reduce((a,b)=>b.ideal>a.ideal?b:a);
assert.equal(peak.bits,'001','QPE exact 1/8 phase should peak at 001');
assert.ok(Math.abs(exact.reduce((s,x)=>s+x.mixed,0)-1)<1e-10,'QPE distribution must normalize');

const emergent=await import(pathToFileURL(path.join(root,'labs/emergent.js')).href+'?test='+Date.now());
const eg=emergent.create(12,.2,42),r0=emergent.order(eg);emergent.advance(eg,10,1.2);
assert.equal(eg.step,10,'Emergent model step counter mismatch');
assert.ok(r0>=0&&r0<=1&&emergent.order(eg)>=0&&emergent.order(eg)<=1,'Kuramoto order parameter must remain in [0,1]');

const mind=await import(pathToFileURL(path.join(root,'agent-workbench.js')).href+'?test='+Date.now());
const mr=mind.run('Repair a test regression',{evidence:['Reproduction steps','CI test output','Rollback review']});
assert.ok(mr.requiresApproval,'MIND workbench must preserve human approval boundary');
assert.ok(mr.evidenceCoverage>0,'MIND evidence coverage should respond to evidence');
console.log('Science-experiment release validation passed: 16 projects, 8,000 manifest records, orbital systems scene, deterministic science math and protected experience exclusions.');

// Performance/usability regression guards: keep expensive continuous work out of
// hidden/off-screen views and keep the 25 MB learning corpus from parser-blocking.
for (const file of ['learn.html','learn-browse.html','learn-glossary.html','learn-labs.html','learn-map.html','learn-mastery.html','learn-paths.html','learn-practice.html','learn-verify.html']) {
  const html=read(file);
  if (html.includes('knowledge-data.js')) {
    assert.match(html,/<script\b[^>]*\bdefer\b[^>]*src=["']knowledge-data\.js["']/i, `${file}: knowledge-data.js must be deferred`);
  }
}
assert.match(read('app.js'),/IntersectionObserver/,'Homepage systems animation must suspend when off-screen');
assert.match(read('app.js'),/document\.hidden/,'Homepage systems animation must suspend in background tabs');
assert.match(read('portfolio-next.js'),/sceneVisible/,'Solar systems animation must track viewport visibility');
assert.match(read('portfolio-next.js'),/frameInterval/,'Solar systems animation must use a bounded paint cadence');
assert.match(read('knowledge.js'),/IntersectionObserver/,'Learning constellation must suspend when off-screen');
assert.match(read('site-scenes.js'),/constrainedMedia/,'Living scenes must adapt to constrained and in-app browsers');
assert.match(read('site-scenes.js'),/preload="metadata"/,'Living scenes must not eagerly preload a remote 1080p stream in markup');
assert.match(read('site-resilience.css'),/content-visibility:auto/,'Off-screen sections must use progressive rendering where supported');
assert.match(read('project-geometric-ai.html'),/<iframe\b[^>]*loading=["']lazy["']/i,'Geometry Lab preview must lazy-load below the fold');


const home=read('index.html');
assert.doesNotMatch(home,/id="fusion"|Depth across the stack|Grounded in experience/,'Replaced homepage sections must not return');
for(const asset of ['portfolio-home.css','quantum-cube.js','assets/systems-lab.jpg']) assert.ok(home.includes(asset)&&exists(asset),`Homepage asset missing: ${asset}`);
assert.ok(exists('assets/quantum-field-notes.jpg'),'Quantum Field Notes artwork remains available as an optional asset');
assert.ok(exists('assets/joshua-randall-headshot.jpg'),'Original headshot source should remain available');
assert.match(home,/portrait-photo[\s\S]*data:image\/webp;base64,/,'Homepage must embed the verified transparent portrait directly');
assert.ok(fs.statSync(path.join(root,'assets/joshua-randall-cutout.webp')).size > 10000,'Transparent portrait cutout must be a real image asset');
assert.match(read('styles.css'),/assets\/fonts\/fonts.css/,'Main typography must work without an external font request');
