import unittest,pathlib,json,gzip,itertools
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v08-deep-dive-overload-protection","leadership-v08-evidence-lab-overload-protection","leadership-v08-deep-dive-graceful-degradation-under-overload","leadership-v08-evidence-lab-graceful-degradation-under-overload"]
def step(q,a,c,k):
 if any(not isinstance(x,int) or x<0 for x in [q,a,c,k]) or q>k:raise ValueError('invalid counts')
 admitted=min(a,k-q);rejected=a-admitted;completed=min(c,q+admitted)
 return admitted,rejected,completed,q+admitted-completed
def ratio(success,total):return F(success,total) if total else None
class CapacityBudgetBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/capacity-budget-boundaries.json.gz').read_bytes()));d=json.loads(gzip.decompress((R/'tests/baselines/retry-boundary-labs.json.gz').read_bytes()))
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),73)
  current=json.loads((R/'deep-learning/leadership/capacity.json').read_bytes())
  for k in IDS:self.assertEqual(d[k],current[k],k)
  for k in b:
   changed={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/leadership/capacity.json').read_bytes())
  for k in IDS:self.assertIn('https://sre.google/sre-book/handling-overload/',' '.join(d[k]['reasoningSteps']))
 def test_workload_cost(self):
  a=[1]*50;b=[1]*40+[8]*10
  self.assertEqual(len(a),len(b));self.assertEqual((sum(a),sum(b)),(50,120))
  self.assertEqual((F(sum(a),len(a)),F(sum(b),len(b))),(F(1),F(12,5)));self.assertLessEqual(sum(a),100);self.assertGreater(sum(b),100)
 def test_bounded_queue_conservation(self):
  self.assertEqual(step(8,7,6,10),(2,5,6,4))
  for k in range(6):
   for q in range(k+1):
    for a,c in itertools.product(range(8),repeat=2):
     admitted,rejected,completed,new=step(q,a,c,k)
     self.assertEqual(a,admitted+rejected);self.assertEqual(q+admitted,completed+new)
     self.assertTrue(0<=new<=k);self.assertTrue(0<=completed<=c)
  for args in [(11,1,1,10),(0,-1,1,10)]:
   with self.assertRaises(ValueError):step(*args)
 def test_resource_vectors(self):
  budget=(100,60);full=(8,2);degraded=(3,4)
  self.assertEqual(tuple(20*x for x in full),(160,40));self.assertEqual(tuple(20*x for x in degraded),(60,80))
  limit=min(b//cost for b,cost in zip(budget,degraded));self.assertEqual(limit,15)
  self.assertTrue(all(15*c<=b for c,b in zip(degraded,budget)));self.assertGreater(16*degraded[1],budget[1])
 def test_denominator(self):
  offered,admitted,rejected,success=100,60,40,60
  self.assertEqual(offered,admitted+rejected);self.assertEqual(ratio(success,admitted),1);self.assertEqual(ratio(success,offered),F(3,5))
  self.assertIsNone(ratio(0,0));self.assertEqual(ratio(0,100),0)
if __name__=='__main__':unittest.main()
