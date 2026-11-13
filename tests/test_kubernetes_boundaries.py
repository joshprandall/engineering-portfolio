"""Offline Kubernetes contract models, not client-library or cluster integration tests."""
import pathlib,json,gzip,unittest,itertools
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/cloud/kubernetes.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/kubernetes-boundaries.json.gz').read_bytes()))
IDS=["cloud-v09-decision-lab-kubernetes-dns-discovery","cloud-v09-troubleshooting-lab-kubernetes-service-abstraction","cloud-v09-quick-reference-kubernetes-serviceaccount-namespace-scope","cloud-v09-misconception-clinic-required-vs-preferred-node-affinity","cloud-v09-quick-reference-required-vs-preferred-node-affinity","cloud-v09-troubleshooting-lab-required-vs-preferred-node-affinity"]
REFS=["https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/","https://kubernetes.io/docs/concepts/services-networking/service/","https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/","https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/","https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/","https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/"]
class KubernetesBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  self.assertEqual(list(D),list(B));self.assertEqual(len(D),92)
  for k in B:
   self.assertEqual(sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_dns_answer_sets(self):
  def answers(cluster_ip,ready_ips):return set(ready_ips) if cluster_ip is None else {cluster_ip}
  pods=['192.0.2.10','192.0.2.11'];vip='192.0.2.100'
  self.assertEqual(answers(vip,pods),{vip})
  self.assertEqual(answers(None,pods),set(pods))
  self.assertEqual(answers(None,list(reversed(pods))),set(pods))
  changed=['192.0.2.10','192.0.2.12']
  self.assertEqual(answers(vip,changed),{vip});self.assertNotEqual(answers(None,changed),set(pods))
  name=lambda svc,domain:'.'.join([svc,'demo','svc',domain])
  self.assertEqual(name('api','cluster.local'),'api.demo.svc.cluster.local')
  self.assertEqual(name('api-headless','example.test'),'api-headless.demo.svc.example.test')
  self.claim(0,'ready','192.0.2.100','sets','configurable')
 def test_named_numeric_default_port(self):
  pods={'A':{'http':8080},'B':{'http':9090}}
  def resolve(target,port,pod):
   if target is None:return port
   return pod[target] if isinstance(target,str) else target
  expected=[('http',{'A':8080,'B':9090}),(8080,{'A':8080,'B':8080}),(None,{'A':80,'B':80})]
  for target,want in expected:self.assertEqual({k:resolve(target,80,p) for k,p in pods.items()},want)
  self.claim(1,'A:8080','B:9090','does not start a listener')
 def test_automount_precedence(self):
  absent=object()
  def automatic(pod,sa):
   return pod if pod is not absent else sa if sa is not absent else True
  values=[absent,False,True]
  expected=[[True,False,True],[False,False,False],[True,True,True]]
  for i,p in enumerate(values):
   for j,s in enumerate(values):self.assertIs(automatic(p,s),expected[i][j])
  self.claim(2,'three states','takes precedence','does not revoke RBAC')
 def test_selector_and_affinity(self):
  nodes={'A':dict(pool='batch',disk='ssd',zone='east'),'B':dict(pool='batch',disk='hdd',zone='west'),'C':dict(pool='web',disk='ssd',zone='west'),'D':dict(pool='batch',disk='hdd',zone='east')}
  eligible=lambda n:n.get('pool')=='batch' and (n.get('disk')=='ssd' or n.get('zone')=='west')
  self.assertEqual([k for k,n in nodes.items() if eligible(n)],['A','B'])
  self.assertFalse(eligible(dict(disk='ssd',zone='west')))
  for pool,disk,zone in itertools.product(['batch','web'],['ssd','hdd'],['east','west']):
   self.assertEqual(eligible(dict(pool=pool,disk=disk,zone=zone)),pool=='batch' and (disk,zone) in [('ssd','east'),('ssd','west'),('hdd','west')])
  self.claim(3,'A,B','AND','ORed','does not guarantee scheduling')
 def test_preference_raw_scores(self):
  nodes=[('A',True,'ssd','east'),('B',True,'hdd','west'),('C',True,'ssd','west'),('D',False,'ssd','west')]
  def scores(w1,w2):return {n:(w1 if d=='ssd' else 0)+(w2 if z=='west' else 0) for n,ok,d,z in nodes if ok}
  self.assertEqual(scores(70,30),{'A':70,'B':30,'C':100})
  self.assertEqual(scores(30,70),{'A':30,'B':70,'C':100})
  self.assertNotIn('D',scores(70,30))
  feasible=[n for n,ok,_,_ in nodes if ok]
  self.assertEqual({n:0 for n in feasible},{'A':0,'B':0,'C':0})
  self.claim(4,'raw contribution','not present them as final','other scoring')
 def test_ignored_execution_vs_new_schedule(self):
  binding={'pod-old':'A'};labels={'A':'west'}
  eligible=lambda:[n for n,z in labels.items() if z=='west']
  self.assertEqual(eligible(),['A'])
  labels['A']='east'
  self.assertEqual(eligible(),[]);self.assertEqual(binding,{'pod-old':'A'})
  labels['B']='west'
  self.assertEqual(eligible(),['B']);self.assertEqual(binding,{'pod-old':'A'})
  self.claim(5,'does not evict','new Pod','Other mechanisms')
if __name__=='__main__':unittest.main()
