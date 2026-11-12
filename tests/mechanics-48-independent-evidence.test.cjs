"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const crypto=require("node:crypto");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const file="deep-learning/physics/mechanics.json";
const base="b4a3bdafd6af67454cc640cf585b0cf153a817e4";
const authored=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,"mechanics-48-preauthoring-baseline.sha256.json"),"utf8"));
function canonical(value) { if(Array.isArray(value)) return value.map(canonical); if(value!==null&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])); return value; }
const digest=value=>crypto.createHash("sha256").update(JSON.stringify(canonical(value)),"utf8").digest("hex");

const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,"mechanics-48-independent-evidence.fixtures.json"),"utf8"));
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));
function calculate(model,p){
 switch(model){
 case "newton":return p[1]/p[0];
 case "impulse":return p[0]*p[2]-p[0]*p[1];
 case "avgv":return (p[1]-p[0])/p[2];
 case "accel":return (p[1]-p[0])/p[2];
 case "displacement":return p[1]-p[0];
 case "motion":return (p[0]+(p[0]+p[1]*p[2]))*p[2]/2;
 case "dimension":return p[1]*p[0];
 case "circular":return p[0]*(p[0]/p[1]);
 case "torque":return p[1]*(p[0]*p[2]);
 case "projectile":return p[0]*Math.sqrt(p[1]/(p[2]/2));
 case "fbd":return p[0]/p[2]-p[1]/p[2];
 case "gravity":return p[0]/((p[2]/p[1])**2);
 case "angmom":return p[1]*p[0];
 case "first":return p[1]+(-p[0]);
 case "third":return p[0]/p[1];
 case "friction":return p[1]*p[2]*p[0];
 case "instant":return p[0]+2*p[1]*p[2];
 default:throw new Error("unknown "+model);
 }
}
test("complete original 120-record order and exactly 96 authorized changes in two independent 48-case sets",()=>{
 const names=Object.keys(authored);
 assert.equal(names.length,120);
 assert.equal(baseline.originalBlob,"a1cdc05bb25e6200f33317607a0d25bf9c5ee823");
 assert.deepEqual(names,baseline.ids);
 assert.equal(fixture.length,48);
 const changed=[];
 const allowed=["essentialQuestion","labPlan","reasoningSteps"];
 for(const k of names){
   const after=authored[k], before=baseline.records[k];
   assert.deepEqual(Object.keys(after),before.fieldOrder,"original field order "+k);
   const nonteaching=Object.fromEntries(Object.entries(after).filter(([name])=>!allowed.includes(name)));
   assert.equal(digest(nonteaching),before.nonTeachingSHA256,"nonteaching original unchanged "+k);
   const teachingChanges=allowed.filter(field=>digest(after[field])!==before.teachingSHA256[field]);
   if(teachingChanges.length) {
     assert.deepEqual(teachingChanges,allowed,"all 3 or no teaching changes "+k);
     changed.push(k);
   } else {
     assert.equal(digest(after),before.fullSHA256,"record must be byte-semantically original "+k);
   }
 }
 assert.deepEqual(changed,names.slice(0,96));
 assert.deepEqual(fixture.map(f=>f.id),changed.slice(0,48));
 const second=JSON.parse(fs.readFileSync(path.join(__dirname,"mechanics-next-48-model-evidence.fixtures.json"),"utf8"));
 assert.equal(second.changedIds.length,48);
 assert.deepEqual(second.changedIds,changed.slice(48,96));
});
test("original scientific cases have distinct questions and explicit external source, limits and falsification",()=>{
 assert.equal(new Set(fixture.map(f=>f.essentialQuestion)).size,48);
 assert.ok(new Set(fixture.map(f=>f.model)).size>=15);
 for(const item of fixture){
  const lesson=authored[item.id];
  assert.equal(lesson.essentialQuestion,item.essentialQuestion);
  assert.equal(lesson.reasoningSteps.length,6);
  assert.equal(lesson.labPlan.length,6);
  assert.ok(lesson.essentialQuestion.length>=70);
  assert.ok(lesson.reasoningSteps.every(s=>s.length>130));
  assert.ok(lesson.labPlan.every(s=>s.length>100));
  assert.ok(lesson.reasoningSteps[5].includes(item.source));
  assert.ok(lesson.reasoningSteps[4].includes("falsification"));
  assert.ok(lesson.labPlan[1].includes("offline"));
  assert.ok(lesson.reasoningSteps[5].includes("not experimental measurements"));
 }
});
for(const item of fixture) test(item.index+" "+item.id+" numeric primary/perturbation independently checked",()=>{
 const {model,params,expected,changed,unit}=item;
 assert.ok(close(calculate(model,params),expected),JSON.stringify({model,params,expected}));
 assert.ok(close(calculate(model,[params[0]*2,...params.slice(1)]),changed));
 const s=authored[item.id].reasoningSteps.join("\n");
 assert.ok(s.includes(unit));
 assert.ok(s.includes(String(Number(expected.toPrecision(7)))));
 assert.ok(s.includes(String(Number(changed.toPrecision(7)))));
 // secondary inverse physical reconstruction, independent of the authored expression
 switch(model){
 case "newton":assert.ok(close(expected*params[0],params[1]));break;
 case "impulse":assert.ok(close(params[1]+expected/params[0],params[2]));break;
 case "avgv":assert.ok(close(params[0]+expected*params[2],params[1]));break;
 case "accel":assert.ok(close(params[0]+expected*params[2],params[1]));break;
 case "displacement":assert.ok(close(params[0]+expected,params[1]));break;
 case "motion":assert.ok(close(expected,(params[0]+(params[0]+params[1]*params[2]))*params[2]/2));break;
 case "dimension":assert.ok(close(expected/params[0],params[1]));break;
 case "circular":assert.ok(close(expected*params[1],params[0]**2));break;
 case "torque":assert.ok(close(expected/(params[0]*params[2]),params[1]));break;
 case "projectile":assert.ok(close(params[2]*(expected/params[0])**2/2,params[1]));break;
 case "fbd":assert.ok(close(expected*params[2],params[0]-params[1]));break;
 case "gravity":assert.ok(close(expected*params[2]**2,params[0]*params[1]**2));break;
 case "angmom":assert.ok(close(expected/params[1],params[0]));break;
 case "first":assert.ok(close(expected+params[0],params[1]));break;
 case "third":assert.ok(close(expected*params[1],params[0]));break;
 case "friction":assert.ok(close(expected/(params[1]*params[2]),params[0]));break;
 case "instant":assert.ok(close(expected-2*params[1]*params[2],params[0]));break;
 }
});
