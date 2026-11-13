import unittest,pathlib,json,gzip,hashlib,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-v08-deep-dive-ransomware-backups","cyber-v08-evidence-lab-ransomware-backups","cyber-v08-deep-dive-ransomware-recovery-testing","cyber-v08-evidence-lab-ransomware-recovery-testing"]
def available(copies,failed):
 return {name for name,deps in copies.items() if not deps.intersection(failed)}
def valid_refs(payload):
 if not isinstance(payload,dict) or not isinstance(payload.get('customers'),list) or not isinstance(payload.get('orders'),list):return False
 return all(isinstance(o,dict) and o.get('customer') in payload['customers'] for o in payload['orders'])
class RecoveryEvidenceBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/recovery-evidence-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/recovery.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),96)
  for k in b:
   changed={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/cyber/recovery.json').read_bytes())
  for k in IDS:
   self.assertIn('https://www.cisa.gov/stopransomware/ransomware-guide',' '.join(d[k]['reasoningSteps']))
   self.assertIn('synthetic',' '.join(d[k]['reasoningSteps']+d[k]['labPlan']).lower())
 def test_shared_failure_boundary(self):
  copies={'A':{'production-account'},'B':{'production-account'},'C':{'recovery-credential'}}
  self.assertEqual(available(copies,set()),{'A','B','C'})
  self.assertEqual(available(copies,{'production-account'}),{'C'})
  self.assertEqual(available(copies,{'production-account','recovery-credential'}),set())
 def test_digest_reference_boundary(self):
  original=b'backup-v1';changed=b'backup-v2';expected=hashlib.sha256(original).digest()
  self.assertEqual(hashlib.sha256(original).digest(),expected)
  self.assertNotEqual(hashlib.sha256(changed).digest(),expected)
  replaced_reference=hashlib.sha256(changed).digest()
  self.assertEqual(hashlib.sha256(changed).digest(),replaced_reference)
  self.assertNotEqual(original,changed)
 def test_application_references(self):
  good=json.loads('{"customers":[1,2],"orders":[{"customer":2}]}')
  bad=json.loads('{"customers":[1,2],"orders":[{"customer":9}]}')
  self.assertTrue(valid_refs(good));self.assertFalse(valid_refs(bad))
  self.assertTrue(valid_refs({'customers':[1,2],'orders':[]}));self.assertFalse(valid_refs({'orders':[]}))
  with self.assertRaises(json.JSONDecodeError):json.loads('{')
 def test_prerequisite_truth_table(self):
  cases=list(itertools.product([False,True],repeat=3));passed=[x for x in cases if all(x)]
  self.assertEqual(len(cases),8);self.assertEqual(passed,[(True,True,True)])
  self.assertFalse(all((True,False,True)));self.assertFalse(all((True,True,False)))
if __name__=='__main__':unittest.main()
