/* One game, two renderers. Switching views never resets the position. */
import {startTwoDimensionalBoard,stopTwoDimensionalBoard} from './fallback-board.js?toggle-repair=1';
const button=document.getElementById('boardMode');
let view='3d',three=null,loading=false,attempt=0;
function sync(){
 button.textContent=view==='2d'?'Use 3D board':'Use 2D board';
 button.setAttribute('aria-label',button.textContent);
 button.disabled=loading;
 button.dataset.view=view;
}
function use2D(){
 startTwoDimensionalBoard();view='2d';sync();
}
async function use3D(){
 loading=true;sync();
 try{
  if(!three)three=await import('./battle.js?toggle-repair=1&attempt='+attempt++);
  stopTwoDimensionalBoard();three.resumeThreeDimensionalBoard();view='3d';
 }catch(error){
  console.warn('3D could not start:',error);
  // A failed renderer may have touched the scene. Rebuild the same game in 2D.
  stopTwoDimensionalBoard();use2D();
  document.getElementById('state').textContent='3D unavailable — still in 2D. Tap Use 3D board to retry.';
 }finally{loading=false;sync();}
}
button.addEventListener('click',()=>{
 if(loading)return;
 if(view==='2d'){void use3D();return;}
 if(three&&!three.pauseThreeDimensionalBoard())return;
 use2D();
});
await use3D();
