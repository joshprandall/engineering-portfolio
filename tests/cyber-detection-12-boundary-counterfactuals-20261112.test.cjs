"use strict";
// Independently calculated counterfactuals on exclusively fictional incident records.
// Run: node tests/cyber-detection-12-boundary-counterfactuals-20261112.test.cjs
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const L=JSON.parse(fs.readFileSync(path.join(__dirname,"../deep-learning/cyber/detection.json"),"utf8"));
const minutes=t=>{const m=/^(\d\d):(\d\d)$/.exec(t);assert.ok(m);return +m[1]*60+(+m[2]);};
let scenarios=0;
function scenario(id,checks,anchors){
  assert.ok(L[id],id+" not found");
  checks();
  for(const [index,regex] of anchors)assert.match(L[id].labPlan[index],regex,id+" counterfactual not documented");
  scenarios++;
}
scenario("cyber-siem",()=>{
 const dns=[["host-a",3]],events=[["host-a",48],["host-b",205]];
 const join=(records,w)=>events.flatMap(([eh,et])=>records.filter(([dh,dt])=>eh===dh&&Math.abs(et-dt)<=w)).length;
 assert.equal(join(dns,60),1);assert.equal(join(dns,44),0);
 assert.equal(join([...dns,["host-b",200]],60),2);
},[[3,/44 seconds.*zero matching pairs/],[4,/host-b, 10:03:20.*two matches/]]);
scenario("cyber-lab-log-triage",()=>{
 const fails=["08:10","08:11","08:12"].map(minutes);
 const count=(success,sameSource)=>sameSource?fails.filter(t=>t<success&&success-t<=5).length:0;
 assert.equal(count(minutes("08:13"),true),3);assert.equal(count(minutes("08:13"),false),0);
 assert.equal(count(minutes("08:16"),true),2);
},[[2,/192\.0\.2\.11.*zero same-source/],[3,/08:16.*two qualifying failures/]]);
scenario("cyber-incident-response",()=>{
 const total=[12,8,5,25].reduce((a,b)=>a+b,0);
 assert.equal(total,50);assert.equal(total-3,47);
 assert.equal((total-47)/total,0.06);
 assert.equal(total-4,46); // four minutes of actual overlap, if durations otherwise unchanged
},[[3,/50 - 47 = 3.*3 \/ 50 = 0\.06/],[4,/overlap of 4 minutes/]]);
scenario("cyber-v06-incident-response-preparation",()=>{
 assert.equal(4+7+5,16);assert.equal(Math.max(4,7,5),7);
 assert.equal(Math.max(4+7,5),11); // A must acknowledge before B begins
 assert.equal(16-7,9);
},[[2,/last completion is seven/],[4,/B cannot start until A acknowledges/]]);
scenario("cyber-v06-incident-triage",()=>{
 const a=4*3,b=2*5,changedB=3*5;
 assert.equal(a-b,2);assert.equal(changedB,15);assert.ok(changedB>a);
},[[2,/likelihood from 2 to 3 gives S_B=15.*reverses/]]);
scenario("cyber-v08-deep-dive-csf-detect-function",()=>{
 const [tp,fp,fn,tn]=[18,6,3,73];
 assert.equal(tp+fp+fn+tn,100);assert.equal(tp/(tp+fp),0.75);
 assert.ok(Math.abs(tp/(tp+fn)-18/21)<1e-12);
 assert.ok(Math.abs(tn/(tn+fp)-73/79)<1e-12);
 assert.equal(2*tp/(2*tp+fp+fn),0.8);
},[[3,/specificity = TN\/\(TN\+FP\)=73\/79/]]);
scenario("cyber-v08-evidence-lab-csf-detect-function",()=>{
 const event=minutes("09:00"),arrive=minutes("09:09");
 assert.equal(arrive-event,9);
 assert.equal(Number(arrive<=minutes("09:05")),0);
 assert.equal(Number(arrive<=minutes("09:10")),1);
 assert.equal(Number(minutes("09:04")<=minutes("09:05")),1);
},[[1,/09:05.*count zero/],[2,/09:10.*count one/],[4,/09:04.*returns one/]]);
scenario("cyber-v08-deep-dive-csf-respond-function",()=>{
 const a=minutes("13:22"),b=minutes("13:39"),c=minutes("14:18");
 assert.equal(b-a,17);assert.equal(c-b,39);assert.equal(c-a,56);
 assert.equal(minutes("14:28")-a,66);
},[[3,/14:28.*66 minutes.*17/]]);
scenario("cyber-v08-evidence-lab-csf-respond-function",()=>{
 const active=x=>x.filter(Boolean).length;
 assert.equal(active([true,true]),2);assert.equal(active([false,true]),1);
 assert.equal(active([false,false]),0);
},[[1,/active paths.*2/],[2,/active path count 1/],[3,/active path count 0/]]);
scenario("cyber-v08-deep-dive-incident-response-integration",()=>{
 assert.equal(28+43,71);assert.equal(24+28,52);assert.equal(24+43,67);
 assert.equal((28+43)-(24+28),19);
},[[4,/four minutes.*67m, not 52m/]]);
scenario("cyber-v08-evidence-lab-incident-response-integration",()=>{
 const notice=minutes("10:00"),late=t=>Math.max(0,minutes(t)-notice-30);
 assert.equal(late("10:37"),7);assert.equal(late("10:25"),0);
 assert.equal(minutes("10:03")-notice,3);
},[[3,/10:25.*zero positive lateness/],[4,/receipt at 10:03.*without authorized acknowledgment/]]);
scenario("cyber-v09-evidence-verification-la-csf-detect-function",()=>{
 const events=["e1","e1","e1","e1","e1","e2"],distinct=x=>new Set(x).size;
 assert.equal(events.length,6);assert.equal(distinct(events),2);
 assert.equal(events.length-distinct(events),4);
 assert.equal(distinct([...events,"e2"]),2);
 const changed=[...events];changed[4]="e3";assert.equal(distinct(changed),3);
},[[3,/raw count becomes seven while unique count remains two/],[4,/unique count increases to three/]]);
assert.equal(scenarios,12);
console.log("PASS: 12 independent synthetic counterfactual families with lesson-text anchors.");