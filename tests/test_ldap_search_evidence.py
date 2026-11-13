import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cloud-v09-recall-drill-ldap-operations","cloud-v09-practical-lab-ldap-operations-2","cloud-v09-recall-drill-ldap-operations-2","cloud-v09-failure-analysis-l-ldap-operations-2"]
def logical(op,x):
 if not x or any(v not in {'T','F','U'} for v in x):raise ValueError('nonempty truth labels')
 if op=='not':
  if len(x)!=1:raise ValueError('unary not')
  return {'T':'F','F':'T','U':'U'}[x[0]]
 if op=='and':return 'F' if 'F' in x else 'U' if 'U' in x else 'T'
 if op=='or':return 'T' if 'T' in x else 'U' if 'U' in x else 'F'
 raise ValueError('operator')
def select(names):
 user={'cn','mail'};known=user|{'createTimestamp'}
 if names==['1.1']:return set()
 selected=set(user) if not names or '*' in names else set()
 return selected|{x for x in names if x in known}
def entry(names,types_only):
 values={'cn':['Ada'],'mail':['ada@example.test'],'createTimestamp':['synthetic-time']}
 return {'dn':'cn=Ada,dc=example,dc=test','attributes':{k:[] if types_only else values[k] for k in select(names)}}
def summary(stream):
 if not stream or stream[-1][0]!='done' or sum(k=='done' for k,v in stream)!=1:raise ValueError('one final done')
 return {'entries':sum(k=='entry' for k,v in stream),'unresolved_refs':sum(k=='reference' for k,v in stream),'local_success':stream[-1][1]=='success'}
class LdapSearchEvidence(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/ldap-search-evidence.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cloud/identity.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),89)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/cloud/identity.json').read_bytes())
  for k,w in zip(IDS,['not LDAP syntax','not a full','do not prove','does not follow']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn('https://www.rfc-editor.org/rfc/rfc4511.html',t);self.assertIn(w,t)
 def test_three_valued_logic(self):
  pairs=list(itertools.product(['T','F','U'],repeat=2))
  self.assertEqual([logical('and',list(x)) for x in pairs],list('T F U F F F U F U'.split()))
  self.assertEqual([logical('or',list(x)) for x in pairs],list('T T T T F U T U U'.split()))
  self.assertEqual([logical('not',[x]) for x in ['T','F','U']],['F','T','U'])
  self.assertNotEqual(logical('not',['U']),'T')
  for op in ['and','or']:
   with self.assertRaises(ValueError):logical(op,[])
 def test_attribute_selection(self):
  self.assertEqual(select([]),{'cn','mail'});self.assertEqual(select(['1.1']),set())
  self.assertEqual(select(['*']),{'cn','mail'});self.assertEqual(select(['*','createTimestamp']),{'cn','mail','createTimestamp'})
  self.assertEqual(select(['1.1','cn','cn','unknown']),{'cn'})
 def test_types_only_entry_not_removed(self):
  full=entry(['cn','mail'],False);types=entry(['cn','mail'],True)
  self.assertEqual(full['dn'],types['dn']);self.assertEqual(set(full['attributes']),set(types['attributes']))
  self.assertEqual(types['attributes'],{'cn':[],'mail':[]});self.assertEqual(full['attributes']['cn'],['Ada'])
  empty=entry(['1.1'],False);self.assertEqual(empty['attributes'],{});self.assertEqual(empty['dn'],full['dn'])
 def test_local_done_not_global_complete(self):
  stream=[('entry','A'),('reference','unfollowed'),('entry','B'),('done','success')]
  self.assertEqual(summary(stream),{'entries':2,'unresolved_refs':1,'local_success':True})
  for bad in [stream[:-1],[('done','success'),('entry','A')],[('done','success'),('done','success')]]:
   with self.assertRaises(ValueError):summary(bad)
if __name__=='__main__':unittest.main()
