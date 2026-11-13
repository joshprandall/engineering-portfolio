import unittest,pathlib,json,gzip,copy,collections
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cloud-v05-terraform-plan","cloud-v05-lab-preview-infrastructure-changes","cloud-v09-recall-drill-preview-infrastructure-changes","cloud-v09-recall-drill-terraform-plan"]
VALID=[['no-op'],['create'],['read'],['update'],['delete','create'],['create','delete'],['delete']]
def destructive(actions):
 if actions not in VALID:raise ValueError('unsupported action list')
 return 'delete' in actions
def classify(after,unknown,key):
 if unknown.get(key) is True:return 'unknown'
 if key not in after:return 'missing'
 return 'known-null' if after[key] is None else 'known-value'
def redact(value,mask):
 if mask is True:return '[redacted]'
 if isinstance(value,dict):
  return {k:redact(v,mask.get(k,False) if isinstance(mask,dict) else False) for k,v in value.items()}
 if isinstance(value,list):
  return [redact(v,mask[i] if isinstance(mask,list) and i<len(mask) else False) for i,v in enumerate(value)]
 return value
def counts(changes):
 for a in changes:destructive(a)
 return sum(a!=['no-op'] for a in changes),collections.Counter(x for a in changes for x in a if x!='no-op')
class PlanBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/plan-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cloud/automation.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),98)
  for k in b:
   changed={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_claims(self):
  d=json.loads((R/'deep-learning/cloud/automation.json').read_bytes())
  for k,words in zip(IDS,[['seven','three','permission'],['unknown','known-null','missing'],['after_sensitive','sanitized','secret'],['three','five','timing']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://developer.hashicorp.com/terraform/internals/json-format',text)
   for word in words:self.assertIn(word,text)
 def test_action_lists(self):
  self.assertEqual([destructive(a) for a in VALID],[False,False,False,False,True,True,True])
  self.assertNotEqual(VALID[4],VALID[5])
  self.assertEqual(sum(a==['delete'] for a in VALID),1)
  for a in [[],['replace'],['unknown'],['update','delete']]:
   with self.assertRaises(ValueError):destructive(a)
 def test_unknown_null_missing(self):
  after={'id':None,'note':None,'size':3,'empty':''};unknown={'id':True}
  self.assertEqual([classify(after,unknown,k) for k in ['id','note','size','absent','empty']],['unknown','known-null','known-value','missing','known-value'])
  self.assertEqual(classify({}, {'id':True},'id'),'unknown')
 def test_sensitivity_mask(self):
  value={'name':'demo','credentials':{'token':'SYNTHETIC_ONLY'},'items':['public','SYNTHETIC_ONLY']}
  mask={'credentials':{'token':True},'items':[False,True]};before=copy.deepcopy(value)
  clean=redact(value,mask)
  self.assertEqual(clean,{'name':'demo','credentials':{'token':'[redacted]'},'items':['public','[redacted]']})
  self.assertNotIn('SYNTHETIC_ONLY',json.dumps(clean));self.assertEqual(value,before)
  self.assertEqual(redact(value,True),'[redacted]')
  self.assertEqual(redact(value,{}),value)
 def test_resource_action_counts(self):
  changes=[['no-op'],['update'],['delete','create'],['create','delete']]
  self.assertEqual(counts(changes),(3,{'update':1,'delete':2,'create':2}))
  self.assertEqual(sum(counts(changes)[1].values()),5)
  changes[2]=['create','delete'];self.assertEqual(counts(changes),(3,{'update':1,'delete':2,'create':2}))
  self.assertEqual(counts([]),(0,{}));self.assertEqual(counts([['no-op']]),(0,{}))
if __name__=='__main__':unittest.main()
