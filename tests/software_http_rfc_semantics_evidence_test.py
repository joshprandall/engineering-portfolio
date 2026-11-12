"""Offline, deterministic tests for 24 source-specific HTTP semantics lessons.

These deliberately small contract models are NOT an HTTP server, a browser,
a protocol compliance suite, a production benchmark, or evidence of origin behavior.
All fixtures use invented cases. Python standard library only.
"""
import json
import pathlib
import re
import hashlib
import sys
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE_SHA="43b2e273098f61e8f6834760a12e4e754cd35ff4"
LESSON_PATH="deep-learning/software/apis.json"
CASES=json.loads((ROOT/"tests/software-http-rfc-24-case-source.json").read_text(encoding="utf-8"))["cases"]
LESSONS=json.loads((ROOT/LESSON_PATH).read_text(encoding="utf-8"))
BASELINE=json.loads((ROOT/"tests/software-http-24-preauthoring-baseline.sha256.json").read_text(encoding="utf-8"))
def baseline_hash(value):
    b=json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(",",":")).encode("utf-8")
    return hashlib.sha256(b).hexdigest()


def model(kind, x):
    if kind=="sum": return sum(x["values"])
    if kind=="unique_keys": return len(set(x["keys"]))
    if kind=="families": return [n//100 for n in x["codes"]]
    if kind=="replace": return dict(x["body"])
    if kind=="safety":
        return [m in ("GET","HEAD","OPTIONS","TRACE") for m in x["methods"]]
    if kind=="conditional": return 304 if x["etag"]==x["ifNoneMatch"] else 200
    if kind=="delete_statuses": return [204,404] if x["exists"] else [404,404]
    if kind=="fresh": return x["age"] < x["maxAge"]
    if kind=="head_size":
        return {"bodyBytes": 0 if x["method"]=="HEAD" else x["bytes"],
                "representationBytes": x["bytes"]}
    if kind=="safe_effect":
        return x["method"] in ("GET","HEAD","OPTIONS","TRACE") and x["requestedWrites"]==0
    if kind=="last_write": return x["values"][-1]
    if kind=="delete_state": return x["initial"] and x["calls"]==0
    if kind=="range_length":
        assert 0 <= x["start"] <= x["end"] < x["total"]
        return x["end"]-x["start"]+1
    if kind=="conditional_head":
        return {"status":304 if x["etag"]==x["ifNoneMatch"] else 200,"bodyBytes":0}
    if kind=="post_creations":
        # None means unkeyed; two unkeyed requests count separately.
        seen=set()
        total=0
        for key in x["keys"]:
            if key is None or key not in seen:
                total+=1
            if key is not None: seen.add(key)
        return total
    if kind=="validate_amount": return 201 if x["amount"]>0 else 422
    if kind=="gateway":
        return 401 if not x["authenticated"] else (422 if not x["payloadValid"] else 200)
    if kind=="cache_roles":
        return x["age"] < (x["sMaxAge"] if x["shared"] else x["maxAge"])
    raise AssertionError("Unknown model kind "+kind)

class ProtocolEvidence(unittest.TestCase):
    def test_source_fixtures_and_lesson_contracts(self):
        self.assertEqual(24,len(CASES))
        self.assertEqual(24,len({x["id"] for x in CASES}))
        self.assertEqual(131,len(LESSONS))
        for c in CASES:
            with self.subTest(case=c["id"]):
                self.assertIn(c["id"],LESSONS)
                self.assertTrue(c["source"].startswith("https://www.rfc-editor.org/rfc/rfc911"))
                row=LESSONS[c["id"]]
                self.assertEqual(c["q"],row["essentialQuestion"])
                self.assertEqual(6,len(row["reasoningSteps"]))
                self.assertEqual(6,len(row["labPlan"]))
                self.assertIn(c["source"],row["reasoningSteps"][-1])
                self.assertIn(c["id"],row["labPlan"][0])
                self.assertGreater(len(" ".join(row["reasoningSteps"])),500)
                self.assertGreater(len(" ".join(row["labPlan"])),750)

    def test_immutable_base_scope_and_permitted_fields(self):
        self.assertEqual("9d6256f8c5886bbda2939a2f1a410ee9ccaddd76",BASELINE["originalBlob"])
        self.assertEqual(BASELINE["ids"],list(LESSONS))
        self.assertEqual(131,len(LESSONS))
        changed=[]
        allowed={"essentialQuestion","reasoningSteps","labPlan"}
        for key,row in LESSONS.items():
            record=BASELINE["records"][key]
            self.assertEqual(record["fieldOrder"],list(row),(key,"original fields and ordering"))
            other={k:v for k,v in row.items() if k not in allowed}
            self.assertEqual(record["nonTeachingSHA256"],baseline_hash(other),(key,"nonteaching data"))
            teaching_diffs=[k for k in sorted(allowed) if record["teachingSHA256"][k]!=baseline_hash(row[k])]
            if teaching_diffs:
                self.assertEqual(sorted(allowed),teaching_diffs,(key,"only all 3 teaching fields"))
                changed.append(key)
            else:
                self.assertEqual(record["fullSHA256"],baseline_hash(row),(key,"unchanged original"))
        self.assertEqual([c["id"] for c in CASES],changed)
        self.assertEqual(72,len(changed)*3)

def define_case(case):
    def exercise(self):
        self.assertEqual(case["expected"],model(case["kind"],case["input"]),
                         "base exercise "+case["id"])
        self.assertEqual(case["alternate"],model(case["kind"],case["variant"]),
                         "controlled perturbation "+case["id"])
        self.assertNotEqual(case["expected"],case["alternate"])
    return exercise

for i,c in enumerate(CASES,1):
    ident=re.sub(r"[^a-zA-Z0-9_]","_",c["id"])
    setattr(ProtocolEvidence,f"test_{i:02d}_{ident}",define_case(c))

if __name__=="__main__":
    if len(sys.argv)==3 and sys.argv[1]=="--case":
        found=[c for c in CASES if c["id"]==sys.argv[2]]
        if len(found)!=1: raise SystemExit("No unique fixture "+sys.argv[2])
        c=found[0]
        actual=model(c["kind"],c["input"])
        variant=model(c["kind"],c["variant"])
        assert actual==c["expected"],(actual,c["expected"])
        assert variant==c["alternate"],(variant,c["alternate"])
        print(json.dumps({"id":c["id"],"primary":actual,"variant":variant,
                          "source":c["source"],"engine":"synthetic offline model"},
                         ensure_ascii=False))
    else:
        unittest.main(verbosity=2)
