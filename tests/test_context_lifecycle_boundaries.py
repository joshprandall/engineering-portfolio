"""Actual synchronous Python lifecycle contracts, using inert local objects only."""
import pathlib,json,gzip,unittest
from contextlib import contextmanager
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/software/programming.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/context-lifecycle-boundaries.json.gz').read_bytes()))
IDS=["software-v09-failure-analysis-lab-python-context-managers","software-v09-troubleshooting-lab-python-context-managers","software-v09-design-review-python-context-managers","software-v08-evidence-lab-python-context-managers","software-v09-failure-analysis-lab-python-generators-and-yield","software-v08-deep-dive-python-context-managers"]
REFS=["https://docs.python.org/3/reference/compound_stmts.html","https://docs.python.org/3/reference/compound_stmts.html","https://docs.python.org/3/reference/compound_stmts.html","https://docs.python.org/3/library/contextlib.html","https://docs.python.org/3.13/reference/expressions.html","https://docs.python.org/3/reference/compound_stmts.html"]
class ContextLifecycleBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  checkpoint=json.loads(gzip.decompress((R/'tests/baselines/copy-graph-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(D),list(checkpoint));self.assertEqual(list(checkpoint),list(B));self.assertEqual(len(D),158)
  for k in IDS:self.assertEqual(D[k],checkpoint[k],k)
  for k in B:
   self.assertEqual(sorted(f for f in set(B[k])|set(checkpoint[k]) if B[k].get(f)!=checkpoint[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_entry_failure_boundary(self):
  events=[];seen=[];error=ValueError('entry')
  class Manager:
   def __init__(self,fail):self.fail=fail
   def __enter__(self):
    events.append('enter')
    if self.fail:raise error
    return 7
   def __exit__(self,*info):events.append('exit');seen.append(info)
  with self.assertRaises(ValueError) as caught:
   with Manager(True):events.append('body')
  self.assertIs(caught.exception,error);self.assertEqual(events,['enter']);self.assertEqual(seen,[])
  events.clear()
  with self.assertRaises(ValueError) as caught:
   with Manager(False) as value:
    self.assertEqual(value,7);events.append('body');raise error
  self.assertIs(caught.exception,error);self.assertEqual(events,['enter','body','exit'])
  self.assertIs(seen[0][0],ValueError);self.assertIs(seen[0][1],error);self.assertIsNotNone(seen[0][2])
  self.claim(0,"['enter']", 'partial work','__enter__')
 def test_selective_suppression(self):
  for error in [None,ValueError('handled'),TypeError('propagate')]:
   events=[];seen=[]
   class Manager:
    def __enter__(self):events.append('enter')
    def __exit__(self,*info):
     events.append('exit');seen.append(info);return info[0] is ValueError
   def run():
    with Manager():
     events.append('body')
     if error is not None:raise error
     events.append('body-finished')
    events.append('after')
   if isinstance(error,TypeError):
    with self.assertRaises(TypeError) as caught:run()
    self.assertIs(caught.exception,error)
    self.assertEqual(events,['enter','body','exit'])
   else:
    run();self.assertEqual(events,['enter','body']+(['body-finished'] if error is None else [])+['exit','after'])
   if error is None:self.assertEqual(seen,[(None,None,None)])
   else:self.assertIs(seen[0][0],type(error));self.assertIs(seen[0][1],error)
  self.claim(1,'exc_type is ValueError','same exception instance','does not resume')
 def test_nested_unwinding(self):
  for mode in ['normal','entry-failure','inner-suppression']:
   events=[];seen={}
   class Manager:
    def __init__(self,name):self.name=name
    def __enter__(self):
     events.append(self.name+'.enter')
     if self.name=='B' and mode=='entry-failure':raise ValueError('B entry')
     return self.name
    def __exit__(self,*info):
     events.append(self.name+'.exit');seen[self.name]=info
     return self.name=='B' and mode=='inner-suppression' and info[0] is ValueError
   def run():
    with Manager('A') as a,Manager('B') as b:
     self.assertEqual((a,b),('A','B'));events.append('body')
     if mode=='inner-suppression':raise ValueError('body')
   if mode=='entry-failure':
    with self.assertRaises(ValueError):run()
    self.assertEqual(events,['A.enter','B.enter','A.exit']);self.assertNotIn('B',seen);self.assertIs(seen['A'][0],ValueError)
   else:
    run();self.assertEqual(events,['A.enter','B.enter','body','B.exit','A.exit'])
    self.assertEqual(seen['A'],(None,None,None))
    self.assertIs(seen['B'][0],ValueError if mode=='inner-suppression' else None)
  self.claim(2,"['A.enter','B.enter','body','B.exit','A.exit']", 'three None','partial work')
 def test_generator_context_protocol(self):
  for reraise in [False,True]:
   events=[];error=ValueError('body')
   @contextmanager
   def manager():
    events.append('enter')
    try:yield 7
    except ValueError:
     events.append('caught')
     if reraise:raise
    finally:events.append('cleanup')
   def run():
    with manager() as value:
     self.assertEqual(value,7);events.append('body');raise error
     events.append('unreachable')
    events.append('after')
   if reraise:
    with self.assertRaises(ValueError) as caught:run()
    self.assertIs(caught.exception,error)
   else:run()
   self.assertEqual(events,['enter','body','caught','cleanup']+([] if reraise else ['after']))
  events=[]
  @contextmanager
  def zero():
   if False:yield
  with self.assertRaises(RuntimeError):
   with zero():events.append('body')
  self.assertEqual(events,[])
  @contextmanager
  def two():
   yield 1
   yield 2
  with self.assertRaises(RuntimeError):
   with two() as value:events.append(value)
  self.assertEqual(events,[1])
  self.claim(3,'exactly one value','bare raise','RuntimeError')
 def test_explicit_generator_close(self):
  events=[]
  def source():
   events.append('start')
   try:yield 1
   finally:events.append('cleanup')
  g=source();self.assertEqual(events,[])
  try:
   self.assertEqual(next(g),1);self.assertEqual(events,['start'])
   g.close();self.assertEqual(events,['start','cleanup'])
   g.close();self.assertEqual(events,['start','cleanup'])
   with self.assertRaises(StopIteration):next(g)
  finally:g.close()
  events.clear();g=source()
  try:
   for value in g:
    self.assertEqual(value,1);break
   self.assertEqual(events,['start'])
  finally:g.close()
  self.assertEqual(events,['start','cleanup'])
  self.claim(4,"['start','cleanup']", 'break does not itself call close','garbage-collection timing')
 def test_as_target_failure(self):
  for values,suppress in [((7,),False),((7,),True),((7,8),False)]:
   events=[];seen=[]
   class Manager:
    def __enter__(self):events.append('enter');return values
    def __exit__(self,*info):events.append('exit');seen.append(info);return suppress
   def run():
    with Manager() as (left,right):
     self.assertEqual((left,right),(7,8));events.append('body')
    events.append('after')
   if len(values)==1 and not suppress:
    with self.assertRaises(ValueError):run()
    self.assertEqual(events,['enter','exit'])
   else:
    run();self.assertEqual(events,['enter']+(['body'] if len(values)==2 else [])+['exit','after'])
   if len(values)==1:self.assertIs(seen[0][0],ValueError)
   else:self.assertEqual(seen,[(None,None,None)])
  self.claim(5,'(7,)','ValueError',"['enter','exit']")
if __name__=='__main__':unittest.main()
