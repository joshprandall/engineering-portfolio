/* Additive Security Research analyzers. Local JSON only; no network, scanning, exploitation, credentials, or host access. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const parse=(id,label)=>{let v;try{v=JSON.parse($(id).value)}catch(e){throw new Error(label+' is not valid JSON: '+e.message)}if(!v||typeof v!=='object')throw new Error(label+' must be a JSON object or array.');return v;};
  const escape=s=>String(s);
  function render(id,title,findings,summary){
    const root=$(id);root.replaceChildren();const h=document.createElement('h3');h.textContent=title;root.append(h);
    if(summary){const m=document.createElement('div');m.className='security-metrics';Object.entries(summary).forEach(([k,v])=>{const d=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=String(v);span.textContent=k;d.append(strong,span);m.append(d)});root.append(m);}
    if(!findings.length){const p=document.createElement('p');p.textContent='No modeled issue was identified in this supplied snapshot. That is not proof of security; validate scope, evidence and assumptions.';root.append(p);return;}
    findings.forEach(f=>{const d=document.createElement('div');d.className='security-finding';const strong=document.createElement('strong'),sev=document.createElement('span'),p=document.createElement('p'),r=document.createElement('p');sev.className='security-severity '+f.severity;sev.textContent=f.severity;strong.append(sev,document.createTextNode(f.title));p.textContent=f.evidence;r.textContent='Remediation: '+f.remediation;d.append(strong,p,r);root.append(d);});
  }
  const agentSample={
    goal:'Summarize tickets and draft remediation changes',
    tools:[
      {name:'ticket.read',mode:'read',scope:'assigned-project',approval:false},
      {name:'repo.write',mode:'write',scope:'all-repositories',approval:false},
      {name:'shell.exec',mode:'execute',scope:'host',approval:false}
    ],
    memory:{durable:true,userEditable:false,ttlDays:null},
    untrustedContent:['ticket.body','web'],
    secretsInPrompt:true
  };
  $('agentsec-sample')?.addEventListener('click',()=>{$('agentsec-input').value=JSON.stringify(agentSample,null,2);});
  $('agentsec-run')?.addEventListener('click',()=>{
    try{
      const d=parse('agentsec-input','Agent capability model'),tools=Array.isArray(d.tools)?d.tools:[],f=[];
      tools.forEach(t=>{
        const write=['write','execute','delete','send'].includes(String(t.mode).toLowerCase());
        if(write&&!t.approval)f.push({severity:'high',title:'Consequential tool lacks approval boundary',evidence:(t.name||'unnamed')+' is modeled as '+t.mode+' with approval=false.',remediation:'Require explicit policy/human approval unless the action is demonstrably low-risk, bounded and reversible.'});
        if(/all|host|admin|global/i.test(String(t.scope||'')))f.push({severity:'medium',title:'Broad tool scope',evidence:(t.name||'unnamed')+' uses scope “'+(t.scope||'unspecified')+'”.',remediation:'Use least-privilege identities and narrow resource allowlists per tool and task.'});
      });
      if(d.secretsInPrompt)f.push({severity:'high',title:'Secret material modeled inside prompt/context',evidence:'secretsInPrompt=true.',remediation:'Keep secrets in the tool/runtime boundary and expose only the minimum opaque capability needed.'});
      if(d.memory?.durable&&d.memory.userEditable===false)f.push({severity:'medium',title:'Durable memory lacks correction path',evidence:'Memory is durable but userEditable=false.',remediation:'Provide provenance, inspection, correction, retention and deletion controls for durable memory.'});
      if(Array.isArray(d.untrustedContent)&&d.untrustedContent.length&&!d.contentIsolation)f.push({severity:'medium',title:'Untrusted content enters the agent without an explicit isolation policy',evidence:'Modeled untrusted sources: '+d.untrustedContent.join(', ')+'.',remediation:'Treat retrieved/web/user content as data, not instructions; delimit it and enforce tool policy outside the model.'});
      render('agentsec-output','Agent boundary review',f,{tools:tools.length,findings:f.length,high:f.filter(x=>x.severity==='high').length});
    }catch(e){render('agentsec-output','Input error',[{severity:'high',title:'Cannot analyze model',evidence:e.message,remediation:'Correct the JSON schema and retry.'}],{});}
  });

  const pqcSample={systems:[
    {name:'public-web',protocol:'TLS',algorithm:'ECDHE/ECDSA',dataLifetimeYears:1,owner:'Web'},
    {name:'archive-signing',protocol:'code-signing',algorithm:'RSA-3072',dataLifetimeYears:15,owner:'Release'},
    {name:'new-kem-pilot',protocol:'TLS-lab',algorithm:'ML-KEM-768',dataLifetimeYears:5,owner:'Security'},
    {name:'backup-encryption',protocol:'at-rest',algorithm:'AES-256-GCM',dataLifetimeYears:10,owner:'Infrastructure'}
  ]};
  $('pqc-sample')?.addEventListener('click',()=>{$('pqc-input').value=JSON.stringify(pqcSample,null,2);});
  $('pqc-run')?.addEventListener('click',()=>{
    try{
      const d=parse('pqc-input','Cryptographic inventory'),rows=Array.isArray(d)?d:(Array.isArray(d.systems)?d.systems:[]),f=[];
      const quantumVulnerable=/\bRSA\b|ECDH|ECDSA|ECIES|DH\b|DSA\b/i,postQuantum=/ML-KEM|ML-DSA|SLH-DSA|HQC|FN-DSA/i;
      rows.forEach(x=>{
        const alg=String(x.algorithm||'');
        if(quantumVulnerable.test(alg))f.push({severity:(Number(x.dataLifetimeYears)||0)>=10?'high':'medium',title:'Quantum-vulnerable public-key algorithm',evidence:(x.name||'system')+' uses '+alg+'; protected-data lifetime '+(x.dataLifetimeYears??'unknown')+' years.',remediation:'Confirm protocol/vendor PQC support, prioritize long-lived confidentiality/signing dependencies, and plan an interoperable migration.'});
        else if(postQuantum.test(alg))f.push({severity:'info',title:'PQC algorithm present',evidence:(x.name||'system')+' reports '+alg+'.',remediation:'Validate implementation, protocol profile, interoperability, key/certificate lifecycle and applicable NIST guidance.'});
      });
      if(rows.some(x=>!x.owner))f.push({severity:'low',title:'Inventory ownership gap',evidence:'At least one cryptographic asset has no owner.',remediation:'Assign ownership so migration decisions, testing and lifecycle changes are accountable.'});
      render('pqc-output','PQC readiness inventory review',f,{systems:rows.length,quantumVulnerable:rows.filter(x=>quantumVulnerable.test(String(x.algorithm||''))).length,pqcPresent:rows.filter(x=>postQuantum.test(String(x.algorithm||''))).length});
    }catch(e){render('pqc-output','Input error',[{severity:'high',title:'Cannot analyze inventory',evidence:e.message,remediation:'Correct the JSON and retry.'}],{});}
  });

  const supplySample={components:[
    {name:'frontend-build',sourcePinned:true,provenance:'signed-hosted',sbom:true,secretsInBuild:false},
    {name:'legacy-script',sourcePinned:false,provenance:'none',sbom:false,secretsInBuild:true},
    {name:'container-image',sourcePinned:true,provenance:'unsigned',sbom:true,secretsInBuild:false}
  ]};
  $('supply-sample')?.addEventListener('click',()=>{$('supply-input').value=JSON.stringify(supplySample,null,2);});
  $('supply-run')?.addEventListener('click',()=>{
    try{
      const d=parse('supply-input','Supply-chain model'),rows=Array.isArray(d)?d:(Array.isArray(d.components)?d.components:[]),f=[];
      rows.forEach(x=>{
        if(!x.sourcePinned)f.push({severity:'medium',title:'Unpinned source/dependency input',evidence:(x.name||'component')+' can change without an explicit immutable reference.',remediation:'Pin immutable versions/digests and review update provenance.'});
        if(!x.provenance||x.provenance==='none')f.push({severity:'high',title:'No build provenance',evidence:(x.name||'component')+' reports no provenance.',remediation:'Generate verifiable provenance that records source and build process; protect it against tampering.'});
        else if(x.provenance==='unsigned')f.push({severity:'medium',title:'Provenance is not authenticated',evidence:(x.name||'component')+' reports unsigned provenance.',remediation:'Use an authenticated/hosted build provenance mechanism appropriate to the trust target.'});
        if(!x.sbom)f.push({severity:'low',title:'No component inventory/SBOM',evidence:(x.name||'component')+' has sbom=false.',remediation:'Produce and retain a software component inventory for vulnerability and dependency response.'});
        if(x.secretsInBuild)f.push({severity:'high',title:'Secret exposure in build context',evidence:(x.name||'component')+' models secretsInBuild=true.',remediation:'Use short-lived scoped credentials and isolate secret-bearing steps from untrusted build inputs/logs.'});
      });
      render('supply-output','Software supply-chain review',f,{components:rows.length,findings:f.length,high:f.filter(x=>x.severity==='high').length});
    }catch(e){render('supply-output','Input error',[{severity:'high',title:'Cannot analyze supply-chain model',evidence:e.message,remediation:'Correct the JSON and retry.'}],{});}
  });
})();
