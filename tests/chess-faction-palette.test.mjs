import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const source=readFileSync(resolve(here,'../games/3d-battle-chess/pieces.js'),'utf8');
const row=/^\s*(classic|arcane|monsters|brick|cosmic):\{light:(0x[0-9a-f]+),dark:(0x[0-9a-f]+),w:(0x[0-9a-f]+),b:(0x[0-9a-f]+),trim:(0x[0-9a-f]+),glow:(0x[0-9a-f]+),back:(0x[0-9a-f]+)\},?$/gmi;
const palettes={};
for(const match of source.matchAll(row)){
  const [,name,...values]=match;
  const [light,dark,w,b,trim,glow,back]=values.map(Number);
  palettes[name]={light,dark,w,b,trim,glow,back};
}
assert.deepEqual(Object.keys(palettes).sort(),['arcane','brick','classic','cosmic','monsters'],'all five faction palettes must remain explicit');

assert.deepEqual(palettes.classic,{
  light:0x9ca9a2,dark:0x617782,w:0xe4d2b5,b:0x314858,trim:0xb18b56,glow:0xcda569,back:0x182d3f
},'Website Basic Edition Classic palette must remain byte-for-byte stable');

const rgb=value=>[(value>>16)&255,(value>>8)&255,value&255];
const distance=(a,b)=>{
  const A=rgb(a),B=rgb(b);
  return Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]);
};
const premium=['arcane','monsters','brick','cosmic'];
for(let i=0;i<premium.length;i++)for(let j=i+1;j<premium.length;j++){
  const a=palettes[premium[i]],b=palettes[premium[j]];
  assert(distance(a.glow,b.glow)>=30, premium[i]+' and '+premium[j]+' must retain clearly distinct glow colors');
  assert(distance(a.trim,b.trim)>=30, premium[i]+' and '+premium[j]+' must retain clearly distinct trim colors');
}
for(const name of premium){
  const p=palettes[name];
  assert(distance(p.light,p.dark)>=65,name+' board light/dark squares need strong visual separation');
  assert(distance(p.w,p.b)>=90,name+' opposing piece colors need strong visual separation');
  assert(distance(p.glow,p.back)>=100,name+' faction glow must read clearly against its environment background');
}

assert(palettes.arcane.b>0&&palettes.monsters.b>0&&palettes.brick.b>0&&palettes.cosmic.b>0);
console.log('PASS Crown & Ash premium faction palettes: Classic Basic Edition frozen; four premium factions remain strongly separated and readable.');
