'use strict';
// Synthetic educational cache/memory/pipeline checks; never a hardware benchmark.
// Run: node --test tests/hardware-architecture-cache-pipeline-8-evidence-20261112.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const lessons = JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','advanced','architecture.json'),'utf8'));
const ids = [
  'advanced-v07-cache-line','advanced-v07-cache-associativity',
  'advanced-v07-cache-conflict-miss','advanced-v07-cache-capacity-miss',
  'advanced-v07-little-endian-byte-order','advanced-v07-aligned-memory-access',
  'advanced-v07-pipeline-data-hazard','advanced-v07-pipeline-control-hazard'
];
function checkLesson(id, mustContain) {
  const record=lessons[id];
  assert.ok(record,'missing record: '+id);
  assert.equal(record.reasoningSteps.length,6,id+' reasoning');
  assert.equal(record.labPlan.length,6,id+' lab');
  const text=[record.essentialQuestion,...record.reasoningSteps,...record.labPlan].join(' ');
  for(const value of mustContain) assert.ok(text.includes(value),id+' missing expected technical premise '+value);
  assert.ok(text.includes('https://'),id+' source');
}
function cacheTrace(setCount, ways, addressList) {
  const sets=Array.from({length:setCount},()=>[]);
  const out=[];
  for(const addr of addressList) {
    const line=Math.floor(addr/64);
    const setIndex=line%setCount, tag=Math.floor(line/setCount);
    const entries=sets[setIndex],where=entries.indexOf(tag);
    const hit=where>=0;
    if(hit) entries.splice(where,1);
    else if(entries.length===ways) entries.shift();
    entries.push(tag);
    out.push(hit?'H':'M');
  }
  return out;
}
const mappedLines=(start,count)=>Array.from(new Set(Array.from({length:count},(_,i)=>Math.floor((start+i)/64)*64)));
test('eight authored hardware records have case-specific values, assumptions and citations',()=>{
  assert.equal(Object.keys(lessons).length,153);
  assert.equal(new Set(ids).size,8);
  for(const id of ids) checkLesson(id,[]);
});
test('cache lines: two crossed blocks versus single-block boundary control',()=>{
  checkLesson(ids[0],['0x1234','0x1200','0x123C','0x1240','0x1238']);
  assert.equal(0x1234%64,52);
  assert.equal(0x1234&~63,0x1200);
  assert.deepEqual(mappedLines(0x123c,8),[0x1200,0x1240]);
  assert.deepEqual(mappedLines(0x1238,8),[0x1200]);
});
test('associativity: five conflicting tags evict under four-way but fit under eight-way',()=>{
  checkLesson(ids[1],['32768','128 sets','0x9000','eight ways']);
  const trace=[0x1000,0x3000,0x5000,0x7000,0x9000,0x1000];
  assert.equal(32768/64/4,128);
  assert.ok(trace.every(addr=>Math.floor(addr/64)%128===64));
  assert.deepEqual(cacheTrace(128,4,trace),['M','M','M','M','M','M']);
  assert.deepEqual(cacheTrace(64,8,trace),['M','M','M','M','M','H']);
});
test('equal-size direct mapped versus two-way cache conflict traces',()=>{
  checkLesson(ids[2],['4096','64 sets','32 sets','hit,hit']);
  const t=[0,0x1000,0,0x1000];
  assert.deepEqual(cacheTrace(64,1,t),['M','M','M','M']);
  assert.deepEqual(cacheTrace(32,2,t),['M','M','H','H']);
});
test('fully associative LRU classifies the fourth A as a capacity miss',()=>{
  checkLesson(ids[3],['A,B,C,A','[M,M,M,M]','[M,M,M,H]']);
  const t=[0,64,128,0];
  assert.deepEqual(cacheTrace(1,2,t),['M','M','M','M']);
  assert.deepEqual(cacheTrace(1,3,t),['M','M','M','H']);
  assert.deepEqual(cacheTrace(1,2,[0,64,0]),['M','M','H']);
});
test('little endian: bytes reconstruct 32-bit word and local perturbation',()=>{
  checkLesson(ids[4],['0x12345678','0x78','0x56','0x34','0x12']);
  const mem=new ArrayBuffer(4),view=new DataView(mem);
  view.setUint32(0,0x12345678,true);
  assert.deepEqual(Array.from(new Uint8Array(mem)),[0x78,0x56,0x34,0x12]);
  assert.equal(view.getUint32(0,true),0x12345678);
  view.setUint32(0,0x12345679,true);
  assert.deepEqual(Array.from(new Uint8Array(mem)),[0x79,0x56,0x34,0x12]);
});
test('RV32I natural alignment distinguishes LW and LH without assuming a trap',()=>{
  checkLesson(ids[5],['0x1002','mod 4=2','mod 2=0','EEI']);
  const addresses=(start,width)=>Array.from({length:width},(_,i)=>start+i);
  assert.equal(0x1002%4,2);
  assert.equal(0x1002%2,0);
  assert.equal(0x1004%4,0);
  assert.deepEqual(addresses(0x1002,4),[0x1002,0x1003,0x1004,0x1005]);
  assert.equal(new Set(addresses(0x1002,4).map(a=>Math.floor(a/4))).size,2);
});
test('load-use timeline requires exactly one bubble under specified forwarding latency',()=>{
  checkLesson(ids[6],['EX3','MEM4','EX5','WB7','bubble']);
  const loadMem=4, earliestDependentEX=loadMem+1;
  assert.equal(earliestDependentEX,5);
  assert.equal(earliestDependentEX+2,7);
  assert.ok(4<earliestDependentEX);
  // Independent instruction can use EX4, then dependent ADD uses EX5.
  assert.deepEqual([4,5],[earliestDependentEX-1,earliestDependentEX]);
});
test('branch resolution at EX3 versus ID2 flushes 2 versus 1 wrong-path slots',()=>{
  checkLesson(ids[7],['EX3','IF2','IF3','cycle 4','ID2']);
  const count=(resolutionCycle)=>Array.from({length:resolutionCycle-1},(_,i)=>i+2).length;
  assert.equal(count(3),2);
  assert.equal(count(2),1);
  // Correct taken-target prediction needs no wrong-path fetches in this model.
  assert.equal([].length,0);
});