'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','deep-learning','software','testing.json'),'utf8'));
const keys=[
'software-v09-decision-lab-testing-at-multiple-layers',
'software-v09-evidence-verification-la-debug-by-reducing-the-search-space',
'software-v10-boundary-condition-lab-testing-at-multiple-layers',
'software-v10-fault-isolation-lab-testing-at-multiple-layers',
'software-v10-measurement-lab-testing-at-multiple-layers',
'software-v10-counterexample-lab-debug-by-reducing-the-search-space'
];
const generic=/state the question in your own words|identify the exact verified claim|what does .+ mean, why does it matter|predict the outcome before manipulating|run the interactive model or work through/i;
test('six specific, complete reasoning laboratories preserve all 109 testing records',()=>{
 assert.equal(Object.keys(lessons).length,109);
 const questions=new Set();
 for(const key of keys){
  const l=lessons[key];
  assert.ok(l,key);
  assert.equal(l.reasoningSteps.length,6);assert.equal(l.labPlan.length,6);
  assert.ok(l.essentialQuestion.endsWith('?'));
  assert.doesNotMatch(l.essentialQuestion,generic);
  assert.ok(!questions.has(l.essentialQuestion));questions.add(l.essentialQuestion);
  assert.equal(new Set(l.reasoningSteps).size,6);assert.equal(new Set(l.labPlan).size,6);
  assert.ok(l.technical && l.verifiedBoundary && l.memoryLadder && l.starter && l.video);
  assert.ok(Array.isArray(l.vocabulary)&&l.vocabulary.length>0);
  for(const line of [...l.reasoningSteps,...l.labPlan]){
   assert.ok(line.length>=100,key+': underdeveloped instruction');
   assert.doesNotMatch(line,generic);
  }
  const lab=l.labPlan.join(' ');
  assert.match(lab,/synthetic|fictional|invented|fabricated/i);
  assert.match(lab,/https:\/\/(?:nodejs\.org\/api\/test\.html|martinfowler\.com\/articles\/practical-test-pyramid\.html)/);
  const all=[l.essentialQuestion,...l.reasoningSteps,...l.labPlan].join(' ');
  assert.doesNotMatch(all,/measured on our production|confirmed OSU outage|our live customer|real user data/i);
 }
});
test('order-total layers separate pure calculation from persistence and UI coverage',()=>{
 const quote=(qty,price,discount)=>qty*price-discount;
 assert.equal(quote(3,12,5),31);
 assert.equal(quote(3,12,6),30);
 const store={records:[],save(amount){this.records.push(amount)}};
 store.save(quote(3,12,5));
 assert.deepEqual(store.records,[31]);
 assert.match(lessons[keys[0]].labPlan.join(' '),/keyboard/i);
});
test('minimal discrepancy localizes a duplicated fee, with two independent controls',()=>{
 const bad=(lines,feeOn)=>lines.reduce((a,b)=>a+b,0)+(feeOn?3:0)+(feeOn?3:0);
 const fixed=(lines,feeOn)=>lines.reduce((a,b)=>a+b,0)+(feeOn?3:0);
 assert.equal(bad([12,8,5],true),31);
 assert.equal(fixed([12,8,5],true),28);
 assert.equal(bad([12],true),18);
 assert.equal(fixed([12],true),15);
 assert.equal(bad([12],false),12);
 assert.equal(fixed([12],false),12);
});
test('capacity partition includes equality and rejects invalid type and value',()=>{
 const reserve=(capacity,requested)=>Number.isInteger(capacity)&&capacity>=0&&Number.isInteger(requested)&&requested>0&&requested<=capacity;
 const samples=[[-1,false],[0,false],[1,true],[4,true],[5,true],[5.5,false],[6,false],['5',false]];
 for(const [qty,expected] of samples)assert.equal(reserve(5,qty),expected);
 assert.equal(reserve(-1,1),false);
 assert.equal(5<5,false);
 assert.equal(5<=5,true);
});
test('money units are preserved across serialization, only formatted at display',()=>{
 const amount=3100;
 const wrongMapper=totalCents=>({totalCents:totalCents/100});
 const goodMapper=totalCents=>({totalCents});
 const display=totalCents=>(totalCents/100).toFixed(2);
 assert.equal(wrongMapper(amount).totalCents,31);
 assert.equal(goodMapper(amount).totalCents,3100);
 assert.equal(display(goodMapper(amount).totalCents),'31.00');
 assert.equal(display(wrongMapper(amount).totalCents),'0.31');
});
test('repeat-run medians and failure fractions are reproducible, not causal estimates',()=>{
 const median=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
 const fraction=a=>a.filter(v=>v==='fail').length/a.length;
 assert.equal(median([11,12,13,14,15]),13);
 assert.equal(median([92,95,98,101,104]),98);
 assert.equal(fraction(['pass','fail','pass','fail','pass']),.4);
 assert.equal(fraction(['pass','fail','pass','pass','pass']),.2);
 assert.equal(fraction(['pass','pass','pass','pass','pass']),0);
});
test('counterexample distinguishes numeric array from coerced string API boundary',()=>{
 const buggySum=items=>items.reduce((a,b)=>a+b,0);
 const guardedSum=items=>items.reduce((a,b)=>{if(!Number.isFinite(b))throw new TypeError('numeric input required');return a+b;},0);
 assert.strictEqual(buggySum([2,3]),5);
 assert.strictEqual(buggySum([2,'3']),'23');
 assert.throws(()=>guardedSum([2,'3']),TypeError);
 assert.strictEqual(guardedSum([2,3]),5);
});
test('each lesson labels verifiable output and avoids conflating test layers',()=>{
 const markers={
  [keys[0]]:['31','unit','integration','end-to-end'],
  [keys[1]]:['31','28','15','feeEnabled'],
  [keys[2]]:['five','5.5','<=','adapter'],
  [keys[3]]:['3100','31','0.31','mapper'],
  [keys[4]]:['13','98','2/5','95%'],
  [keys[5]]:['[2,3]',"'23'",'Number.isFinite','adapter']
 };
 for(const [key,terms] of Object.entries(markers)){
  const body=[lessons[key].essentialQuestion,...lessons[key].reasoningSteps,...lessons[key].labPlan].join(' ');
  for(const term of terms)assert.ok(body.includes(term),key+': missing '+term);
 }
});
