'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','deep-learning','cloud','identity.json'),'utf8'));
const selected=['cloud-v06-kerberos-key-distribution-center','cloud-v06-ldap-operations','cloud-v09-design-review-kerberos-key-distribution-center','cloud-v09-practical-lab-ldap-operations','cloud-v09-worked-example-kerberos-key-distribution-center','cloud-v09-failure-analysis-lab-ldap-operations'];
const markers={
 [selected[0]]:['AS-REQ','AS-REP','TGS-REQ','TGS-REP','AP-REQ','authorization'],
 [selected[1]]:['singleLevel','compareTrue','insufficientAccessRights','uid=beau'],
 [selected[2]]:['240','360','300','KRB_AP_ERR_SKEW','KRB_AP_ERR_REPEAT'],
 [selected[3]]:['singleLevel','wholeSubtree','uid=ada','uid=lin','uid=beau'],
 [selected[4]]:['09:00','17:00','09:10','10:10','10:20','600 seconds'],
 [selected[5]]:['invalidDNSyntax (34)','noSuchObject (32)','insufficientAccessRights (50)','success (0)']
};
const generic=/state the question in your own words|identify the exact verified claim|what does .+ mean, why does it matter|predict the outcome before manipulating|run the interactive model or work through/i;
test('six protocol lessons improve reasoning and preserve 89 lesson entries',()=>{
 assert.equal(Object.keys(lessons).length,89);
 const questions=new Set();
 for(const key of selected){
  const x=lessons[key];assert.ok(x,key+' missing');
  assert.ok(x.verifiedBoundary&&x.starter&&x.memoryLadder&&x.video&&x.technical,key+' evidence fields missing');
  assert.ok(Array.isArray(x.vocabulary)&&x.vocabulary.length>0);
  assert.equal(x.reasoningSteps.length,6);assert.equal(x.labPlan.length,6);
  assert.ok(x.essentialQuestion.endsWith('?'));assert.doesNotMatch(x.essentialQuestion,generic);
  assert.ok(!questions.has(x.essentialQuestion));questions.add(x.essentialQuestion);
  assert.equal(new Set(x.reasoningSteps).size,6);assert.equal(new Set(x.labPlan).size,6);
  for(const s of [...x.reasoningSteps,...x.labPlan]){
    assert.ok(s.length>=75,key+' underspecified: '+s);
    assert.doesNotMatch(s,generic);
    assert.doesNotMatch(s,/we measured in production|we detected on our network|our actual directory/i);
  }
  const joined=[x.essentialQuestion,...x.reasoningSteps,...x.labPlan].join(' ');
  for(const term of markers[key])assert.ok(joined.includes(term),key+' lacks '+term);
  assert.match(x.labPlan.join(' '),/synthetic|fictional|fabricated/i);
  assert.match(x.labPlan.join(' '),/https:\/\/(?:datatracker\.ietf\.org\/doc\/html\/rfc4120|www\.rfc-editor\.org\/rfc\/rfc4511)/);
 }
});
test('Kerberos protocol phases, skew, replay, ticket validity and authorization are distinct',()=>{
 const flow=[['AS-REQ','KDC-AS'],['AS-REP','client'],['TGS-REQ','KDC-TGS'],['TGS-REP','client'],['AP-REQ','service']];
 assert.deepEqual(flow.map(x=>x[0]),['AS-REQ','AS-REP','TGS-REQ','TGS-REP','AP-REQ']);
 assert.deepEqual(flow.filter(x=>x[1].startsWith('KDC')).map(x=>x[1]),['KDC-AS','KDC-TGS']);
 assert.equal(flow.at(-1)[1],'service');
 const maxSkew=300;
 assert.equal(Math.abs(240)<=maxSkew,true);assert.equal(Math.abs(360)<=maxSkew,false);
 const original={principal:'alice',server:'HTTP/api.example.test',time:'09:02:00',us:1234};
 assert.deepEqual({...original},original);assert.notDeepEqual({...original,us:1235},original);
 const minute=t=>{const [h,m]=t.split(':').map(Number);return 60*h+m;};
 assert.equal((minute('10:20')-minute('10:10'))*60,600);
 assert.equal(minute('17:00')-minute('10:20'),400);
 assert.ok(600>maxSkew);
 assert.match(lessons[selected[4]].reasoningSteps.join(' '),/authorization/i);
});
test('LDAP synthetic base, one-level, subtree and filter decisions reproduce expected entry sets',()=>{
 const entries=[
 {dn:'uid=ada,ou=engineers,dc=example,dc=test',uid:'ada',objectClass:'person'},
 {dn:'uid=lin,ou=engineers,dc=example,dc=test',uid:'lin',objectClass:'person'},
 {dn:'uid=beau,ou=ops,dc=example,dc=test',uid:'beau',objectClass:'person'}];
 const base='ou=engineers,dc=example,dc=test',root='dc=example,dc=test';
 const child=(dn,b)=>dn.endsWith(','+b)&&dn.split(',').length===b.split(',').length+1;
 assert.deepEqual(entries.filter(x=>child(x.dn,base)&&x.objectClass==='person').map(x=>x.uid),['ada','lin']);
 assert.deepEqual(entries.filter(x=>child(x.dn,base)&&x.uid==='beau'),[]);
 assert.deepEqual(entries.filter(x=>x.dn.endsWith(','+root)&&x.uid==='lin').map(x=>x.uid),['lin']);
 assert.deepEqual(entries.filter(x=>x.dn===entries[0].dn&&x.uid==='ada').map(x=>x.uid),['ada']);
 assert.equal(entries.filter(x=>child(x.dn,entries[0].dn)).length,0);
});
test('LDAP success with zero entries is not the same as syntax, missing-object or access failures',()=>{
 const examples=[
 {operation:'search',result:0,entries:[]},
 {operation:'search',result:34,meaning:'invalidDNSyntax'},
 {operation:'search',result:32,meaning:'noSuchObject'},
 {operation:'modify',result:50,meaning:'insufficientAccessRights'}];
 assert.deepEqual(examples.map(x=>x.result),[0,34,32,50]);
 assert.equal(examples[0].entries.length,0);
 assert.equal(new Set(examples.map(x=>x.result)).size,4);
 assert.match(lessons[selected[5]].labPlan.join(' '),/noSuchObject/);
});
