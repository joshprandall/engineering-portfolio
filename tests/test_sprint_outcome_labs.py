import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v10-worked-walkthrough-roadmaps-sequence-outcomes-not-wish-lists","leadership-v10-mistake-hunt-roadmaps-sequence-outcomes-not-wish-lists","leadership-v10-transfer-challenge-roadmaps-sequence-outcomes-not-wish-lists","leadership-v10-design-critique-roadmaps-sequence-outcomes-not-wish-lists"]
URL='https://scrumguides.org/scrum-guide.html'
REQUIRED=('authorization','regression','documentation')
def done(evidence):return all(evidence.get(k) is True for k in REQUIRED)
def complete(record):return all(bool(record.get(k)) for k in ('goal','selectedItems','plan'))
class SprintOutcomeLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/sprint-outcome-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/projects.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),66)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/leadership/projects.json').read_bytes())
  for k,phrase in zip(IDS,['nonempty text does not prove','not an automatic Scrum','not mandated by the Guide','not an additional Scrum event']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t)
 def test_structure_not_meaning(self):
  record={'goal':'Export own records','selectedItems':['export','authorization'],'plan':['implement','verify']}
  self.assertTrue(complete(record))
  for k in record:
   missing=dict(record);missing.pop(k);self.assertFalse(complete(missing))
   empty=dict(record);empty[k]=[];self.assertFalse(complete(empty))
  unrelated={**record,'plan':['unrelated color refresh']};self.assertTrue(complete(unrelated))
  self.assertNotEqual(unrelated['plan'],record['plan'])
 def test_scope_review(self):
  def candidate(xs):return all(x is True for x in xs)
  rows=list(itertools.product([False,True],repeat=3))
  self.assertEqual([x for x in rows if candidate(x)],[(True,True,True)])
  for i in range(3):
   xs=[True]*3;xs[i]=None;self.assertFalse(candidate(xs))
  roles=['Product Owner','Developer','Scrum Master','Stakeholder']
  self.assertEqual([r for r in roles if r=='Product Owner'],['Product Owner'])
 def test_done_evidence(self):
  rows=list(itertools.product([True,False,None],repeat=3))
  passed=[x for x in rows if done(dict(zip(REQUIRED,x)))]
  self.assertEqual(len(rows),27);self.assertEqual(passed,[(True,True,True)])
  for k in REQUIRED:
   e=dict.fromkeys(REQUIRED,True);e.pop(k);self.assertFalse(done(e))
  self.assertFalse(done({}));self.assertFalse(done(dict.fromkeys(REQUIRED,'pass')))
 def test_review_not_release(self):
  def eligible(is_done,authorized,review_held):return is_done and authorized
  for review in [False,True]:
   rows=list(itertools.product([False,True],repeat=2))
   self.assertEqual([x for x in rows if eligible(*x,review)],[(True,True)])
  record={'done':True,'authorized':True,'review':False,'released':False}
  self.assertTrue(eligible(record['done'],record['authorized'],record['review']))
  self.assertFalse(record['released'])
if __name__=='__main__':unittest.main()
