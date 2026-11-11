'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','cloud','kubernetes.json'),'utf8'));
const ids=["cloud-v06-kubernetes-namespace-scope","cloud-v06-kubernetes-service-abstraction","cloud-v06-kubernetes-dns-discovery","cloud-v06-kubernetes-serviceaccount-namespace-scope","cloud-v06-required-vs-preferred-node-affinity","cloud-v09-teach-back-lab-kubernetes-dns-discovery","cloud-v09-troubleshooting-lab-kubernetes-namespace-scope","cloud-v09-quick-reference-kubernetes-service-abstraction","cloud-v09-misconception-clinic-kubernetes-serviceaccount-namespace-scope","cloud-v09-scenario-analysis-required-vs-preferred-node-affinity"];
test('92 original Kubernetes records and ten distinct documented learning labs',()=>{
 assert.equal(Object.keys(lessons).length,92);assert.equal(new Set(ids).size,10);
 const questions=new Set();
 for(const id of ids){const x=lessons[id];assert.ok(x);assert.match(x.essentialQuestion,/\?$/);assert.doesNotMatch(x.essentialQuestion,/^What does /);assert.ok(!questions.has(x.essentialQuestion));questions.add(x.essentialQuestion);
  assert.equal(x.reasoningSteps.length,6);assert.equal(x.labPlan.length,6);assert.ok(x.reasoningSteps.every(s=>s.length>=70));assert.ok(x.labPlan.every(s=>s.length>=60));
  assert.match(x.reasoningSteps[5],/https:\/\/kubernetes\.io\/docs\//);
  for(const k of ['verifiedBoundary','analogy','starter','technical','memoryLadder','vocabulary','video'])assert.ok(x[k],id+':'+k);
 }
});
test('resource key permits equal names across two namespaces',()=>{
 const key=(ns,kind,name)=>[ns,kind,name].join('/');
 assert.notEqual(key('alpha','Service','api'),key('beta','Service','api'));
 assert.equal(key('alpha','Service','api'),key('alpha','Service','api'));
});
test('namespace-local and qualified service FQDNs are different',()=>{
 const fqdn=(name,ns)=>name+'.'+ns+'.svc.cluster.local';
 assert.equal(fqdn('data','test'),'data.test.svc.cluster.local');
 assert.notEqual(fqdn('data','test'),fqdn('data','prod'));
 assert.equal(fqdn('payments','green'),'payments.green.svc.cluster.local');
});
test('Service selector excludes nonmatching Pods and changes with labels',()=>{
 const pods=[{name:'a',app:'api'},{name:'b',app:'api'},{name:'c',app:'batch'}];
 assert.deepEqual(pods.filter(p=>p.app==='api').map(p=>p.name),['a','b']);
 assert.deepEqual(pods.filter(p=>p.app==='api'&&p.name!=='a').map(p=>p.name),['b']);
});
test('selectorless Service does not discover an illustrative endpoint by selector',()=>{
 const service={name:'legacy',selector:null},slices=[{service:'legacy',addresses:['192.0.2.50']}];
 assert.equal(service.selector,null);
 assert.deepEqual(slices.filter(s=>s.service===service.name).flatMap(s=>s.addresses),['192.0.2.50']);
 assert.deepEqual([].filter(s=>s.service===service.name),[]);
});
test('RBAC ServiceAccount subject distinguishes namespaces even with the same name',()=>{
 const subject=(ns)=>({kind:'ServiceAccount',namespace:ns,name:'reader'});
 assert.notDeepEqual(subject('dev'),subject('prod'));
 const grant={subject:subject('dev'),verb:'list',resource:'jobs',namespace:'prod'};
 assert.deepEqual(grant.subject,subject('dev'));assert.notDeepEqual(grant.subject,subject('prod'));
});
test('projected credentials do not implicitly authorize Secrets',()=>{
 const grants=new Set(['qa:pods:get']);const allowed=(ns,res,verb)=>grants.has(ns+':'+res+':'+verb);
 assert.equal(allowed('qa','pods','get'),true);assert.equal(allowed('qa','secrets','list'),false);
 grants.add('qa:secrets:list');assert.equal(allowed('qa','secrets','list'),true);assert.equal(allowed('prod','secrets','list'),false);
});
test('required node filter excludes a preferred but ineligible Windows node',()=>{
 const nodes=[{id:'a',os:'linux',zone:'west'},{id:'b',os:'linux',zone:'east'},{id:'c',os:'windows',zone:'west'}];
 const feasible=nodes.filter(n=>n.os==='linux');
 assert.deepEqual(feasible.map(n=>n.id),['a','b']);
 assert.deepEqual(feasible.map(n=>n.zone==='west'?100:0),[100,0]);
});
test('node affinity AND inside a term, OR between separate required terms',()=>{
 const nodes=[{id:'A',os:'linux',disk:'ssd',zone:'east'},{id:'B',os:'windows',disk:'hdd',zone:'west'},{id:'C',os:'linux',disk:'hdd',zone:'east'}];
 const eligible=n=>(n.os==='linux'&&n.disk==='ssd')||n.zone==='west';
 assert.deepEqual(nodes.filter(eligible).map(n=>n.id),['A','B']);
 assert.deepEqual(nodes.map(n=>({...n,zone:'east'})).filter(eligible).map(n=>n.id),['A']);
});
test('namespace of a request changes its visibility into namespaced fixture',()=>{
 const pods=[{name:'api',ns:'staging'},{name:'gateway',ns:'dev'}];
 const query=ns=>pods.filter(p=>p.ns===ns&&p.name==='api');
 assert.deepEqual(query('dev'),[]);assert.equal(query('staging').length,1);
});
test('all authored Kubernetes labs disclose synthetic evidence and link primary sources',()=>{
 for(const id of ids){const x=lessons[id],body=[...x.reasoningSteps,...x.labPlan].join(' ');
  assert.match(body,/fictional|synthetic|illustrative/);assert.match(body,/https:\/\/kubernetes\.io\/docs\//);
  assert.doesNotMatch(body,/we measured on a live cluster|confirmed in production/);
 }
});
