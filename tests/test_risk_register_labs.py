import unittest,pathlib,json,gzip
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v09-decision-lab-risk-prioritization","leadership-v09-recall-drill-risk-prioritization","leadership-v09-quick-reference-risk-prioritization-2","leadership-v09-evidence-verificat-risk-prioritization-2"]
URL='https://nvlpubs.nist.gov/nistpubs/ir/2025/NIST.IR.8286r1.pdf'
def due(day,today):return 'unknown' if day is None else ('due' if day<=today else 'not due')
def matches(a,b):
 keys=['identifier','revision','scenario','horizon','model']
 return all(a.get(k) is not None and b.get(k) is not None and a[k]==b[k] for k in keys)
class RiskRegisterLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/risk-register-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/risk.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),66)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources_and_limits(self):
  d=json.loads((R/'deep-learning/leadership/risk.json').read_bytes())
  for k,phrase in zip(IDS,['not observed residual risk','not a NIST-prescribed cadence','does not prescribe','not proof']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t);self.assertIn('fictional',t)
 def test_target_not_forecast_or_actual(self):
  risk=dict(current=40,target=15,forecast=12,post_response=None,implemented=False)
  self.assertIsNone(risk['post_response']);self.assertLess(risk['forecast'],risk['target'])
  risk.update(post_response=18,implemented=True)
  self.assertEqual(risk['current']-risk['post_response'],22);self.assertEqual(risk['post_response']-risk['target'],3)
  self.assertGreater(risk['post_response'],risk['target'])
 def test_due_boundaries_and_unknown(self):
  self.assertEqual([due(d,12) for d in [10,12,15,None]],['due','due','not due','unknown'])
  for status in ['planned','implemented','accepted']:
   record=dict(status=status,review=10);self.assertEqual(due(record['review'],12),'due')
 def test_implementation_not_approval(self):
  def approved(record):return record.get('approval')=={'role':'risk committee','decision':'accept'}
  for implemented in [False,True]:
   self.assertFalse(approved(dict(implemented=implemented,approval=None)))
   self.assertFalse(approved(dict(implemented=implemented,approval={'role':'system owner','decision':'accept'})))
   self.assertTrue(approved(dict(implemented=implemented,approval={'role':'risk committee','decision':'accept'})))
 def test_context_consistency_all_fields(self):
  a=dict(identifier='D-17',revision=2,scenario='S-4',horizon='annual',model='M-2')
  self.assertTrue(matches(a,dict(a)))
  for k in a:
   b=dict(a);b[k]='different';self.assertFalse(matches(a,b),k)
   b=dict(a);b.pop(k);self.assertFalse(matches(a,b),k)
   b=dict(a);b[k]=None;self.assertFalse(matches(b,b),k)
if __name__=='__main__':unittest.main()
