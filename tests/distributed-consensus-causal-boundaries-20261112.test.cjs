'use strict';
// Deterministic, synthetic-only boundary tests for the distributed-systems curriculum.
// Run: node --test tests/distributed-consensus-causal-boundaries-20261112.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const choose = (n, k) => {
  const out = [];
  function walk(start, selected) {
    if (selected.length === k) { out.push(new Set(selected)); return; }
    for (let i = start; i <= n - (k - selected.length); i++) walk(i + 1, [...selected, i]);
  }
  walk(0, []);
  return out;
};

test('majorities intersect for every pair of fixed-membership 3/5/7-node quorums', () => {
  for (const n of [3, 5, 7]) {
    const q = Math.floor(n / 2) + 1;
    const subsets = choose(n, q);
    for (const a of subsets) for (const b of subsets) {
      const overlap = [...a].filter(x => b.has(x)).length;
      assert.ok(overlap >= 2 * q - n, 'n=' + n + ', q=' + q + ', overlap=' + overlap);
    }
  }
  assert.equal(new Set([0, 1]).size + new Set([3, 4]).size, 4);
  assert.equal([0, 1].some(v => new Set([3, 4]).has(v)), false);
});

test('RequestVote log freshness orders last-log term before last-log index', () => {
  const eligible = (candidate, voter) => candidate.term > voter.term ||
    (candidate.term === voter.term && candidate.index >= voter.index);
  for (let ct = 0; ct <= 4; ct++) for (let vt = 0; vt <= 4; vt++)
    for (let ci = 0; ci <= 10; ci++) for (let vi = 0; vi <= 10; vi++) {
      const result = eligible({term: ct, index: ci}, {term: vt, index: vi});
      assert.equal(result, ct > vt || (ct === vt && ci >= vi));
      if (ct < vt) assert.equal(result, false, 'a long stale-term log is not fresher');
      if (ct > vt) assert.equal(result, true, 'a shorter newer-term log is fresher');
    }
  assert.equal(eligible({term: 4, index: 20}, {term: 5, index: 12}), false);
  assert.equal(eligible({term: 5, index: 20}, {term: 5, index: 12}), true);
});

test('one vote per term and higher-term stepdown are separate state transitions', () => {
  let server = {term: 5, votedFor: 'A', role: 'leader'};
  function request(term, candidate, upToDate = true) {
    if (term < server.term) return false;
    if (term > server.term) server = {term, votedFor: null, role: 'follower'};
    if (!upToDate || (server.votedFor !== null && server.votedFor !== candidate)) return false;
    server.votedFor = candidate;
    return true;
  }
  assert.equal(request(5, 'C'), false);
  assert.equal(request(4, 'D'), false);
  assert.deepEqual(server, {term: 5, votedFor: 'A', role: 'leader'});
  assert.equal(request(6, 'C', false), false);
  assert.deepEqual(server, {term: 6, votedFor: null, role: 'follower'}, 'stepdown precedes freshness rejection');
  assert.equal(request(6, 'C'), true);
  assert.equal(request(6, 'D'), false);
  assert.deepEqual(server, {term: 6, votedFor: 'C', role: 'follower'});
});

test('old-term match counts cannot directly commit; current-term majority commits prefix', () => {
  const term = 3, entryTerms = {4: 2, 5: 3};
  const quorum = 3;
  const canAdvance = (index, matches) => entryTerms[index] === term &&
    matches.filter(x => x >= index).length >= quorum;
  const oldOnly = [4, 4, 4, 4, 4];
  assert.equal(canAdvance(4, oldOnly), false);
  assert.equal(canAdvance(5, oldOnly), false);
  const twoCurrent = [5, 5, 4, 4, 4];
  assert.equal(canAdvance(4, twoCurrent), false);
  assert.equal(canAdvance(5, twoCurrent), false);
  const threeCurrent = [5, 5, 5, 4, 4];
  assert.equal(canAdvance(5, threeCurrent), true);
  const committedPrefix = Array.from({length: 5}, (_, i) => i + 1).filter(i => i <= 5);
  assert.ok(committedPrefix.includes(4), 'index 4 is committed as a prefix of current-term index 5');
});

const reaches = (graph, from, to) => {
  const seen = new Set(), todo = [...(graph[from] || [])];
  while (todo.length) {
    const v = todo.pop();
    if (v === to) return true;
    if (!seen.has(v)) { seen.add(v); todo.push(...(graph[v] || [])); }
  }
  return false;
};

test('Lamport clock ordering is necessary but not sufficient for happens-before', () => {
  const graph = {a: ['b'], b: ['c'], c: ['d'], d: [], x: []};
  const clock = {a: 1, b: 4, c: 6, d: 7, x: 2};
  for (const from of Object.keys(graph)) for (const to of Object.keys(graph)) {
    if (reaches(graph, from, to)) assert.ok(clock[from] < clock[to], from + ' must precede ' + to);
  }
  assert.equal(clock.x < clock.b, true);
  assert.equal(reaches(graph, 'x', 'b'), false, 'lower timestamps do not prove causality');
  assert.equal(reaches(graph, 'b', 'x'), false, 'no opposite causal path exists either');
  assert.equal(Math.max(5, 4) + 1, 6);
  assert.equal(Math.max(1, 4) + 1, 5);
  graph.x.push('b');
  assert.equal(reaches(graph, 'x', 'd'), true, 'a new message edge changes causal reachability');
});

const validRegisterOrder = order => {
  let value = 0;
  for (const op of order) {
    if (op.type === 'write') value = op.value;
    else if (op.result !== value) return false;
  }
  return true;
};
const canLinearize = (ops, enforceRealtime) => {
  function permitted(a, b) {
    if (a.process === b.process) return a.index < b.index;
    return enforceRealtime ? a.finish < b.start : false;
  }
  function permutations(prefix, rest) {
    if (!rest.length) return validRegisterOrder(prefix);
    return rest.some((op, i) => {
      if (rest.some(other => other !== op && permitted(other, op))) return false;
      return permutations([...prefix, op], [...rest.slice(0, i), ...rest.slice(i + 1)]);
    });
  }
  return permutations([], ops);
};

test('single-register enumerator distinguishes sequential consistency from linearizability', () => {
  const write = {process:'P', index:0, type:'write', value:1, start:1, finish:2};
  const stale = {process:'Q', index:0, type:'read', result:0, start:3, finish:4};
  assert.equal(canLinearize([write, stale], true), false);
  assert.equal(canLinearize([write, stale], false), true);
  const concurrentRead = {...stale, start:1};
  assert.equal(canLinearize([write, concurrentRead], true), true);
  assert.equal(canLinearize([write, {...stale, result:1}], true), true);
  const laterRead = {...stale, process:'P', index:1};
  assert.equal(canLinearize([write, laterRead], false), false, 'same-process program order must hold');
});

const source = path.join(__dirname, '..', 'deep-learning', 'advanced', 'distributed-systems.json');
test('ten lessons state their model-specific falsifiable boundaries', {skip: !fs.existsSync(source) && 'source JSON not in standalone scratch test directory'}, () => {
  const records = JSON.parse(fs.readFileSync(source, 'utf8'));
  const anchors = {
    'advanced-consensus': 'quorum=floor(3/2)+1=2',
    'advanced-replication': 'Only the latter meets majority replication',
    'advanced-leader-election': 'term 5 beats term 4',
    'advanced-consistency-models': 'read must appear after write(1)',
    'advanced-quorum': '2q-N=1',
    'advanced-v05-logical-clocks': 'max(5,4)+1=6',
    'advanced-v05-happens-before': 'a→b→c→d',
    'advanced-v05-raft-leaders': 'A updates currentTerm to 7',
    'advanced-v05-raft-terms': 'C cannot obtain a second vote',
    'advanced-v05-raft-commit-rule': 'once term-3 e3 at index 5 reaches three replicas'
  };
  assert.equal(Object.keys(records).length, 108);
  for (const [id, anchor] of Object.entries(anchors)) {
    assert.ok(records[id], id);
    const prose = [...records[id].reasoningSteps, ...records[id].labPlan].join('\n');
    assert.ok(prose.includes(anchor), id + ': missing assertion anchor ' + anchor);
  }
});
