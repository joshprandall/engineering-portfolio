import assert from 'node:assert/strict';
import {createV8Character,materialProfileForTheme} from '../games/3d-battle-chess/combat-v8/character-factory.js';

const themes=['classic','arcane','monsters','brick','cosmic'];
for(const theme of themes){
  const profile=materialProfileForTheme(theme);
  for(const family of ['primary','secondary','armor','skin','glow','dark']){
    assert(profile[family],`${theme} must define ${family} material response`);
    assert(profile[family].rough>=0&&profile[family].rough<=1,`${theme} ${family} roughness in range`);
    assert(profile[family].metal>=0&&profile[family].metal<=1,`${theme} ${family} metalness in range`);
  }
  const root=createV8Character({t:'q',c:'w'},theme);
  const materials=new Map();
  root.traverse(node=>{
    const list=Array.isArray(node.material)?node.material:[node.material];
    for(const material of list.filter(Boolean))if(material.name?.startsWith(`crown-ash:${theme}:`))materials.set(material.name,material);
  });
  for(const family of ['primary','secondary','armor','skin','glow','dark']){
    const material=materials.get(`crown-ash:${theme}:${family}`);
    assert(material,`${theme} runtime character must carry named ${family} material`);
    assert.equal(material.roughness,profile[family].rough);
    assert.equal(material.metalness,profile[family].metal);
  }
  assert.equal(materials.get(`crown-ash:${theme}:glow`).emissiveIntensity,profile.glow.intensity);
}

assert(materialProfileForTheme('cosmic').armor.metal>materialProfileForTheme('classic').armor.metal,'Cosmic armor should read more metallic than Classic');
assert(materialProfileForTheme('monsters').skin.rough>materialProfileForTheme('classic').skin.rough,'Monster skin should read more organic/matte than Classic skin');
assert(materialProfileForTheme('arcane').glow.intensity>materialProfileForTheme('classic').glow.intensity,'Arcane glow should read more emissive than Classic');
assert(materialProfileForTheme('brick').primary.rough<materialProfileForTheme('monsters').primary.rough,'Brick polymer should read smoother than Monster hide');
console.log('PASS Crown & Ash faction material language: distinct physically based response for all five factions.');
