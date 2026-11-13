import unittest,pathlib,json,gzip,math
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["math-v10-compare-contrast-unit-circle-coordinates","math-v10-boundary-condition-lab-unit-circle-coordinates","math-v10-transfer-challenge-unit-circle-coordinates","math-v10-evidence-reading-unit-circle-coordinates"]
URL='https://openstax.org/books/precalculus-2e/pages/8-1-non-right-triangles-law-of-sines'
class SineAmbiguityLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/sine-ambiguity-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/math/trigonometry.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),97)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_claims(self):
  d=json.loads((R/'deep-learning/math/trigonometry.json').read_bytes())
  for k,phrase in zip(IDS,['principal inverse sine','Count distinct angles','unrounded values','C=0']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t)
 def test_reflected_points(self):
  a=math.pi/6;b=5*math.pi/6
  self.assertAlmostEqual(math.sin(a),.5);self.assertAlmostEqual(math.sin(b),.5)
  self.assertAlmostEqual(math.cos(a),-math.cos(b));self.assertGreater(math.cos(a),0);self.assertLess(math.cos(b),0)
  self.assertAlmostEqual(math.asin(.5),a);self.assertNotAlmostEqual(math.asin(.5),b)
 def test_exact_endpoint_candidates(self):
  # Exact rational multiples of pi avoid tolerance decisions at these boundaries.
  candidates={F(0):{F(0),F(1)},F(1,2):{F(1,6),F(5,6)},F(1):{F(1,2)}}
  self.assertEqual([len(candidates[h]) for h in [F(0),F(1,2),F(1)]],[2,2,1])
  self.assertEqual({x for x in candidates[F(0)] if 0<x<1},set())
  self.assertGreater(F(11,10),1)
 def test_two_triangles_and_independent_side_check(self):
  A=math.pi/6;a=7;b=10;q=F(5,7);B1=math.asin(float(q))
  self.assertAlmostEqual(math.degrees(B1),45.58,delta=.005)
  sides=[]
  for B in [B1,math.pi-B1]:
   C=math.pi-A-B;self.assertGreater(C,0);c=a*math.sin(C)/math.sin(A);sides.append(c)
   self.assertAlmostEqual(a/math.sin(A),b/math.sin(B));self.assertAlmostEqual(a/math.sin(A),c/math.sin(C))
   # Independently check the cosine relation and strict triangle inequalities.
   self.assertAlmostEqual(a*a,b*b+c*c-2*b*c*math.cos(A))
   self.assertTrue(a+b>c and a+c>b and b+c>a)
  self.assertNotAlmostEqual(sides[0],sides[1])
  self.assertAlmostEqual(math.degrees(math.pi-A-B1),104.42,delta=.005)
 def test_domain_not_sufficient(self):
  self.assertEqual(F(10)*F(1,2)/4,F(5,4));self.assertGreater(F(5,4),1)
  remaining=[180-120-B for B in [60,120]]
  self.assertEqual(remaining,[0,-60]);self.assertEqual([c for c in remaining if c>0],[])
  self.assertAlmostEqual(math.sin(math.radians(60)),math.sin(math.radians(120)))
if __name__=='__main__':unittest.main()
