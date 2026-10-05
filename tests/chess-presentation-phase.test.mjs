import assert from 'node:assert/strict';
import {choreographyIds,choreographyFingerprint} from '../games/3d-battle-chess/combat-v8/choreography.js';

const ids=choreographyIds();
assert.equal(ids.length,30,'premium roster should retain 30 authored motion sequences');
const fingerprints=ids.map(id=>choreographyFingerprint(id));
assert.equal(new Set(fingerprints).size,30,'premium roster motion sequences should remain distinct');
for(const signature of fingerprints)assert.equal(typeof signature,'string');
console.log('PASS Crown & Ash premium presentation: 30 distinct authored motion signatures.');
