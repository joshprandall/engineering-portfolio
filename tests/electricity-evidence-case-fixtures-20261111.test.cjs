'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const lessons=JSON.parse(fs.readFileSync(path.join(root,'deep-learning/physics/electricity.json'),'utf8'));
const checks=JSON.parse(fs.readFileSync(path.join(__dirname,'electricity-evidence-case-fixtures-20261111.json'),'utf8'));
assert.equal(checks.length,24);
assert.equal(Object.keys(lessons).length,112);
assert.equal(new Set(checks.map(c=>c.id)).size,24);
const queries=new Set();
let good=0;
for(const c of checks){
 const e=lessons[c.id];
 assert.ok(e,c.id+' missing');
 assert.equal(e.essentialQuestion,c.q);
 assert.ok(!queries.has(c.q),'duplicate essential question');
 queries.add(c.q);
 assert.equal(e.reasoningSteps.length,6);
 assert.equal(e.labPlan.length,6);
 const r=e.reasoningSteps.join(' '), l=e.labPlan.join(' ');
 for(const x of [c.model,c.calc,c.check,c.change,c.fallacy,c.scope,c.sourceUrl]){
  assert.ok(r.includes(x),c.id+' missing reasoning evidence');
  assert.ok(l.includes(x),c.id+' missing lab evidence');
 }
 assert.ok(!e.essentialQuestion.includes('why does it matter, how can it be used'));
 assert.match(c.sourceUrl,/^https:\/\/openstax\.org\/books\/university-physics-volume-2\//);
 const num=Function('return ('+c.math+')')();
 const tol=Math.max(1e-12,Math.abs(c.want)*1e-9);
 assert.ok(Number.isFinite(num)&&Math.abs(num-c.want)<=tol,c.id+' numeric mismatch '+num+' vs '+c.want);
 good++;
 console.log('PASS '+c.id+' independently calculated '+num);
}
console.log('PASS '+good+'/'+checks.length+' numeric cases, 24/24 source-specific reasoning and falsification teaching contracts');
