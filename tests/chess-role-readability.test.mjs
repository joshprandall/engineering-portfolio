import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createV8Character} from '../games/3d-battle-chess/combat-v8/character-factory.js';
import {CHARACTER_SETS,ROLE_ORDER} from '../games/3d-battle-chess/combat-v8/character-definitions.js';
import {roleCueName} from '../games/3d-battle-chess/combat-v8/character-visuals.js';

const signatures=new Set();
for(const theme of Object.keys(CHARACTER_SETS)){
  const dimensional=new Set();
  for(const role of ROLE_ORDER){
    const root=createV8Character({t:role,c:'w'},theme);
    root.updateMatrixWorld(true);

    const expected=roleCueName(role);
    assert(expected,`role ${role} must have an explicit visual cue`);
    assert.equal(root.userData.roleCue,expected,`${theme}-${role} must expose the expected role cue`);
    assert.equal(root.userData.visualSignature,`${theme}-${role}`);

    const box=new THREE.Box3().setFromObject(root);
    const size=box.getSize(new THREE.Vector3());
    assert(size.x>.2&&size.y>.6&&size.z>.2,`${theme}-${role} must render a substantial 3D silhouette`);
    dimensional.add([size.x,size.y,size.z].map(v=>v.toFixed(2)).join(':'));
    signatures.add(root.userData.visualSignature);
  }
  assert(dimensional.size>=5,`${theme} must preserve strongly differentiated role silhouettes`);
}
assert.equal(signatures.size,30,'all five factions × six roles must retain unique visual signatures');
assert.deepEqual(ROLE_ORDER.map(role=>roleCueName(role)),[
  'shield-disc','high-crest','split-halo','battlement','wide-diadem','tall-crown'
]);
console.log('PASS Crown & Ash role readability: 30 unique characters with six explicit geometry-based chess role cues.');
