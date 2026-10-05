import assert from 'node:assert/strict';
import {choreographyIds,choreographyPose,choreographyFingerprint} from '../games/3d-battle-chess/combat-v8/choreography.js';

const ids=choreographyIds();
assert.equal(ids.length,30,'premium roster should retain 30 authored motion sequences');
const fingerprints=new Set(ids.map(id=>choreographyFingerprint(id)));
assert.equal(fingerprints.size,30,'premium roster motion signatures should remain distinct');

const fields=['lean','turn','head','guard','torsoRoll','rightX','rightZ','leftX','leftZ','stepBias','rootSway','pelvisRoll','weaponRoll','rightElbow','leftElbow','leftLegX','rightLegX','leftKnee','rightKnee'];
const vector=pose=>fields.map(key=>Number(pose[key]||0));
const magnitude=pose=>fields.filter(key=>key!=='guard').reduce((sum,key)=>sum+Math.abs(Number(pose[key]||0)),0);
for(const id of ids){
 const follow=choreographyPose(id,{state:'follow-through',t:.82,windup:0,attack:1,follow:.82,recover:0,recoil:.2,rootDrive:.4});
 const recover=choreographyPose(id,{state:'recover',t:1,windup:0,attack:1,follow:0,recover:1,recoil:.2,rootDrive:.4});
 for(const pose of [follow,recover])for(const value of vector(pose))assert(Number.isFinite(value),id+' motion values must remain finite');
 assert.notDeepEqual(vector(follow),vector(recover),id+' should visibly settle after follow-through');
 assert(magnitude(recover)<magnitude(follow),id+' recovery should reduce residual motion');
}
console.log('PASS Crown & Ash premium presentation: 30 distinct motion sequences follow through and settle cleanly.');
