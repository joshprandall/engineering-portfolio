import assert from 'node:assert/strict';
import {ChessGame,chooseComputerMove,computerProfile} from '../games/3d-battle-chess/engine.js';
const move=(g,s)=>{const [a,b,c,d,p]=s;assert(g.move(a.charCodeAt(0)-97,8-Number(b),c.charCodeAt(0)-97,8-Number(d),p||'q'),s);};
const state=g=>({snapshot:g.snapshot(),history:structuredClone(g.history)});
function perft(g,n){if(!n)return 1;let sum=0;for(const m of g.allLegal()){assert(g.move(m.x,m.y,m.nx,m.ny));sum+=perft(g,n-1);assert(g.undo());}return sum;}
let g=new ChessGame(),original=state(g);
assert.equal(perft(g,1),20);assert.equal(perft(g,2),400);assert.equal(perft(g,3),8902);assert.deepEqual(state(g),original);
assert.equal(g.move(4,6,4,3),null);assert.deepEqual(state(g),original);
for(const s of ['f2f3','e7e5','g2g4','d8h4'])move(g,s);assert.equal(g.status().kind,'checkmate');assert.equal(g.status().winner,'b');assert(g.undo());assert(!g.status().over);
g=new ChessGame();for(const s of ['e2e4','a7a6','e4e5','d7d5'])move(g,s);const beforeEP=state(g);move(g,'e5d6');assert.equal(g.piece(3,3),null);assert.equal(g.moves.at(-1).epCapture,true);g.undo();assert.deepEqual(state(g),beforeEP);
g=new ChessGame();for(const s of ['g1f3','g8f6','g2g3','g7g6','f1g2','f8g7','e1g1','e8g8'])move(g,s);assert.equal(g.piece(5,7).t,'r');assert.equal(g.piece(5,0).t,'r');assert.equal(g.castling.w.k,false);
function position(pieces,turn='w'){const b=new ChessGame();b.board=Array.from({length:8},()=>Array(8).fill(null));for(const [sq,c,t]of pieces)b.board[8-Number(sq[1])][sq.charCodeAt(0)-97]={c,t};b.turn=turn;b.castling={w:{k:false,q:false},b:{k:false,q:false}};b.positions.clear();b.recordPosition();return b;}
g=position([['e1','w','k'],['e8','b','k'],['a7','w','p']]);move(g,'a7a8n');assert.equal(g.piece(0,0).t,'n');g.undo();assert.equal(g.piece(0,1).t,'p');
g=position([['e1','w','k'],['e2','w','r'],['e8','b','r'],['a8','b','k']]);assert(!g.legalMoves(4,6).some(m=>m.nx!==4),'Pinned rook cannot expose its king');
g=position([['c6','w','k'],['b6','w','q'],['a8','b','k']],'b');assert.equal(g.status().kind,'stalemate');
g=position([['e1','w','k'],['e8','b','k']]);assert.equal(g.status().kind,'insufficient material');
g=position([['e1','w','k'],['e8','b','k'],['a1','w','r']]);g.halfmove=100;assert.equal(g.status().kind,'fifty-move rule');
g=new ChessGame();for(let i=0;i<2;i++)for(const s of ['g1f3','g8f6','f3g1','f6g8'])move(g,s);assert.equal(g.status().kind,'threefold repetition');
g=new ChessGame();move(g,'e2e4');for(const level of [1,2,3]){const before=state(g),m=chooseComputerMove(g,level);assert(g.allLegal().some(x=>JSON.stringify(x)===JSON.stringify(m)));assert.deepEqual(state(g),before,'AI search must not mutate game');assert.equal(computerProfile(level).level,level);}
console.log('PASS chess rules: perft 20/400/8902, mate, castling, en passant, promotion, pins, draws, undo and all AI levels.');
