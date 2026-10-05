import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ChessGame} from '../games/3d-battle-chess/engine.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const gameRoot=path.join(root,'games/3d-battle-chess');
const html=fs.readFileSync(path.join(gameRoot,'index.html'),'utf8');
assert.match(html,/"three":"\.\/vendor\/three\/three\.module\.js"/,'3D runtime must use the bundled Three.js module');
assert.doesNotMatch(html,/cdn\.jsdelivr\.net|unpkg\.com/,'Core game startup must not depend on a CDN');
assert.match(html,/CindrVault/,'Release shell must identify the CindrVault label');
assert.match(html,/Roughneck Forge/,'Release shell must identify Roughneck Forge');
assert.doesNotMatch(html,/joshua-randall-headshot/,'Product metadata must not use a personal headshot as Crown & Ash artwork');
for(const relative of ['vendor/three/three.module.js','vendor/three/three.core.js','vendor/three/addons/controls/OrbitControls.js','vendor/three/LICENSE'])assert(fs.statSync(path.join(gameRoot,relative)).size>0,`${relative} must be bundled`);
for(const id of ['continueGameBtn','setupQuality','setupCombat','saveGame','copyFen','downloadPgn','loadFen','gameOver'])assert.match(html,new RegExp(`id="${id}"`),`${id} must exist`);
const desktopRoot=path.join(root,'products/crown-and-ash-desktop'),desktopPackage=JSON.parse(fs.readFileSync(path.join(desktopRoot,'package.json'),'utf8')),desktopMain=fs.readFileSync(path.join(desktopRoot,'main.cjs'),'utf8');
assert.equal(desktopPackage.build.appId,'com.roughneckgames.crownandash');assert.equal(desktopPackage.build.win.target[0].target,'nsis');assert.match(desktopMain,/contextIsolation:true/);assert.match(desktopMain,/nodeIntegration:false/);assert.match(desktopMain,/sandbox:true/);assert.match(desktopMain,/setWindowOpenHandler/);

const values=new Map();
global.window={localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}};
const storage=await import(`../games/3d-battle-chess/game-storage.js?test=${Date.now()}`);
assert.deepEqual(storage.loadSettings(),storage.DEFAULT_SETTINGS);
const configured=storage.saveSettings({mode:'local',theme:'cosmic',difficulty:'3',view:'2d',sound:false,quality:'high',animatedCombat:false,unexpected:'ignored'});
assert.equal(configured.theme,'cosmic');assert.equal(configured.quality,'high');assert.equal(configured.unexpected,undefined);
assert.deepEqual(storage.loadSettings(),configured);
const game=new ChessGame();game.move(4,6,4,4);const saved=storage.saveMatch({game,settings:configured,flipped:true});
assert(saved);assert.equal(storage.loadSavedMatch().game.moves[0].from,'e2');assert.match(storage.savedMatchSummary(),/1 turn/);assert(storage.clearSavedMatch());assert.equal(storage.loadSavedMatch(),null);
delete global.window;

console.log('PASS Crown & Ash productization: local 3D dependency, persistent settings/save contract, match tools, result UI and isolated Windows desktop scaffold.');
