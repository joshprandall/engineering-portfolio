'use strict';
/* Structural pass/fail plus honest editorial-debt reporting. This is not peer review. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const workspace={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'knowledge-data.js'),'utf8'),workspace,{timeout:30000});
const corpus=workspace.window.JR_KNOWLEDGE;
assert(corpus&&Array.isArray(corpus.lessons),'Learning corpus unavailable');
const metrics={lessons:corpus.lessons.length,quizQuestions:0,firstOptionCorrect:0,repeatedQuestionInstances:0,
 missingSources:0,malformedQuestions:0,duplicateIDs:0,packs:0,packEntries:0,genericEssentialQuestions:0,
 genericReasoningOpenings:0,emptyVocabulary:0,distinctClaims:0};
const ids=new Set(),questions=new Set(),claims=new Set();
for(const lesson of corpus.lessons){
 if(!lesson.id||ids.has(lesson.id))metrics.duplicateIDs++;
 ids.add(lesson.id);
 if(!Array.isArray(lesson.references)||!lesson.references.length)metrics.missingSources++;
 for(const q of [lesson.quiz,...(lesson.assessment||[])].filter(Boolean)){
  metrics.quizQuestions++;
  if(q.answer===0)metrics.firstOptionCorrect++;
  if(!q.q||!Array.isArray(q.options)||q.options.length<2||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length||(q.optionExplanations&&q.optionExplanations.length!==q.options.length))metrics.malformedQuestions++;
  const key=String(q.q||'').trim().toLowerCase().replace(/\s+/g,' ');
  if(questions.has(key))metrics.repeatedQuestionInstances++;
  questions.add(key);
 }
}
const index=JSON.parse(fs.readFileSync(path.join(root,'deep-learning/index.json'),'utf8'));
for(const rel of new Set(Object.values(index))){
 const pack=JSON.parse(fs.readFileSync(path.join(root,'deep-learning',rel),'utf8'));
 metrics.packs++;
 for(const g of Object.values(pack)){
  metrics.packEntries++;
  metrics.genericEssentialQuestions+=String(g.essentialQuestion||'').startsWith('What does ')?1:0;
  metrics.genericReasoningOpenings+=g.reasoningSteps?.[0]==='State the question in your own words before reading the answer.'?1:0;
  metrics.emptyVocabulary+=!Array.isArray(g.vocabulary)||g.vocabulary.length===0?1:0;
  claims.add(g.verifiedBoundary||'');
 }
}
metrics.distinctClaims=claims.size;
const errors=[];
if(metrics.lessons!==8000)errors.push('Stable lesson count changed: '+metrics.lessons+' instead of 8000');
for(const field of ['duplicateIDs','missingSources','malformedQuestions'])if(metrics[field])errors.push(field+': '+metrics[field]);
if(metrics.packs!==76)errors.push('Expected 76 teaching packs; found '+metrics.packs);
// Do not allow measurable editorial debt to get worse while real lessons are being rewritten.
for(const [key,maximum] of Object.entries({firstOptionCorrect:7763,repeatedQuestionInstances:6022,genericEssentialQuestions:7992,genericReasoningOpenings:7992,emptyVocabulary:0}))if(metrics[key]>maximum)errors.push(key+' increased beyond the 2026-11-10 audited baseline ('+metrics[key]+' > '+maximum+')');
console.log('Content-quality evidence (not independent academic validation):\n'+JSON.stringify(metrics,null,2));
if(errors.length){console.error('Content gate failed:\n'+errors.join('\n'));process.exitCode=1;}
else console.log('PASS: structural content gate; editorial debt remains and is explicitly recorded.');
