import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-v09-practical-lab-edr-endpoint-detection-and-response","cyber-v09-quick-reference-edr-endpoint-detection-and-response","cyber-v09-design-review-edr-endpoint-detection-and-response","cyber-v09-misconception-clinic-edr-endpoint-detection-and-response"]
class SysmonEvidenceLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/sysmon-evidence-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/endpoint.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),91)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/cyber/endpoint.json').read_bytes())
  for k,w in zip(IDS,['fictional','disabled by default','whether cached or not','not proof']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn('https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon',t);self.assertIn(w,t)
 def test_guid_join(self):
  rows=[dict(host='A',pid=42,guid='G-old'),dict(host='A',pid=42,guid='G-new'),dict(host='B',pid=42,guid='G-other')]
  e=dict(host='A',pid=42,guid='G-new')
  pid_matches=[r for r in rows if (r['host'],r['pid'])==(e['host'],e['pid'])]
  guid_matches=[r for r in rows if (r['host'],r['guid'])==(e['host'],e['guid'])]
  self.assertEqual(len(pid_matches),2);self.assertEqual(guid_matches,[rows[1]])
 def test_empty_observation_ambiguity(self):
  rows=[(occurs,enabled,[3] if occurs and enabled else []) for occurs,enabled in itertools.product([False,True],repeat=2)]
  self.assertEqual(sum(bool(obs) for _,_,obs in rows),1)
  self.assertIn((False,True,[]),rows);self.assertIn((True,False,[]),rows)
  self.assertEqual(len([r for r in rows if not r[2]]),3)
 def test_dns_event_scope(self):
  scenarios=[dict(success=s,cached=c,event_id=22) for s,c in itertools.product([False,True],repeat=2)]
  self.assertEqual(len(scenarios),4);self.assertEqual({r['event_id'] for r in scenarios},{22})
  self.assertEqual({r['success'] for r in scenarios},{False,True});self.assertEqual({r['cached'] for r in scenarios},{False,True})
  self.assertTrue(all('application_connected' not in r for r in scenarios))
 def test_delete_classification_not_artifact(self):
  events=[23,26,26,23]
  self.assertEqual(sum(x in {23,26} for x in events),4);self.assertEqual(events.count(23),2)
  self.assertEqual([26,26].count(23),0)
  # No archive contents are supplied, so no recoverable-file count is inferred.
  evidence={'deletion_events':4,'archive_semantics_events':2,'verified_recoverable_files':None}
  self.assertIsNone(evidence['verified_recoverable_files'])
if __name__=='__main__':unittest.main()
