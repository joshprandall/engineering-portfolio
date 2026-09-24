/* Accessible, self-contained 2D chess if WebGL/CDN is unavailable or the player chooses 2D. */
import {chooseComputerMove} from './engine.js';
import {game} from './shared-game.js';
let stop=()=>{};
export function stopTwoDimensionalBoard(){stop();window.__battle2D=false;}
const $=id=>document.getElementById(id);
const glyph={w:{k:'♔',q:'♕',r:'♖',b:'♗',n:'♘',p:'♙'},b:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'}};
export function startTwoDimensionalBoard(){
 if(window.__battle2D)return;window.__battle2D=true;
 const scene=$('scene'),status=$('state'),turn=$('turn'),log=$('log');
 let chosen=null,moves=[],flipped=false,generation=0,timer=null;
 scene.replaceChildren();scene.classList.add('board-2d-mode');scene.setAttribute('aria-label','Playable two-dimensional chessboard');
 const info=document.createElement('p');info.className='board-2d-notice';
 info.textContent='2D board — select Use 3D board to switch views.';
 const grid=document.createElement('div');grid.className='board-2d-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','Chess squares');
 scene.append(info,grid);
 function view(){
  grid.replaceChildren();const list=[];
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
   const x=flipped?7-col:col,y=flipped?7-row:row,p=game.piece(x,y),sq=String.fromCharCode(97+x)+(8-y);
   const button=document.createElement('button');button.type='button';button.className='square-2d '+((x+y)%2?'dark':'light');
   if(chosen&&chosen.x===x&&chosen.y===y)button.classList.add('chosen');
   if(moves.some(m=>m.nx===x&&m.ny===y))button.classList.add('legal');
   button.textContent=p?glyph[p.c][p.t]:'';
   button.dataset.color=p?.c||'';
   button.setAttribute('aria-label',`${sq}: ${p?(p.c==='w'?'white ':'black ')+({k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'}[p.t]):'empty'}${moves.some(m=>m.nx===x&&m.ny===y)?', legal destination':''}`);
   button.addEventListener('click',()=>choose(x,y));list.push(button);
  }
  grid.append(...list);
  const st=game.status();turn.textContent=st.over?'Game over':`${game.turn==='w'?'White':'Black'} to move`;
  status.textContent=st.over?(st.winner?`${st.winner==='w'?'White':'Black'} wins by checkmate`:`Draw: ${st.kind}`):(st.check?'Check':'2D board ready');
  log.replaceChildren(...game.moves.map((m,i)=>{const li=document.createElement('li');li.textContent=`${i+1}. ${m.notation}`;return li}));
  $('difficulty').disabled=true;$('difficulty').title='2D mode uses a fast, fixed-strength computer opponent';
 }
 stop=()=>{generation++;clearTimeout(timer);};
 function invalidate(){generation++;clearTimeout(timer);chosen=null;moves=[];}
 function computer(){if($('mode').value!=='ai'||game.turn!=='b'||game.status().over)return;
  const ticket=++generation;timer=setTimeout(()=>{
   if(ticket!==generation||window.__battle2D!==true)return;
   try{const m=chooseComputerMove(game,1);if(m)game.move(m.x,m.y,m.nx,m.ny);}
   catch(e){status.textContent='Computer move unavailable: '+e.message;return;}
   chosen=null;moves=[];view();
  },180);
 }
 function promote(p,y){if(p?.t!=='p'||(y!==0&&y!==7))return 'q';
  const answer=prompt('Promote to queen (q), rook (r), bishop (b), or knight (n):','q');
  const choice=(answer||'q').trim().toLowerCase();return ['q','r','b','n'].includes(choice)?choice:'q';
 }
 function play(m,promotion=null){
  const piece=game.piece(m.x,m.y),chosenPromotion=promotion||promote(piece,m.ny);
  const done=game.move(m.x,m.y,m.nx,m.ny,chosenPromotion);
  if(!done)return false;chosen=null;moves=[];view();computer();return true;
 }
 function choose(x,y){if($('mode').value==='ai'&&game.turn==='b')return;
  const move=moves.find(m=>m.nx===x&&m.ny===y);
  if(move){play(move);return;}
  if(game.piece(x,y)?.c===game.turn){chosen={x,y};moves=game.legalMoves(x,y);}else{chosen=null;moves=[];}
  view();
 }
 $('newGame').onclick=()=>{invalidate();game.reset();view();};
 $('undo').onclick=()=>{invalidate();if(game.undo()&&$('mode').value==='ai'&&game.turn==='b')game.undo();view();};
 $('flip').onclick=()=>{flipped=!flipped;view();};
 $('theme').onchange=()=>{grid.dataset.theme=$('theme').value;};
 $('mode').onchange=()=>{invalidate();game.reset();view();};
 $('sound').onclick=event=>{event.currentTarget.textContent='Sound unavailable in 2D mode';event.currentTarget.setAttribute('aria-pressed','false');};
 $('menuBtn').onclick=event=>{const opened=$('controls').classList.toggle('open');event.currentTarget.setAttribute('aria-expanded',String(opened));};
 $('moveForm').onsubmit=event=>{
  event.preventDefault();if($('mode').value==='ai'&&game.turn==='b')return;const field=$('moveInput'),match=/^([a-h])([1-8])([a-h])([1-8])([qrbn])?$/i.exec(field.value.trim());
  if(!match){status.textContent='Enter a move such as e2e4.';return;}
  const x=match[1].toLowerCase().charCodeAt(0)-97,y=8-Number(match[2]),nx=match[3].toLowerCase().charCodeAt(0)-97,ny=8-Number(match[4]);
  if(!game.legalMoves(x,y).some(m=>m.nx===nx&&m.ny===ny)){status.textContent='That move is not legal.';return;}
  if(play({x,y,nx,ny},match[5]?.toLowerCase()||null))field.value='';
 };
 grid.dataset.theme=$('theme').value;view();computer();
}
