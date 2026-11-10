'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const projects=JSON.parse(fs.readFileSync(path.join(root,'assets/project-evaluation.json'),'utf8')).projects;
const required=['hypothesis','fixture','oracle','falsifier','evidence'];
assert.equal(Object.keys(projects).length,34,'Preserve the 34 existing project review dossiers');
const hypotheses=new Set(),fixtures=new Set();
for(const [file,project] of Object.entries(projects)){
 assert(fs.existsSync(path.join(root,file)),'Missing project page '+file);
 assert(project.title&&project.problem&&project.limitations,'Existing claim boundary was lost for '+file);
 const protocol=project.reviewProtocol;
 assert(protocol&&typeof protocol==='object','Missing review protocol: '+file);
 for(const key of required)assert(typeof protocol[key]==='string'&&protocol[key].length>70,'Insufficient '+key+' for '+file);
 assert(!hypotheses.has(protocol.hypothesis),'Duplicated project hypothesis: '+file);
 assert(!fixtures.has(protocol.fixture),'Duplicated project fixture: '+file);
 hypotheses.add(protocol.hypothesis);
 fixtures.add(protocol.fixture);
}
const implementation=fs.readFileSync(path.join(root,'project-mastery.js'),'utf8');
for(const key of required)assert(implementation.includes('meta.reviewProtocol.'+key),'Project protocol field is not rendered: '+key);
assert(implementation.includes('Proposed verification protocol, not a claim'),'Experimental status must be explicitly bounded');
console.log('PASS: 34 distinct evidence-first project protocols; no experimental result was asserted as completed.');
