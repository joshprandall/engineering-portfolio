const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {experiments:E}=require('../learning-experiments.js');
const defaults=id=>Object.fromEntries(E[id].fields.map(f=>[f.key,f.value]));
const run=(id,patch={})=>E[id].run({...defaults(id),...patch});
const close=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} ≠ ${b}`);

test('prefix arithmetic handles ordinary and exceptional endpoint semantics',()=>{
 const m=run('prefix').metrics;assert.equal(m.Network,'192.168.10.64/26');assert.equal(m['Upper address'],'192.168.10.127');assert.equal(m['Usable addresses under stated model'],62);
 for(const [prefix,n] of [[0,2**32],[31,2],[32,1]])assert.equal(run('prefix',{prefix}).metrics['Total addresses'],n);
 for(const patch of [{address:'10..0.1'},{address:'256.0.0.1'},{address:'010.0.0.1'},{prefix:1.5},{prefix:''},{prefix:33}])assert.throws(()=>run('prefix',patch));
});
test('matrix residual rejects a wrong candidate and the zero vector',()=>{
 assert.equal(run('eigen').metrics['Residual norm'],0);
 close(run('eigen',{y:-1,lambda:1}).metrics['Residual norm'],0);
 close(run('eigen',{y:-1}).metrics['Residual norm'],Math.sqrt(8));
 assert.throws(()=>run('eigen',{x:0,y:0}));
});
test('Bayes distinguishes sensitivity from posterior and rejects impossible evidence',()=>{
 close(run('bayes').metrics['P(condition | positive)'],90/585);
 assert.throws(()=>run('bayes',{prevalence:0,falsePositive:0}));
});
test('pure state axes and Bell correlations respect normalization and marginals',()=>{
 close(run('qubit').metrics['P(Y=+)'],1);
 for(const theta of [0,45,90,180])for(const phi of [-90,0,90,180]){
  const r=run('qubit',{theta,phi});close(r.metrics['Bloch-vector norm'],1);
  for(let i=0;i<6;i+=2)close(r.rows[i][1]+r.rows[i+1][1],1);
 }
 for(const basis of ['X','Y','Z'])for(const visibility of [0,.3,1]){
  const r=run('bell',{basis,visibility}),p=r.rows.map(x=>x[1]);close(p.reduce((a,b)=>a+b,0),1);close(p[0]+p[1],.5);close(p[0]+p[2],.5);
 }
 assert.equal(run('bell',{basis:'Y'}).metrics['Correlation ⟨σ⊗σ⟩'],-1);
});
test('recovery evidence and SLO window maintain separate meanings',()=>{
 assert.equal(run('recovery').metrics['Recovery demonstrated'],'No');
 assert.equal(run('recovery',{age:15}).metrics['Recovery demonstrated'],'Yes, within this fixture');
 assert.equal(run('recovery',{age:15,verified:'not tested'}).metrics['Recovery demonstrated'],'No');
 close(run('slo').metrics['Allowed bad requests'],1000);close(run('slo').metrics['Budget consumed (%)'],150);
 assert.match(run('slo',{target:100}).metrics['Budget consumed (%)'],/Undefined/);
 assert.throws(()=>run('slo',{bad:1000001}));
});
test('batch schema rejects the whole batch, including misleading numeric inputs',()=>{
 assert.equal(run('ingestion').metrics['Accepted records'],2);
 for(const records of ['[{"id":"A","owner":"IT","count":true}]','[{"id":"A","owner":"IT","count":1},{"id":" A ","owner":"IT","count":2}]','[{"id":"A","owner":"IT","count":-1}]'])assert.equal(run('ingestion',{records}).metrics['Accepted records'],0);
 assert.throws(()=>run('ingestion',{records:'[broken'}));
});
test('reviewed lessons expose complete feedback without inflating legacy counts',()=>{
 const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../knowledge-data.js'),'utf8'),sandbox);vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../knowledge-upgrades.js'),'utf8'),sandbox);const d=sandbox.window.JR_KNOWLEDGE;
 assert.equal(d.lessons.length,8000);
 const reviewed=d.lessons.filter(l=>l.editorialReview?.release==='3.1');assert.equal(reviewed.length,8);
 const positions=new Set();for(const l of reviewed){assert(E[l.flagship.experiment]);assert(fs.existsSync(path.join(__dirname,'..',l.flagship.download)));const bank=[l.quiz,...l.assessment];assert.equal(bank.length,5);for(const q of bank){assert.equal(q.optionExplanations.length,q.options.length);assert(q.options[q.answer]);positions.add(q.answer);}}
 assert.equal(positions.size,4);
});
