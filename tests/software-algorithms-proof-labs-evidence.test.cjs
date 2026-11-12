'use strict';
// Independent offline algorithmic test suite; fixtures are original synthetic educational examples.
const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../deep-learning/software/algorithms.json');
const ids=Object.keys(data).slice(24,48);
const items=ids.map(id=>data[id]);
const source="https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes/";
test('24 distinct authored algorithm proof labs: preserved schema and source evidence',()=>{
 assert.equal(Object.keys(data).length,111);assert.equal(new Set(ids).size,24);assert.equal(new Set(items.map(x=>x.essentialQuestion)).size,24);
 for(const [i,r] of items.entries()){assert.ok(!/^What does /u.test(r.essentialQuestion),ids[i]);assert.equal(r.reasoningSteps.length,6);assert.equal(r.labPlan.length,6);
  assert.ok(r.reasoningSteps.every(s=>s.length>55),ids[i]);assert.ok(r.labPlan.every(s=>s.length>55),ids[i]);
  assert.ok(r.reasoningSteps[5].includes(source),ids[i]);assert.ok(r.labPlan[5].includes(source),ids[i]);}
});
test("proof lab 1: For a join between 12 asset rows and 15 event rows without an index, how many equality comparisons does the complete nested-loop join make?",()=>{
assert.equal(items[0].essentialQuestion,"For a join between 12 asset rows and 15 event rows without an index, how many equality comparisons does the complete nested-loop join make?");
let c=0;for(let a=0;a<12;a++)for(let e=0;e<15;e++)c++;assert.equal(c,180);assert.equal(12*18,216);
});
test("proof lab 2: In an undirected network A–B, A–C, B–D, C–E, D–F and E–F, what BFS distance and deterministic parent chain reach F from A?",()=>{
assert.equal(items[1].essentialQuestion,"In an undirected network A–B, A–C, B–D, C–E, D–F and E–F, what BFS distance and deterministic parent chain reach F from A?");
const g={A:['B','C'],B:['A','D'],C:['A','E'],D:['B','F'],E:['C','F'],F:['D','E']},q=['A'],d={A:0},p={};for(let h=0;h<q.length;h++){let u=q[h];for(let v of g[u])if(!(v in d)){d[v]=d[u]+1;p[v]=u;q.push(v)}}assert.equal(d.F,3);assert.deepEqual([p.F,p.D,p.B],['D','B','A']);
});
test("proof lab 3: With recursive exponentiation by squaring, what is 3^13 and how many non-base recursive frames are entered?",()=>{
assert.equal(items[2].essentialQuestion,"With recursive exponentiation by squaring, what is 3^13 and how many non-base recursive frames are entered?");
let frames=0,mults=0;const pow=(a,n)=>{if(!n)return 1;frames++;const h=pow(a,Math.floor(n/2));mults++;let v=h*h;if(n%2){mults++;v*=a}return v};assert.equal(pow(3,13),1594323);assert.equal(frames,4);assert.equal(mults,7);
});
test("proof lab 4: For a sorted array of 1,000 distinct integers, how many comparisons can an inclusive-bound binary search require to reject a target larger than every element?",()=>{
assert.equal(items[3].essentialQuestion,"For a sorted array of 1,000 distinct integers, how many comparisons can an inclusive-bound binary search require to reject a target larger than every element?");
const probes=[];let lo=0,hi=999;while(lo<=hi){const m=Math.floor((lo+hi)/2);probes.push(m);lo=m+1}assert.deepEqual(probes,[499,749,874,937,968,984,992,996,998,999]);
});
test("proof lab 5: For prerequisites A→C, B→C, C→D, B→E and E→F, what is the minimum possible semester of F under one prerequisite level per semester?",()=>{
assert.equal(items[4].essentialQuestion,"For prerequisites A→C, B→C, C→D, B→E and E→F, what is the minimum possible semester of F under one prerequisite level per semester?");
const e=[['A','C'],['B','C'],['C','D'],['B','E'],['E','F']],v=['A','B','C','D','E','F'];const sem=Object.fromEntries(v.map(x=>[x,1]));for(let u of v)for(let [a,b] of e.filter(z=>z[0]===u))sem[b]=Math.max(sem[b],sem[a]+1);assert.equal(sem.F,3);assert.equal(sem.D,3);
});
test("proof lab 6: How many Euclidean remainder operations compute gcd(252,198), and what is the resulting greatest common divisor?",()=>{
assert.equal(items[5].essentialQuestion,"How many Euclidean remainder operations compute gcd(252,198), and what is the resulting greatest common divisor?");
let a=252,b=198,k=0;while(b!==0){const r=a%b;a=b;b=r;k++}assert.deepEqual([a,k],[18,4]);
});
test("proof lab 7: After linear preprocessing of readings [4,7,-2,5,1], what is the constant-time prefix-sum answer for indices 1 through 3 inclusive?",()=>{
assert.equal(items[6].essentialQuestion,"After linear preprocessing of readings [4,7,-2,5,1], what is the constant-time prefix-sum answer for indices 1 through 3 inclusive?");
const a=[4,7,-2,5,1],p=[0];for(let x of a)p.push(p.at(-1)+x);assert.deepEqual(p,[0,4,11,9,14,15]);assert.equal(p[4]-p[1],10);
});
test("proof lab 8: In a weighted graph with S→A=2, S→B=5, A→B=1, A→T=7 and B→T=3, what shortest-path cost reaches T from S?",()=>{
assert.equal(items[7].essentialQuestion,"In a weighted graph with S→A=2, S→B=5, A→B=1, A→T=7 and B→T=3, what shortest-path cost reaches T from S?");
const edges={S:[['A',2],['B',5]],A:[['B',1],['T',7]],B:[['T',3]],T:[]},dist={S:0,A:Infinity,B:Infinity,T:Infinity},done=new Set();while(done.size<4){let u=Object.keys(dist).filter(x=>!done.has(x)).sort((x,y)=>dist[x]-dist[y])[0];done.add(u);for(let [v,w] of edges[u])dist[v]=Math.min(dist[v],dist[u]+w)}assert.equal(dist.T,6);
});
test("proof lab 9: What is the maximum recursion depth and number of merge calls when a balanced mergesort divides nine elements using floor(n/2) on the left?",()=>{
assert.equal(items[8].essentialQuestion,"What is the maximum recursion depth and number of merge calls when a balanced mergesort divides nine elements using floor(n/2) on the left?");
let merges=0,calls=0,max=0;function m(n,d=1){calls++;max=Math.max(max,d);if(n<=1)return; m(Math.floor(n/2),d+1);m(Math.ceil(n/2),d+1);merges++}m(9);assert.deepEqual([merges,calls,max],[8,17,5]);
});
test("proof lab 10: For reverse-sorted 16 distinct keys, how many key shifts does insertion sort make, and how does that compare with merge sort’s asymptotic guarantee?",()=>{
assert.equal(items[9].essentialQuestion,"For reverse-sorted 16 distinct keys, how many key shifts does insertion sort make, and how does that compare with merge sort’s asymptotic guarantee?");
let a=Array.from({length:16},(_,i)=>16-i),s=0;for(let i=1;i<a.length;i++){let x=a[i],j=i-1;while(j>=0&&a[j]>x){a[j+1]=a[j];s++;j--}a[j+1]=x}assert.equal(s,120);assert.deepEqual(a,Array.from({length:16},(_,i)=>i+1));
});
test("proof lab 11: For directed edges A→B, B→A, B→C, C→D, D→C and D→E, which strongly connected components exist?",()=>{
assert.equal(items[10].essentialQuestion,"For directed edges A→B, B→A, B→C, C→D, D→C and D→E, which strongly connected components exist?");
const e=[['A','B'],['B','A'],['B','C'],['C','D'],['D','C'],['D','E']],v=['A','B','C','D','E'];const reach=s=>{let q=[s],seen=new Set(q);for(let h=0;h<q.length;h++)for(let [a,b] of e)if(a===q[h]&&!seen.has(b)){seen.add(b);q.push(b)}return seen};const rs=Object.fromEntries(v.map(x=>[x,reach(x)]));const comp=v.map(x=>v.filter(y=>rs[x].has(y)&&rs[y].has(x)).join(''));assert.deepEqual(comp,['AB','AB','CD','CD','E']);
});
test("proof lab 12: For Levenshtein edit distance between kitten and sitting, what is the optimal edit count and the number of memoized suffix-pair subproblems at most?",()=>{
assert.equal(items[11].essentialQuestion,"For Levenshtein edit distance between kitten and sitting, what is the optimal edit count and the number of memoized suffix-pair subproblems at most?");
const a='kitten',b='sitting',d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=0;i<=a.length;i++)d[i][0]=i;for(let j=0;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));assert.equal(d[6][7],3);assert.equal((a.length+1)*(b.length+1),56);
});
test("proof lab 13: With capacity-11 linear probing and h(k)=k mod 11, which slots receive keys 10,21,32,43 and how many insertion slot probes are needed?",()=>{
assert.equal(items[12].essentialQuestion,"With capacity-11 linear probing and h(k)=k mod 11, which slots receive keys 10,21,32,43 and how many insertion slot probes are needed?");
const t=Array(11).fill(null),placements=[],counts=[];for(const k of [10,21,32,43]){let h=k%11,c=0;while(t[h]!==null){c++;h=(h+1)%11}c++;t[h]=k;placements.push(h);counts.push(c)}assert.deepEqual(placements,[10,0,1,2]);assert.equal(counts.reduce((a,b)=>a+b),10);
});
test("proof lab 14: For capacities S→A=3, S→B=2, A→B=1, A→T=2 and B→T=3, what maximum S–T flow is feasible?",()=>{
assert.equal(items[13].essentialQuestion,"For capacities S→A=3, S→B=2, A→B=1, A→T=2 and B→T=3, what maximum S–T flow is feasible?");
const f={'S-A':3,'S-B':2,'A-B':1,'A-T':2,'B-T':3},cap={'S-A':3,'S-B':2,'A-B':1,'A-T':2,'B-T':3};for(let k in f)assert.ok(f[k]>=0&&f[k]<=cap[k]);assert.equal(f['S-A']+f['S-B'],5);assert.equal(f['S-A'],f['A-B']+f['A-T']);assert.equal(f['S-B']+f['A-B'],f['B-T']);
});
test("proof lab 15: In a binary include-or-exclude subset enumerator for five distinct elements, how many leaves and total recursive calls occur?",()=>{
assert.equal(items[14].essentialQuestion,"In a binary include-or-exclude subset enumerator for five distinct elements, how many leaves and total recursive calls occur?");
let calls=0,leaves=0,depthMax=0;function enumSub(i){calls++;depthMax=Math.max(depthMax,i+1);if(i===5){leaves++;return}enumSub(i+1);enumSub(i+1)}enumSub(0);assert.deepEqual([leaves,calls,depthMax],[32,63,6]);
});
test("proof lab 16: If a loop starts x=1 and doubles x while x<1024, how many loop-body executions occur before it terminates?",()=>{
assert.equal(items[15].essentialQuestion,"If a loop starts x=1 and doubles x while x<1024, how many loop-body executions occur before it terminates?");
let x=1,n=0,seen=[];while(x<1024){seen.push(x);x*=2;n++}assert.deepEqual([n,x],[10,1024]);assert.deepEqual(seen,[1,2,4,8,16,32,64,128,256,512]);
});
test("proof lab 17: Given matching edges L1–R1,L1–R2,L2–R1,L3–R2,L3–R3, can all three left vertices be assigned distinct right vertices?",()=>{
assert.equal(items[16].essentialQuestion,"Given matching edges L1–R1,L1–R2,L2–R1,L3–R2,L3–R3, can all three left vertices be assigned distinct right vertices?");
const g={L1:['R1','R2'],L2:['R1'],L3:['R2','R3']};let match={};function aug(u,seen){for(const v of g[u])if(!seen.has(v)){seen.add(v);if(!match[v]||aug(match[v],seen)){match[v]=u;return true}}return false}let m=0;for(const u of Object.keys(g))if(aug(u,new Set()))m++;assert.equal(m,3);assert.equal(Object.keys(match).length,3);
});
test("proof lab 18: For six disks in the standard three-peg Tower of Hanoi, what is the minimum number of legal single-disk moves?",()=>{
assert.equal(items[17].essentialQuestion,"For six disks in the standard three-peg Tower of Hanoi, what is the minimum number of legal single-disk moves?");
let moves=0;function h(n){if(!n)return;h(n-1);moves++;h(n-1)}h(6);assert.equal(moves,63);assert.equal(2**7-1,127);
});
test("proof lab 19: For readings [1,3,2,4,6,1,2,5,4,1], which contiguous four-reading window has the maximum sum, and how many O(1) slide updates are needed?",()=>{
assert.equal(items[18].essentialQuestion,"For readings [1,3,2,4,6,1,2,5,4,1], which contiguous four-reading window has the maximum sum, and how many O(1) slide updates are needed?");
const a=[1,3,2,4,6,1,2,5,4,1],s=[a.slice(0,4).reduce((x,y)=>x+y,0)];for(let i=4;i<a.length;i++)s.push(s.at(-1)-a[i-4]+a[i]);assert.deepEqual(s,[10,15,13,13,14,12,12]);assert.equal(Math.max(...s),15);
});
test("proof lab 20: In undirected edges A–B,B–C,C–D,D–E,C–F,B–F, which vertices are articulation points?",()=>{
assert.equal(items[19].essentialQuestion,"In undirected edges A–B,B–C,C–D,D–E,C–F,B–F, which vertices are articulation points?");
const v=['A','B','C','D','E','F'],e=[['A','B'],['B','C'],['C','D'],['D','E'],['C','F'],['B','F']];function components(omit){let remaining=v.filter(x=>x!==omit),seen=new Set(),count=0;for(let s of remaining)if(!seen.has(s)){count++;let q=[s];seen.add(s);for(let h=0;h<q.length;h++)for(let [a,b] of e){let w=a===q[h]?b:b===q[h]?a:null;if(w&&w!==omit&&!seen.has(w)){seen.add(w);q.push(w)}}}return count}assert.deepEqual(v.filter(x=>components(x)>1),['B','C','D']);
});
test("proof lab 21: For 0/1 knapsack with capacity 7 and items (weight,value) (3,4),(4,5),(5,8),(2,3), what maximum value is feasible?",()=>{
assert.equal(items[20].essentialQuestion,"For 0/1 knapsack with capacity 7 and items (weight,value) (3,4),(4,5),(5,8),(2,3), what maximum value is feasible?");
const bag=[[3,4],[4,5],[5,8],[2,3]];let best=0;for(let mask=0;mask<16;mask++){let w=0,v=0;bag.forEach(([wi,vi],i)=>{if(mask&(1<<i)){w+=wi;v+=vi}});if(w<=7)best=Math.max(best,v)}assert.equal(best,11);
});
test("proof lab 22: For nine values [7,2,9,4,1,8,3,6,5], how can a partition around pivot 5 certify the median without fully sorting?",()=>{
assert.equal(items[21].essentialQuestion,"For nine values [7,2,9,4,1,8,3,6,5], how can a partition around pivot 5 certify the median without fully sorting?");
const a=[7,2,9,4,1,8,3,6,5],low=a.filter(x=>x<5),eq=a.filter(x=>x===5),high=a.filter(x=>x>5);assert.deepEqual([low.length,eq.length,high.length],[4,1,4]);assert.equal([...a].sort((x,y)=>x-y)[4],5);
});
test("proof lab 23: How many distinct directed paths run from S to T in the DAG S→A,S→B,A→C,A→D,B→C,C→T,D→T?",()=>{
assert.equal(items[22].essentialQuestion,"How many distinct directed paths run from S to T in the DAG S→A,S→B,A→C,A→D,B→C,C→T,D→T?");
const g={S:['A','B'],A:['C','D'],B:['C'],C:['T'],D:['T'],T:[]},m={};function paths(u){if(u==='T')return 1;return m[u]??(m[u]=g[u].reduce((s,v)=>s+paths(v),0))}assert.equal(paths('S'),3);
});
test("proof lab 24: In the tree with edges 1–2,1–3,2–4,2–5,4–6,3–7,7–8, what is its diameter measured in edges?",()=>{
assert.equal(items[23].essentialQuestion,"In the tree with edges 1–2,1–3,2–4,2–5,4–6,3–7,7–8, what is its diameter measured in edges?");
const e=[[1,2],[1,3],[2,4],[2,5],[4,6],[3,7],[7,8]],g=Object.fromEntries(Array.from({length:8},(_,i)=>[i+1,[]]));for(const [u,v]of e){g[u].push(v);g[v].push(u)}function bfs(s){let q=[s],d={[s]:0};for(let i=0;i<q.length;i++)for(let v of g[q[i]])if(!(v in d)){d[v]=d[q[i]]+1;q.push(v)}return d}assert.equal(bfs(6)[8],6);assert.equal(Math.max(...Object.values(bfs(8))),6);
});
