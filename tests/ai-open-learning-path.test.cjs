'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'assets/learning-academy.json'),'utf8'));
const track=data.aiResearchPath;
const permitted=new Set(['ocw.mit.edu','cs50.harvard.edu','cs.nyu.edu','mitpress.mit.edu','www.deeplearningbook.org','udlbook.github.io','algorithmsbook.com','www.distributional-rl.org','marl-book.com','www.di.ens.fr']);
test('AI research path is a ten-stage original assessment sequence',()=>{
 assert.equal(data.programs.length,7,'Seven existing programs preserved');
 assert.equal(track.stages.length,10);
 assert.match(track.statement,/independent/i);
 assert.match(track.assessment,/not external grading|not a grade|not.*certification/i);
 assert.equal(new Set(track.stages.map(x=>x.id)).size,10);
 for(const [index,s] of track.stages.entries()){
  assert.match(s.title,new RegExp('^'+String(index+1).padStart(2,'0')+' \\/ '));
  assert(s.hours>=6&&s.hours<=30,s.id+' bounded work');
  for(const field of ['question','practice','deliverable']){
   assert(s[field]?.length>=45,s.id+' requires substantive '+field);
  }
  assert(s.prerequisites.length>=1);
  assert(s.acceptance.length>=4,'explicit evidence gate in '+s.id);
  assert(s.resources.length>=2,'multi-source stage '+s.id);
  for(const criterion of s.acceptance)assert(criterion.length>25,'falsifiable criterion in '+s.id);
  const target=path.resolve(root,s.onsite.split('?')[0]);
  assert(target.startsWith(root+path.sep)&&fs.existsSync(target),'related local destination in '+s.id);
 }
});
test('18 direct attributed publisher/provider links, no shorteners or tracking',()=>{
 assert.equal(track.resources.length,18);
 assert.equal(new Set(track.resources.map(x=>x.id)).size,18);
 assert.equal(track.resources.filter(x=>x.provider==='MIT OpenCourseWare').length,7);
 assert.equal(track.resources.filter(x=>x.provider==='Harvard CS50').length,3);
 const used=new Set(track.stages.flatMap(s=>s.resources));
 for(const resource of track.resources){
  assert(used.has(resource.id),'orphaned resource '+resource.id);
  const url=new URL(resource.url);
  assert.equal(url.protocol,'https:');
  assert(permitted.has(url.hostname),'not an official or author-hosted resource: '+resource.url);
  assert.equal(url.search,'','canonical no-tracking links');
  assert.equal(url.hash,'');
  assert(resource.title.length>=12&&resource.provider.length>=7);
 }
 for(const id of used)assert(track.resources.some(r=>r.id===id),'missing source '+id);
});
test('ten rigorous formative checkpoints have independent numerical oracles and scientific limitations',()=>{
 const oracles={
  'python-reproducibility':37/100,
  'linear-algebra':1*1.001-1*1,
  'algorithms-validation':Math.min(2+3,1+10),
  'symbolic-ai':(0.10*0.90)/(0.10*0.90+0.90*0.20),
  'learning-theory':95-75,
  'backpropagation':2*(1-3),
  'transformers':Math.exp(Math.log(2))/(Math.exp(0)+Math.exp(Math.log(2))),
  'rag-evaluation':3/5,
  'reinforcement-learning':(9*2-10)/10,
  'multiagent-capstone':0.8*0.75
 };
 assert.equal(Object.keys(oracles).length,10);
 for(const s of track.stages){
  const c=s.checkpoint;
  assert(c&&typeof c==='object','checkpoint missing in '+s.id);
  assert(c.prompt.length>=70&&c.hint.length>=30,'substantive original prompt and hint in '+s.id);
  assert(c.unit&&c.unit.length>=5,'unit missing in '+s.id);
  assert(Number.isFinite(c.answer)&&Number.isFinite(c.tolerance),'finite answer/tolerance '+s.id);
  assert(c.tolerance>0&&c.tolerance<=0.001,'reasonable absolute tolerance in '+s.id);
  assert.equal(c.derivation.length,3,'three-step worked derivation in '+s.id);
  assert(c.derivation.every(step=>step.length>=20),'no placeholder solution steps in '+s.id);
  assert(c.misconception.length>=65&&c.extension.length>=65,'error/extension analysis in '+s.id);
  const expected=oracles[s.id];
  assert(Number.isFinite(expected),'independent oracle missing in '+s.id);
  assert(Math.abs(c.answer-expected)<=c.tolerance/10,'independently derived answer mismatch: '+s.id);
 }
});
test('browser rendering keeps protected presentation and saved progress scoped to self-report',()=>{
 const js=fs.readFileSync(path.join(root,'learning-academy.js'),'utf8');
 assert(js.includes("page!=='learn-paths.html'"));
 assert(js.includes("page==='learn.html'"));
 assert(js.includes("researchPath(academy);"));
 assert(js.includes("localStorage.setItem(key,JSON.stringify([...complete]))"));
 assert(js.includes('rel="noopener noreferrer"'));
 assert(js.includes("esc(s.practice)"));
 assert(!js.includes('document.write('));
});
