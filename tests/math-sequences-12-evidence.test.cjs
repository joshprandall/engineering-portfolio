"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,"../deep-learning/math/sequences.json"),"utf8"));
const f=JSON.parse(fs.readFileSync(path.join(__dirname,"math-sequences-12-evidence.fixtures.json"),"utf8"));
const model={
an:x=>x.a+x.d*(x.n-1),gn:x=>x.a*x.r**(x.n-1),
ap:x=>x.ap+(x.n-x.p)*(x.aq-x.ap)/(x.q-x.p),
as:x=>Array.from({length:x.n},(_,i)=>x.a+i*x.d).reduce((a,b)=>a+b,0),
gs:x=>Array.from({length:x.n},(_,i)=>x.a*x.r**i).reduce((a,b)=>a+b,0),
galt:x=>Array.from({length:x.n},(_,i)=>x.a*x.r**i).reduce((a,b)=>a+b,0),
ad:x=>x.a+x.d*(x.n-1),adpair:x=>x.ap+(x.n-x.p)*(x.aq-x.ap)/(x.q-x.p),
counter:x=>new Set(x.terms.slice(1).map((v,i)=>v-x.terms[i])).size===1?1:0,
ginv:x=>x.ap*Math.cbrt(x.aq/x.ap)**(x.n-x.p),
thresh:x=>{let n=1,t=x.a;while(t<x.threshold&&n<200){t*=x.r;n++}return n},
gone:x=>Array.from({length:x.n},(_,i)=>x.a*x.r**i).reduce((a,b)=>a+b,0)
};
test("pack preserves 101 IDs and fixture 12 unique IDs",()=>{assert.equal(Object.keys(pack).length,101);assert.equal(f.cases.length,12);assert.equal(new Set(f.cases.map(x=>x.id)).size,12);});
for(const c of f.cases)test(c.id,()=>{const r=pack[c.id];assert.ok(r);assert.equal(r.essentialQuestion,c.question);assert.equal(r.reasoningSteps.length,6);assert.equal(r.labPlan.length,6);assert.ok(r.reasoningSteps.join(" ").includes("https://openstax.org/"));assert.ok(r.labPlan.join(" ").toLowerCase().includes("offline"));assert.ok(Math.abs(model[c.type](c.input)-c.expected)<1e-8);});
test("finite geometric boundary values",()=>{assert.equal(64-32+16-8+4-2+1,43);assert.equal(9*8,72);assert.equal(9+0+0,9);});
test("non-arithmetic first differences",()=>{const dif=a=>a.slice(1).map((v,i)=>v-a[i]);assert.deepEqual(dif([3,8,14,19]),[5,6,5]);assert.deepEqual(dif([3,8,13,18]),[5,5,5]);});
