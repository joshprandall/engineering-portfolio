import unittest,pathlib,json,gzip,math
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["math-v09-practical-lab-logarithm","math-v09-design-review-logarithm","math-v09-failure-analysis-lab-logarithm","math-v09-evidence-verification-la-logarithm"]
URL='https://openstax.org/books/precalculus-2e/pages/4-5-logarithmic-properties'
class LogDomainLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/log-domain-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/math/algebra.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),119)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/math/algebra.json').read_bytes())
  for k,phrase in zip(IDS,['candidates, not automatically solutions','not a rule about complex','cannot prove an identity','Do not extend']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t)
 def test_equation_domain(self):
  candidates=[-3,3];self.assertTrue(all(x*x-1==8 for x in candidates))
  self.assertEqual([x for x in candidates if x-1>0 and x+1>0],[3])
  self.assertEqual((3-1,3+1),(2**1,2**2));self.assertEqual(1+2,3)
  self.assertEqual((-3-1)*(-3+1),8);self.assertLess(-3-1,0);self.assertLess(-3+1,0)
 def test_square_absolute_value(self):
  for n in range(-8,9):
   for sign in [-1,1]:
    x=sign*F(2)**n;self.assertEqual(x*x,F(2)**(2*n))
    self.assertEqual(abs(x),F(2)**n)
    self.assertAlmostEqual(math.log2(float(x*x)),2*math.log2(float(abs(x))),places=12)
  self.assertEqual([x!=0 for x in [-4,0,4]],[True,False,True])
  self.assertEqual([x>0 for x in [-4,0,4]],[False,False,True])
  with self.assertRaises(ValueError):math.log2(0)
  with self.assertRaises(ValueError):math.log2(-4)
 def test_sum_counterexample(self):
  m=n=4;self.assertEqual(m+n,2**3);self.assertEqual(m*n,2**4)
  self.assertEqual(math.log2(m)+math.log2(n),4);self.assertNotEqual(math.log2(m+n),4)
  self.assertEqual(2+2,2*2)
 def test_quotient_domain(self):
  def original(x):return x!=5 and F(x-2,x-5)>0
  for x in range(-10,11):self.assertEqual(original(x),x<2 or x>5)
  self.assertEqual(F(1-2,1-5),F(1,4));self.assertEqual(F(6-2,6-5),4)
  self.assertEqual(F(3-2,3-5),F(-1,2));self.assertFalse(original(3))
  for x in [1,6]:
   lhs=math.log2(float(F(x-2,x-5)));rhs=math.log2(abs(x-2))-math.log2(abs(x-5));self.assertAlmostEqual(lhs,rhs)
  self.assertEqual(math.log2(abs(3-2))-math.log2(abs(3-5)),-1)
  self.assertFalse(original(2));self.assertFalse(original(5))
if __name__=='__main__':unittest.main()
