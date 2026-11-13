import unittest,pathlib,json,gzip
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["leadership-v09-recall-drill-reconstruct-an-incident-timeline","leadership-v09-decision-lab-reconstruct-an-incident-timeline","leadership-v09-evidence-verification-la-reconstruct-an-incident-timeline","leadership-v09-quick-reference-reconstruct-an-incident-timeline"]
def corrected(recorded,offset):return recorded-offset
def interval(center,error):return center-error,center+error
def difference(a,b):return b[0]-a[1],b[1]-a[0]
def select(event,observed):
 if event is not None:return event,'event'
 if observed is not None:return observed,'observed'
 return None,'unknown'
class TimelineEvidence(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/timeline-evidence.json.gz').read_bytes()));d=json.loads((R/'deep-learning/leadership/lab.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),67)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/leadership/lab.json').read_bytes())
  for k,words in zip(IDS,[['ObservedTimestamp','not automatically'],['minus signed offset','invented known'],['-1 through 7','not an OpenTelemetry-required'],['otherwise ObservedTimestamp','does not become proof']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://opentelemetry.io/docs/specs/otel/logs/data-model/',text)
   for word in words:self.assertIn(word,text)
 def test_event_and_observation_order(self):
  records=[('A',10,30),('B',20,25)]
  self.assertEqual([r[0] for r in sorted(records,key=lambda x:x[1])],['A','B'])
  self.assertEqual([r[0] for r in sorted(records,key=lambda x:x[2])],['B','A'])
  self.assertEqual([r[2]-r[1] for r in records],[20,5])
 def test_signed_offset_correction(self):
  self.assertGreater(110,105);self.assertLess(corrected(110,10),corrected(105,0))
  self.assertEqual(corrected(110,10),100);self.assertEqual(corrected(100,-5),105)
 def test_uncertain_order_and_difference(self):
  a=interval(100,2);b=interval(103,2);later=interval(105,2)
  self.assertEqual(a,(98,102));self.assertEqual(b,(101,105))
  self.assertEqual(difference(a,b),(-1,7));self.assertFalse(a[1]<b[0])
  self.assertEqual(difference(a,later),(1,9));self.assertTrue(a[1]<later[0])
  self.assertFalse(a[1]<interval(104,2)[0])
 def test_fallback_provenance(self):
  self.assertEqual(select(10,30),(10,'event'));self.assertEqual(select(None,30),(30,'observed'))
  self.assertEqual(select(None,None),(None,'unknown'))
  self.assertEqual(select(10,None),(10,'event'))
if __name__=='__main__':unittest.main()
