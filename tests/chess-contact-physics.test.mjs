import assert from 'node:assert/strict';
import {body,applyImpulse,integrate} from '../games/3d-battle-chess/combat-v8/physics.js';

function simulate(mass,impulse,seconds=4,dt=1/120){
  const b=body({mass,bounce:.10,drag:4});
  applyImpulse(b,impulse);
  let peak=b.y,airborneFrames=0,landedAt=null;
  const frames=Math.ceil(seconds/dt);
  for(let i=0;i<frames;i++){
    integrate(b,dt,0);
    peak=Math.max(peak,b.y);
    if(!b.grounded)airborneFrames++;
    if(landedAt===null&&i>0&&b.grounded&&Math.abs(b.y)<1e-9)landedAt=i*dt;
  }
  return {body:b,peak,airborneFrames,landedAt};
}

const lifted=body({mass:1,bounce:.10});
assert.equal(lifted.grounded,true);
applyImpulse(lifted,{x:.4,y:2.2,z:.1});
assert.equal(lifted.grounded,false,'upward contact impulse must make a grounded defender airborne');

const light=simulate(.8,{x:1.2,y:2.4,z:.25});
assert(light.peak>.08,'light defender must visibly lift from an upward strike');
assert(light.airborneFrames>1,'light defender must remain airborne for multiple simulation steps');
assert(light.landedAt!==null&&light.landedAt<4,'light defender must return to the floor under gravity');
assert.equal(light.body.grounded,true);
assert.equal(light.body.y,0);

const heavy=simulate(2.6,{x:1.2,y:2.4,z:.25});
assert(heavy.peak<light.peak,'heavy defender must lift less than a light defender from the same impulse');
assert(heavy.landedAt!==null&&heavy.landedAt<4,'heavy defender must also settle back to the floor');

const shove=body({mass:1});
applyImpulse(shove,{x:1.5,y:0,z:0});
assert.equal(shove.grounded,true,'pure horizontal shove should not invent airborne state');
for(let i=0;i<240;i++)integrate(shove,1/120,0);
assert.equal(shove.y,0);
assert.equal(shove.grounded,true);

console.log('PASS Crown & Ash impact physics: upward contact leaves ground, gravity restores landing, and mass preserves weight.');
