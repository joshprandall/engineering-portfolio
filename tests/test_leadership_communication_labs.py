import unittest,pathlib,json,gzip
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v09-worked-example-delegation-transfer-outcomes-not-just-tasks","leadership-v09-misconception-clinic-executive-communication-translate-technology-into-decisi","leadership-v09-practical-lab-feedback-that-changes-behavior","leadership-v09-teach-back-lab-one-on-ones"]
def mismatches(a,b):return {k for k in ['outcome','deadline','prohibited'] if a.get(k)!=b.get(k)}
class LeadershipCommunicationLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/leadership-communication-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/leadership.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),68)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_adaptation_limits(self):
  d=json.loads((R/'deep-learning/leadership/leadership.json').read_bytes())
  for k,w in zip(IDS,['not completing','not a30percent probability','not proof of improvement','not a comprehension score']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn('https://www.ahrq.gov/sites/default/files/wysiwyg/teamstepps-program/teamstepps-pocket-guide.pdf',t);self.assertIn(w,t);self.assertIn('fictional',t)
 def test_checkback_scope(self):
  instruction=dict(outcome='prepare checklist',deadline='15:00',prohibited='execute rollback')
  wrong=dict(outcome='execute rollback',deadline='15:00',prohibited=None)
  self.assertEqual(mismatches(instruction,wrong),{'outcome','prohibited'})
  self.assertEqual(mismatches(instruction,dict(instruction)),set())
  trace=['send','wrong-restatement','correct','correct-restatement','confirm']
  self.assertLess(trace.index('correct'),trace.index('confirm'));self.assertNotIn('execute',trace)
 def test_sbar_count_not_probability(self):
  brief={'situation':{'failed_checks':3,'total_checks':10},'background':{'candidate':'R7','deployed':False},'assessment':{'cause':None,'ready':False},'request':'review after investigation and rerun'}
  self.assertEqual(F(brief['situation']['failed_checks'],brief['situation']['total_checks']),F(3,10))
  self.assertIsNone(brief['assessment']['cause']);self.assertFalse(brief['background']['deployed'])
  self.assertNotIn('customer_failure_probability',brief['assessment'])
 def test_feedback_fixture_components(self):
  fixture={'observation':'owner field blank in handoff note','effect':'reviewer asked who could act','next_behavior':'name owner or mark unresolved','obstacle_question':'was the owner decision still missing'}
  self.assertEqual(set(fixture),{'observation','effect','next_behavior','obstacle_question'})
  self.assertTrue(all(fixture.values()));self.assertNotIn('personality',fixture);self.assertNotIn('motivation',fixture)
 def test_teachback_concepts_not_literal_text(self):
  required={'trigger','contact','timing'}
  first={'trigger','contact'};paraphrase={'trigger','contact','timing'}
  self.assertEqual(required-first,{'timing'});self.assertFalse(required-paraphrase)
  # Concept tags are manually authored fixtures, not an NLP or employee-scoring system.
  self.assertNotEqual('Ask the lead that day','Escalate to the lead on the same day')
if __name__=='__main__':unittest.main()
