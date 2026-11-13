"""Pure pedagogical models, not a Kubernetes implementation or cluster test."""
import pathlib,gzip,json,unittest
from fractions import Fraction as F
from math import ceil
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/cloud/cloud.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/cloud-control-foundations.json.gz').read_bytes()))
IDS=['cloud-k8s-resources','cloud-k8s-scheduling','cloud-k8s-probes','cloud-v05-kubernetes-horizontal-autoscaling','cloud-v05-kubernetes-pod-disruption-budgets','cloud-k8s-reconciliation']
SOURCES=['concepts/configuration/manage-resources-containers/','concepts/scheduling-eviction/kube-scheduler/','concepts/configuration/liveness-readiness-startup-probes/','tasks/run-application/horizontal-pod-autoscale/','tasks/run-application/configure-pdb/','concepts/architecture/controller/']
def raw_replicas(current,actual,target):
 if current<0 or actual<0 or target<=0:raise ValueError('Invalid ratio inputs')
 return ceil(F(current)*F(actual)/F(target))
def delta(desired,observed):
 if any(type(v) is not int or v<0 for v in [desired,observed]):raise ValueError('Counts must be nonnegative integers')
 return desired-observed
class CloudControlEvidence(unittest.TestCase):
 def claim(self,i,*values):
  t=' '.join(D[IDS[i]]['reasoningSteps'])
  for v in values:self.assertIn(v,t)
 def test_scope(self):
  self.assertEqual(list(B),list(D));self.assertEqual(len(D),178)
  for key in B:
   fields=sorted(f for f in set(B[key])|set(D[key]) if B[key].get(f)!=D[key].get(f))
   self.assertEqual(fields,['essentialQuestion','labPlan','reasoningSteps'] if key in IDS else [],key)
 def test_structure_sources(self):
  for i,key in enumerate(IDS):
   x=D[key];self.assertNotIn('mean, why does it matter',x['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(x[f]),6);self.assertEqual(len(set(x[f])),6)
   self.assertIn('https://kubernetes.io/docs/'+SOURCES[i],x['reasoningSteps'][-1])
   self.assertIn('No live Kubernetes cluster',x['labPlan'][-1])
 def test_resource_units(self):
  self.assertEqual(F(250+750,1000),1)
  memory=(128+384)*2**20;self.assertEqual(memory,536870912)
  self.assertEqual(512*10**6,512000000);self.assertEqual(memory-512*10**6,24870912)
  self.claim(0,'1000m','536870912','24870912','no init containers','not a complete Pod scheduler')
 def test_filter_before_score(self):
  nodes={'A':(500,2048),'B':(1000,256),'C':(1000,1024)};scores={'A':100,'B':50,'C':10}
  cpu={k for k,(c,m) in nodes.items() if c>=750};memory={k for k,(c,m) in nodes.items() if m>=512}
  self.assertEqual(cpu,{'B','C'});self.assertEqual(memory,{'A','C'});feasible=cpu&memory
  self.assertEqual(feasible,{'C'});self.assertEqual(max(feasible,key=scores.get),'C')
  self.assertEqual({k for k,(c,m) in nodes.items() if c>=1250 and m>=512},set())
  self.claim(1,'only C','1250m','necessary-resource condition')
 def test_probe_counter_not_total(self):
  outcomes=[False,False,True,False,False,False];count=0;trace=[];crossings=[]
  for i,ok in enumerate(outcomes,1):
   count=0 if ok else count+1;trace.append(count)
   if count==3:crossings.append(i)
  self.assertEqual(trace,[1,2,0,1,2,3]);self.assertEqual(crossings,[6])
  total_failure_crossing=next(i for i in range(1,7) if outcomes[:i].count(False)>=3)
  self.assertEqual(total_failure_crossing,4)
  self.claim(2,'observation 6','observation 4','not by itself','does not prove an exact restart time')
 def test_hpa_raw_not_controller(self):
  self.assertEqual(raw_replicas(3,80,50),5);self.assertEqual(raw_replicas(3,20,50),2)
  self.assertEqual(min(4,max(2,raw_replicas(3,80,50))),4)
  self.assertEqual(raw_replicas(3,50,50),3)
  with self.assertRaises(ValueError):raw_replicas(3,80,0)
  self.claim(3,'ceil(3*80/50)=5','ceil(3*20/50)=2','not a promise','missing metrics','stabilization')
 def test_pdb_rounding_and_current_health(self):
  desired_healthy=ceil(7*F(1,2));self.assertEqual(desired_healthy,4)
  self.assertEqual([max(0,h-desired_healthy) for h in [7,5,4,3]],[3,1,0,0])
  unavailable=ceil(7*F(3,10));self.assertEqual(unavailable,3)
  self.assertGreater(F(unavailable,7),F(3,10))
  self.claim(4,'4 desired healthy','headroom drops to 1','42.86%','unhealthyPodEvictionPolicy','involuntary')
 def test_reconcile_observed_count(self):
  self.assertEqual([delta(*pair) for pair in [(3,1),(3,3),(3,2),(1,3)]],[2,0,1,-2])
  self.assertEqual([delta(3,observed) for observed in [1,2,3]],[2,1,0])
  for pair in [(-1,0),(3,-1),(3,1.5),(True,1)]:
   with self.assertRaises(ValueError):delta(*pair)
  self.claim(5,'delta is +2','delta 0','delta is +1','delta -2','not a safe implementation')
if __name__=='__main__':unittest.main()
