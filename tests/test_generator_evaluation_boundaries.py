import unittest,pathlib,json,gzip
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-v09-failure-analysis-lab-python-generator-expressions","software-v09-troubleshooting-lab-python-generator-expressions","software-v10-transfer-challenge-python-generator-expressions","software-v10-retrieval-ladder-python-generator-expressions"]
class GeneratorEvaluationBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/generator-evaluation-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/programming.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),158)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/software/programming.json').read_bytes())
  for k in IDS:
   self.assertIn('https://docs.python.org/3.13/reference/expressions.html',' '.join(d[k]['reasoningSteps']))
   self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_evaluation_order(self):
  events=[]
  def source():events.append('source');return [1,2]
  def mark(x):events.append(('mark',x));return x*10
  g=(mark(x) for x in source())
  self.assertEqual(events,['source']);self.assertEqual(next(g),10);self.assertEqual(events,['source',('mark',1)])
  self.assertEqual(list(g),[20]);self.assertEqual(events,['source',('mark',1),('mark',2)])
 def test_exception_timing(self):
  with self.assertRaises(TypeError):g=(x for x in None)
  g=(10//x for x in [2,0]);self.assertEqual(next(g),5)
  with self.assertRaises(ZeroDivisionError):next(g)
  for _ in range(2):
   with self.assertRaises(StopIteration):next(g)
 def test_rebinding_versus_mutation(self):
  source=[1,2];g=(x for x in source);source=[9]
  self.assertEqual(source,[9]);self.assertEqual(list(g),[1,2])
  original=[1,2];g=(x for x in original);original[0]=7
  self.assertEqual(list(g),[7,2])
 def test_late_binding(self):
  def before():
   factor=2;g=(factor*x for x in [1,2]);factor=3;return list(g)
  def during():
   factor=2;g=(factor*x for x in [1,2]);first=next(g);factor=4;return first,next(g)
  self.assertEqual(before(),[3,6]);self.assertEqual(during(),(2,8))
if __name__=='__main__':unittest.main()
