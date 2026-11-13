"""Execute original examples in Python; no evaluation of lesson-provided code."""
import gzip,json,pathlib,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
CURRENT=json.loads((ROOT/'deep-learning/software/programming.json').read_bytes())
BASE=json.loads(gzip.decompress((ROOT/'tests/baselines/software-programming-foundations.json.gz').read_bytes()))
SUFFIXES=['python-mutable-and-immutable-types','python-dictionaries','python-sets','python-exceptions','python-context-managers','python-iterators']
IDS=['software-v06-'+s for s in SUFFIXES]
class Foundations(unittest.TestCase):
 def text(self,suffix,*values):
  text=' '.join(CURRENT['software-v06-'+suffix]['reasoningSteps'])
  for v in values:self.assertIn(v,text)
 def test_exact_scope(self):
  self.assertEqual(list(CURRENT),list(BASE));self.assertEqual(len(CURRENT),158)
  for key in BASE:
   fields=[k for k in set(BASE[key])|set(CURRENT[key]) if BASE[key].get(k)!=CURRENT[key].get(k)]
   self.assertEqual(sorted(fields),['essentialQuestion','labPlan','reasoningSteps'] if key in IDS else [],key)
 def test_structure_sources(self):
  for key in IDS:
   lesson=CURRENT[key];self.assertFalse(lesson['essentialQuestion'].startswith('What does'))
   for field in ['reasoningSteps','labPlan']:
    self.assertEqual(len(lesson[field]),6);self.assertEqual(len(set(lesson[field])),6)
   source='https://docs.python.org/3/reference/compound_stmts.html' if key.endswith(('python-exceptions','python-context-managers')) else 'https://docs.python.org/3/library/stdtypes.html'
   self.assertIn(source,lesson['reasoningSteps'][-1])
 def test_shallow_copy_and_tuple(self):
  a=[[1],[2]];b=a.copy();self.assertIsNot(a,b);self.assertIs(a[0],b[0])
  b[0].append(9);self.assertEqual(a,[[1,9],[2]]);self.assertEqual(a,b)
  b.append([3]);self.assertEqual(len(a),2);self.assertEqual(b,[[1,9],[2],[3]])
  t=([1],);t[0].append(2);self.assertEqual(t,([1,2],))
  with self.assertRaises(TypeError):t[0]=[3]
  self.text('python-mutable-and-immutable-types','[[1, 9], [2]]','[[1, 9], [2], [3]]','TypeError')
 def test_dictionary_order_and_views(self):
  d=dict(alpha=1,beta=2);d['alpha']=9;self.assertEqual(list(d),['alpha','beta'])
  del d['alpha'];d['alpha']=9;self.assertEqual(list(d),['beta','alpha'])
  view=d.keys();snapshot=list(d);d['gamma']=3
  self.assertEqual(list(view),['beta','alpha','gamma']);self.assertEqual(snapshot,['beta','alpha'])
  self.assertEqual(d,dict(gamma=3,alpha=9,beta=2))
  self.text('python-dictionaries',"['alpha', 'beta']","['beta', 'alpha']", '3.7')
 def test_sets_and_hashability(self):
  a={1,2,2,3};b={3,4};self.assertEqual(len(a),3)
  self.assertEqual(sorted(a|b),[1,2,3,4]);self.assertEqual(a&b,{3});self.assertEqual(a-b,{1,2});self.assertEqual(a^b,{1,2,4})
  with self.assertRaises(TypeError):set([[1]])
  with self.assertRaises(TypeError):hash(([1],))
  self.assertEqual(len({frozenset([1,2]),frozenset([2,1])}),1)
  self.text('python-sets','len(a) is 3','{3}','{1, 2}','frozenset')
 def test_exception_precedence_and_branches(self):
  trace=[]
  try:raise ValueError('synthetic')
  except Exception:trace.append('broad')
  except ValueError:trace.append('specific')
  self.assertEqual(trace,['broad']);trace=[]
  try:raise ValueError('synthetic')
  except ValueError:trace.append('specific')
  except Exception:trace.append('broad')
  self.assertEqual(trace,['specific'])
  for fail,expected in [(False,['body','else','finally']),(True,['body','caught','finally'])]:
   trace=[]
   try:
    trace.append('body')
    if fail:raise ValueError('synthetic')
   except ValueError:trace.append('caught')
   else:trace.append('else')
   finally:trace.append('finally')
   self.assertEqual(trace,expected)
  self.text('python-exceptions','first broad matching handler','else clause does not run')
 def test_context_suppression_and_enter_failure(self):
  def run(suppress,fail_enter=False):
   trace=[]
   class Manager:
    def __enter__(self):
     trace.append('enter')
     if fail_enter:raise ValueError('enter')
     return self
    def __exit__(self,*args):
     trace.append('exit');return suppress
   try:
    with Manager():
     trace.append('body');raise ValueError('body')
    trace.append('after')
   except ValueError:trace.append('caught')
   return trace
  self.assertEqual(run(False),['enter','body','exit','caught'])
  self.assertEqual(run(True),['enter','body','exit','after'])
  self.assertEqual(run(True,True),['enter','caught'])
  self.text('python-context-managers','enter, body, exit, caught','enter, body, exit, after','not called')
 def test_iterator_consumption(self):
  values=[10,20,30];it=iter(values);self.assertIs(iter(it),it)
  self.assertEqual(next(it),10);self.assertEqual(list(it),[20,30]);self.assertEqual(list(it),[])
  self.assertEqual(next(it,'done'),'done')
  with self.assertRaises(StopIteration):next(it)
  self.assertEqual(list(iter(values)),[10,20,30])
  self.text('python-iterators','[20, 30]','[]','StopIteration')
if __name__=='__main__':unittest.main()
