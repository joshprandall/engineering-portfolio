import unittest,pathlib,json,gzip,ipaddress as ip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cloud-ipv6-basics","cloud-v07-ipv6-128-bit-addresses","cloud-v10-worked-walkthrough-ipv6-128-bit-addresses","cloud-v10-measurement-lab-ipv6-basics-bigger-addresses-different-habits"]
A=ip.IPv6Address;N=ip.IPv6Network
class IPv6PrefixBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/ipv6-prefix-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cloud/networking.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),199)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/cloud/networking.json').read_bytes())
  for k in IDS:
   self.assertIn('https://docs.python.org/3.13/library/ipaddress.html',' '.join(d[k]['reasoningSteps']))
   self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_normalization(self):
  long='2001:0db8:0000:0000:0000:0000:0000:0001';short='2001:db8::1'
  a,b=A(long),A(short);self.assertNotEqual(long,short);self.assertEqual(a,b);self.assertEqual(int(a),int(b));self.assertEqual(a.packed,b.packed);self.assertEqual(len(a.packed),16)
  self.assertEqual(a.compressed,short);self.assertEqual(b.exploded,long)
  for invalid in ['2001::db8::1','2001:db8:10000::1']:
   with self.assertRaises(ValueError):A(invalid)
 def test_interface(self):
  text='2001:db8:1234:5678::abcd/64'
  with self.assertRaises(ValueError):N(text)
  interface=ip.IPv6Interface(text);n=N(text,strict=False)
  self.assertEqual(str(interface.ip),'2001:db8:1234:5678::abcd');self.assertEqual(str(n),'2001:db8:1234:5678::/64');self.assertEqual(n,interface.network)
  self.assertEqual(int(n.network_address)&((1<<64)-1),0);self.assertEqual(int(interface.ip)>>64,int(n.network_address)>>64)
  self.assertEqual(n.num_addresses,18446744073709551616);self.assertEqual(n.num_addresses,1<<64)
 def test_partition(self):
  parent=N('2001:db8:1200::/62');children=list(parent.subnets(new_prefix=64))
  self.assertEqual(list(map(str,children)),['2001:db8:1200::/64','2001:db8:1200:1::/64','2001:db8:1200:2::/64','2001:db8:1200:3::/64'])
  for child in children:self.assertTrue(child.subnet_of(parent));self.assertEqual(child.num_addresses,1<<64)
  for a,b in zip(children,children[1:]):self.assertEqual(int(a[-1])+1,int(b.network_address))
  for a,b in itertools.combinations(children,2):self.assertFalse(a.overlaps(b))
  self.assertEqual(sum(x.num_addresses for x in children),parent.num_addresses);self.assertEqual(parent.num_addresses,1<<66);self.assertEqual(list(ip.collapse_addresses(children)),[parent])
 def test_membership(self):
  n=N('2001:db8:1::/48');yes='2001:db8:1::abcd';no='2001:db8:10::1'
  self.assertTrue(yes.startswith('2001:db8:1'));self.assertTrue(no.startswith('2001:db8:1'))
  self.assertIn(A(yes),n);self.assertNotIn(A(no),n);self.assertIn(A(A(yes).exploded),n)
  self.assertIn(n.network_address,n);self.assertIn(n[-1],n);self.assertNotIn(A(int(n[-1])+1),n)
if __name__=='__main__':unittest.main()
