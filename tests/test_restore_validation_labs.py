import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cloud-v10-mistake-hunt-backup-restore-testing","cloud-v10-concept-connection-backup-restore-testing","cloud-v10-transfer-lab-backup-restore-testing","cloud-v10-verification-lab-backup-restore-testing"]
URL='https://docs.aws.amazon.com/aws-backup/latest/devguide/restore-testing-validation.html'
def evidence(checks):
 if False in checks:return 'failed'
 if None in checks:return 'unknown'
 return 'successful' if checks and all(x is True for x in checks) else 'unknown'
def matches(expected,actual):return all(actual.get(k) is not None and actual[k]==v for k,v in expected.items())
class RestoreValidationLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/restore-validation-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cloud/recovery.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),93)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/cloud/recovery.json').read_bytes())
  for k,phrase in zip(IDS,['placeholder SUCCESSFUL','not all EventBridge','not an implementation','additional local traceability']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t)
 def test_completed_not_successful(self):
  self.assertEqual(evidence([True,None]),'unknown');self.assertEqual(evidence([True,False]),'failed')
  self.assertEqual(evidence([True,True]),'successful');self.assertEqual(evidence([]),'unknown')
  results=[evidence(list(xs)) for xs in itertools.product([True,False,None],repeat=2)]
  self.assertEqual({k:results.count(k) for k in set(results)},{'successful':1,'failed':5,'unknown':3})
 def test_event_filters(self):
  expected={'source':'aws.backup','detail-type':'Restore Job State Change','status':'COMPLETED','plan':'plan-A','resourceType':'EC2'}
  self.assertTrue(matches(expected,dict(expected)))
  for k in expected:
   wrong=dict(expected);wrong[k]='other';self.assertFalse(matches(expected,wrong),k)
   missing=dict(expected);missing.pop(k);self.assertFalse(matches(expected,missing),k)
 def test_local_one_assignment_gate(self):
  class Register:
   def __init__(self):self.result=None
   def record(self,checks):
    if self.result is not None:raise ValueError('already assigned')
    result=evidence(checks)
    if result=='unknown':raise ValueError('insufficient evidence')
    self.result=result
  r=Register()
  with self.assertRaisesRegex(ValueError,'insufficient'):r.record([True,None])
  self.assertIsNone(r.result);r.record([True,True]);self.assertEqual(r.result,'successful')
  with self.assertRaisesRegex(ValueError,'already'):r.record([False,True])
  self.assertEqual(r.result,'successful')
 def test_job_resource_and_local_revision(self):
  required={'job':'job-J7','resource':'R7','checkRevision':'check-v2'}
  self.assertTrue(matches(required,{**required,'passed':True}))
  for k in required:
   wrong={**required,k:'different','passed':True};self.assertFalse(matches(required,wrong))
   missing=dict(required);missing.pop(k);self.assertFalse(matches(required,missing))
  self.assertNotIn('checkRevision',{'restoreJobId':'job-J7','createdResourceArn':'R7'})
if __name__=='__main__':unittest.main()
