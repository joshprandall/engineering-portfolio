'use strict';
// Deterministic, offline executable numerical companion: no network, dependency or production data.
const test=require('node:test');
const assert=require('node:assert/strict');
const content=require('../deep-learning/software/algorithms.json');
const ids=Object.keys(content).slice(0,24);
const picked=ids.map(id=>content[id]);
const lectures=[1,15,9,1,10,1,1,10,15,1,13,16,16,12,6,2,10,15,2,17,15,3,9,16];
const course='https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/';
test('24 specific authored lesson records, intact IDs and 6-step structures',()=>{
 assert.equal(Object.keys(content).length,111);
 assert.equal(picked.length,24);
 assert.equal(new Set(ids).size,24);
 const qs=picked.map(x=>x.essentialQuestion);
 assert.equal(new Set(qs).size,24);
 for(const [i,r] of picked.entries()){
  assert.ok(!/^What does /u.test(r.essentialQuestion),ids[i]);
  assert.equal(r.reasoningSteps.length,6,ids[i]);
  assert.equal(r.labPlan.length,6,ids[i]);
  for(const step of [...r.reasoningSteps,...r.labPlan])assert.ok(step.length>55,ids[i]);
  const source=course+'mit6_006s20_lec'+lectures[i]+'/';
  assert.ok(r.reasoningSteps[5].includes(source),ids[i]);
  assert.ok(r.labPlan[5].includes(source),ids[i]);
  assert.ok(!r.reasoningSteps[5].includes(course+'lecture-notes/'),ids[i]);
 }
});
const t=(i,title,fn)=>test(title,()=>{fn();assert.ok(picked[i].essentialQuestion.includes('?'),ids[i])});
t(0,'Big-O: ordered versus unordered pair enumeration',()=>{
 let ord=0,un=0;for(let i=0;i<8;i++)for(let j=0;j<8;j++){if(i!==j)ord++;if(i<j)un++}
 assert.equal(ord,56);assert.equal(un,28);assert.equal(ord,2*un);
});
t(1,'Recursion: exact factorial result and call count',()=>{
 let calls=0,mults=0;const f=n=>{calls++;if(n===0)return 1;mults++;return n*f(n-1)};
 assert.equal(f(6),720);assert.equal(calls,7);assert.equal(mults,6);
});
const adjacency=(edges,directed=false)=>{const out=new Map();for(const [a,b] of edges){if(!out.has(a))out.set(a,[]);if(!out.has(b))out.set(b,[]);out.get(a).push(b);if(!directed)out.get(b).push(a)}return out};
const bfs=(g,start)=>{let q=[start],head=0,dist=new Map([[start,0]]),prev=new Map();while(head<q.length){let u=q[head++];for(const v of [...(g.get(u)||[])].sort()){if(!dist.has(v)){dist.set(v,dist.get(u)+1);prev.set(v,u);q.push(v)}}}return {dist,prev}};
t(2,'Graph BFS: two equally short three-edge paths',()=>{
 let g=adjacency([['A','B'],['A','C'],['B','D'],['C','E'],['D','F'],['E','F']]);
 const {dist,prev}=bfs(g,'A');assert.equal(dist.get('F'),3);
 let path=['F'];while(prev.has(path[0]))path.unshift(prev.get(path[0]));
 assert.deepEqual(path,['A','B','D','F']);
});
t(3,'Big-O: 1,024-item absent binary search inclusive bounds',()=>{
 let a=Array.from({length:1024},(_,i)=>i),lo=0,hi=1023,count=0;
 while(lo<=hi){count++;let mid=Math.floor((lo+hi)/2);if(a[mid]===1024)break;lo=mid+1}
 assert.equal(count,11);assert.equal(lo,1024);
});
function kahn(vs,edges){let inc=new Map(vs.map(x=>[x,0])),out=new Map(vs.map(x=>[x,[]]));for(let [u,v] of edges){inc.set(v,inc.get(v)+1);out.get(u).push(v)}let queue=vs.filter(x=>inc.get(x)===0),ordered=[];while(queue.length){let u=queue.shift();ordered.push(u);for(let v of out.get(u)){inc.set(v,inc.get(v)-1);if(inc.get(v)===0)queue.push(v)}}return ordered}
t(4,'Graph DAG: valid Kahn topological precedence',()=>{
 let e=[['A','C'],['B','C'],['C','D'],['B','E']],out=kahn(['A','B','C','D','E'],e);
 assert.equal(out.length,5);for(const [u,v] of e)assert.ok(out.indexOf(u)<out.indexOf(v));assert.deepEqual(out,['A','B','C','E','D']);
});
t(5,'Recursion: successful binary-search midpoint trace',()=>{
 let a=Array.from({length:31},(_,i)=>i+1),compared=[];
 function search(lo,hi){if(lo>hi)return -1;let mid=(lo+hi)>>1;compared.push(a[mid]);return a[mid]===29?mid:a[mid]<29?search(mid+1,hi):search(lo,mid-1)}
 assert.equal(search(0,30),28);assert.deepEqual(compared,[16,24,28,30,29]);
});
t(6,'Big-O: triangular nested loops include diagonal',()=>{
 const count=n=>{let c=0;for(let i=0;i<n;i++)for(let j=0;j<=i;j++)c++;return c};
 assert.equal(count(10),55);assert.equal(count(20),210);
});
t(7,'Graph: directed cycle makes topological order impossible',()=>{
 let cycle=[['A','B'],['B','C'],['C','A']];
 assert.equal(kahn(['A','B','C'],cycle).length,0);
 assert.deepEqual(kahn(['A','B','C'],cycle.slice(0,2)),['A','B','C']);
});
t(8,'Recursion: nested list sum and structural visit counts',()=>{
 const arr=[1,[2,[3]],4];let lists=0,scalars=0,maxDepth=0;
 function sum(x,depth=0){if(!Array.isArray(x)){scalars++;return x}lists++;maxDepth=Math.max(maxDepth,depth+1);return x.reduce((a,c)=>a+sum(c,depth+1),0)}
 assert.equal(sum(arr),10);assert.deepEqual([lists,scalars,maxDepth],[3,4,3]);
});
t(9,'Big-O: linear versus quadratic exact model counts',()=>{
 assert.deepEqual([4096,4096**2],[4096,16777216]);
 assert.deepEqual([8192,8192**2],[8192,67108864]);
 assert.equal(4096*(4096-1),16773120);
});
function dijkstra(edges,from){let ns=new Set(edges.flatMap(e=>e.slice(0,2))),d=new Map([...ns].map(x=>[x,Infinity])),done=new Set();d.set(from,0);
 while(done.size<ns.size){let u=[...ns].filter(x=>!done.has(x)).sort((a,b)=>d.get(a)-d.get(b))[0];if(!u||!Number.isFinite(d.get(u)))break;done.add(u);for(let [x,v,w] of edges){if(x===u)d.set(v,Math.min(d.get(v),d.get(u)+w))}}
 return d;}
t(10,'Graph: Dijkstra weighted shortest path 7',()=>{
 let e=[['A','B',2],['A','C',5],['B','C',1],['C','D',4],['B','D',9]];
 assert.equal(dijkstra(e,'A').get('D'),7);assert.deepEqual([2+1+4,5+4,2+9].sort((a,b)=>a-b),[7,9,11]);
});
t(11,'Recursion: naive Fibonacci growth compared with memoized states',()=>{
 let count=0;const fib=n=>{count++;return n<2?n:fib(n-1)+fib(n-2)};
 assert.equal(fib(5),5);assert.equal(count,15);count=0;
 assert.equal(fib(6),8);assert.equal(count,25);
});
t(12,'Big-O: cached aggregate eliminates repeated full scans',()=>{
 const arr=Array(1000).fill(1),q=200;
 let ops=0;function sum(){let value=0;for(const x of arr){value+=x;ops++}return value}
 for(let i=0;i<q;i++)assert.equal(sum(),1000);
 assert.equal(ops,200000);
 ops=0;let cached=sum();for(let i=0;i<q;i++)assert.equal(cached,1000);
 assert.equal(ops,1000);
 arr[0]=2;assert.equal(sum(),1001);assert.notEqual(cached,1001);
});
t(13,'Graph: Bellman-Ford permits negative edge in acyclic graph',()=>{
 let e=[['S','A',4],['S','B',5],['A','B',-2],['B','T',3],['A','T',9]];
 let vertices=['S','A','B','T'],dist=Object.fromEntries(vertices.map(v=>[v,Infinity]));dist.S=0;
 for(let i=0;i<vertices.length-1;i++)for(let [u,v,w] of e)dist[v]=Math.min(dist[v],dist[u]+w);
 assert.equal(dist.T,5);assert.deepEqual([4-2+3,5+3,4+9].sort((a,b)=>a-b),[5,8,13]);
 assert.ok(e.every(([u,v,w])=>dist[u]+w>=dist[v]));
});
t(14,'Recursion: tree height in edges and independent levels',()=>{
 let tree={A:['B','C'],B:['D','E'],C:[],D:[],E:['F'],F:[]};
 function height(v){return tree[v].length?1+Math.max(...tree[v].map(height)):0}
 assert.equal(height('A'),3);
 let q=[['A',0]],max=0;while(q.length){let [node,depth]=q.shift();max=Math.max(max,depth);for(const ch of tree[node])q.push([ch,depth+1])}
 assert.equal(max,3);tree.E=[];assert.equal(height('A'),2);
});
t(15,'Big-O: dynamic capacity doubling copies and amortized count',()=>{
 let size=0,cap=1,copies=0;
 const append=()=>{if(size===cap){copies+=size;cap*=2}size++};
 for(let i=0;i<17;i++)append();
 assert.deepEqual([size,cap,copies,size+copies],[17,32,31,48]);
 append();assert.deepEqual([size,cap,copies,size+copies],[18,32,31,49]);
});
function components(edges,vs){let g=adjacency(edges),visited=new Set(),sizes=[];
 for(const node of vs){if(visited.has(node))continue;const {dist}=bfs(g,node);sizes.push([...dist].filter(([v])=>!visited.has(v)).length);for(const [v] of dist)visited.add(v)}
 return sizes.sort((a,b)=>b-a)}
t(16,'Graph: deleting a bridge splits components 4 and 2',()=>{
 let e=[['A','B'],['B','C'],['C','D'],['B','E'],['E','F']],vs=['A','B','C','D','E','F'];
 assert.deepEqual(components(e,vs),[6]);
 assert.deepEqual(components(e.filter(([u,v])=>!(u==='B'&&v==='C')),vs),[4,2]);
 let alternate=e.concat([['D','E']]).filter(([u,v])=>!(u==='B'&&v==='C'));
 assert.deepEqual(components(alternate,vs),[6]);
});
t(17,'Recursion: binary recursive sum full tree count',()=>{
 let leaves=0,combines=0;
 function splitSum(a){if(a.length===1){leaves++;return a[0]}let mid=a.length>>1;let x=splitSum(a.slice(0,mid)),y=splitSum(a.slice(mid));combines++;return x+y}
 let a=Array.from({length:16},(_,i)=>i+1);
 assert.equal(splitSum(a),136);assert.deepEqual([leaves,combines],[16,15]);
 leaves=combines=0;assert.equal(splitSum(a.slice(0,8)),36);assert.deepEqual([leaves,combines],[8,7]);
});
t(18,'Big-O: adjacency-list versus matrix count model',()=>{
 let n=100,e=180;assert.equal(n*n,10000);assert.equal(n+2*e,460);
 e=n*(n-1)/2;assert.equal(e,4950);assert.equal(n+2*e,10000);
});
t(19,'Graph: dynamic DAG path counting equals explicit enumeration',()=>{
 let edges=[['S','A'],['S','B'],['A','C'],['B','C'],['C','T'],['B','T']];
 let vs=['S','A','B','C','T'],order=kahn(vs,edges),ways=new Map(vs.map(x=>[x,0]));ways.set('S',1);
 for(const u of order)for(const [a,b] of edges){if(a===u)ways.set(b,ways.get(b)+ways.get(a))}
 assert.equal(ways.get('C'),2);assert.equal(ways.get('T'),3);
 const g=adjacency(edges,true);
 const dfs=(u,seen)=>u==='T'?1:(g.get(u)||[]).reduce((count,v)=>count+dfs(v,[...seen,u]),0);
 assert.equal(dfs('S',[]),3);
});
t(20,'Recursion: nested numerical max with negative-only adversary',()=>{
 let x={a:[2,5],b:{c:[7,-1]}},neg={a:[-2,-5],b:{c:[-7,-1]}};
 const maxNum=v=>typeof v==='number'?v:Math.max(...(Array.isArray(v)?v:Object.values(v)).map(maxNum));
 assert.equal(maxNum(x),7);assert.equal(maxNum(neg),-1);
 assert.ok(picked[20].labPlan[0].includes('{a:[-2,-5],b:{c:[-7,-1]}}'),'explicit negative-only fixture');
});
t(21,'Big-O: insertion sort reversed versus sorted comparisons',()=>{
 function insertion(a){let shifts=0,comps=0;for(let i=1;i<a.length;i++){let key=a[i],j=i-1;while(j>=0){comps++;if(a[j]<=key)break;a[j+1]=a[j];shifts++;j--}a[j+1]=key}return {a,shifts,comps}}
 const rev=insertion(Array.from({length:12},(_,i)=>12-i));
 assert.deepEqual(rev.a,Array.from({length:12},(_,i)=>i+1));assert.equal(rev.shifts,66);assert.equal(rev.comps,66);
 const sorted=insertion(Array.from({length:12},(_,i)=>i+1));assert.equal(sorted.shifts,0);assert.equal(sorted.comps,11);
});
t(22,'Graph: BFS connected components versus global vertex count',()=>{
 let e=[[0,1],[1,2],[3,4],[4,5]],vs=[0,1,2,3,4,5];
 assert.equal(bfs(adjacency(e),0).dist.size,3);
 assert.deepEqual(components(e,vs),[3,3]);
 assert.deepEqual(components([...e,[2,3]],vs),[6]);
});
t(23,'Recursion: exact coin-change DP refutes greedy',()=>{
 const coins=[1,3,4],memo=new Map([[0,0]]);
 function minCoins(n){if(memo.has(n))return memo.get(n);let best=Math.min(...coins.filter(c=>c<=n).map(c=>1+minCoins(n-c)));memo.set(n,best);return best}
 assert.equal(minCoins(6),2);assert.deepEqual(Array.from({length:7},(_,i)=>minCoins(i)),[0,1,2,1,1,2,2]);
 assert.equal(minCoins(8),2);
 let rem=6,count=0;for(const c of [...coins].sort((a,b)=>b-a)){count+=Math.floor(rem/c);rem%=c}
 assert.equal(count,3);
});
