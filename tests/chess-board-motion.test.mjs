import assert from 'node:assert/strict';
import {animateBoardMove,applyBoardPresence,boardMotionProfile,sampleBoardMotion} from '../games/3d-battle-chess/board-motion.js';
import {capabilitiesFor,BASIC_EDITION,FULL_EDITION} from '../games/3d-battle-chess/edition.js';

assert.equal(capabilitiesFor(BASIC_EDITION).weightedLocomotion,false);
assert.equal(capabilitiesFor(BASIC_EDITION).livingBoardPresence,false);
assert.equal(capabilitiesFor(FULL_EDITION).weightedLocomotion,true);
assert.equal(capabilitiesFor(FULL_EDITION).livingBoardPresence,true);

const pawn=boardMotionProfile('p','disciplined');
const knight=boardMotionProfile('n','charging');
const rook=boardMotionProfile('r','ponderous');
const floatingQueen=boardMotionProfile('q','floating');
assert(knight.lift>pawn.lift,'knight must travel with a visibly larger vault');
assert(rook.duration>pawn.duration,'rook must feel heavier/slower than pawn');
assert(floatingQueen.steps<pawn.steps,'floating pieces should use less footfall motion');

const mid=sampleBoardMotion({from:{x:1,y:7},to:{x:2,y:5},profile:knight,t:.5});
assert(mid.y>0,'motion sample must leave the board plane mid-travel');
assert.notEqual(mid.x,1-3.5,'knight must make spatial progress');
assert.notEqual(mid.z,7-3.5,'knight must make spatial progress');

let time=0;
const root={
  position:{x:-2.5,y:.13,z:3.5},
  rotation:{y:0},
  userData:{piece:true,role:'n',x:1,y:7,side:'w'},
  scale:{x:.6,y:.6,z:.6,setScalar(v){this.x=this.y=this.z=v;}},
  dispatchEvent(){}
};
await animateBoardMove({
  root,from:{x:1,y:7},to:{x:2,y:5},role:'n',locomotion:'charging',
  clock:()=>time,
  requestFrame:callback=>{time+=100;queueMicrotask(()=>callback(time));}
});
assert.equal(root.position.x,-1.5);
assert.equal(root.position.z,1.5);
assert.equal(root.position.y,.13);
assert.equal(root.rotation.y,0);

const group={children:[root]};
applyBoardPresence(group,{time:1,selected:{x:1,y:7},turn:'w'});
assert(root.position.y>.13,'selected Full Edition piece must gain visible board presence');
assert(root.scale.x>.6,'selected Full Edition piece must scale subtly for presence');
applyBoardPresence(group,{time:99,selected:null,turn:'w',reducedMotion:true});
assert.equal(root.position.y,.13,'reduced motion must remove idle bob');
assert.equal(root.scale.x,.6,'reduced motion must restore base scale');

console.log('PASS Crown & Ash Full Edition weighted locomotion + living board presence.');
