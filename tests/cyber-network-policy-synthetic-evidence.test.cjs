'use strict';
// Independent, network-free calculations only: no sockets, credentials, network targets, or company data.
const test=require('node:test'),a=require('node:assert/strict'),crypto=require('node:crypto');
const lessons=require('../deep-learning/cyber/network-security.json');
const cases=require('./cyber-network-policy-24-case-source.json');
const ids=Object.keys(lessons),selected=ids.slice(0,24);
const t=(n,label,fn)=>test((n+1)+'. '+label,()=>{fn();a.equal(lessons[selected[n]].essentialQuestion,cases[n].q)});
const ipv4=s=>s.split('.').reduce((x,p)=>((x<<8)>>>0)+Number(p),0)>>>0;
const cidr=(ip,network,bits)=>{const m=(0xffffffff << (32-bits))>>>0;return (ipv4(ip)&m)===(ipv4(network)&m)};
const matchDNS=(expected,ref)=>expected.toLowerCase()===ref.toLowerCase()||
 (expected.startsWith('*.')&&expected.split('.').length===ref.split('.').length&&
 expected.split('.').slice(1).join('.').toLowerCase()===ref.split('.').slice(1).join('.').toLowerCase());
const reachable=(nodes,edges,from)=>{const seen=new Set([from]),todo=[from];while(todo.length){const u=todo.shift();for(const [x,v] of edges)if(x===u&&!seen.has(v)){seen.add(v);todo.push(v)}}return [...seen].sort()};
const policy=(rules,pkt,defaultDecision='deny')=>rules.find(rule=>rule.match(pkt))?.decision??defaultDecision;
const packet=(src,dst,proto,port)=>({src,dst,proto,port});
const reverse=f=>({src:f.dst,dst:f.src,sport:f.dport,dport:f.sport,proto:f.proto});
const equalTuple=(a,b)=>Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>a[k]===b[k]);

test('24 unique original topic-specific lessons, source and six-element authored evidence structures',()=>{
 a.equal(ids.length,94);a.equal(selected.length,24);a.equal(cases.length,24);
 a.equal(new Set(cases.map(x=>x.q)).size,24);
 const validReferences=new Set([
 'https://www.rfc-editor.org/rfc/rfc8446.html','https://www.rfc-editor.org/rfc/rfc9525.html',
 'https://www.rfc-editor.org/rfc/rfc5869.html','https://www.rfc-editor.org/rfc/rfc7301.html','https://csrc.nist.gov/pubs/sp/800/41/r1/final',
 'https://csrc.nist.gov/pubs/sp/800/207/final'
 ]);
 for(let i=0;i<24;i++){const row=lessons[selected[i]],c=cases[i];
  a.equal(c.id,selected[i]);a.equal(row.essentialQuestion,c.q);a.ok(!/^What does /u.test(row.essentialQuestion));
  a.equal(row.reasoningSteps.length,6);a.equal(row.labPlan.length,6);
  for(const step of [...row.reasoningSteps,...row.labPlan])a.ok(step.length>=65);
  a.ok(validReferences.has(c.source),selected[i]);
  a.ok(row.reasoningSteps[5].includes(c.source));
  a.ok(row.labPlan[5].includes(c.source));
  a.ok(row.labPlan[0].includes('offline')||row.labPlan[0].includes('Offline'));
 }
});
t(0,'SAN mismatch rejects valid-path wrong-host certificate',()=>{
 const cert={pathValid:true,san:['web.example'],cn:'api.example'};
 const authenticated=cert.pathValid&&cert.san.some(name=>matchDNS(name,'api.example'));
 a.equal(authenticated,false);
 a.equal(cert.pathValid&&cert.san.some(name=>matchDNS(name,'web.example')),true);
});
t(1,'first-match ordered firewall precedence',()=>{
 const p=packet('198.51.100.42','203.0.113.10','TCP',443);
 const allow={decision:'allow',match:p=>p.src==='198.51.100.42'&&p.dst==='203.0.113.10'&&p.proto==='TCP'&&p.port===443};
 const deny={decision:'deny',match:p=>cidr(p.src,'198.51.100.0',24)};
 a.equal(policy([deny,allow],p),'deny');a.equal(policy([allow,deny],p),'allow');
});
t(2,'segmentation cut removes data from reachability',()=>{
 const nodes=['user','api','data','dns'],edges=[['user','api'],['api','data'],['user','dns']];
 a.deepEqual(reachable(nodes,edges,'user'),['api','data','dns','user']);
 a.deepEqual(reachable(nodes,edges.filter(([x,y])=>!(x==='api'&&y==='data')),'user'),['api','dns','user']);
 a.deepEqual(reachable(nodes,[['user','api'],['user','dns'],['user','data']],'user'),['api','data','dns','user']);
});
t(3,'TLS record fragmentation bound at 16384 bytes',()=>{
 const count=x=>Math.ceil(x/16384);
 a.deepEqual([16384,16385,32769].map(count),[1,2,3]);
 a.equal(16385%16384,1);
});
t(4,'default-deny role matrix has four permitted of twelve',()=>{
 const entries={reader:['browse'],writer:['browse','submit'],auditor:['report']};
 const roles=Object.keys(entries),services=['browse','submit','report','admin'];
 let n=roles.flatMap(r=>services.filter(s=>entries[r].includes(s))).length;
 a.equal(n,4);a.equal(roles.length*services.length-n,8);
 a.equal(entries.reader.includes('admin'),false);entries.writer.push('report');
 a.equal(roles.flatMap(r=>services.filter(s=>entries[r].includes(s))).length,5);
});
t(5,'record nonce IV XOR sequence is unique within key epoch',()=>{
 const nonce=(iv,seq)=>{const x=Buffer.from(iv),ctr=Buffer.alloc(x.length);ctr.writeBigUInt64BE(BigInt(seq),x.length-8);return Buffer.from(x.map((b,i)=>b^ctr[i])).toString('hex')};
 a.equal(nonce(Buffer.alloc(12),0),'000000000000000000000000');
 a.equal(nonce(Buffer.alloc(12),1),'000000000000000000000001');
 const iv=Buffer.alloc(12);iv[11]=255;
 a.equal(nonce(iv,0).slice(-2),'ff');a.equal(nonce(iv,1).slice(-2),'fe');
});
t(6,'certificate trust and identity are independent conjunctions',()=>{
 const auth=(chain,name)=>chain&&matchDNS('service-a.example',name);
 a.equal(auth(true,'service-b.example'),false);a.equal(auth(true,'service-a.example'),true);
 a.equal(auth(false,'service-a.example'),false);
});
t(7,'stateful reverse five-tuple prevents arbitrary inbound port',()=>{
 const flow={src:'192.0.2.10',dst:'203.0.113.20',sport:51000,dport:443,proto:'TCP'};
 const accepted=reverse(flow);
 a.equal(equalTuple(accepted,{src:'203.0.113.20',dst:'192.0.2.10',sport:443,dport:51000,proto:'TCP'}),true);
 a.equal(equalTuple(accepted,{...accepted,dport:51001}),false);
});
t(8,'port-constrained segmentation accepts one of three requests',()=>{
 const allowed=(p)=>p.src==='sensor'&&p.dst==='resolver'&&p.proto==='UDP'&&p.port===53;
 const packets=[packet('sensor','resolver','UDP',53),packet('sensor','admin','TCP',443),packet('sensor','resolver','TCP',22)];
 a.deepEqual(packets.map(allowed),[true,false,false]);
 const augmented=p=>allowed(p)||(p.src==='sensor'&&p.dst==='resolver'&&p.proto==='TCP'&&p.port===53);
 a.equal(packets.filter(augmented).length,1);
 a.equal([...packets.slice(0,2),packet('sensor','resolver','TCP',53)].filter(augmented).length,2);
});
t(9,'TLS early-data replay and explicit idempotency contract',()=>{
 let counter=0;for(const requestId of ['r1','r1'])counter++;
 a.equal(counter,2);
 counter=0;const seen=new Set();for(const id of ['r1','r1'])if(!seen.has(id)){seen.add(id);counter++}
 a.equal(counter,1);
});
t(10,'presented CN must not be substituted for mismatched DNS SAN',()=>{
 const c={san:['wrong.example'],cn:'right.example'};
 a.equal(c.cn==='right.example',true);
 a.equal(c.san.some(x=>matchDNS(x,'right.example')),false);
 c.san=['right.example'];a.equal(c.san.some(x=>matchDNS(x,'right.example')),true);
});
t(11,'CIDR bitmask correctly handles prefix and edge addresses',()=>{
 a.deepEqual(['192.0.2.0','192.0.2.255','192.0.3.0'].map(x=>cidr(x,'192.0.2.0',24)),[true,true,false]);
 a.equal(cidr('192.0.2.255','192.0.2.0',25),false);
});
t(12,'five-node graph cut and alternate path',()=>{
 const e=[['client','gateway'],['gateway','database'],['gateway','metrics'],['metrics','archive']];
 a.equal(reachable([],e,'client').length,5);
 let cut=e.filter(([u,v])=>!(u==='gateway'&&v==='database'));
 a.equal(reachable([],cut,'client').length,4);
 a.equal(reachable([],cut.concat([['metrics','database']]),'client').length,5);
});
t(13,'RFC5869 A.1 full SHA-256 HKDF extraction and expansion vector',()=>{
 const ikm=Buffer.alloc(22,0x0b),salt=Buffer.from('000102030405060708090a0b0c','hex'),info=Buffer.from('f0f1f2f3f4f5f6f7f8f9','hex');
 const hmac=(key,data)=>crypto.createHmac('sha256',key).update(data).digest();
 const prk=hmac(salt,ikm);
 a.equal(prk.toString('hex'),'077709362c2e32df0ddc3f0dc47bba6390b6c73bb50f9c3122ec844ad7c2b3e5');
 let prev=Buffer.alloc(0),out=Buffer.alloc(0);
 for(let i=1;out.length<42;i++){prev=hmac(prk,Buffer.concat([prev,info,Buffer.from([i])]));out=Buffer.concat([out,prev]);}
 a.equal(out.subarray(0,42).toString('hex'),'3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865');
 const newInfo=Buffer.from('f0f1f2f3f4f5f6f7f8f8','hex');
 a.notDeepEqual(hmac(prk,Buffer.concat([newInfo,Buffer.from([1])])),hmac(prk,Buffer.concat([info,Buffer.from([1])])));
});
t(14,'ALPN intersection must be mutual',()=>{
 const client=['h2','http/1.1'],server=['http/1.1'];
 a.deepEqual(client.filter(x=>server.includes(x)),['http/1.1']);
 a.deepEqual(client.filter(x=>['smtp'].includes(x)),[]);
});
t(15,'egress exact destination allowlist',()=>{
 const allowed=new Set(['203.0.113.10:443','198.51.100.20:443']);
 const candidates=['203.0.113.10:443','198.51.100.20:443','203.0.113.11:443'];
 a.deepEqual(candidates.map(x=>allowed.has(x)),[true,true,false]);
 allowed.delete('198.51.100.20:443');a.equal(candidates.filter(x=>allowed.has(x)).length,1);
});
t(16,'VLAN labels do not prevent directed interzone reachability',()=>{
 const base=[['employees','lab'],['lab','management']];
 a.deepEqual(reachable([],base,'employees'),['employees','lab','management']);
 const cut=base.slice(0,1);
 a.deepEqual(reachable([],cut,'employees'),['employees','lab']);
 a.equal(reachable([],[...cut,['employees','management']],'employees').includes('management'),true);
});
t(17,'TLS peer identity plus application action authorization',()=>{
 const tlsIdentityOK=true,permissions={viewer:new Set(['read-record'])};
 const auth=action=>tlsIdentityOK&&permissions.viewer.has(action);
 a.equal(auth('delete-record'),false);a.equal(auth('read-record'),true);
});
t(18,'certificate expiration is independent from SAN match',()=>{
 const cert={from:'2026-01-01',until:'2026-06-30',san:'app.example'};
 const validAt=day=>day>=cert.from&&day<=cert.until&&matchDNS(cert.san,'app.example');
 a.equal(validAt('2026-11-11'),false);a.equal(validAt('2026-05-01'),true);
});
t(19,'UDP reverse tuple requires unexpired matching state',()=>{
 const f={src:'192.0.2.8',dst:'203.0.113.53',sport:53000,dport:53,proto:'UDP'};
 const permit=(p,live)=>live&&equalTuple(p,reverse(f));
 a.equal(permit(reverse(f),true),true);a.equal(permit(reverse(f),false),false);
 a.equal(permit({...reverse(f),sport:54},true),false);
});
t(20,'directed segmentation permit does not imply reverse permit',()=>{
 const e=[['devices','telemetry'],['telemetry','archive']];
 a.equal(reachable([],e,'devices').includes('archive'),true);
 a.deepEqual(reachable([],e,'archive'),['archive']);
 a.equal(reachable([],[...e,['archive','devices']],'archive').includes('devices'),true);
});
t(21,'new TLS 1.3 key epoch may reset counter while nonce includes IV',()=>{
 const one=(iv,seq)=>iv^seq;
 a.equal(one(0,0),0);a.equal(one(1,0),1);
 a.equal(one(1,1),0);a.notEqual(one(0,0)+'|old-key',one(1,1)+'|new-key');
});
t(22,'wildcard service identity only matches one leftmost label',()=>{
 a.equal(matchDNS('*.example','a.example'),true);
 a.equal(matchDNS('*.example','b.a.example'),false);
 a.equal(matchDNS('*.a.example','b.a.example'),true);
 a.equal(matchDNS('*.a.example','a.example'),false);
});
t(23,'IPv4-only deny does not implicitly cover IPv6',()=>{
 const blocked=(ip)=>ip.includes(':')?false:cidr(ip,'192.0.2.0',24);
 a.equal(blocked('192.0.2.3'),true);a.equal(blocked('2001:db8::3'),false);
 const v6deny=ip=>ip.toLowerCase().startsWith('2001:db8:');
 a.equal(blocked('2001:db8::3')||v6deny('2001:db8::3'),true);
});
