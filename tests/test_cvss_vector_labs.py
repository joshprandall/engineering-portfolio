import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-v09-practical-lab-cve-and-cvss-are-different","cyber-v10-mistake-hunt-cve-and-cvss-are-different","cyber-v10-trace-lab-cve-and-cvss-are-different","cyber-v10-explain-back-challenge-cve-and-cvss-are-different"]
URL='https://www.first.org/cvss/v4.0/specification-document'
BASE=dict(AV='NALP',AC='LH',AT='NP',PR='NLH',UI='NPA',VC='HLN',VI='HLN',VA='HLN',SC='HLN',SI='HLN',SA='HLN')
ALLOWED={**BASE,'E':'XAPU','S':'XNP'}
VECTOR='CVSS:4.0/AV:L/AC:H/AT:P/PR:L/UI:A/VC:L/VI:H/VA:L/SC:N/SI:N/SA:N'
def parse_subset(vector):
 parts=vector.split('/')
 if parts[0]!='CVSS:4.0':raise ValueError('version')
 result={};positions=[]
 for pair in parts[1:]:
  fields=pair.split(':')
  if len(fields)!=2:raise ValueError('pair')
  k,v=fields
  if k not in ALLOWED:raise ValueError('unsupported metric')
  if k in result:raise ValueError('duplicate')
  if v not in tuple(ALLOWED[k]):raise ValueError('value')
  result[k]=v;positions.append(list(ALLOWED).index(k))
 if not set(BASE)<=result.keys():raise ValueError('missing Base')
 if positions!=sorted(positions):raise ValueError('order')
 return result
class CvssVectorLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/cvss-vector-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/risk.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),105)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/cyber/risk.json').read_bytes())
  for k,phrase in zip(IDS,['not necessarily invalid','not evaluated','different metric context','using defaults']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t)
 def test_vector_subset(self):
  self.assertEqual(len(parse_subset(VECTOR)),11)
  for k in BASE:
   pieces=[p for p in VECTOR.split('/') if not p.startswith(k+':')]
   with self.assertRaisesRegex(ValueError,'missing Base'):parse_subset('/'.join(pieces))
  for bad in [VECTOR.replace('AV:L/AC:H','AC:H/AV:L'),VECTOR+'/AV:L',VECTOR.replace('AV:L','av:L'),VECTOR.replace('AV:L','AV:Q'),VECTOR.replace('4.0','3.1')]:
   with self.assertRaises(ValueError):parse_subset(bad)
  self.assertEqual(parse_subset(VECTOR+'/E:U/S:X')['E'],'U')
  with self.assertRaisesRegex(ValueError,'order'):parse_subset(VECTOR+'/S:X/E:U')
  with self.assertRaisesRegex(ValueError,'unsupported'):parse_subset(VECTOR+'/CR:H')
 def test_optional_unknown(self):
  def safety(record):return record.get('S','X')
  records=[parse_subset(VECTOR+s) for s in ['', '/S:X','/S:N','/S:P']]
  self.assertEqual([safety(r) for r in records],['X','X','N','P'])
  self.assertNotIn('S',records[0]);self.assertEqual(records[1]['S'],'X')
 def test_supplemental_projection(self):
  supplemental={'S','AU','R','V','RE','U'}
  def projection(d):return {k:v for k,v in d.items() if k not in supplemental}
  a={**parse_subset(VECTOR),'S':'N'};b={**a,'S':'P'}
  self.assertNotEqual(a,b);self.assertEqual(projection(a),projection(b))
  c={**b,'MSI':'S'};self.assertNotEqual(projection(a),projection(c));self.assertEqual(projection(c)['MSI'],'S')
 def test_nomenclature_provenance(self):
  def label(threat,environment,supplement):
   if threat not in (True,False) or environment not in (True,False):return None
   return 'CVSS-B'+('T' if threat else '')+('E' if environment else '')
  expected={(False,False):'CVSS-B',(True,False):'CVSS-BT',(False,True):'CVSS-BE',(True,True):'CVSS-BTE'}
  for flags,value in expected.items():
   for supplemental in [False,True]:self.assertEqual(label(*flags,supplemental),value)
  self.assertIsNone(label(None,False,False));self.assertIsNone(label(True,None,True))
if __name__=='__main__':unittest.main()
