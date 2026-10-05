import assert from 'node:assert/strict';
import {applyBoardPresence} from '../games/3d-battle-chess/board-presence.js';

const scale={x:.6,y:.6,z:.6,setScalar(v){this.x=this.y=this.z=v;}};
const knight={userData:{piece:true,role:'n',x:1,y:7,side:'w'},position:{y:.13},rotation:{},scale};
const group={children:[knight]};
assert.equal(applyBoardPresence(group,{time:1,turn:'w'}),1);
const idle=knight.position.y;
applyBoardPresence(group,{time:1,turn:'w',selected:{x:1,y:7}});
assert.ok(knight.position.y>idle);
assert.ok(knight.scale.x>.6);
applyBoardPresence(group,{time:99,turn:'w',reducedMotion:true});
assert.equal(knight.position.y,.13);
assert.equal(knight.scale.x,.6);
console.log('PASS Crown & Ash Full Edition living board presence.');
