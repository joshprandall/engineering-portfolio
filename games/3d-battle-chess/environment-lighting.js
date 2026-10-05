const PROFILES=Object.freeze({
  classic:Object.freeze({
    hemisphere:Object.freeze({sky:0xdcecf8,ground:0x718397,intensity:1.15}),
    key:Object.freeze({color:0xffedd3,intensity:2.0,position:Object.freeze([6,12,5])}),
    rim:Object.freeze({color:0xb2ecff,intensity:1.15,position:Object.freeze([-5,8,-7])}),
    fill:Object.freeze({color:0xffffff,intensity:.40,position:Object.freeze([-6,4,6])}),
    exposure:.84,fogNear:15,fogFar:35
  }),
  arcane:Object.freeze({
    hemisphere:Object.freeze({sky:0xd8e7ff,ground:0x352d55,intensity:1.10}),
    key:Object.freeze({color:0x9bdcff,intensity:1.90,position:Object.freeze([5,11,6])}),
    rim:Object.freeze({color:0xb88cff,intensity:1.45,position:Object.freeze([-6,7,-6])}),
    fill:Object.freeze({color:0xffd6ff,intensity:.38,position:Object.freeze([-5,4,7])}),
    exposure:.88,fogNear:14.5,fogFar:33
  }),
  monsters:Object.freeze({
    hemisphere:Object.freeze({sky:0xd7e8c6,ground:0x3b4630,intensity:1.00}),
    key:Object.freeze({color:0xffc46b,intensity:1.85,position:Object.freeze([4.5,11,5])}),
    rim:Object.freeze({color:0x8fd19e,intensity:1.00,position:Object.freeze([-6,6.5,-6])}),
    fill:Object.freeze({color:0xffead1,intensity:.32,position:Object.freeze([-5,3.5,6])}),
    exposure:.80,fogNear:13.5,fogFar:30
  }),
  brick:Object.freeze({
    hemisphere:Object.freeze({sky:0xe9f3ff,ground:0x65758b,intensity:1.20}),
    key:Object.freeze({color:0xfff1cf,intensity:2.10,position:Object.freeze([6,12,4])}),
    rim:Object.freeze({color:0x7dd3fc,intensity:1.20,position:Object.freeze([-5,8,-7])}),
    fill:Object.freeze({color:0xffffff,intensity:.48,position:Object.freeze([-6,4.5,6])}),
    exposure:.90,fogNear:16,fogFar:36
  }),
  cosmic:Object.freeze({
    hemisphere:Object.freeze({sky:0xbfd7ff,ground:0x252b4c,intensity:1.00}),
    key:Object.freeze({color:0xb7d5ff,intensity:1.85,position:Object.freeze([5.5,11.5,5])}),
    rim:Object.freeze({color:0xff7ad9,intensity:1.55,position:Object.freeze([-6,7.5,-7])}),
    fill:Object.freeze({color:0x9be7ff,intensity:.34,position:Object.freeze([-5.5,4,6.5])}),
    exposure:.86,fogNear:14,fogFar:32
  })
});

export function lightingProfileForTheme(theme){
  return PROFILES[theme]||PROFILES.classic;
}

function applyDirectional(light,profile){
  if(!light||!profile)return;
  light.color?.setHex(profile.color);
  light.intensity=profile.intensity;
  light.position?.set(...profile.position);
}

export function applyFactionLighting({theme='classic',fullEdition=true,renderer,hemisphere,key,rim,fill,fog}={}){
  const profile=lightingProfileForTheme(fullEdition?theme:'classic');
  if(hemisphere){
    hemisphere.color?.setHex(profile.hemisphere.sky);
    hemisphere.groundColor?.setHex(profile.hemisphere.ground);
    hemisphere.intensity=profile.hemisphere.intensity;
  }
  applyDirectional(key,profile.key);
  applyDirectional(rim,profile.rim);
  applyDirectional(fill,profile.fill);
  if(renderer)renderer.toneMappingExposure=profile.exposure;
  if(fog){fog.near=profile.fogNear;fog.far=profile.fogFar;}
  return profile;
}
