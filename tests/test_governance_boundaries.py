import unittest,pathlib,json,gzip,itertools
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v08-deep-dive-cybersecurity-governance","leadership-v08-evidence-lab-cybersecurity-governance","leadership-v08-deep-dive-cybersecurity-roles-and-responsibilities","leadership-v08-evidence-lab-cybersecurity-roles-and-responsibilities","leadership-v08-deep-dive-cybersecurity-policy","leadership-v08-evidence-lab-cybersecurity-policy"]
def complete(record):
 return all(isinstance(record.get(k),str) and bool(record[k].strip()) for k in ['finding','owner','disposition','followup']) and record['disposition'] in {'mitigate','accept','avoid','transfer'}
def ratio(n,d):return F(n,d) if d else None
def rollout(current,approved,communicated,enforced):return tuple(v==current for v in [approved,communicated,enforced])
def review_closed(outcome,rationale):return outcome in {'keep','update'} and isinstance(rationale,str) and bool(rationale.strip())
class GovernanceBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/governance-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/governance.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),73)
  for key in b:
   changed={f for f in set(b[key])|set(d[key]) if b[key].get(f)!=d[key].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if key in IDS else set(),key)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/leadership/governance.json').read_bytes())
  claims=[['GV.OV','not proof'],['37.5%','unassessed','undefined'],['GV.RR-02','sixteen','not a CSF'],['GV.RR-02','fictional','does not implement'],['GV.PO-02','version 2','not proof'],['GV.PO-02','illustrative','Periodic review']]
  for key,words in zip(IDS,claims):
   text=' '.join(d[key]['reasoningSteps'])
   self.assertIn('https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf',text)
   for word in words:self.assertIn(word,text)
 def test_review_record_completeness(self):
  good={'finding':'synthetic finding','owner':'owner role','disposition':'mitigate','followup':'fictional due date'}
  self.assertTrue(complete(good))
  for key in good:
   bad=dict(good);del bad[key];self.assertFalse(complete(bad))
  self.assertFalse(complete({**good,'disposition':'unrecognized'}))
  self.assertFalse(complete({**good,'owner':'  '}))
 def test_metrics_denominators(self):
  scope=set(range(8));assessed={0,1,2,3};closed={0,1,2}
  self.assertEqual(ratio(len(closed),len(assessed)),F(3,4))
  self.assertEqual(ratio(len(closed),len(scope)),F(3,8))
  self.assertEqual(ratio(len(assessed),len(scope)),F(1,2));self.assertEqual(len(scope-assessed),4)
  self.assertIsNone(ratio(0,0));assessed.add(4)
  self.assertEqual(ratio(len(closed),len(assessed)),F(3,5));self.assertEqual(ratio(len(assessed),len(scope)),F(5,8))
 def test_four_role_dimensions(self):
  cases=list(itertools.product([False,True],repeat=4))
  self.assertEqual(len(cases),16);self.assertEqual(sum(all(x) for x in cases),1)
  self.assertFalse(all([True,False,False,False]));self.assertFalse(all([True,True,False,False]))
 def test_responsibility_not_blanket_authority(self):
  grants={('operator','execute'),('service-owner','approve')}
  cases=list(itertools.product(['operator','service-owner','observer'],['execute','approve']))
  self.assertEqual(sum(x in grants for x in cases),2)
  self.assertNotIn(('operator','approve'),grants);self.assertNotIn(('observer','execute'),grants)
 def test_policy_version_evidence(self):
  records=[(2,1,1),(2,2,1),(2,2,2)]
  self.assertEqual([rollout(2,*r) for r in records],[(True,False,False),(True,True,False),(True,True,True)])
  self.assertEqual([rollout(3,*r) for r in records],[(False,False,False)]*3)
 def test_changed_context_review(self):
  contexts=list(itertools.product([False,True],repeat=4))
  self.assertEqual(sum(any(x) for x in contexts),15)
  for outcome in ['keep','update']:
   self.assertTrue(review_closed(outcome,'documented synthetic rationale'))
   self.assertFalse(review_closed(outcome,' '))
  self.assertFalse(review_closed('publish','rationale'));self.assertFalse(review_closed('keep',None))
if __name__=='__main__':unittest.main()
