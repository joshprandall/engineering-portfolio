'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const content = require('../deep-learning/software/algorithms.json');
const id = 'software-v09-troubleshooting-lab-graphs-modeling-relationships-instead-of-rows';
const cycle = [['A', 'B'], ['B', 'C'], ['C', 'A']];

function* permutations(items, prefix = []) {
  if (items.length === 0) { yield prefix; return; }
  for (let i = 0; i < items.length; i++) {
    yield* permutations([...items.slice(0, i), ...items.slice(i + 1)], [...prefix, items[i]]);
  }
}
function validOrder(order, edges) {
  return edges.every(([u, v]) => order.indexOf(u) < order.indexOf(v));
}
function legalOrders(vertices, edges) {
  return [...permutations(vertices)].filter(order => validOrder(order, edges));
}
function kahn(vertices, edges) {
  const indegree = new Map(vertices.map(v => [v, 0]));
  const successors = new Map(vertices.map(v => [v, []]));
  for (const [u, v] of edges) {
    indegree.set(v, indegree.get(v) + 1);
    successors.get(u).push(v);
  }
  const queue = vertices.filter(v => indegree.get(v) === 0);
  const output = [];
  for (let i = 0; i < queue.length; i++) {
    const u = queue[i]; output.push(u);
    for (const v of successors.get(u)) {
      indegree.set(v, indegree.get(v) - 1);
      if (indegree.get(v) === 0) queue.push(v);
    }
  }
  return output;
}

test('independent cycle deletion and isolated-node additions have different outcomes', () => {
  const acyclic = cycle.filter(([u, v]) => !(u === 'C' && v === 'A'));
  assert.equal(legalOrders(['A', 'B', 'C'], cycle).length, 0);
  assert.deepEqual(legalOrders(['A', 'B', 'C'], acyclic), [['A', 'B', 'C']]);
  assert.equal(legalOrders(['A', 'B', 'C', 'D'], cycle).length, 0);
  assert.equal(legalOrders(['A', 'B', 'C', 'D'], acyclic).length, 4);
  assert.deepEqual(kahn(['A', 'B', 'C'], acyclic), ['A', 'B', 'C']);
  assert.equal(kahn(['A', 'B', 'C', 'D'], cycle).length, 1);
});

test('lab perturbations explicitly return to the original cyclic graph', () => {
  const record = content[id];
  assert.ok(record, id);
  for (const explanation of [record.reasoningSteps[5], record.labPlan[5]]) {
    assert.match(explanation, /in separate experiments/iu);
    assert.match(explanation, /remove C→A/iu);
    assert.match(explanation, /original A→B→C→A cycle/iu);
    assert.match(explanation, /isolated D/iu);
    assert.match(explanation, /no topological order/iu);
    assert.match(explanation, /mit6_006s20_lec10\//u);
  }
});
