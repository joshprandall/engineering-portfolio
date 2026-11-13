import unittest,pathlib,json,gzip
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["advanced-cache-associativity","advanced-v05-spatial-locality","advanced-v05-temporal-locality","advanced-cache-latency"]
def trace(blocks,sets,ways,policy='LRU'):
 if sets<1 or ways<1 or policy not in ['LRU','FIFO']:raise ValueError('invalid cache model')
 cache=[[] for _ in range(sets)];hits=[]
 for block in blocks:
  if not isinstance(block,int) or block<0:raise ValueError('nonnegative integer blocks')
  row=cache[block%sets];hit=block in row;hits.append(hit)
  if hit:
   if policy=='LRU':row.remove(block);row.append(block)
  else:
   if len(row)==ways:row.pop(0)
   row.append(block)
 return hits
class CacheBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/cache-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/advanced/memory.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),136)
  for k in b:
   changed={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_claims(self):
  d=json.loads((R/'deep-learning/advanced/memory.json').read_bytes())
  for k,words in zip(IDS,[['modulo 4','modulo 2','fixed capacity'],['two misses and six hits','eight misses','not the same'],['two hits','one hit','insertion'],['2.4 ns','1.5 ns','960 ns','conditional']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://www.cs.cornell.edu/courses/cs3410/2026sp/notes/caches.html',text)
   for word in words:self.assertIn(word,text)
 def test_conflict_at_fixed_capacity(self):
  self.assertEqual(trace([0,4,0,4],4,1),[False]*4)
  self.assertEqual(trace([0,4,0,4],2,2),[False,False,True,True])
  self.assertEqual(trace([0,1,0,1],4,1),[False,False,True,True])
  for sets,ways in [(0,1),(1,0)]:
   with self.assertRaises(ValueError):trace([],sets,ways)
 def test_spatial_trace(self):
  contiguous=[a//16 for a in range(0,32,4)];stride=[a//16 for a in range(0,128,16)]
  self.assertEqual(contiguous,[0,0,0,0,1,1,1,1]);self.assertEqual(len(set(stride)),8)
  self.assertEqual(trace(contiguous,4,1),[False,True,True,True]*2)
  self.assertEqual(trace(stride,4,1),[False]*8)
  self.assertEqual(sum(trace(contiguous*2,4,1)),14)
 def test_replacement_policy(self):
  blocks=[0,1,0,2,0]
  self.assertEqual(trace(blocks,1,2,'LRU'),[False,False,True,False,True])
  self.assertEqual(trace(blocks,1,2,'FIFO'),[False,False,True,False,False])
  for policy in ['LRU','FIFO']:self.assertEqual(trace([0,1,2,0],1,2,policy),[False]*4)
 def test_conditional_average_time(self):
  m1=F(1,10);m2=F(1,4);nested=1+m1*(4+m2*40)
  self.assertEqual(nested,F(12,5));self.assertEqual(m1*m2,F(1,40))
  self.assertEqual(1+m1*(4+m1*m2*40),F(3,2))
  counts=[360,30,10];costs=[1,5,45]
  self.assertEqual(sum(counts),400);self.assertEqual(sum(n*t for n,t in zip(counts,costs)),960)
  self.assertEqual(F(960,400),nested);self.assertEqual(1+0*(4+m2*40),1)
if __name__=='__main__':unittest.main()
