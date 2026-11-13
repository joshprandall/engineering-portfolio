import unittest,pathlib,json,gzip
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["math-v06-lab-approximate-an-integral","math-v09-failure-analysis-lab-approximate-an-integral","math-v09-design-review-approximate-an-integral","math-v09-failure-analysis-l-approximate-an-integral-2"]
def trap(f,n):
 if not isinstance(n,int) or n<=0:raise ValueError('positive integer required')
 h=F(1,n);return h*(f(F(0))/2+sum((f(i*h) for i in range(1,n)),F(0))+f(F(1))/2)
def midpoint(f,n):
 if not isinstance(n,int) or n<=0:raise ValueError('positive integer required')
 return sum((f(F(2*i+1,2*n)) for i in range(n)),F(0))/n
def simpson(f,n):
 if not isinstance(n,int) or n<=0 or n%2:raise ValueError('positive even integer required')
 h=F(1,n);return h/3*(f(F(0))+f(F(1))+sum(((4 if i%2 else 2)*f(i*h) for i in range(1,n)),F(0)))
class QuadratureLabBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/quadrature-lab-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/math/lab.json').read_bytes())
  c=json.loads(gzip.decompress((R/'tests/baselines/independence-certificates.json.gz').read_bytes()))
  self.assertEqual(list(b),list(d));self.assertEqual(list(c),list(d));self.assertEqual(len(d),100)
  for k in IDS:self.assertEqual(d[k],c[k],k)
  for k in b:
   changed={f for f in set(b[k])|set(c[k]) if b[k].get(f)!=c[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/math/lab.json').read_bytes())
  for k in IDS:self.assertIn('https://openstax.org/books/calculus-volume-2/pages/3-6-numerical-integration',' '.join(d[k]['reasoningSteps']))
 def test_trapezoid_error(self):
  f=lambda x:2*x*x+1;exact=F(2,3)+1
  self.assertEqual([trap(f,n) for n in [1,2,4]],[F(2),F(7,4),F(27,16)])
  for n in [1,2,3,4,8,16]:
   self.assertEqual(trap(f,n)-exact,F(1,3*n*n));self.assertEqual(trap(f,n)-exact,4*(trap(f,2*n)-exact))
  with self.assertRaises(ValueError):trap(f,0)
 def test_midpoint_bracket(self):
  f=lambda x:2*x*x+1;exact=F(5,3)
  self.assertEqual([midpoint(f,n) for n in [1,2]],[F(3,2),F(13,8)])
  for n in [1,2,4,8]:
   m=midpoint(f,n);t=trap(f,n);self.assertLess(m,exact);self.assertGreater(t,exact)
   self.assertEqual(exact-m,F(1,6*n*n));self.assertEqual(t-exact,2*(exact-m))
 def test_simpson_contract(self):
  f=lambda x:2*x**3-3*x+4;exact=F(2,4)-F(3,2)+4
  self.assertEqual(exact,3)
  for n in [2,4,6]:self.assertEqual(simpson(f,n),exact)
  self.assertEqual(simpson(lambda x:x**4,2),F(5,24));self.assertEqual(F(5,24)-F(1,5),F(1,120))
  for n in [0,3]:
   with self.assertRaises(ValueError):simpson(f,n)
 def test_missed_between_nodes(self):
  g=lambda x:x*x*(x-F(1,2))**2*(x-1)**2
  self.assertEqual([g(x) for x in [F(0),F(1,2),F(1)]],[0,0,0]);self.assertGreater(g(F(1,4)),0)
  coefficients=[F(0),F(0),F(1,4),F(-3,2),F(13,4),F(-3),F(1)]
  for x in [F(0),F(1,4),F(1,2),F(3,4),F(1)]:self.assertEqual(sum((c*x**i for i,c in enumerate(coefficients)),F(0)),g(x))
  exact=sum((c/F(i+1) for i,c in enumerate(coefficients)),F(0));self.assertEqual(exact,F(1,840))
  self.assertEqual(trap(g,2),0);self.assertEqual(simpson(g,2),0);self.assertGreater(trap(g,4),0)
if __name__=='__main__':unittest.main()
