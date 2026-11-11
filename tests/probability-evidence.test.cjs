'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','math','probability.json'),'utf8'));
const ids=['math-probability','math-distributions','math-random-variable','math-v06-expected-value','math-v06-variance','math-v08-deep-dive-independent-events'];
const generic=/state the question in your own words|identify the exact verified claim|what does .+ mean, why does it matter|predict the outcome before manipulating|run the interactive model or work through/i;
const close=(actual,expected,epsilon=1e-11)=>assert.ok(Math.abs(actual-expected)<epsilon,'expected '+expected+' got '+actual);
const mean=(xs,ps)=>xs.reduce((s,x,i)=>s+x*ps[i],0);
const variance=(xs,ps)=>{const mu=mean(xs,ps);return xs.reduce((s,x,i)=>s+(x-mu)**2*ps[i],0)};
test('six authored probability lessons preserve 112 existing records and rich learning schema',()=>{
  assert.equal(Object.keys(pack).length,112);
  const questions=new Set();
  for(const id of ids) {
    const l=pack[id];
    assert.ok(l,id);assert.equal(l.reasoningSteps.length,6,id);assert.equal(l.labPlan.length,6,id);
    assert.ok(l.essentialQuestion.endsWith('?'),id);assert.doesNotMatch(l.essentialQuestion,generic,id);
    assert.ok(!questions.has(l.essentialQuestion),id);questions.add(l.essentialQuestion);
    assert.equal(new Set(l.reasoningSteps).size,6,id);assert.equal(new Set(l.labPlan).size,6,id);
    for(const sentence of [...l.reasoningSteps,...l.labPlan]){assert.ok(sentence.length>=100,id+' underdeveloped stage');assert.doesNotMatch(sentence,generic,id)}
    for(const field of ['technical','verifiedBoundary','memoryLadder','starter','video','vocabulary'])assert.ok(l[field],id+' '+field);
    const lab=l.labPlan.join(' ');
    assert.match(lab,/synthetic|hypothetical|fictional|illustrative|invented/i,id);
    assert.match(lab,/https:\/\/openstax\.org\/books\/introductory-statistics-2e\/pages\//,id);
  }
});
test('ordered fair-flip sample space counts overlap and complements without double counting',()=>{
 const space=['HH','HT','TH','TT'];
 const p=a=>space.filter(a).length/space.length;
 const A=o=>o.includes('H'),B=o=>o==='HH';
 close(p(A),.75);close(p(B),.25);close(p(o=>A(o)&&B(o)),.25);
 close(p(o=>A(o)||B(o)),p(A)+p(B)-p(o=>A(o)&&B(o)));
 close(1-p(o=>o==='TT'),.75);
 close(p(o=>o.split('').filter(x=>x==='H').length===1),.5);
 close(1-(1-.8)**2,.96);
});
test('PMF must have nonnegative masses that normalize and distinct strict/inclusive tails',()=>{
 const xs=[0,1,2],ps=[.2,.5,.3];
 const valid=arr=>arr.every(x=>Number.isFinite(x)&&x>=0&&x<=1)&&Math.abs(arr.reduce((a,b)=>a+b,0)-1)<1e-12;
 assert.ok(valid(ps));assert.equal(valid([.2,.5,.4]),false);
 const cdf=ps.map((_,i)=>ps.slice(0,i+1).reduce((a,b)=>a+b,0));
 close(cdf[0],.2);close(cdf[1],.7);close(cdf[2],1);
 close(ps.filter((_,i)=>xs[i]>=1).reduce((a,b)=>a+b,0),.8);
 close(ps.filter((_,i)=>xs[i]>1).reduce((a,b)=>a+b,0),.3);
 close(mean(xs,ps),1.1);
});
test('three independent Bernoulli failure trials aggregate unequal count probabilities',()=>{
 const p=.2,q=1-p;
 const expected=[q**3,3*p*q*q,3*p*p*q,p**3];
 [0.512,0.384,0.096,0.008].forEach((v,i)=>close(expected[i],v));
 close(expected.reduce((a,b)=>a+b,0),1);
 close(mean([0,1,2,3],expected),3*p);
 const half=[.125,.375,.375,.125];close(half.reduce((a,b)=>a+b,0),1);
 assert.notDeepEqual(half,[.25,.25,.25,.25]);
});
test('expected loss is weighted and not necessarily in single-event outcome support',()=>{
 const xs=[0,20,100],ps=[.7,.2,.1],adjusted=[.75,.2,.05];
 close(mean(xs,ps),14);close(mean(xs,adjusted),9);
 assert.ok(!xs.includes(mean(xs,ps)));close(ps.reduce((a,b)=>a+b,0),1);
 close(xs[2]*ps[2],10);close(xs[1]*ps[1],4);
 close(variance(xs,ps),884);
});
test('equal theoretical means can coexist with distinct variance and scaling',()=>{
 const A=[0,10],B=[4,6],ps=[.5,.5];
 close(mean(A,ps),5);close(mean(B,ps),5);
 close(variance(A,ps),25);close(variance(B,ps),1);
 close(Math.sqrt(variance(A,ps)),5);
 close(variance(A.map(x=>2*x),ps),4*variance(A,ps));
 close(variance(B.map(x=>x+100),ps),variance(B,ps));
});
test('independence does not mean mutual exclusion; conditional denominators matter',()=>{
 const all=['HH','HT','TH','TT'],prob=pred=>all.filter(pred).length/4;
 const A=o=>o[0]==='H',B=o=>o[1]==='H',C=o=>o[0]==='T';
 close(prob(A),.5);close(prob(B),.5);
 close(prob(o=>A(o)&&B(o)),prob(A)*prob(B));
 close(prob(o=>A(o)&&C(o)),0);
 assert.notEqual(prob(o=>A(o)&&C(o)),prob(A)*prob(C));
 close(prob(o=>A(o)&&B(o))/prob(A),prob(B));
 const pRedFirst=2/4, pRedSecondGivenFirstRed=1/3; close(pRedFirst*pRedSecondGivenFirstRed,1/6);assert.notEqual(pRedSecondGivenFirstRed,2/4);
});
test('worked numeric assertions agree with the six lesson reasoning and labs',()=>{
 const text=ids.map(id=>JSON.stringify({question:pack[id].essentialQuestion,reasoning:pack[id].reasoningSteps,lab:pack[id].labPlan})).join('\n');
 for(const number of ['0.512','0.384','0.096','0.008','0.96','$14','$9','Var(A)=25','Var(B)=1','P(B|A)=1/2'])assert.ok(text.includes(number),'missing '+number);
 assert.doesNotMatch(text,/measured on our production|actual customer telemetry|real fault rate/i);
});
