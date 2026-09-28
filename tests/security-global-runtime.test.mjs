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
assert.match(home,/href="security-research.html"[^>]*aria-label="Security Research"/,'Security Research planet must link to its page');

const solar=read('solar-navigation.js');
assert.match(solar,/{rx:285,ry:158,count:4,offset:.52}/,'Portfolio solar outer ring must allocate four destinations');
assert.match(solar,/"Security Research":s*[/,'Security Research solar descriptor missing');

const audio=read('site-audio.js');
assert.match(audio,/const DEFAULT_BACKGROUND_VOLUME = 0.05/,'Ambient audio must default to 5%');
assert.match(audio,/const MAX_BACKGROUND_VOLUME = 1.00/,'Ambient audio must permit 0–100% user adjustment');
assert.match(audio,/ISOLATED_RE/,'Audio isolation boundary missing');
assert.doesNotMatch(audio,/MAIN_PAGE/,'Ambient audio must not be restricted to Home/Learn');
assert.doesNotMatch(audio,/project-[^/]+\.html/,'Normal project detail pages must not be globally suppressed');

const theme=read('site-theme.js');
for(const file of ['site-scenes.js','site-audio.js','site-navigation.js','site-sound-control.js'])assert.ok(theme.includes("loadScript('"+file+"')"),'Shared runtime bootstrap missing '+file);
assert.match(theme,/header.site-global-header, header #menu, header #mobile-menu/,'Shared runtime bootstrap must be scoped to shared-shell pages');
assert.match(theme,/SITE_BASE/,'Shared runtime bootstrap must resolve from the theme script base');

const responsive=read('site-responsive.css');
assert.match(responsive,/--nav-menu-solid/,'Solid hamburger menu token missing');
assert.match(responsive,/site-global-header #primary-nav[sS]*background:var(--nav-menu-solid)!important/,'Hamburger menu must be opaque');
assert.match(responsive,/backdrop-filter:none!important/,'Hamburger menu must not use translucent backdrop filtering');

const scenes=read('site-scenes.js');
assert.match(scenes,/const ROTATE_AFTER = 28/,'Light scenes must rotate on the approved cadence');
assert.ok(scenes.indexOf("id: 'forest-waterfall'")<scenes.indexOf("id: 'forest-river'")&&scenes.indexOf("id: 'forest-river'")<scenes.indexOf("id: 'birds-water'"),'Light scene order must be waterfall → river → beach');
assert.match(scenes,/twinkle: random() < .40/,'Night stars must include an independent twinkling subset');
assert.match(scenes,/Math.sin(time / 18) * 12.0/,'Night scene must retain subtle bounded drift');

const sound=read('site-sound-control.js');
assert.match(sound,/max="100" step="1" value="5"/,'Volume control must expose 0–100 with 5% default');
assert.match(sound,/setPointerCapture/,'Touch scrubbing must retain pointer capture');

const page=read('security-research.html');
for(const id of ['vulnerability-lab','fuzzing-lab','linux-lab','ad-lab','container-lab','surface-lab'])assert.match(page,new RegExp('id="'+id+'"'),'Security Research missing '+id);
assert.match(page,/explicit authorization/,'Security page must state an authorization boundary');
assert.match(page,/do not scan the public internet/i,'Security page must state the browser does not scan public targets');

const lab=read('security-research.js');
for(const marker of ['virtualFiles','targetParser','linuxSample','adSample','containerSample','parseInventory'])assert.ok(lab.includes(marker),'Security tool implementation missing '+marker);
for(const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'RTCPeerConnection'])assert.ok(!lab.includes(forbidden),'Browser security lab must not contain network-capable primitive '+forbidden);
assert.match(lab,/URL.createObjectURL/,'Security lab report export missing');
execFileSync(process.execPath,['--check',path.join(root,'security-research.js')],{stdio:'pipe'});

const deploy=read('tools/deploy_osu_live.py');
for(const file of ['security-research.html','security-research.css','security-research.js'])assert.ok(deploy.includes("'"+file+"'"),'OSU deploy verification missing '+file);

console.log('PASS global runtime + Security Research contract');
