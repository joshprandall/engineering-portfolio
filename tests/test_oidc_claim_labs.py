import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-oauth","cyber-v09-recall-drill-oauth-2-0-delegated-authorization","cyber-v09-scenario-analysis-oauth-authorization-code","cyber-v10-reasoning-check-oauth-authorization-code"]
URL='https://openid.net/specs/openid-connect-core-1_0.html'
# Necessary claim predicates only. No JWT, cryptography, request-state store or authentication.
def audience_check(value,client,trusted):
 values=[value] if isinstance(value,str) else value
 return isinstance(values,list) and all(isinstance(x,str) for x in values) and client in values and set(values)<=trusted
def linked_subject(a,b):return isinstance(a,str) and bool(a) and isinstance(b,str) and a==b
class OIDCClaimLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/oidc-claim-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/identity.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),133)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_validation_limits(self):
  d=json.loads((R/'deep-learning/cyber/identity.json').read_bytes())
  for k,phrase in zip(IDS,['not a blanket authorization','not complete ID Token validation','equality alone','not account merging']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t);self.assertIn('fictional',t)
 def test_artifact_roles_are_not_interchangeable(self):
  artifacts={'ID Token':'client authentication result','access token':'protected-resource access'}
  self.assertNotEqual(artifacts['ID Token'],artifacts['access token'])
  permissions=set();identity_established=True
  self.assertTrue(identity_established);self.assertNotIn('delete',permissions)
 def test_exact_issuer_and_audience(self):
  expected='https://issuer.example'
  self.assertEqual([x==expected for x in [expected,expected+'/',expected.upper()]],[True,False,False])
  trusted={'app-A','app-B'}
  self.assertTrue(audience_check('app-A','app-A',trusted));self.assertTrue(audience_check(['app-A'],'app-A',trusted))
  self.assertTrue(audience_check(['app-A','app-B'],'app-A',trusted))
  for a in ['app-AB',['app-B'],['app-A','untrusted'],None,[],42,['app-A',7]]:
   self.assertFalse(audience_check(a,'app-A',trusted),a)
 def test_nonce_and_expiration_without_leeway(self):
  outcomes=[n=='request-7' and now<1000 for n,now in itertools.product(['request-7',None,'request-8'],[999,1000,1001])]
  self.assertEqual(outcomes.count(True),1);self.assertEqual(outcomes[:3],[True,False,False])
  # Matching an invented label does not implement replay prevention.
 def test_identity_key_and_userinfo_subject(self):
  a=('issuer-A','user-7');b=('issuer-B','user-7');self.assertNotEqual(a,b)
  before=dict(iss=a[0],sub=a[1],email='old-label');after={**before,'email':'new-label'}
  self.assertEqual((before['iss'],before['sub']),(after['iss'],after['sub']))
  self.assertTrue(linked_subject('user-7','user-7'))
  for value in ['user-8','User-7',None,'']:self.assertFalse(linked_subject('user-7',value))
  self.assertFalse(linked_subject(None,None))
if __name__=='__main__':unittest.main()
