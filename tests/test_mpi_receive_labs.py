import unittest,pathlib,json,gzip
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["advanced-v06-lab-match-mpi-messages-by-tag","advanced-v09-troubleshooting-lab-match-mpi-messages-by-tag","advanced-v09-scenario-analysis-match-mpi-messages-by-tag","advanced-v10-evidence-reading-match-mpi-messages-by-tag"]
ANY=object()
def matches(m,destination,comm,source,tag):
 return m['destination']==destination and m['comm']==comm and (source is ANY or m['source']==source) and (tag is ANY or m['tag']==tag)
def copy_payload(buf,payload):
 if len(payload)>len(buf):raise ValueError('local preflight capacity exceeded')
 result=list(buf);result[:len(payload)]=payload;return result,len(payload)
class MpiReceiveLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/mpi-receive-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/advanced/lab.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),90)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/advanced/lab.json').read_bytes())
  for k,w in zip(IDS,['CPU-only','not a scheduling','matching basic','not a guarantee']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn('https://docs.open-mpi.org/en/main/man-openmpi/man3/MPI_Recv.3.html',t);self.assertIn(w,t)
 def test_exact_envelope(self):
  m={'destination':2,'comm':'A','source':0,'tag':7};self.assertTrue(matches(m,2,'A',0,7))
  for k,v in [('destination',3),('comm','B'),('source',1),('tag',8)]:
   self.assertFalse(matches({**m,k:v},2,'A',0,7))
 def test_wildcard_sets(self):
  rows=[{'id':name,'destination':dest,'comm':comm,'source':src,'tag':tag} for name,dest,comm,src,tag in [('a',2,'A',0,7),('b',2,'A',1,7),('c',2,'A',0,8),('d',2,'B',0,7),('e',3,'A',0,7)]]
  for src,tag,ids in [(0,7,{'a'}),(ANY,7,{'a','b'}),(0,ANY,{'a','c'}),(ANY,ANY,{'a','b','c'})]:
   self.assertEqual({m['id'] for m in rows if matches(m,2,'A',src,tag)},ids)
 def test_short_receive_suffix(self):
  for data in [[],[1,2],[1,2,3,4]]:
   original=[9]*4;result,n=copy_payload(original,data)
   self.assertEqual(n,len(data));self.assertEqual(result,data+[9]*(4-len(data)));self.assertEqual(original,[9]*4)
  self.assertEqual(copy_payload([9]*4,[1,2]),([1,2,9,9],2))
 def test_capacity_separate_from_match(self):
  m={'destination':2,'comm':'A','source':0,'tag':7};self.assertTrue(matches(m,2,'A',0,7))
  buf=[9]*4
  for n in [3,4]:self.assertEqual(copy_payload(buf,list(range(n)))[1],n)
  with self.assertRaises(ValueError):copy_payload(buf,list(range(5)))
  self.assertEqual(buf,[9]*4)
if __name__=='__main__':unittest.main()
