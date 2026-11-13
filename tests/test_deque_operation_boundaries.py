import unittest,pathlib,json,gzip
from collections import deque
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-v09-worked-example-queues-first-in-first-out","software-v09-teach-back-lab-queues-first-in-first-out","software-v09-practical-lab-queues-first-in-first-out","software-v09-misconception-clinic-queues-first-in-first-out"]
class DequeOperationBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/deque-operation-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/data-structures.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),113)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/software/data-structures.json').read_bytes())
  for k in IDS:
   self.assertIn('https://docs.python.org/3.13/library/collections.html',' '.join(d[k]['reasoningSteps']));self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_extendleft_order(self):
  a=deque(['C']);a.extendleft(['A','B']);self.assertEqual(list(a),['B','A','C']);self.assertEqual([a.popleft() for _ in range(3)],['B','A','C'])
  b=deque(['C']);b.extendleft(reversed(['A','B']));self.assertEqual(list(b),['A','B','C'])
 def test_insert_capacity(self):
  a=deque(['A','B'],maxlen=2);a.append('C');self.assertEqual(list(a),['B','C']);self.assertEqual(a.maxlen,2)
  b=deque(['A','B'],maxlen=2)
  with self.assertRaises(IndexError):b.insert(1,'C')
  self.assertEqual(list(b),['A','B']);self.assertEqual(b.maxlen,2)
  c=deque(['A','B'],maxlen=3);c.insert(1,'C');self.assertEqual(list(c),['A','C','B']);self.assertEqual(c.maxlen,3)
 def test_rotation(self):
  original=list('ABCD');a=deque(original);a.rotate(1);self.assertEqual(list(a),list('DABC'))
  b=deque(original);b.rotate(-1);self.assertEqual(list(b),list('BCDA'))
  c=deque(original);c.reverse();self.assertEqual(list(c),list('DCBA'));self.assertNotEqual(a,c)
  for k in [-9,-4,-1,0,1,4,9]:
   d=deque(original);d.rotate(k);self.assertEqual(len(d),4);d.rotate(-k);self.assertEqual(list(d),original)
  d=deque(original);d.rotate(len(d));self.assertEqual(list(d),original)
  empty=deque();empty.rotate(7);self.assertEqual(list(empty),[])
 def test_shallow_copy(self):
  payload=[1];original=deque([payload]);clone=original.copy()
  self.assertIsNot(original,clone);self.assertIs(original[0],clone[0]);clone.append([2])
  self.assertEqual((len(original),len(clone)),(1,2));payload.append(9)
  self.assertEqual(list(original),[[1,9]]);self.assertEqual(list(clone),[[1,9],[2]])
if __name__=='__main__':unittest.main()
