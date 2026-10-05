import assert from 'node:assert/strict';
import {applyFactionLighting,lightingProfileForTheme} from '../games/3d-battle-chess/environment-lighting.js';

const themes=['classic','arcane','monsters','brick','cosmic'];
const signatures=new Set();

for(const theme of themes){
  const profile=lightingProfileForTheme(theme);
  assert(profile,theme+' must define a lighting profile');
  assert(profile.exposure>=.70&&profile.exposure<=1.05,theme+' exposure must stay in a conservative filmic range');
  assert(profile.fogNear>0&&profile.fogFar>profile.fogNear,theme+' fog range must be valid');
  for(const lane of ['key','rim','fill']){
    assert(profile[lane].intensity>=0&&profile[lane].intensity<=2.5,theme+' '+lane+' intensity must remain bounded');
    assert.equal(profile[lane].position.length,3,theme+' '+lane+' must define a 3D position');
  }
  signatures.add(JSON.stringify([
    profile.hemisphere.sky,profile.hemisphere.ground,profile.hemisphere.intensity,
    profile.key.color,profile.key.intensity,
    profile.rim.color,profile.rim.intensity,
    profile.fill.color,profile.fill.intensity,
    profile.exposure,profile.fogNear,profile.fogFar
  ]));
}
assert.equal(signatures.size,themes.length,'all five Full Edition factions must have distinct environment-light signatures');

const color=()=>({value:null,setHex(value){this.value=value;}});
const position=()=>({value:null,set(...value){this.value=value;}});
const rig=()=>({
  renderer:{toneMappingExposure:0},
  hemisphere:{color:color(),groundColor:color(),intensity:0},
  key:{color:color(),intensity:0,position:position()},
  rim:{color:color(),intensity:0,position:position()},
  fill:{color:color(),intensity:0,position:position()},
  fog:{near:0,far:0}
});

const full=rig();
const cosmic=applyFactionLighting({theme:'cosmic',fullEdition:true,...full});
assert.equal(full.rim.color.value,cosmic.rim.color,'Full Edition must apply the selected faction rim light');
assert.equal(full.renderer.toneMappingExposure,cosmic.exposure,'Full Edition must apply faction exposure');

const basic=rig();
const gated=applyFactionLighting({theme:'cosmic',fullEdition:false,...basic});
const classic=lightingProfileForTheme('classic');
assert.strictEqual(gated,classic,'Basic Edition must be hard-gated to the Classic lighting profile');
assert.equal(basic.rim.color.value,classic.rim.color,'Basic Edition must not activate premium faction lighting');
assert.equal(basic.renderer.toneMappingExposure,classic.exposure,'Basic Edition exposure must remain Classic');

assert(lightingProfileForTheme('arcane').rim.intensity>lightingProfileForTheme('classic').rim.intensity,'Arcane should carry a stronger magical rim');
assert(lightingProfileForTheme('monsters').exposure<lightingProfileForTheme('classic').exposure,'Monsters should stage a moodier scene');
assert(lightingProfileForTheme('brick').fill.intensity>lightingProfileForTheme('classic').fill.intensity,'Brick should read brighter and cleaner');
assert.notEqual(lightingProfileForTheme('cosmic').rim.color,lightingProfileForTheme('arcane').rim.color,'Cosmic and Arcane should not collapse to the same rim language');

console.log('PASS Crown & Ash faction lighting: five distinct bounded rigs with Basic Edition premium gating.');
