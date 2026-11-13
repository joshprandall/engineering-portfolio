import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-v08-deep-dive-csf-recover-function","cyber-v08-evidence-lab-csf-recover-function","cyber-v09-misconception-clinic-csf-recover-function","cyber-v09-recall-drill-csf-recover-function"]
def matches(e,subject,revision,kind):
 return e.get('subject')==subject and e.get('revision')==revision and e.get('kind')==kind and e.get('result')=='pass'
def readiness(states):
 if len(states)!=3 or any(x not in {'pass','fail','unknown'} for x in states):raise ValueError('three explicit states required')
 if 'fail' in states:return 'blocked'
 if 'unknown' in states:return 'incomplete'
 return 'ready'
def closure(row):return all(row.get(k) is True for k in ['service_ready','criteria_met','documentation_complete'])
def public_eligible(row):return row.get('audience')=='public' and all(row.get(k) is True for k in ['fact_review','message_approved','method_approved'])
class RecoveryOutcomeEvidence(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/recovery-outcome-evidence.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/recovery.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),96)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/cyber/recovery.json').read_bytes())
  for k,w in zip(IDS,['RC.RP-03','RC.RP-05','RC.RP-06','RC.CO-04']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn('https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf',t);self.assertIn(w,t);self.assertIn('synthetic',t)
 def test_subject_revision_kind(self):
  e={'subject':'B7','revision':7,'kind':'backup-integrity','result':'pass'}
  self.assertTrue(matches(e,'B7',7,'backup-integrity'))
  self.assertFalse(matches(e,'S7',7,'restored-asset-integrity'))
  e={'subject':'S','revision':7,'kind':'restored-asset-integrity','result':'pass'}
  self.assertTrue(matches(e,'S',7,'restored-asset-integrity'))
  self.assertFalse(matches(e,'S',8,'restored-asset-integrity'))
  self.assertFalse(matches({**e,'result':'unknown'},'S',7,'restored-asset-integrity'))
 def test_three_state_table(self):
  cases=list(itertools.product(['pass','fail','unknown'],repeat=3))
  result=[readiness(x) for x in cases];self.assertEqual(len(cases),27)
  self.assertEqual(result.count('ready'),1);self.assertEqual(result.count('incomplete'),7);self.assertEqual(result.count('blocked'),19)
  self.assertEqual(readiness(['pass','pass','unknown']),'incomplete')
  self.assertEqual(readiness(['pass','fail','unknown']),'blocked')
  for bad in [[],['pass']*2,['pass','pass',None]]:
   with self.assertRaises(ValueError):readiness(bad)
 def test_closure_criteria(self):
  keys=['service_ready','criteria_met','documentation_complete']
  rows=[dict(zip(keys,x)) for x in itertools.product([False,True],repeat=3)]
  self.assertEqual(sum(closure(x) for x in rows),1)
  row=dict(zip(keys,[True,True,False]));self.assertFalse(closure(row));self.assertFalse(closure({**row,'announcement_drafted':True}))
  self.assertFalse(closure({'service_ready':True,'criteria_met':True}))
 def test_public_eligibility_not_delivery(self):
  keys=['fact_review','message_approved','method_approved']
  rows=[dict(zip(keys,x),audience=a) for x in itertools.product([False,True],repeat=3) for a in ['internal','public']]
  self.assertEqual(sum(public_eligible(x) for x in rows),1)
  self.assertFalse(public_eligible({'audience':'public','fact_review':True,'message_approved':True}))
if __name__=='__main__':unittest.main()
