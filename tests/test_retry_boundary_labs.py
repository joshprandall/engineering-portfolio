import unittest,pathlib,json,gzip,itertools,math
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v10-worked-walkthrough-overload-protection","leadership-v10-reasoning-check-overload-protection","leadership-v10-trace-lab-overload-protection","leadership-v10-transfer-challenge-overload-protection"]
URL='https://sre.google/sre-book/handling-overload/'
def attempts(responses,budget=3):
 count=0
 for response in responses[:budget]:
  count+=1
  if response in ('success','do-not-retry'):break
 return count
class RetryBoundaryLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/retry-boundary-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/capacity.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),73)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/leadership/capacity.json').read_bytes())
  for k,phrase in zip(IDS,['not a universal rule','worst-case synchronous','two explicit local','does not guarantee deadlines']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t)
 def test_attempt_ceiling(self):
  fail=['overload']*5
  self.assertEqual(attempts(fail),3);self.assertEqual(attempts(fail,4),4)
  self.assertEqual(attempts(['success']+fail),1);self.assertEqual(attempts(['overload','success']+fail),2)
  self.assertEqual(attempts(['do-not-retry']+fail),1);self.assertEqual(attempts([]),0)
  for responses in itertools.product(['overload','success','do-not-retry'],repeat=4):
   n=attempts(list(responses));self.assertTrue(1<=n<=3)
   if n>1:self.assertTrue(all(r=='overload' for r in responses[:n-1]))
 def test_nested_fanout(self):
  def leaf_count(budgets):
   if not budgets:return 1
   return sum(leaf_count(budgets[1:]) for _ in range(budgets[0]))
  self.assertEqual(leaf_count((3,3,3)),27);self.assertEqual(leaf_count((1,1,3)),3)
  self.assertEqual(leaf_count((2,3,2)),12)
  for budgets in itertools.product(range(1,4),repeat=3):self.assertEqual(leaf_count(budgets),math.prod(budgets))
 def test_denominator_policy(self):
  originals=100;budget=F(1,10)
  a=max(r for r in range(101) if F(r,originals)<=budget)
  b=max(r for r in range(101) if F(r,originals+r)<=budget)
  self.assertEqual((a,b),(10,11));self.assertGreater(F(11,100),budget);self.assertLess(F(11,111),budget);self.assertGreater(F(12,112),budget)
  self.assertEqual((F(100+a,100),F(100+b,100)),(F(11,10),F(111,100)))
  self.assertEqual(max(r for r in range(5) if 10*r<=0),0)
 def test_priority_not_latency(self):
  rows=[('A','sheddable',20),('B','critical',200),('C','critical',10)]
  rank={'critical':0,'sheddable':1}
  ordered=sorted(rows,key=lambda x:rank[x[1]])
  self.assertEqual([x[0] for x in ordered],['B','C','A'])
  self.assertEqual([x[0] for x in sorted(rows,key=lambda x:x[2])],['C','A','B'])
  inherited=['critical']
  for _ in range(3):inherited.append(inherited[-1])
  self.assertEqual(inherited,['critical']*4)
  override={'inherited':inherited[-1],'effective':'sheddable','reason':'fictional permitted override'}
  self.assertNotEqual(override['inherited'],override['effective'])
if __name__=='__main__':unittest.main()
