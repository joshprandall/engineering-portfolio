import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cloud-v06-lab-schedule-a-kubernetes-pod","cloud-v09-practical-lab-schedule-a-kubernetes-pod","cloud-v09-worked-example-schedule-a-kubernetes-pod","cloud-v10-evidence-reading-schedule-a-kubernetes-pod"]
def selector(labels,required):return all(k in labels and labels[k]==v for k,v in required.items())
def affinity(labels,terms):
 if not terms or any(not term for term in terms):raise ValueError('nonempty terms only')
 return any(all(k in labels and labels[k] in values for k,values in term) for term in terms)
class NodeAffinityLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/node-affinity-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cloud/lab.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),90)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/cloud/lab.json').read_bytes())
  for k,w in zip(IDS,['does not guarantee','not a complete','both must','not a cluster']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn('https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/',t);self.assertIn(w,t)
 def test_selector_same_node(self):
  nodes=[{'os':'linux','disk':'hdd'},{'os':'windows','disk':'ssd'},{'os':'linux','disk':'ssd'},{'os':'linux'}]
  self.assertEqual([selector(x,{'os':'linux','disk':'ssd'}) for x in nodes],[False,False,True,False])
 def test_term_boolean_structure(self):
  terms=[[('zone',{'east'}),('disk',{'ssd'})],[('zone',{'west'}),('gpu',{'yes'})]]
  for zone,disk,gpu in itertools.product(['east','west'],['ssd','hdd'],['yes','no']):
   labels=dict(zone=zone,disk=disk,gpu=gpu);expected=(zone=='east' and disk=='ssd') or (zone=='west' and gpu=='yes')
   self.assertEqual(affinity(labels,terms),expected)
  mixed=dict(zone='east',disk='hdd',gpu='yes');self.assertFalse(affinity(mixed,terms))
  self.assertTrue(any(mixed[k] in vs for term in terms for k,vs in term))
  for bad in [[],[[]]]:
   with self.assertRaises(ValueError):affinity({},bad)
 def test_preferences_after_filter(self):
  nodes={'A':dict(os='windows',disk='ssd',zone='east'),'B':dict(os='linux',disk='hdd',zone='east'),'C':dict(os='linux',disk='ssd',zone='west')}
  terms=[[('zone',{'east'})]]
  eligible={k:(80 if v['disk']=='ssd' else 0) for k,v in nodes.items() if selector(v,{'os':'linux'}) and affinity(v,terms)}
  self.assertEqual(eligible,{'B':0})
 def test_schedule_vs_existing_assignment(self):
  required=[[('zone',{'east'})]];labels={'zone':'east'};assignment=None
  if affinity(labels,required):assignment='node-A'
  self.assertEqual(assignment,'node-A');labels['zone']='west'
  self.assertFalse(affinity(labels,required));self.assertEqual(assignment,'node-A')
if __name__=='__main__':unittest.main()
