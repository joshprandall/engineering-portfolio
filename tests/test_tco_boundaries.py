import unittest,pathlib,json,gzip
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v09-failure-analysis-lab-total-cost-of-ownership","leadership-v09-design-review-total-cost-of-ownership","leadership-v09-failure-analysis-l-total-cost-of-ownership-2","leadership-v09-design-review-total-cost-of-ownership-2"]
def reconcile(rows):
 amounts={}
 for key,value in rows:
  if key in amounts and amounts[key]!=value:raise ValueError('conflicting cost item')
  amounts[key]=value
 return sum(amounts.values())
class TcoBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/tco-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/finance.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),66)
  for key in b:
   changed={f for f in set(b[key])|set(d[key]) if b[key].get(f)!=d[key].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if key in IDS else set(),key)
 def test_source_and_claims(self):
  d=json.loads((R/'deep-learning/leadership/finance.json').read_bytes())
  for key,words in zip(IDS,[['30,000','27,000','42,000','45,000','bounded-horizon'],['3,000','16,000','one-year'],['23,000','35,000','same identity'],['3,000','31,000','not automatically an expected']]):
   text=' '.join(d[key]['reasoningSteps'])
   self.assertIn('https://gaoinnovations.gov/cost-guide/types-of-cost-estimates.html',text)
   for word in words:self.assertIn(word,text)
 def test_horizon_crossover(self):
  a=lambda y:12000+6000*y;b=lambda y:9000*y
  self.assertEqual((a(3),b(3),a(5),b(5)),(30000,27000,42000,45000))
  self.assertEqual((a(4),b(4)),(36000,36000))
  for y in range(1,7):self.assertEqual((a(y)>b(y))-(a(y)<b(y)),(4>y)-(4<y))
 def test_workload_crossover(self):
  a=lambda q:10000+2*q;b=lambda q:1000+5*q
  self.assertEqual((a(1000),b(1000),a(5000),b(5000)),(12000,6000,20000,26000))
  self.assertEqual((a(3000),b(3000)),(16000,16000))
  self.assertGreater(a(2999),b(2999));self.assertLess(a(3001),b(3001))
  self.assertEqual((a(0),b(0)),(10000,1000))
 def test_cost_evidence_identity(self):
  rows=[('acquisition',12000),('support-year1',3000),('support-year2',3000),('support-year3',3000),('migration',2000)]
  self.assertEqual(reconcile(rows),23000)
  duplicate=rows+[('acquisition',12000)]
  self.assertEqual(sum(v for k,v in duplicate),35000);self.assertEqual(reconcile(duplicate),23000)
  self.assertEqual(reconcile([('support-year1',3000),('support-year2',3000)]),6000)
  with self.assertRaises(ValueError):reconcile(rows+[('acquisition',13000)])
 def test_transition_range(self):
  self.assertEqual((27000+0,27000+8000),(27000,35000))
  for t in [0,2999,3000,3001,8000]:
   self.assertEqual((27000+t>30000)-(27000+t<30000),(t>3000)-(t<3000))
  self.assertEqual(27000+(0+8000)//2,31000)
if __name__=='__main__':unittest.main()
