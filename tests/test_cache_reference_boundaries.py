import unittest,pathlib,json,gzip
from functools import lru_cache
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-v09-evidence-verification-la-caching-faster-by-reusing-work","software-v09-decision-lab-caching-faster-by-reusing-work","software-v09-recall-drill-caching-faster-by-reusing-work","software-v09-quick-reference-caching-faster-by-reusing-work"]
class CacheBoundaries(unittest.TestCase):
 def test_scope(self):
  before=json.loads(gzip.decompress((R/'tests/baselines/cache-reference-boundaries.json.gz').read_bytes()));after=json.loads((R/'deep-learning/software/architecture.json').read_bytes())
  self.assertEqual(list(before),list(after));self.assertEqual(len(after),111)
  for key in before:
   changed={f for f in set(before[key])|set(after[key]) if before[key].get(f)!=after[key].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if key in IDS else set(),key)
 def test_sources(self):
  data=json.loads((R/'deep-learning/software/architecture.json').read_bytes())
  for key in IDS:
   self.assertIn('https://docs.python.org/3.13/library/functools.html',' '.join(data[key]['reasoningSteps']))
   self.assertFalse(data[key]['essentialQuestion'].startswith('What does '))
 def test_recency(self):
  calls=[]
  @lru_cache(maxsize=2)
  def square(n):calls.append(n);return n*n
  self.assertEqual([square(n) for n in [1,2,1,3,2]],[1,4,1,9,4])
  self.assertEqual(calls,[1,2,3,2]);self.assertEqual(tuple(square.cache_info()),(1,4,2,2))
 def test_aliasing(self):
  calls=[]
  @lru_cache(maxsize=2)
  def unsafe(n):calls.append(n);return [n]
  first=unsafe(7);first.append(99);second=unsafe(7)
  self.assertIs(first,second);self.assertEqual(second,[7,99]);self.assertEqual(calls,[7])
  @lru_cache(maxsize=2)
  def immutable(n):return (n,)
  a=list(immutable(7));a.append(99);b=list(immutable(7))
  self.assertIsNot(a,b);self.assertEqual(a,[7,99]);self.assertEqual(b,[7]);self.assertEqual(immutable(7),(7,))
 def test_invalidation(self):
  source={'item':10};calls=[]
  @lru_cache(maxsize=2)
  def lookup(k):calls.append(k);return source[k]
  self.assertEqual(lookup('item'),10);source['item']=20;self.assertEqual(lookup('item'),10)
  self.assertEqual(tuple(lookup.cache_info()),(1,1,2,1));lookup.cache_clear()
  self.assertEqual(tuple(lookup.cache_info()),(0,0,2,0));self.assertEqual(lookup('item'),20)
  self.assertEqual(calls,['item','item']);self.assertEqual(tuple(lookup.cache_info()),(0,1,2,1))
 def test_hashable_boundary(self):
  calls=[]
  @lru_cache(maxsize=2)
  def total(xs):calls.append(xs);return sum(xs)
  with self.assertRaises(TypeError):total([1,2])
  self.assertEqual(calls,[])
  self.assertEqual(total((1,2)),3);self.assertEqual(total((1,2)),3)
  self.assertEqual(tuple(total.cache_info()),(1,1,2,1))
  with self.assertRaises(TypeError):total(([1,2],))
  self.assertEqual(calls,[(1,2)])
if __name__=='__main__':unittest.main()
