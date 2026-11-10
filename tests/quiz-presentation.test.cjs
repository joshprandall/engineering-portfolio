'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../knowledge.js'),'utf8');
const start=source.indexOf('  const quizPresentationCache=new WeakMap();');
const end=source.indexOf('  function quizQuestions(l)',start);
assert(start>=0&&end>start,'The real quiz presentation implementation must be tested');
const implementation=source.slice(start,end);
function build(draws){
  const host={};let calls=0;
  const context={globalThis:host,WeakMap,Uint32Array,Math,Number,Array};
  host.crypto={getRandomValues(values){values[0]=draws[calls++%draws.length]>>>0;return values;}};
  vm.runInNewContext(implementation+'\nglobalThis.present=presentedQuestion;',context);
  return {present:host.present,calls:()=>calls};
}
const question={q:'What fails?',options:['Correct','Wrong A','Wrong B','Wrong C'],answer:0,
 optionExplanations:['Why correct','Why A is wrong','Why B is wrong','Why C is wrong']};
test('all choice/explanation pairs stay aligned and retries use the same order',()=>{
 const {present,calls}=build([4,1,7,2,5,6]);
 const item=present(question);const count=calls();
 assert.equal(item.options.length,4);assert.equal(item.optionExplanations.length,4);
 assert.equal(item.options[item.answer],'Correct');
 item.options.forEach((label,index)=>assert.equal(item.optionExplanations[index],question.optionExplanations[question.options.indexOf(label)]));
 assert.equal(present(question),item);assert.equal(calls(),count);
 assert.deepEqual([...item.options].sort(),[...question.options].sort());
 assert.deepEqual(question.options,['Correct','Wrong A','Wrong B','Wrong C']);
});
test('answers do not depend on the original first position',()=>{
 const answers=new Set();
 for(let seed=0;seed<15;seed++){
  const {present}=build([seed,seed+1,seed+2,seed+3]);
  const item=present(question);
  answers.add(item.answer);
  assert.equal(item.options[item.answer],question.options[question.answer]);
 }
 assert(answers.size>=3,'Shuffling must produce multiple correct positions');
});
test('malformed quiz objects are left untouched for the separate content validator',()=>{
 const {present}=build([0]);
 for(const invalid of [{options:[],answer:0},{options:['a','b'],answer:4},null])assert.equal(present(invalid),invalid);
});
