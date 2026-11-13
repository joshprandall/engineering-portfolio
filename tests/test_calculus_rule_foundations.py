"""Exact rational examples and polynomial coefficient checks, not theorem proofs."""
import pathlib,json,gzip,unittest
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/math/calculus.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/calculus-rule-foundations.json.gz').read_bytes()))
IDS=['math-v06-'+s for s in ['limit-laws','continuity-at-a-point','product-rule','quotient-rule','chain-rule','definite-integrals','fundamental-theorem-of-calculus','u-substitution']]
SLUGS=['2-3-the-limit-laws','2-4-continuity','3-3-differentiation-rules','3-3-differentiation-rules','3-6-the-chain-rule','5-2-the-definite-integral','5-3-the-fundamental-theorem-of-calculus','5-5-substitution']
def value(coeffs,x):return sum(F(c)*F(x)**i for i,c in enumerate(coeffs))
def derivative(coeffs):return [i*F(c) for i,c in enumerate(coeffs)][1:]
def integral(coeffs,a,b):return sum(F(c,i+1)*(F(b)**(i+1)-F(a)**(i+1)) for i,c in enumerate(coeffs))
def multiply(a,b):
 out=[F(0)]*(len(a)+len(b)-1)
 for i,x in enumerate(a):
  for j,y in enumerate(b):out[i+j]+=x*y
 return out
class CalculusRules(unittest.TestCase):
 def claim(self,i,*values):
  t=' '.join(D[IDS[i]]['reasoningSteps'])
  for v in values:self.assertIn(v,t)
 def test_scope(self):
  self.assertEqual(list(B),list(D));self.assertEqual(len(D),141)
  for k in B:
   fields=sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f))
   self.assertEqual(fields,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_structure_and_source(self):
  for i,k in enumerate(IDS):
   x=D[k];self.assertNotIn('mean, why does it matter',x['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(x[f]),6);self.assertEqual(len(set(x[f])),6)
   self.assertIn('https://openstax.org/books/calculus-volume-1/pages/'+SLUGS[i],x['reasoningSteps'][-1])
   self.assertIn('finite tests alone do not prove a theorem',x['reasoningSteps'][-1])
 def test_limit_punctured_domain(self):
  f=lambda x:(x*x-9)/(x-3)
  for h in [F(1,10),F(-1,10),F(1,100),F(-1,100)]:
   self.assertEqual(f(3+h),6+h);self.assertEqual(abs(f(3+h)-6),abs(h))
  with self.assertRaises(ZeroDivisionError):f(F(3))
  self.assertEqual(multiply([-3,1],[3,1]),[-9,0,1])
  self.claim(0,'limit 6','delta=epsilon','undefined at 3','x not equal to 3')
 def test_continuity_conditions(self):
  for h in [F(1,10),F(1,100)]:
   for x in [1-h,1+h]:self.assertEqual((x*x-1)/(x-1),x+1)
  common_limit=2
  self.assertTrue(common_limit==2);self.assertFalse(common_limit==5)
  left,right=0,1;self.assertNotEqual(left,right)
  self.claim(1,'exactly when c=2','c=5','left limit is 0','right limit is 1','No assignment')
 def test_product_expansion(self):
  expanded=multiply([1,0,1],[-2,3]);self.assertEqual(expanded,[-2,3,-2,3])
  der=derivative(expanded);self.assertEqual(der,[3,-4,9])
  for x in [-1,0,1,2]:self.assertEqual(value(der,x),2*x*(3*x-2)+3*(x*x+1))
  self.assertEqual(value(der,2),31);self.assertEqual(6*2,12);self.assertNotEqual(31,12)
  self.claim(2,'31 at x=2','12 at x=2','9x squared-4x+3')
 def test_quotient_domain_and_difference(self):
  q=lambda x:(x*x+1)/(x+2)
  dq=lambda x:(x*x+4*x-1)/(x+2)**2
  for x in map(F,[-3,0,1,2]):
   self.assertEqual(q(x),x-2+F(5)/(x+2));self.assertEqual(dq(x),1-F(5)/(x+2)**2)
  self.assertEqual(dq(F(1)),F(4,9))
  errors=[]
  for h in [F(1,100),F(1,1000)]:
   observed=(q(1+h)-q(1-h))/(2*h);errors.append(abs(observed-F(4,9)))
  self.assertLess(errors[1],errors[0]);self.assertLess(errors[1],F(1,10**6))
  for fn in [q,dq]:
   with self.assertRaises(ZeroDivisionError):fn(F(-2))
  self.claim(3,'4/9 at x=1','domain excludes x=-2','1-5/(x+2)')
 def test_chain_expansion(self):
  inner=[1,0,2];expanded=multiply(multiply(inner,inner),inner)
  self.assertEqual(expanded,[1,0,6,0,12,0,8]);der=derivative(expanded)
  for x in [-1,0,1,2]:self.assertEqual(value(der,x),12*x*(2*x*x+1)**2)
  self.assertEqual(value(der,1),108);self.assertEqual(value(der,0),0)
  self.assertEqual(3*(2*1+1)**2,27)
  self.claim(4,'108 at x=1','incorrect value 27','correct derivative is 0')
 def test_signed_integral_and_area(self):
  coeffs=[-1,1];negative=integral(coeffs,0,1);positive=integral(coeffs,1,3)
  self.assertEqual(negative,F(-1,2));self.assertEqual(positive,2)
  self.assertEqual(integral(coeffs,0,3),F(3,2));self.assertEqual(abs(negative)+positive,F(5,2))
  self.assertEqual(integral(coeffs,3,0),F(-3,2))
  self.assertNotEqual(abs(integral(coeffs,0,3)),abs(negative)+positive)
  self.claim(5,'signed integral of 3/2','1/2+2=5/2','-3/2')
 def test_ftc_upper_chain(self):
  a=[-3,2,0,1];b=[-3,0,2,0,0,0,1]
  self.assertEqual(value(a,1),0);self.assertEqual(value(a,2),9)
  self.assertEqual(derivative(a),[2,0,3]);self.assertEqual(value(derivative(a),2),14)
  for x in [-1,0,1,2]:
   self.assertEqual(value(b,x),value(a,x*x))
   self.assertEqual(value(derivative(b),x),(3*x**4+2)*2*x)
  self.assertEqual(value(derivative(b),2),200);self.assertEqual(3*2**4+2,50)
  self.claim(6,'A(1)=0','A(2)=9','200 at x=2','50 at x=2','continuous')
 def test_substitution_bounds_and_expansion(self):
  cube=multiply(multiply([1,0,1],[1,0,1]),[1,0,1]);expanded=multiply([0,2],cube)
  self.assertEqual(expanded,[0,2,0,6,0,6,0,2])
  self.assertEqual(integral(expanded,0,1),F(15,4))
  self.assertEqual(integral([0,0,0,1],1,2),F(15,4))
  self.assertEqual(integral([0,0,0,1],0,1),F(1,4))
  fourth=multiply(cube,[1,0,1]);antider=[c/4 for c in fourth]
  self.assertEqual(derivative(antider),expanded)
  self.claim(7,'15/4','incorrectly give 1/4','du=2x dx','u=1 and u=2')
if __name__=='__main__':unittest.main()
