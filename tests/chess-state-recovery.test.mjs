import assert from 'node:assert/strict';
import {ChessGame} from '../games/3d-battle-chess/engine.js';

const makeStorage=()=>{
  const data=new Map();
  return {
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>data.set(key,String(value)),
    removeItem:key=>data.delete(key)
  };
};
global.window={localStorage:makeStorage()};
const storage=await import('../games/3d-battle-chess/game-storage.js');

const sq=s=>({x:s.charCodeAt(0)-97,y:8-Number(s[1])});
const play=(game,from,to,promotion='q')=>{
  const a=sq(from),b=sq(to),move=game.move(a.x,a.y,b.x,b.y,promotion);
  assert(move,`expected legal move ${from}${to}`);
  return move;
};

const original=new ChessGame();
play(original,'e2','e4');
play(original,'e7','e5');
play(original,'g1','f3');
play(original,'b8','c6');
play(original,'f1','b5');
play(original,'a7','a6');

const savedRecord=original.exportRecord();
const savedFen=original.toFEN();
const savedPgn=original.toPGN({Event:'Recovery Test'});
assert(savedPgn.includes('[Event "Recovery Test"]'));
assert(savedPgn.includes('1. e4 e5'));
assert(savedPgn.includes('3. Bb5 a6'));

const restored=new ChessGame();
assert.equal(restored.loadRecord(savedRecord),true);
assert.equal(restored.toFEN(),savedFen,'record replay must restore the exact FEN');
assert.deepEqual(restored.exportRecord(),savedRecord,'record replay must preserve move sequence');
assert(restored.toPGN().includes('3. Bb5 a6'),'restored game must regenerate PGN move text');

const beforeUndo=restored.toFEN();
assert.equal(restored.undo(),true,'restored history must support undo');
assert.equal(restored.moves.length,savedRecord.moves.length-1);
assert.notEqual(restored.toFEN(),beforeUndo,'undo must recover the previous state after loadRecord');
assert.equal(restored.loadRecord(savedRecord),true,'saved record must remain replayable after undo');
assert.equal(restored.toFEN(),savedFen);

const customFen='8/P6k/8/8/8/8/6Kp/8 w - - 7 42';
const fromFen=new ChessGame();
assert.equal(fromFen.loadFEN(customFen),true);
assert.equal(fromFen.toFEN(),customFen,'FEN must round-trip exactly');
const setupPgn=fromFen.toPGN({Event:'FEN Recovery'});
assert(setupPgn.includes('[SetUp "1"]'),'PGN from a loaded FEN must mark setup');
assert(setupPgn.includes(`[FEN "${customFen}"]`),'PGN must preserve the FEN origin');
play(fromFen,'a7','a8','q');
assert(fromFen.toPGN().includes('a8=Q'),'promotion must survive FEN-origin PGN generation');

const settings={
  mode:'local',theme:'cosmic',difficulty:'3',view:'3d',
  sound:false,quality:'performance',animatedCombat:true
};
const saved=storage.saveMatch({game:original,settings,flipped:true});
assert(saved,'saveMatch must persist a recoverable record');
const loaded=storage.loadSavedMatch();
assert(loaded,'loadSavedMatch must read the saved record');
assert.equal(loaded.flipped,true);
assert.equal(loaded.settings.theme,'cosmic');
assert.equal(loaded.settings.quality,'performance');

const recoveredFromStorage=new ChessGame();
assert.equal(recoveredFromStorage.loadRecord(loaded.game),true);
assert.equal(recoveredFromStorage.toFEN(),savedFen,'local save/load must recover exact board state');
assert.equal(recoveredFromStorage.moves.length,original.moves.length,'local save/load must recover move history');
assert(recoveredFromStorage.toPGN().includes('3. Bb5 a6'),'local save/load must recover PGN history');
assert.equal(recoveredFromStorage.undo(),true,'local save/load reconstruction must preserve undo capability');

assert.equal(storage.clearSavedMatch(),true);
assert.equal(storage.loadSavedMatch(),null,'clearing a save must remove recoverable state');

assert.throws(()=>new ChessGame().loadRecord({version:2,moves:[{from:'e2',to:'e5'}]}),/not legal/);
assert.throws(()=>new ChessGame().loadFEN('invalid'),/six fields/);

delete global.window;
console.log('PASS Crown & Ash state recovery: save/load, record replay, undo, FEN round-trip, PGN regeneration and promotion.');
