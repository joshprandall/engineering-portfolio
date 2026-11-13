import unittest,pathlib,json,gzip
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-v08-deep-dive-postgresql-jsonb","software-v08-evidence-lab-postgresql-jsonb","software-v09-design-review-postgresql-jsonb","software-v09-scenario-analysis-postgresql-jsonb"]
URL='https://www.postgresql.org/docs/18/datatype-json.html'
def unique(pairs):
 result={}
 for k,v in pairs:
  if k in result:raise ValueError('duplicate key')
  result[k]=v
 return result
def flat_contains(left,right):
 if not all(type(x) is int for x in left+right):raise ValueError('flat integers only')
 return set(right)<=set(left)
def exists(value,name):
 if isinstance(value,dict):return name in value
 if isinstance(value,list):return any(type(x) is str and x==name for x in value)
 return type(value) is str and value==name
class JsonbBoundaryLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/jsonb-boundary-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/databases.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),162)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/software/databases.json').read_bytes())
  for k,phrase in zip(IDS,['does not execute PostgreSQL','not a claim that PostgreSQL','does not implement nested','not a PostgreSQL engine test']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t)
 def test_duplicates_and_text(self):
  raw='{"mode":"draft", "mode":"final"}'
  self.assertEqual(json.loads(raw,object_pairs_hook=list),[('mode','draft'),('mode','final')])
  self.assertEqual(json.loads(raw),{'mode':'final'})
  for s in [raw,'{"outer":{"mode":"draft","mode":"final"}}']:
   with self.assertRaisesRegex(ValueError,'duplicate'):json.loads(s,object_pairs_hook=unique)
  self.assertEqual(json.loads('{"a":1,"b":2}',object_pairs_hook=unique),{'a':1,'b':2})
  a='{"a":1, "b":2}';b='{ "b":2,"a":1 }';self.assertNotEqual(a,b);self.assertEqual(json.loads(a),json.loads(b))
 def test_client_precision(self):
  n=json.loads('9007199254740993');self.assertEqual(n,9007199254740993)
  self.assertEqual(int(float(n)),9007199254740992);self.assertEqual(n-int(float(n)),1)
  values=[9007199254740991,9007199254740992,9007199254740993]
  self.assertEqual([int(float(x))==x for x in values],[True,True,False])
  self.assertEqual(json.loads(json.dumps(str(n))),'9007199254740993')
 def test_flat_array_operator(self):
  left=[2,4,6];self.assertEqual([flat_contains(left,x) for x in [[6,2,2],[2,6],[8]]],[True,True,False])
  reverse=[6,4,2];self.assertNotEqual(left,reverse);self.assertTrue(flat_contains(left,reverse));self.assertTrue(flat_contains(reverse,left))
  with self.assertRaises(ValueError):flat_contains([2,[4,6]],[4])
  with self.assertRaises(ValueError):flat_contains([True],[1])
 def test_top_level_existence(self):
  d={'owner':'mira','meta':{'enabled':True}}
  self.assertEqual([exists(d,k) for k in ['owner','mira','enabled']],[True,False,False])
  self.assertTrue(exists(d['meta'],'enabled'))
  self.assertTrue(exists(['owner','mira'],'owner'));self.assertTrue(exists('owner','owner'))
  self.assertFalse(exists([{'owner':'mira'}],'owner'));self.assertFalse(exists('owner','own'))
if __name__=='__main__':unittest.main()
