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
  const materials=new Map();
  for(const role of ['p','n','b','r','q','k']){
    const root=createV8Character({t:role,c:'w'},theme);
    root.traverse(node=>{
      const list=Array.isArray(node.material)?node.material:[node.material];
      for(const material of list.filter(Boolean))if(material.name?.startsWith(`crown-ash:${theme}:`))materials.set(material.name,material);
    });
  }
  for(const family of ['primary','secondary','armor','skin','glow']){
    const material=materials.get(`crown-ash:${theme}:${family}`);
    assert(material,`${theme} full runtime roster must exercise named ${family} material`);
    assert.equal(material.roughness,profile[family].rough);
    assert.equal(material.metalness,profile[family].metal);
  }
  // "dark" is an optional accent (for visors/underlayers); its profile is range-validated above
  // but a faction is not required to use that accent when its visual language does not call for it.
  assert.equal(materials.get(`crown-ash:${theme}:glow`).emissiveIntensity,profile.glow.intensity);
}

assert(materialProfileForTheme('cosmic').armor.metal>materialProfileForTheme('classic').armor.metal,'Cosmic armor should read more metallic than Classic');
assert(materialProfileForTheme('monsters').skin.rough>materialProfileForTheme('classic').skin.rough,'Monster skin should read more organic/matte than Classic skin');
assert(materialProfileForTheme('arcane').glow.intensity>materialProfileForTheme('classic').glow.intensity,'Arcane glow should read more emissive than Classic');
assert(materialProfileForTheme('brick').primary.rough<materialProfileForTheme('monsters').primary.rough,'Brick polymer should read smoother than Monster hide');
console.log('PASS Crown & Ash faction material language: distinct physically based response for all five factions.');
