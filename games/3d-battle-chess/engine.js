// Original project chess rules implementation. Coordinates x=a..h, y=rank 8..1.
const BACK='rnbqkbnr';
const opposite=c=>c==='w'?'b':'w';
const inside=(x,y)=>x>=0&&x<8&&y>=0&&y<8;
const copy=b=>b.map(r=>r.map(p=>p?{...p}:null));
const keySq=(x,y)=>String.fromCharCode(97+x)+(8-y);
const parseSq=s=>({x:s.charCodeAt(0)-97,y:8-Number(s[1])});
const cloneSnapshot=s=>({board:copy(s.board),turn:s.turn,castling:structuredClone(s.castling),ep:s.ep?{...s.ep}:null,halfmove:s.halfmove,fullmove:s.fullmove,moves:s.moves.map(m=>({...m})),positions:new Map(s.positions),originFEN:s.originFEN||null});
export class ChessGame{
 constructor(){this.reset()}
 reset(){this.board=Array.from({length:8},()=>Array(8).fill(null));for(let x=0;x<8;x++){this.board[0][x]={c:'b',t:BACK[x]};this.board[1][x]={c:'b',t:'p'};this.board[6][x]={c:'w',t:'p'};this.board[7][x]={c:'w',t:BACK[x]}}this.turn='w';this.castling={w:{k:true,q:true},b:{k:true,q:true}};this.ep=null;this.halfmove=0;this.fullmove=1;this.history=[];this.moves=[];this.positions=new Map();this.originFEN=null;this.recordPosition()}
 snapshot(){return{board:copy(this.board),turn:this.turn,castling:structuredClone(this.castling),ep:this.ep?{...this.ep}:null,halfmove:this.halfmove,fullmove:this.fullmove,moves:this.moves.map(m=>({...m})),positions:new Map(this.positions),originFEN:this.originFEN||null}}
 restore(s){this.board=copy(s.board);this.turn=s.turn;this.castling=structuredClone(s.castling);this.ep=s.ep?{...s.ep}:null;this.halfmove=s.halfmove;this.fullmove=s.fullmove;this.moves=s.moves.map(m=>({...m}));this.positions=new Map(s.positions);this.originFEN=s.originFEN||null}
 piece(x,y){return inside(x,y)?this.board[y][x]:null}
 attacked(x,y,by,board=this.board){for(let sy=0;sy<8;sy++)for(let sx=0;sx<8;sx++)if(board[sy][sx]?.c===by){const p=board[sy][sx],dx=x-sx,dy=y-sy;if(p.t==='p'&&dy===(by==='w'?-1:1)&&Math.abs(dx)===1)return true;if(p.t==='n'&&((Math.abs(dx)===1&&Math.abs(dy)===2)||(Math.abs(dx)===2&&Math.abs(dy)===1)))return true;if(p.t==='k'&&Math.max(Math.abs(dx),Math.abs(dy))===1)return true;if('brq'.includes(p.t)&&!(dx===0&&dy===0)){const diag=Math.abs(dx)===Math.abs(dy),straight=dx===0||dy===0;if((diag&&'bq'.includes(p.t))||(straight&&'rq'.includes(p.t))){const stepX=Math.sign(dx),stepY=Math.sign(dy);let xx=sx+stepX,yy=sy+stepY,clear=true;while(xx!==x||yy!==y){if(board[yy][xx]){clear=false;break}xx+=stepX;yy+=stepY}if(clear)return true}}}return false}
 inCheck(color,board=this.board){for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(board[y][x]?.t==='k'&&board[y][x].c===color)return this.attacked(x,y,opposite(color),board);return true}
 pseudo(x,y){const p=this.piece(x,y);if(!p)return[];const out=[];const add=(nx,ny)=>{const q=this.piece(nx,ny);if(inside(nx,ny)&&(!q||q.c!==p.c&&q.t!=='k'))out.push({x,y,nx,ny})};if(p.t==='p'){const d=p.c==='w'?-1:1,home=p.c==='w'?6:1;if(inside(x,y+d)&&!this.piece(x,y+d)){add(x,y+d);if(y===home&&!this.piece(x,y+2*d))add(x,y+2*d)}for(const dx of[-1,1]){const nx=x+dx,ny=y+d,q=this.piece(nx,ny);if(inside(nx,ny)&&((q&&q.c!==p.c&&q.t!=='k')||(this.ep?.x===nx&&this.ep?.y===ny&&this.piece(nx,y)?.t==='p'&&this.piece(nx,y)?.c===opposite(p.c))))out.push({x,y,nx,ny})}}
 if(p.t==='n')for(const[dx,dy]of[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]])add(x+dx,y+dy);
 if('brq'.includes(p.t)){const dirs=[];if('bq'.includes(p.t))dirs.push([1,1],[-1,1],[1,-1],[-1,-1]);if('rq'.includes(p.t))dirs.push([1,0],[-1,0],[0,1],[0,-1]);for(const[dx,dy]of dirs){let nx=x+dx,ny=y+dy;while(inside(nx,ny)){const q=this.piece(nx,ny);if(!q)out.push({x,y,nx,ny});else{if(q.c!==p.c&&q.t!=='k')out.push({x,y,nx,ny});break}nx+=dx;ny+=dy}}}
 if(p.t==='k'){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)add(x+dx,y+dy);const row=p.c==='w'?7:0,enemy=opposite(p.c);if(x===4&&y===row&&!this.inCheck(p.c)){if(this.castling[p.c].k&&this.piece(7,row)?.t==='r'&&this.piece(7,row)?.c===p.c&&!this.piece(5,row)&&!this.piece(6,row)&&!this.attacked(5,row,enemy)&&!this.attacked(6,row,enemy))out.push({x,y,nx:6,ny:row});if(this.castling[p.c].q&&this.piece(0,row)?.t==='r'&&this.piece(0,row)?.c===p.c&&!this.piece(1,row)&&!this.piece(2,row)&&!this.piece(3,row)&&!this.attacked(3,row,enemy)&&!this.attacked(2,row,enemy))out.push({x,y,nx:2,ny:row})}}return out}
 legalMoves(x,y){const p=this.piece(x,y);if(!p||p.c!==this.turn)return[];return this.pseudo(x,y).filter(m=>{const b=copy(this.board);b[m.ny][m.nx]=b[y][x];b[y][x]=null;if(p.t==='p'&&this.ep?.x===m.nx&&this.ep?.y===m.ny&&!this.piece(m.nx,m.ny))b[y][m.nx]=null;if(p.t==='k'&&Math.abs(m.nx-x)===2){const rx=m.nx===6?7:0,tx=m.nx===6?5:3;b[y][tx]=b[y][rx];b[y][rx]=null}return!this.inCheck(p.c,b)})}
 allLegal(color=this.turn){if(color!==this.turn)throw Error('allLegal: color must match turn');const moves=[];for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(this.piece(x,y)?.c===color)moves.push(...this.legalMoves(x,y));return moves}
 positionKey(){return this.board.map(r=>r.map(p=>p?p.c+p.t:'..').join('')).join('/')+' '+this.turn+' '+JSON.stringify(this.castling)+' '+(this.ep?keySq(this.ep.x,this.ep.y):'-')}
 recordPosition(){const k=this.positionKey();this.positions.set(k,(this.positions.get(k)||0)+1)}
 insufficient(){const men=[];for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(this.board[y][x]&&this.board[y][x].t!=='k')men.push({...this.board[y][x],x,y});if(!men.length)return true;if(men.length===1&&['b','n'].includes(men[0].t))return true;if(men.every(p=>p.t==='b'))return men.every(p=>(p.x+p.y)%2===(men[0].x+men[0].y)%2);return false}
 status(){const legal=this.allLegal(),check=this.inCheck(this.turn);if(!legal.length)return{over:true,kind:check?'checkmate':'stalemate',winner:check?opposite(this.turn):null,check};if(this.insufficient())return{over:true,kind:'insufficient material',winner:null,check};if(this.halfmove>=100)return{over:true,kind:'fifty-move rule',winner:null,check};if((this.positions.get(this.positionKey())||0)>=3)return{over:true,kind:'threefold repetition',winner:null,check};return{over:false,kind:check?'check':'playing',winner:null,check}}
 move(x,y,nx,ny,promotion='q'){if(this.status().over)return null;const m=this.legalMoves(x,y).find(a=>a.nx===nx&&a.ny===ny);if(!m||!['q','r','b','n'].includes(promotion))return null;const s=this.snapshot(),p=this.piece(x,y),target=this.piece(nx,ny),epCapture=p.t==='p'&&this.ep?.x===nx&&this.ep?.y===ny&&!target,captured=epCapture?this.piece(nx,y):target;const contenders=p.t==='p'||p.t==='k'?[]:this.allLegal().filter(a=>a.nx===nx&&a.ny===ny&&(a.x!==x||a.y!==y)&&this.piece(a.x,a.y)?.t===p.t);let disambiguation='';if(contenders.length){const sharesFile=contenders.some(a=>a.x===x),sharesRank=contenders.some(a=>a.y===y);disambiguation=!sharesFile?String.fromCharCode(97+x):!sharesRank?String(8-y):keySq(x,y)}this.board[ny][nx]={...p};this.board[y][x]=null;if(epCapture)this.board[y][nx]=null;if(p.t==='k'){this.castling[p.c].k=false;this.castling[p.c].q=false;if(Math.abs(nx-x)===2){const rx=nx===6?7:0,tx=nx===6?5:3;this.board[y][tx]=this.board[y][rx];this.board[y][rx]=null}}if(p.t==='r'&&y===(p.c==='w'?7:0)){if(x===0)this.castling[p.c].q=false;if(x===7)this.castling[p.c].k=false}if(captured?.t==='r'&&ny===(captured.c==='w'?7:0)){if(nx===0)this.castling[captured.c].q=false;if(nx===7)this.castling[captured.c].k=false}this.ep=p.t==='p'&&Math.abs(ny-y)===2?{x,y:(ny+y)/2}:null;const promoted=p.t==='p'&&(ny===0||ny===7);if(promoted)this.board[ny][nx].t=promotion;this.halfmove=(p.t==='p'||captured)?0:this.halfmove+1;const castle=p.t==='k'&&Math.abs(nx-x)===2,note=castle?(nx===6?'O-O':'O-O-O'):(p.t==='p'?(captured?String.fromCharCode(97+x):''):p.t.toUpperCase()+disambiguation)+(captured?'x':'')+keySq(nx,ny)+(promoted?'='+promotion.toUpperCase():'');const entry={color:p.c,piece:p.t,from:keySq(x,y),to:keySq(nx,ny),captured:captured?.t||null,notation:note,promotion:promoted?promotion:null,castle,epCapture};if(this.turn==='b')this.fullmove++;this.turn=opposite(this.turn);this.history.push(s);this.moves.push(entry);this.recordPosition();const status=this.status();entry.notation+=status.kind==='checkmate'?'#':status.check?'+':'';return entry}
 undo(){const s=this.history.pop();if(!s)return false;this.restore(s);return true}
 exportRecord(){return{version:2,originFEN:this.originFEN||null,moves:this.moves.map(({from,to,promotion})=>({from,to,promotion:promotion||null}))}}
 loadRecord(record){if(!record||![1,2].includes(record.version)||!Array.isArray(record.moves))throw Error('Unsupported saved game.');const rebuilt=new ChessGame();if(record.version===2&&record.originFEN)rebuilt.loadFEN(record.originFEN);if(record.moves.length>1000)throw Error('Saved game is too long.');for(const item of record.moves){if(!item||!/^[a-h][1-8]$/.test(item.from)||!/^[a-h][1-8]$/.test(item.to)||item.promotion&&!['q','r','b','n'].includes(item.promotion))throw Error('Saved game contains invalid move data.');const a=parseSq(item.from),b=parseSq(item.to);if(!rebuilt.move(a.x,a.y,b.x,b.y,item.promotion||'q'))throw Error(`Saved move ${item.from}${item.to} is not legal.`)}this.restore(rebuilt.snapshot());this.history=rebuilt.history.map(cloneSnapshot);return true}
 toFEN(){const rows=this.board.map(row=>{let out='',empty=0;for(const p of row){if(!p){empty++;continue}if(empty){out+=empty;empty=0}const token=p.t==='p'?'p':p.t;out+=p.c==='w'?token.toUpperCase():token}if(empty)out+=empty;return out});const castle=(this.castling.w.k?'K':'')+(this.castling.w.q?'Q':'')+(this.castling.b.k?'k':'')+(this.castling.b.q?'q':'')||'-';return `${rows.join('/')} ${this.turn} ${castle} ${this.ep?keySq(this.ep.x,this.ep.y):'-'} ${this.halfmove} ${this.fullmove}`}
 loadFEN(fen){const parts=String(fen||'').trim().split(/\s+/);if(parts.length!==6)throw Error('FEN must contain six fields.');const [layout,turn,castle,ep,halfmove,fullmove]=parts,rows=layout.split('/');if(rows.length!==8||!['w','b'].includes(turn)||!/^(-|K?Q?k?q?)$/.test(castle)||!/^(-|[a-h][36])$/.test(ep))throw Error('FEN fields are invalid.');const board=[];for(const row of rows){const parsed=[];for(const token of row){if(/[1-8]/.test(token)){parsed.push(...Array(Number(token)).fill(null));continue}if(!/[prnbqkPRNBQK]/.test(token))throw Error('FEN board contains an invalid piece.');parsed.push({c:token===token.toUpperCase()?'w':'b',t:token.toLowerCase()})}if(parsed.length!==8)throw Error('Each FEN rank must contain eight squares.');board.push(parsed)}for(const color of ['w','b'])if(board.flat().filter(p=>p?.c===color&&p.t==='k').length!==1)throw Error('FEN must contain one king per side.');const hm=Number(halfmove),fm=Number(fullmove);if(!Number.isInteger(hm)||hm<0||!Number.isInteger(fm)||fm<1)throw Error('FEN counters are invalid.');const rebuilt=new ChessGame();rebuilt.board=board;rebuilt.turn=turn;rebuilt.castling={w:{k:castle.includes('K'),q:castle.includes('Q')},b:{k:castle.includes('k'),q:castle.includes('q')}};rebuilt.ep=ep==='-'?null:parseSq(ep);rebuilt.halfmove=hm;rebuilt.fullmove=fm;rebuilt.history=[];rebuilt.moves=[];rebuilt.positions=new Map();rebuilt.recordPosition();const kings=[];for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(board[y][x]?.t==='k')kings.push({x,y,c:board[y][x].c});if(Math.max(Math.abs(kings[0].x-kings[1].x),Math.abs(kings[0].y-kings[1].y))<=1)throw Error('Kings cannot occupy adjacent squares.');rebuilt.originFEN=rebuilt.toFEN();this.restore(rebuilt.snapshot());this.history=[];return true}
 toPGN(headers={}){const status=this.status(),result=status.winner==='w'?'1-0':status.winner==='b'?'0-1':status.over?'1/2-1/2':'*',clean=value=>String(value).replace(/["\\\r\n]/g,' '),setup=this.originFEN?{SetUp:'1',FEN:this.originFEN}:{};const tags={Event:'Crown & Ash Match',Site:'Local Game',...setup,...headers,Result:result};const tagText=Object.entries(tags).map(([key,value])=>`[${key} "${clean(value)}"]`).join('\n');const origin=this.originFEN?.split(/\s+/),tokens=[];let moveNumber=origin?Number(origin[5]):1,pendingWhite=false;for(const move of this.moves){if(move.color==='w'){tokens.push(`${moveNumber}. ${move.notation}`);pendingWhite=true}else{if(pendingWhite)tokens[tokens.length-1]+=` ${move.notation}`;else tokens.push(`${moveNumber}... ${move.notation}`);moveNumber++;pendingWhite=false}}return `${tagText}\n\n${tokens.join(' ')}${tokens.length?' ':''}${result}\n`}
}
export function computerProfile(level=2){
 const n=Math.max(1,Math.min(3,Number(level)||2));
 return n===1
  ?{level:1,name:'Recruit',depth:1,window:320,pool:10,positional:.55,structure:.25,kingSafety:.15}
  :n===3
   ?{level:3,name:'Champion',depth:3,window:0,pool:1,positional:1.25,structure:1,kingSafety:1.15}
   :{level:2,name:'Warrior',depth:2,window:45,pool:4,positional:.9,structure:.55,kingSafety:.6};
}
export function chooseComputerMove(game,level=2){
 const profile=computerProfile(level),values={p:100,n:320,b:330,r:500,q:900,k:0};
 const positional=(p,x,y)=>{
  const center=(3.5-Math.abs(x-3.5))+(3.5-Math.abs(y-3.5));
  const advance=p.t==='p'?(p.c==='b'?y:7-y)*5:0;
  const centerWeight={p:2,n:8,b:5,r:1,q:2,k:-1}[p.t]||0;
  const development=(p.t==='n'||p.t==='b')&&((p.c==='b'&&y>0)||(p.c==='w'&&y<7))?10:0;
  return advance+center*centerWeight+development;
 };
 const sideScore=color=>{
  let score=0,bishops=0,king=null;
  const pawns=Array(8).fill(0);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){
   const p=game.piece(x,y);if(!p||p.c!==color)continue;
   score+=values[p.t]+positional(p,x,y)*profile.positional;
   if(p.t==='b')bishops++;
   if(p.t==='p')pawns[x]++;
   if(p.t==='k')king={x,y};
  }
  if(bishops>=2)score+=24*profile.structure;
  for(let file=0;file<8;file++){
   if(pawns[file]>1)score-=(pawns[file]-1)*12*profile.structure;
   if(pawns[file]&&!pawns[file-1]&&!pawns[file+1])score-=6*profile.structure;
  }
  if(king){
   const homeY=color==='b'?0:7,shieldY=king.y+(color==='b'?1:-1);
   if(king.y===homeY&&(king.x===2||king.x===6))score+=28*profile.kingSafety;
   for(let dx=-1;dx<=1;dx++){
    const x=king.x+dx,p=inside(x,shieldY)?game.piece(x,shieldY):null;
    if(p?.c===color&&p.t==='p')score+=6*profile.kingSafety;
   }
  }
  return score;
 };
 const evaluate=()=>sideScore('b')-sideScore('w');
 const ordering=m=>{
  const target=game.piece(m.nx,m.ny),piece=game.piece(m.x,m.y);
  const capture=target?values[target.t]*10-(values[piece?.t]||0):0;
  const promotion=piece?.t==='p'&&(m.ny===0||m.ny===7)?9000:0;
  const castle=piece?.t==='k'&&Math.abs(m.nx-m.x)===2?180:0;
  return capture+promotion+castle;
 };
 function search(ply,alpha,beta){
  const st=game.status();
  if(st.over)return st.winner==='b'?100000+ply:st.winner==='w'?-100000-ply:0;
  if(ply===0)return evaluate();
  const maximizing=game.turn==='b';let best=maximizing?-Infinity:Infinity;
  const options=game.allLegal().sort((a,b)=>ordering(b)-ordering(a));
  for(const m of options){
   game.move(m.x,m.y,m.nx,m.ny);
   const v=search(ply-1,alpha,beta);
   game.undo();
   best=maximizing?Math.max(best,v):Math.min(best,v);
   if(maximizing)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);
   if(beta<=alpha)break;
  }
  return best;
 }
 const options=game.allLegal();
 if(!options.length)return null;
 // Any level must convert a forced mate in one instead of randomizing it away.
 for(const m of options){
  game.move(m.x,m.y,m.nx,m.ny);
  const st=game.status();
  game.undo();
  if(st.over&&st.winner==='b')return m;
 }
 const scored=[];
 for(const m of options){
  game.move(m.x,m.y,m.nx,m.ny);
  const v=search(Math.max(0,profile.depth-1),-Infinity,Infinity);
  game.undo();
  scored.push({m,v});
 }
 scored.sort((a,b)=>b.v-a.v);
 const top=scored[0].v;
 const candidates=scored.filter(s=>top-s.v<=profile.window);
 const pool=candidates.slice(0,Math.min(profile.pool,candidates.length));
 if(profile.level<3)return pool[Math.floor(Math.random()*pool.length)]?.m||scored[0].m;
 // Champion is deterministic unless multiple lines are exactly equivalent.
 const best=scored.filter(s=>s.v===top);
 return best[Math.floor(Math.random()*best.length)]?.m||scored[0].m;
}
