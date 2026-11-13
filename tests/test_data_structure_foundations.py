"""Executable synthetic Python container contracts, not benchmarks."""
import pathlib,json,gzip,unittest,heapq
from collections import deque
from dataclasses import dataclass
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/software/data-structures.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/data-structure-foundations.json.gz').read_bytes()))
IDS=["software-queue","software-v10-boundary-condition-lab-queues-first-in-first-out","software-hash-table","software-v09-worked-example-hash-tables-fast-lookup-with-collisions","software-data-structures","software-v10-trace-lab-choosing-a-data-structure-is-choosing-tradeoffs"]
URLS=["https://docs.python.org/3/library/collections.html#collections.deque","https://docs.python.org/3/library/collections.html#collections.deque","https://docs.python.org/3/reference/datamodel.html#object.__hash__","https://docs.python.org/3/library/stdtypes.html#mapping-types-dict","https://docs.python.org/3/library/heapq.html","https://docs.python.org/3/library/heapq.html"]
@dataclass(frozen=True)
class CollisionKey:
 label:str
 def __hash__(self):return 7
class DataStructureFoundations(unittest.TestCase):
 def claim(self,i,*values):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for value in values:self.assertIn(value,text)
 def test_scope(self):
  checkpoint=json.loads(gzip.decompress((R/'tests/baselines/deque-operation-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(B),list(checkpoint));self.assertEqual(list(checkpoint),list(D));self.assertEqual(len(D),113)
  for k in IDS:self.assertEqual(D[k],checkpoint[k],k)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(checkpoint[k]) if B[k].get(f)!=checkpoint[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,url in zip(IDS,URLS):
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(D[k][f]),6);self.assertIn(url,D[k][f][-1])
 def test_fifo_and_lifo(self):
  q=deque()
  for item in ['A','B','C']:q.append(item)
  self.assertEqual([q.popleft() for _ in range(3)],['A','B','C']);self.assertEqual(list(q),[])
  with self.assertRaises(IndexError):q.popleft()
  q=deque('ABC');self.assertEqual([q.pop() for _ in range(3)],['C','B','A']);self.claim(0,'A,B,C','C,B,A','IndexError')
 def test_bounded_overflow_contracts(self):
  q=deque('ABC',maxlen=3);q.append('D');self.assertEqual(list(q),['B','C','D']);q.appendleft('X');self.assertEqual(list(q),['X','B','C'])
  before=list(q)
  with self.assertRaises(IndexError):q.insert(1,'Y')
  self.assertEqual(list(q),before);self.claim(1,'discarding A','discarding D','rather than evicting')
 def test_collisions_do_not_merge_unequal_keys(self):
  a=CollisionKey('A');b=CollisionKey('B');again=CollisionKey('A')
  self.assertEqual(hash(a),hash(b));self.assertEqual(hash(a),7);self.assertNotEqual(a,b);self.assertEqual(a,again);self.assertIsNot(a,again)
  d={a:10,b:20};self.assertEqual(len(d),2);self.assertEqual(d[again],10);self.assertEqual(d[b],20)
  d[again]=30;self.assertEqual(len(d),2);self.assertEqual(d[a],30);self.assertEqual(d[b],20);self.claim(2,'not key equality','hash is always 7')
 def test_dictionary_order(self):
  d=dict(zip(['b','a','c'],[1,2,3]));self.assertEqual(list(d),['b','a','c']);self.assertEqual(sorted(d),['a','b','c'])
  d['a']=9;self.assertEqual(list(d),['b','a','c']);self.assertEqual(d['a'],9)
  del d['a'];d['a']=10;self.assertEqual(list(d),['b','c','a']);self.assertEqual(d['a'],10);self.claim(3,'Python 3.7','not a universal property')
 def test_heap_contract_and_duplicates(self):
  values=[5,1,4,2];q=deque(values);h=values.copy();heapq.heapify(h)
  self.assertEqual([q.popleft() for _ in values],values);self.assertEqual([heapq.heappop(h) for _ in values],[1,2,4,5])
  with self.assertRaises(IndexError):heapq.heappop(h)
  valid=[1,4,2,5];self.assertNotEqual(valid,sorted(valid))
  for child in range(1,len(valid)):self.assertLessEqual(valid[(child-1)//2],valid[child])
  h=[2,1,2];heapq.heapify(h);self.assertEqual([heapq.heappop(h) for _ in range(3)],[1,2,2]);self.claim(4,'need not be sorted','secondary key')
 def test_pushpop_vs_replace(self):
  for candidate,returned_push,remaining_push,returned_replace,remaining_replace in [(2,2,[3,5,7],3,[2,5,7]),(6,3,[5,6,7],3,[5,6,7])]:
   a=[3,5,7];b=a.copy();self.assertEqual(heapq.heappushpop(a,candidate),returned_push);self.assertEqual(sorted(a),remaining_push);self.assertEqual(heapq.heapreplace(b,candidate),returned_replace);self.assertEqual(sorted(b),remaining_replace)
  empty=[];self.assertEqual(heapq.heappushpop(empty,2),2);self.assertEqual(empty,[])
  with self.assertRaises(IndexError):heapq.heapreplace(empty,2)
  self.claim(5,'agreement on one input does not establish equivalence','unspecified internal layouts')
if __name__=='__main__':unittest.main()
