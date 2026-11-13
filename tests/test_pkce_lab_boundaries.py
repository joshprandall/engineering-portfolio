import unittest,pathlib,json,gzip,re,hashlib,base64,hmac
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-v06-lab-trace-an-oauth-code-exchange","cyber-v09-decision-lab-trace-an-oauth-code-exchange","cyber-v09-evidence-verification-la-trace-an-oauth-code-exchange","cyber-v09-quick-reference-trace-an-oauth-code-exchange"]
V='dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
C='E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
def valid(v):return isinstance(v,str) and re.fullmatch(r'[A-Za-z0-9._~-]{43,128}',v) is not None
def challenge(v,method='S256'):
 if method!='S256':raise ValueError('S256 required; no fallback')
 if not valid(v):raise ValueError('invalid verifier syntax')
 return base64.urlsafe_b64encode(hashlib.sha256(v.encode('ascii')).digest()).rstrip(b'=').decode('ascii')
class PkceLabBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/pkce-lab-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/lab.json').read_bytes())
  c=json.loads(gzip.decompress((R/'tests/baselines/risk-context-labs.json.gz').read_bytes()))
  self.assertEqual(list(b),list(d));self.assertEqual(list(c),list(d));self.assertEqual(len(d),93)
  for k in IDS:self.assertEqual(d[k],c[k],k)
  for k in b:
   changed={f for f in set(b[k])|set(c[k]) if b[k].get(f)!=c[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/cyber/lab.json').read_bytes())
  for k in IDS:self.assertIn('https://www.rfc-editor.org/rfc/rfc7636.html',' '.join(d[k]['reasoningSteps']))
 def test_verifier_syntax(self):
  for v in ['a'*43,'a'*128,V,'A0-._~'+'x'*37]:self.assertTrue(valid(v))
  for v in ['a'*42,'a'*129,'a'*42+' ','a'*42+'+','a'*42+'=','a'*42+'\u00e9','a'*43+'\n']:self.assertFalse(valid(v))
  self.assertTrue(valid('a'*43)) # Deliberately not an entropy guarantee.
 def test_rfc_vector(self):
  digest=hashlib.sha256(V.encode('ascii')).digest();self.assertEqual(len(digest),32)
  result=challenge(V);self.assertEqual(result,C);self.assertEqual(len(result),43);self.assertFalse(set('+/=')&set(result))
  hexed=digest.hex();self.assertNotEqual(hexed,C);self.assertNotEqual(base64.urlsafe_b64encode(hexed.encode()).rstrip(b'=').decode(),C)
 def test_attempt_binding(self):
  other='X'+V[1:];self.assertTrue(valid(other));stored={'A':challenge(V),'B':challenge(other)}
  self.assertTrue(hmac.compare_digest(challenge(V),stored['A']));self.assertTrue(hmac.compare_digest(challenge(other),stored['B']))
  self.assertFalse(hmac.compare_digest(challenge(V),stored['B']));self.assertFalse(hmac.compare_digest(challenge(other),stored['A']))
 def test_no_downgrade(self):
  self.assertEqual(challenge(V,'S256'),C)
  for method in ['plain','unknown',None]:
   with self.assertRaises(ValueError):challenge(V,method)
  with self.assertRaises(ValueError):challenge('short')
if __name__=='__main__':unittest.main()
