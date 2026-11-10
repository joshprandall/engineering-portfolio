'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifests/protected-baseline-git-blobs.json'),'utf8'));
let verified=0;
for(const [rel,sha] of Object.entries(manifest.files)){
 const target=path.resolve(root,rel);
 assert(target.startsWith(root+path.sep),'Protected path escapes repository: '+rel);
 assert(fs.existsSync(target),'Protected file missing: '+rel);
 const content=fs.readFileSync(target);
 const actual=crypto.createHash('sha1').update('blob '+content.length+'\0').update(content).digest('hex');
 assert.equal(actual,sha,'Protected baseline changed without owner approval: '+rel);
 verified++;
}
assert(verified>=100,'Unexpectedly small protection manifest');
console.log('PASS protected baseline:',verified,'unchanged files (solar, appearance, sound, games, education and employment).');
