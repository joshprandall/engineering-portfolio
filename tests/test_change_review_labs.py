import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v09-teach-back-lab-change-management-without-bureaucracy-theater-2","leadership-v09-worked-example-change-management-without-bureaucracy-theater-2","leadership-v09-misconception-clin-change-management-without-bureaucracy-theater-2","leadership-v09-practical-lab-change-management-without-bureaucracy-theater-2"]
URL='https://sre.google/sre-book/postmortem-culture/'
def trigger(minutes,loss,rollback,request):
 flags=[None if minutes is None else minutes>10,loss,rollback,request]
 if True in flags:return True
 return None if None in flags else False
class ChangeReviewLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/change-review-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/itsm.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),65)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/leadership/itsm.json').read_bytes())
  for k,phrase in zip(IDS,['not a universal Google policy','does not by itself','unsupported personality','not that every recurrence']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t);self.assertIn('fictional',t)
 def test_review_trigger_boundaries_and_unknown(self):
  self.assertFalse(trigger(10,False,False,False));self.assertTrue(trigger(11,False,False,False))
  self.assertTrue(trigger(2,False,True,False));self.assertIsNone(trigger(None,False,False,False))
  self.assertIsNone(trigger(2,None,False,False));self.assertTrue(trigger(None,False,False,True))
  outcomes=[trigger(11 if duration else 10,loss,rollback,request) for duration,loss,rollback,request in itertools.product([False,True],repeat=4)]
  self.assertEqual(outcomes.count(True),15);self.assertEqual(outcomes.count(False),1)
 def test_timeline_intervals_not_causation(self):
  events={'deployment':0,'alert':4,'rollback':7,'recovery':12}
  self.assertEqual(events['recovery']-events['alert'],8);self.assertEqual(events['recovery']-events['rollback'],5)
  self.assertNotIn('impact_start',events);self.assertNotIn('cause',events)
  self.assertEqual(sorted(events,key=events.get),['deployment','alert','rollback','recovery'])
 def test_blame_rewrite_keeps_context(self):
  fixture=dict(action='proceeded with deployment',information='stale health summary',outcome='dependency check failed',proposal='show health timestamp')
  self.assertTrue(all(fixture.values()));self.assertNotIn('personality',fixture);self.assertNotIn('intent',fixture)
  # Manually reviewed dialogue structure; this is not an NLP classifier or employee score.
  self.assertEqual(set(fixture),{'action','information','outcome','proposal'})
 def test_review_distinct_from_action_evidence(self):
  verified=lambda implemented,evidence:implemented and evidence
  self.assertEqual([verified(a,b) for a,b in itertools.product([False,True],repeat=2)],[False,False,False,True])
  document_reviewed=True;actions=[(True,False),(False,False)]
  self.assertTrue(document_reviewed);self.assertEqual(sum(verified(*a) for a in actions),0)
if __name__=='__main__':unittest.main()
