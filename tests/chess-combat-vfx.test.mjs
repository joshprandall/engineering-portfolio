import assert from 'node:assert/strict';
import {allCharacterDefinitions} from '../games/3d-battle-chess/combat-v8/character-definitions.js';
import {effectProfile,effectProfileIds,impactEnvelope} from '../games/3d-battle-chess/combat-v8/effects.js';

const definitions=allCharacterDefinitions();
const expectedIds=definitions.map(def=>def.attack).sort();
const profileIds=effectProfileIds().sort();

assert.equal(profileIds.length,30,'Full Edition must retain 30 authored combat VFX profiles');
assert.deepEqual(profileIds,expectedIds,'Every authored character attack must have a matching VFX profile');

for(const id of profileIds){
 const profile=effectProfile(id);
 assert(Number.isFinite(profile.scale)&&profile.scale>0,`${id} must have a positive impact scale`);
 assert(profile.impact||profile.trail||profile.projectile||profile.beam||profile.area,`${id} must declare a visible VFX identity`);
 const start=impactEnvelope(profile,0);
 const mid=impactEnvelope(profile,.35);
 const late=impactEnvelope(profile,1.2);
 assert.equal(start.flashVisible,true,`${id} impact flash must begin visible`);
 assert.equal(start.ringVisible,true,`${id} shockwave must begin visible`);
 assert(mid.ringScale>start.ringScale,`${id} shockwave must expand after contact`);
 assert(mid.ringOpacity<start.ringOpacity,`${id} shockwave must fade after contact`);
 assert.equal(late.ringVisible,false,`${id} shockwave must cleanly expire`);
 assert.equal(late.groundVisible,false,`${id} ground pulse must cleanly expire`);
}

const light=impactEnvelope(effectProfile('classic-p-shield-thrust'),.25);
const heavy=impactEnvelope(effectProfile('classic-r-hammer-bash'),.25);
assert(heavy.ringScale>light.ringScale,'heavy captures should read with a larger shockwave than light captures');

console.log('PASS Crown & Ash VFX: 30 attack profiles drive expanding/fading impact shockwaves and ground pulses.');
