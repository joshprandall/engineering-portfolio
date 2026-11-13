import unittest,pathlib,json,gzip
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["advanced-v06-cuda-memory-coalescing","advanced-v09-design-review-cuda-memory-coalescing","advanced-v09-evidence-verification-la-cuda-memory-coalescing","advanced-v10-measurement-lab-cuda-memory-coalescing"]
def footprint(addresses):
 b={a+i for a in addresses for i in range(4)}
 s={a//32 for a in b}
 return b,s,None if not s else F(len(b),32*len(s))
class CoalescingSets(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/coalescing-sets.json.gz').read_bytes()));d=json.loads((R/'deep-learning/advanced/gpu.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),92)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/advanced/gpu.json').read_bytes())
  for k,w in zip(IDS,['6.0','undefined','read-only','not a guarantee']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn('https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html',t);self.assertIn(w,t)
 def test_permutation(self):
  expected=footprint([4*i for i in range(32)])
  for words in [list(reversed(range(32))),[(5*i)%32 for i in range(32)]]:
   self.assertEqual(sorted(words),list(range(32)));self.assertEqual(footprint([4*i for i in words]),expected)
  self.assertEqual(expected[1],{0,1,2,3});self.assertEqual(expected[2],1)
 def test_active_masks(self):
  a=list(range(8));b=list(range(0,32,4));self.assertEqual(len(a),len(b))
  x=footprint([4*i for i in a]);y=footprint([4*i for i in b])
  self.assertEqual(len(x[0]),32);self.assertEqual(len(y[0]),32)
  self.assertEqual(x[1],{0});self.assertEqual(y[1],{0,1,2,3})
  self.assertEqual((x[2],y[2]),(1,F(1,4)));self.assertIsNone(footprint([])[2])
 def test_duplicate_read_bytes(self):
  a=[0]*32;b,s,u=footprint(a)
  self.assertEqual(4*len(a),128);self.assertEqual(len(b),4);self.assertEqual(s,{0});self.assertEqual(u,F(1,8))
  for stride in range(33):
   _,_,v=footprint([4*stride*i for i in range(32)]);self.assertLessEqual(v,1);self.assertGreater(v,0)
 def test_cross_warp_overlap(self):
  _,a,_=footprint([4+4*i for i in range(32)]);_,b,_=footprint([132+4*i for i in range(32)])
  self.assertEqual(a,set(range(5)));self.assertEqual(b,set(range(4,9)))
  self.assertEqual(a&b,{4});self.assertEqual(len(a)+len(b),10);self.assertEqual(len(a|b),9)
if __name__=='__main__':unittest.main()
