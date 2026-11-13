import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cloud-group-policy","cloud-v05-group-policy-objects","cloud-v07-group-policy-processing-scope","cloud-v09-decision-lab-group-policy-processing-scope"]
def combine(rows):
 result={}
 for row in rows:result.update(row)
 return result
def linked(links):
 orders=[order for order,_ in links]
 if len(set(orders))!=len(orders):raise ValueError('duplicate order')
 return combine([row for _,row in sorted(links,key=lambda x:x[0],reverse=True)])
class GroupPolicyBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/group-policy-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cloud/windows-identity.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),117)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources_and_boundaries(self):
  d=json.loads((R/'deep-learning/cloud/windows-identity.json').read_bytes())
  for k,words in zip(IDS,[['default precedence only','absence'],['lowest link-order','unique'],['not implement','does not prove'],['User Configuration','not an actual']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-policy/group-policy-processing',text)
   for word in words:self.assertIn(word,text)
 def test_default_order_and_missing_value(self):
  rows=[{'banner':'L'},{'help':'site-help'},{'banner':'D'},{'banner':'C'}]
  self.assertEqual(combine(rows),{'banner':'C','help':'site-help'})
  self.assertEqual(combine(rows[:-1]+[{}]),{'banner':'D','help':'site-help'})
  self.assertEqual(combine([{'flag':True},{}]),{'flag':True})
  self.assertEqual(combine([{'flag':True},{'flag':False}]),{'flag':False})
 def test_link_order_not_input_order(self):
  links=[(3,{'value':'third'}),(2,{'value':'second'}),(1,{'value':'first'})]
  for order in itertools.permutations(links):self.assertEqual(linked(order),{'value':'first'})
  self.assertEqual(linked([(1,{'value':'third'}),(2,{'value':'second'}),(3,{'value':'first'})]),{'value':'third'})
  with self.assertRaises(ValueError):linked([(1,{}),(1,{})])
 def test_three_applicability_gates(self):
  cases=list(itertools.product([False,True],repeat=3))
  self.assertEqual(sum(all(x) for x in cases),1)
  def applies(enabled,security,wmi=None):return enabled and security and (True if wmi is None else wmi)
  self.assertTrue(applies(True,True));self.assertFalse(applies(True,True,False))
  self.assertFalse(applies(False,True));self.assertFalse(applies(True,False))
 def test_loopback_lists(self):
  user=[{'banner':'personal','userOnly':'retained'}];computer=[{'banner':'kiosk','shared':'yes'}]
  self.assertEqual(combine(user+computer),{'banner':'kiosk','userOnly':'retained','shared':'yes'})
  self.assertEqual(combine(computer),{'banner':'kiosk','shared':'yes'})
  self.assertEqual(combine(user+[]),user[0]);self.assertEqual(combine([]),{})
  self.assertEqual(user,[{'banner':'personal','userOnly':'retained'}]);self.assertEqual(computer,[{'banner':'kiosk','shared':'yes'}])
if __name__=='__main__':unittest.main()
