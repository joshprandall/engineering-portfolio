const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/audit-evidence');
const read=n=>JSON.parse(fs.readFileSync(path.join(out,n+'.json'),'utf8'));
const save=(n,v)=>fs.writeFileSync(path.join(out,n+'.json'),JSON.stringify(v,null,2)+'\n');
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,maxBuffer:100*1024*1024});
const live=read('live-inventory'),sources=read('runtime-sources');
const tree=ref=>git('ls-tree','-r','--long',ref).toString().trim().split('\n').map(s=>{const m=s.match(/^\d+ blob ([a-f0-9]+)\s+(\d+)\t(.*)$/);return m?{blob:m[1],size:Number(m[2]),path:m[3]}:null;}).filter(Boolean);
const cache=new Map();function hashed(ref){return tree(ref).map(x=>{if(!cache.has(x.blob))cache.set(x.blob,crypto.createHash('sha256').update(git('cat-file','blob',x.blob)).digest('hex'));return {...x,sha256:cache.get(x.blob)};});}
const head=hashed('HEAD'),main=hashed('origin/main');save('git-head-inventory',head);save('git-main-inventory',main);
const map=new Map(head.map(x=>[x.path,x])),lm=new Map(live.map(x=>[x.path,x]));
const comparison=[...new Set([...map.keys(),...lm.keys()])].sort().map(p=>{const r=map.get(p),l=lm.get(p);let status=!r?'live-only':!l?'git-only':r.sha256===l.sha256?'identical':'different';return {path:p,status,git:r||null,live:l||null};});save('git-live-comparison',comparison);
const refs=git('for-each-ref','--format=%(refname)','refs/remotes/origin').toString().trim().split('\n').filter(r=>!r.endsWith('/HEAD'));
const missing=comparison.filter(x=>x.status==='live-only');const membership=missing.map(x=>({path:x.path,sha256:x.live.sha256,branchesWithPath:[]}));for(const ref of refs){const paths=new Set(tree(ref).map(x=>x.path));for(const m of membership)if(paths.has(m.path))m.branchesWithPath.push(ref.replace('refs/remotes/',''));}save('live-only-branch-membership',membership);
save('git-provenance',{capturedAt:new Date().toISOString(),head:git('rev-parse','HEAD').toString().trim(),main:git('rev-parse','main').toString().trim(),originMain:git('rev-parse','origin/main').toString().trim(),branch:git('branch','--show-current').toString().trim(),refs:refs.length,counts:Object.fromEntries(['identical','different','live-only','git-only'].map(s=>[s,comparison.filter(x=>x.status===s).length]))});
console.log(JSON.stringify(read('git-provenance'),null,2));console.log('Git byte differences: '+comparison.filter(x=>x.status==='different').map(x=>x.path).join(', '));console.log('Live-only paths present on other branches: '+membership.filter(x=>x.branchesWithPath.length).map(x=>x.path).join(', '));
const diffs=[];for(const x of comparison.filter(x=>x.status==='different')){const a=sources.repository[x.path],b=sources.live[x.path];if(a!==undefined&&b!==undefined){const aa=a.replace(/\r\n/g,'\n').split('\n'),bb=b.replace(/\r\n/g,'\n').split('\n');const aset=new Set(aa),bset=new Set(bb);diffs.push({path:x.path,repositoryOnlyLines:aa.filter(l=>!bset.has(l)),liveOnlyLines:bb.filter(l=>!aset.has(l))});}}save('content-differences',diffs);
