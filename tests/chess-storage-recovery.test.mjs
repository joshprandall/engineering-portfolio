import assert from 'node:assert/strict';

const values=new Map();
global.window={localStorage:{
 getItem:key=>values.get(key)??null,
 setItem:(key,value)=>values.set(key,value),
 removeItem:key=>values.delete(key)
}};

const storage=await import(`../games/3d-battle-chess/game-storage.js?recovery=${Date.now()}`);
const SETTINGS_KEY='crown-and-ash.settings.v1';
const MATCH_KEY='crown-and-ash.match.v1';

values.set(SETTINGS_KEY,'{broken json');
assert.deepEqual(storage.loadSettings(),storage.DEFAULT_SETTINGS,'Broken settings JSON must fall back to defaults.');

values.set(MATCH_KEY,JSON.stringify({version:1,settings:{theme:'cosmic'},game:{version:2,moves:[{from:'e2',to:'e9'}]}}));
assert.equal(storage.loadSavedMatch(),null,'Malformed move coordinates must reject the saved match.');
assert.equal(values.has(MATCH_KEY),false,'Rejected structured save data must be removed so Continue is not offered forever.');

values.set(MATCH_KEY,JSON.stringify({version:1,settings:{theme:'classic'},game:{version:2,moves:Array.from({length:1001},()=>({from:'e2',to:'e4'}))}}));
assert.equal(storage.loadSavedMatch(),null,'Unreasonably long saved games must be rejected.');
assert.equal(values.has(MATCH_KEY),false,'Oversized rejected saves must be removed.');

const good={version:1,savedAt:'2026-10-04T00:00:00.000Z',flipped:true,settings:{mode:'local',theme:'arcane',difficulty:'3',view:'2d',sound:false,quality:'high',animatedCombat:false},game:{version:2,originFEN:null,moves:[{from:'e2',to:'e4',promotion:null}]}};
values.set(MATCH_KEY,JSON.stringify(good));
const loaded=storage.loadSavedMatch();
assert(loaded,'Valid saved match should remain available.');
assert.equal(loaded.settings.theme,'arcane');
assert.equal(loaded.flipped,true);
assert.equal(values.has(MATCH_KEY),true,'Valid save must not be deleted.');

delete global.window;
console.log('PASS Crown & Ash storage recovery: malformed structured saves are rejected and purged while valid saves remain available.');
