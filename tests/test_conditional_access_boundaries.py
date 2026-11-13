import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cloud-v05-conditional-access-signals","cloud-v07-conditional-access-policies","cloud-v09-scenario-analysis-conditional-access-policies","cloud-v09-decision-lab-conditional-access-signals"]
def evaluate(policies):
 # Pure bounded Boolean model: (state,applies,block,grant_satisfied).
 active=[p for p in policies if p[0]=='enabled' and p[1]]
 return any(p[2] or not p[3] for p in active)
class ConditionalAccessBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/conditional-access-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cloud/windows-identity.json').read_bytes())
  c=json.loads(gzip.decompress((R/'tests/baselines/group-policy-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(b),list(d));self.assertEqual(list(c),list(d));self.assertEqual(len(d),117)
  for k in IDS:self.assertEqual(d[k],c[k],k)
  for k in b:
   fields={f for f in set(b[k])|set(c[k]) if b[k].get(f)!=c[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources_and_boundaries(self):
  d=json.loads((R/'deep-learning/cloud/windows-identity.json').read_bytes())
  for i,k in enumerate(IDS):
   self.assertIn('https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-'+('report-only' if i==3 else 'policies'),' '.join(d[k]['reasoningSteps']))
   self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
  self.assertIn('device-certificate',' '.join(d[IDS[3]]['reasoningSteps']))
  self.assertIn('not proof',' '.join(d[IDS[2]]['reasoningSteps']))
 def test_assignments(self):
  rows=list(itertools.product([False,True],repeat=3))
  self.assertEqual(len(rows),8);self.assertEqual(sum(map(all,rows)),1);self.assertEqual(sum(map(any,rows)),7)
  self.assertEqual([r for r in rows if all(r)],[(True,True,True)])
 def test_within_policy(self):
  rows=list(itertools.product([False,True],repeat=2))
  self.assertEqual(list(map(all,rows)),[False,False,False,True])
  self.assertEqual(list(map(any,rows)),[False,True,True,True])
  self.assertEqual(sum(all(r)!=any(r) for r in rows),2)
 def test_across_policies(self):
  for m,c in itertools.product([False,True],repeat=2):
   policies=[('enabled',True,False,m),('enabled',True,False,c)]
   self.assertEqual(evaluate(policies),not(m and c))
   for order in itertools.permutations(policies):self.assertEqual(evaluate(order),not(m and c))
   block=('enabled',True,True,True)
   for order in itertools.permutations(policies+[block]):self.assertTrue(evaluate(order))
   self.assertEqual(evaluate(policies+[('enabled',False,True,False)]),not(m and c))
 def test_report_only_block(self):
  for state,would_report_failure,blocked in [('enabled',False,True),('report-only',True,False),('disabled',False,False)]:
   policy=(state,True,True,False)
   self.assertEqual(state=='report-only' and policy[1] and policy[2],would_report_failure)
   self.assertEqual(evaluate([policy]),blocked)
   self.assertTrue(evaluate([policy,('enabled',True,True,False)]))
  self.assertFalse(evaluate([('report-only',True,False,False)]))
  self.assertFalse(evaluate([])) # No modeled blocker is NOT overall sign-in success.
if __name__=='__main__':unittest.main()
