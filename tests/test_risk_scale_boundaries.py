import unittest,pathlib,json,gzip
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v08-deep-dive-risk-prioritization","leadership-v08-evidence-lab-risk-prioritization","leadership-v09-quick-reference-risk-prioritization","leadership-v09-evidence-verification-la-risk-prioritization"]
def compare_intervals(a,b):
 if a[0]>a[1] or b[0]>b[1]:raise ValueError('invalid interval')
 if a[1]<b[0]:return 'below'
 if a[0]>b[1]:return 'above'
 return 'overlap'
class RiskScaleBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/risk-scale-boundaries.json.gz').read_bytes()));d=json.loads(gzip.decompress((R/'tests/baselines/risk-register-labs.json.gz').read_bytes()))
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),66)
  current=json.loads((R/'deep-learning/leadership/risk.json').read_bytes())
  for k in IDS:self.assertEqual(d[k],current[k],k)
  for k in b:
   changed={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/leadership/risk.json').read_bytes())
  for k in IDS:self.assertIn('https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-30r1.pdf',' '.join(d[k]['reasoningSteps']))
 def test_ordinal_relabeling(self):
  labels={1:1,2:2,3:3,4:10,5:11};values=list(labels.values());self.assertTrue(all(a<b for a,b in zip(values,values[1:])))
  self.assertGreater(3*3,2*4);self.assertLess(labels[3]*labels[3],labels[2]*labels[4])
  self.assertEqual((labels[3]*labels[3],labels[2]*labels[4]),(9,20))
 def test_expectation_and_tail(self):
  a=[(0,F(9,10)),(200,F(1,10))];b=[(0,F(1,2)),(40,F(1,2))]
  for distribution in [a,b]:
   self.assertEqual(sum(p for loss,p in distribution),1);self.assertEqual(sum(loss*p for loss,p in distribution),20)
  self.assertEqual(sum(p for loss,p in a if loss>100),F(1,10));self.assertEqual(sum(p for loss,p in b if loss>100),0)
 def test_uncertainty_interval(self):
  points=[100*p for p in [F(1,10),F(1,5),F(3,10)]];self.assertEqual(points,[10,20,30])
  self.assertEqual(compare_intervals((points[0],points[-1]),(20,20)),'overlap')
  self.assertEqual(compare_intervals((1,9),(10,30)),'below');self.assertEqual(compare_intervals((31,40),(10,30)),'above')
  with self.assertRaises(ValueError):compare_intervals((3,2),(0,1))
 def test_mitigation_overlap(self):
  universe=set(range(1,11));a=set(range(1,7));b=set(range(4,9))
  self.assertEqual((10*len(a),10*len(b),10*len(a&b)),(60,50,30))
  self.assertEqual(10*len(a|b),80);self.assertEqual(10*len(universe-(a|b)),20)
  self.assertEqual(len(a|b),len(a)+len(b)-len(a&b));self.assertLessEqual(10*len(a|b),100);self.assertGreater(60+50,100)
if __name__=='__main__':unittest.main()
