"""Exact algebra fixtures plus explicit domain boundaries."""
import pathlib,json,gzip,unittest,math
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/math/algebra.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/algebra-function-foundations.json.gz').read_bytes()))
IDS=["math-v08-evidence-lab-function-domain","math-v08-evidence-lab-function-range","math-v08-evidence-lab-quadratic-function","math-v08-evidence-lab-exponential-function","math-v08-evidence-lab-logarithm","math-v08-evidence-lab-system-of-linear-equations"]
SLUGS=["3-2-domain-and-range","3-2-domain-and-range","5-1-quadratic-functions","6-1-exponential-functions","6-3-logarithmic-functions","7-1-systems-of-linear-equations-two-variables"]
def mul(a,b):
 out=[F(0)]*(len(a)+len(b)-1)
 for i,x in enumerate(a):
  for j,y in enumerate(b):out[i+j]+=x*y
 return out
class AlgebraFunctionFoundations(unittest.TestCase):
 def claim(self,i,*values):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for value in values:self.assertIn(value,text)
 def test_scope(self):
  C=json.loads(gzip.decompress((R/'tests/baselines/log-domain-labs.json.gz').read_bytes()))
  for k in IDS:self.assertEqual(C[k],D[k],k)
  self.assertEqual(list(B),list(C));self.assertEqual(len(C),119)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(C[k]) if B[k].get(f)!=C[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,slug in zip(IDS,SLUGS):
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn('https://openstax.org/books/college-algebra-2e/pages/'+slug,D[k][f][-1])
 def test_domain_intersection(self):
  def allowed(x):return x>=2 and x!=5
  self.assertEqual([allowed(x) for x in [1,2,3,5,6]],[False,True,True,False,True])
  for x,want in [(2,F(0)),(3,F(-1,2)),(6,F(2))]:
   radicand=x-2;root=math.isqrt(radicand);self.assertEqual(root*root,radicand);self.assertEqual(F(root,x-5),want)
  for x in [F(1999,1000),F(2),F(4999,1000),F(5),F(5001,1000)]:self.assertEqual(allowed(x),(2<=x<5 or x>5))
  self.claim(0,'[2,5) union (5,infinity)','zero numerator','real')
 def test_range_inverse_and_endpoints(self):
  g=lambda x:(x-2)**2+3
  self.assertEqual([g(x) for x in [2,3,4,5]],[3,4,7,12])
  for y in [4,7,12]:
   x=2+math.isqrt(y-3);self.assertTrue(3<=x<=5);self.assertEqual(g(x),y)
  for numerator in range(300,501):
   x=F(numerator,100);self.assertTrue(1<=x-2<=3);self.assertTrue(4<=g(x)<=12)
  self.claim(1,'every y in [4,12]','x=2+sqrt(y-3)','Sampling outputs alone cannot prove')
 def test_quadratic_coefficients_and_symmetry(self):
  self.assertEqual(mul([-1,1],[-5,1]),[5,-6,1]);square=mul([-3,1],[-3,1]);square[0]-=4;self.assertEqual(square,[5,-6,1])
  q=lambda x:x*x-6*x+5
  self.assertEqual([q(x) for x in [0,1,3,5]],[5,0,-4,0])
  for h in [F(0),F(1),F(2),F(3,2),F(-7)]:self.assertEqual(q(3-h),h*h-4);self.assertEqual(q(3+h),h*h-4)
  self.claim(2,'(x-3)^2-4','matching coefficients','global minimum')
 def test_multiplicative_not_additive(self):
  values=[100*F(6,5)**n for n in range(4)];self.assertEqual(values,[100,120,144,F(864,5)])
  self.assertEqual([b/a for a,b in zip(values,values[1:])],[F(6,5)]*3);self.assertEqual([b-a for a,b in zip(values,values[1:])],[20,24,F(144,5)])
  self.assertEqual(100+20*2,140);self.assertEqual(100*F(6,5)*F(4,5),96);self.claim(3,'172.8','leaving 96');self.assertIn('second percentage uses the changed base',' '.join(D[IDS[3]]['labPlan']))
 def test_logarithm_inverse_and_domain(self):
  for exponent,argument in [(5,F(32)),(-3,F(1,8)),(0,F(1))]:self.assertEqual(F(2)**exponent,argument)
  def valid(base,argument):return base>0 and base!=1 and argument>0
  for base in [0,-2,1]:self.assertFalse(valid(base,1))
  for argument in [0,-1]:self.assertFalse(valid(2,argument))
  self.assertTrue(valid(2,F(1,8)));self.assertEqual([F(1)**y for y in [-3,0,5]],[1,1,1]);self.claim(4,'negative logarithm value is valid','not 1','Complex logarithms')
 def test_linear_systems(self):
  x=F(5+1,2);y=5-x;self.assertEqual((x,y),(3,2));self.assertEqual(x+y,5);self.assertEqual(x-y,1)
  self.assertEqual(12-2*5,2);self.assertEqual(10-2*5,0)
  for t in [F(0),F(3),F(5),F(-3,2)]:self.assertEqual(t+(5-t),5);self.assertEqual(2*t+2*(5-t),10)
  # Coefficients of t and constant for 2*t + 2*(5-t) are exactly 0 and 10.
  self.assertEqual([2-2,2*5],[0,10]);self.claim(5,'0=2','0=0','(t,5-t)','do not guarantee')
if __name__=='__main__':unittest.main()
