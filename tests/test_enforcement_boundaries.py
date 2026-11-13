import unittest,pathlib,json,gzip,itertools,copy
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-v08-deep-dive-zero-trust-policy-engine","cyber-v08-deep-dive-zero-trust-policy-administrator","cyber-v08-deep-dive-zero-trust-policy-enforcement-point","cyber-v08-evidence-lab-zero-trust-policy-enforcement-point"]
GRANT=('analyst','report','read')
def apply(state,session,revision,action,grant=None):
 if not isinstance(revision,int) or isinstance(revision,bool) or revision<=0:raise ValueError('positive revision required')
 if action not in ['allow','revoke'] or (action=='allow' and (not isinstance(grant,tuple) or len(grant)!=3)):raise ValueError('invalid command')
 old=state.get(session,(0,None))
 if revision<=old[0]:return False
 state[session]=(revision,grant if action=='allow' else None);return True
def permitted(state,session,request):
 return state.get(session,(0,None))[1]==request and request is not None
class EnforcementBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/enforcement-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/architecture.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),113)
  for key in b:
   changed={f for f in set(b[key])|set(d[key]) if b[key].get(f)!=d[key].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if key in IDS else set(),key)
 def test_source_and_claims(self):
  d=json.loads((R/'deep-learning/cyber/architecture.json').read_bytes())
  for key,words in zip(IDS,[['still empty','different evidence'],['not been delivered','delivery gap'],['exact authorized tuple','out of scope'],['tombstone','not a NIST-mandated','trusted unique']]):
   text=' '.join(d[key]['reasoningSteps'])
   self.assertIn('https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf',text)
   for word in words:self.assertIn(word,text)
 def test_decision_not_enforcement(self):
  state={};decisions=[('S1',1,'allow',GRANT)]
  self.assertEqual(state,{});self.assertFalse(permitted(state,'S1',GRANT))
  self.assertTrue(apply(state,*decisions[0]));self.assertTrue(permitted(state,'S1',GRANT))
 def test_issued_not_delivered(self):
  state={};apply(state,'S1',1,'allow',GRANT)
  queue=[('S1',2,'revoke',None)]
  self.assertTrue(permitted(state,'S1',GRANT))
  self.assertTrue(apply(state,*queue.pop(0)));self.assertFalse(permitted(state,'S1',GRANT));self.assertEqual(queue,[])
 def test_exact_scope(self):
  state={};apply(state,'S1',1,'allow',GRANT)
  requests=list(itertools.product(['analyst','visitor'],['report','payroll'],['read','write']))
  self.assertEqual(sum(permitted(state,'S1',x) for x in requests),1)
  self.assertFalse(permitted(state,'S2',GRANT));apply(state,'S1',2,'revoke')
  self.assertFalse(any(permitted(state,'S1',x) for x in requests))
 def test_revision_tombstone(self):
  allow=('S1',1,'allow',GRANT);revoke=('S1',2,'revoke',None)
  for order in itertools.permutations([allow,revoke]):
   state={}
   for command in order:apply(state,*command)
   self.assertEqual(state,{'S1':(2,None)})
   before=copy.deepcopy(state);self.assertFalse(apply(state,*allow));self.assertFalse(apply(state,*revoke));self.assertEqual(state,before)
   new=('analyst','report','write');self.assertTrue(apply(state,'S1',3,'allow',new))
   self.assertTrue(permitted(state,'S1',new));self.assertFalse(permitted(state,'S1',GRANT))
  for revision in [0,-1,True,1.5]:
   with self.assertRaises(ValueError):apply({},'S1',revision,'allow',GRANT)
if __name__=='__main__':unittest.main()
