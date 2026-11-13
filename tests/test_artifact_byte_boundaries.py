import unittest,pathlib,json,gzip,hashlib
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-ci-cd","software-v09-decision-lab-ci-and-cd-shortening-the-feedback-loop","software-v09-quick-reference-ci-and-cd-shortening-the-feedback-loop","software-v10-compare-contrast-ci-and-cd-shortening-the-feedback-loop"]
def digest(b):return hashlib.sha256(b).hexdigest()
def framed(fields):return b''.join(len(f).to_bytes(4,'big')+f for f in fields)
class ArtifactByteBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/artifact-byte-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/devops.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),145)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/software/devops.json').read_bytes())
  for k in IDS:
   self.assertIn('https://docs.python.org/3.13/library/hashlib.html',' '.join(d[k]['reasoningSteps']))
   self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_exact_bytes(self):
  payloads=[b'alpha\n',b'alpha\r\n',b'alpha']
  self.assertEqual(list(map(len,payloads)),[6,7,5]);self.assertEqual(len(set(map(digest,payloads))),3)
 def test_streaming(self):
  expected='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  self.assertEqual(digest(b'abc'),expected)
  for chunks in [(b'a',b'bc'),(b'ab',b'c'),(b'',b'abc',b'')]:
   h=hashlib.sha256()
   for chunk in chunks:h.update(chunk)
   self.assertEqual(h.hexdigest(),expected)
  data=bytes(range(256))*3
  for size in [1,7,64,1000]:
   h=hashlib.sha256()
   for i in range(0,len(data),size):h.update(data[i:i+size])
   self.assertEqual(h.hexdigest(),digest(data))
  self.assertNotEqual(digest(b'ac'),expected);self.assertNotEqual(digest(b'bca'),expected)
 def test_semantics(self):
  a=b'{"a":1,"b":2}';b=b'{ "b": 2, "a": 1 }'
  self.assertEqual(json.loads(a),json.loads(b));self.assertNotEqual(a,b);self.assertNotEqual(digest(a),digest(b))
  normalize=lambda x:json.dumps(json.loads(x),sort_keys=True,separators=(',',':')).encode()
  self.assertEqual(normalize(a),normalize(b));self.assertEqual(normalize(a),a)
 def test_framing(self):
  a=(b'ab',b'c');b=(b'a',b'bc')
  self.assertNotEqual(a,b);self.assertEqual(b''.join(a),b''.join(b));self.assertEqual(digest(b''.join(a)),digest(b''.join(b)))
  self.assertEqual(framed(a).hex(),'0000000261620000000163');self.assertEqual(framed(b).hex(),'0000000161000000026263')
  self.assertNotEqual(framed(a),framed(b));self.assertNotEqual(digest(framed(a)),digest(framed(b)))
  self.assertNotEqual(framed((b'',b'\0')),framed((b'\0',b'')))
if __name__=='__main__':unittest.main()
