"""CPU-only CUDA geometry models; no device/runtime performance claims."""
import pathlib,json,gzip,unittest
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/advanced/gpu.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/cuda-indexing-boundaries.json.gz').read_bytes()))
IDS=["advanced-v09-worked-example-cuda-grids-and-blocks","advanced-v09-design-review-cuda-grids-and-blocks","advanced-v09-worked-example-cuda-memory-coalescing","advanced-v09-failure-analysis-lab-cuda-warp-execution"]
REFS=["https://docs.nvidia.com/cuda/archive/12.6.0/cuda-c-programming-guide/index.html","https://docs.nvidia.com/cuda/archive/12.6.0/cuda-c-programming-guide/index.html","https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html","https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html"]
class CudaBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  C=json.loads(gzip.decompress((R/'tests/baselines/coalescing-sets.json.gz').read_bytes()))
  self.assertEqual(list(D),list(B));self.assertEqual(list(D),list(C));self.assertEqual(len(D),92)
  for k in IDS:self.assertEqual(D[k],C[k],k)
  for k in B:
   self.assertEqual(sorted(f for f in set(B[k])|set(C[k]) if B[k].get(f)!=C[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_grid_coverage(self):
  def indices(n,block):
   if n<0 or block<=0:raise ValueError('invalid dimensions')
   blocks=(n+block-1)//block
   launched=[b*block+t for b in range(blocks) for t in range(block)]
   return blocks,launched,[i for i in launched if i<n]
  for n in [0,1,255,256,257,1000,1024,1025]:
   blocks,launched,valid=indices(n,256)
   self.assertEqual(valid,list(range(n)));self.assertEqual(len(valid),len(set(valid)))
   self.assertEqual(blocks,len(launched)//256)
  blocks,launched,valid=indices(1000,256);self.assertEqual((blocks,len(launched),len(valid)),(4,1024,1000))
  self.assertEqual(len(launched)-len(valid),24);self.assertEqual(1000-(1000//256)*256,232)
  self.assertEqual(indices(1025,256)[0],5)
  for n,block in [(-1,256),(10,0),(10,-1)]:
   with self.assertRaises(ValueError):indices(n,block)
  self.claim(0,'excludes 24','missing 232','N=0','avoid overflow')
 def test_two_dimensional_thread_order(self):
  entries=[(x,y,x+16*y) for y in range(4) for x in range(16)]
  self.assertEqual([tid for x,y,tid in entries],list(range(64)))
  warps={w:{(x,y) for x,y,tid in entries if tid//32==w} for w in [0,1]}
  self.assertEqual(warps[0],{(x,y) for x in range(16) for y in [0,1]})
  self.assertEqual(warps[1],{(x,y) for x in range(16) for y in [2,3]})
  for x,y,tid in entries:self.assertEqual((tid%16,tid//16),(x,y))
  wrong={(x,y) for y in range(4) for x in range(16) if (y+4*x)//32==0}
  self.assertNotEqual(wrong,warps[0])
  self.claim(1,'x varying fastest','row y=1','not global array addresses')
 def test_transaction_segment_counts(self):
  def footprint(offset,stride):
   useful={offset+stride*lane+byte for lane in range(32) for byte in range(4)}
   segments={address//32 for address in useful}
   return useful,segments
  for offset,stride,count,utilization in [(0,4,4,F(1)),(4,4,5,F(4,5)),(0,32,32,F(1,8))]:
   useful,segments=footprint(offset,stride);self.assertEqual(len(useful),128)
   self.assertEqual(len(segments),count);self.assertEqual(F(len(useful),32*len(segments)),utilization)
  self.assertEqual(footprint(0,4)[1],{0,1,2,3})
  self.assertEqual(footprint(4,4)[1],{0,1,2,3,4})
  self.claim(2,'compute-capability-6.0-or-higher','four 32-byte segments','five segments','not a measured kernel speed ratio')
 def test_warp_local_predicates(self):
  def counts(predicate):
   return [(sum(predicate(t) for t in range(base,base+32)),sum(not predicate(t) for t in range(base,base+32))) for base in [0,32]]
  aligned=counts(lambda tid:tid<32);mixed=counts(lambda tid:tid%2==0);uniform=counts(lambda tid:True)
  self.assertEqual(aligned,[(32,0),(0,32)]);self.assertEqual(mixed,[(16,16),(16,16)]);self.assertEqual(uniform,[(32,0),(32,0)])
  mixed_count=lambda rows:sum(a>0 and b>0 for a,b in rows)
  self.assertEqual(mixed_count(aligned),0);self.assertEqual(mixed_count(mixed),2);self.assertEqual(mixed_count(uniform),0)
  self.claim(3,'within a warp','16 true and 16 false','does not establish exact timing','synchronization correctness')
if __name__=='__main__':unittest.main()
