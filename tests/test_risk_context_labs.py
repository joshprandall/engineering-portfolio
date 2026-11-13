import unittest,pathlib,json,gzip,itertools
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-v06-lab-build-a-risk-matrix","cyber-v09-scenario-analysis-build-a-risk-matrix","cyber-v09-failure-analysis-lab-build-a-risk-matrix","cyber-v09-troubleshooting-lab-build-a-risk-matrix"]
def dominates(a,b):return all(x>=y for x,y in zip(a,b)) and any(x>y for x,y in zip(a,b))
def band(p):
 if p is None or not 0<=p<=1:raise ValueError('known probability required')
 return 'low' if p<F(1,10) else 'medium' if p<F(3,10) else 'high'
CONTEXT=['model_version','event','horizon','population','impact_measure']
def comparable(a,b):return all(k in a and k in b and a[k] is not None and a[k]==b[k] for k in CONTEXT)
class RiskContextLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/risk-context-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/lab.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),93)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/cyber/lab.json').read_bytes())
  for k,w in zip(IDS,['independence','cannot rank below','not NIST thresholds','not prescribed']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn('https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-30r1.pdf',t);self.assertIn(w,t)
 def test_horizon_and_count(self):
  p=F(1,10);total=F(0);any_event=F(0);count=F(0)
  for row in itertools.product([0,1],repeat=12):
   n=sum(row);mass=p**n*(1-p)**(12-n);total+=mass;count+=n*mass
   if n:any_event+=mass
  self.assertEqual(total,1);self.assertEqual(any_event,1-F(9,10)**12);self.assertEqual(count,F(6,5))
  self.assertAlmostEqual(float(any_event),0.717570463519,places=12);self.assertLess(any_event,1)
 def test_partial_order_not_total(self):
  a=(1,3);b=(2,2);c=(3,3)
  self.assertTrue(dominates(c,a));self.assertTrue(dominates(c,b))
  self.assertFalse(dominates(a,b));self.assertFalse(dominates(b,a))
  policies=[lambda x:3*x[0]+x[1],lambda x:x[0]+3*x[1]]
  self.assertLess(policies[0](a),policies[0](b));self.assertGreater(policies[1](a),policies[1](b))
  grid=list(itertools.product(range(1,4),repeat=2))
  for f in policies:
   for x,y in itertools.product(grid,repeat=2):
    if dominates(x,y):self.assertGreaterEqual(f(x),f(y))
 def test_explicit_cutoffs(self):
  vals=[F(0),F(99,1000),F(1,10),F(299,1000),F(3,10),F(301,1000),F(1)]
  self.assertEqual([band(p) for p in vals],['low','low','medium','medium','high','high','high'])
  self.assertEqual(F(301,1000)-F(299,1000),F(1,500))
  for p in [None,F(-1,100),F(101,100)]:
   with self.assertRaises(ValueError):band(p)
 def test_comparison_context(self):
  a=dict(zip(CONTEXT,['v1','event-A','one-year','synthetic-fleet','downtime-hours']))
  self.assertTrue(comparable(a,dict(a)))
  for k in CONTEXT:
   self.assertFalse(comparable(a,{**a,k:'different'}))
   missing={x:y for x,y in a.items() if x!=k};self.assertFalse(comparable(missing,missing))
   self.assertFalse(comparable({**a,k:None},{**a,k:None}))
if __name__=='__main__':unittest.main()
