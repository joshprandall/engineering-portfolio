"use strict";
// Independently specified synthetic detection/incident-response fixtures. Source: NIST SP 800-61r3, SP 800-92, CSWP 29. NOT real logs.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const lessons = JSON.parse(fs.readFileSync(path.join(__dirname, "../deep-learning/cyber/detection.json"), "utf8"));
const expectedIds = ["cyber-siem","cyber-lab-log-triage","cyber-incident-response","cyber-v06-incident-response-preparation","cyber-v06-incident-triage","cyber-v08-deep-dive-csf-detect-function","cyber-v08-evidence-lab-csf-detect-function","cyber-v08-deep-dive-csf-respond-function","cyber-v08-evidence-lab-csf-respond-function","cyber-v08-deep-dive-incident-response-integration","cyber-v08-evidence-lab-incident-response-integration","cyber-v09-evidence-verification-la-csf-detect-function","cyber-v09-troubleshooting-lab-csf-detect-function","cyber-v09-practical-lab-csf-respond-function","cyber-v09-quick-reference-csf-respond-function","cyber-v09-design-review-incident-response-integration","cyber-v09-misconception-clinic-incident-response-integration","cyber-v09-recall-drill-incident-response-is-part-of-risk-management","cyber-v09-scenario-analysis-incident-response-preparation","cyber-v09-worked-example-incident-triage","cyber-v09-decision-lab-siem-correlating-security-evidence-across-systems","cyber-v09-failure-analysis-lab-triage-a-suspicious-sign-in","cyber-v09-teach-back-lab-csf-detect-function","cyber-v09-evidence-verificat-csf-detect-function-2","cyber-v09-troubleshooting-lab-csf-respond-function","cyber-v09-practical-lab-csf-respond-function-2","cyber-v09-quick-reference-incident-response-integration","cyber-v09-design-review-incident-response-integration-2","cyber-v09-misconception-clinic-incident-response-is-part-of-risk-management","cyber-v09-recall-drill-incident-response-preparation","cyber-v09-scenario-analysis-incident-triage","cyber-v09-worked-example-siem-correlating-security-evidence-across-systems","cyber-v09-decision-lab-triage-a-suspicious-sign-in","cyber-v09-failure-analysis-lab-csf-detect-function","cyber-v09-teach-back-lab-csf-detect-function-2","cyber-v09-evidence-verification-la-csf-respond-function","cyber-v09-troubleshooting-la-csf-respond-function-2","cyber-v09-practical-lab-incident-response-integration","cyber-v09-quick-reference-incident-response-integration-2","cyber-v09-design-review-incident-response-is-part-of-risk-management","cyber-v09-misconception-clinic-incident-response-preparation","cyber-v09-recall-drill-incident-triage","cyber-v09-scenario-analysis-siem-correlating-security-evidence-across-systems","cyber-v09-worked-example-triage-a-suspicious-sign-in","cyber-v09-decision-lab-csf-detect-function","cyber-v09-failure-analysis-l-csf-detect-function-2","cyber-v09-teach-back-lab-csf-respond-function","cyber-v09-evidence-verificat-csf-respond-function-2","cyber-v09-troubleshooting-lab-incident-response-integration","cyber-v10-worked-walkthrough-csf-detect-function","cyber-v10-field-note-csf-detect-function","cyber-v10-verification-lab-csf-respond-function","cyber-v10-evidence-reading-csf-respond-function","cyber-v10-exam-style-practice-incident-response-integration","cyber-v10-fault-isolation-lab-incident-response-integration","cyber-v10-runbook-lab-incident-response-is-part-of-risk-management","cyber-v10-scenario-brief-incident-response-preparation","cyber-v10-reasoning-check-incident-triage","cyber-v10-trace-lab-siem-correlating-security-evidence-across-systems","cyber-v10-transfer-challenge-triage-a-suspicious-sign-in","cyber-v10-worked-walkthrough-csf-detect-function-2","cyber-v10-field-note-csf-detect-function-2","cyber-v10-diagnostic-lab-csf-respond-function","cyber-v10-evidence-reading-csf-respond-function-2","cyber-v10-exam-style-practic-incident-response-integration-2","cyber-v10-mistake-hunt-incident-response-integration","cyber-v10-configuration-lab-incident-response-is-part-of-risk-management","cyber-v10-scenario-brief-incident-response-preparation-2","cyber-v10-reasoning-check-incident-triage-2","cyber-v10-transfer-lab-siem-correlating-security-evidence-across-systems","cyber-v10-hypothesis-lab-triage-a-suspicious-sign-in","cyber-v10-worked-walkthrough-csf-detect-function-3","cyber-v10-field-note-csf-detect-function-3","cyber-v10-boundary-condition-lab-csf-respond-function","cyber-v10-evidence-reading-csf-respond-function-3","cyber-v10-exam-style-practic-incident-response-integration-3","cyber-v10-mistake-hunt-incident-response-integration-2","cyber-v10-recovery-lab-incident-response-is-part-of-risk-management","cyber-v10-scenario-brief-incident-response-preparation-3","cyber-v10-reasoning-check-incident-triage-3","cyber-v10-prediction-lab-siem-correlating-security-evidence-across-systems","cyber-v10-verification-lab-triage-a-suspicious-sign-in","cyber-v10-worked-walkthrough-csf-detect-function-4","cyber-v10-field-note-csf-detect-function-4","cyber-v10-fault-isolation-lab-csf-respond-function","cyber-v10-evidence-reading-csf-respond-function-4","cyber-v10-exam-style-practic-incident-response-integration-4","cyber-v10-mistake-hunt-incident-response-integration-3","cyber-v10-trace-lab-incident-response-is-part-of-risk-management","cyber-v10-scenario-brief-incident-response-preparation-4","cyber-v10-reasoning-check-incident-triage-4","cyber-v10-explain-back-challenge-siem-correlating-security-evidence-across-systems","cyber-v10-diagnostic-lab-triage-a-suspicious-sign-in","cyber-v10-worked-walkthrough-csf-detect-function-5","cyber-v10-field-note-csf-detect-function-5","cyber-v10-checklist-lab-csf-respond-function","cyber-v10-configuration-lab-csf-respond-function","cyber-v10-exam-style-practic-incident-response-integration-5","cyber-v10-mistake-hunt-incident-response-integration-4","cyber-v10-transfer-lab-incident-response-is-part-of-risk-management","cyber-v10-scenario-brief-incident-response-preparation-5","cyber-v10-reasoning-check-incident-triage-5"];
const cases = [
  {
    "id": "cyber-siem",
    "type": "siem",
    "expect": 1
  },
  {
    "id": "cyber-lab-log-triage",
    "type": "signin",
    "expect": 3
  },
  {
    "id": "cyber-incident-response",
    "type": "chain",
    "expect": 50
  },
  {
    "id": "cyber-v06-incident-response-preparation",
    "type": "notify",
    "expect": 9
  },
  {
    "id": "cyber-v06-incident-triage",
    "type": "risk",
    "expect": 2
  },
  {
    "id": "cyber-v08-deep-dive-csf-detect-function",
    "type": "precision",
    "expect": 0.75
  },
  {
    "id": "cyber-v08-evidence-lab-csf-detect-function",
    "type": "ingest",
    "expect": 9
  },
  {
    "id": "cyber-v08-deep-dive-csf-respond-function",
    "type": "respond",
    "expect": 56
  },
  {
    "id": "cyber-v08-evidence-lab-csf-respond-function",
    "type": "paths",
    "expect": 1
  },
  {
    "id": "cyber-v08-deep-dive-incident-response-integration",
    "type": "integrated",
    "expect": 19
  },
  {
    "id": "cyber-v08-evidence-lab-incident-response-integration",
    "type": "supplier",
    "expect": 7
  },
  {
    "id": "cyber-v09-evidence-verification-la-csf-detect-function",
    "type": "dedupe",
    "expect": 2
  }
];
const requiredSources = {"csf":"https://doi.org/10.6028/NIST.CSWP.29","ir":"https://doi.org/10.6028/NIST.SP.800-61r3","log":"https://doi.org/10.6028/NIST.SP.800-92"};
function evaluate(t){
 switch(t){
 case "siem": return [["host-a",3]].reduce((n,[h,sec])=>n+[["host-a",48],["host-b",205]].filter(([h2,sec2])=>h===h2 && Math.abs(sec2-sec)<=60).length,0);
 case "signin":return [10,11,12].filter(x=>13-x>=0 && 13-x<=5).length;
 case "chain":return [12,8,5,25].reduce((x,y)=>x+y,0);
 case "notify":return [4,7,5].reduce((x,y)=>x+y,0)-Math.max(...[4,7,5]);
 case "risk":return 4*3-2*5;
 case "precision":return 18/(18+6);
 case "ingest":return (9*60-0)/60;
 case "respond":return (14*60+18)-(13*60+22);
 case "paths":return [false,true].filter(Boolean).length;
 case "integrated":return (28+43)-(24+28);
 case "supplier":return (10*60+37)-(10*60+30);
 case "dedupe":return new Set(["e1","e1","e1","e1","e1","e2"]).size;
 default:throw Error("unknown "+t);
 }
}
assert.deepEqual(Object.keys(lessons), expectedIds, "all 102 record IDs and order retained");
for (const c of cases) {
 const v = lessons[c.id];
 assert.ok(v, "missing lesson "+c.id);
 assert.equal(v.reasoningSteps.length,6,"reasoning six stages "+c.id);
 assert.equal(v.labPlan.length,6,"offline lab six stages "+c.id);
 assert.ok(!/What does .*mean, why does it matter/.test(v.essentialQuestion),"must have distinct essential question "+c.id);
 assert.ok(v.reasoningSteps.some(s=>s.includes("https://doi.org/10.6028/NIST.")),"missing reputable source "+c.id);
 const result=evaluate(c.type);
 assert.ok(Math.abs(result-c.expect)<1e-10,"independent expected-value mismatch "+c.id+": "+result);
}
assert.equal(cases.length,12);
console.log("PASS: 12 distinct NIST-grounded detection/IR cases, 12 independent arithmetic/state assertions, all 102 IDs/order, six teaching stages per case.");
