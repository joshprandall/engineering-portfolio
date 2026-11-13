import unittest,pathlib,json,gzip,itertools
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["math-v09-scenario-analysis-independent-events","math-v09-decision-lab-conditional-probability","math-v09-misconception-clinic-independent-events","math-v09-troubleshooting-lab-conditional-probability"]
REFS=["https://online.stat.psu.edu/stat414/Lesson05.html","https://online.stat.psu.edu/stat414/Lesson04.html","https://online.stat.psu.edu/stat414/Lesson05.html","https://online.stat.psu.edu/stat414/Lesson04.html"]
def conditional(a,b):
 if not b:raise ValueError('empty conditioning set')
 return F(len(a&b),len(b))
class IndependenceSelectionBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/independence-selection-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/math/probability.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),112)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/math/probability.json').read_bytes())
  for k,url in zip(IDS,REFS):
   self.assertIn(url,' '.join(d[k]['reasoningSteps']));self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_pairwise_not_mutual(self):
  space=set(itertools.product([0,1],repeat=2));a={x for x in space if x[0]};b={x for x in space if x[1]};c={x for x in space if x[0]!=x[1]}
  for event in [a,b,c]:self.assertEqual(F(len(event),4),F(1,2))
  for x,y in itertools.combinations([a,b,c],2):self.assertEqual(F(len(x&y),4),F(1,4));self.assertEqual(F(len(x&y),4),F(len(x),4)*F(len(y),4))
  self.assertEqual(a&b&c,set());self.assertNotEqual(F(len(a&b&c),4),F(1,8))
 def test_selection(self):
  space=set(itertools.product([0,1],repeat=2));a={x for x in space if x[0]};b={x for x in space if x[1]};s=a|b
  self.assertEqual(F(len(a&b),4),F(len(a),4)*F(len(b),4));self.assertEqual(len(s),3)
  self.assertEqual(conditional(a,s),F(2,3));self.assertEqual(conditional(b,s),F(2,3));self.assertEqual(conditional(a&b,s),F(1,3))
  self.assertEqual(conditional(a,s)*conditional(b,s),F(4,9));self.assertNotEqual(conditional(a&b,s),conditional(a,s)*conditional(b,s))
  self.assertEqual(conditional(b,(space-a)&s),1);self.assertEqual(conditional(b,a&s),F(1,2))
 def test_disjoint_and_empty(self):
  space=set(range(1,7));a={1,2};b={3,4};empty=set()
  self.assertEqual(a&b,empty);self.assertEqual(F(len(a),6)*F(len(b),6),F(1,9));self.assertEqual(conditional(a,b),0)
  self.assertNotEqual(conditional(a,b),F(len(a),6));self.assertEqual(F(len(empty&a),6),F(len(empty),6)*F(len(a),6))
  with self.assertRaises(ValueError):conditional(a,empty)
 def test_replacement(self):
  labels=range(5);red={0,1,2};space=set(itertools.permutations(labels,2));a={p for p in space if p[0] in red};b={p for p in space if p[1] in red}
  self.assertEqual((len(space),len(a),len(a&b)),(20,12,6));self.assertEqual(F(len(a&b),len(space)),F(3,10))
  self.assertEqual(conditional(b,a),F(1,2));self.assertEqual(F(len(b),len(space)),F(3,5));self.assertNotEqual(F(3,10),F(3,5)**2)
  replacement=set(itertools.product(labels,repeat=2));both={p for p in replacement if p[0] in red and p[1] in red}
  self.assertEqual((len(replacement),len(both)),(25,9));self.assertEqual(F(len(both),len(replacement)),F(9,25))
if __name__=='__main__':unittest.main()
