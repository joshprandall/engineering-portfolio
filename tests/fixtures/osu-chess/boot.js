/* Keep the playable local chess engine available when a graphics module fails. */
async function backup(){
 try{const {startTwoDimensionalBoard}=await import('./fallback-board.js');startTwoDimensionalBoard();}
 catch(error){document.getElementById('state').textContent='Game could not load: '+error.message;}
}
document.getElementById('boardMode')?.addEventListener('click',()=>void backup());
try{
 await import('./battle.js');
 if(!document.querySelector('#scene canvas'))await backup();
}catch(error){console.warn('3D renderer did not load; using playable 2D chess:',error);await backup();}
