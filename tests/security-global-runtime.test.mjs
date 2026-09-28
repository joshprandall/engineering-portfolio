import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

const nav=JSON.parse(read('assets/site-navigation.json'));
assert.equal(nav.items.filter(x=>x.path==='security-research.html').length,1,'Security Research must appear exactly once in navigation metadata');
assert.equal(nav.items.find(x=>x.path==='security-research.html')?.label,'Security Research');

const home=read('index.html');
assert.equal((home.match(/aria-label="Security Research"/g)||[]).length,1,'Homepage solar must expose exactly one Security Research planet');
assert.ok(home.includes('href="security-research.html" aria-label="Security Research"'),'Security Research planet must link to its page');

const solar=read('solar-navigation.js');
assert.ok(solar.includes('{rx:285,ry:158,count:4,offset:.52}'),'Portfolio solar outer ring must allocate four destinations');
assert.ok(solar.includes('"Security Research": ['),'Security Research solar descriptor missing');

const audio=read('site-audio.js');
assert.ok(audio.includes('const DEFAULT_BACKGROUND_VOLUME = 0.05'),'Ambient audio must default to 5%');
assert.ok(audio.includes('const MAX_BACKGROUND_VOLUME = 1.00'),'Ambient audio must permit 0–100% user adjustment');
assert.ok(audio.includes('ISOLATED_RE'),'Audio isolation boundary missing');
assert.ok(!audio.includes('MAIN_PAGE'),'Ambient audio must not be restricted to Home/Learn');
assert.ok(!audio.includes('project-[^/]+\\.html'),'Normal project detail pages must not be globally suppressed');
assert.ok(audio.includes("portfolio:site-audio-ready"),'SiteAudio must announce readiness for late-bound controls');

const theme=read('site-theme.js');
for(const file of ['site-scenes.js','site-audio.js','site-navigation.js','site-sound-control.js']){
  assert.ok(theme.includes("loadScript('"+file+"')"),'Shared runtime bootstrap missing '+file);
}
assert.ok(theme.includes("header.site-global-header, header #menu, header #mobile-menu"),'Shared runtime bootstrap must be scoped to shared-shell pages');
assert.ok(theme.includes('SITE_BASE'),'Shared runtime bootstrap must resolve from the theme script base');
assert.ok(theme.includes("const isPaused = () => motion === 'paused'"),'Only an explicit site pause may fully freeze scenery');
assert.ok(theme.includes('const isReducedMotion = () =>'),'OS reduced-motion preference must have a separate reduced mode');

const scenesCss=read('site-scenes.css');
const responsive=read('site-responsive.css');
assert.ok(responsive.includes('--nav-menu-solid'),'Solid hamburger menu token missing');
assert.ok(responsive.includes('background:var(--nav-menu-solid)!important'),'Hamburger menu must be opaque');
assert.ok(responsive.includes('backdrop-filter:none!important'),'Hamburger menu must not use translucent backdrop filtering');
assert.ok(scenesCss.includes('.scene-canvas{display:block;z-index:6;opacity:1}'),'Night star canvas must render above the dark readability veil');
assert.ok(scenesCss.includes(':root[data-theme=light] .scene-canvas{z-index:3;opacity:.88}'),'Day canvas must retain its quieter layer position');
assert.ok(scenesCss.includes('inset:-6%') && scenesCss.includes('width:112%') && scenesCss.includes('height:112%'),'Night layers must provide responsive overscan for bounded panning');
assert.ok(scenesCss.includes('transform:translate3d(0,0,0) scale(1.04)'),'Day fallback must retain transform headroom for safe motion');

const scenes=read('site-scenes.js');
assert.ok(scenes.includes('const ROTATE_AFTER = 28'),'Light scenes must rotate on the approved cadence');
assert.ok(scenes.includes("if (!video || theme !== 'light' || !motionAllowed() || mediaDisabled) return false"),'Day video playback must not be disabled by OS reduced-motion');
assert.ok(!scenes.includes("!motionAllowed() || reducedMotion() || mediaDisabled"),'Reduced-motion must not silently freeze Day video');
assert.ok(scenesCss.includes('@keyframes scene-day-fallback-drift'),'Day poster fallback must have its own visible camera animation');
assert.ok(scenesCss.includes('[data-scene-motion=running] .scene-day-fallback'),'Normal Day fallback motion must be tied to running site motion');
assert.ok(scenesCss.includes('[data-scene-motion=reduced] .scene-day-fallback'),'Reduced-motion Day fallback must remain alive with a gentler animation');
assert.ok(scenesCss.includes('scene-day-fallback-drift 24s'),'Normal Day fallback motion must be slow but perceptible');
assert.ok(scenes.indexOf("id: 'forest-waterfall'")<scenes.indexOf("id: 'forest-river'")&&scenes.indexOf("id: 'forest-river'")<scenes.indexOf("id: 'birds-water'"),'Light scene order must be waterfall → river → beach');
assert.ok(scenes.includes('twinkle: random() < .76'),'Night stars must include a dense independent twinkling subset');
assert.ok(scenes.includes('Math.sin(time * .18) * limits.x'),'Night scene must use slower viewport-bounded horizontal drift');
assert.ok(scenes.includes('ctx.moveTo(x - flare, y); ctx.lineTo(x + flare, y);'),'Night twinkle must draw a visible horizontal sparkle flare');
assert.ok(scenes.includes('ctx.moveTo(x, y - flare); ctx.lineTo(x, y + flare);'),'Night twinkle must draw a visible vertical sparkle flare');
assert.ok(scenes.includes('function nightCameraLimits()'),'Night scene must compute camera travel from actual overscan');
assert.ok(scenes.includes('(night.offsetWidth - width) / 2 - 4'),'Horizontal camera bound must derive from rendered overscan');
assert.ok(scenes.includes('(night.offsetHeight - height) / 2 - 4'),'Vertical camera bound must derive from rendered overscan');
assert.ok(scenes.includes('const x = star.x * width + cameraX'),'Generated stars must share the background camera X transform');
assert.ok(scenes.includes('const y = star.y * height + cameraY'),'Generated stars must share the background camera Y transform');
assert.ok(scenes.includes('const scale = reducedMotion() ? .18 : 1'),'Reduced-motion mode must reduce parallax instead of freezing the visual identity');

const sound=read('site-sound-control.js');
assert.ok(sound.includes('max="100" step="1" value="5"'),'Volume control must expose 0–100 with 5% default');
assert.ok(sound.includes('setPointerCapture'),'Touch scrubbing must retain pointer capture');
assert.ok(sound.includes('portfolio:site-audio-ready'),'Sound control must recover when audio initializes after it');

const page=read('security-research.html');
for(const id of ['vulnerability-lab','fuzzing-lab','linux-lab','ad-lab','container-lab','surface-lab']){
  assert.ok(page.includes('id="'+id+'"'),'Security Research missing '+id);
}
assert.ok(page.includes('explicit authorization'),'Security page must state an authorization boundary');
assert.ok(/do not scan the public internet/i.test(page),'Security page must state the browser does not scan public targets');

const lab=read('security-research.js');
for(const marker of ['virtualFiles','targetParser','linuxSample','adSample','containerSample','parseInventory']){
  assert.ok(lab.includes(marker),'Security tool implementation missing '+marker);
}
for(const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'RTCPeerConnection']){
  assert.ok(!lab.includes(forbidden),'Browser security lab must not contain network-capable primitive '+forbidden);
}
assert.ok(lab.includes('URL.createObjectURL'),'Security lab report export missing');
execFileSync(process.execPath,['--check',path.join(root,'security-research.js')],{stdio:'pipe'});

const deploy=read('tools/deploy_osu_live.py');
for(const file of ['security-research.html','security-research.css','security-research.js']){
  assert.ok(deploy.includes("'"+file+"'"),'OSU deploy verification missing '+file);
}

console.log('PASS global runtime + Security Research contract');
