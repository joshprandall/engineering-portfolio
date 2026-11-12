"""Offline, synthetic SQL semantic and audit contract for 24 individual database lessons.
SQLite exercises common SQL semantics, not PostgreSQL execution or query performance.
Run: python -m unittest -v tests/software_database_sqlite_evidence_test.py
"""
import json
import contextlib
import pathlib
import sqlite3
import gzip
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
CASES=json.loads((ROOT/"tests/software-database-sql-24-case-source.json").read_text(encoding="utf-8"))
DATA=json.loads((ROOT/"deep-learning/software/databases.json").read_text(encoding="utf-8"))
BASE="6ec65ebe16563d526e78f41d9c8f52cde5cabb21"

def statements(db, sql):
    chunks=[s.strip() for s in sql.split(";") if s.strip()]
    result=None
    for command in chunks:
        cur=db.execute(command)
        if command.upper().startswith(("SELECT","WITH","PRAGMA")):
            result=[list(row) for row in cur.fetchall()]
    return result

class CaseEvidence(unittest.TestCase):
    pass

def new_test(case):
    def test(self):
        with contextlib.closing(sqlite3.connect(":memory:")) as db:
            db.execute("PRAGMA foreign_keys=ON")
            self.assertEqual(db.execute("PRAGMA foreign_keys").fetchone()[0],1)
            for sql in case["setup"]:
                statements(db,sql)
            for stmt,expected in ((case["sql"],case["expected"]),(case["alternate"],case["altExpected"])):
                if isinstance(expected,dict) and expected.get("error")=="IntegrityError":
                    with self.assertRaises(sqlite3.IntegrityError):
                        statements(db,stmt)
                else:
                    observed=statements(db,stmt)
                    self.assertEqual(observed,expected,msg=f"{case['id']} SQL {stmt}")
            item=DATA[case["id"]]
            self.assertEqual(item["essentialQuestion"],case["question"])
            self.assertEqual(len(item["reasoningSteps"]),6)
            self.assertEqual(len(item["labPlan"]),6)
            self.assertTrue(any(case["source"] in v for v in item["reasoningSteps"]))
            self.assertTrue(any(case["source"] in v for v in item["labPlan"]))
            self.assertIn(case["sql"],item["labPlan"][1])
            self.assertIn(case["alternate"],item["labPlan"][3])
    return test

for n,c in enumerate(CASES,1):
    setattr(CaseEvidence,f"test_{n:02d}_{c['id'].split('software-v08-')[-1].replace('-','_')}",new_test(c))


class NullableJoinAntiMatchRegression(unittest.TestCase):
    def test_nullable_child_identifier_is_not_antijoin_witness(self):
        """A matched right row may have NULL id; only the equality join key proves no match."""
        with contextlib.closing(sqlite3.connect(":memory:")) as db:
            db.execute("CREATE TABLE c(id INTEGER PRIMARY KEY)")
            db.execute("CREATE TABLE o(id INTEGER, customer_id INTEGER, amount INTEGER)")
            db.executemany("INSERT INTO c VALUES(?)", [(1,), (2,), (3,)])
            db.executemany("INSERT INTO o VALUES(?,?,?)",
                           [(101,1,5), (103,3,15), (None,1,8)])
            unsound = statements(db,"SELECT c.id FROM c LEFT JOIN o ON c.id=o.customer_id WHERE o.id IS NULL ORDER BY c.id")
            sound = statements(db,"SELECT c.id FROM c LEFT JOIN o ON c.id=o.customer_id WHERE o.customer_id IS NULL ORDER BY c.id")
            self.assertEqual(unsound,[[1],[2]],"nullable matched child id must trigger false positive")
            self.assertEqual(sound,[[2]],"only truly unmatched parent 2 belongs")
            self.assertNotEqual(unsound,sound)
            self.assertIn("o.customer_id IS NULL",CASES[2]["alternate"])
            self.assertIn("nullable child identifiers",DATA["software-v08-deep-dive-sql-left-outer-join"]["labPlan"][4])

class IntegrityAudit(unittest.TestCase):
    def test_only_three_allowed_fields_modified(self):
        baseline=json.loads(gzip.decompress((ROOT/"tests/baselines/software-databases.json.gz").read_bytes()).decode("utf-8"))
        self.assertEqual(list(baseline),list(DATA))
        changed=[]
        for key in baseline:
            a,b=baseline[key],DATA[key]
            if a!=b:
                changed.append(key)
                self.assertEqual({k for k in a if a[k]!=b[k]}, {"essentialQuestion","reasoningSteps","labPlan"},msg=key)
        self.assertEqual(len(changed),24)
        self.assertEqual(set(changed),{c["id"] for c in CASES})

    def test_case_provenance_and_uniqueness(self):
        self.assertEqual(len(CASES),24)
        self.assertEqual(len(set(c["id"] for c in CASES)),24)
        self.assertEqual(len(set(c["question"] for c in CASES)),24)
        for c in CASES:
            self.assertTrue(c["source"].startswith("https://www.postgresql.org/docs/18/"))
            self.assertIn("SQLite",c["engineScope"])
            self.assertTrue(c["setup"] and c["sql"] and c["alternate"])
            self.assertFalse(c["question"].startswith("What does "))
if __name__=="__main__":
    unittest.main(verbosity=2)
