import unittest,pathlib,json,gzip
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v09-evidence-verification-la-vendor-evaluation-beyond-the-demo","leadership-v09-recall-drill-vendor-evaluation-beyond-the-demo","leadership-v09-evidence-verificat-vendor-evaluation-beyond-the-demo-2","leadership-v09-recall-drill-vendor-evaluation-beyond-the-demo-2"]
def score(values,weights):return sum(v*w for v,w in zip(values,weights))
class VendorSensitivity(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/vendor-sensitivity.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/vendors.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),66)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/leadership/vendors.json').read_bytes())
  for k,words in zip(IDS,[['4/7','not a complete MCDA'],['At w=0','nonnegative'],['0.06','not a method'],['x=60','not probabilities']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://www.gov.uk/government/publications/green-book-supplementary-guidance-multi-criteria-decision-analysis/use-of-multi-criteria-decision-analysis-in-options-appraisal-of-economic-cases',text)
   for word in words:self.assertIn(word,text)
 def test_weight_reversal(self):
  for w,expected in [(F(1,2),(65,70)),(F(3,5),(70,68))]:
   self.assertEqual((score((90,40),(w,1-w)),score((60,80),(w,1-w))),expected)
  w=F(4,7);self.assertEqual(score((90,40),(w,1-w)),score((60,80),(w,1-w)))
 def test_dominance_with_zero_weight(self):
  for i in range(11):
   w=F(i,10);difference=score((80,70),(w,1-w))-score((60,70),(w,1-w))
   self.assertEqual(difference,20*w);self.assertGreaterEqual(difference,0)
   self.assertEqual(difference==0,i==0)
  self.assertLess(score((80,70,0),(F(1,10),F(1,10),F(4,5))),score((60,70,100),(F(1,10),F(1,10),F(4,5))))
 def test_scale_compensation(self):
  original=[score(v,(F(3,5),F(2,5))) for v in [(9,4),(6,8)]]
  wrong=[score(v,(F(3,5),F(2,5))) for v in [(90,4),(60,8)]]
  adjusted=[score(v,(F(3,50),F(2,5))) for v in [(90,4),(60,8)]]
  self.assertEqual(original,[7,F(34,5)]);self.assertEqual(wrong,[F(278,5),F(196,5)]);self.assertEqual(adjusted,original)
  normalized=[score(v,(F(3,23),F(20,23))) for v in [(90,4),(60,8)]]
  self.assertEqual(normalized,[F(350,23),F(340,23)])
 def test_missing_evidence_interval(self):
  totals=[score((80,x),(F(1,2),F(1,2))) for x in [0,60,100]]
  self.assertEqual(totals,[40,70,90]);self.assertLess(totals[0],70);self.assertGreater(totals[-1],70)
if __name__=='__main__':unittest.main()
