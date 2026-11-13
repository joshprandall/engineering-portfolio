"""Execute standard-library bisection against independent linear oracles."""
import pathlib,json,gzip,unittest,itertools
from bisect import bisect_left as left,bisect_right as right,insort_right
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/software/algorithms.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/bisect-boundary-foundations.json.gz').read_bytes()))
IDS=['software-v09-design-review-big-o-describing-how-work-grows-2','software-v09-troubleshooting-la-big-o-describing-how-work-grows-3','software-v09-failure-analysis-l-big-o-describing-how-work-grows-3','software-v09-scenario-analysis-big-o-describing-how-work-grows-3','software-v09-design-review-big-o-describing-how-work-grows-3','software-v09-troubleshooting-la-big-o-describing-how-work-grows-4']
class BisectBoundaryFoundations(unittest.TestCase):
 def claim(self,i,*values):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for v in values:self.assertIn(v,text)
 def test_scope(self):
  self.assertEqual(list(D),list(B));self.assertEqual(len(D),111)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k in IDS:
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn('https://docs.python.org/3/library/bisect.html',D[k][f][-1])
 def test_membership_is_not_insertion(self):
  def contains(a,x):
   i=left(a,x);return i<len(a) and a[i]==x
  a=[2,4,6]
  self.assertEqual([left(a,x) for x in [1,2,5,6,7]],[0,0,2,2,3])
  for x in range(9):self.assertEqual(contains(a,x),x in a);self.assertFalse(contains([],x))
  self.assertTrue(contains(a,2));self.assertFalse(contains(a,5));self.claim(0,'index 2','index 3','index 0')
 def test_duplicate_partitions(self):
  for a in [[],[2]*5,[1,2,2,2,4]]:
   for x in range(6):
    l,h=left(a,x),right(a,x)
    self.assertEqual(h-l,a.count(x));self.assertEqual(a[l:h],[v for v in a if v==x])
    self.assertTrue(all(v<x for v in a[:l]));self.assertTrue(all(v>=x for v in a[l:]))
    self.assertTrue(all(v<=x for v in a[:h]));self.assertTrue(all(v>x for v in a[h:]))
  self.assertEqual((left([1,2,2,2,4],2),right([1,2,2,2,4],2)),(1,4))
  self.claim(1,'right-left=3','half-open','proportional to k')
 def test_inclusive_ranges(self):
  a=[1,2,2,3,5,5,8]
  def count(lo,hi):
   if lo>hi:raise ValueError('reversed bounds')
   return right(a,hi)-left(a,lo)
  for lo,hi in itertools.combinations_with_replacement(range(10),2):
   self.assertEqual(count(lo,hi),sum(lo<=v<=hi for v in a))
  self.assertEqual((left(a,2),right(a,5)),(1,6));self.assertEqual(count(2,5),5)
  self.assertEqual(count(5,5),2);self.assertEqual(count(6,7),0)
  with self.assertRaises(ValueError):count(7,6)
  self.claim(2,'difference is 5','[2,2,3,5,5]','lower<=upper')
 def test_key_contract(self):
  a=[{'name':n,'score':s} for n,s in [('A',10),('B',20),('C',20),('D',40)]]
  key=lambda row:row['score']
  self.assertEqual((left(a,20,key=key),right(a,20,key=key)),(1,3))
  with self.assertRaises(TypeError):left(a,{'name':'E','score':20},key=key)
  e={'name':'E','score':20};insort_right(a,e,key=key)
  self.assertEqual([r['name'] for r in a],list('ABCED'));self.assertIs(a[3],e)
  self.assertEqual([r['score'] for r in a],[10,20,20,20,40])
  for x in [0,10,20,30,50]:self.assertEqual(left(a,x,key=key),left([key(r) for r in a],x))
  self.claim(3,'not to the search value','A,B,C,E,D','record itself')
 def test_moved_positions(self):
  original=list(range(8))
  for x,expected,ip in [(-1,8,0),(3.5,4,4),(8,0,8)]:
   a=original.copy();self.assertEqual(left(a,x),ip);a.insert(ip,x)
   moved=sum(a.index(v)!=old for old,v in enumerate(original));self.assertEqual(moved,expected)
   self.assertEqual(a,sorted(original+[x]))
  for n in [8,16,32]:
   a=list(range(n));b=[-1]+a;self.assertEqual(sum(b.index(v)!=i for i,v in enumerate(a)),n)
  self.claim(4,'eight','four','none','O(log n)','O(n)')
 def test_sorted_precondition(self):
  a=[3,1,2];i=left(a,2);self.assertEqual(i,2);self.assertFalse(all(v<2 for v in a[:i]))
  ordered=sorted(a);j=left(ordered,2);self.assertEqual(j,1)
  self.assertTrue(all(v<2 for v in ordered[:j]));self.assertTrue(all(v>=2 for v in ordered[j:]))
  self.assertEqual(a,[3,1,2]);self.assertEqual(len(list(zip(ordered,ordered[1:]))),len(ordered)-1)
  self.claim(5,'left slice [3,1]','O(n)','not thread-safe')
if __name__=='__main__':unittest.main()
