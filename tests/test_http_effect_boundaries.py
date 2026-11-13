import unittest,pathlib,json,gzip,copy
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-v06-lab-test-http-idempotence","software-v09-teach-back-lab-test-http-idempotence","software-v09-worked-example-test-http-idempotence","software-v09-misconception-clinic-test-http-idempotence"]
def put(store,value,logs):
 code=204 if 'value' in store else 201
 store['value']=value;logs.append('PUT');return code
def delete(store):
 if 'value' not in store:return 404
 del store['value'];return 204
def conditional(store,value,tag):
 if not store or tag.startswith('W/') or tag!=store['tag']:return 412
 store['value']=value;store['revision']+=1;store['tag']='v'+str(store['revision']);return 204
class HttpEffectBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/http-effect-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/lab.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),110)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/software/lab.json').read_bytes())
  for k,words in zip(IDS,[['201','204','not a complete'],['404','not proof'],['does not claim every POST','exactly-once'],['strong','412','also permits']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://www.rfc-editor.org/rfc/rfc9110.html',text)
   for word in words:self.assertIn(word,text)
 def test_put_effect_not_response_or_logs(self):
  one={};logs=[];self.assertEqual(put(one,'blue',logs),201)
  two=copy.deepcopy(one);two_logs=list(logs);self.assertEqual(put(two,'blue',two_logs),204)
  self.assertEqual(one,two);self.assertEqual(len(logs),1);self.assertEqual(len(two_logs),2)
 def test_delete_effect(self):
  one={'value':'blue'};self.assertEqual(delete(one),204);two=copy.deepcopy(one)
  self.assertEqual(delete(two),404);self.assertEqual(one,two);self.assertEqual(two,{})
  self.assertEqual(delete({}),404)
 def test_uncertain_append_retry(self):
  after_application=[];after_application.append('item')
  # The first response is discarded; retry applies the append again.
  after_application.append('item')
  before_application=[];before_application.append('item')
  self.assertEqual(after_application,['item','item']);self.assertEqual(before_application,['item'])
 def test_if_match_stale_and_weak(self):
  store={'value':'initial','revision':1,'tag':'v1'}
  self.assertEqual(conditional(store,'alpha','v1'),204);self.assertEqual(store['tag'],'v2')
  before=copy.deepcopy(store)
  for value,tag in [('beta','v1'),('alpha','v1'),('beta','W/v2')]:
   self.assertEqual(conditional(store,value,tag),412);self.assertEqual(store,before)
  self.assertEqual(conditional({},'alpha','v1'),412)
if __name__=='__main__':unittest.main()
