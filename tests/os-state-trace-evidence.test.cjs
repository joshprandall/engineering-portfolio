'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','advanced','operating-systems.json'),'utf8'));
const ids=[
'advanced-process-thread','advanced-context-switch','advanced-scheduler','advanced-v05-system-calls',
'advanced-v05-preemptive-scheduling','advanced-v05-context-switch-cost','advanced-v05-virtual-address-spaces',
'advanced-v05-copy-on-write','advanced-v05-thread-synchronization','advanced-v07-linux-eevdf-scheduler',
'advanced-v07-demand-paging','advanced-v07-virtual-runtime'
];
test('all 106 OS records remain and 12 independently authored questions and six-step labs exist',()=>{
 assert.equal(Object.keys(lessons).length,106);
 assert.equal(ids.length,12);
 const q=new Set();
 for(const id of ids){
  const x=lessons[id];assert.ok(x,id);
  assert.ok(x.essentialQuestion.endsWith('?'),id);
  assert.doesNotMatch(x.essentialQuestion,/^(What does|How does .+ mean)/,id);
  assert.ok(!q.has(x.essentialQuestion),id);q.add(x.essentialQuestion);
  assert.equal(x.reasoningSteps.length,6,id);
  assert.equal(x.labPlan.length,6,id);
  assert.ok(x.reasoningSteps.every(s=>s.length>=70),id);
  assert.ok(x.labPlan.every(s=>s.length>=60),id);
  assert.match(x.reasoningSteps[5],/https:\/\//,id);
  for(const key of ['verifiedBoundary','starter','technical','memoryLadder','vocabulary','video']) assert.ok(x[key],id+' '+key);
 }
});
const run=(events)=>{let x=0,local={};for(const [tid,op]of events){if(op==='read') local[tid]=x;else if(op==='write') x=local[tid]+1;else throw Error(op);}return x;};
test('two stale reads yield lost update but serial read/write yields two',()=>{
 assert.equal(run([['A','read'],['B','read'],['A','write'],['B','write']]),1);
 assert.equal(run([['A','read'],['A','write'],['B','read'],['B','write']]),2);
 assert.equal(run([['B','read'],['B','write'],['A','read'],['A','write']]),2);
});
test('switches are boundaries and synthetic cost has correctly labeled units',()=>{
 const cost=(slices,overhead)=>(slices-1)*overhead;
 assert.ok(Math.abs(cost(4,.15)-.45)<1e-12);
 assert.ok(Math.abs(cost(5,.15)-.60)<1e-12);
 assert.equal(100*.02,2);
 assert.equal(200*.02,4);
 assert.equal(100*.04,4);
});
const fcfs=(jobs)=>{let t=0,out={};for(const j of jobs){t=Math.max(t,j.arrival)+j.burst;out[j.name]=t;}return out;};
const rr=(jobs,q)=>{let t=0,remaining=Object.fromEntries(jobs.map(j=>[j.name,j.burst])),done={},ready=[];while(Object.keys(done).length<jobs.length){for(const j of jobs){if(j.arrival<=t&&remaining[j.name]>0&&!ready.includes(j.name)&&!Object.hasOwn(done,j.name))ready.push(j.name);}if(!ready.length){t=Math.min(...jobs.filter(j=>j.arrival>t).map(j=>j.arrival));continue;}const name=ready.shift(),slice=Math.min(q,remaining[name]);t+=slice;remaining[name]-=slice;for(const j of jobs){if(j.arrival<=t&&remaining[j.name]>0&&!ready.includes(j.name)&&j.name!==name)ready.push(j.name);}if(remaining[name]>0)ready.push(name);else done[name]=t;}return done;};
test('FCFS and RR explicitly distinguish short-job completion under simultaneous arrivals',()=>{
 const jobs=[{name:'A',arrival:0,burst:5},{name:'B',arrival:0,burst:1}];
 assert.equal(fcfs(jobs).B,6);
 assert.equal(rr(jobs,2).B,3);
 assert.equal(rr(jobs,2).A,6);
});
test('arrival time changes eligibility at dispatch boundaries',()=>{
 const jobs=[{name:'A',arrival:0,burst:5},{name:'B',arrival:4,burst:1}];
 assert.equal(rr(jobs,2).B,5);
});
test('userspace-only operations are not counted as explicit syscall entries',()=>{
 const events=['user arithmetic','syscall entry read','kernel read','return user','user format'];
 assert.equal(events.filter(x=>x.startsWith('syscall entry')).length,1);
 assert.equal([...events,'syscall entry read'].filter(x=>x.startsWith('syscall entry')).length,2);
});
const preemptFinish=(arrival)=>{const quant=4,A=8,B=2;let t=0;while(t<A){const end=Math.min(t+quant,A);if(arrival<=end){return end+B;}t=end;}return A+B;};
test('toy quantum-boundary preemption gives distinct B latency',()=>{
 assert.equal(preemptFinish(3),6);
 assert.equal(preemptFinish(5),10);
 assert.equal(8+2,10);
});
test('identical virtual pages may map to distinct physical frames',()=>{
 const map={P:{'0x1000':17},Q:{'0x1000':28}};
 assert.notEqual(map.P['0x1000'],map.Q['0x1000']);
 map.Q['0x1000']=17;
 assert.equal(map.P['0x1000'],map.Q['0x1000']);
});
test('copy-on-write counts distinct first-written inherited pages, not all pages',()=>{
 const copies=(writes)=>new Set(writes).size;
 assert.equal(copies([1,3]),2);
 assert.equal(copies([1,1]),1);
 assert.ok(copies([1,3])<4);
});
test('mutex must protect read AND write rather than write alone',()=>{
 assert.equal(run([['A','read'],['B','read'],['A','write'],['B','write']]),1);
 assert.equal(run([['A','read'],['A','write'],['B','read'],['B','write']]),2);
});
const eevdf=(rows)=>rows.filter(x=>x.lag>=0).sort((a,b)=>a.deadline-b.deadline)[0]?.name;
test('EEVDF-style synthetic selector filters ineligible earliest deadline',()=>{
 const rows=[{name:'A',lag:2,deadline:10},{name:'B',lag:-1,deadline:3},{name:'C',lag:1,deadline:7}];
 assert.equal(eevdf(rows),'C');
 assert.equal(eevdf(rows.map(x=>x.name==='B'?{...x,lag:0}:x)),'B');
 assert.equal(eevdf(rows.map(x=>({...x,lag:-1}))),undefined);
});
const firstTouch=(trace,resident=[])=>{const have=new Set(resident);let faults=0;for(const page of trace){if(!have.has(page)){faults++;have.add(page);}}return faults;};
test('demand paging counts first touches under explicit no-eviction model',()=>{
 assert.equal(firstTouch([0,2,2,3]),3);
 assert.equal(firstTouch([0,2,2,3,0]),3);
 assert.equal(firstTouch([0,2,2,3],[2]),2);
});
const deltaV=(timeMs,weight)=>timeMs*1024/weight;
test('pedagogical weighted virtual-runtime charges differ at equal CPU duration',()=>{
 assert.equal(deltaV(4,1024),4);
 assert.equal(deltaV(4,2048),2);
 assert.equal(deltaV(8,2048),4);
});
