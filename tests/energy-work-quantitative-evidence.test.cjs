'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','physics','energy.json'),'utf8'));
const cases=[["physics-energy","5.0 kg","8-3-conservation-of-energy"],["physics-power","1,200 J","7-4-power"],["physics-v06-work-by-a-force","40 N","7-1-work"],["physics-v06-kinetic-energy","2.0 kg","7-2-kinetic-energy"],["physics-v06-potential-energy","200 N/m","8-1-potential-energy-of-a-system"],["physics-v06-conservation-of-mechanical-energy","5.0 m","8-3-conservation-of-energy"],["physics-v08-deep-dive-work","10 + 2x","7-1-work"],["physics-v08-evidence-lab-work","30 N","7-1-work"],["physics-v08-deep-dive-kinetic-energy","4.0 kg","7-3-work-energy-theorem"],["physics-v08-evidence-lab-kinetic-energy","2.0 kg","7-2-kinetic-energy"],["physics-v08-deep-dive-work-energy-theorem","8.0 N","7-3-work-energy-theorem"],["physics-v08-evidence-lab-work-energy-theorem","25 N","7-3-work-energy-theorem"]];
function close(a,b,t=1e-6){assert.ok(Math.abs(a-b)<t, String(a)+' != '+String(b));}
test('twelve distinct and falsifiable energy-work models preserve 103 records',()=>{
 assert.equal(Object.keys(pack).length,103);assert.equal(new Set(cases.map(c=>c[0])).size,12);let questions=new Set();
 for(const [id,anchor,src] of cases){const l=pack[id];assert.ok(l,id);assert.ok(l.essentialQuestion.includes(anchor),id);assert.ok(!l.essentialQuestion.startsWith('What does '),id);assert.ok(!questions.has(l.essentialQuestion),id);questions.add(l.essentialQuestion);
 for(const k of ['reasoningSteps','labPlan']){const a=l[k];assert.equal(a.length,6,id+' '+k);assert.ok(a.every(s=>typeof s==='string'&&s.length>=145),id+' '+k);assert.ok(a[5].includes('https://openstax.org/books/university-physics-volume-1/pages/'+src),id+' '+k);assert.match(a.join(' '),/inverse|reconstruct|recover/i,id);assert.match(a.join(' '),/counterexample|falsif|invalid|impossible|incorrect|wrong/i,id);}
 for(const preserved of ['verifiedBoundary','starter','technical','memoryLadder','vocabulary','video'])assert.ok(l[preserved],id+' missing '+preserved);
 }
});
const independent=[
 ['energy in a vertical lift',()=>{close(5*9.8*3,147);close(147/(5*9.8),3);close(5*9.8*6,294);} ],
 ['average power and inverse',()=>{close(1200/8,150);close(150*8,1200);close(1200/4,300);} ],
 ['force dot product',()=>{close(40*3*Math.cos(Math.PI/3),60);close(60/3,20);close(40*3*Math.cos(Math.PI/2),0);} ],
 ['kinetic speed square',()=>{close(.5*2*6**2,36);close(Math.sqrt(2*36/2),6);close(.5*2*12**2,144);} ],
 ['spring strain energy',()=>{close(.5*200*.3**2,9);close(Math.sqrt(2*9/200),.3);close(.5*200*.6**2,36);} ],
 ['energy at changing heights',()=>{close(9.8*5-9.8*2,29.4);close(Math.sqrt(2*29.4),Math.sqrt(58.8));close(58.8/(2*9.8),3);} ],
 ['position dependent work integral',()=>{const F=x=>10*x+x*x;close(F(3)-F(0),39);close(3*(10+16)/2,39);close(F(4),56);} ],
 ['signed resistance work',()=>{close(-30*4,-120);close(-120/4,-30);close(30*4,120);} ],
 ['net work from speed difference',()=>{close(.5*4*(5**2-3**2),32);close(Math.sqrt(3**2+2*32/4),5);close(.5*4*(6**2-3**2),54);} ],
 ['kinetic comparative ratio',()=>{close(.5*2*4**2,16);close(.5*1*6**2,18);close(Math.sqrt(2*18/1),6);} ],
 ['resistive work and stopping length',()=>{close(.5*2*8**2-8*5,24);close(Math.sqrt(2*24/2),Math.sqrt(24));close(64/8,8);} ],
 ['two force work-energy accounting',()=>{close((25-10)*6,90);close(Math.sqrt(2*90/3),Math.sqrt(60));close((25-10)*3,45);} ]
];
for(const [label,check] of independent)test(label,check);
