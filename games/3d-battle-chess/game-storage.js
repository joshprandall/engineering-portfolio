const SETTINGS_KEY='crown-and-ash.settings.v1';
const MATCH_KEY='crown-and-ash.match.v1';

export const DEFAULT_SETTINGS=Object.freeze({
 mode:'ai',
 theme:'classic',
 difficulty:'2',
 view:'3d',
 sound:true,
 quality:'auto',
 animatedCombat:true
});

const choices={
 mode:new Set(['ai','local']),
 theme:new Set(['classic','arcane','monsters','brick','cosmic']),
 difficulty:new Set(['1','2','3']),
 view:new Set(['2d','3d']),
 quality:new Set(['auto','performance','high'])
};

function storage(){
 try{return window.localStorage}catch{return null}
}

function read(key){
 try{const value=storage()?.getItem(key);return value?JSON.parse(value):null}catch{return null}
}

function write(key,value){
 try{storage()?.setItem(key,JSON.stringify(value));return true}catch{return false}
}

export function normalizeSettings(value={}){
 const next={...DEFAULT_SETTINGS};
 for(const key of Object.keys(choices))if(choices[key].has(String(value[key])))next[key]=String(value[key]);
 if(typeof value.sound==='boolean')next.sound=value.sound;
 if(typeof value.animatedCombat==='boolean')next.animatedCombat=value.animatedCombat;
 return next;
}

export function loadSettings(){return normalizeSettings(read(SETTINGS_KEY)||{})}
export function saveSettings(value){const next=normalizeSettings(value);write(SETTINGS_KEY,next);return next}

export function loadSavedMatch(){
 const saved=read(MATCH_KEY);
 if(!saved||saved.version!==1||!saved.game||!saved.settings)return null;
 return {...saved,settings:normalizeSettings(saved.settings)};
}

export function saveMatch({game,settings,flipped=false}){
 const saved={version:1,savedAt:new Date().toISOString(),game:game.exportRecord(),settings:normalizeSettings(settings),flipped:!!flipped};
 return write(MATCH_KEY,saved)?saved:null;
}

export function clearSavedMatch(){
 try{storage()?.removeItem(MATCH_KEY);return true}catch{return false}
}

export function savedMatchSummary(saved=loadSavedMatch()){
 if(!saved)return null;
 const plies=Array.isArray(saved.game?.moves)?saved.game.moves.length:0;
 const turns=Math.ceil(plies/2);
 return `${turns} ${turns===1?'turn':'turns'} · ${saved.settings.theme} set`;
}
