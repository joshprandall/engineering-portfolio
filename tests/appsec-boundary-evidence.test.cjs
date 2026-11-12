'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','cyber','application-security.json'),'utf8'));
const ids=["cyber-session","cyber-xss","cyber-sql-injection","cyber-ssrf","cyber-access-control","cyber-input-validation","cyber-v06-session-identifiers","cyber-v06-authorization-deny-by-default","cyber-v06-object-level-authorization","cyber-v06-parameterized-sql-queries","cyber-v06-contextual-output-encoding","cyber-v06-ssrf-allowlisting"];
test('all 116 application-security records retained and 12 distinct authored offline labs',()=>{
 assert.equal(Object.keys(lessons).length,116);
 assert.equal(new Set(ids).size,12);
 const questions=new Set();
 for(const id of ids){
  const x=lessons[id];assert.ok(x,id);
  assert.ok(x.essentialQuestion.endsWith('?'),id);
  assert.doesNotMatch(x.essentialQuestion,/^What does /,id);
  assert.ok(!questions.has(x.essentialQuestion),id);questions.add(x.essentialQuestion);
  assert.equal(x.reasoningSteps.length,6,id);
  assert.equal(x.labPlan.length,6,id);
  assert.ok(x.reasoningSteps.every(s=>s.length>=70),id);
  assert.ok(x.labPlan.every(s=>s.length>=60),id);
  assert.match(x.reasoningSteps[5],/https:\/\/cheatsheetseries\.owasp\.org\//,id);
  for(const field of ['verifiedBoundary','analogy','starter','technical','memoryLadder','vocabulary','video'])assert.ok(x[field],id+':'+field);
 }
});
test('auth transition rotates and revokes rather than upgrading anonymous cookie',()=>{
 const table=new Map([['A','anonymous']]);table.set('A','revoked');table.set('B','authenticated');
 assert.equal(table.get('A'),'revoked');assert.equal(table.get('B'),'authenticated');
 assert.equal([...table.values()].filter(x=>x==='authenticated').length,1);
});
test('text-node rendering preserves non-executable markup characters',()=>{
 const text='<b>hello</b>';
 const render={kind:'text',value:text};
 assert.equal(render.value,text);
 assert.equal((render.value.match(/</g)||[]).length,2);
 assert.notEqual(render.kind,'parsed-html');
});
test('bound SQL value matches a complete ID instead of changing predicate structure',()=>{
 const users=[{id:'Ada'},{id:'Bea'},{id:'Cal'}];
 const query='SELECT name FROM accounts WHERE id = ?';
 const value="x' OR '1'='1";
 assert.equal(users.filter(u=>u.id===value).length,0);
 assert.equal(users.filter(u=>u.id==='Ada').length,1);
 assert.equal(query,'SELECT name FROM accounts WHERE id = ?');
});
test('SSRF redirect trace fails when any destination is loopback',()=>{
 const permitted=new Set(['203.0.113.7']);
 const hops=['203.0.113.7','127.0.0.1'];
 assert.equal(hops.every(ip=>permitted.has(ip)),false);
 assert.equal(['203.0.113.7'].every(ip=>permitted.has(ip)),true);
});
test('server authorization decisions ignore browser button visibility',()=>{
 const allowed=(role,verb)=>role==='admin'&&verb==='DELETE';
 for(const visible of [true,false]){
  assert.equal(allowed('viewer','DELETE'),false);
  assert.equal(allowed('admin','DELETE'),true);
  assert.equal(typeof visible,'boolean');
 }
});
test('JSON inventory schema rejects coercion, fractions and invalid ranges',()=>{
 const valid=v=>Number.isInteger(v)&&v>=1&&v<=50;
 assert.deepEqual([4,0,-2,51,4.5,'4'].map(valid),[true,false,false,false,false,false]);
 assert.equal(valid(51),false);
});
test('effective uniform hex-token entropy depends on random positions',()=>{
 const entropy=randomHexDigits=>randomHexDigits*4;
 assert.equal(entropy(32),128);assert.equal(entropy(16),64);
 assert.equal(entropy(0),0);
});
test('deny by default refuses unmatched export permissions',()=>{
 const grants=new Set(['viewer:read','editor:edit']);
 const allow=(role,action)=>grants.has(role+':'+action);
 assert.equal(allow('viewer','read'),true);assert.equal(allow('editor','edit'),true);
 assert.equal(allow('guest','export'),false);assert.equal(allow('viewer','export'),false);
 grants.add('editor:export');assert.equal(allow('editor','export'),true);
 assert.equal(allow('viewer','export'),false);
});
test('object level check rejects cross-tenant access to an existing row',()=>{
 const rows=[{id:201,tenant:'A'},{id:202,tenant:'B'}];
 const canRead=(actor,id)=>rows.some(r=>r.id===id&&r.tenant===actor.tenant);
 assert.equal(canRead({tenant:'A'},201),true);
 assert.equal(canRead({tenant:'A'},202),false);
 assert.equal(canRead({tenant:'B'},202),true);
 assert.equal(canRead({tenant:'B'},404),false);
});
test('SQL identifiers and sort direction come only from fixed mapping',()=>{
 const dirs={newest:'DESC',oldest:'ASC'};
 function build(sort,customer){
  if(!Object.hasOwn(dirs,sort))throw Error('unapproved sort');
  return {query:'SELECT id FROM orders WHERE customer = ? ORDER BY created_at '+dirs[sort],params:[customer]};
 }
 assert.deepEqual(build('newest','Ada'),{query:'SELECT id FROM orders WHERE customer = ? ORDER BY created_at DESC',params:['Ada']});
 assert.equal(build('newest',"x'").query,build('newest','Ada').query);
 assert.throws(()=>build('arbitrary text','Ada'),/unapproved/);
});
test('URL-component encoding is distinct from raw text-node insertion',()=>{
 const title='<b>Ada</b>';
 assert.equal(encodeURIComponent(title),'%3Cb%3EAda%3C%2Fb%3E');
 assert.equal(({kind:'text',value:title}).value,title);
 const scheme=(s)=>['https:','http:'].includes(new URL(s).protocol);
 assert.equal(scheme('https://example.org'),true);
 assert.equal(scheme('javascript:alert(1)'),false);
});
test('SSRF host allowlist alone does not authorize a changed DNS answer',()=>{
 const name='partner.example';
 const permittedNames=new Set([name]),permittedIPs=new Set(['203.0.113.7']);
 const allowed=(host,ip)=>permittedNames.has(host)&&permittedIPs.has(ip);
 assert.equal(allowed(name,'203.0.113.7'),true);
 assert.equal(allowed(name,'127.0.0.1'),false);
 assert.equal(allowed(name,'169.254.169.254'),false);
});
