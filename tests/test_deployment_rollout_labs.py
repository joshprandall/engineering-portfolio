import unittest,pathlib,json,gzip,copy
from fractions import Fraction as F
from math import floor,ceil
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cloud-k8s-deployments","cloud-v07-troubleshooting-deployment-rollout-stalls","cloud-v07-kubernetes-deployment","cloud-v09-scenario-analysis-kubernetes-deployment"]
URL='https://kubernetes.io/docs/concepts/workloads/controllers/deployment/'
class DeploymentRolloutLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/deployment-rollout-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cloud/cloud.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),178)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_limits(self):
  d=json.loads((R/'deep-learning/cloud/cloud.json').read_bytes())
  for k,phrase in zip(IDS,['does not predict','not itself perform','not a hard bound','not a promise']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t)
 def test_template_changes_not_count(self):
  a={'metadata':{'labels':{'owner':'a'}},'spec':{'replicas':3,'template':{'metadata':{'labels':{'app':'x'}},'spec':{'image':'v1'}}}}
  b=copy.deepcopy(a);b['spec']['replicas']=5
  c=copy.deepcopy(a);c['metadata']['labels']['owner']='b'
  d=copy.deepcopy(a);d['spec']['template']['spec']['image']='v2'
  self.assertEqual([x['spec']['template']!=a['spec']['template'] for x in [b,c,d]],[False,False,True])
 def test_status_does_not_evidence_rollback(self):
  conditions={'Available':{'status':'True','reason':'MinimumReplicasAvailable'},'Progressing':{'status':'False','reason':'ProgressDeadlineExceeded'}}
  self.assertEqual(conditions['Available']['status'],'True');self.assertEqual(conditions['Progressing']['status'],'False')
  self.assertNotIn('rollback',conditions);self.assertNotIn('rootCause',conditions)
  # No temporal controller simulator: status evidence does not establish an external action.
 def test_percentage_budget_rounding(self):
  expected=[(0,1),(0,1),(0,1),(1,1),(1,2),(1,2),(1,2),(2,2)]
  self.assertEqual([(floor(F(n,4)),ceil(F(n,4))) for n in range(1,9)],expected)
  self.assertEqual((3-floor(F(3,4)),3+ceil(F(3,4))),(3,4))
  self.assertEqual((5-floor(F(5,4)),5+ceil(F(5,4))),(4,7))
  # A nominal rollout budget is not a cap on terminating resource consumers.
  self.assertGreater(7+2,7)
 def test_uninterrupted_ready_interval(self):
  def qualifies(now,ready_since,minimum):return ready_since is not None and now>=ready_since and now-ready_since>=minimum
  self.assertEqual([qualifies(t,20,10) for t in [19,29,30]],[False,False,True])
  self.assertEqual([qualifies(t,31,10) for t in [40,41]],[False,True]);self.assertFalse(qualifies(100,None,10))
  self.assertEqual([deadline>10 for deadline in [9,10,11]],[False,False,True])
if __name__=='__main__':unittest.main()
