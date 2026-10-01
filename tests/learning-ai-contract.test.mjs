import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const exists=f=>fs.existsSync(path.join(root,f));
const sandbox={window:{}};vm.runInNewContext(read('knowledge-data.js'),sandbox,{filename:'knowledge-data.js'});
const D=sandbox.window.JR_KNOWLEDGE;
assert(D,'knowledge corpus must load');
assert.equal(D.lessons.length,8000,'release must contain 8,000 learning objects');
assert.equal(D.lessons.filter(l=>l.interactive||l.kind==='Lab').length,4000,'release must contain 4,000 labs/interactive learning objects');
assert.equal((D.glossary||[]).length,1600,'release must contain 1,600 glossary terms');
assert.equal((D.paths||[]).length,300,'release must contain 300 guided paths');
assert.equal(D.lessons.filter(l=>l.verification?.status==='verified').length,D.lessons.length,'every published lesson must be verified');
const deepPackCache=new Map();
for(const l of D.lessons){
 for(const k of ['id','title','domain','category','kind','difficulty','minutes','summary','takeaway','example'])assert(l[k]!==undefined&&l[k]!==null&&l[k]!=='',l.id+': missing '+k);
 assert(l.verifiedClaims?.length,l.id+': missing verified claim');
 assert(l.tags?.length,l.id+': missing tags');
 const slug=String(l.category||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'general';
 const packPath=path.join(root,'deep-learning',l.domain,slug+'.json');
 assert(fs.existsSync(packPath),l.id+': missing deep-learning pack '+packPath);
 let pack=deepPackCache.get(packPath);
 if(!pack){pack=JSON.parse(fs.readFileSync(packPath,'utf8'));deepPackCache.set(packPath,pack);}
 assert(pack[l.id],l.id+': missing deep-learning guide');
 assert(pack[l.id].labPlan?.length>=4,l.id+': deep-learning guide missing lab plan');
}
const knowledge=read('knowledge.js');
const implemented=new Set([...knowledge.matchAll(/if\(type===['"]([^'"]+)['"]\)/g)].map(m=>m[1]));
const interactiveTypes=new Set(D.lessons.map(l=>l.interactive).filter(Boolean));
for(const type of interactiveTypes)assert(implemented.has(type),'interactive type has no implementation: '+type);
assert.equal(interactiveTypes.size,implemented.size,'interactive implementation set and release-data set must match exactly');
const visuals={window:{}};vm.runInNewContext(read('learning-visuals.js'),visuals);
for(const type of interactiveTypes)assert(visuals.window.LearningVisuals.render({interactive:type}),type+': missing teaching model');
const ids=new Set(D.lessons.map(l=>l.id)),domains=new Set(D.domains.map(d=>d.id));
for(const l of D.lessons){
 assert(domains.has(l.domain),l.id+': unknown domain');
 for(const id of [...l.prereq||[],...l.related||[]])assert(ids.has(id),l.id+': unresolved learning reference '+id);
 if(l.quiz){assert(Number.isInteger(l.quiz.answer)&&l.quiz.answer>=0&&l.quiz.answer<l.quiz.options.length,l.id+': invalid quiz answer');assert(l.quiz.explanation||l.quiz.explain,l.id+': quiz needs feedback');}
}
for(const p of D.paths)for(const id of p.lesson_ids)assert(ids.has(id),p.id+': unresolved path record '+id);
const solar=read('solar-navigation.js');
for(const [page,count] of [['index.html',6],['learn.html',7],['ai-development.html',19]]){
 const html=read(page),hrefs=[...html.matchAll(/class="solar-planet-link" href="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(hrefs.length,count,page+': wrong solar destination count');
 for(const href of hrefs){const file=href.split(/[?#]/)[0];assert(exists(file),page+': missing solar destination '+href);}
 assert(!html.includes('solar-orbits')&&!html.includes('solar-capabilities'),page+': duplicate solar tile navigation returned');
}
const homeSolar=read('index.html');
assert(homeSolar.includes('href="security-research.html" aria-label="Security Research"'),'Homepage solar must include Security Research as a dedicated destination');
assert(!homeSolar.includes('class="solar-planet-link" href="index.html" aria-label="Home"'),'Homepage solar must not include redundant Home destination');
assert(solar.includes('solar-descriptor'),'solar descriptor implementation missing');
assert(solar.includes('selectPlanet'),'planet selection must update descriptor rather than navigate immediately');
const aiLanding=read('ai-development.html');
assert(!aiLanding.includes('destination-grid')&&!aiLanding.includes('destination-card'),'AI landing page must not contain navigation/detail tiles');
const aiLinks=[...aiLanding.matchAll(/class="solar-planet-link" href="([^"]+)" aria-label="([^"]+)"/g)];
assert.equal(aiLinks.length,19,'AI solar must expose 19 dedicated build pages');
const labScript=read('ai-build-lab.js');
for(const [,href,label] of aiLinks){
 assert(exists(href),'missing dedicated AI page '+href);
 const html=read(href);
 assert(html.includes('data-ai-build='),href+': missing AI build identifier');
 assert(html.includes('id="ai-lab-root"'),href+': missing interactive lab');
 assert(html.includes('ai-build-lab.js'),href+': missing lab runtime');
 assert(!html.includes('destination-grid')&&!html.includes('destination-card'),href+': tile grid must not appear');
 for(const heading of ['Core concepts','Architecture / workflow','Technical foundations','Evaluation checklist','Failure modes and limits','Practical build path','Primary / authoritative references'])assert(html.includes(heading),href+': missing '+heading);
 const id=html.match(/data-ai-build="([^"]+)"/)?.[1];assert(id&&labScript.includes("case '"+id+"'"),href+': lab implementation missing');
 const local=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]).filter(h=>!h.startsWith('http')&&!h.startsWith('#')&&!h.startsWith('mailto:'));
 for(const h of local){const file=h.split(/[?#]/)[0];assert(exists(file),href+': broken local link '+h);}
}
console.log('PASS learning/AI contract: 8,000 structurally checked records, 4,000 lab/model catalog entries, 66 interactive types, 8,000 teaching-pack records, 19 dedicated AI pages and solar descriptors.');
