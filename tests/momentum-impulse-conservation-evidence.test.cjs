'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','physics','momentum.json'),'utf8'));
const ids=["physics-v06-linear-momentum","physics-v06-impulse-momentum-theorem","physics-v08-deep-dive-linear-momentum","physics-v08-evidence-lab-linear-momentum","physics-v08-deep-dive-impulse-momentum-theorem","physics-v08-evidence-lab-impulse-momentum-theorem","physics-v08-deep-dive-momentum-conservation","physics-v08-evidence-lab-momentum-conservation","physics-v09-worked-example-impulse-momentum-theorem","physics-v09-decision-lab-impulse-momentum-theorem","physics-v09-failure-analysis-lab-impulse-momentum-theorem","physics-v09-teach-back-lab-linear-momentum","physics-v09-evidence-verification-la-linear-momentum","physics-v09-troubleshooting-lab-linear-momentum","physics-v09-practical-lab-momentum-conservation","physics-v09-quick-reference-momentum-conservation","physics-v09-design-review-impulse-momentum-theorem","physics-v09-misconception-clinic-impulse-momentum-theorem","physics-v09-recall-drill-impulse-momentum-theorem","physics-v09-scenario-analysis-linear-momentum","physics-v09-worked-example-linear-momentum","physics-v09-decision-lab-linear-momentum","physics-v09-failure-analysis-lab-momentum-conservation","physics-v09-teach-back-lab-momentum-conservation"];
const source=["p","i","p","p","i","i","c","c","i","i","i","p","p","p","c","c","i","i","i","p","p","p","c","c"];
const anchors=["3.0 kg","1.5 kg","2.0 kg","0.25 kg","F(t)=6t","80 N","2.0 kg","0.40 kg","0.15 kg","70 kg","40 N","4.0 kg","0.100±0.005","750 g","0.20 kg","0.60 N·s","80 kg","+20 N","0.40 kg","1.2 kg","0.90 kg","0.25 kg","2 kg","1 kg"];
const sourcePages={"p":"9-1-linear-momentum","i":"9-2-impulse-and-collisions","c":"9-3-conservation-of-linear-momentum"};
function near(got,want,tol=1e-8){assert.ok(Math.abs(got-want)<tol,`expected ${want}; received ${got}`);}
test('momentum pack retains 97 identities and exactly 24 new authored quantitative cases',()=>{
 assert.equal(Object.keys(lessons).length,97);
 assert.equal(new Set(ids).size,24);
 assert.equal(ids.filter(id=>lessons[id]).length,24);
 assert.equal(Object.values(lessons).filter(l=>l.essentialQuestion.startsWith('What does ')).length,0);
 const questions=new Set();
 for(let i=0;i<ids.length;i++){
  const id=ids[i],l=lessons[id];assert.ok(l.essentialQuestion.includes(anchors[i]),id);
  assert.ok(!l.essentialQuestion.startsWith('What does '),id);
  assert.ok(!questions.has(l.essentialQuestion),id); questions.add(l.essentialQuestion);
  for(const k of ['reasoningSteps','labPlan']){
    assert.equal(l[k].length,6,id+' '+k);
    assert.ok(l[k].every(s=>typeof s==='string'&&s.length>=125),id+' '+k);
    assert.ok(l[k][5].includes('https://openstax.org/books/university-physics-volume-1/pages/'+sourcePages[source[i]]),id+' '+k+' source');
  }
  assert.match(l.reasoningSteps.join(' '),/counterexample|falsif|invalid|misconception|fails|failure|incorrect|violat/i,id);
  assert.match(l.labPlan.join(' '),/independent|inverse|reconstruct|recover|reverse|verify/i,id);
  for(const prop of ['verifiedBoundary','analogy','starter','technical','memoryLadder','vocabulary','video'])assert.ok(l[prop],id+' '+prop);
 }
});
const independent=[
 ['signed cart momentum',()=>{near(3*4,12);near(3*(-4),-12);near(12/3,4);}],
 ['signed glider impulse',()=>{near(1.5*(-4-2),-9);near(-9/0.2,-45);}],
 ['vector norm',()=>{near(Math.hypot(2*3,2*(-4)),10);near(-8/2,-4);}],
 ['puck independent mass check',()=>{near(.25*12,3);near(3/12,.25);near(.5*12,6);}],
 ['linear ramp integration',()=>{near(3*2**2,12);near(12/3,4);near(.5*2*12,12);}],
 ['triangular pulse impulse',()=>{near(.5*80*.1,4);near(4/.2,20);near(4/.1,40);}],
 ['two-cart sticking and energy',()=>{near((2*3-1)/3,5/3);near(.5*2*9+.5*1,9.5);near(.5*3*(5/3)**2,25/6);}],
 ['unequal mass sticking',()=>{near((.4*5-.6*1)/1,1.4);near(.5*.4*25+.5*.6,5.3);near(.5*1*1.4**2,.98);}],
 ['signed rebound force',()=>{near(.15*(-10-20),-4.5);near(-4.5/.03,-150);near(.15*(0-20),-3);}],
 ['pulse duration comparison',()=>{near(70*(0-(-3)),210);near(210/.06,3500);near(210/.3,700);}],
 ['equal pulse impulse',()=>{near(40*.1,10*.4);near(40*.1/2,2);near(10*.2/2,1);}],
 ['negative momentum positive energy',()=>{near(4*(-1.5),-6);near(.5*4*1.5**2,4.5);near((-6)**2/(2*4),4.5);}],
 ['positive interval product',()=>{near(.1*8,.8);near(.095*7.8,.741);near(.105*8.2,.861);}],
 ['gram conversion defect',()=>{near(750/1000*(-4),-3);near(-3/(-4),.75);}],
 ['zero total momentum nonzero kinetic energy',()=>{near(.2*3+.3*(-2),0);near(.5*.2*9+.5*.3*4,1.5);}],
 ['external impulse changes p',()=>{near(3+.6,3.6);near((3.6-3)/2,.3);}],
 ['hypothetical stopping forces',()=>{near(80*(0-12),-960);near(-960/.08,-12000);near(-960/.2,-4800);}],
 ['misconception of force alone',()=>{near(20*.2,40*.1);near(4/2,2);near(40*.05/2,1);}],
 ['puck reversal impulse',()=>{near(.4*(-3-2),-2);near(-2/.05,-40);near(.4*(-1-2),-1.2);}],
 ['east-west center of mass',()=>{near(1.2*(-5)+.8*4,-2.8);near(-2.8/2,-1.4);near(1.2*(-5)+.8*7.5,0);}],
 ['constant momentum different energies',()=>{near(.9*(-6),1.8*(-3));near(.5*.9*36,16.2);near(.5*1.8*9,8.1);}],
 ['equal momentum unequal kinetic energy',()=>{near(.25*8,.5*4);near(.5*.25*64,8);near(.5*.5*16,4);}],
 ['external friction impulse independent newton check',()=>{near(2*3-2*1,4);near(3+(-2/2)*1,2);}],
 ['sticking inelastic energy accounting',()=>{near((1*2+3*0)/4,.5);near(.5*1*2**2,2);near(.5*4*.5**2,.5);near(2-.5,1.5);}]
];
assert.equal(independent.length,24);
for(const [name,calculation]of independent)test(name,calculation);
