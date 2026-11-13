import unittest,pathlib,json,gzip
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v09-teach-back-lab-change-management-without-bureaucracy-theater","leadership-v09-worked-example-change-management-without-bureaucracy-theater","leadership-v09-misconception-clinic-change-management-without-bureaucracy-theater","leadership-v09-practical-lab-change-management-without-bureaucracy-theater"]
def rate(errors,requests):
 if requests==0:return None
 return F(errors,requests)
def review(ce,cn,be,bn):
 c,b=rate(ce,cn),rate(be,bn)
 if c is None or b is None:return None
 return (c<=F(1,100) and b<=F(1,100),c-b<=F(1,100))
def within(t):return 30<=t<60
class CanaryBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/canary-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/itsm.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),65)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/leadership/itsm.json').read_bytes())
  for k,words in zip(IDS,[['20%','undefined','not a confidence'],['1,200','30,000','spillover'],['10%','exercise choices','insufficient evidence'],['[30,60)','does not prove causality']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://sre.google/workbook/canarying-releases/',text)
   for word in words:self.assertIn(word,text)
 def test_population_weighting(self):
  c,b=rate(100,500),rate(0,9500)
  self.assertEqual(c,F(1,5));self.assertEqual(b,0)
  self.assertEqual(rate(100,10000),F(1,100))
  self.assertEqual(F(500,10000)*c+F(9500,10000)*b,F(1,100))
  self.assertEqual((c+b)/2,F(1,10));self.assertIsNone(rate(0,0))
 def test_exposure(self):
  def impact(share,seconds):return 1000*share*F(1,5)*seconds
  self.assertEqual(impact(F(1,20),120),1200)
  self.assertEqual(impact(1,120),24000)
  self.assertEqual(impact(F(1,20),3000),30000)
  self.assertEqual(impact(F(1,10),120),2*impact(F(1,20),120))
 def test_shared_failure_and_thresholds(self):
  self.assertEqual(review(0,1000,0,1000),(True,True))
  self.assertEqual(review(100,1000,100,1000),(False,True))
  self.assertEqual(review(20,1000,0,1000),(False,False))
  self.assertEqual(review(10,1000,0,1000),(True,True))
  self.assertEqual(review(11,1000,0,1000),(False,False))
  self.assertIsNone(review(0,0,0,1000))
 def test_matching_windows(self):
  errors=[10,20,35,45];requests=list(range(60))
  self.assertEqual(sum(map(within,errors)),2)
  self.assertEqual(sum(map(within,requests)),30)
  self.assertEqual(rate(sum(map(within,errors)),sum(map(within,requests))),F(1,15))
  self.assertEqual([within(t) for t in [29,30,59,60]],[False,True,True,False])
  self.assertNotEqual(rate(len(errors),30),F(1,15))
if __name__=='__main__':unittest.main()
