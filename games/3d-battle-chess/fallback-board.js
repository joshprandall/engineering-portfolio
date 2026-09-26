/* CDN-independent renderer, sharing the live-repair singleton with battle.js. */
import {chooseComputerMove} from './engine.js';
import {game} from './shared-game.js';
import {castleNotation,castleAttempt} from './castle-controls.js';
const $=id=>document.getElementById(id);
const glyph={w:{k:'♔',q:'♕',r:'♖',b:'♗',n:'♘',p:'♙'},b:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'}};
let lifecycle=null,timer=null,selected=null,moves=[],flipped=false,active=false,started=false,retry=null;
const listen=(el,type,fn)=>el?.addEventListener(type,fn,{signal:lifecycle.signal});
function cancel(){clearTimeout(timer);timer=null;selected=null;moves=[];}
function render(){
 if(!active||!started)return;
 const grid=$('board2d');grid.replaceChildren();
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const x=flipped?7-col:col,y=flipped?7-row:row,p=game.piece(x,y),b=document.createElement('button');
  b.type='button';b.className='square2d '+((x+y)%2?'dark':'light');
  if(p)b.classList.add(p.c==='w'?'white-piece':'black-piece');
  if(selected?.x===x&&selected?.y===y)b.classList.add('selected');
  if(moves.some(m=>m.nx===x&&m.ny===y))b.classList.add('legal');
  b.dataset.x=x;b.dataset.y=y;b.textContent=p?glyph[p.c][p.t]:'';b.setAttribute('role','gridcell');
  b.setAttribute('aria-label',`${String.fromCharCode(97+x)}${8-y}: ${p?(p.c==='w'?'white ':'black ')+p.t:'empty'}`);grid.append(b);
 }
 const st=game.status();$('turn').textContent=st.over?'Game over':`${game.turn==='w'?'White':'Black'} to move`;
 $('state').textContent=st.over?(st.winner?`${st.winner==='w'?'White':'Black'} wins by checkmate`:`Draw: ${st.kind}`):(st.check?'Check':'2D board — 3D modules unavailable');
 $('log').replaceChildren(...game.moves.map(m=>{const li=document.createElement('li');li.textContent=m.notation;return li;}));
 $('difficulty').disabled=$('mode').value!=='ai';
 for(const id of ['viewToggle','handView']){$(id).textContent='Retry 3D';$(id).setAttribute('aria-label','Retry 3D without resetting game');}
}
function computer(){
 clearTimeout(timer);
 if(!active||!started||$('mode').value!=='ai'||game.turn!=='b'||game.status().over)return;
 timer=setTimeout(()=>{if(!active||!started)return;const m=chooseComputerMove(game,Number($('difficulty').value));if(m)game.move(m.x,m.y,m.nx,m.ny);render();},350);
}
function play(m,promotion){
 if(!active||!started||game.status().over||($('mode').value==='ai'&&game.turn==='b'))return false;
 const p=game.piece(m.x,m.y);
 if(!promotion&&p?.t==='p'&&(m.ny===0||m.ny===7)){const answer=(prompt('Promote: q, r, b, n','q')||'q').toLowerCase();promotion=['q','r','b','n'].includes(answer)?answer:'q';}
 if(!game.move(m.x,m.y,m.nx,m.ny,promotion||'q'))return false;
 selected=null;moves=[];render();computer();return true;
}
function choose(x,y){
 if($('mode').value==='ai'&&game.turn==='b')return;
 const castle=selected&&castleAttempt(game,selected,x,y),m=castle?.move||moves.find(m=>m.nx===x&&m.ny===y);
 if(m){play(m);return;}
 selected=game.piece(x,y)?.c===game.turn?{x,y}:null;moves=selected?game.legalMoves(x,y):[];render();
}
function fullscreen(){$('gameShell').classList.toggle('immersive-fullscreen');}
export function installFallback({onRetry3D}){
 if(active)return;
 lifecycle=new AbortController();active=true;retry=onRetry3D;
 const hint=document.createElement('p');hint.id='fallback-hint';hint.setAttribute('role','status');hint.textContent='3D could not load. Start a full-rules 2D match; retry 3D later without losing moves.';$('setupScreen').querySelector('.setup-panel').append(hint);
 listen($('startGameBtn'),'click',()=>{
  for(const [to,from]of [['mode','setupMode'],['theme','setupTheme'],['difficulty','setupDifficulty']])$(to).value=$(from).value;
  $('setupScreen').classList.add('hidden');$('gameShell').classList.remove('hidden');$('gameShell').setAttribute('aria-hidden','false');document.body.classList.add('playing');document.body.classList.toggle('handheld-active',navigator.maxTouchPoints>0&&matchMedia('(pointer:coarse)').matches);started=true;
  $('scene').hidden=true;$('board2d').classList.remove('hidden');$('gameShell').classList.add('immersive-fullscreen');render();computer();
 });
 listen($('board2d'),'click',e=>{const b=e.target.closest('[data-x]');if(b)choose(Number(b.dataset.x),Number(b.dataset.y));});
  const reset=()=>{cancel();game.reset();render();};const undo=()=>{cancel();if(game.undo()&&$('mode').value==='ai'&&game.turn==='b')game.undo();render();};
 listen(document,'keydown',e=>{
  if(!started||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  const key=e.key.toLowerCase();
  if(key==='escape'){$('gameShell').classList.remove('immersive-fullscreen');return;}
  if(key==='u'){e.preventDefault();undo();}
  if(key==='v'){e.preventDefault();void retry();}
  if(key==='f'){e.preventDefault();flipped=!flipped;render();}
  if(key==='n'){e.preventDefault();reset();}
 });
 for(const id of ['newGame','handNew'])listen($(id),'click',reset);
 for(const id of ['undo','handUndo'])listen($(id),'click',undo);
 for(const id of ['flip','handFlip'])listen($(id),'click',()=>{flipped=!flipped;render();});
 for(const id of ['viewToggle','handView'])listen($(id),'click',()=>void retry());
 for(const id of ['fullscreenBtn','handFullscreen'])listen($(id),'click',fullscreen);
 for(const id of ['sound','handSound'])listen($(id),'click',()=>{$(id).textContent='Sound unavailable in emergency mode';$(id).setAttribute('aria-pressed','false');});
 listen($('mode'),'change',reset);listen($('difficulty'),'change',computer);
 listen($('menuBtn'),'click',()=>{$('menuBtn').setAttribute('aria-expanded',String($('controls').classList.toggle('open')));});
 listen($('exitGame'),'click',()=>{cancel();started=false;$('gameShell').classList.add('hidden');$('gameShell').classList.remove('immersive-fullscreen');$('gameShell').setAttribute('aria-hidden','true');$('setupScreen').classList.remove('hidden');document.body.classList.remove('playing');});
 listen($('moveForm'),'submit',e=>{e.preventDefault();const value=$('moveInput').value.trim(),castle=castleNotation(game,value),m=/^([a-h])([1-8])([a-h])([1-8])([qrbn])?$/i.exec(value);const move=castle?.move||(m&&{x:m[1].toLowerCase().charCodeAt(0)-97,y:8-Number(m[2]),nx:m[3].toLowerCase().charCodeAt(0)-97,ny:8-Number(m[4])});if(move&&play(move,m?.[5]?.toLowerCase()))$('moveInput').value='';else $('state').textContent='Enter a legal move such as e2e4 or O-O.';});
}
export function stopTwoDimensionalBoard(){cancel();lifecycle?.abort();active=false;started=false;$('fallback-hint')?.remove();$('board2d').replaceChildren();}
