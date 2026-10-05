import assert from 'node:assert/strict';
import {allAttacks} from '../games/3d-battle-chess/combat-v8/attacks.js';
import {choreographyIds,choreographyPose,choreographyFingerprint} from '../games/3d-battle-chess/combat-v8/choreography.js';

const attacks=allAttacks();
const attackIds=attacks.map(a=>a.id).sort();
const choreography=choreographyIds().sort();
assert.deepEqual(choreography,attackIds,'every premium attack must have authored choreography');

const fields=['lean','turn','head','guard','weapon','torsoRoll','rightX','rightZ','leftX','leftZ','stepBias','rootSway','pelvisRoll','weaponRoll','rightElbow','leftElbow','leftLegX','rightLegX','leftKnee','rightKnee'];
const vec=pose=>fields.map(k=>Number(pose[k]||0));
const motionNorm=pose=>fields.filter(k=>k!=='guard').reduce((sum,k)=>sum+Math.abs(Number(pose[k]||0)),0);
const phase=(state,extra={})=>({state,t:.8,windup:0,attack:1,follow:0,recover:0,recoil:.2,rootDrive:.4,...extra});

const fingerprints=new Map();
for(const id of attackIds){
 const anticipation=choreographyPose(id,phase('anticipate',{t:.82,windup:.82,attack:0}));
 const commit=choreographyPose(id,phase('commit',{t:.82,attack:.82}));
 const follow=choreographyPose(id,phase('follow-through',{t:.82,follow:.82}));
 const recover=choreographyPose(id,phase('recover',{t:1,recover:1}));

 for(const [name,pose] of Object.entries({anticipation,commit,follow,recover})){
  for(const [i,value] of vec(pose).entries())assert(Number.isFinite(value),`${id} ${name} field ${fields[i]} must stay finite`);
  assert(Math.abs(pose.turn||0)<=10,`${id} ${name} turn escaped safe choreography bounds`);
  assert(Math.abs(pose.lean||0)<=1.5,`${id} ${name} lean escaped safe choreography bounds`);
  assert((pose.guard||0)>=0&& (pose.guard||0)<=1.5,`${id} ${name} guard escaped safe choreography bounds`);
 }
 assert.notDeepEqual(vec(anticipation),vec(commit),`${id} must visibly transition from anticipation to commit`);
 assert.notDeepEqual(vec(commit),vec(follow),`${id} must have authored follow-through rather than freezing at contact`);
 assert.notDeepEqual(vec(follow),vec(recover),`${id} must visibly recover from follow-through`);
 assert(motionNorm(recover)<motionNorm(follow),`${id} recovery must settle motion after follow-through`);

 const fp=choreographyFingerprint(id);
 assert(!fingerprints.has(fp),`${id} duplicates choreography fingerprint of ${fingerprints.get(fp)}`);
 fingerprints.set(fp,id);
}

assert.equal(fingerprints.size,30,'premium roster must keep 30 distinct attack motion fingerprints');
console.log('PASS Crown & Ash attack follow-through: 30 authored attacks anticipate, commit, follow through and recover with bounded distinct motion.');
