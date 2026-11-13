"""Exact discrete models and counterexamples, not sampled-pattern proofs."""
import pathlib,json,gzip,unittest
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/math/sequences.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/sequence-boundary-foundations.json.gz').read_bytes()))
IDS=['math-v09-recall-drill-arithmetic-sequence-2','math-v09-worked-example-arithmetic-sequence-2','math-v09-failure-analysis-l-arithmetic-sequences-2','math-v09-evidence-verificat-geometric-sequence-2','math-v09-practical-lab-geometric-sequence-2','math-v09-design-review-geometric-sequences-2']
def geometric(first,ratio,count):
 out=[];v=F(first)
 for _ in range(count):out.append(v);v*=ratio
 return out
class SequenceBoundaryFoundations(unittest.TestCase):
 def claim(self,i,*values):
  s=' '.join(D[IDS[i]]['reasoningSteps'])
  for v in values:self.assertIn(v,s)
 def test_scope(self):
  self.assertEqual(list(D),list(B));self.assertEqual(len(D),101)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  slugs=['9-2-arithmetic-sequences','9-4-series-and-their-notations','9-1-sequences-and-their-notations','9-3-geometric-sequences','9-4-series-and-their-notations','9-3-geometric-sequences']
  for k,slug in zip(IDS,slugs):
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn('https://openstax.org/books/college-algebra-2e/pages/'+slug,D[k][f][-1])
 def test_integer_membership(self):
  terms=[];v=4
  for _ in range(34):terms.append(v);v+=3
  self.assertEqual(terms[32:],[100,103]);self.assertNotIn(101,terms);self.assertNotIn(1,terms)
  inverse=lambda x:F(x-4,3)+1
  self.assertEqual(inverse(100),33);self.assertEqual(inverse(101),F(100,3));self.assertEqual(inverse(1),0)
  self.claim(0,'n=33','n=100/3','n=0')
 def test_inclusive_partial_sum(self):
  terms=[2*n+1 for n in range(5,13)]
  self.assertEqual(terms,[11,13,15,17,19,21,23,25]);self.assertEqual(len(terms),8)
  self.assertEqual(sum(terms),144);self.assertEqual(sum(terms),F(len(terms)*(terms[0]+terms[-1]),2))
  prefix=lambda n:sum(2*k+1 for k in range(1,n+1))
  self.assertEqual((prefix(12),prefix(4)),(168,24));self.assertEqual(prefix(12)-prefix(4),144)
  self.assertEqual(sum(2*k+1 for k in range(5,6)),11);self.assertEqual(F(sum(terms),len(terms)),18)
  self.claim(1,'12-5+1=8','S_12=168','S_4=24','144')
 def test_nonunique_prefix(self):
  f=lambda n:3*n-1
  g=lambda n,c=1:f(n)+c*(n-1)*(n-2)*(n-3)
  self.assertEqual([f(n) for n in range(1,4)],[2,5,8])
  for c in [-2,1,3]:
   self.assertEqual([g(n,c) for n in range(1,4)],[2,5,8]);self.assertNotEqual(g(4,c),f(4))
  self.assertEqual((f(4),g(4)),(11,17));self.claim(2,'f(4)=11','g(4)=17','explicitly assumes')
 def test_ratio_sign_ambiguity(self):
  positive=geometric(3,2,4);negative=geometric(3,-2,4)
  self.assertEqual(positive,[3,6,12,24]);self.assertEqual(negative,[3,-6,12,-24])
  for values in [positive,negative]:self.assertEqual(values[0],3);self.assertEqual(values[2],12)
  self.assertEqual({r for r in range(-10,11) if 3*r*r==12},{-2,2})
  self.assertEqual({r for r in range(-10,11) if 3*r**3==24},{2})
  self.claim(3,'r=2 and r=-2','a_2=6','r^3=8')
 def test_alternating_error_threshold(self):
  sums={n:sum(geometric(6,F(-1,2),n)) for n in range(1,21)}
  for n,s in sums.items():
   self.assertEqual(s,4*(1-F(-1,2)**n));self.assertEqual(abs(s-4),F(4,2**n))
   self.assertEqual(s>4,n%2==1)
  self.assertEqual(sums[5],F(33,8));self.assertEqual(sums[6],F(63,16))
  self.assertEqual(min(n for n,s in sums.items() if abs(s-4)<F(1,10)),6)
  self.assertEqual([sum(geometric(6,-1,n)) for n in range(1,7)],[6,0,6,0,6,0])
  self.claim(4,'33/8','63/16','1/8','1/16','six is the first')
 def test_zero_ratio_boundary(self):
  values=geometric(7,0,6);self.assertEqual(values,[7,0,0,0,0,0]);self.assertEqual(values[1]/values[0],0)
  for i in range(2,len(values)):
   with self.assertRaises(ZeroDivisionError):unused=values[i]/values[i-1]
  for r in [-2,0,1,3]:self.assertEqual(geometric(0,r,6),[0]*6)
  self.claim(5,'0/0 is undefined','every real multiplier','recurrence model')
if __name__=='__main__':unittest.main()
