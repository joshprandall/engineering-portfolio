'use strict';
// Independent numerical oracles must agree with the predictions actually taught.
// Synthetic examples only; no timing claims, network access or external data.
const test=require('node:test');
const assert=require('node:assert/strict');
const content=require('../deep-learning/software/algorithms.json');
const cases=[
{ id:"software-big-o", expect:[56,28], phrases:["56 ordered","28 unordered"], derive:()=>{let ordered=0,unordered=0;for(let i=0;i<8;i++)for(let j=0;j<8;j++){if(i!==j)ordered++;if(i<j)unordered++}return [ordered,unordered]} },
{ id:"software-recursion", expect:[720,7,6], phrases:["factorial(6)=720","seven calls","six multiplications"], derive:()=>{let calls=0,mults=0;function f(n){calls++;return n===0?1:(mults++,n*f(n-1))}return [f(6),calls,mults]} },
{ id:"software-graph", expect:[3,"A-B-D-F"], phrases:["three edges","A-B-D-F"], derive:()=>{let edges=[["A","B"],["A","C"],["B","D"],["C","E"],["D","F"],["E","F"]],g={};for(let [u,v] of edges){(g[u]??=[]).push(v);(g[v]??=[]).push(u)}let q=["A"],prev={A:null};for(let k=0;k<q.length;k++)for(let v of g[q[k]].sort())if(!(v in prev)){prev[v]=q[k];q.push(v)}let p=[];for(let v="F";v!==null;v=prev[v])p.unshift(v);return [p.length-1,p.join("-")]} },
{ id:"software-v09-troubleshooting-lab-big-o-describing-how-work-grows", expect:11, phrases:["eleven comparisons","1024"], derive:()=>{let lo=0,hi=1023,n=0;while(lo<=hi){n++;let mid=Math.floor((lo+hi)/2);lo=mid+1}return n} },
{ id:"software-v09-design-review-graphs-modeling-relationships-instead-of-rows", expect:[true,false], phrases:["five tasks emitted","A,B,C,D,E","C,A,B,D,E"], derive:()=>{let e=[["A","C"],["B","C"],["C","D"],["B","E"]];const valid=a=>e.every(([u,v])=>a.indexOf(u)<a.indexOf(v));return [valid(["A","B","C","D","E"]),valid(["C","A","B","D","E"])]} },
{ id:"software-v09-scenario-analysis-recursion", expect:[5,28,29], phrases:["five comparisons","index 28","value 29"], derive:()=>{let lo=0,hi=30,n=0;while(lo<=hi){n++;let m=Math.floor((lo+hi)/2),v=m+1;if(v===29)return [n,m,v];if(v<29)lo=m+1;else hi=m-1}return [n,-1,-1]} },
{ id:"software-v09-failure-analysis-lab-big-o-describing-how-work-grows", expect:[55,210], phrases:["55 visits","210 visits"], derive:()=>{const f=n=>{let k=0;for(let i=0;i<n;i++)for(let j=0;j<=i;j++)k++;return k};return [f(10),f(20)]} },
{ id:"software-v09-troubleshooting-lab-graphs-modeling-relationships-instead-of-rows", expect:0, phrases:["zero vertices","A→B→C→A"], derive:()=>{let edges=[["A","B"],["B","C"],["C","A"]],ind={A:0,B:0,C:0};for(let [u,v] of edges)ind[v]++;let todo=Object.keys(ind).filter(v=>ind[v]===0),n=0;while(todo.length){let u=todo.shift();n++;for(let [a,b] of edges)if(a===u&&!--ind[b])todo.push(b)}return n} },
{ id:"software-v09-design-review-recursion", expect:[10,4,3,3], phrases:["sum 10","four numeric leaves","three arrays","depth three"], derive:()=>{let arr=[1,[2,[3]],4],num=0,lists=0,depth=0;function sum(v,d=0){if(!Array.isArray(v)){num++;return v}lists++;depth=Math.max(depth,d+1);return v.reduce((a,x)=>a+sum(x,d+1),0)}let n=sum(arr);return [n,num,lists,depth]} },
{ id:"software-v09-scenario-analysis-big-o-describing-how-work-grows", expect:[4096,16777216,8192,67108864], phrases:["4096 versus 16,777,216","8192 versus 67,108,864"], derive:()=>[4096,4096*4096,8192,8192*8192] },
{ id:"software-v09-failure-analysis-lab-graphs-modeling-relationships-instead-of-rows", expect:7, phrases:["distance(A,D)=7","A→B→C→D"], derive:()=>{let e=[["A","B",2],["A","C",5],["B","C",1],["C","D",4],["B","D",9]],ds={A:0,B:Infinity,C:Infinity,D:Infinity};for(let r=0;r<3;r++)for(let [u,v,w] of e)ds[v]=Math.min(ds[v],ds[u]+w);return ds.D} },
{ id:"software-v09-troubleshooting-lab-recursion", expect:[5,15,8,25], phrases:["F(5)=5 and 15","F(6)=8 and 25"], derive:()=>{let calls=0;function fib(n){calls++;return n<2?n:fib(n-1)+fib(n-2)}let x=fib(5),c5=calls;calls=0;let y=fib(6);return [x,c5,y,calls]} },
{ id:"software-v09-design-review-big-o-describing-how-work-grows", expect:[1000,200000,1000], phrases:["each returned sum is 1000","200,000 scanned elements","1000 once with cache"], derive:()=>{let a=Array(1000).fill(1),sum=a.reduce((x,y)=>x+y,0);return [sum,a.length*200,a.length]} },
{ id:"software-v09-scenario-analysis-graphs-modeling-relationships-instead-of-rows", expect:5, phrases:["distance(S,T)=5","S→A→B→T"], derive:()=>{let e=[["S","A",4],["S","B",5],["A","B",-2],["B","T",3],["A","T",9]],ds={S:0,A:Infinity,B:Infinity,T:Infinity};for(let r=0;r<3;r++)for(let [u,v,w] of e)ds[v]=Math.min(ds[v],ds[u]+w);return ds.T} },
{ id:"software-v09-failure-analysis-lab-recursion", expect:[3,4], phrases:["three edges","four vertices"], derive:()=>{let children={A:["B","C"],B:["D","E"],C:[],D:[],E:["F"],F:[]};function height(v){return children[v].length?1+Math.max(...children[v].map(height)):0}let h=height("A");return [h,h+1]} },
{ id:"software-v09-troubleshooting-la-big-o-describing-how-work-grows-2", expect:[32,31,17,48], phrases:["capacity 32","copies 31","new writes 17","total writes 48"], derive:()=>{let cap=1,n=0,copy=0;for(let i=0;i<17;i++){if(n===cap){copy+=n;cap*=2}n++}return [cap,copy,n,copy+n]} },
{ id:"software-v09-design-review-graphs-modeling-relationships-instead-of-rows-2", expect:[4,2], phrases:["two components","sizes four and two"], derive:()=>{let edges=[["A","B"],["C","D"],["B","E"],["E","F"]],vs=["A","B","C","D","E","F"],visited=new Set(),sizes=[];for(let s of vs){if(visited.has(s))continue;let q=[s];visited.add(s);for(let i=0;i<q.length;i++)for(let [u,v] of edges){let nxt=u===q[i]?v:v===q[i]?u:null;if(nxt!==null&&!visited.has(nxt)){visited.add(nxt);q.push(nxt)}}sizes.push(q.length)}return sizes.sort((a,b)=>b-a)} },
{ id:"software-v09-scenario-analysis-recursion-2", expect:[136,16,15], phrases:["sum 136","16 leaf returns","15 internal combine"], derive:()=>{let leaves=0,internal=0;function recurse(a){if(a.length===1){leaves++;return a[0]}let m=a.length/2,x=recurse(a.slice(0,m)),y=recurse(a.slice(m));internal++;return x+y}return [recurse(Array.from({length:16},(_,i)=>i+1)),leaves,internal]} },
{ id:"software-v09-failure-analysis-l-big-o-describing-how-work-grows-2", expect:[10000,460], phrases:["10,000 matrix cells","460 abstract list slots"], derive:()=>{let n=100,m=180;return [n*n,n+2*m]} },
{ id:"software-v09-troubleshooting-la-graphs-modeling-relationships-instead-of-rows-2", expect:[3,2], phrases:["three S→T routes","two reaching C"], derive:()=>{let edges=[["S","A"],["S","B"],["A","C"],["B","C"],["C","T"],["B","T"]],paths=[];function walk(u,p){if(u==="T"){paths.push(p);return}for(let [a,b] of edges)if(a===u)walk(b,p.concat(b))}walk("S",["S"]);return [paths.length,paths.filter(p=>p.includes("C")).length]} },
{ id:"software-v09-design-review-recursion-2", expect:[7,-1], phrases:["maximum seven","maximum minus one"], derive:()=>{const mx=x=>typeof x==="number"?x:Math.max(...Object.values(x).map(mx));return [mx({a:[2,5],b:{c:[7,-1]}}),mx({a:[-2,-5],b:{c:[-7,-1]}})]} },
{ id:"software-v09-scenario-analysis-big-o-describing-how-work-grows-2", expect:[66,0,11], phrases:["66 shifts","zero shifts","eleven comparisons"], derive:()=>{function s(a){let shifts=0,cmp=0;for(let i=1;i<a.length;i++){let key=a[i],j=i-1;while(j>=0){cmp++;if(a[j]<=key)break;a[j+1]=a[j];shifts++;j--}a[j+1]=key}return {shifts,cmp}}let rev=s(Array.from({length:12},(_,i)=>12-i)),asc=s(Array.from({length:12},(_,i)=>i+1));return [rev.shifts,asc.shifts,asc.cmp]} },
{ id:"software-v09-failure-analysis-l-graphs-modeling-relationships-instead-of-rows-2", expect:[3,2,6], phrases:["three reachable from zero","two components of size three","six vertices total"], derive:()=>{let e=[[0,1],[1,2],[3,4],[4,5]],vs=[0,1,2,3,4,5],seen=new Set(),size=[];for(let start of vs){if(seen.has(start))continue;let q=[start];seen.add(start);for(let i=0;i<q.length;i++)for(let [u,v] of e){let nxt=u===q[i]?v:v===q[i]?u:null;if(nxt!==null&&!seen.has(nxt)){seen.add(nxt);q.push(nxt)}}size.push(q.length)}return [size[0],size.length,seen.size]} },
{ id:"software-v09-troubleshooting-la-recursion-2", expect:[2,3,[0,1,2,1,1,2,2]], phrases:["minimum two coins","greedy three coins","[0,1,2,1,1,2,2]"], derive:()=>{let dp=[0],coins=[1,3,4];for(let a=1;a<=6;a++)dp[a]=1+Math.min(...coins.filter(c=>c<=a).map(c=>dp[a-c]));let rem=6,greedy=0;for(let c of [4,3,1]){greedy+=Math.floor(rem/c);rem%=c}return [dp[6],greedy,dp]} }
];
test('The 24 reviewed IDs retain their position and teaching fields',()=>{
 assert.deepEqual(Object.keys(content).slice(0,cases.length),cases.map(c=>c.id));
 assert.equal(Object.keys(content).length,111);
 for(const c of cases){
  const r=content[c.id];
  assert.equal(r.labPlan.length,6,c.id);
  assert.equal(r.reasoningSteps.length,6,c.id);
  assert.match(r.labPlan[2],/^Before execution, record this falsifiable prediction:/u,c.id);
 }
});
function checkPrediction(text,c){for(const phrase of c.phrases)assert.ok(text.includes(phrase),c.id+': missing '+phrase)}
for(const c of cases){
 test(c.id+': independent calculation agrees with the lesson prediction',()=>{
  assert.deepEqual(c.derive(),c.expect,c.id+': independently derived reference values');
  checkPrediction(content[c.id].labPlan[2],c);
 });
 test(c.id+': deliberate prediction corruption is rejected',()=>{
  const original=content[c.id].labPlan[2];
  const mutated=original.replace(c.phrases[0],'__incorrect__');
  assert.notEqual(mutated,original,c.id+': mutation must change the fixture');
  assert.throws(()=>checkPrediction(mutated,c),{name:'AssertionError'});
 });
}
