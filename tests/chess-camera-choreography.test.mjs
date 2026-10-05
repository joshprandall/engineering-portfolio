import assert from 'node:assert/strict';
import {ARENA_THEME_LIGHTS,CAMERA_KIND_DISTANCE,CAMERA_ROLE_PROFILES,duelArenaLightingCue,duelArenaLightingProfile,duelCameraCue} from '../games/3d-battle-chess/combat-v8/camera-choreography.js';

assert.equal(Object.keys(CAMERA_ROLE_PROFILES).length,6);
assert.equal(Object.keys(CAMERA_KIND_DISTANCE).length,6);
assert.equal(Object.keys(ARENA_THEME_LIGHTS).length,5,'all premium factions need authored duel lighting');

const anticipate=duelCameraCue({
  time:.5,pose:{state:'anticipate',t:.75},contactAge:-1,role:'r',kind:'body',mobile:false,theme:'classic'
});
const commit=duelCameraCue({
  time:.8,pose:{state:'commit',t:.8},contactAge:-1,role:'r',kind:'body',mobile:false,theme:'classic'
});
const impact=duelCameraCue({
  time:1.0,pose:{state:'follow-through',t:.1},contactAge:.02,role:'r',kind:'body',mobile:false,theme:'classic'
});
const late=duelCameraCue({
  time:1.7,pose:{state:'recover',t:.8},contactAge:.72,role:'r',kind:'body',mobile:false,theme:'classic'
});

assert.equal(anticipate.shot,'anticipation');
assert(commit.phase>anticipate.phase,'commit should track closer than anticipation');
assert.equal(impact.shot,'impact');
assert(impact.impact>late.impact,'impact shake must decay during recovery');
assert.notDeepEqual(impact.position,late.position,'impact and recovery framing must differ');

const pawn=duelCameraCue({time:.8,pose:{state:'commit',t:.7},role:'p',kind:'melee'});
const queen=duelCameraCue({time:.8,pose:{state:'commit',t:.7},role:'q',kind:'melee'});
assert.notEqual(pawn.position[0],queen.position[0],'role lanes must produce distinct composition');

const desktop=duelCameraCue({time:.5,pose:{state:'commit',t:.5},role:'b',kind:'beam',mobile:false});
const mobile=duelCameraCue({time:.5,pose:{state:'commit',t:.5},role:'b',kind:'beam',mobile:true});
assert(mobile.position[2]>desktop.position[2],'mobile framing must stay farther back');

const cosmic=duelCameraCue({time:.5,pose:{state:'commit',t:.5},role:'k',kind:'area',theme:'cosmic'});
const monsters=duelCameraCue({time:.5,pose:{state:'commit',t:.5},role:'k',kind:'area',theme:'monsters'});
assert(cosmic.position[1]>monsters.position[1],'theme staging should preserve distinct vertical composition');

for(const role of Object.keys(CAMERA_ROLE_PROFILES)){
  for(const kind of Object.keys(CAMERA_KIND_DISTANCE)){
    const cue=duelCameraCue({time:.9,pose:{state:'commit',t:.6},role,kind});
    assert(cue.position.every(Number.isFinite));
    assert(cue.target.every(Number.isFinite));
    assert(cue.blend>=0&&cue.blend<=1);
  }
}

const lightSignatures=new Set(Object.entries(ARENA_THEME_LIGHTS).map(([theme,p])=>`${theme}:${p.keyColor}:${p.rimColor}:${p.floorGlow}`));
assert.equal(lightSignatures.size,5,'premium factions should retain distinct key/rim/floor light signatures');

const lightPawn=duelArenaLightingProfile('classic','p','melee');
const heavyRook=duelArenaLightingProfile('classic','r','body');
assert(heavyRook.keyBase>lightPawn.keyBase,'heavy rook combat should carry more key-light weight than a pawn');

const preImpact=duelArenaLightingCue({time:.9,pose:{state:'commit',attack:.9},contactAge:-1,theme:'arcane',role:'q',kind:'beam'});
const atImpact=duelArenaLightingCue({time:1.0,pose:{state:'follow-through',attack:1,follow:.25},contactAge:.01,theme:'arcane',role:'q',kind:'beam'});
const recovered=duelArenaLightingCue({time:1.8,pose:{state:'recover',attack:0,follow:0},contactAge:.9,theme:'arcane',role:'q',kind:'beam'});
assert(atImpact.keyIntensity>preImpact.keyIntensity,'contact should create a readable key-light impact pulse');
assert(atImpact.rimIntensity>preImpact.rimIntensity,'contact should create a stronger rim-light impact pulse');
assert(atImpact.ringEmissive>recovered.ringEmissive,'arena ring should flare at impact then settle');
assert(atImpact.floorEmissive>recovered.floorEmissive,'arena floor glow should pulse at contact then settle');
for(const value of [atImpact.keyIntensity,atImpact.rimIntensity,atImpact.ringEmissive,atImpact.ringScale,atImpact.floorEmissive])assert(Number.isFinite(value)&&value>0);

console.log('PASS Crown & Ash capture presentation: camera framing plus faction/role/impact-responsive duel lighting.');
