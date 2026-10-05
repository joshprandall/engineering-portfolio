export const BASIC_EDITION='basic';
export const FULL_EDITION='full';

const BASIC_CAPABILITIES=Object.freeze({
 edition:BASIC_EDITION,
 label:'Basic Edition',
 themes:Object.freeze(['classic']),
 animatedCombat:false,
 cinematicCaptures:false,
 premiumFactions:false,
 premiumAudio:false,
 livingBoardPresence:false,
 weightedLocomotion:false
});

const FULL_CAPABILITIES=Object.freeze({
 edition:FULL_EDITION,
 label:'Full Edition',
 themes:Object.freeze(['classic','arcane','monsters','brick','cosmic']),
 animatedCombat:true,
 cinematicCaptures:true,
 premiumFactions:true,
 premiumAudio:true,
 livingBoardPresence:true,
 weightedLocomotion:true
});

export function resolveEdition({desktop=false,edition='',protocol=''}={}){
 return desktop===true&&edition===FULL_EDITION&&protocol==='file:'?FULL_EDITION:BASIC_EDITION;
}

export function capabilitiesFor(edition){
 return edition===FULL_EDITION?FULL_CAPABILITIES:BASIC_CAPABILITIES;
}

export function currentEdition(scope=globalThis){
 return resolveEdition({
  desktop:scope?.crownAndAshDesktop?.desktop===true,
  edition:scope?.crownAndAshDesktop?.edition||'',
  protocol:scope?.location?.protocol||''
 });
}

export function currentCapabilities(scope=globalThis){
 return capabilitiesFor(currentEdition(scope));
}
