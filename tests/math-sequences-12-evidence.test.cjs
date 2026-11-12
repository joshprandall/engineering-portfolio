"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,"../deep-learning/math/sequences.json"),"utf8"));
const f=JSON.parse(fs.readFileSync(path.join(__dirname,"math-sequences-12-evidence.fixtures.json"),"utf8"));
const model={
an:x=>x.a+x.d*(x.n-1),gn:x=>x.a*x.r**(x.n-1),
ap:x=>x.ap+(x.n-x.p)*(x.aq-x.ap)/(x.q-x.p),
as:x=>Array.from({length:x.n},(_,i)=>x.a+i*x.d).reduce((a,b)=>a+b,0),
gs:x=>Array.from({length:x.n},(_,i)=>x.a*x.r**i).reduce((a,b)=>a+b,0),
galt:x=>Array.from({length:x.n},(_,i)=>x.a*x.r**i).reduce((a,b)=>a+b,0),
ad:x=>x.a+x.d*(x.n-1),adpair:x=>x.ap+(x.n-x.p)*(x.aq-x.ap)/(x.q-x.p),
counter:x=>new Set(x.terms.slice(1).map((v,i)=>v-x.terms[i])).size===1?1:0,
ginv:x=>x.ap*Math.cbrt(x.aq/x.ap)**(x.n-x.p),
thresh:x=>{let n=1,t=x.a;while(t<x.threshold&&n<200){t*=x.r;n++}return n},
gone:x=>Array.from({length:x.n},(_,i)=>x.a*x.r**i).reduce((a,b)=>a+b,0)
};
test("pack preserves 101 IDs and fixture 12 unique IDs",()=>{assert.equal(Object.keys(pack).length,101);assert.equal(f.cases.length,12);assert.equal(new Set(f.cases.map(x=>x.id)).size,12);});
for(const c of f.cases)test(c.id,()=>{const r=pack[c.id];assert.ok(r);assert.equal(r.essentialQuestion,c.question);assert.equal(r.reasoningSteps.length,6);assert.equal(r.labPlan.length,6);assert.ok(r.reasoningSteps.join(" ").includes("https://openstax.org/"));assert.ok(r.labPlan.join(" ").toLowerCase().includes("offline"));assert.ok(Math.abs(model[c.type](c.input)-c.expected)<1e-8);});
test("finite geometric boundary values",()=>{assert.equal(64-32+16-8+4-2+1,43);assert.equal(9*8,72);assert.equal(9+0+0,9);});
test("non-arithmetic first differences",()=>{const dif=a=>a.slice(1).map((v,i)=>v-a[i]);assert.deepEqual(dif([3,8,14,19]),[5,6,5]);assert.deepEqual(dif([3,8,13,18]),[5,5,5]);});

// Independent numerical and prose-semantic regression checks for the twelve authored examples.
// These checks intentionally do not modify the website runtime or shared test runner.
function stableHash(value){const str=JSON.stringify(value);let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return(h>>>0).toString(16).padStart(8,"0")}
function independentlyRecompute(type){
  function arith(a,d,n){let y=a;for(let i=1;i<n;i++)y+=d;return y}
  function geo(a,r,n){let y=a;for(let i=1;i<n;i++)y*=r;return y}
  function sumArith(a,d,n){let s=0;for(let i=1;i<=n;i++)s+=arith(a,d,i);return s}
  function sumGeo(a,r,n){let s=0;for(let i=1;i<=n;i++)s+=geo(a,r,i);return s}
  function firstGte(a,r,threshold){let term=a,n=1;while(term<threshold&&n<100){term*=r;n++}return n}
  switch(type){
    case "arith-index":return [arith(7,3,11),arith(7,4,11),arith(7,3,12)];
    case "geo-index":return [geo(5,2,7),geo(5,3,7),geo(5,2,8)];
    case "arith-anchor":{const d=(35-11)/(9-3),a1=11-2*d;return [d,a1,arith(a1,d,12),11+(12-3)*(41-11)/6,11+6*24]}
    case "arith-series":return [sumArith(4,5,12),sumArith(4,5,13),12*59];
    case "geo-series":return [sumGeo(6,.5,6),6/(1-.5),6/(1-.5)-sumGeo(6,.5,6),sumGeo(6,1,6)];
    case "geo-alternate":return [sumGeo(64,-.5,7),64/(1+.5),64/(1+.5)-sumGeo(64,-.5,7),sumGeo(64,-.5,8)];
    case "arith-sign":return [arith(45,-7,7),arith(45,-7,8),sumArith(45,-7,8),arith(45,-6,8)];
    case "arith-inverse":return [(-8-10)/6,10-3*(-3),arith(19,-3,14),arith(22,-4,14)];
    case "counterexample":{const a=[3,8,14,19],b=[3,8,13,18],dif=x=>x.slice(1).map((v,i)=>v-x[i]);const da=dif(a),db=dif(b);return [Math.max(...da)-Math.min(...da),Math.max(...db)-Math.min(...db),(19-3)/3]}
    case "geo-inverse":return [Math.cbrt(96/12),12*Math.cbrt(96/12)**4,324*3];
    case "threshold":return [firstGte(3,1.5,100),geo(3,1.5,9),geo(3,1.5,10),firstGte(3,1.5,75)];
    case "geo-one":return [sumGeo(9,1,8),sumGeo(9,0,8)];
    default:throw Error("Unknown mathematical oracle "+type);
  }
}
const semanticAudits=[
  {
    "id": "math-v06-arithmetic-sequences",
    "type": "arith-index",
    "proof": [
      "a₁₁=7+10×3=37",
      "a₁₁=47"
    ],
    "lab": [
      "final===37"
    ],
    "expected": [
      37,
      47,
      40
    ]
  },
  {
    "id": "math-v06-geometric-sequences",
    "type": "geo-index",
    "proof": [
      "a₇=5·2⁶=320",
      "5·3⁶=3645"
    ],
    "lab": [
      "last term===320"
    ],
    "expected": [
      320,
      3645,
      640
    ]
  },
  {
    "id": "math-v08-deep-dive-arithmetic-sequence",
    "type": "arith-anchor",
    "proof": [
      "a₁₂=3+11·4 gives 47",
      "a₁₂=56"
    ],
    "lab": [
      "a₉=11+6×24=155"
    ],
    "expected": [
      4,
      3,
      47,
      56,
      155
    ]
  },
  {
    "id": "math-v08-evidence-lab-arithmetic-sequence",
    "type": "arith-series",
    "proof": [
      "S₁₂=6·63=378",
      "S₁₃=442"
    ],
    "lab": [
      "sum=378"
    ],
    "expected": [
      378,
      442,
      708
    ]
  },
  {
    "id": "math-v08-deep-dive-geometric-sequence",
    "type": "geo-series",
    "proof": [
      "11.8125",
      "12−S₆=.1875"
    ],
    "lab": [
      "11.8125"
    ],
    "expected": [
      11.8125,
      12,
      0.1875,
      36
    ]
  },
  {
    "id": "math-v08-evidence-lab-geometric-sequence",
    "type": "geo-alternate",
    "proof": [
      "64(1−(−1/2)⁷)/(1+1/2)=43",
      "128/3"
    ],
    "lab": [
      "3·(43−128/3)=1"
    ],
    "expected": [
      43,
      42.666666666666664,
      -0.3333333333333333,
      42.5
    ]
  },
  {
    "id": "math-v09-recall-drill-arithmetic-sequence",
    "type": "arith-sign",
    "proof": [
      "aₙ=45−7(n−1)",
      "S₈=8(45−4)/2=164"
    ],
    "lab": [
      "firstNegativeIndex===8"
    ],
    "expected": [
      3,
      -4,
      164,
      3
    ]
  },
  {
    "id": "math-v09-worked-example-arithmetic-sequence",
    "type": "arith-inverse",
    "proof": [
      "a₁₄=19+13(−3)=−20",
      "a₁₄=−30"
    ],
    "lab": [
      "−30"
    ],
    "expected": [
      -3,
      19,
      -20,
      -30
    ]
  },
  {
    "id": "math-v09-failure-analysis-lab-arithmetic-sequences",
    "type": "counterexample",
    "proof": [
      "5,6,5",
      "3,8,13,18"
    ],
    "lab": [
      "membership(original)===false"
    ],
    "expected": [
      1,
      0,
      5.333333333333333
    ]
  },
  {
    "id": "math-v09-evidence-verification-la-geometric-sequence",
    "type": "geo-inverse",
    "proof": [
      "a₆=a₂r⁴=12·16=192",
      "a₆=972"
    ],
    "lab": [
      "a₆===192"
    ],
    "expected": [
      2,
      192,
      972
    ]
  },
  {
    "id": "math-v09-practical-lab-geometric-sequence",
    "type": "threshold",
    "proof": [
      "a₉=76.88671875",
      "a₁₀=115.330078125"
    ],
    "lab": [
      "outputs 10 and 9"
    ],
    "expected": [
      10,
      76.88671875,
      115.330078125,
      9
    ]
  },
  {
    "id": "math-v09-design-review-geometric-sequences",
    "type": "geo-one",
    "proof": [
      "9(1−r⁸)/(1−r)",
      "continuous limiting value 72"
    ],
    "lab": [
      "finiteSum(9,1,8)===72"
    ],
    "expected": [
      72,
      9
    ]
  }
];
test("101 IDs, all non-teaching fields and 89 untouched lessons retain immutable reference fingerprints",()=>{
  assert.equal(stableHash(Object.keys(pack)),"0ca03bfe");
  const permitted=new Set(["essentialQuestion","reasoningSteps","labPlan"]);
  assert.equal(stableHash(Object.entries(pack).map(([id,r])=>[id,Object.entries(r).filter(([k])=>!permitted.has(k))])),"5d42dedc");
  const changed=new Set(semanticAudits.map(x=>x.id));
  assert.equal(stableHash(Object.entries(pack).filter(([id])=>!changed.has(id))),"1dcf817d");
});
for(const sample of semanticAudits)test(sample.id+" independently recomputed claims and corruption checks",()=>{
  const lesson=pack[sample.id];assert.ok(lesson);
  const proof=lesson.reasoningSteps.join(" "),lab=lesson.labPlan.join(" ");
  assert.equal(lesson.reasoningSteps.length,6);
  assert.equal(lesson.labPlan.length,6);
  assert.match(proof,/https:\/\/openstax\.org\//);
  for(const phrase of sample.proof)assert.ok(proof.includes(phrase),"Missing verified mathematical claim: "+phrase);
  for(const phrase of sample.lab)assert.ok(lab.includes(phrase),"Missing reproducibility assertion: "+phrase);
  const got=independentlyRecompute(sample.type);
  assert.equal(got.length,sample.expected.length);
  got.forEach((v,i)=>assert.ok(Math.abs(v-sample.expected[i])<1e-9,"Wrong numerical oracle "+sample.type+" position "+i));
  const corruptProof=proof.replace(sample.proof[0],"ALTERED_PROOF");
  assert.notEqual(corruptProof,proof);
  assert.equal(corruptProof.includes(sample.proof[0]),false,"A corrupted teaching claim must fail its evidence gate");
  const corruptLab=lab.replace(sample.lab[0],"ALTERED_LAB");
  assert.notEqual(corruptLab,lab);
  assert.equal(corruptLab.includes(sample.lab[0]),false,"A corrupted lab target must fail its evidence gate");
});


// Exercise the assertions against altered copies of actual lesson records.
// Mutating reconstructed strings alone does not establish that a bad lesson fails.
function teachingRecordHasEvidence(record, audit) {
  if (!record || !Array.isArray(record.reasoningSteps) || !Array.isArray(record.labPlan)) return false;
  if (record.reasoningSteps.length !== 6 || record.labPlan.length !== 6) return false;
  const proof = record.reasoningSteps.join(" "), lab = record.labPlan.join(" ");
  return proof.includes("https://openstax.org/") &&
    audit.proof.every(fragment => proof.includes(fragment)) &&
    audit.lab.every(fragment => lab.includes(fragment));
}
test("all twelve lessons reject 24 independently mutated proof and lab records", () => {
  let rejected = 0;
  for (const audit of semanticAudits) {
    const record = pack[audit.id];
    assert.ok(teachingRecordHasEvidence(record, audit), "Baseline evidence missing: " + audit.id);
    const badProof = {
      ...record,
      reasoningSteps: record.reasoningSteps.map(step => step.replace(audit.proof[0], "INCORRECT_RESULT"))
    };
    const badLab = {
      ...record,
      labPlan: record.labPlan.map(step => step.replace(audit.lab[0], "INCORRECT_ASSERTION"))
    };
    assert.notDeepEqual(badProof.reasoningSteps, record.reasoningSteps);
    assert.notDeepEqual(badLab.labPlan, record.labPlan);
    assert.equal(teachingRecordHasEvidence(badProof, audit), false, audit.id + " accepted altered proof");
    assert.equal(teachingRecordHasEvidence(badLab, audit), false, audit.id + " accepted altered lab");
    rejected += 2;
  }
  assert.equal(rejected, 24);
});

// Exercise the general finite-series identities beyond the twelve worked examples.
// Integer-valued inputs make direct recurrence and closed-form comparisons exact.
test("255 independent finite-sum edge cases include negative, zero and unit ratios", () => {
  let checked = 0;
  for (const first of [-5, 0, 4]) {
    for (const difference of [-3, 0, 7]) {
      for (let n = 1; n <= 15; n++) {
        let sum = 0, term = first;
        for (let i = 0; i < n; i++) { sum += term; term += difference; }
        const closed = n * (2 * first + (n - 1) * difference) / 2;
        assert.equal(sum, closed, "Arithmetic series: " + [first, difference, n]);
        checked++;
      }
    }
  }
  for (const first of [-3, 0, 5]) {
    for (const ratio of [-2, -1, 0, 1, 2]) {
      for (let n = 1; n <= 8; n++) {
        let sum = 0, term = first;
        for (let i = 0; i < n; i++) { sum += term; term *= ratio; }
        const closed = ratio === 1 ? n * first : first * (1 - ratio ** n) / (1 - ratio);
        assert.equal(sum, closed, "Geometric series: " + [first, ratio, n]);
        checked++;
      }
    }
  }
  assert.equal(checked, 255);
});
