import unittest,pathlib,json,gzip
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-v08-deep-dive-csf-core-outcomes","cyber-v08-evidence-lab-csf-core-outcomes","cyber-v08-deep-dive-csf-organizational-profile","cyber-v08-evidence-lab-csf-organizational-profile"]
def gaps(current,target):
 if current['scope']!=target['scope']:raise ValueError('scope mismatch')
 return set(target['outcomes'])-set(current['achieved'])
class ProfileEvidenceBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/profile-evidence-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/governance.json').read_bytes())
  c=json.loads(gzip.decompress((R/'tests/baselines/impact-categories.json.gz').read_bytes()))
  self.assertEqual(list(b),list(d));self.assertEqual(list(c),list(d));self.assertEqual(len(d),113)
  for k in IDS:self.assertEqual(d[k],c[k],k)
  for k in b:
   changed={f for f in set(b[k])|set(c[k]) if b[k].get(f)!=c[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/cyber/governance.json').read_bytes())
  for k in IDS:self.assertIn('https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf',' '.join(d[k]['reasoningSteps']))
 def test_mapping_is_not_evidence(self):
  mappings={'tool-A':{'inventory','detection'},'tool-B':{'detection'}}
  self.assertEqual(sum(map(len,mappings.values())),3);self.assertEqual(set().union(*mappings.values()),{'inventory','detection'})
  verified=set();self.assertFalse(verified);verified.add('inventory')
  self.assertNotIn('detection',verified);self.assertEqual(len(verified),1)
 def test_partial_unknown(self):
  states={'inventory':'achieved','detection':'partial','recovery':'unknown'}
  classified={s:{k for k,v in states.items() if v==s} for s in ['achieved','partial','unknown']}
  self.assertEqual(classified,{'achieved':{'inventory'},'partial':{'detection'},'unknown':{'recovery'}})
  self.assertEqual(set(states)-classified['achieved'],{'detection','recovery'})
 def test_scope_match(self):
  current={'scope':'payroll','achieved':{'inventory'}};target={'scope':'payroll','outcomes':{'inventory','recovery'}}
  self.assertEqual(gaps(current,target),{'recovery'})
  different=dict(target,scope='storefront')
  with self.assertRaises(ValueError):gaps(current,different)
  self.assertEqual(current,{'scope':'payroll','achieved':{'inventory'}});self.assertEqual(different['scope'],'storefront')
 def test_action_not_achievement(self):
  current={'scope':'fixture','achieved':{'inventory'}};target={'scope':'fixture','outcomes':{'inventory','recovery'}}
  action={'outcome':'recovery','owner':'Ops','due':'2026-12-01','state':'scheduled'}
  for status in ['scheduled','overdue']:
   action['state']=status;self.assertEqual(gaps(current,target),{'recovery'})
  reviewed_evidence={'outcome':'recovery','scope':'fixture','reviewed':True}
  self.assertEqual(reviewed_evidence['scope'],current['scope']);self.assertTrue(reviewed_evidence['reviewed'])
  current['achieved'].add(reviewed_evidence['outcome']);self.assertEqual(gaps(current,target),set())
if __name__=='__main__':unittest.main()
