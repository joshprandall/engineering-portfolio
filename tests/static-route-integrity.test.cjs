'use strict';
/* Static source-route links only: not a substitute for public HTTP or browser acceptance. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const pages=fs.readdirSync(root).filter(p=>p.endsWith('.html'));
assert.equal(pages.length,83,'Protect the current 83-page public route inventory');
const preservedHostOnly=new Set([
 'games/3d-battle-chess/index.html',
 'games/evil-wizard/play.html',
 'games/3d-battle-chess/CREDITS.md',
 'games/3d-battle-chess/',
 'games/evil-wizard/index.png',
 'geometric-lab/CREDITS.md'
]);
const missing=[],external=[],hostOnly=[];
let local=0;
for(const page of pages){
 const src=fs.readFileSync(path.join(root,page),'utf8');
 assert(/<title>[^<]+<\/title>/i.test(src),'HTML title missing: '+page);
 for(const [,attribute,raw] of src.matchAll(/\b(href|src)=["']([^"'<>]+)["']/gi)){
  if(/^(?:https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(raw)){if(/^https?:/i.test(raw))external.push(raw);continue;}
  const rel=decodeURIComponent(raw.split(/[?#]/)[0]);if(!rel)continue;
  const file=path.resolve(root,rel.replace(/^\/+/,''));local++;
  if(!file.startsWith(root+path.sep))throw Error('Unsafe relative link '+page+' -> '+raw);
  if(fs.existsSync(file))continue;
  const normalized=path.relative(root,file).replace(/\\/g,'/');
  if(preservedHostOnly.has(normalized)){hostOnly.push({page,normalized});continue;}
  missing.push({page,attribute,normalized});
 }
}
assert.deepEqual(missing,[],'Broken internal source links: '+JSON.stringify(missing.slice(0,20)));
console.log('PASS static routes:',pages.length,'HTML pages,',local,'local references,',hostOnly.length,'explicitly preserved host-only link references. External links and runtime interactions require separate live QA.');
