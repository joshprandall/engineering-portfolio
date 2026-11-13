import unittest,pathlib,json,gzip,base64 as b,binascii
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-v09-troubleshooting-la-hashing-vs-encryption-2","cyber-v09-misconception-clin-hashing-vs-encryption-2","cyber-v09-decision-lab-hashing-vs-encryption-2","cyber-v09-troubleshooting-la-hashing-vs-encryption-3"]
REFS=["https://docs.python.org/3.13/library/base64.html","https://docs.python.org/3.13/library/base64.html","https://www.rfc-editor.org/rfc/rfc4648","https://docs.python.org/3.13/library/base64.html"]
class Base64FormatBoundaries(unittest.TestCase):
 def test_scope(self):
  old=json.loads(gzip.decompress((R/'tests/baselines/base64-format-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/foundations.json').read_bytes())
  self.assertEqual(list(old),list(d));self.assertEqual(len(d),94)
  for k in old:
   fields={f for f in set(old[k])|set(d[k]) if old[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/cyber/foundations.json').read_bytes())
  for k,url in zip(IDS,REFS):
   self.assertIn(url,' '.join(d[k]['reasoningSteps']));self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_alphabets(self):
  raw=bytes.fromhex('fbff');self.assertEqual(b.b64encode(raw),b'+/8=');self.assertEqual(b.urlsafe_b64encode(raw),b'-_8=')
  self.assertEqual(b.b64decode(b'+/8=',validate=True),raw);self.assertEqual(b.urlsafe_b64decode(b'-_8='),raw)
  with self.assertRaises(binascii.Error):b.b64decode(b'-_8=',validate=True)
  self.assertEqual(b.b64decode(b'-_8=',altchars=b'-_',validate=True),raw)
 def test_strictness(self):
  for text in [b'Zm!9v',b'Zm\n9v']:
   self.assertEqual(b.b64decode(text),b'foo')
   with self.assertRaises(binascii.Error):b.b64decode(text,validate=True)
  self.assertEqual(b.b64decode(b'Zm9v',validate=True),b'foo')
 def test_canonical_pad_bits(self):
  def canonical(text):
   raw=b.b64decode(text,validate=True)
   if b.b64encode(raw)!=text:raise ValueError('not canonical standard padded Base64')
   return raw
  for text in [b'Zg==',b'Zh==']:
   self.assertEqual(b.b64decode(text,validate=True),b'f');self.assertEqual(b.b64encode(b.b64decode(text,validate=True)),b'Zg==')
  self.assertEqual(canonical(b'Zg=='),b'f')
  with self.assertRaises(ValueError):canonical(b'Zh==')
  for raw in [b'',b'f',b'fo',b'foo',bytes(range(256))]:self.assertEqual(canonical(b.b64encode(raw)),raw)
 def test_binary_and_text(self):
  raw=b.b64decode(b'/w==',validate=True);self.assertEqual(raw,bytes.fromhex('ff'))
  with self.assertRaises(UnicodeDecodeError):raw.decode('utf8')
  text='caf\u00e9';encoded=b.b64encode(text.encode('utf8'));self.assertEqual(encoded,b'Y2Fmw6k=');self.assertEqual(b.b64decode(encoded,validate=True).decode('utf8'),text)
if __name__=='__main__':unittest.main()
