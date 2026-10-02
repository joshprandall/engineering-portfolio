const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const source=path.join(root,'node_modules','three');
const destination=path.join(root,'games','3d-battle-chess','vendor','three');
const manifest=JSON.parse(fs.readFileSync(path.join(source,'package.json'),'utf8'));
if(manifest.version!=='0.180.0')throw Error(`Expected three 0.180.0, found ${manifest.version}`);

const files=[
 ['build/three.module.js','three.module.js'],
 ['examples/jsm/controls/OrbitControls.js','addons/controls/OrbitControls.js'],
 ['LICENSE','LICENSE']
];
for(const [from,to] of files){const target=path.join(destination,to);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(source,from),target)}
console.log('Vendored Three.js 0.180.0 for Crown & Ash offline play.');
