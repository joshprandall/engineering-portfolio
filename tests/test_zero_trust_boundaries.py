import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-zero-trust","cyber-zero-trust-architecture","cyber-v06-zero-trust-per-session-decisions","cyber-v08-deep-dive-zero-trust-authentication-and-authorization"]
def allow(subject,resource,action,subject_auth,device_auth,posture,grants,location):
 return bool(subject_auth and device_auth and posture and (subject,resource,action) in grants)
class ZeroTrustBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/zero-trust-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/architecture.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),113)
  for k in b:
   changed={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/cyber/architecture.json').read_bytes())
  for k in IDS:
   self.assertIn('https://csrc.nist.gov/pubs/sp/800/207/final',' '.join(d[k]['reasoningSteps']))
   self.assertIn('model',' '.join(d[k]['reasoningSteps']).lower())
 def test_location_not_permission(self):
  for sa,da,p,g in itertools.product([False,True],repeat=4):
   grants={('analyst','report','read')} if g else set()
   results=[allow('analyst','report','read',sa,da,p,grants,loc) for loc in ['internal','external']]
   self.assertEqual(results,[all([sa,da,p,g])]*2)
 def test_resource_action_scope(self):
  grants={('analyst','report','read')}
  for resource,action in itertools.product(['report','payroll'],['read','write']):
   self.assertEqual(allow('analyst',resource,action,True,True,True,grants,'internal'),(resource,action)==('report','read'))
  self.assertFalse(allow('visitor','report','read',True,True,True,grants,'internal'))
 def test_new_session_policy(self):
  old=frozenset({('analyst','report','read')});new=frozenset()
  self.assertTrue(allow('analyst','report','read',True,True,True,old,'internal'))
  self.assertFalse(allow('analyst','report','read',True,True,True,new,'internal'))
  self.assertFalse(allow('analyst','report','read',True,True,False,old,'internal'))
  self.assertEqual(old,frozenset({('analyst','report','read')}))
 def test_independent_gates(self):
  grants={('analyst','report','read')}
  self.assertTrue(allow('analyst','report','read',True,True,True,grants,'internal'))
  for gates in [(False,True,True),(True,False,True),(True,True,False)]:
   self.assertFalse(allow('analyst','report','read',*gates,grants,'internal'))
  self.assertFalse(allow('analyst','report','read',True,True,True,set(),'internal'))
if __name__=='__main__':unittest.main()
