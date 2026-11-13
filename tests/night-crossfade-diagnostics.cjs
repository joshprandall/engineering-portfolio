'use strict';
// Test-only snapshot AFTER the unmodified wait has failed. Never mutate media.
function snapshotNightCrossfade() {
 const site=globalThis.SiteAudio;
 const players=site?.darkElements||[];
 const ranges=r=>r?Array.from({length:Math.min(r.length,8)},(_,i)=>[r.start(i),r.end(i)]):[];
 const media=players.map((a,index)=>({index,time:a.currentTime,duration:Number.isFinite(a.duration)?a.duration:null,
  paused:a.paused,muted:a.muted,ended:a.ended,seeking:a.seeking,readyState:a.readyState,networkState:a.networkState,
  mediaErrorCode:a.error?.code??null,currentSrc:a.currentSrc,volume:a.volume,
  buffered:ranges(a.buffered),seekable:ranges(a.seekable)}));
 return {siteAvailable:!!site,owners:media.filter(a=>!a.paused&&!a.muted).length,media,
  selectedVolume:site?.volume??null,siteMuted:site?.muted??null,backend:site?.volumeBackend??null,
  outputLevels:site?.outputLevels??null,visibilityState:document.visibilityState};
}
async function observeNightCrossfadeFailure(wait,page,report,expectedOwners,budgetMs=1000) {
 try { return await wait(); }
 catch(original) {
  let timer;
  try {
   const state=await Promise.race([
    Promise.resolve().then(()=>page.evaluate(snapshotNightCrossfade)),
    new Promise(resolve=>{timer=setTimeout(()=>resolve({observationUnavailable:'diagnostic budget exceeded'}),budgetMs);})
   ]);
   report.nightCrossfadeFailure={expectedOwners,...state};
  } catch(error) { report.nightCrossfadeFailure={expectedOwners,observationUnavailable:String(error.message||error)}; }
  finally {clearTimeout(timer);}
  throw original;
 }
}
module.exports={snapshotNightCrossfade,observeNightCrossfadeFailure};
