const fs=require('node:fs');
const path=require('node:path');

const productRoot=__dirname;
const repositoryRoot=path.resolve(productRoot,'../..');
const source=path.join(repositoryRoot,'games','3d-battle-chess');
const destination=path.join(productRoot,'app');
const required=['index.html','boot.js','battle.js','engine.js','game-storage.js','vendor/three/three.module.js','vendor/three/addons/controls/OrbitControls.js'];

for(const relative of required)if(!fs.existsSync(path.join(source,relative)))throw Error(`Missing Crown & Ash runtime file: ${relative}`);
fs.rmSync(destination,{recursive:true,force:true});
fs.cpSync(source,destination,{recursive:true,filter:file=>!/(^|[\\/])(?:desktop|node_modules|dist)(?:[\\/]|$)/.test(file)});
console.log(`Synchronized Crown & Ash web runtime to ${destination}`);
