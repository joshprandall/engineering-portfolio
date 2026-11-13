import unittest,pathlib,json,gzip,itertools
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v09-quick-reference-roadmaps-sequence-outcomes-not-wish-lists","leadership-v09-decision-lab-roadmaps-sequence-outcomes-not-wish-lists","leadership-v09-quick-reference-roadmaps-sequence-outcomes-not-wish-lists-2","leadership-v09-decision-lab-roadmaps-sequence-outcomes-not-wish-lists-2"]
TABLES=[(F(9,25),F(6,25),F(6,25),F(4,25)),(F(3,5),F(0),F(0),F(2,5)),(F(1,5),F(2,5),F(2,5),F(0))]
class MergeBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/merge-boundaries.json.gz').read_bytes()));d=json.loads(gzip.decompress((R/'tests/baselines/sprint-outcome-labs.json.gz').read_bytes()))
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),66)
  current=json.loads((R/'deep-learning/leadership/projects.json').read_bytes())
  for k in IDS:self.assertEqual(d[k],current[k],k)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/leadership/projects.json').read_bytes())
  for k,words in zip(IDS,[['36%','64%','independence'],['20%','60%','not universal'],['five days','not Monte Carlo'],['21.6%','need not strictly shrink']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://guides.gaoinnovations.gov/schedule-guide/merge-bias-and-schedule-underestimation.html',text)
   for word in words:self.assertIn(word,text)
 def test_independent_joint_outcomes(self):
  probs=[F(3,5)**sum(x)*F(2,5)**(2-sum(x)) for x in itertools.product([True,False],repeat=2)]
  self.assertEqual(tuple(probs),TABLES[0]);self.assertEqual(sum(probs),1)
  self.assertEqual(1-probs[0],F(16,25))
 def test_identical_marginals_different_joint(self):
  for both,a,b,neither in TABLES:
   self.assertEqual(both+a,F(3,5));self.assertEqual(both+b,F(3,5))
   self.assertEqual(both+a+b+neither,1);self.assertTrue(all(x>=0 for x in [both,a,b,neither]))
  self.assertEqual({x[0] for x in TABLES},{F(9,25),F(3,5),F(1,5)})
  self.assertEqual(max(0,F(3,5)*2-1),F(1,5))
 def test_maximum_before_expectation(self):
  pairs=list(itertools.product([2,6],repeat=2));finishes=[max(x) for x in pairs]
  self.assertEqual(finishes,[2,6,6,6]);self.assertEqual(F(sum(finishes),4),5)
  self.assertEqual(max(F(sum(x[i] for x in pairs),4) for i in [0,1]),4)
  self.assertEqual(F(sum(x<=4 for x in finishes),4),F(1,4))
 def test_additional_required_event(self):
  cases=list(itertools.product([False,True],repeat=3))
  def p(x):return F(3,5)**sum(x)*F(2,5)**(3-sum(x))
  self.assertEqual(sum(p(x) for x in cases),1)
  self.assertEqual(sum(p(x) for x in cases if all(x)),F(27,125))
  self.assertLess(F(27,125),F(9,25))
  for a,b in itertools.product([False,True],repeat=2):
   c=a;self.assertEqual(a and b and c,a and b)
if __name__=='__main__':unittest.main()
