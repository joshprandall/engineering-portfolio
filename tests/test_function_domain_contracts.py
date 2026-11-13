"""Exact finite counterexamples and domain-aware function fixtures."""
import pathlib,json,gzip,unittest,math
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/math/functions.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/function-domain-contracts.json.gz').read_bytes()))
IDS=["math-v09-teach-back-lab-functions-inputs-rules-outputs","math-v09-troubleshooting-lab-functions-inputs-rules-outputs","math-v09-quick-reference-functions-inputs-rules-outputs","math-v09-misconception-clinic-functions-inputs-rules-outputs","math-v09-scenario-analysis-functions-inputs-rules-outputs","math-v09-decision-lab-functions-inputs-rules-outputs"]
REFS=["https://openstax.org/books/precalculus-2e/pages/1-1-functions-and-function-notation","https://openstax.org/books/precalculus-2e/pages/1-4-composition-of-functions","https://openstax.org/books/precalculus-2e/pages/1-2-domain-and-range","https://openstax.org/books/precalculus-2e/pages/1-7-inverse-functions","https://openstax.org/books/precalculus-2e/pages/1-7-inverse-functions","https://openstax.org/books/precalculus-2e/pages/1-2-domain-and-range"]
def outputs(relation):
 groups={}
 for x,y in relation:groups.setdefault(x,set()).add(y)
 return groups
def exact_sqrt(x):
 x=F(x)
 if x<0:raise ValueError('negative real radicand')
 a=math.isqrt(x.numerator);b=math.isqrt(x.denominator)
 if a*a!=x.numerator or b*b!=x.denominator:raise ValueError('fixture requires rational square')
 return F(a,b)
class FunctionContracts(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  C=json.loads(gzip.decompress((R/'tests/baselines/inverse-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(B),list(D));self.assertEqual(list(C),list(D));self.assertEqual(len(D),98)
  for k in IDS:self.assertEqual(D[k],C[k],k)
  for k in B:
   self.assertEqual(sorted(f for f in set(B[k])|set(C[k]) if B[k].get(f)!=C[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_relation_and_reverse(self):
  pairs=[(1,4),(2,4),(3,9)]
  self.assertTrue(all(len(v)==1 for v in outputs(pairs).values()))
  self.assertEqual(set(outputs(pairs)),{1,2,3});self.assertEqual({y for x,y in pairs},{4,9})
  reverse=outputs([(y,x) for x,y in pairs]);self.assertEqual(reverse[4],{1,2})
  self.assertEqual(outputs(pairs+[(1,4)]),outputs(pairs))
  self.assertEqual(outputs(pairs+[(1,5)])[1],{4,5})
  self.claim(0,'not require being one-to-one','overwrites conflicting outputs')
 def test_composite_domains(self):
  f=lambda x:F(1)/(x-1);g=lambda x:x*x
  for x in [F(-2),F(-1),F(0),F(1),F(2),F(3,2)]:
   if x in [-1,1]:
    with self.assertRaises(ZeroDivisionError):f(g(x))
   else:self.assertEqual(f(g(x)),F(1)/(x*x-1))
   if x==1:
    with self.assertRaises(ZeroDivisionError):g(f(x))
   else:self.assertEqual(g(f(x)),F(1)/(x-1)**2)
  self.assertEqual(g(f(F(-1))),F(1,4));self.assertEqual(f(g(F(2))),F(1,3));self.assertEqual(g(f(F(2))),1)
  self.claim(1,'neither -1 nor 1','1/4','intersecting')
 def test_cancelled_hole(self):
  h=lambda x:(x*x-1)/(x-1);k=lambda x:x+1
  for x in [F(-2),F(0),F(9,10),F(11,10),F(2)]:
   self.assertEqual(h(x),k(x))
  with self.assertRaises(ZeroDivisionError):h(F(1))
  self.assertEqual(k(F(1)),2);self.assertEqual(h(F(9,10)),F(19,10));self.assertEqual(h(F(11,10)),F(21,10))
  self.claim(2,'restriction x!=1','not the same function','new extension')
 def test_inverse_square_branches(self):
  self.assertEqual(F(-3)**2,F(3)**2)
  for x in [F(0),F(1,2),F(2),F(3),F(7,3)]:
   self.assertEqual(exact_sqrt(x*x),x)
   self.assertEqual(-exact_sqrt((-x)**2),-x)
  for y in [F(0),F(1,4),F(4),F(9),F(49,9)]:
   self.assertEqual(exact_sqrt(y)**2,y)
  self.assertEqual(exact_sqrt(F(-3)**2),3);self.assertNotEqual(exact_sqrt(F(-3)**2),-3)
  with self.assertRaises(ValueError):exact_sqrt(-1)
  self.claim(3,'abs(x)','x<=0','-sqrt(y)')
 def test_inverse_not_reciprocal(self):
  f=lambda x:2*x+3;inverse=lambda y:(y-3)/2;reciprocal=lambda x:1/f(x)
  for x in [F(-3),F(-3,2),F(0),F(5),F(7,3)]:
   self.assertEqual(inverse(f(x)),x);self.assertEqual(f(inverse(x)),x)
   if x!=F(-3,2):self.assertEqual(f(x)*reciprocal(x),1)
  self.assertEqual(inverse(F(5)),1);self.assertEqual(reciprocal(F(5)),F(1,13))
  with self.assertRaises(ZeroDivisionError):reciprocal(F(-3,2))
  self.assertEqual(inverse(F(-3,2)),F(-9,4))
  self.claim(4,'1/13','-9/4','composition')
 def test_piecewise_coverage_and_conflicts(self):
  valid=lambda x:[v for cond,v in [(x<0,-x),(x>=0,x*x)] if cond]
  for x,want in [(F(-2),2),(F(0),0),(F(2),4)]:self.assertEqual(valid(x),[want])
  conflicting=lambda x:{v for cond,v in [(x<=0,x+1),(x>=0,x*x)] if cond}
  self.assertEqual(conflicting(F(0)),{0,1})
  gap=lambda x:[v for cond,v in [(x<0,-x),(x>0,x*x)] if cond]
  self.assertEqual(gap(F(0)),[])
  agreeing={v for cond,v in [(True,F(0)),(True,F(0))] if cond};self.assertEqual(agreeing,{0})
  self.claim(5,'producing 1 and 0','explicit priority rule','both original conditions were strict')
if __name__=='__main__':unittest.main()
