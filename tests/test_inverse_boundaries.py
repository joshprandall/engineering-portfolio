import unittest,pathlib,json,gzip,itertools,collections
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["math-v09-teach-back-lab-functions-inputs-rules-outputs-2","math-v09-troubleshooting-la-functions-inputs-rules-outputs-2","math-v09-quick-reference-functions-inputs-rules-outputs-2","math-v09-misconception-clin-functions-inputs-rules-outputs-2"]
def left(f,g):return all(g[f[x]]==x for x in range(len(f)))
def right(f,g):return all(f[g[y]]==y for y in range(len(g)))
class InverseBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/inverse-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/math/functions.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),98)
  for k in b:
   changed={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_claims(self):
  d=json.loads((R/'deep-learning/math/functions.json').read_bytes())
  for k,words in zip(IDS,[['left inverse','not 2','blanket shortcut'],['right inverse','collision'],['27','6','exactly one'],['g(3)=9','sampled','universal']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://openstax.org/books/precalculus-2e/pages/1-7-inverse-functions',text)
   for word in words:self.assertIn(word,text)
 def test_left_not_right(self):
  f=(0,1)
  candidates=list(itertools.product(range(2),repeat=3))
  solutions=[g for g in candidates if left(f,g)]
  self.assertEqual(solutions,[(0,1,0),(0,1,1)])
  for g in solutions:
   self.assertFalse(right(f,g));self.assertNotEqual(f[g[2]],2)
 def test_right_not_left(self):
  f=(0,1,1);candidates=list(itertools.product(range(3),repeat=2))
  solutions=[g for g in candidates if right(f,g)]
  self.assertEqual(solutions,[(0,1),(0,2)])
  for g in solutions:
   self.assertFalse(left(f,g));self.assertEqual(sum(g[f[x]]!=x for x in range(3)),1)
 def test_all_three_element_maps(self):
  maps=list(itertools.product(range(3),repeat=3));self.assertEqual(len(maps),27)
  inverse_counts=[sum(left(f,g) and right(f,g) for g in maps) for f in maps]
  self.assertEqual(collections.Counter(inverse_counts),{0:21,1:6})
  for f,n in zip(maps,inverse_counts):self.assertEqual(n==1,len(set(f))==3)
  self.assertTrue(left((1,2,0),(2,0,1)));self.assertTrue(right((1,2,0),(2,0,1)))
  self.assertTrue(left((0,1,2),(0,1,2)))
 def test_sampled_not_universal(self):
  f=lambda x:x;g=lambda x:x+x*(x-1)*(x-2)
  for x in [0,1,2]:self.assertEqual(g(f(x)),x);self.assertEqual(f(g(x)),x)
  self.assertEqual(g(f(3)),9);self.assertEqual(f(g(3)),9);self.assertNotEqual(g(3),3)
if __name__=='__main__':unittest.main()
