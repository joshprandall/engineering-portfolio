import assert from 'node:assert/strict';
import {CHARACTER_SETS,ROLE_ORDER,allCharacterDefinitions,getCharacterDefinition} from '../games/3d-battle-chess/combat-v8/character-definitions.js';
import {visualRecipeIds} from '../games/3d-battle-chess/combat-v8/character-visuals.js';

const expectedThemes=['arcane','brick','classic','cosmic','monsters'];
const expectedRoles=['p','n','b','r','q','k'];

assert.deepEqual([...ROLE_ORDER],expectedRoles,'Chess role contract changed unexpectedly');
assert.deepEqual(Object.keys(CHARACTER_SETS).sort(),expectedThemes,'Crown & Ash must retain the five approved armies');

const definitions=allCharacterDefinitions();
assert.equal(definitions.length,30,'Crown & Ash must expose exactly 30 faction/role definitions');

const definitionIds=definitions.map(def=>def.id);
assert.equal(new Set(definitionIds).size,30,'Every Crown & Ash character definition must have a unique id');

for(const theme of expectedThemes){
  const silhouettes=new Set();
  for(const role of expectedRoles){
    const def=getCharacterDefinition(theme,role);
    assert.equal(def.theme,theme,`${theme}/${role} must resolve to its own army`);
    assert.equal(def.role,role,`${theme}/${role} must resolve to its own chess role`);
    assert.equal(def.id,`${theme}-${role}`);
    for(const field of ['name','rig','attack','locomotion','silhouette','weapon','defeat']){
      assert.equal(typeof def[field],'string',`${def.id} missing ${field}`);
      assert(def[field].trim().length>0,`${def.id} has an empty ${field}`);
    }
    assert(Number.isFinite(def.mass)&&def.mass>0,`${def.id} must have a positive mass cue`);
    silhouettes.add(def.silhouette);
  }
  assert.equal(silhouettes.size,6,`${theme} must preserve six distinct role silhouettes`);
}

const recipes=visualRecipeIds();
assert.equal(recipes.length,30,'Crown & Ash must expose exactly 30 visual recipes');
assert.equal(new Set(recipes).size,30,'Every Crown & Ash visual recipe id must be unique');
assert.deepEqual([...recipes].sort(),[...definitionIds].sort(),'Every character definition must have exactly one matching visual recipe');

console.log('PASS Crown & Ash roster integrity: five armies, 30 unique roles, complete visual recipe coverage.');
