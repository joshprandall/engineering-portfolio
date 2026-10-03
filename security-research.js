/* Local-only Security Research lab. No scanner, remote execution, credential collection, or network transport. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const reportState={tool:'',generatedAt:'',findings:[],summary:{}};
  const exportButton=$('security-export');
  function invalidateReport(){reportState.tool='';if(exportButton){exportButton.disabled=true;exportButton.title='Run an analysis on the current inputs before exporting.';}}
  function inputError(id,error){invalidateReport();$(id).textContent=error.message;}
  invalidateReport();
  document.querySelectorAll('main input,main textarea').forEach(e=>e.addEventListener('input',invalidateReport));
  const severityRank={high:0,medium:1,low:2,info:3};
  const setReport=(tool,findings,summary={})=>{
    reportState.tool=tool;reportState.generatedAt=new Date().toISOString();
    reportState.findings=[...findings].sort((a,b)=>(severityRank[a.severity]??9)-(severityRank[b.severity]??9));
    reportState.summary=summary;if(exportButton){exportButton.disabled=false;exportButton.title='Export the latest completed local analysis.';}
  };
  const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
  const renderFindings=(target,title,findings,summary={})=>{
    target.replaceChildren();
    target.append(node('h3',title));
    const metrics=node('div',undefined,'security-metrics');
    for(const [label,value] of Object.entries(summary)){const box=node('div');box.append(node('strong',String(value)),node('span',label));metrics.append(box);}
    if(Object.keys(summary).length)target.append(metrics);
    if(!findings.length){target.append(node('p','No modeled risk condition was identified in this input. Review assumptions and scope before treating that as assurance.'));return;}
    const wrap=node('div');
    findings.forEach(f=>{
      const item=node('div',undefined,'security-finding');
      const sev=node('span',f.severity,'security-severity '+f.severity);
      const titleEl=node('strong',f.title);titleEl.prepend(sev);
      item.append(titleEl,node('p',f.evidence),node('p','Remediation: '+f.remediation));
      wrap.append(item);
    });
    target.append(wrap);
  };
  const safeJson=(text,label)=>{let data;try{data=JSON.parse(text);}catch(error){throw new Error(label+' is not valid JSON: '+error.message);}if(!data||typeof data!=='object'||Array.isArray(data)||!Object.keys(data).length)throw new Error(label+' must be a nonempty JSON object.');return data;};
  function arrayField(data,key,check){if(data[key]!==undefined&&(!Array.isArray(data[key])||!data[key].every(check)))throw new Error(key+' must be an array with valid entries.');}
  const textValue=x=>typeof x==='string'&&x.trim().length>0;
  const recordValue=x=>x&&typeof x==='object'&&!Array.isArray(x);
  function booleanField(data,key){if(data[key]!==undefined&&typeof data[key]!=='boolean')throw new Error(key+' must be true or false, not a string.');}


  // 1. Controlled path-boundary analysis against a virtual filesystem only.
  const virtualFiles=new Map([
    ['/srv/app/public/index.txt','public demo data'],
    ['/srv/app/public/readme.txt','public readme'],
    ['/srv/app/lab-secret.txt','synthetic secret used only inside this in-memory map']
  ]);
  function normalizeVirtual(path){
    const parts=[];
    for(const token of path.split('/')){if(!token||token==='.')continue;if(token==='..')parts.pop();else parts.push(token);}
    return '/'+parts.join('/');
  }
  function vulnerableResolve(input){return normalizeVirtual('/srv/app/public/'+input);}
  function boundedResolve(input){
    const root='/srv/app/public',resolved=normalizeVirtual(root+'/'+input);
    if(resolved!==root&&!resolved.startsWith(root+'/'))throw new Error('Boundary escape rejected');
    return resolved;
  }
  $('vuln-run')?.addEventListener('click',()=>{
    const input=$('vuln-input').value.trim()||'index.txt';
    const vulnerable=vulnerableResolve(input);
    let secure,blocked=false;try{secure=boundedResolve(input);}catch{blocked=true;secure='blocked';}
    const escaped=!vulnerable.startsWith('/srv/app/public/');
    const findings=escaped?[{severity:'high',title:'Virtual root boundary escape reproduced',evidence:'The intentionally vulnerable resolver maps the supplied input to '+vulnerable+'. '+(virtualFiles.has(vulnerable)?'That path exists in the synthetic filesystem.':'The path crosses the modeled trust boundary.'),remediation:'Normalize the path, resolve it against an allowlisted root, then reject any resolved path outside that root before access.'}]:[];
    setReport('virtual-path-boundary',findings,{requested:input,vulnerableResult:vulnerable,secureResult:secure});
    const target=$('vuln-output');target.replaceChildren();target.append(node('h3',escaped?'Boundary failure reproduced safely':'No boundary escape reproduced'));
    const metrics=node('div',undefined,'security-metrics');
    for(const [label,value] of [['Requested',input],['Vulnerable resolver',vulnerable],['Bounded resolver',blocked?'Rejected':secure]]){const box=node('div');box.append(node('strong',value),node('span',label));metrics.append(box);}
    target.append(metrics);
    if(findings.length){const detail=node('div');renderFindings(detail,'Controlled finding',findings,{virtualOnly:'yes'});target.append(detail);}
  });

  // 2. Deterministic mutation fuzzer against a local parser.
  const fuzzSeeds=['name=alpha;role=user','path=%2Flab;mode=read','note=hello%20world'];
  const targetParser=input=>{
    const out={};
    for(const field of input.split(';')){
      const at=field.indexOf('=');if(at<1)continue;
      const key=decodeURIComponent(field.slice(0,at));
      const value=decodeURIComponent(field.slice(at+1));
      out[key]=value;
    }
    return out;
  };
  function prng(seed){let state=(seed|0)||1;return()=>{state=(state*48271)%2147483647;return state/2147483647;};}
  function mutate(input,rnd){
    const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=%;_-.';
    let value=input;const op=Math.floor(rnd()*4);
    if(op===0&&value.length)value=value.slice(0,Math.floor(rnd()*value.length))+value.slice(Math.floor(rnd()*value.length)+1);
    else if(op===1)value=value.slice(0,Math.floor(rnd()*(value.length+1)))+'%'+value.slice(Math.floor(rnd()*(value.length+1)));
    else if(op===2){const i=Math.floor(rnd()*(value.length+1));value=value.slice(0,i)+alphabet[Math.floor(rnd()*alphabet.length)]+value.slice(i);}
    else if(value.length){const i=Math.floor(rnd()*value.length);value=value.slice(0,i)+alphabet[Math.floor(rnd()*alphabet.length)]+value.slice(i+1);}
    return value.slice(0,160);
  }
  const crashes=value=>{try{targetParser(value);return false;}catch{return true;}};
  function minimize(value){
    let current=value,changed=true;
    while(changed&&current.length>1){changed=false;for(let i=0;i<current.length;i++){const candidate=current.slice(0,i)+current.slice(i+1);if(candidate&&crashes(candidate)){current=candidate;changed=true;break;}}}
    return current;
  }
  $('fuzz-run')?.addEventListener('click',()=>{
    const iterations=Number($('fuzz-iterations').value),seed=Number($('fuzz-seed').value);
    if(!Number.isInteger(iterations)||iterations<25||iterations>2000||!Number.isInteger(seed)||seed<1||seed>2147483646){inputError('fuzz-output',new Error('Use whole iterations from 25–2000 and a whole seed from 1–2147483646.'));return;}

    const rnd=prng(seed);let first='',crashCount=0;
    for(let i=0;i<iterations;i++){let candidate=fuzzSeeds[Math.floor(rnd()*fuzzSeeds.length)];const rounds=1+Math.floor(rnd()*4);for(let n=0;n<rounds;n++)candidate=mutate(candidate,rnd);if(crashes(candidate)){crashCount++;if(!first)first=candidate;}}
    const minimized=first?minimize(first):'';
    const findings=first?[{severity:'medium',title:'Unhandled parser exception discovered',evidence:'A deterministic mutation caused the local parser to throw. Minimized failing input: '+JSON.stringify(minimized),remediation:'Treat decoding as untrusted input: validate percent-encoding and catch decode failures so malformed records are rejected without terminating the parser.'}]:[];
    const summary={iterations,seed,exceptions:crashCount,minimizedLength:minimized.length};
    setReport('parser-fuzzer',findings,summary);
    renderFindings($('fuzz-output'),'Fuzzing result',findings,summary);
    if(first)$('fuzz-output').append(node('p','Replay input: '+JSON.stringify(minimized)));
  });

  // 3. Linux configuration audit from supplied synthetic JSON.
  const linuxSample={
    pathEntries:[{path:'/usr/local/lab-bin',mode:'0777',owner:'root'},{path:'/usr/bin',mode:'0755',owner:'root'}],
    files:[
      {path:'/usr/local/bin/lab-helper',mode:'4775',owner:'root',suid:true},
      {path:'/etc/lab-app.conf',mode:'0644',owner:'root',containsSecret:true},
      {path:'/opt/lab/run.sh',mode:'0777',owner:'root'}
    ],
    sudoRules:['%labops ALL=(root) NOPASSWD: /usr/local/bin/*'],
    capabilities:[{path:'/usr/local/bin/lab-net',capabilities:['CAP_NET_ADMIN','CAP_SYS_ADMIN']}]
  };
  const loadJson=(id,obj)=>{invalidateReport();$(id).value=JSON.stringify(obj,null,2);};
  $('linux-sample')?.addEventListener('click',()=>loadJson('linux-input',linuxSample));
  $('linux-run')?.addEventListener('click',()=>{
    try{
      const data=safeJson($('linux-input').value,'Linux snapshot'),findings=[];
      if(!['pathEntries','files','sudoRules','capabilities'].some(k=>k in data))throw new Error('Supply pathEntries, files, sudoRules or capabilities.');
      const entry=e=>recordValue(e)&&textValue(e.path)&&typeof e.mode==='string'&&/^0?[0-7]{3,4}$/.test(e.mode);
      arrayField(data,'pathEntries',entry);arrayField(data,'files',entry);arrayField(data,'sudoRules',textValue);arrayField(data,'capabilities',e=>recordValue(e)&&textValue(e.path)&&Array.isArray(e.capabilities)&&e.capabilities.every(textValue));
      for(const f of data.files||[]){booleanField(f,'suid');booleanField(f,'containsSecret');}

      const worldWritable=mode=>typeof mode==='string'&&/[2367]$/.test(mode);
      for(const e of data.pathEntries||[])if(worldWritable(e.mode))findings.push({severity:'high',title:'Writable PATH component',evidence:e.path+' is modeled with mode '+e.mode+'.',remediation:'Remove world/group write access from privileged PATH directories and restrict ownership to a trusted administrative principal.'});
      for(const f of data.files||[]){
        if(f.suid&&f.owner==='root')findings.push({severity:'medium',title:'Root SUID binary requires justification',evidence:f.path+' is modeled as SUID root ('+f.mode+').',remediation:'Remove SUID where unnecessary; otherwise minimize code surface, ownership, write permissions, and regression-test the privilege boundary.'});
        if(worldWritable(f.mode))findings.push({severity:'high',title:'World-writable privileged path',evidence:f.path+' has modeled mode '+f.mode+'.',remediation:'Restrict write permission and verify parent-directory ownership and deployment controls.'});
        if(f.containsSecret&&/[4567]$/.test(f.mode))findings.push({severity:'medium',title:'Configuration secret is broadly readable',evidence:f.path+' is marked as containing a secret with mode '+f.mode+'.',remediation:'Move secrets to a dedicated secret store or restrict the file to the service identity and rotate exposed values.'});
      }
      for(const rule of data.sudoRules||[])if(/NOPASSWD/i.test(rule)&&rule.includes('*'))findings.push({severity:'high',title:'Wildcard passwordless sudo rule',evidence:rule,remediation:'Replace wildcard command scope with exact commands and arguments, require authentication where appropriate, and log administrative elevation.'});
      for(const cap of data.capabilities||[])if((cap.capabilities||[]).some(x=>['CAP_SYS_ADMIN','CAP_SYS_PTRACE'].includes(x)))findings.push({severity:'high',title:'High-impact Linux capability',evidence:cap.path+' has '+cap.capabilities.join(', ')+'.',remediation:'Drop capabilities not strictly required; prefer the smallest capability set and isolate the process with additional sandboxing.'});
      const summary={findings:findings.length,high:findings.filter(f=>f.severity==='high').length,reviewed:(data.files||[]).length+(data.pathEntries||[]).length};
      setReport('linux-misconfiguration-audit',findings,summary);renderFindings($('linux-output'),'Linux audit',findings,summary);
    }catch(error){inputError('linux-output',error);}
  });

  // 4. Synthetic AD relationship graph; no directory or authentication calls.
  const adSample={
    start:'helpdesk-user',targets:['Domain Admins'],
    edges:[
      {from:'helpdesk-user',to:'Helpdesk',right:'memberOf',control:'Review group membership and joiner/mover/leaver process.'},
      {from:'Helpdesk',to:'Tier1-Reset',right:'canResetPassword',control:'Scope reset rights to non-privileged accounts and protect privileged identities.'},
      {from:'Tier1-Reset',to:'Server Operators',right:'GenericAll',control:'Remove broad ACLs; delegate only specific required directory permissions.'},
      {from:'Server Operators',to:'Domain Admins',right:'memberOf',control:'Separate operational server administration from domain-wide privilege.'}
    ]
  };
  $('ad-sample')?.addEventListener('click',()=>loadJson('ad-input',adSample));
  function shortestPath(model){
    const edges=model.edges||[],targets=new Set(model.targets||[]),queue=[[model.start,[]]],seen=new Set([model.start]);
    while(queue.length){const [nodeName,path]=queue.shift();if(targets.has(nodeName))return path;for(const edge of edges.filter(e=>e.from===nodeName)){if(seen.has(edge.to))continue;seen.add(edge.to);queue.push([edge.to,[...path,edge]]);}}
    return [];
  }
  $('ad-run')?.addEventListener('click',()=>{
    try{
      const model=safeJson($('ad-input').value,'AD graph');
      if(!textValue(model.start)||!Array.isArray(model.targets)||!model.targets.length||!model.targets.every(textValue)||!Array.isArray(model.edges))throw new Error('Supply a start principal, target names and an edges array.');
      arrayField(model,'edges',e=>recordValue(e)&&textValue(e.from)&&textValue(e.to)&&textValue(e.right));
      const path=shortestPath(model),findings=[],alreadyTarget=model.targets.includes(model.start);
      if(alreadyTarget)findings.push({severity:'high',title:'Initial principal is already a protected target',evidence:model.start+' is in the supplied targets; zero edges are required.',remediation:'Review whether the starting identity should hold that privileged role.'});

      if(path.length)findings.push({severity:'high',title:'Synthetic privilege path reaches a protected target',evidence:path.map(e=>e.from+' -['+e.right+']-> '+e.to).join(' | '),remediation:'Break the path at its weakest justified edge; validate delegated ACLs, privileged-group membership, tiering, and change monitoring.'});
      const summary={edges:(model.edges||[]).length,pathLength:path.length,target:alreadyTarget?model.start:path.length?path[path.length-1].to:'not reached'};
      setReport('ad-privilege-path',findings,summary);
      const target=$('ad-output');renderFindings(target,'Directory graph analysis',findings,summary);
      if(path.length){const visual=node('div',undefined,'security-path');visual.append(node('span',model.start));path.forEach(edge=>{visual.append(node('i','→ '+edge.right+' →'),node('span',edge.to));});target.append(visual);const list=node('ol');path.forEach(edge=>list.append(node('li',edge.from+' → '+edge.to+': '+(edge.control||'Review this delegated relationship.'))));target.append(node('h3','Defensive controls along the path'),list);}
    }catch(error){inputError('ad-output',error);}
  });

  // 5. Container configuration hardening analyzer.
  const containerSample={privileged:true,user:'0',networkMode:'host',pidMode:'host',readOnlyRootFilesystem:false,capAdd:['SYS_ADMIN','NET_ADMIN'],securityOpt:['seccomp=unconfined'],mounts:['/var/run/docker.sock:/var/run/docker.sock','/srv/lab-data:/data']};
  $('container-sample')?.addEventListener('click',()=>loadJson('container-input',containerSample));
  $('container-run')?.addEventListener('click',()=>{
    try{
      const c=safeJson($('container-input').value,'Container configuration'),findings=[];
      if(!['privileged','user','networkMode','pidMode','readOnlyRootFilesystem','capAdd','securityOpt','mounts'].some(k=>k in c))throw new Error('Supply recognized container configuration fields.');
      for(const k of ['privileged','readOnlyRootFilesystem'])booleanField(c,k);
      for(const k of ['capAdd','securityOpt','mounts'])arrayField(c,k,textValue);

      if(c.privileged)findings.push({severity:'high',title:'Privileged container',evidence:'privileged=true grants an unusually broad host-facing privilege set.',remediation:'Run unprivileged; grant only the specific devices/capabilities required.'});
      if(String(c.user)==='0'||String(c.user).toLowerCase()==='root')findings.push({severity:'medium',title:'Container runs as root',evidence:'The configured runtime user is '+c.user+'.',remediation:'Use a non-root UID/GID and enforce it in the image and runtime policy.'});
      if(c.networkMode==='host'||c.pidMode==='host')findings.push({severity:'high',title:'Host namespace exposure',evidence:'networkMode='+c.networkMode+', pidMode='+c.pidMode+'.',remediation:'Use isolated namespaces unless host sharing is explicitly required and separately controlled.'});
      for(const mount of c.mounts||[])if(String(mount).includes('/var/run/docker.sock'))findings.push({severity:'high',title:'Container runtime socket exposed',evidence:String(mount),remediation:'Do not mount the Docker/runtime control socket into ordinary workloads; use a narrowly scoped broker if orchestration is required.'});
      const riskyCaps=(c.capAdd||[]).filter(x=>['SYS_ADMIN','SYS_PTRACE','NET_ADMIN'].includes(String(x).replace(/^CAP_/,'')));
      if(riskyCaps.length)findings.push({severity:'high',title:'High-impact capabilities added',evidence:riskyCaps.join(', '),remediation:'Drop all capabilities by default and add only the minimum capability required by a documented workload function.'});
      if((c.securityOpt||[]).some(x=>/seccomp=unconfined/i.test(x)))findings.push({severity:'medium',title:'Seccomp disabled',evidence:'securityOpt contains seccomp=unconfined.',remediation:'Apply the runtime default or a tested application-specific seccomp profile.'});
      if(c.readOnlyRootFilesystem===false)findings.push({severity:'low',title:'Writable root filesystem',evidence:'readOnlyRootFilesystem=false.',remediation:'Prefer a read-only root filesystem and explicitly mount only required writable paths.'});
      const summary={findings:findings.length,high:findings.filter(f=>f.severity==='high').length,score:Math.max(0,100-findings.reduce((n,f)=>n+({high:22,medium:12,low:6}[f.severity]||2),0))};
      setReport('container-hardening',findings,summary);renderFindings($('container-output'),'Container hardening analysis',findings,summary);
    }catch(error){inputError('container-output',error);}
  });

  // 6. Supplied inventory analysis only. No network or discovery APIs.
  const surfaceSample='web-lab,443,https,internet,on,current\nadmin-lab,22,ssh,internal,on,current\nlegacy-lab,23,telnet,internet,off,legacy\nfiles-lab,445,smb,internet,on,current\ndev-lab,8080,admin-http,internet,off,unknown';
  $('surface-sample')?.addEventListener('click',()=>{invalidateReport();$('surface-input').value=surfaceSample;});
  function parseInventory(text){
    if(!text.trim())throw new Error('Enter at least one inventory record.');
    return text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map((line,index)=>{const [host,port,service,exposure,tls,status]=line.split(',').map(x=>x.trim());if(!host||!port||!service)throw new Error('Inventory line '+(index+1)+' needs host, port, and service.');if(!/^\d+$/.test(port)||Number(port)<1||Number(port)>65535)throw new Error('Inventory line '+(index+1)+' needs a whole port from 1–65535.');return{host,port:Number(port),service:service.toLowerCase(),exposure:(exposure||'unknown').toLowerCase(),tls:(tls||'unknown').toLowerCase(),status:(status||'unknown').toLowerCase()};});
  }
  $('surface-run')?.addEventListener('click',()=>{
    try{
      const rows=parseInventory($('surface-input').value),findings=[];
      for(const r of rows){
        if(r.exposure==='internet'&&['telnet','ftp'].includes(r.service))findings.push({severity:'high',title:'Internet-exposed plaintext management/service protocol',evidence:r.host+':'+r.port+' reports '+r.service+'.',remediation:'Remove public exposure and replace the protocol with an authenticated encrypted alternative behind an appropriate access boundary.'});
        if(r.exposure==='internet'&&['smb','rdp','ssh','admin-http'].includes(r.service))findings.push({severity:r.service==='smb'?'high':'medium',title:'Administrative or lateral-movement surface exposed',evidence:r.host+':'+r.port+' reports '+r.service+' as internet-facing.',remediation:'Restrict exposure to a controlled management plane/VPN, require strong authentication, patch aggressively, and monitor access.'});
        if(r.exposure==='internet'&&r.tls==='off')findings.push({severity:'medium',title:'Internet-facing service reports no TLS',evidence:r.host+':'+r.port+' ('+r.service+') has tls=off.',remediation:'Use an encrypted protocol or terminate modern TLS at a controlled reverse proxy/gateway.'});
        if(['legacy','unknown'].includes(r.status))findings.push({severity:'low',title:'Version/lifecycle review required',evidence:r.host+':'+r.port+' status='+r.status+'.',remediation:'Resolve the actual product/version, compare it to the supported lifecycle and patch baseline, then document the result.'});
      }
      const summary={services:rows.length,internetFacing:rows.filter(r=>r.exposure==='internet').length,findings:findings.length,high:findings.filter(f=>f.severity==='high').length};
      setReport('attack-surface-inventory',findings,summary);renderFindings($('surface-output'),'Inventory analysis',findings,summary);
    }catch(error){inputError('surface-output',error);}
  });

  $('security-export')?.addEventListener('click',()=>{
    if(!reportState.tool)return;
    const payload={schema:'jr-security-research-report-v1',authorization:'User-supplied/synthetic/local analysis only',...reportState};
    const blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='security-research-report.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
  });

  // Load safe samples so every tool is demonstrable without external input.
  loadJson('linux-input',linuxSample);
  loadJson('ad-input',adSample);
  loadJson('container-input',containerSample);
  if($('surface-input'))$('surface-input').value=surfaceSample;
})();
