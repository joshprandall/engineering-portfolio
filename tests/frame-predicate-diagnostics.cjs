'use strict';
// Test-only observation AFTER the original gate has already rejected.
// No playback, DOM, timeout-option or pass/fail mutation.
function snapshotFramePredicate() {
 const v=document.querySelector('.scene-video.is-active');
 const f=document.querySelector('.scene-day-fallback');
 return {activeVideo:!!v, timelineAdvanced:!!v&&v.currentTime>.15,
   playing:!!v&&!v.paused, posterReady:!!f&&f.classList.contains('video-ready'),
   time:v?.currentTime??null, paused:v?.paused??null,
   readyState:v?.readyState??null, networkState:v?.networkState??null,
   mediaErrorCode:v?.error?.code??null, currentSrc:v?.currentSrc??null,
   documentReadyState:document.readyState, visibilityState:document.visibilityState};
}
async function observeFrameFailure(wait, page, report, budgetMs=1000) {
 try { return await wait(); }
 catch (original) {
  let timer;
  try {
   report.iphoneFrameCallbackFailure=await Promise.race([
    Promise.resolve().then(()=>page.evaluate(snapshotFramePredicate)),
    new Promise(resolve=>{timer=setTimeout(()=>resolve({observationUnavailable:'diagnostic budget exceeded'}),budgetMs);})
   ]);
  } catch (diagnosticError) {
   report.iphoneFrameCallbackFailure={observationUnavailable:String(diagnosticError.message||diagnosticError)};
  } finally { clearTimeout(timer); }
  throw original;
 }
}
module.exports={snapshotFramePredicate,observeFrameFailure};
