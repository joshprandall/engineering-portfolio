'use strict';
// Independent deterministic algorithm oracles; synthetic data, no network or production access.
const test=require('node:test');
const assert=require('node:assert/strict');

test('ordered and unordered pairs and triangular iteration formulas',()=>{
 for(let n=0;n<=64;n++){
  let ordered=0,unordered=0,triangular=0;
  for(let i=0;i<n;i++){
   for(let j=0;j<n;j++){if(i!==j)ordered++;if(i<j)unordered++}
   for(let j=0;j<=i;j++)triangular++;
  }
  assert.equal(ordered,n===0?0:n*(n-1),'ordered n='+n);
  assert.equal(unordered,n===0?0:n*(n-1)/2,'unordered n='+n);
  assert.equal(triangular,n*(n+1)/2,'triangular n='+n);
 }
});

test('inclusive binary search matches exhaustive membership and comparison bounds',()=>{
 function search(n,target){
  let lo=0,hi=n-1,checks=0;
  while(lo<=hi){
   checks++;const mid=Math.floor((lo+hi)/2);
   if(mid===target)return {index:mid,checks};
   if(mid<target)lo=mid+1;else hi=mid-1;
  }
  return {index:-1,checks};
 }
 for(let n=1;n<=128;n++)for(let target=-1;target<=n;target++){
  const r=search(n,target);
  assert.equal(r.index,target>=0&&target<n?target:-1,'n='+n+' target='+target);
  assert.ok(r.checks<=Math.floor(Math.log2(n))+1,'bound n='+n+' target='+target);
 }
 assert.equal(search(1024,1024).checks,11);
 assert.equal(search(1024,-1).checks,10);
});

test('BFS equals independent Floyd-Warshall on every undirected five-vertex graph',()=>{
 const n=5,pairs=[];
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)pairs.push([i,j]);
 assert.equal(pairs.length,10);
 for(let mask=0;mask<(1<<pairs.length);mask++){
  const g=Array.from({length:n},()=>[]);
  const d=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?0:Infinity));
  for(let e=0;e<pairs.length;e++)if(mask&(1<<e)){
   const [i,j]=pairs[e];g[i].push(j);g[j].push(i);d[i][j]=d[j][i]=1;
  }
  for(let k=0;k<n;k++)for(let i=0;i<n;i++)for(let j=0;j<n;j++)
   d[i][j]=Math.min(d[i][j],d[i][k]+d[k][j]);
  for(let start=0;start<n;start++){
   const distance=Array(n).fill(Infinity),q=[start];distance[start]=0;
   for(let head=0;head<q.length;head++)for(const v of g[q[head]]){
    if(distance[v]===Infinity){distance[v]=distance[q[head]]+1;q.push(v)}
   }
   assert.deepEqual(distance,d[start],'mask='+mask+' source='+start);
  }
 }
});

test('DAG path-count DP equals independently enumerated paths for all ordered five-node DAGs',()=>{
 const n=5,choices=[];
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)choices.push([i,j]);
 for(let mask=0;mask<(1<<choices.length);mask++){
  const g=Array.from({length:n},()=>[]);
  for(let e=0;e<choices.length;e++)if(mask&(1<<e)){
   const [i,j]=choices[e];g[i].push(j);
  }
  const ways=Array(n).fill(0);ways[0]=1;
  for(let u=0;u<n;u++)for(const v of g[u])ways[v]+=ways[u];
  function enumerate(u){return u===n-1?1:g[u].reduce((sum,v)=>sum+enumerate(v),0)}
  assert.equal(ways[n-1],enumerate(0),'mask='+mask);
 }
});

test('negative-edge acyclic shortest paths agree by Bellman-Ford, topological DP, and DFS',()=>{
 const n=5;
 for(let fixture=0;fixture<160;fixture++){
  const edges=[];
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
   if((fixture+i*7+j*11)%4!==0)
    edges.push([i,j,((fixture*3+i*5-j*7)%12+12)%12-4]);
  }
  const relax=Array(n).fill(Infinity);relax[0]=0;
  for(let k=0;k<n-1;k++)for(const [i,j,w] of edges)
   relax[j]=Math.min(relax[j],relax[i]+w);
  const topo=Array(n).fill(Infinity);topo[0]=0;
  for(let i=0;i<n;i++)for(const [u,v,w] of edges)
   if(u===i)topo[v]=Math.min(topo[v],topo[i]+w);
  function enumerate(u){
   if(u===n-1)return 0;
   let best=Infinity;
   for(const [i,j,w] of edges)if(i===u)best=Math.min(best,w+enumerate(j));
   return best;
  }
  assert.deepEqual(relax,topo,'fixture='+fixture);
  assert.equal(relax[n-1],enumerate(0),'fixture='+fixture);
 }
});

test('dynamic array doubling bounds copied elements and total writes',()=>{
 for(let n=1;n<=256;n++){
  let cap=1,size=0,copies=0;
  for(let i=0;i<n;i++){
   if(size===cap){copies+=size;cap*=2}
   size++;
  }
  assert.ok((size<=cap&&size>cap/2)||(size===1&&cap===1),'n='+n);
  assert.ok(copies<2*n,'copies n='+n);
  assert.ok(size+copies<3*n,'writes n='+n);
  if(n===17)assert.deepEqual([cap,copies,size+copies],[32,31,48]);
 }
});

test('coin-change minimums match an independent BFS for every amount to 70',()=>{
 const coins=[1,3,4],dp=Array(71).fill(Infinity);dp[0]=0;
 for(let a=1;a<dp.length;a++)for(const c of coins)
  if(c<=a)dp[a]=Math.min(dp[a],dp[a-c]+1);
 const bfs=Array(71).fill(Infinity),q=[0];bfs[0]=0;
 for(let h=0;h<q.length;h++)for(const c of coins){
  const next=q[h]+c;
  if(next<bfs.length&&bfs[next]===Infinity){bfs[next]=bfs[q[h]]+1;q.push(next)}
 }
 assert.deepEqual(dp,bfs);
 assert.deepEqual(dp.slice(0,7),[0,1,2,1,1,2,2]);
 let rem=6,greedy=0;
 for(const c of [4,3,1]){greedy+=Math.floor(rem/c);rem%=c}
 assert.equal(greedy,3);assert.equal(dp[6],2);
});
