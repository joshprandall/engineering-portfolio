import unittest,pathlib,json,gzip,queue
from dataclasses import dataclass,field
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-v09-recall-drill-queues-decouple-producers-from-consumers","software-v09-quick-reference-queues-decouple-producers-from-consumers","software-v09-evidence-verification-la-queues-decouple-producers-from-consumers","software-v09-decision-lab-queues-decouple-producers-from-consumers"]
@dataclass(order=True)
class Entry:
 priority:int
 sequence:int
 payload:object=field(compare=False)
class QueueBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/queue-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/architecture.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),111)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/software/architecture.json').read_bytes())
  for k,words in zip(IDS,[['not a claim','not durable'],['reservation','sequential interleaving'],['Capacity describes','not proof'],['compare=False','application choice']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://docs.python.org/3.13/library/queue.html',text)
   for word in words:self.assertIn(word,text)
 def test_retrieval_not_completion(self):
  for cls,expected in [(queue.Queue,list('ABC')),(queue.LifoQueue,list('CBA'))]:
   q=cls()
   for label in 'ABC':q.put_nowait(label)
   self.assertEqual([q.get_nowait() for _ in range(3)],expected)
   for _ in range(3):q.task_done()
  q=queue.Queue()
  for x in 'AB':q.put_nowait(x)
  a,b=q.get_nowait(),q.get_nowait()
  completed=[b,a];self.assertEqual((a,b),('A','B'));self.assertEqual(completed,['B','A'])
  q.task_done();q.task_done()
 def test_stale_observations(self):
  q=queue.Queue(maxsize=1);self.assertFalse(q.full());q.put_nowait('B')
  with self.assertRaises(queue.Full):q.put_nowait('A')
  self.assertFalse(q.empty());self.assertEqual(q.get_nowait(),'B')
  with self.assertRaises(queue.Empty):q.get_nowait()
  q.task_done()
 def test_capacity_separate_from_acknowledgment(self):
  q=queue.Queue(maxsize=1);q.put_nowait('A');self.assertEqual(q.get_nowait(),'A')
  q.put_nowait('B');self.assertEqual(q.get_nowait(),'B')
  q.task_done();q.task_done()
  with self.assertRaises(ValueError):q.task_done()
 def test_priority_with_explicit_tie_breaker(self):
  q=queue.PriorityQueue()
  for p,s in [(2,0),(1,1),(1,2)]:q.put_nowait(Entry(p,s,{'label':str(s)}))
  got=[q.get_nowait() for _ in range(3)]
  self.assertEqual([(x.priority,x.sequence) for x in got],[(1,1),(1,2),(2,0)])
  self.assertEqual([x.payload for x in got],[{'label':'1'},{'label':'2'},{'label':'0'}])
  for _ in got:q.task_done()
if __name__=='__main__':unittest.main()
