import unittest,pathlib,json,gzip
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cloud-v06-lab-learn-a-switch-mac-table","cloud-v09-evidence-verification-la-learn-a-switch-mac-table","cloud-v09-recall-drill-learn-a-switch-mac-table","cloud-v09-evidence-verificat-learn-a-switch-mac-table-2"]
PORTS={10:{'p1','p2','p3'},20:{'q1','q2'}}
def frame(table,vlan,ingress,src,dst,drop_unknown=False):
 eligible=PORTS[vlan]
 if ingress not in eligible:raise ValueError('ingress outside VLAN')
 table[(vlan,src)]=ingress
 port=table.get((vlan,dst))
 if port is not None:return {port} if port in eligible and port!=ingress else set()
 return set() if drop_unknown else eligible-{ingress}
class SwitchLabBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/switch-lab-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cloud/lab.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),90)
  for k in b:
   changed={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/cloud/lab.json').read_bytes())
  for k in IDS:
   self.assertIn('https://www.juniper.net/documentation/us/en/software/junos/vpn-l2/security-services/topics/topic-map/understanding-and-preventing-unknown-unicast-forwarding.html',' '.join(d[k]['reasoningSteps']))
   self.assertIn('model',' '.join(d[k]['reasoningSteps']).lower())
 def test_source_learning(self):
  t={};self.assertEqual(frame(t,10,'p1','A','B'),{'p2','p3'})
  self.assertEqual(t,{(10,'A'):'p1'});self.assertNotIn((10,'B'),t)
  self.assertEqual(frame(t,10,'p2','B','A'),{'p1'});self.assertEqual(t[(10,'B')],'p2')
 def test_unknown_to_known(self):
  t={};before=frame(t,10,'p1','A','B');frame(t,10,'p2','B','A');after=frame(t,10,'p1','A','B')
  self.assertEqual(before,{'p2','p3'});self.assertEqual(after,{'p2'});self.assertNotIn('p1',before|after)
 def test_vlan_scope(self):
  t={};frame(t,10,'p2','B','A');self.assertNotIn((20,'B'),t)
  out=frame(t,20,'q1','C','B');self.assertEqual(out,{'q2'});self.assertTrue(out<=PORTS[20]);self.assertFalse(out&PORTS[10])
  with self.assertRaises(ValueError):frame(t,20,'p1','A','B')
 def test_drop_still_learns(self):
  baseline={};drop={};self.assertEqual(frame(baseline,10,'p1','A','B'),{'p2','p3'})
  self.assertEqual(frame(drop,10,'p1','A','B',True),set());self.assertEqual(drop,baseline)
  drop[(10,'B')]='p2';self.assertEqual(frame(drop,10,'p1','A','B',True),{'p2'})
if __name__=='__main__':unittest.main()
