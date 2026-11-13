"""Exact finite probability fixtures; do not execute prose or use random samples."""
import gzip,json,pathlib,unittest,itertools
from fractions import Fraction as F
ROOT=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((ROOT/'deep-learning/math/probability.json').read_bytes())
B=json.loads(gzip.decompress((ROOT/'tests/baselines/math-probability-evidence.json.gz').read_bytes()))
SUFFIXES=['deep-dive-conditional-probability','evidence-lab-conditional-probability','evidence-lab-independent-events','evidence-lab-random-variable','deep-dive-expected-value','evidence-lab-expected-value','deep-dive-variance','evidence-lab-variance']
IDS=['math-v08-'+s for s in SUFFIXES]
def mean(values,weights):
 if len(values)!=len(weights) or any(p<0 for p in weights) or sum(weights)!=1:raise ValueError('Invalid probability table')
 return sum(x*p for x,p in zip(values,weights))
def var(values,weights):
 m=mean(values,weights);return mean([(x-m)**2 for x in values],weights)
def conditional(a,b):
 if not b:raise ValueError('Zero probability condition')
 return F(len(a&b),len(b))
class ProbabilityEvidence(unittest.TestCase):
 def claim(self,i,*claims):
  t=' '.join(D[IDS[i]]['reasoningSteps'])
  for c in claims:self.assertIn(c,t)
 def test_exact_scope(self):
  checkpoint=json.loads(gzip.decompress((ROOT/'tests/baselines/covariance-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(B),list(checkpoint));self.assertEqual(list(checkpoint),list(D));self.assertEqual(len(D),112)
  for key in IDS:self.assertEqual(D[key],checkpoint[key],key)
  for key in B:
   fields=sorted(k for k in set(B[key])|set(checkpoint[key]) if B[key].get(k)!=checkpoint[key].get(k))
   self.assertEqual(fields,['essentialQuestion','labPlan','reasoningSteps'] if key in IDS else [],key)
 def test_structure_sources(self):
  for i,key in enumerate(IDS):
   x=D[key];self.assertNotIn('mean, why does it matter',x['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(x[f]),6);self.assertEqual(len(set(x[f])),6)
   slug='3-3-two-basic-rules-of-probability' if i<2 else '3-2-independent-and-mutually-exclusive-events' if i==2 else '4-2-mean-or-expected-value-and-standard-deviation'
   self.assertIn('https://openstax.org/books/introductory-statistics-2e/pages/'+slug,x['reasoningSteps'][-1])
 def test_conditioned_die(self):
  s=set(range(1,7));a={4,5,6};b={2,4,6}
  self.assertEqual(conditional(a,b),F(2,3));self.assertEqual(F(len(a),len(s)),F(1,2))
  self.assertEqual(conditional(a,b)*F(len(b),len(s)),F(len(a&b),len(s)))
  with self.assertRaises(ValueError):conditional(a,set())
  self.claim(0,'2/3','1/3','undefined')
 def test_alarm_table(self):
  both,miss,false,neither=8,2,18,72
  self.assertEqual(sum([both,miss,false,neither]),100)
  sensitivity=F(both,both+miss);precision=F(both,both+false)
  self.assertEqual(sensitivity,F(4,5));self.assertEqual(precision,F(4,13))
  self.assertEqual(sensitivity*F(10,100),F(2,25));self.assertEqual(precision*F(26,100),F(2,25))
  self.assertEqual(F(both,both+38),F(4,23));self.assertEqual(both+miss+38+neither,120)
  self.claim(1,'4/5','4/13','2/25')
 def test_replacement(self):
  objects=['R1','R2','B1'];with_r=list(itertools.product(objects,repeat=2));without=list(itertools.permutations(objects,2))
  red=lambda x:x.startswith('R')
  for pairs,total,joint,cond in [(with_r,9,F(4,9),F(2,3)),(without,6,F(1,3),F(1,2))]:
   self.assertEqual(len(pairs),total);rr=sum(red(a) and red(b) for a,b in pairs);first=sum(red(a) for a,b in pairs)
   self.assertEqual(F(rr,total),joint);self.assertEqual(F(rr,first),cond)
   self.assertEqual(F(sum(red(b) for a,b in pairs),total),F(2,3))
  self.claim(2,'4/9','1/3','1/2')
 def test_random_variable(self):
  values=[s.count('H') for s in ['HH','HT','TH','TT']];w=[F(1,4)]*4
  self.assertEqual({x:values.count(x) for x in set(values)},{0:1,1:2,2:1})
  self.assertEqual(mean(values,w),1);self.assertEqual(mean([x*x for x in values],w),F(3,2))
  self.claim(3,'P(X=1)=1/2','E(Y)=3/2','E(X)=1')
 def test_linearity_not_product(self):
  pairs=[(0,0),(2,2)];w=[F(1,2)]*2
  ex=mean([x for x,y in pairs],w);ey=mean([y for x,y in pairs],w)
  self.assertEqual(mean([x+y for x,y in pairs],w),ex+ey)
  self.assertEqual(mean([x*y for x,y in pairs],w),2);self.assertEqual(ex*ey,1)
  independent=list(itertools.product([0,2],repeat=2));self.assertEqual(mean([x*y for x,y in independent],[F(1,4)]*4),1)
  self.claim(4,'E(X+Y)=2','E(XY)=2','E(X)*E(Y)=1')
 def test_cost_weighting_and_validation(self):
  v=[0,10,40];w=[F(1,2),F(2,5),F(1,10)];net=[x-3 for x in v]
  self.assertEqual(mean(v,w),8);self.assertEqual(mean(net,w),5)
  self.assertEqual(sum(p for x,p in zip(net,w) if x<0),F(1,2));self.assertNotIn(5,net)
  with self.assertRaises(ValueError):mean(v,[F(1,2)]*3)
  with self.assertRaises(ValueError):mean([0,1],[F(-1),F(2)])
  with self.assertRaises(ValueError):mean([0],[F(1,2),F(1,2)])
  self.claim(5,'E(B)=','expected net value is 5','P(net<0)=1/2')
 def test_variance_affine(self):
  x=[-1,1];w=[F(1,2)]*2
  self.assertEqual(var(x,w),1)
  for a in [3,-3,0]:
   y=[a*t+10 for t in x];self.assertEqual(mean(y,w),10);self.assertEqual(var(y,w),a*a)
  self.claim(6,'Var(Y)=9','standard deviation 3','absolute value')
 def test_variance_two_methods(self):
  x=[0,1,2];w=[F(1,4),F(1,2),F(1,4)];m=mean(x,w)
  self.assertEqual(m,1);self.assertEqual(var(x,w),F(1,2))
  self.assertEqual(mean([v*v for v in x],w)-m*m,F(1,2))
  expanded=[0,1,1,2];s=sum((v-m)**2 for v in expanded)
  self.assertEqual(s/F(4),F(1,2));self.assertEqual(s/F(3),F(2,3))
  self.claim(7,'Var(X)=','1/2','2/3','n-1')
if __name__=='__main__':unittest.main()
