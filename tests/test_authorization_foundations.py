"""Synthetic policy truth tables, not deployed authorization validation."""
import pathlib,json,gzip,unittest,itertools
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/cyber/identity.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/authorization-foundations.json.gz').read_bytes()))
IDS=["cyber-authn-authz","cyber-rbac","cyber-least-privilege","cyber-v08-evidence-lab-authorization-deny-by-default","cyber-v08-evidence-lab-authorization-every-request","cyber-v10-counterexample-lab-least-privilege-as-an-engineering-discipline"]
class AuthorizationFoundations(unittest.TestCase):
 def test_scope(self):
  checkpoint=json.loads(gzip.decompress((R/'tests/baselines/oidc-claim-labs.json.gz').read_bytes()))
  self.assertEqual(list(B),list(D));self.assertEqual(len(D),133)
  for k in IDS:self.assertEqual(D[k],checkpoint[k],k)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(checkpoint[k]) if B[k].get(f)!=checkpoint[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources_and_limits(self):
  for k in IDS:
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn('/Authorization_Cheat_Sheet.html',D[k][f][-1])
   self.assertIn('no credentials, accounts or permissions are changed',D[k]['labPlan'][-1])
 def test_authentication_is_not_permission(self):
  roles={'anonymous':set(),'reader':{'read'},'editor':{'read','write'}}
  matrix=[[action in roles[user] for action in ['read','write','delete']] for user in ['anonymous','reader','editor']]
  self.assertEqual(matrix,[[False,False,False],[True,False,False],[True,True,False]])
  self.assertIn('does not create the missing permission',' '.join(D[IDS[0]]['reasoningSteps']))
 def test_additive_roles_and_removal(self):
  roles={'viewer':{'read'},'contributor':{'read','comment'}}
  def effective(names):return set().union(*(roles.get(n,set()) for n in names))
  self.assertEqual(effective([]),set());self.assertEqual(effective(['viewer']),{'read'})
  self.assertEqual(effective(['contributor']),{'read','comment'});self.assertEqual(effective(['viewer','contributor']),{'read','comment'})
  self.assertEqual(effective(['viewer','viewer']),{'read'});self.assertEqual(effective(['unknown']),set())
  self.assertNotIn('delete',effective(['viewer','contributor']))
 def test_least_privilege_differences(self):
  required={'read','comment'};granted={'read','write','delete'}
  self.assertEqual(granted-required,{'write','delete'});self.assertEqual(required-granted,{'comment'})
  same_count={'read','write'};self.assertEqual(len(same_count),len(required));self.assertEqual(same_count-required,{'write'});self.assertEqual(required-same_count,{'comment'})
  self.assertEqual(set()-required,set());self.assertEqual(required-set(),required);self.assertEqual(required-required,set())
 def test_default_deny_complete_matrix(self):
  grants={('reader','read'),('editor','read'),('editor','write')}
  users=['reader','editor','guest'];actions=['read','write','delete','export']
  actual=[[((u,a) in grants) for a in actions] for u in users]
  self.assertEqual(actual,[[True,False,False,False],[True,True,False,False],[False,False,False,False]])
  self.assertEqual(sum(map(sum,actual)),3)
  self.assertTrue('write'!='delete');self.assertNotIn(('reader','write'),grants)
 def test_revocation_rechecks_current_state(self):
  request=('u1','report7','read');grants={request};cached=request in grants
  self.assertTrue(cached);self.assertNotIn(('u1','report8','read'),grants);self.assertNotIn(('u1','report7','write'),grants)
  grants.remove(request);self.assertFalse(request in grants);self.assertTrue(cached)
  self.assertIn('immediate policy visibility',' '.join(D[IDS[4]]['reasoningSteps']))
 def test_tenant_conjunction_exhaustive(self):
  cases=list(itertools.product(['editor','viewer'],['A','B'],['write','delete']))
  allowed=[(role,tenant,action) for role,tenant,action in cases if role=='editor' and tenant=='A' and action=='write']
  self.assertEqual(len(cases),8);self.assertEqual(allowed,[('editor','A','write')])
  incorrect=[case for case in cases if case[0]=='editor'];self.assertEqual(len(incorrect),4);self.assertIn(('editor','B','write'),incorrect);self.assertNotIn(('editor','B','write'),allowed)
if __name__=='__main__':unittest.main()
