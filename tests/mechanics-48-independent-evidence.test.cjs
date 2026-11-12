"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const cp=require("node:child_process");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const file="deep-learning/physics/mechanics.json";
const base="b4a3bdafd6af67454cc640cf585b0cf153a817e4";
const authored=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
const old=JSON.parse(cp.execFileSync("git",["show",base+":"+file],{cwd:root,encoding:"utf8",maxBuffer:10*1024*1024}));
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
test("complete original 120-record immutable order and exactly 48 authorized teaching changes",()=>{
 const names=Object.keys(old);
 assert.equal(names.length,120);
 assert.deepEqual(Object.keys(authored),names);
 assert.equal(fixture.length,48);
 const changed=[];
 for(const k of names){
  const before=old[k],after=authored[k];
  const diff=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(field=>JSON.stringify(before[field])!==JSON.stringify(after[field]));
  if(diff.length){changed.push(k);assert.deepEqual(diff.sort(),["essentialQuestion","labPlan","reasoningSteps"]); }
 }
 assert.deepEqual(changed,names.slice(0,48));
 assert.deepEqual(fixture.map(f=>f.id),changed);
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
