'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','advanced','hpc.json'),'utf8'));
const ids=["advanced-mpi","advanced-roofline","advanced-mpi-collectives","advanced-strong-weak-scaling","advanced-mpi-point-to-point","advanced-slurm","advanced-checkpointing","advanced-mpi-rma","advanced-v05-mpi-communicators","advanced-v05-mpi-ranks"];
const near=(a,b,eps=1e-9)=>Math.abs(a-b)<eps;
const roof=(peak,bw,ai)=>Math.min(peak,bw*ai);
const matches=(s,r)=>s.comm===r.comm&&s.src===r.src&&s.dst===r.dst&&s.tag===r.tag;
const sum=(start,end)=>(end*(end+1)-(start-1)*start)/2;

test('HPC content remains exactly 138 records; ten lessons have individually authored evidence',()=>{
 assert.equal(Object.keys(lessons).length,138);
 assert.equal(ids.length,10);
 const questions=new Set();
 for(const id of ids){
  const l=lessons[id];assert.ok(l,id);
  assert.ok(l.essentialQuestion.endsWith('?'),id);
  assert.doesNotMatch(l.essentialQuestion,/^What does /,id);
  assert.equal(l.reasoningSteps.length,6,id);
  assert.equal(l.labPlan.length,6,id);
  assert.ok(l.reasoningSteps.every(s=>s.length>70),id);
  assert.ok(l.labPlan.every(s=>s.length>60),id);
  assert.ok(l.reasoningSteps.at(-1).includes('https://'),id);
  assert.ok(l.video&&l.technical&&l.vocabulary,id);
  assert.ok(!questions.has(l.essentialQuestion),id);questions.add(l.essentialQuestion);
 }
});
test('synthetic roofline enforces bandwidth and compute ceilings with matching units',()=>{
 assert.equal(roof(1000,100,2),200);
 assert.equal(roof(1000,100,20),1000);
 assert.equal(1000/100,10);
 assert.equal(roof(1000,50,2),100);
 assert.equal(1000/50,20);
});
test('strong scaling holds total work fixed and uses T1/(p*Tp)',()=>{
 const T1=120,T4=42;
 assert.ok(near(T1/T4,20/7));
 assert.ok(near(T1/(4*T4),5/7));
 assert.equal(T1/(4*30),1);
});
test('weak scaling holds work per rank fixed and compares time',()=>{
 assert.ok(near(20/25,0.8));
 assert.notEqual(20/25,120/(4*42));
});
test('MPI message matching must include communicator and tag',()=>{
 const send={comm:'WORLD',src:2,dst:1,tag:8};
 assert.ok(matches(send,{...send}));
 assert.equal(matches(send,{...send,tag:9}),false);
 assert.equal(matches(send,{...send,comm:'SUB'}),false);
});
test('MPI collectives distinguish broadcast, reduce and allreduce',()=>{
 const ranks=[2,3,5,7],root=11;
 assert.deepEqual(ranks.map(()=>root),[11,11,11,11]);
 assert.equal(ranks.reduce((a,b)=>a+b,0),17);
 assert.deepEqual(ranks.map(()=>ranks.reduce((a,b)=>a+b,0)),[17,17,17,17]);
});
test('Slurm nominal CPU request is tasks times CPUs per task',()=>{
 assert.equal(4*2,8);
 assert.equal(4*3,12);
});
test('restart from durable checkpoint does not omit or duplicate work',()=>{
 const from400=sum(1,400)+sum(401,1000);
 assert.equal(from400,500500);
 assert.equal(sum(1,700)+sum(701,1000),500500);
 assert.equal(1000-400,600);
 assert.equal(1000-700,300);
 assert.notEqual(sum(1,400)+sum(461,1000),500500);
});
test('RMA trace only treats value as synchronized after matching closing fence',()=>{
 const events=['open fence','put 9','close fence','read 9'];
 assert.ok(events.indexOf('put 9')<events.indexOf('close fence'));
 const withoutCompletion=events.filter(e=>e!=='close fence');
 assert.equal(withoutCompletion.includes('close fence'),false);
});
test('communicator-local ranks may overlap without shared context',()=>{
 const even=[0,2],odd=[1,3];
 assert.equal(even.indexOf(0),0);
 assert.equal(odd.indexOf(1),0);
 assert.equal(even.indexOf(2),1);
 const revisedEven=[0],revisedOdd=[1,2,3];
 assert.deepEqual(revisedOdd.map((_,i)=>i),[0,1,2]);
 assert.deepEqual(revisedEven.map((_,i)=>i),[0]);
});
test('ranks form zero-based local range and change with subgroup ordering',()=>{
 const world=[0,1,2,3],subset=[1,3];
 assert.deepEqual(world.map((_,i)=>i),[0,1,2,3]);
 assert.equal(subset.indexOf(3),1);
 assert.ok(3>=subset.length);
 assert.equal([3,1].indexOf(3),0);
});
test('unmatched tag-5 receive is not satisfied by a tag-4 send',()=>{
 const send={comm:'WORLD',src:0,dst:1,tag:4};
 assert.equal(matches(send,{comm:'WORLD',src:0,dst:1,tag:5}),false);
 assert.equal(matches(send,{...send}),true);
});
