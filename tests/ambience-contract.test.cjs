const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||path.join(__dirname,'..'));
const contractFile=process.env.PORTFOLIO_AMBIENCE_CONTRACT||path.join(__dirname,'../manifests/ambience.json');
const contract=JSON.parse(fs.readFileSync(contractFile));
test('shared runtime owners remain the reviewed release; content edits cannot silently change them',()=>{
 for(const [name,expected]of Object.entries(contract.owners))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex'),expected,name+': an intentional runtime change needs regression evidence and an explicit contract update');
});
test('every shared page loads one matching, ordered ambience release',()=>{
 const pages=new Set(contract.pages);
 for(const name of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){const text=fs.readFileSync(path.join(root,name),'utf8');if(/site-theme\.js|site-global-header/.test(text))pages.add(name);}
 for(const page of pages){
  const html=fs.readFileSync(path.join(root,page),'utf8'),positions=[];
  for(const name of ['site-theme.js','site-scenes.js','site-audio.js','site-sound-control.js','site-scenes.css']){
   const matches=[...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi)].filter(m=>new URL(m[1],'https://site.test/').pathname==='/'+name);
   assert.equal(matches.length,1,page+' must include exactly one '+name);
   assert.equal(new URL(matches[0][1],'https://site.test').searchParams.get('v'),contract.version,page+' mixed runtime version: '+name);
   if(['site-scenes.js','site-audio.js','site-sound-control.js'].includes(name)){assert(/\bdefer\b/.test(matches[0][0]),page+' must defer '+name);positions.push(matches[0].index);}
  }
  assert(positions[0]<positions[1]&&positions[1]<positions[2],page+' must load scenes, audio, then controls');
 }
});
test('complete background media is declared and is present in a restored release',()=>{
 const largePath=path.join(__dirname,'../manifests/large-assets.json');
 const stagedPath=path.join(__dirname,'../staging-manifest.json');
 const rows=fs.existsSync(largePath)?JSON.parse(fs.readFileSync(largePath)).assets.map(a=>a.canonicalPath):JSON.parse(fs.readFileSync(stagedPath)).files.map(a=>a.path);
 for(const name of contract.requiredMedia){assert(fs.existsSync(path.join(root,name))||rows.includes(name),'Missing background media: '+name);if(process.env.PORTFOLIO_REQUIRE_MEDIA==='1')assert(fs.existsSync(path.join(root,name)),'Release missing restored media: '+name);}
});
