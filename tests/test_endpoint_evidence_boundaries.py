import unittest,pathlib,json,gzip
from datetime import datetime,timezone
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-edr","cyber-v09-teach-back-lab-edr-endpoint-detection-and-response","cyber-v09-evidence-verification-la-edr-endpoint-detection-and-response","cyber-v09-troubleshooting-lab-edr-endpoint-detection-and-response"]
def utc(h,m):return datetime(2026,1,1,h,m,tzinfo=timezone.utc)
class EndpointEvidenceBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/endpoint-evidence-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/endpoint.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),91)
  for k in b:
   changed={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/cyber/endpoint.json').read_bytes())
  for k in IDS:self.assertIn('https://learn.microsoft.com/en-us/defender-xdr/advanced-hunting-deviceinfo-table',' '.join(d[k]['reasoningSteps']))
 def test_report_identity(self):
  rows=[('a.example',utc(10,0),7),('b.example',utc(10,0),7),('a.example',utc(10,1),7)]
  self.assertEqual(len({r[2] for r in rows}),1);self.assertEqual(len(set(rows)),3)
  self.assertEqual(len(set(rows+[rows[0]])),3)
 def test_device_name_scope(self):
  rows=[{'DeviceId':'d1','DeviceName':'workstation.example','Timestamp':utc(10,0)},{'DeviceId':'d2','DeviceName':'workstation.example','Timestamp':utc(10,0)}]
  self.assertEqual(len({r['DeviceName'] for r in rows}),1);self.assertEqual(len({r['DeviceId'] for r in rows}),2)
  rows.append(dict(rows[0],Timestamp=utc(10,1)));self.assertEqual(len(rows),3);self.assertEqual(len({r['DeviceId'] for r in rows}),2)
 def test_shared_egress(self):
  rows=[{'DeviceId':'d1','PublicIP':'gateway-A'},{'DeviceId':'d2','PublicIP':'gateway-A'}]
  self.assertEqual(len({r['PublicIP'] for r in rows}),1);self.assertEqual({r['DeviceId'] for r in rows},{'d1','d2'})
  grouped={}
  for r in rows:grouped.setdefault(r['PublicIP'],set()).add(r['DeviceId'])
  self.assertEqual(grouped,{'gateway-A':{'d1','d2'}});rows[0]['PublicIP']='gateway-B';self.assertEqual(rows[0]['DeviceId'],'d1')
 def test_recorded_vs_ingested(self):
  rows=[{'id':'new-observation','DeviceId':'d1','Timestamp':utc(10,5),'IngestionTime':utc(10,6)},{'id':'late-arrival','DeviceId':'d1','Timestamp':utc(10,0),'IngestionTime':utc(10,7)},{'id':'other-device','DeviceId':'d2','Timestamp':utc(11,0),'IngestionTime':utc(11,1)}]
  grouped={}
  for r in rows:grouped.setdefault(r['DeviceId'],[]).append(r)
  d1=grouped['d1'];self.assertEqual(max(d1,key=lambda r:r['Timestamp'])['id'],'new-observation')
  self.assertEqual(max(d1,key=lambda r:r['IngestionTime'])['id'],'late-arrival');self.assertEqual(len(grouped),2)
  tied=[dict(d1[0]),dict(d1[1],Timestamp=d1[0]['Timestamp'])]
  latest=max(r['Timestamp'] for r in tied);self.assertEqual(len([r for r in tied if r['Timestamp']==latest]),2)
if __name__=='__main__':unittest.main()
