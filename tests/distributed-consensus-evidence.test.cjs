'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','advanced','distributed-systems.json'),'utf8'));
const ids=['advanced-consensus','advanced-replication','advanced-leader-election','advanced-consistency-models','advanced-quorum','advanced-v05-logical-clocks','advanced-v05-happens-before','advanced-v05-raft-leaders','advanced-v05-raft-terms','advanced-v05-raft-commit-rule'];
const majority=n=>Math.floor(n/2)+1;

test('ten independently authored lessons preserve 108 records and evidence companions',()=>{
 assert.equal(Object.keys(lessons).length,108);
 const questions=new Set();
 for(const id of ids){
  const l=lessons[id];assert.ok(l,id);
  assert.ok(l.essentialQuestion.endsWith('?'),id);
  assert.doesNotMatch(l.essentialQuestion,/^what does .+ mean, why does it matter/i);
  assert.equal(questions.has(l.essentialQuestion),false);questions.add(l.essentialQuestion);
  for(const key of ['reasoningSteps','labPlan']){
   assert.equal(l[key].length,6,id+' '+key);
   assert.equal(new Set(l[key]).size,6,id+' '+key);
   for(const step of l[key])assert.ok(step.length>=110,id+' '+key);
  }
  assert.ok(l.reasoningSteps.some(s=>s.includes('https://')));
  assert.ok(l.labPlan.some(s=>/synthetic|offline/i.test(s)));
  for(const key of ['verifiedBoundary','technical','starter','memoryLadder','vocabulary','video'])assert.ok(l[key],id+' '+key);
 }
});

test('three and five server majorities disallow isolated-election claims',()=>{
 assert.equal(majority(3),2);assert.equal(majority(5),3);
 assert.equal([true,true,false].filter(Boolean).length>=majority(3),true);
 assert.equal([true,false,false].filter(Boolean).length>=majority(3),false);
});

test('all three-of-five quorums overlap, while two-of-five need not',()=>{
 const names=['A','B','C','D','E'],sets=[];
 for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)for(let k=j+1;k<5;k++)sets.push(new Set([names[i],names[j],names[k]]));
 assert.equal(sets.length,10);
 for(const a of sets)for(const b of sets)assert.ok([...a].some(x=>b.has(x)));
 assert.equal(['A','B'].some(x=>new Set(['D','E']).has(x)),false);
});

test('Raft election log freshness uses term before index',()=>{
 const eligible=(c,v)=>c.term>v.term||(c.term===v.term&&c.index>=v.index);
 assert.equal(eligible({term:4,index:20},{term:5,index:12}),false);
 assert.equal(eligible({term:5,index:20},{term:5,index:12}),true);
 assert.equal(eligible({term:6,index:1},{term:5,index:12}),true);
 assert.equal(eligible({term:5,index:11},{term:5,index:12}),false);
});

test('a local replicated-log append is not a majority acknowledgement',()=>{
 assert.equal(new Set(['A']).size>=majority(3),false);
 assert.equal(new Set(['A','B']).size>=majority(3),true);
});

test('Raft new leader requires current-term majority to commit old-term prefix',()=>{
 const leaderTerm=3,match=[5,5,4,3,2],entryTerm={4:2,5:3};
 const canCommit=n=>entryTerm[n]===leaderTerm&&match.filter(m=>m>=n).length>=majority(5);
 assert.equal(canCommit(4),false,'old-term entry not directly committed by current leader counting replicas');
 assert.equal(canCommit(5),false,'current-term entry has two matches');
 match[2]=5;assert.equal(canCommit(5),true);
 const commitIndex=canCommit(5)?5:0;assert.ok(commitIndex>=4);
});

test('Lamport receive update preserves message causality, not timestamp converse',()=>{
 const receive=(local,msg)=>Math.max(local,msg)+1;
 assert.equal(receive(5,4),6);assert.equal(receive(1,4),5);
 assert.ok(2<4,'lower timestamp on unrelated process is not a proof of causation');
});

test('happens-before transitive reachability leaves independent events concurrent',()=>{
 const graph={a:['b'],b:['c'],c:['d'],d:[],x:[]};
 const reachable=(a,b)=>{const queue=[...graph[a]],seen=new Set();while(queue.length){const v=queue.pop();if(v===b)return true;if(!seen.has(v)){seen.add(v);queue.push(...graph[v]);}}return false;};
 assert.equal(reachable('a','d'),true);
 assert.equal(reachable('x','d'),false);assert.equal(reachable('d','x'),false);
 graph.x.push('b');assert.equal(reachable('x','d'),true);
});

test('nonoverlapping write then stale read contradict single-object linearizability',()=>{
 const write={start:1,finish:2,value:1},read={start:3,finish:4,result:0};
 assert.ok(write.finish<read.start);
 assert.notEqual(read.result,write.value);
 const overlap={...read,start:1};
 assert.equal(write.finish<overlap.start,false);
});

test('monotone term and single vote per term reject delayed competitors',()=>{
 let state={term:5,votedFor:'A'};
 function vote(term,forCandidate,logFresh=true){
  if(term<state.term)return false;
  if(term>state.term)state={term,votedFor:null};
  if(!logFresh||(state.votedFor!==null&&state.votedFor!==forCandidate))return false;
  state.votedFor=forCandidate;return true;
 }
 assert.equal(vote(5,'C'),false);assert.equal(vote(4,'D'),false);
 assert.deepEqual(state,{term:5,votedFor:'A'});
 assert.equal(vote(6,'C'),true);assert.deepEqual(state,{term:6,votedFor:'C'});
 assert.equal(vote(6,'D'),false);
});

test('valid higher-term RequestVote forces old Raft leader to step down',()=>{
 let role='leader',term=6;
 const incoming=7;if(incoming>term){term=incoming;role='follower';}
 assert.deepEqual({role,term},{role:'follower',term:7});
});
