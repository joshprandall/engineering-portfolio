import unittest,pathlib,json,gzip,itertools
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["math-v06-lab-test-linear-independence","math-v09-practical-lab-test-linear-independence","math-v09-worked-example-test-linear-independence","math-v10-counterexample-lab-test-linear-independence"]
def combine(vectors,coeffs):
 if len(vectors)!=len(coeffs):raise ValueError('coefficient count')
 return tuple(sum((F(c)*v[i] for c,v in zip(coeffs,vectors)),F(0)) for i in range(len(vectors[0])))
def certificate(vectors,coeffs):
 return any(coeffs) and all(x==0 for x in combine(vectors,coeffs))
def det(u,v):return F(u[0])*v[1]-F(u[1])*v[0]
def rank2(vs):
 if any(det(u,v) for u,v in itertools.combinations(vs,2)):return 2
 return int(any(any(v) for v in vs))
class IndependenceCertificates(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/independence-certificates.json.gz').read_bytes()));d=json.loads((R/'deep-learning/math/lab.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),100)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/math/lab.json').read_bytes())
  for k,word in zip(IDS,['not a proof','Pairwise','not that every','tolerance policy']):
   text=' '.join(d[k]['reasoningSteps']);self.assertIn('https://textbooks.math.gatech.edu/ila/linear-independence.html',text);self.assertIn(word,text)
 def test_nontrivial_certificate(self):
  vs=[(1,2),(2,4)]
  self.assertEqual(combine(vs,[2,-1]),(0,0));self.assertTrue(certificate(vs,[2,-1]))
  self.assertEqual(combine(vs,[0,0]),(0,0));self.assertFalse(certificate(vs,[0,0]))
  self.assertFalse(certificate(vs,[1,1]));self.assertEqual(rank2([(1,0),(0,1)]),2)
 def test_pairwise_counterexample(self):
  vs=[(1,0),(0,1),(1,1)]
  self.assertEqual([det(u,v) for u,v in itertools.combinations(vs,2)],[1,1,-1])
  self.assertTrue(certificate(vs,[1,1,-1]));self.assertEqual(rank2(vs),2)
 def test_removal_not_arbitrary(self):
  vs=[(1,0),(2,0),(0,1)]
  self.assertTrue(certificate(vs,[2,-1,0]));self.assertEqual(rank2(vs),2)
  self.assertEqual([rank2(vs[:i]+vs[i+1:]) for i in range(3)],[2,2,1])
 def test_exact_perturbation(self):
  u=(F(1),F(1))
  for e in [F(0),F(1,10**20),F(-1,10**20)]:
   v=(F(1),1+e);self.assertEqual(det(u,v),e)
   self.assertEqual(rank2([u,v]),1 if e==0 else 2)
   self.assertEqual(certificate([u,v],[1,-1]),e==0)
if __name__=='__main__':unittest.main()
