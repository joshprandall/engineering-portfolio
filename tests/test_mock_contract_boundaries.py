"""Actual unittest.mock contracts; local inert objects only."""
import pathlib,json,gzip,unittest,types,copy
from unittest.mock import Mock,create_autospec,patch,call,DEFAULT
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/software/testing.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/mock-contract-boundaries.json.gz').read_bytes()))
IDS=["software-v10-evidence-reading-testing-at-multiple-layers","software-v10-compare-contrast-testing-at-multiple-layers","software-v10-confidence-calibration-testing-at-multiple-layers","software-v10-reasoning-check-testing-at-multiple-layers-2","software-v10-evidence-reading-testing-at-multiple-layers-2","software-v10-configuration-lab-testing-at-multiple-layers"]
REFS=["https://docs.python.org/3/library/unittest.mock.html","https://docs.python.org/3/library/unittest.mock.html","https://docs.python.org/3/library/unittest.mock-examples.html","https://docs.python.org/3/library/unittest.mock.html","https://docs.python.org/3/library/unittest.mock.html","https://docs.python.org/3/library/unittest.mock.html"]
class MockContractBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  checkpoint=json.loads(gzip.decompress((R/'tests/baselines/unittest-lifecycle-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(B),list(checkpoint));self.assertEqual(list(checkpoint),list(D));self.assertEqual(len(D),109)
  for k in IDS:self.assertEqual(D[k],checkpoint[k],k)
  for k in B:
   self.assertEqual(sorted(f for f in set(B[k])|set(checkpoint[k]) if B[k].get(f)!=checkpoint[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_autospec_and_spec_set(self):
  def fetch(item_id,*,timeout=3):return item_id,timeout
  double=create_autospec(fetch,return_value='ok')
  self.assertEqual(double(7,timeout=1),'ok')
  for args,kwargs in [((),{}),((7,1),{}),((7,),{'unknown':True})]:
   with self.assertRaises(TypeError):double(*args,**kwargs)
  plain=Mock(return_value='ok');self.assertEqual(plain(7,1),'ok')
  class Interface:
   def fetch(self,item_id):pass
  strict=create_autospec(Interface,instance=True,spec_set=True)
  with self.assertRaises(AttributeError):strict.invented
  with self.assertRaises(AttributeError):strict.invented=True
  strict.fetch(7);strict.fetch.assert_called_once_with(7)
  self.claim(0,'TypeError','spec_set','not implementation behavior')
 def test_patch_lookup_and_restore(self):
  provider=types.ModuleType('fixture_provider');consumer=types.ModuleType('fixture_consumer')
  provider.value=lambda:'real';consumer.value=provider.value
  exec("def run():\n return value()",consumer.__dict__)
  original=provider.value
  with patch.object(provider,'value',return_value='provider-double') as p:
   self.assertEqual(consumer.run(),'real');p.assert_not_called()
  self.assertIs(provider.value,original)
  with patch.object(consumer,'value',return_value='consumer-double') as p:
   self.assertEqual(consumer.run(),'consumer-double');p.assert_called_once_with()
  self.assertIs(consumer.value,original);self.assertEqual(consumer.run(),'real')
  self.claim(1,'consumer.value','context-managed','lookup site')
 def test_mutable_argument_snapshot(self):
  plain=Mock();value=[1];plain(value);value.append(2)
  self.assertIs(plain.call_args.args[0],value);self.assertEqual(plain.call_args.args[0],[1,2])
  with self.assertRaises(AssertionError):plain.assert_called_once_with([1])
  recorder=Mock()
  def snapshot(*args,**kwargs):
   recorder(*copy.deepcopy(args),**copy.deepcopy(kwargs));return DEFAULT
  m=Mock(side_effect=snapshot,return_value='ok');payload={'items':[1]}
  self.assertEqual(m(payload),'ok');payload['items'].append(2)
  recorder.assert_called_once_with({'items':[1]})
  self.assertEqual(m.call_args.args[0],{'items':[1,2]})
  self.claim(2,'reference','DEFAULT','identity')
 def test_reset_history_not_iterator(self):
  m=Mock(return_value='fallback',side_effect=[10,20])
  self.assertEqual(m(),10);m.reset_mock();self.assertEqual(m.call_count,0)
  self.assertEqual(m(),20);self.assertEqual(m.call_count,1)
  with self.assertRaises(StopIteration):m()
  m.reset_mock(side_effect=True);self.assertEqual(m.call_count,0)
  self.assertEqual(m(),'fallback')
  fresh=Mock(return_value='fallback',side_effect=[10,20]);self.assertEqual(fresh(),10)
  m.reset_mock(return_value=True);self.assertIsInstance(m(),Mock)
  self.claim(3,'20, not 10','StopIteration','not an automatic fallback')
 def test_scripted_exception_records_attempt(self):
  m=Mock(side_effect=[ValueError('temporary'),'ok'])
  with self.assertRaisesRegex(ValueError,'temporary'):m('job')
  self.assertEqual(m.call_count,1);self.assertEqual(m.call_args_list,[call('job')])
  self.assertEqual(m('job'),'ok');self.assertEqual(m.call_args_list,[call('job'),call('job')])
  with self.assertRaises(StopIteration):m('job')
  self.assertEqual(m.call_count,3)
  self.claim(4,'does not implement retry logic','third invocation','recorded')
 def test_subsequence_not_exact_history(self):
  m=Mock()
  for x in ['start','work','finish']:m(x)
  m.assert_has_calls([call('work')])
  with self.assertRaises(AssertionError):m.assert_has_calls([call('start'),call('finish')])
  m.assert_has_calls([call('finish'),call('start')],any_order=True)
  self.assertEqual(m.call_args_list,[call('start'),call('work'),call('finish')])
  self.assertNotEqual(m.call_args_list,[call('work')])
  with self.assertRaises(AssertionError):m.assert_called_once_with('work')
  self.claim(5,'sequential','extra calls before or after','different claims')
if __name__=='__main__':unittest.main()
