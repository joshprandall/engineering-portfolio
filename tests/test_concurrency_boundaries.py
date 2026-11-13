import unittest,pathlib,json,gzip,itertools,collections
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["advanced-race-condition","advanced-v05-critical-sections","advanced-v05-locks","advanced-v05-reductions"]
def schedules():
 return [p for p in itertools.permutations(['Ar','Aw','Br','Bw']) if p.index('Ar')<p.index('Aw') and p.index('Br')<p.index('Bw')]
def run(events):
 x=0;saved={}
 for worker,op in events:
  if op=='r':saved[worker]=x
  else:x=saved[worker]+1
 return x
def reduction(values,groups):
 indices=[i for g in groups for i in g]
 if sorted(indices)!=list(range(len(values))):raise ValueError('partition must cover each index exactly once')
 return sum(sum(values[i] for i in g) for g in groups)
class ConcurrencyBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/concurrency-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/advanced/parallel-computing.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),129)
  for k in b:
   changed={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/advanced/parallel-computing.json').read_bytes())
  for k in IDS:
   self.assertIn('https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial',' '.join(d[k]['reasoningSteps']))
   self.assertNotIn('mean, why does it matter',d[k]['essentialQuestion'])
  for k,words in zip(IDS,[['six','four','undefined'],['separately','fairness'],['circular wait','starvation'],['36','32','40','Floating-point']]):
   for word in words:self.assertIn(word,' '.join(d[k]['reasoningSteps']))
 def test_lost_update(self):
  s=schedules();self.assertEqual(len(s),6)
  self.assertEqual(collections.Counter(map(run,s)),{1:4,2:2})
  self.assertEqual(run(['Ar','Br','Aw','Bw']),1)
 def test_critical_section_boundary(self):
  serial=[['Ar','Aw','Br','Bw'],['Br','Bw','Ar','Aw']]
  self.assertEqual([run(p) for p in serial],[2,2])
  # Every primitive can hold the same lock independently, yet this order is legal.
  split=['Ar','Br','Aw','Bw'];self.assertIn(tuple(split),schedules());self.assertEqual(run(split),1)
 def test_lock_order(self):
  owner={'X':'A','Y':'B'};requested={'A':'Y','B':'X'}
  waits={w:owner[lock] for w,lock in requested.items()}
  self.assertEqual(waits,{'A':'B','B':'A'})
  for first,second in [('A','B'),('B','A')]:
   owner={'X':first};self.assertNotIn('Y',owner)
   self.assertEqual(owner['X'],first)
   owner['Y']=first
   self.assertEqual(set(owner.values()),{first})
   owner.clear();owner['X']=second;owner['Y']=second
   self.assertEqual(set(owner.values()),{second})
 def test_partitioned_integer_reduction(self):
  v=list(range(1,9));groups=[list(range(4)),list(range(4,8))]
  self.assertEqual([sum(v[i] for i in g) for g in groups],[10,26])
  self.assertEqual(reduction(v,groups),36)
  self.assertEqual(reduction([],[]),0);self.assertEqual(reduction(v,[list(range(8))]),36)
  for bad,total in [([list(range(3)),list(range(4,8))],32),([list(range(4)),list(range(3,8))],40)]:
   self.assertEqual(sum(sum(v[i] for i in g) for g in bad),total)
   with self.assertRaises(ValueError):reduction(v,bad)
if __name__=='__main__':unittest.main()
