'use strict';
// Standalone, offline 48-case software testing evidence and oracle validation.
// Run: node --test tests/software-testing-48-oracles.test.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const pack=JSON.parse(fs.readFileSync(path.join(root,'deep-learning/software/testing.json'),'utf8'));
const cases=JSON.parse(fs.readFileSync(path.join(__dirname,'software-testing-evidence-48-cases.json'),'utf8'));
function independent(k,x){
 switch(k){
 case 'boundary':case 'schema':return x.values.filter(v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=x.min&&v<=x.max).length;
 case 'bisect':return Array.from({length:x.n},(_,i)=>i).find(i=>i>=x.first)??x.n; // linear reference, not bisection
 case 'coverage':return [...new Set(x.seen)].filter(s=>x.branches.includes(s)).length;
 case 'mutation':return {killed:x.killed,eligible:x.killed+x.survived};
 case 'retry':return Array(x.attempts).fill(x.p).reduce((p,q)=>p*q,1);
 case 'timeout':return x.now>=x.issued+x.ttl;
 case 'transaction':{const t=new Set();for(const id of x.ids){if(t.has(id))return 0;t.add(id);}return t.size;}
 case 'permutation':return x.numbers.reduce((a,b)=>a+b,0);
 case 'mock':return x.tasks+(x.retry&&x.failedAt>=0&&x.failedAt<x.tasks?1:0);
 case 'binary':return [(x.value>>>8)&255,x.value&255];
 case 'percentile':return [...x.values].sort((a,b)=>a-b)[Math.ceil(.95*x.values.length)-1];
 default:throw Error('unknown '+k);
 }
}
function verify(a,e){if(typeof e==='number')assert.ok(Math.abs(a-e)<1e-12,String(a)+' != '+e);else assert.deepStrictEqual(a,e);}
test('scope, topic provenance, record integrity and 48 unique case IDs',()=>{
 assert.equal(cases.length,48);assert.equal(new Set(cases.map(x=>x.id)).size,48);
 for(const c of cases){
  assert.ok(pack[c.id],c.id);assert.equal(pack[c.id].essentialQuestion,c.question);
  assert.deepStrictEqual(pack[c.id].reasoningSteps,c.reasoningSteps);assert.deepStrictEqual(pack[c.id].labPlan,c.labPlan);
  assert.equal(c.reasoningSteps.length,6);assert.equal(c.labPlan.length,6);
  assert.ok(c.source.startsWith('https://')&&c.reasoningSteps.at(-1).includes(c.source));
  assert.ok(c.labPlan.some(s=>s.includes('--test-name-pattern')));
  assert.deepStrictEqual(Object.keys(pack[c.id]),['essentialQuestion','verifiedBoundary','analogy','starter','technical','reasoningSteps','memoryLadder','labPlan','vocabulary','video']);
 }
});
for(const c of cases)test(c.id+' '+c.context,()=>{
 verify(independent(c.kind,c.input),c.expected);
 verify(independent(c.kind,c.variation),c.variationExpected);
 if(c.kind==='permutation')verify(independent(c.kind,{numbers:[...c.input.numbers].reverse()}),c.expected);
 if(c.kind==='binary'){
  assert.equal(c.expected[0]*256+c.expected[1],c.input.value);
  assert.equal(c.variationExpected[0]*256+c.variationExpected[1],c.variation.value);
 }
 if(c.kind==='retry')assert.ok(c.expected>=0&&c.expected<=1);
 if(c.kind==='mutation')assert.equal(c.expected.eligible,c.input.killed+c.input.survived);
});
