import unittest,pathlib,json,gzip
from graphlib import TopologicalSorter as TS,CycleError
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-v09-scenario-analysis-graphs-modeling-relationships-instead-of-rows-2","software-v09-design-review-graphs-modeling-relationships-instead-of-rows-3","software-v09-troubleshooting-la-graphs-modeling-relationships-instead-of-rows-3","software-v09-failure-analysis-l-graphs-modeling-relationships-instead-of-rows-3"]
G={'A':set(),'B':{'A'},'C':{'A'},'D':{'B','C'}}
class TopologyProtocolBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/topology-protocol-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/algorithms.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),111)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/software/algorithms.json').read_bytes())
  for k in IDS:
   self.assertIn('https://docs.python.org/3.13/library/graphlib.html',' '.join(d[k]['reasoningSteps']));self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_predecessors(self):
  order=tuple(TS(G).static_order());self.assertEqual(len(order),4);self.assertEqual(set(order),set(G));pos={n:i for i,n in enumerate(order)}
  for n,preds in G.items():
   for p in preds:self.assertLess(pos[p],pos[n])
  self.assertIn(order,[('A','B','C','D'),('A','C','B','D')])
 def test_ready_is_not_done(self):
  t=TS(G);t.prepare();self.assertEqual(t.get_ready(),('A',));self.assertEqual(t.get_ready(),());self.assertTrue(t.is_active())
  t.done('A');self.assertEqual(set(t.get_ready()),{'B','C'});t.done('B');self.assertEqual(t.get_ready(),());self.assertTrue(t.is_active())
  t.done('C');self.assertEqual(t.get_ready(),('D',));t.done('D');self.assertEqual(t.get_ready(),());self.assertFalse(t.is_active())
 def test_invalid_transitions(self):
  t=TS({'A':set(),'B':{'A'}})
  with self.assertRaises(ValueError):t.get_ready()
  t.prepare()
  for node in ['A','B','unknown']:
   with self.assertRaises(ValueError):t.done(node)
  self.assertEqual(t.get_ready(),('A',));t.done('A')
  with self.assertRaises(ValueError):t.done('A')
  self.assertEqual(t.get_ready(),('B',));t.done('B');self.assertFalse(t.is_active())
 def test_cycle_and_partial_progress(self):
  g={'A':{'B'},'B':{'A'},'X':set(),'Y':{'X'}};t=TS(g)
  with self.assertRaises(CycleError):t.prepare()
  finished=[]
  for expected in ['X','Y']:
   self.assertEqual(t.get_ready(),(expected,));finished.append(expected);t.done(expected)
  self.assertEqual(t.get_ready(),());self.assertFalse(t.is_active());self.assertEqual(set(g)-set(finished),{'A','B'})
if __name__=='__main__':unittest.main()
