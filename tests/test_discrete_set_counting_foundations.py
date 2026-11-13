"""Exhaustive tiny domains and independent membership/counting oracles."""
import pathlib,json,gzip,unittest,itertools,math
from collections import Counter
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/math/discrete-math.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/discrete-set-counting-foundations.json.gz').read_bytes()))
IDS=["math-v09-recall-drill-sets-membership-and-logical-conditions","math-v09-practical-lab-sets-membership-and-logical-conditions","math-v09-failure-analysis-lab-sets-membership-and-logical-conditions","math-v09-evidence-verification-la-combinatorics-count-without-listing-everything","math-v09-worked-example-combinatorics-count-without-listing-everything","math-v09-design-review-combinatorics-count-without-listing-everything"]
URLS=['https://docs.python.org/3/library/stdtypes.html#set-types-set-frozenset']*3+['https://openstax.org/books/college-algebra-2e/pages/9-5-counting-principles']*3
class DiscreteFoundations(unittest.TestCase):
 def claim(self,i,*values):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for value in values:self.assertIn(value,text)
 def test_scope(self):
  self.assertEqual(list(B),list(D));self.assertEqual(len(D),99)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,url in zip(IDS,URLS):
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(D[k][f]),6);self.assertIn(url,D[k][f][-1])
 def test_membership_operations(self):
  u=set(range(1,7));a={1,2,3};b={3,4}
  self.assertEqual(a|b,{1,2,3,4});self.assertEqual(a&b,{3});self.assertEqual(a-b,{1,2});self.assertEqual(b-a,{4})
  self.assertEqual({x for x in u if x in a or x in b},a|b);self.assertEqual({x for x in u if x in a and x in b},a&b);self.assertEqual({x for x in u if x in a and x not in b},a-b)
  self.assertEqual(len(a|b),len(a)+len(b)-len(a&b));self.claim(0,'not commutative','not frequency')
 def test_complement_universe(self):
  a={1,3};u={1,2,3,4};v=set(range(1,7))
  self.assertEqual(u-a,{2,4});self.assertEqual(v-a,{2,4,5,6})
  for universe in [u,v]:self.assertTrue(a<=universe);self.assertEqual(a&(universe-a),set());self.assertEqual(a|(universe-a),universe);self.assertEqual(universe-(universe-a),a)
  outside={1,9};self.assertFalse(outside<=u);self.assertNotEqual(u-(u-outside),outside);self.claim(1,'not silently claim','subset')
 def test_demorgan_truth_table_and_sets(self):
  rows=list(itertools.product([False,True],repeat=2));self.assertEqual(len(rows),4)
  for a,b in rows:self.assertEqual(not(a or b),(not a) and (not b));self.assertEqual(not(a and b),(not a) or (not b))
  self.assertNotEqual(not(True and False),(not True) and (not False))
  u={1,2,3,4};a={1,2};b={2,3};self.assertEqual(u-(a|b),{4});self.assertEqual((u-a)&(u-b),{4});self.assertEqual(u-(a&b),{1,3,4});self.assertEqual((u-a)|(u-b),{1,3,4})
  self.claim(2,'(True,False)','{1,3,4}')
 def test_order_and_replacement(self):
  letters='ABCDE';ordered=[(a,b) for a in letters for b in letters if a!=b];unordered=Counter(frozenset(pair) for pair in ordered)
  self.assertEqual(len(ordered),20);self.assertEqual(len(unordered),10);self.assertEqual(set(unordered.values()),{2});self.assertEqual(math.perm(5,2),20);self.assertEqual(math.comb(5,2),10)
  replacement=list(itertools.product(letters,repeat=2));self.assertEqual(len(replacement),25);self.assertIn(('A','A'),replacement);self.assertEqual(set(Counter(frozenset(pair) for pair in replacement).values()),{1,2});self.claim(3,'not probabilities')
 def test_restricted_product(self):
  designs=list(itertools.product(['red','blue'],['S','M','L'],['matte','glossy']));valid=[x for x in designs if not(x[0]=='red' and x[2]=='glossy')]
  self.assertEqual(len(designs),12);self.assertEqual(len(valid),9);self.assertEqual(Counter(x[0] for x in valid),{'red':3,'blue':6});self.assertEqual({x[1] for x in designs if x not in valid},{'S','M','L'});self.claim(4,'disjoint cases sum to 9')
 def test_subsets_and_empty_case(self):
  def subsets(items):return [frozenset(x for x,include in zip(items,bits) if include) for bits in itertools.product([False,True],repeat=len(items))]
  got=subsets('ABCD');self.assertEqual(len(got),16);self.assertEqual(len(set(got)),16);self.assertEqual([Counter(map(len,got))[n] for n in range(5)],[1,4,6,4,1]);self.assertEqual(sum(bool(s) for s in got),15);self.assertEqual(sum(0<len(s)<4 for s in got),14)
  self.assertEqual(subsets(''),[frozenset()]);self.assertEqual(sum(math.comb(4,r) for r in range(5)),2**4);self.claim(5,'2^0=1','without multiplicity or order')
if __name__=='__main__':unittest.main()
