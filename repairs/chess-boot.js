/* Load the matching live renderer. Fall back only if 3D really cannot start. */
import {installGameShell} from './jr-chess-views.js?v=20260924-reconciled';
let can3D=false;
try {
  await import('./battle.js?v=20260924-reconciled');
  can3D=!!document.querySelector('#scene canvas');
} catch(error) { console.warn('3D could not start:',error.message); }
if(!can3D){
  try {
    const {startTwoDimensionalBoard}=await import('./fallback-board.js');
    startTwoDimensionalBoard();
    const button=document.getElementById('boardMode');
    if(button){button.textContent='3D unavailable';button.disabled=true;button.title='This browser could not start 3D graphics. The 2D game is ready.'}
  } catch(error) {document.getElementById('state').textContent='Game could not load: '+error.message;}
}
installGameShell(can3D);
