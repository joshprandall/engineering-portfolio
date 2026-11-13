import unittest,pathlib,json,gzip,math
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v10-worked-walkthrough-total-cost-of-ownership","leadership-v10-mistake-hunt-total-cost-of-ownership","leadership-v10-transfer-lab-total-cost-of-ownership","leadership-v10-counterexample-lab-total-cost-of-ownership"]
URL='https://openstax.org/books/principles-finance/pages/16-2-net-present-value-npv-method'
def pv(rows,r):
 return sum((F(amount)/(1+r)**year for year,amount in rows),F(0))
class DiscountedCostLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/discounted-cost-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/finance.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),66)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/leadership/finance.json').read_bytes())
  for k,phrase in zip(IDS,['no benefits were estimated','not a claim that vendors','not guaranteed cash','signed cash-flow pattern']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t)
 def test_common_date(self):
  r=F(1,10);b=[(1,110),(2,121)]
  self.assertEqual(pv([(0,180)],r),180);self.assertEqual(pv(b,r),200)
  self.assertEqual(pv(b,F(0)),231);self.assertEqual(pv(b,r)-180,20)
  self.assertEqual([pv([row],r) for row in b],[100,100])
 def test_payment_shift(self):
  original=[(1,110),(2,121)];early=[(0,110),(1,121)]
  self.assertEqual(sum(x for t,x in original),sum(x for t,x in early))
  for r in [F(0),F(1,10),F(1,5)]:
   self.assertEqual(pv(early,r),pv(original,r)*(1+r))
  self.assertEqual(pv(early,F(1,10)),220);self.assertEqual(pv(early,F(0)),231)
 def test_terminal_receipt(self):
  r=F(1,10);gross=[(0,200),(1,55),(2,F(121,2))]
  self.assertEqual(pv(gross,r),300)
  receipt=pv([(2,121)],r);self.assertEqual(receipt,100)
  self.assertEqual(pv(gross,r)-receipt,200)
  self.assertEqual(pv([(0,200),(1,55),(2,F(-121,2))],r),200)
  self.assertEqual(pv(gross,r)-receipt/2,250);self.assertEqual(pv(gross,r)-2*receipt,100)
 def test_rate_reversal(self):
  b=[(2,242)];self.assertEqual([pv(b,r) for r in [F(0),F(1,10),F(1,5)]],[242,200,F(3025,18)])
  self.assertGreater(pv(b,F(1,10)),190);self.assertLess(pv(b,F(1,5)),190)
  crossing=math.sqrt(242/190)-1;self.assertGreater(crossing,.1);self.assertLess(crossing,.2)
  self.assertAlmostEqual(242/(1+crossing)**2,190)
  self.assertGreater(242/(1+crossing-.001)**2,190);self.assertLess(242/(1+crossing+.001)**2,190)
if __name__=='__main__':unittest.main()
