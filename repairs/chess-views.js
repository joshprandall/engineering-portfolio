/* View adapter for the existing OSU chess engine. Both views share one game. */
export function installViews({scene,game,chooseSquare,selection,legalMoves}) {
  const button=document.getElementById('boardMode');
  // Keep the view switch visible beside the menu, not inside a board-covering popover.
  document.getElementById('menuBtn').before(button);
  const board=document.createElement('div');
  board.id='jr-board2d'; board.className='jr-board2d'; board.hidden=true;
  board.setAttribute('role','group'); board.setAttribute('aria-label','Two-dimensional chessboard');
  scene.after(board);
  let mode='3d',flipped=false;
  const glyphs={w:{p:'♙',n:'♘',b:'♗',r:'♖',q:'♕',k:'♔'},b:{p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'}};
  const names={p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'};
  const squares=[];
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){
    const b=document.createElement('button');b.type='button';b.dataset.x=x;b.dataset.y=y;
    b.className='jr-square '+((x+y)%2?'dark-square':'light-square');
    b.addEventListener('click',()=>chooseSquare(x,y));board.append(b);squares.push(b);
  }
  function render(){
    const chosen=selection(),moves=legalMoves();
    for(const b of squares){
      const x=Number(b.dataset.x),y=Number(b.dataset.y),p=game.piece(x,y);
      b.textContent=p?glyphs[p.c][p.t]:'';
      b.setAttribute('aria-label',String.fromCharCode(97+x)+(8-y)+': '+(p?(p.c==='w'?'white ':'black ')+names[p.t]:'empty'));
      b.setAttribute('aria-pressed',String(chosen?.x===x&&chosen?.y===y));
      b.classList.toggle('legal',moves.some(m=>m.nx===x&&m.ny===y));
      b.style.order=flipped?63-(y*8+x):y*8+x;
    }
  }
  function setView(next){
    mode=next==='2d'?'2d':'3d';scene.hidden=mode!=='3d';board.hidden=mode!=='2d';
    button.textContent=mode==='3d'?'2D':'3D';
    button.setAttribute('aria-label','Switch to '+button.textContent+' board');
    button.title=button.getAttribute('aria-label');button.setAttribute('aria-pressed',String(mode==='2d'));
    document.body.dataset.chessView=mode;render();
    if(mode==='3d')window.dispatchEvent(new Event('resize'));
  }
  button.onclick=()=>{setView(mode==='3d'?'2d':'3d');document.getElementById('controls').classList.remove('open');document.getElementById('menuBtn').setAttribute('aria-expanded','false')};
  const flip=document.getElementById('flip'),originalFlip=flip.onclick;
  flip.onclick=e=>{originalFlip?.call(flip,e);flipped=!flipped;render()};
  document.addEventListener('jr-chess-view',e=>setView(e.detail));
  setView('3d');
  return render;
}

/* Keep game navigation and setup usable on phones without altering chess rules. */
export function installGameShell(can3D){
  if(document.getElementById('jr-game-setup'))return;
  const header=document.querySelector('.topbar'),main=document.querySelector('main');
  if(!header||!main)return;
  const shell=document.createElement('div');shell.id='jr-game-shell';shell.hidden=true;
  header.before(shell);shell.append(header,main);
  const setup=document.createElement('section');setup.id='jr-game-setup';
  setup.innerHTML='<p class="eyebrow">INTERACTIVE WORLDS</p><h1>Battle Chess</h1><p>Choose your board and opponent. Switch between 2D and 3D during play.</p><div class="jr-game-options"></div><label>Board view<select id="jr-setup-view"><option value="3d">3D animated board</option><option value="2d">2D board</option></select></label><button type="button" id="jr-start-game">Start game</button><a href="../../projects.html#battle-chess">Back to projects</a>';
  shell.before(setup);
  for(const id of ['mode','theme','difficulty']){
    const source=document.getElementById(id);if(!source)continue;
    const label=document.createElement('label');label.textContent=source.closest('label')?.firstChild.textContent||id;
    const clone=source.cloneNode(true);clone.id='jr-setup-'+id;clone.disabled=false;label.append(clone);setup.querySelector('.jr-game-options').append(label);
  }
  const view=setup.querySelector('#jr-setup-view');
  if(!can3D){view.value='2d';view.querySelector('[value="3d"]').disabled=true;setup.querySelector('p:not(.eyebrow)').textContent='3D graphics are unavailable in this browser. You can still play a complete game on the 2D board.'}
  const nav=document.querySelector('.site-nav');if(nav){nav.className='jr-game-links';document.getElementById('controls').append(nav)}
  const exit=document.createElement('button');exit.type='button';exit.textContent='Game setup';document.getElementById('controls').append(exit);
  const gate=document.createElement('div');gate.id='jr-rotate-game';gate.hidden=true;gate.setAttribute('role','status');gate.textContent='Rotate your phone to play in landscape.';shell.append(gate);
  const rotate=()=>{gate.hidden=shell.hidden||!matchMedia('(pointer:coarse)').matches||innerWidth>=innerHeight};
  window.addEventListener('resize',rotate);
  setup.querySelector('#jr-start-game').onclick=()=>{
    for(const id of ['mode','theme','difficulty']){const source=document.getElementById(id),next=setup.querySelector('#jr-setup-'+id);if(source&&next){source.value=next.value;source.dispatchEvent(new Event('change',{bubbles:true}))}}
    setup.hidden=true;shell.hidden=false;document.body.classList.add('jr-playing');
    document.dispatchEvent(new CustomEvent('jr-chess-view',{detail:view.value}));
    try{const result=(shell.requestFullscreen||shell.webkitRequestFullscreen)?.call(shell);result?.catch?.(()=>{})}catch{}
    rotate();window.dispatchEvent(new Event('resize'));
  };
  exit.onclick=()=>{try{const result=(document.exitFullscreen||document.webkitExitFullscreen)?.call(document);result?.catch?.(()=>{})}catch{}shell.hidden=true;setup.hidden=false;document.body.classList.remove('jr-playing');rotate();setup.querySelector('#jr-start-game').focus()};
}
