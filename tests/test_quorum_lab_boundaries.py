import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["advanced-v06-lab-explore-quorum-size","advanced-v09-teach-back-lab-explore-quorum-size","advanced-v09-misconception-clinic-explore-quorum-size","advanced-v09-teach-back-lab-explore-quorum-size-2"]
def quorum(n):
 if not isinstance(n,int) or n<1:raise ValueError('positive membership')
 return n//2+1
def eligible(groups,members):
 flat=[x for g in groups for x in g]
 if len(flat)!=len(set(flat)) or set(flat)!=set(members):raise ValueError('not a partition')
 return [set(g) for g in groups if len(g)>=quorum(len(members))]
class QuorumLabBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/quorum-lab-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/advanced/lab.json').read_bytes())
  c=json.loads(gzip.decompress((R/'tests/baselines/mpi-receive-labs.json.gz').read_bytes()))
  self.assertEqual(list(b),list(d));self.assertEqual(list(c),list(d));self.assertEqual(len(d),90)
  for k in IDS:self.assertEqual(d[k],c[k],k)
  for k in b:
   changed={f for f in set(b[k])|set(c[k]) if b[k].get(f)!=c[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/advanced/lab.json').read_bytes())
  for k in IDS:self.assertIn('https://etcd.io/docs/v3.6/faq/',' '.join(d[k]['reasoningSteps']))
  self.assertIn('2,2,1',' '.join(d[IDS[2]]['reasoningSteps']))
 def test_majority_intersection(self):
  groups=[set(x) for x in itertools.combinations('ABCDE',3)];self.assertEqual(len(groups),10)
  intersections=[len(a&b) for a,b in itertools.combinations(groups,2)]
  self.assertEqual(len(intersections),45);self.assertEqual(min(intersections),1);self.assertTrue(all(intersections))
  self.assertFalse(set('AB')&set('CD'))
 def test_size_and_tolerance(self):
  self.assertEqual([(n,quorum(n),n-quorum(n)) for n in range(1,10)],[(1,1,0),(2,2,0),(3,2,1),(4,3,1),(5,3,2),(6,4,2),(7,4,3),(8,5,3),(9,5,4)])
  for n in [3,5,7]:self.assertEqual(n-quorum(n),n+1-quorum(n+1))
  with self.assertRaises(ValueError):quorum(0)
 def test_partition_boundaries(self):
  self.assertEqual(eligible(['ABC','DE'],'ABCDE'),[set('ABC')])
  self.assertEqual(eligible(['AB','CD','E'],'ABCDE'),[])
  for groups in [['ABC','CD','E'],['AB','CD']]:
   with self.assertRaises(ValueError):eligible(groups,'ABCDE')
 def test_site_loss(self):
  for sites,want in [([set('ABC'),set('DE')],[2,3]),([set('AB'),set('CD'),set('E')],[3,3,4])]:
   self.assertEqual(set().union(*sites),set('ABCDE'));self.assertEqual(sum(map(len,sites)),5)
   survivors=[len(set('ABCDE')-site) for site in sites];self.assertEqual(survivors,want)
   self.assertEqual([x>=quorum(5) for x in survivors],[x>=3 for x in want])
if __name__=='__main__':unittest.main()
