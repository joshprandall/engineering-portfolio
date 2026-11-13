import unittest,pathlib,json,gzip,itertools
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["math-v09-decision-lab-variance","math-v09-teach-back-lab-variance","math-v09-troubleshooting-lab-variance","math-v09-misconception-clinic-variance"]
def mean(xs,ps):
 if len(xs)!=len(ps) or any(p<0 for p in ps) or sum(ps)!=1:raise ValueError('invalid distribution')
 return sum(x*p for x,p in zip(xs,ps))
def variance(xs,ps):
 m=mean(xs,ps);return mean([(x-m)**2 for x in xs],ps)
def covariance(xs,ys,ps):
 a,b=mean(xs,ps),mean(ys,ps)
 return mean([(x-a)*(y-b) for x,y in zip(xs,ys)],ps)
def tables():
 return [(list(itertools.product([-1,1],repeat=2)),[F(1,4)]*4,0),([(-1,-1),(1,1)],[F(1,2)]*2,1),([(-1,1),(1,-1)],[F(1,2)]*2,-1)]
class CovarianceBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/covariance-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/math/probability.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),112)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/math/probability.json').read_bytes())
  for i,k in enumerate(IDS):
   self.assertIn('https://online.stat.psu.edu/stat414/Lesson'+('18' if i==1 else '24')+'.html',' '.join(d[k]['reasoningSteps']))
   self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_sum_joint_models(self):
  for pairs,ps,c in tables():
   xs,ys=zip(*pairs)
   self.assertEqual(mean(xs,ps),0);self.assertEqual(mean(ys,ps),0)
   self.assertEqual(variance(xs,ps),1);self.assertEqual(variance(ys,ps),1)
   self.assertEqual(covariance(xs,ys,ps),c)
   self.assertEqual(mean([x*y for x,y in pairs],ps)-mean(xs,ps)*mean(ys,ps),c)
   self.assertEqual(variance([x+y for x,y in pairs],ps),2+2*c)
 def test_uncorrelated_dependent(self):
  xs=[-1,0,1];ys=[x*x for x in xs];ps=[F(1,3)]*3
  self.assertEqual(mean(xs,ps),0);self.assertEqual(mean(ys,ps),F(2,3))
  self.assertEqual(variance(xs,ps),F(2,3));self.assertEqual(variance(ys,ps),F(2,9));self.assertEqual(covariance(xs,ys,ps),0)
  joint=sum(p for x,y,p in zip(xs,ys,ps) if x==y==0)
  px=sum(p for x,p in zip(xs,ps) if x==0);py=sum(p for y,p in zip(ys,ps) if y==0)
  self.assertEqual(joint,F(1,3));self.assertEqual(px*py,F(1,9));self.assertNotEqual(joint,px*py)
 def test_averaging(self):
  pairs=list(itertools.product([-1,1],repeat=4));means=[F(sum(v),4) for v in pairs]
  self.assertEqual(len(pairs),16);self.assertEqual(mean(means,[F(1,16)]*16),0)
  self.assertEqual(variance(means,[F(1,16)]*16),F(1,4))
  repeated=[(-1,)*4,(1,)*4];self.assertEqual(variance([F(sum(v),4) for v in repeated],[F(1,2)]*2),1)
 def test_difference_joint_models(self):
  for pairs,ps,c in tables():
   xs,ys=zip(*pairs);d=[x-y for x,y in pairs]
   self.assertEqual(mean(d,ps),0)
   self.assertEqual(variance(d,ps),2-2*c)
   self.assertEqual(variance(d,ps),variance(xs,ps)+variance(ys,ps)-2*covariance(xs,ys,ps))
if __name__=='__main__':unittest.main()
