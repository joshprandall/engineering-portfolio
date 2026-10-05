import assert from 'node:assert/strict';
import {CHARACTER_SETS,ROLE_ORDER,allCharacterDefinitions,getCharacterDefinition} from '../games/3d-battle-chess/combat-v8/character-definitions.js';
import {allAttacks,getAttack} from '../games/3d-battle-chess/combat-v8/attacks.js';
import {defensePose,defenseFingerprint} from '../games/3d-battle-chess/combat-v8/defense-choreography.js';
import {defeatPose,defeatFingerprint} from '../games/3d-battle-chess/combat-v8/defeat-choreography.js';

const attackKinds=new Set(allAttacks().map(attack=>attack.kind));
assert.deepEqual([...attackKinds].sort(),['area','beam','body','melee','projectile','teleport-melee']);

for(const role of ROLE_ORDER){
 const def=getCharacterDefinition('classic',role);
 const idle=defensePose(def,{attackKind:'melee',attackerPose:{state:'idle',t:1}});
 assert.equal(idle.defenseReadiness,0,`${role} should not hold a combat guard at idle`);
 const anticipating=defensePose(def,{attackKind:'melee',attackerPose:{state:'anticipate',t:.75}});
 assert(anticipating.defenseReadiness>.7,`${role} must visibly prepare before contact`);
 assert(anticipating.guard>0,`${role} must contribute a defensive guard pose`);
}

for(const kind of attackKinds){
 const signatures=ROLE_ORDER.map(role=>defenseFingerprint(getCharacterDefinition('classic',role),kind));
 assert.equal(new Set(signatures).size,ROLE_ORDER.length,`all six chess roles need distinct ${kind} defense silhouettes`);
}

const rookGuard=defensePose(getCharacterDefinition('classic','r'),{attackKind:'body',attackerPose:{state:'commit',t:.5}});
const queenGuard=defensePose(getCharacterDefinition('classic','q'),{attackKind:'body',attackerPose:{state:'commit',t:.5}});
assert(rookGuard.brace>queenGuard.brace,'rook should absorb an incoming body strike more squarely than queen');
assert(Math.abs(queenGuard.turn)>Math.abs(rookGuard.turn),'queen should evade/turn more than rook');

const definitions=allCharacterDefinitions();
const defeatFingerprints=definitions.map(def=>defeatFingerprint(def));
assert.equal(new Set(defeatFingerprints).size,definitions.length,'all 30 Full Edition characters need distinct defeat choreography fingerprints');

for(const def of definitions){
 const attack=getAttack(def.attack);
 assert(attack,`${def.id} must retain an attack definition`);
 const pose=defeatPose(def,{fall:true,stagger:1.05},.72);
 assert(pose.fall>0,`${def.id} defeat must enter a visible fall/collapse state`);
 assert(Number.isFinite(pose.turn)&&Number.isFinite(pose.torsoRoll),`${def.id} defeat pose must remain numerically stable`);
 assert.equal(pose.defeatStyle,def.defeat,`${def.id} must preserve its authored defeat identity`);
}

assert.equal(Object.keys(CHARACTER_SETS).length,5);
console.log('PASS Crown & Ash combat choreography: anticipatory defense and 30 distinct defeat signatures.');
