import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cloud-v05-dns-negative-caching","cloud-v09-practical-lab-dns-negative-caching","cloud-v10-confidence-calibration-dns-negative-caching","cloud-v10-scenario-brief-dns-ttl-and-caching"]
URL='https://www.rfc-editor.org/rfc/rfc2308.html'
def lifetime(ttl,minimum):return min(ttl,minimum)
def remaining(received,ttl,now):
 if now<received:raise ValueError('time before receipt')
 return max(0,received+ttl-now)
def key(kind,name,qtype,qclass):
 if kind=='NXDOMAIN':return (kind,name,qclass)
 if kind=='NODATA':return (kind,name,qtype,qclass)
 raise ValueError('not a classified negative answer')
class DnsNegativeLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/dns-negative-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cloud/networking.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),199)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/cloud/networking.json').read_bytes())
  for k,phrase in zip(IDS,['not a complete modern','not a DNS packet classifier','excludes stale-answer','zero transit delay']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t)
 def test_soa_lifetime(self):
  pairs=[(900,300),(300,900),(300,300),(0,300),(300,0)]
  self.assertEqual([lifetime(*p) for p in pairs],[300,300,300,0,0])
  for a,b in itertools.product([0,1,60,300,900],repeat=2):
   self.assertEqual(lifetime(a,b),lifetime(b,a));self.assertLessEqual(lifetime(a,b),a);self.assertLessEqual(lifetime(a,b),b)
 def test_cache_keys(self):
  args=('node.example.','A','IN')
  for kind,same in [('NXDOMAIN',True),('NODATA',False)]:
   original=key(kind,*args)
   self.assertEqual(original==key(kind,'node.example.','AAAA','IN'),same)
   self.assertNotEqual(original,key(kind,'other.example.','A','IN'))
   self.assertNotEqual(original,key(kind,'node.example.','A','CH'))
  self.assertNotEqual(key('NXDOMAIN',*args),key('NODATA',*args))
  with self.assertRaises(ValueError):key('timeout',*args)
 def test_expiry(self):
  times=[100,399,400,401];values=[remaining(100,300,t) for t in times]
  self.assertEqual(values,[300,1,0,0]);self.assertEqual([v>0 for v in values],[True,True,False,False])
  values=[remaining(100,300,t) for t in range(100,402)]
  self.assertEqual(values,sorted(values,reverse=True))
  with self.assertRaises(ValueError):remaining(100,300,99)
 def test_forwarded_countdown(self):
  ttl=remaining(100,300,220);self.assertEqual(ttl,180);self.assertEqual(220+ttl,400)
  self.assertEqual(220+300,520);self.assertEqual(520-400,120)
  for t in range(100,400):self.assertEqual(t+remaining(100,300,t),400)
  second=remaining(220,ttl,300);self.assertEqual(second,100);self.assertEqual(300+second,400)
  self.assertEqual(remaining(300,second,400),0)
if __name__=='__main__':unittest.main()
