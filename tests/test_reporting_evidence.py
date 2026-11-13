import unittest,pathlib,json,gzip,math
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v09-troubleshooting-lab-psychological-safety","leadership-v09-scenario-analysis-psychological-safety","leadership-v09-troubleshooting-la-psychological-safety-2","leadership-v09-scenario-analysis-psychological-safety-2"]
class ReportingEvidence(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/reporting-evidence.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/teams.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),66)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/leadership/teams.json').read_bytes())
  for k,words in zip(IDS,[['expected report count','not claims'],['5.75','unknown'],['3/8','not an OSHA-mandated'],['94%','not a confidence interval']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://www.osha.gov/sites/default/files/publications/OSHA_Leading_Indicators.pdf',text)
   for word in words:self.assertIn(word,text)
 def test_reporting_expectations_and_distribution(self):
  for p,expect in [(F(1,5),2),(F(4,5),8)]:
   probs=[math.comb(10,k)*p**k*(1-p)**(10-k) for k in range(11)]
   self.assertEqual(sum(probs),1);self.assertEqual(sum(k*v for k,v in enumerate(probs)),expect)
   self.assertLess(probs[expect],1)
  self.assertEqual(40*F(1,5),10*F(4,5))
 def test_unanswered_response_bounds(self):
  closed=[1,2];ages=[10,10]
  self.assertEqual(F(sum(closed),len(closed)),F(3,2))
  self.assertEqual(F(sum(closed+ages),len(closed+ages)),F(23,4))
  ages.append(20);self.assertEqual(F(sum(closed+ages),len(closed+ages)),F(43,5))
  self.assertEqual(F(sum(closed),len(closed)),F(3,2))
 def test_distinct_workflow_states(self):
  reported=set(range(8));ack=set(range(6));done=set(range(4));reviewed=set(range(3))
  self.assertTrue(reviewed<=done<=ack<=reported)
  self.assertEqual([F(len(s),len(reported)) for s in [ack,done,reviewed]],[F(3,4),F(1,2),F(3,8)])
  self.assertFalse((done|{99})<=reported)
 def test_nonresponse_bounds(self):
  eligible,respondents,yes=100,30,24
  self.assertEqual(F(yes,respondents),F(4,5));self.assertEqual(F(respondents,eligible),F(3,10))
  self.assertEqual((F(yes,eligible),F(yes+eligible-respondents,eligible)),(F(6,25),F(47,50)))
  bounds=lambda n,r,y:(F(y,n),F(y+n-r,n))
  self.assertEqual(bounds(100,100,80),(F(4,5),F(4,5)))
if __name__=='__main__':unittest.main()
