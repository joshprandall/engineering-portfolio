import assert from 'node:assert/strict';
import {ChessGame} from '../games/3d-battle-chess/engine.js';
import {castleAttempt,castleNotation} from '../games/3d-battle-chess/castle-controls.js';

const openBoard = turn => {
  const game = new ChessGame();
  game.loadFEN('r3k2r/8/8/8/8/8/8/R3K2R ' + turn + ' KQkq - 0 1');
  return game;
};

let game = openBoard('w');
let attempt = castleNotation(game, 'O-O');
assert.equal(attempt.side, 'kingside');
assert.deepEqual([attempt.move.x, attempt.move.y, attempt.move.nx, attempt.move.ny], [4, 7, 6, 7]);
let result = game.move(attempt.move.x, attempt.move.y, attempt.move.nx, attempt.move.ny);
assert.equal(result.notation, 'O-O');
assert.equal(game.piece(5, 7)?.t, 'r');

game = openBoard('w');
attempt = castleNotation(game, '0-0-0+');
assert.equal(attempt.side, 'queenside');
assert.deepEqual([attempt.move.x, attempt.move.y, attempt.move.nx, attempt.move.ny], [4, 7, 2, 7]);

game = openBoard('b');
attempt = castleNotation(game, 'o-o#');
assert.equal(attempt.side, 'kingside');
assert.deepEqual([attempt.move.x, attempt.move.y, attempt.move.nx, attempt.move.ny], [4, 0, 6, 0]);

game = openBoard('w');
attempt = castleAttempt(game, {x:7, y:7}, 4, 7);
assert.equal(attempt.side, 'kingside');
assert.equal(attempt.move?.nx, 6);

game = new ChessGame();
attempt = castleNotation(game, 'O-O');
assert.equal(attempt.side, 'kingside');
assert.equal(attempt.move, null);

assert.equal(castleNotation(openBoard('w'), 'e1g1'), null);
assert.equal(castleNotation(openBoard('w'), ''), null);
assert.equal(castleNotation(openBoard('w'), null), null);
assert.equal(castleNotation(openBoard('w'), 'O-O-O-O'), null);

console.log('PASS castle input UX');
