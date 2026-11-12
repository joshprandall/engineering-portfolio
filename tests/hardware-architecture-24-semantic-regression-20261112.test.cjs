'use strict';
// Offline educational assertions against the authored content and explicit synthetic models.
// Run: node --test tests/hardware-architecture-24-semantic-regression-20261112.test.cjs
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const records=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../deep-learning/advanced/architecture.json'),'utf8'));
const cases=[["advanced-cpu-cycle",["x1=4","x2=4+5=9","x3=4+9=13","0x100C"],["x1=5,x2=10,x3=15"]],["advanced-cache-coherence",["A read obtains Exclusive","B read makes both Shared","A write invalidates B","A Modified with 9"],["Exclusive→Modified"]],["advanced-binary",["128+32+16+4+2=182","166=0xA6"],["Clearing bit 3 does nothing"]],["advanced-boolean-logic",["A AND NOT B=1","F=1","F=0"],["output F returns to 1"]],["advanced-pipeline",["5+7-1=11","5×7=35"],["nine independent instructions","13 rather than 45 cycles"]],["advanced-branch-prediction",["20×3=60","total=1060","0.20"],["total becomes 1030"]],["advanced-isa-microarchitecture",["A=1e6×2/1e9=0.002s","B=1e6×1.5/1.5e9=0.001s"],["1.5ms"]],["advanced-riscv-isa",["x5=7","x5=5","x0 is discarded","0x200C"],["0xFFFFFFFF"]],["advanced-registers",["4294967295","−1","wraps to 0"],["stored word 1"]],["advanced-out-of-order",["60 at cycle 4","13 at cycle 2","73 at cycle 5"],["waits until cycle 7"]],["advanced-superscalar",["ceil(6/2)=3","at least six"],["width 3 independent bound becomes 2"]],["advanced-v05-combinational-logic",["S=0 and Cout=1","S+2×Cout"],["S=1,Cout=1"]],["advanced-v05-sequential-logic",["Q(15)=1","Q(25)=0","Q(35)=1"],["Q(25) changes to 1"]],["advanced-v05-instruction-encoding",["0x00500193"],["0x00600193"]],["advanced-v05-privilege-levels",["cause 8","mepc 0x1000","M PC0x2000","mepc to 0x1004"],["traps again"]],["advanced-v05-exceptions-and-interrupts",["0x80000007","0x00000008"],["0x8000000B"]],["advanced-v05-branch-target-prediction",["0x1004","0x1080"],["add 30 idealized cycles"]],["advanced-v05-micro-ops",["1+1+3+2=7","ceil(7/2)=4"],["ceil(4/2)=2"]],["advanced-v05-register-renaming",["r1=11","r2=7","r4=11+7=18"],["r4=28"]],["advanced-v05-retirement-and-precise-state",["x1=5","x2 stays 0"],["x2=99"]],["advanced-v05-simd-instruction-sets",["[3,5,7,9]"],["[3,5,11,9]"]],["advanced-v05-performance-monitoring-counters",["CPI=800000/400000=2","IPC=0.5","miss fraction=20000/200000=0.10"],["CPI1.5 and IPC2/3"]],["advanced-v05-risc-v-base-isa",["SLTU x7,x0,x6=1","SLT x8,x6,x0=1"],["both original comparisons produce 0"]],["advanced-v05-risc-v-vector-extension",["VLMAX=LMUL×VLEN/SEW=1×256/32=8","vl=4"],["VLMAX=4","VLMAX16"]]];
function verify(record,entry){
  assert.ok(record,'missing lesson: '+entry[0]);
  assert.equal(record.reasoningSteps.length,6);
  assert.equal(record.labPlan.length,6);
  const main=record.reasoningSteps[1], variation=record.reasoningSteps[3];
  for(const token of entry[1]){
    assert.ok(main.includes(token),entry[0]+' missing derivation '+token);
    assert.ok(record.labPlan[2].includes(token),entry[0]+' missing lab expectation '+token);
  }
  for(const token of entry[2]){
    assert.ok(variation.includes(token),entry[0]+' missing controlled variation '+token);
    assert.ok(record.labPlan[4].includes(token),entry[0]+' missing variation in lab '+token);
  }
}
test('24 unique authored hardware case IDs',()=>{
  assert.equal(cases.length,24);
  assert.equal(new Set(cases.map(x=>x[0])).size,24);
  assert.equal(Object.keys(records).length,153);
});
for(const entry of cases){
  test('main and counterfactual outcomes appear in lesson and laboratory: '+entry[0],()=>{
    const record=records[entry[0]];
    verify(record,entry);
    const bad={...record,reasoningSteps:record.reasoningSteps.slice()};
    bad.reasoningSteps[1]=bad.reasoningSteps[1].replace(entry[1][0],'<incorrect result>');
    assert.throws(()=>verify(bad,entry),/missing derivation/);
  });
}

test('RV32I register execution and encoded immediate decode', () => {
  const r=new Uint32Array(32); let pc=0x1000;
  function addi(rd,rs,imm){if(rd!==0)r[rd]=(r[rs]+imm)>>>0;pc+=4}
  function add(rd,a,b){if(rd!==0)r[rd]=(r[a]+r[b])>>>0;pc+=4}
  addi(1,0,4); addi(2,1,5); add(3,1,2);
  assert.deepEqual([r[0],r[1],r[2],r[3],pc],[0,4,9,13,0x100c]);
  addi(0,3,9); assert.equal(r[0],0);
  const encoding=((5&0xfff)<<20)|(0<<15)|(0<<12)|(3<<7)|0x13;
  assert.equal(encoding,0x00500193);
  assert.equal((encoding>>>7)&31,3);
  assert.equal((encoding>>>15)&31,0);
  assert.equal(encoding>>20,5);
});
test('32-bit interpretation and signed/unsigned comparators', () => {
  const bits=0xffffffff; const signed=bits|0; const unsigned=bits>>>0;
  assert.equal(signed,-1); assert.equal(unsigned,4294967295);
  assert.equal((unsigned+1)>>>0,0);
  assert.equal(Number(0<unsigned),1);
  assert.equal(Number(signed<0),1);
  assert.equal(Number(unsigned<0),0);
});
test('MESI state trace preserves single-writer and invalidation', () => {
  const cache={a:{state:'I',value:undefined},b:{state:'I',value:undefined}};
  const memory=7;
  cache.a={state:'E',value:memory};
  cache.a.state='S'; cache.b={state:'S',value:cache.a.value};
  cache.a={state:'M',value:9};cache.b.state='I';
  assert.equal(cache.a.value,9); assert.equal(cache.b.state,'I');
  assert.equal(Object.values(cache).filter(x=>x.state==='M').length,1);
  cache.a.state='S';cache.b={state:'S',value:cache.a.value};
  assert.equal(cache.b.value,9);
});
test('Boolean complement and full-adder exhaustive truth tables', () => {
  for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++){
    const f=(a&(~b&1))|c;
    const complement=((~a&1)|b)&(~c&1);
    assert.equal(f^complement,1);
    const sum=a^b^c,carry=(a&b)|(c&(a^b));
    assert.equal(sum+2*carry,a+b+c);
  }
  assert.equal((1&(~0&1))|0,1);
  assert.equal((1&(~1&1))|0,0);
});
test('Ideal pipelining and superscalar dependency bounds', () => {
  const finish=(stages,n)=>stages+n-1;
  assert.equal(finish(5,7),11);assert.equal(finish(5,9),13);
  const occupied=new Set();
  for(let i=0;i<7;i++)for(let stage=0;stage<5;stage++)
    occupied.add((i+1)+':'+(i+stage+1));
  assert.equal(occupied.size,35);
  assert.equal(Math.ceil(6/2),3);
  assert.equal(Math.max(...[1,2,3,4,5,6]),6);
});
test('CPI, branch recovery, counters and scalar-versus-vector bounds', () => {
  const seconds=(instructions,cpi,hz)=>instructions*cpi/hz;
  assert.equal(seconds(1e6,2,1e9),0.002);
  assert.equal(seconds(1e6,1.5,1.5e9),0.001);
  assert.equal(1000+20*3,1060);assert.equal(1000+10*3,1030);
  assert.equal(800000/400000,2);assert.equal(20000/200000,0.1);
  assert.deepEqual([2,4,6,8].map((v,i)=>v+[1,1,1,1][i]),[3,5,7,9]);
  assert.deepEqual([2,4,6,8].map((v,i)=>v+[1,1,5,1][i]),[3,5,11,9]);
});
test('Edge-triggered D sampling without asynchronous feedthrough', () => {
  const edges=[10,20,30],d=[1,0,1];
  const qAt=t=>{let q=0; for(let i=0;i<edges.length;i++) if(t>=edges[i])q=d[i];return q};
  assert.deepEqual([15,25,35].map(qAt),[1,0,1]);
  assert.equal(qAt(9),0);
  assert.equal(qAt(29),0);
});
test('RISC-V exception cause bit and privilege return address', () => {
  const decode=code=>({interrupt:code>>>31,reason:code&0x7fffffff});
  assert.deepEqual(decode(0x80000007),{interrupt:1,reason:7});
  assert.deepEqual(decode(0x00000008),{interrupt:0,reason:8});
  assert.deepEqual(decode(0x8000000b),{interrupt:1,reason:11});
  const ecallPC=0x1000,handler=0x2000,returnPC=ecallPC+4;
  assert.deepEqual([ecallPC,handler,returnPC],[0x1000,0x2000,0x1004]);
});
test('Renaming, precise retirement, and issue/retirement order models', () => {
  const oldR2=10,r3=5,first=oldR2+1,newR2=r3+2;
  assert.equal(first+newR2,18);
  assert.equal((20+1)+newR2,28);
  const finishes=[4,2,5],retires=[4,5,6];
  assert.ok(finishes[1]<finishes[0] && retires[1]>retires[0]);
  const committed={x1:5,x2:0};const speculative={x2:99};
  assert.equal(committed.x2,0);assert.notEqual(committed.x2,speculative.x2);
});
test('RISC-V vector strip sizing obeys the specified AVL boundary', () => {
  const vmax=(vlen,sew,lmul)=>vlen*lmul/sew;
  const v=vmax(256,32,1);
  assert.equal(v,8);
  const vl=(avl,max)=>avl<=max?avl:avl>=2*max?max:null;
  assert.equal(vl(4,v),4);
  assert.equal(vl(0,v),0);
  assert.equal(vl(16,v),8);
  assert.equal(vmax(256,64,1),4);
  assert.equal(vmax(256,32,2),16);
});
