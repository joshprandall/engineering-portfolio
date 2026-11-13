import unittest,pathlib,json,gzip
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v09-practical-lab-technical-debt-is-a-portfolio-not-a-single-number","leadership-v09-teach-back-lab-technical-debt-is-a-portfolio-not-a-single-number","leadership-v09-worked-example-technical-debt-is-a-portfolio-not-a-single-number","leadership-v10-evidence-reading-technical-debt-is-a-portfolio-not-a-single-number"]
def payback(build,avoided,maintenance):
 net=avoided-maintenance
 return F(build,net) if net>0 else None
class ToilInvestment(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/toil-investment.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/strategy.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),73)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/leadership/strategy.json').read_bytes())
  for k,words in zip(IDS,[['sixty','not a complete'],['eight weeks','not automatically'],['ten weeks','undiscounted'],['3+2-1=4','Partial reductions']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://sre.google/sre-book/eliminating-toil/',text)
   for word in words:self.assertIn(word,text)
 def test_hands_on_not_elapsed(self):
  self.assertEqual(12*5,60);self.assertEqual(12*(5+25),360);self.assertEqual(12*(5+10),180)
  self.assertEqual(F(12*5,60),1);self.assertEqual(F(12*(5+10),60),3)
 def test_net_payback(self):
  self.assertEqual(payback(24,4,1),8)
  self.assertEqual([3*t-24 for t in [6,8,12]],[-6,0,12])
  self.assertIsNone(payback(24,4,4));self.assertIsNone(payback(24,4,5))
 def test_horizon_ranking(self):
  a=lambda t:3*t-24;b=lambda t:t-4
  self.assertEqual([(a(t),b(t)) for t in [6,10,18]],[(-6,2),(6,6),(30,14)])
  self.assertLess(a(6),b(6));self.assertGreater(a(18),b(18))
  self.assertNotEqual(payback(24,4,1),10)
 def test_overlap_and_marginal_benefit(self):
  a={1,2,3};b={3,4}
  self.assertEqual(len(a|b),4);self.assertEqual(len(a&b),1)
  self.assertEqual(len(a)+len(b)-len(a&b),len(a|b));self.assertEqual(b-a,{4})
  self.assertEqual(len(a|a),len(a));self.assertEqual(len(a|{4,5}),len(a)+2)
if __name__=='__main__':unittest.main()
