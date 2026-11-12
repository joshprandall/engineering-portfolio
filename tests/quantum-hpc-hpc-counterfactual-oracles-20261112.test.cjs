'use strict';
// Exact, synthetic HPC semantic checks. No MPI/Slurm job, cluster run, or performance benchmark is executed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const lessons = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'deep-learning', 'advanced', 'hpc.json'), 'utf8'));
const close = (a, b, tolerance = 1e-12) => Math.abs(a - b) <= tolerance;
const ids = [
  'advanced-mpi', 'advanced-roofline', 'advanced-mpi-collectives',
  'advanced-strong-weak-scaling', 'advanced-mpi-point-to-point',
  'advanced-slurm', 'advanced-checkpointing', 'advanced-mpi-rma',
  'advanced-v05-mpi-communicators', 'advanced-v05-mpi-ranks'
];
const anchors = {
  'advanced-mpi': ['tag 8', 'tag 9', 'mpi-forum.org'],
  'advanced-roofline': ['1000 GFLOP/s', '200 GFLOP/s', '10 FLOP/byte', 'docs.nersc.gov'],
  'advanced-mpi-collectives': ['[11,11,11,11]', '17', 'Allreduce'],
  'advanced-strong-weak-scaling': ['120/42', '20/25', '0.8'],
  'advanced-mpi-point-to-point': ['tag 4', 'tag 5', 'unmatched'],
  'advanced-slurm': ['--ntasks=4', '--cpus-per-task=2', '8'],
  'advanced-checkpointing': ['401', '500500', '600'],
  'advanced-mpi-rma': ['closing fence', '9', 'completion'],
  'advanced-v05-mpi-communicators': ['key(1)=5', 'key(3)=1', 'breaking ties by old rank'],
  'advanced-v05-mpi-ranks': ['[1,3]', '0..1', '[3,1]']
};

test('all ten evidence records have model, counterexample, offline lab, and precise sources', () => {
  assert.equal(Object.keys(lessons).length, 138);
  for (const id of ids) {
    const item = lessons[id];
    assert.ok(item, id);
    assert.equal(item.reasoningSteps.length, 6, id);
    assert.equal(item.labPlan.length, 6, id);
    assert.ok(item.reasoningSteps.some(x => /counterexample|falsif|misconception/i.test(x)), id);
    assert.ok(item.labPlan.some(x => /verify|check|compare|confirm|recompute/i.test(x)), id);
    assert.ok(item.reasoningSteps.some(x => /^Read /.test(x) && x.includes('https://')), id);
    const passage = [...item.reasoningSteps, ...item.labPlan].join(' ');
    for (const phrase of anchors[id]) assert.ok(passage.includes(phrase), id + ': missing ' + phrase);
  }
});

test('roofline arithmetic maintains decimal units and detects the ridge transition', () => {
  // GFLOP/s and GB/s yield FLOP/byte for their ratio, without any measured hardware claim.
  const roof = (peakGflops, bandwidthGBps, flopsPerByte) =>
    Math.min(peakGflops, bandwidthGBps * flopsPerByte);
  assert.equal(1000 / 100, 10);
  assert.equal(roof(1000, 100, 2), 200);
  assert.equal(roof(1000, 100, 10), 1000);
  assert.equal(roof(1000, 100, 20), 1000);
  assert.equal(1000 / 50, 20);
  assert.equal(roof(1000, 50, 2), 100);
  assert.equal(roof(1000, 50, 20), 1000);
  assert.notEqual(roof(1000, 50, 2), 200);
});

test('strong and weak scaling obey different workload invariants', () => {
  const strong = (t1, tp, processes) => ({
    speedup: t1 / tp, efficiency: t1 / (processes * tp)
  });
  assert.ok(close(strong(120, 42, 4).speedup, 20 / 7));
  assert.ok(close(strong(120, 42, 4).efficiency, 5 / 7));
  assert.equal(strong(120, 30, 4).efficiency, 1);
  const weakEfficiency = 20 / 25; // constant work per process, fourfold total work
  assert.equal(weakEfficiency, 0.8);
  assert.notEqual(weakEfficiency, strong(120, 42, 4).efficiency);
});

test('MPI message matching rejects wrong tag, communicator, sender and destination', () => {
  const matches = (send, recv) => ['comm', 'src', 'dst', 'tag'].every(k => send[k] === recv[k]);
  const send = { comm: 'WORLD', src: 2, dst: 1, tag: 8, payload: 17 };
  assert.equal(matches(send, { ...send }), true);
  for (const mismatch of [
    { tag: 9 }, { comm: 'SUB' }, { src: 1 }, { dst: 2 }
  ]) assert.equal(matches(send, { ...send, ...mismatch }), false);
  assert.equal(matches(send, { ...send, payload: 22 }), true); // payload is not a match key
});

test('rooted broadcast, rooted reduction and all-reduction have distinct results', () => {
  const data = [2, 3, 5, 7];
  const broadcast = data.map(() => 11);
  const total = data.reduce((a, b) => a + b, 0);
  const rootedReduction = data.map((_, rank) => rank === 0 ? total : undefined);
  const allReduction = data.map(() => total);
  assert.deepEqual(broadcast, [11, 11, 11, 11]);
  assert.deepEqual(rootedReduction, [17, undefined, undefined, undefined]);
  assert.deepEqual(allReduction, [17, 17, 17, 17]);
  assert.notDeepEqual(rootedReduction, allReduction);
});

test('checkpoint reconstruction does not double-count or omit post-checkpoint units', () => {
  const sum = (lo, hi) => {
    let total = 0;
    for (let n = lo; n <= hi; n++) total += n;
    return total;
  };
  const reference = sum(1, 1000);
  assert.equal(reference, 500500);
  for (const checkpoint of [400, 700]) {
    const persisted = sum(1, checkpoint);
    const resumed = persisted + sum(checkpoint + 1, 1000);
    assert.equal(resumed, reference);
    assert.equal(1000 - checkpoint, checkpoint === 400 ? 600 : 300);
    assert.notEqual(persisted + sum(checkpoint + 61, 1000), reference); // skipped work
    assert.notEqual(persisted + sum(checkpoint, 1000), reference); // duplicate boundary
  }
});

test('MPI_Comm_split ordering is based on key with deterministic old-rank tie breaking', () => {
  const split = records => {
    const groups = new Map();
    for (const r of records) {
      if (!groups.has(r.color)) groups.set(r.color, []);
      groups.get(r.color).push(r);
    }
    return [...groups.values()].flatMap(group =>
      group.sort((a, b) => a.key - b.key || a.oldRank - b.oldRank)
        .map((r, localRank) => ({ oldRank: r.oldRank, localRank }))
    ).sort((a, b) => a.oldRank - b.oldRank).map(r => r.localRank);
  };
  const rows = [0, 1, 2, 3].map(oldRank => ({
    oldRank, color: oldRank % 2, key: oldRank
  }));
  assert.deepEqual(split(rows), [0, 0, 1, 1]);
  assert.deepEqual(split(rows.map(r => ({
    ...r, key: r.oldRank === 1 ? 5 : r.oldRank === 3 ? 1 : r.key
  }))), [0, 1, 1, 0]);
  assert.deepEqual(split(rows.map(r => ({ ...r, key: 0 }))), [0, 0, 1, 1]);
  assert.deepEqual(split(rows.map(r => ({
    ...r, color: r.oldRank === 2 ? 1 : r.color
  }))), [0, 0, 1, 2]);
});

test('Slurm CPU request arithmetic is not a claim that a job ran', () => {
  const nominal = (tasks, cpusPerTask) => tasks * cpusPerTask;
  assert.equal(nominal(4, 2), 8);
  assert.equal(nominal(4, 3), 12);
  const state = { submitted: true, allocated: false, launched: false, completed: false };
  assert.equal(state.submitted && state.completed, false);
});

test('fence-epoch model refuses unsynchronized remote visibility', () => {
  // This intentionally models only an MPI_Win_fence epoch, not local load/store coherence.
  const trace = ['begin', 'put', 'finish', 'read'];
  const completed = events => {
    const put = events.indexOf('put'), finish = events.indexOf('finish');
    const read = events.indexOf('read');
    return put >= 0 && finish > put && read > finish;
  };
  assert.equal(completed(trace), true);
  assert.equal(completed(['begin', 'put', 'read']), false);
  assert.equal(completed(['begin', 'read', 'put', 'finish']), false);
  assert.equal(completed(['begin', 'finish', 'put', 'read']), false);
});

test('subcommunicator destinations use local, not world, ranks', () => {
  const world = [0, 1, 2, 3], subset = [1, 3];
  assert.equal(world.indexOf(3), 3);
  assert.equal(subset.indexOf(3), 1);
  const valid = (destination, size) => Number.isInteger(destination) &&
    destination >= 0 && destination < size;
  assert.equal(valid(3, subset.length), false);
  assert.equal(valid(1, subset.length), true);
  assert.equal([3, 1].indexOf(3), 0);
});
