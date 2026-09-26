/* A setup screen is not a failed renderer. Only a failed module load starts fallback.
 * Live shared-state repair provenance: manifests/live-preservation.json. */
let fallback=null,attempt=0,loading=false;
async function loadAdvanced(){
 if(loading)return;
 loading=true;
 try{
  const advanced=await import('./battle.js?reconciliation='+attempt++);
  if(fallback){fallback.stopTwoDimensionalBoard();advanced.resumePreservedGame();fallback=null;}
 }catch(error){
  console.warn('3D modules unavailable; local chess remains playable:',error);
  if(!fallback){fallback=await import('./fallback-board.js');fallback.installFallback({onRetry3D:loadAdvanced});}
  else document.getElementById('state').textContent='3D is still unavailable. Your 2D game is unchanged.';
 }finally{loading=false;}
}
await loadAdvanced();
