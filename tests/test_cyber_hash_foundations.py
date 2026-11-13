"""Public byte fixtures and RFC4231 vectors only; no real keys or external services."""
import pathlib,gzip,json,unittest,hashlib,hmac,base64,binascii
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/cyber/foundations.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/cyber-hash-foundations.json.gz').read_bytes()))
IDS=['cyber-hash-encrypt','cyber-v09-troubleshooting-lab-hashing-vs-encryption','cyber-v09-misconception-clinic-hashing-vs-encryption','cyber-v09-decision-lab-hashing-vs-encryption','cyber-v10-verification-lab-hashing-vs-encryption','cyber-v10-counterexample-lab-hashing-vs-encryption']
SOURCES=['https://docs.python.org/3/library/hashlib.html','https://docs.python.org/3/library/hashlib.html','https://docs.python.org/3/library/base64.html','https://docs.python.org/3/library/hmac.html','https://www.rfc-editor.org/rfc/rfc4231','https://docs.python.org/3/library/hashlib.html']
SHA_ABC='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
RFC1='b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7'
RFC2='5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843'
class HashEvidence(unittest.TestCase):
 def claim(self,i,*values):
  t=' '.join(D[IDS[i]]['reasoningSteps'])
  for v in values:self.assertIn(v,t)
 def test_exact_scope(self):
  checkpoint=json.loads(gzip.decompress((R/'tests/baselines/base64-format-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(B),list(checkpoint));self.assertEqual(list(checkpoint),list(D));self.assertEqual(len(D),94)
  for k in IDS:self.assertEqual(D[k],checkpoint[k],k)
  for k in B:
   diff=sorted(f for f in set(B[k])|set(checkpoint[k]) if B[k].get(f)!=checkpoint[k].get(f))
   self.assertEqual(diff,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_structure_source_boundary(self):
  for i,k in enumerate(IDS):
   x=D[k];self.assertNotIn('mean, why does it matter',x['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(x[f]),6);self.assertEqual(len(set(x[f])),6)
   self.assertIn(SOURCES[i],x['reasoningSteps'][-1]);self.assertIn('public synthetic or published test fixtures',x['reasoningSteps'][-1])
 def test_sha_representation(self):
  raw=hashlib.sha256(b'abc').digest();hexed=hashlib.sha256(b'abc').hexdigest()
  self.assertEqual(hexed,SHA_ABC);self.assertEqual(len(raw),32);self.assertEqual(len(hexed),64)
  self.assertEqual(bytes.fromhex(hexed),raw);self.assertNotEqual(raw,hashlib.sha256(b'abd').digest())
  self.claim(0,SHA_ABC,'32 bytes','64 characters','does not identify the sender','password-storage')
 def test_exact_bytes_and_chunking(self):
  variants=[bytes([97,98,99]),bytes([97,98,99,10]),bytes([97,98,99,13,10])]
  self.assertEqual(list(map(len,variants)),[3,4,5]);self.assertEqual(len({hashlib.sha256(v).digest() for v in variants}),3)
  obj=hashlib.sha256();obj.update(b'ab');obj.update(b'c');self.assertEqual(obj.hexdigest(),SHA_ABC)
  separate=hashlib.sha256(b'ab').hexdigest()+hashlib.sha256(b'c').hexdigest()
  self.assertEqual(len(separate),128);self.assertNotEqual(separate,SHA_ABC)
  self.claim(1,'three bytes','four','five','128 hex characters','canonical form')
 def test_base64_not_authentication(self):
  self.assertEqual(base64.b64encode(b'hello'),b'aGVsbG8=')
  self.assertEqual(base64.b64decode(b'aGVsbG8=',validate=True),b'hello')
  self.assertEqual(base64.b64decode(b'aGVsbG8h',validate=True),b'hello!')
  with self.assertRaises(binascii.Error):base64.b64decode(b'aGVsbG8=!',validate=True)
  self.claim(2,'aGVsbG8=','aGVsbG8h','without any secret key','input-format validation')
 def test_hmac_message_key_and_replay(self):
  key=b'PUBLIC-TEACHING-KEY-NOT-FOR-AUTH';message=b'public demo message'
  tag=hmac.digest(key,message,'sha256')
  verify=lambda k,m,t:hmac.compare_digest(hmac.digest(k,m,'sha256'),t)
  self.assertTrue(verify(key,message,tag))
  self.assertFalse(verify(key,b'public demo messagf',tag))
  self.assertFalse(verify(b'OTHER-PUBLIC-KEY',message,tag))
  self.assertTrue(verify(key,message,tag)) # bare verification has no replay state
  self.claim(3,'hmac.compare_digest','still verify','does not encrypt','shared key')
 def test_independent_rfc4231_vectors(self):
  key=bytes([0x0b])*20;msg=b'Hi There';self.assertEqual(len(key),20);self.assertEqual(len(msg),8)
  self.assertEqual(hmac.new(key,msg,hashlib.sha256).hexdigest(),RFC1)
  wrong=b'0b'*20;self.assertEqual(len(wrong),40);self.assertNotEqual(hmac.digest(wrong,msg,'sha256').hex(),RFC1)
  self.assertEqual(hmac.digest(b'Jefe',b'what do ya want for nothing?','sha256').hex(),RFC2)
  self.claim(4,RFC1,RFC2,'20-byte key','40 bytes','not overall protocol security')
 def test_untrusted_reference_counterexample(self):
  first,second=b'version=1',b'version=2';trusted=hashlib.sha256(first).digest();replacement=hashlib.sha256(second).digest()
  self.assertNotEqual(trusted,replacement)
  self.assertTrue(hmac.compare_digest(hashlib.sha256(second).digest(),replacement))
  self.assertFalse(hmac.compare_digest(hashlib.sha256(second).digest(),trusted))
  self.claim(5,'does not require finding a hash collision','separately trusted','whether its contents are safe')
if __name__=='__main__':unittest.main()
