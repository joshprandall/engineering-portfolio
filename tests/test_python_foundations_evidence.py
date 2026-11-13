"""Execute original examples in Python; no evaluation of lesson-provided code."""
import gzip,json,pathlib,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
CURRENT=json.loads((ROOT/'deep-learning/software/programming.json').read_bytes())
BASE=json.loads(gzip.decompress((ROOT/'tests/baselines/software-programming-foundations.json.gz').read_bytes()))
SUFFIXES=['python-mutable-and-immutable-types','python-dictionaries','python-sets','python-exceptions','python-context-managers','python-iterators']
IDS=['software-v06-'+s for s in SUFFIXES]
IDS+=['software-v08-deep-dive-python-list-comprehensions', 'software-v08-evidence-lab-python-list-comprehensions', 'software-v08-deep-dive-python-generator-expressions', 'software-v08-evidence-lab-python-generator-expressions', 'software-v08-deep-dive-python-generators-and-yield', 'software-v08-evidence-lab-python-generators-and-yield', 'software-v08-deep-dive-python-iterator-protocol', 'software-v08-evidence-lab-python-iterator-protocol']
class Foundations(unittest.TestCase):
 def text(self,suffix,*values):
  text=' '.join(CURRENT['software-v06-'+suffix]['reasoningSteps'])
  for v in values:self.assertIn(v,text)
 def test_exact_scope(self):
  checkpoint=json.loads(gzip.decompress((ROOT/'tests/baselines/context-lifecycle-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(CURRENT),list(checkpoint));self.assertEqual(list(checkpoint),list(BASE));self.assertEqual(len(CURRENT),158)
  for key in IDS:self.assertEqual(CURRENT[key],checkpoint[key],key)
  for key in BASE:
   fields=[k for k in set(BASE[key])|set(checkpoint[key]) if BASE[key].get(k)!=checkpoint[key].get(k)]
   self.assertEqual(sorted(fields),['essentialQuestion','labPlan','reasoningSteps'] if key in IDS else [],key)
 def test_structure_sources(self):
  for key in IDS:
   lesson=CURRENT[key];self.assertNotIn('mean, why does it matter',lesson['essentialQuestion'])
   for field in ['reasoningSteps','labPlan']:
    self.assertEqual(len(lesson[field]),6);self.assertEqual(len(set(lesson[field])),6)
   source='https://docs.python.org/3/reference/compound_stmts.html' if key.endswith(('python-exceptions','python-context-managers')) else 'https://docs.python.org/3/library/stdtypes.html'
   if key.startswith('software-v08-') and 'iterator-protocol' not in key:source='https://docs.python.org/3/reference/expressions.html'
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

 def test_iteration_claims_match_executed_fixtures(self):
  claims={
   'deep-dive-python-list-comprehensions':['[(1, 20), (2, 10), (2, 20)]','[(2, 10), (1, 20), (2, 20)]'],
   'evidence-lab-python-list-comprehensions':['[6, 3]','remains 99','ZeroDivisionError'],
   'deep-dive-python-generator-expressions':['returns 6','[12]','source immediately'],
   'evidence-lab-python-generator-expressions':['[2, 4]','[5, 10]'],
   'deep-dive-python-generators-and-yield':['3, 8 and 6','StopIteration'],
   'evidence-lab-python-generators-and-yield':['returns 7','value 10','TypeError'],
   'deep-dive-python-iterator-protocol':['3, 2 and 1','every later call','StopIteration'],
   'evidence-lab-python-iterator-protocol':['[(1, 2), (3, 4)]','list(it) is []','already been consumed']}
  for suffix,values in claims.items():
   text=' '.join(CURRENT['software-v08-'+suffix]['reasoningSteps'])
   for value in values:self.assertIn(value,text)
 def test_comprehension_order(self):
  self.assertEqual([(x,y) for x in [1,2] for y in [10,20] if x+y>11],[(1,20),(2,10),(2,20)])
  self.assertEqual([(x,y) for y in [10,20] for x in [1,2] if x+y>11],[(2,10),(1,20),(2,20)])
 def test_comprehension_filter_scope(self):
  x=99;self.assertEqual([12//x for x in [2,0,4] if x!=0],[6,3]);self.assertEqual(x,99)
  with self.assertRaises(ZeroDivisionError):[12//x for x in [2,0,4]]
 def test_generator_evaluation_timing(self):
  trace=[]
  def source():trace.append('source');return [2,4]
  def transform(x):trace.append(x);return x*3
  g=(transform(x) for x in source());self.assertEqual(trace,['source'])
  self.assertEqual(next(g),6);self.assertEqual(trace,['source',2])
  self.assertEqual(list(g),[12]);self.assertEqual(trace,['source',2,4])
  with self.assertRaises(TypeError):(x for x in None)
  g=(1//x for x in [0])
  with self.assertRaises(ZeroDivisionError):next(g)
 def test_generator_late_binding(self):
  scale=2;eager=[x*scale for x in [1,2]];lazy=(x*scale for x in [1,2]);scale=5
  self.assertEqual(eager,[2,4]);self.assertEqual(list(lazy),[5,10])
  def capture(multiplier):return (x*multiplier for x in [1,2])
  fixed=capture(2);scale=9;self.assertEqual(list(fixed),[2,4])
 def test_generator_local_state(self):
  def running(values):
   total=0
   for x in values:total+=x;yield total
  g=running([3,5,-2]);self.assertEqual([next(g),next(g),next(g)],[3,8,6])
  with self.assertRaises(StopIteration):next(g)
  a=running([3,5]);b=running([3,5]);self.assertEqual([next(a),next(b),next(a),next(b)],[3,3,8,8])
 def test_generator_send(self):
  def exchange(start):
   received=yield start
   yield received*2
  g=exchange(7);self.assertEqual(next(g),7);self.assertEqual(g.send(5),10)
  with self.assertRaises(StopIteration):next(g)
  unstarted=exchange(7)
  with self.assertRaises(TypeError):unstarted.send(5)
  g=exchange(7);next(g)
  with self.assertRaises(TypeError):next(g)
 def test_custom_iterator_exhaustion(self):
  class Countdown:
   def __init__(self,n):self.remaining=n
   def __iter__(self):return self
   def __next__(self):
    if self.remaining==0:raise StopIteration
    value=self.remaining;self.remaining-=1;return value
  g=Countdown(3);self.assertIs(iter(g),g);self.assertEqual(list(g),[3,2,1])
  for _ in range(2):
   with self.assertRaises(StopIteration):next(g)
  self.assertEqual(list(Countdown(3)),[3,2,1])
 def test_shared_iterator_zip(self):
  values=[1,2,3,4,5];it=iter(values)
  self.assertEqual(list(zip(it,it)),[(1,2),(3,4)]);self.assertEqual(list(it),[])
  self.assertEqual(list(zip(iter(values),iter(values))),[(1,1),(2,2),(3,3),(4,4),(5,5)])

if __name__=='__main__':unittest.main()
