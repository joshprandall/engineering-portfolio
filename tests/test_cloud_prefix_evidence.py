"""Offline IPv4 arithmetic and exact content scope; no socket or configuration calls."""
import gzip,json,pathlib,unittest,ipaddress as ip
ROOT=pathlib.Path(__file__).resolve().parents[1]
CURRENT=json.loads((ROOT/'deep-learning/cloud/networking.json').read_bytes())
BASE=json.loads(gzip.decompress((ROOT/'tests/baselines/cloud-networking-prefixes.json.gz').read_bytes()))
SUFFIXES=['v05-cidr-prefixes-and-address-aggregation','v07-cidr-prefix-length','v09-recall-drill-cidr-prefix-length','v09-worked-example-cidr-prefixes-and-address-aggregation','v10-mistake-hunt-cidr-prefix-length','v10-measurement-lab-cidr-prefixes-and-address-aggregation','v10-field-note-documentation-ipv4-networks','v10-diagnostic-lab-documentation-only-ipv4-ranges']
IDS=['cloud-'+s for s in SUFFIXES]
N=ip.ip_network;A=ip.ip_address
class PrefixEvidence(unittest.TestCase):
 def claims(self,i,*values):
  text=' '.join(CURRENT[IDS[i]]['reasoningSteps'])
  for v in values:self.assertIn(v,text)
 def test_exact_scope(self):
  checkpoint=json.loads(gzip.decompress((ROOT/'tests/baselines/ipv6-prefix-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(BASE),list(checkpoint));self.assertEqual(list(checkpoint),list(CURRENT));self.assertEqual(len(CURRENT),199)
  for key in IDS:self.assertEqual(CURRENT[key],checkpoint[key],key)
  for key in BASE:
   fields=sorted(k for k in set(BASE[key])|set(checkpoint[key]) if BASE[key].get(k)!=checkpoint[key].get(k))
   self.assertEqual(fields,['essentialQuestion','labPlan','reasoningSteps'] if key in IDS else [],key)
 def test_structure_and_source(self):
  for i,key in enumerate(IDS):
   x=CURRENT[key];self.assertNotIn('mean, why does it matter',x['essentialQuestion'])
   for field in ['reasoningSteps','labPlan']:self.assertEqual(len(x[field]),6);self.assertEqual(len(set(x[field])),6)
   self.assertIn('https://www.rfc-editor.org/rfc/rfc'+('5737' if i>=6 else '4632'),x['reasoningSteps'][-1])
 def test_exact_aligned_aggregate(self):
  a,b=N('192.0.2.0/26'),N('192.0.2.64/26');result=list(ip.collapse_addresses([a,b]))
  self.assertEqual(result,[N('192.0.2.0/25')]);self.assertEqual(a.num_addresses,64)
  self.assertEqual(set(a)|set(b),set(result[0]));self.assertEqual(result[0].num_addresses,128)
  self.claims(0,'192.0.2.0/25','128 addresses','64 addresses')
 def test_mask_and_strictness(self):
  with self.assertRaises(ValueError):N('192.0.2.130/26')
  n=N('192.0.2.130/26',strict=False)
  self.assertEqual(str(n),'192.0.2.128/26');self.assertEqual(str(n.netmask),'255.255.255.192')
  self.assertEqual(130&192,128);self.assertEqual(str(n.broadcast_address),'192.0.2.191')
  self.assertNotIn(A('192.0.2.192'),n);self.assertEqual(n.num_addresses,64)
  self.claims(1,'192.0.2.128/26','255.255.255.192','64 addresses')
 def test_children(self):
  parent=N('192.0.2.0/24');children=list(parent.subnets(new_prefix=27))
  self.assertEqual(len(children),8);self.assertEqual([int(n.network_address)%256 for n in children],[0,32,64,96,128,160,192,224])
  union=set()
  for n in children:self.assertFalse(union&set(n));union.update(n);self.assertEqual(n.num_addresses,32)
  self.assertEqual(union,set(parent));self.claims(2,'8 children','32 addresses','256 addresses')
 def test_adjacent_not_aligned(self):
  a,b=N('192.0.2.64/26'),N('192.0.2.128/26');self.assertNotEqual(a.supernet(),b.supernet())
  self.assertEqual(list(ip.collapse_addresses([a,b])),[a,b])
  cover=a.supernet(new_prefix=24);union=set(a)|set(b)
  self.assertEqual(len(union),128);self.assertEqual(len(set(cover)-union),128)
  self.claims(3,'192.0.2.0/24','256 addresses','adds 128 addresses')
 def test_prefix_boundary_counts(self):
  n=N('192.0.2.129/25',strict=False);self.assertEqual(str(n),'192.0.2.128/25')
  self.assertEqual(str(n.broadcast_address),'192.0.2.255');self.assertEqual(n.num_addresses,128)
  self.assertEqual(N('192.0.2.129/32').num_addresses,1)
  self.assertEqual(N('0.0.0.0/0').num_addresses,2**32)
  self.claims(4,'128 addresses','1 address','4,294,967,296')
 def test_overlapping_inventory(self):
  a,b,c=N('192.0.2.0/25'),N('192.0.2.64/26'),N('192.0.2.128/26')
  self.assertTrue(b.subnet_of(a));self.assertEqual(len(set(a)|set(b)),128)
  union=set(a)|set(b)|set(c);self.assertEqual(len(union),192)
  self.assertEqual(list(ip.collapse_addresses([a,b,c])),[a,c]);self.assertEqual(len(set(N('192.0.2.0/24'))-union),64)
  self.claims(5,'128 addresses','192 distinct addresses','add 64 addresses')
 def test_documentation_membership(self):
  blocks=list(map(N,['192.0.2.0/24','198.51.100.0/24','203.0.113.0/24']))
  for value in ['192.0.2.17','198.51.100.200','203.0.113.9']:self.assertTrue(any(A(value) in n for n in blocks))
  for value in ['192.0.3.17','198.51.101.200','203.0.114.9']:self.assertFalse(any(A(value) in n for n in blocks))
  self.claims(6,'192.0.2.0/24','198.51.100.0/24','203.0.113.0/24','not for local-use')
 def test_documentation_supernet_overreach(self):
  exact=N('192.0.2.0/24');broad=N('192.0.2.0/23')
  self.assertEqual(exact.num_addresses,256);self.assertEqual(broad.num_addresses,512)
  self.assertEqual(str(broad.broadcast_address),'192.0.3.255')
  self.assertEqual(set(broad)-set(exact),set(N('192.0.3.0/24')))
  self.assertIn(A('192.0.3.10'),broad);self.assertNotIn(A('192.0.3.10'),exact)
  self.claims(7,'256 addresses','512','192.0.3.255','192.0.3.0/24')
if __name__=='__main__':unittest.main()
