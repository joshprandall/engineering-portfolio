"""Pure synthetic address models; never inspect process memory or configure a kernel."""
import pathlib,json,gzip,unittest
from collections import OrderedDict
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/advanced/memory.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/memory-address-foundations.json.gz').read_bytes()))
IDS=['advanced-virtual-memory','advanced-tlb','advanced-v05-page-tables','advanced-v05-page-faults','advanced-v05-huge-pages','advanced-v05-cache-lines','advanced-v06-false-sharing','advanced-v07-lab-translate-a-virtual-address']
SOURCES=['https://docs.kernel.org/mm/page_tables.html']*4+['https://docs.kernel.org/admin-guide/mm/hugetlbpage.html']+['https://docs.kernel.org/kernel-hacking/false-sharing.html']*2+['https://docs.kernel.org/mm/page_tables.html']
def translate(address,table,size=4096):
 page,offset=divmod(address,size)
 return table[page]*size+offset
def lines(start,length,size=64):
 if start<0 or length<0:raise ValueError('Nonnegative ranges only')
 return set(a//size for a in range(start,start+length))
def lru_trace(pages,capacity):
 cache=OrderedDict();result=[]
 for page in pages:
  hit=page in cache;result.append(hit)
  if hit:cache.move_to_end(page)
  else:
   cache[page]=True
   if len(cache)>capacity:cache.popitem(last=False)
 return result
class MemoryAddressEvidence(unittest.TestCase):
 def claim(self,i,*values):
  t=' '.join(D[IDS[i]]['reasoningSteps'])
  for v in values:self.assertIn(v,t)
 def test_scope(self):
  self.assertEqual(list(B),list(D));self.assertEqual(len(D),136)
  for k in B:
   fields=sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f))
   self.assertEqual(fields,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_structure_and_sources(self):
  for i,k in enumerate(IDS):
   x=D[k];self.assertNotIn('mean, why does it matter',x['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(x[f]),6);self.assertEqual(len(set(x[f])),6)
   self.assertIn(SOURCES[i],x['reasoningSteps'][-1]);self.assertIn('synthetic assumptions',x['reasoningSteps'][-1])
 def test_address_spaces(self):
  self.assertEqual(divmod(0x1234,4096),(1,564))
  self.assertEqual(translate(0x1234,{1:9}),37428);self.assertEqual(37428,0x9234)
  self.assertEqual(translate(0x1234,{1:5}),21044);self.assertEqual(21044,0x5234)
  for frame in [5,9]:
   for offset in [0,4095]:self.assertEqual(translate(4096+offset,{1:frame})%4096,offset)
  self.claim(0,'37428','21044','564 bytes','not a globally unique')
 def test_tlb_miss_not_page_fault(self):
  pages=[1,2,1,3,1,2];table={1:5,2:7,3:9}
  result=lru_trace(pages,2)
  self.assertEqual(result,[False,False,True,False,True,False]);self.assertEqual(sum(result),2)
  self.assertTrue(all(p in table for p in pages));self.assertEqual(sum(lru_trace(pages,3)),3)
  self.claim(1,'2 hits and 4 misses','without loading a page from disk','not a claim about a real TLB')
 def test_two_level_indices(self):
  address=0xABCD;upper=(address>>12)&15;lower=(address>>8)&15;offset=address&255
  self.assertEqual((upper,lower,offset),(10,11,205))
  self.assertEqual((upper<<12)|(lower<<8)|offset,address)
  table={10:{11:3}};self.assertEqual(table[upper][lower]*256+offset,973);self.assertEqual(973,0x3CD)
  self.assertEqual((2**16//256)*4,1024)
  with self.assertRaises(KeyError):table[10][12]
  self.claim(2,'256 virtual pages','1024 bytes','973','not Linux constants')
 def test_fault_cause_table_not_kernel(self):
  # Expected categories are explicit scenario assumptions, not OS measurements.
  scenarios={'resident-read':('none',False),'lazy-first-touch':('recoverable-allocation',False),'read-only-write':('protection',False),'unmapped-access':('invalid',False),'swapped-out':('backing-store-needed',True)}
  self.assertEqual(scenarios['resident-read'][0],'none')
  faulting=[v for v in scenarios.values() if v[0]!='none']
  self.assertTrue(any(not io for kind,io in faulting));self.assertTrue(any(io for kind,io in faulting))
  self.claim(3,'without reading a swapped page from disk','not a real kernel handler','Copy-on-write')
 def test_huge_page_counting(self):
  small,large,region=2**12,2**21,8*2**20
  self.assertEqual(region//small,2048);self.assertEqual(region//large,4)
  self.assertEqual(64*small,256*2**10);self.assertEqual(64*large,128*2**20)
  request=large+1
  rounded=lambda size:((request+size-1)//size)*size
  self.assertEqual(rounded(large),4*2**20);self.assertEqual(rounded(large)-request,2097151)
  self.assertEqual(rounded(small)-request,4095)
  self.claim(4,'2048 mappings','4 mappings','2097151','4095','not universally faster')
 def test_line_boundaries(self):
  self.assertEqual([divmod(x,64) for x in [0,63,64,127,128]],[(0,0),(0,63),(1,0),(1,63),(2,0)])
  self.assertEqual(lines(60,8),{0,1});self.assertEqual(lines(64,8),{1});self.assertEqual(lines(60,0),set())
  for start,length in [(60,8),(64,8),(0,64),(63,2),(128,1)]:
   self.assertEqual(len(lines(start,length)),(start+length-1)//64-start//64+1)
  self.claim(5,'two lines','therefore one','does not itself prove two cache misses')
 def test_false_sharing_placement_not_speedup(self):
  first=set(range(0,8));second=set(range(8,16));padded=set(range(64,72))
  self.assertFalse(first&second);self.assertTrue(lines(0,8)&lines(8,8));self.assertFalse(lines(0,8)&lines(64,8))
  self.assertFalse(first&padded)
  self.claim(6,'do not overlap','at least one writes','does not measure cache coherence or speedup','read-only')
 def test_cross_page_range(self):
  addresses=list(range(4094,4098));table={0:7,1:12}
  self.assertEqual([divmod(a,4096) for a in addresses],[(0,4094),(0,4095),(1,0),(1,1)])
  actual=[translate(a,table) for a in addresses];self.assertEqual(actual,[32766,32767,49152,49153])
  wrong=[actual[0]+i for i in range(4)];self.assertEqual(wrong,[32766,32767,32768,32769]);self.assertNotEqual(actual,wrong)
  with self.assertRaises(KeyError):translate(4096,{0:7})
  self.claim(7,'32766 and 32767','49152 and 49153','32768 and 32769','need not be physically contiguous')
if __name__=='__main__':unittest.main()
