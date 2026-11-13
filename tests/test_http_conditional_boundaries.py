"""Offline protocol decision fixtures, not a general HTTP implementation."""
import pathlib,json,gzip,unittest,itertools
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/software/apis.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/http-conditional-boundaries.json.gz').read_bytes()))
IDS=['software-v09-teach-back-lab-http-put-semantics','software-v09-teach-back-lab-http-get','software-v09-practical-lab-http-get','software-v09-worked-example-http-post','software-v09-worked-example-http-status-codes-as-protocol-signals','software-v09-teach-back-lab-http-cache-freshness']
def strong(a,b):return not a[1] and not b[1] and a[0]==b[0]
def weak(a,b):return a[0]==b[0]
def conditional_none(method,current,supplied):
 if weak(current,supplied):return 304 if method in ['GET','HEAD'] else 412
 return 'continue'
def select_range(length,start=None,end=None,suffix=None):
 if suffix is not None:
  if suffix<=0:raise ValueError('unsatisfiable suffix')
  return range(max(0,length-suffix),length)
 if start is None or start<0 or end is not None and end<start:raise ValueError('invalid range')
 if start>=length:raise ValueError('unsatisfiable start')
 return range(start,min(length-1,end) + 1 if end is not None else length)
def classify(method,known,supported):
 if method not in known:return 501,None
 if method not in supported:return 405,tuple(sorted(supported))
 return 'continue',None
def cache_policy(directives,validated=False):
 if 'no-store' in directives:return False,False
 return True,validated if 'no-cache' in directives else True
class HttpConditionalBoundaries(unittest.TestCase):
 def claim(self,i,*values):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for x in values:self.assertIn(x,text)
 def test_scope(self):
  self.assertEqual(list(B),list(D));self.assertEqual(len(D),131)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  suffixes=['rfc9110#section-13.1.1','rfc9110#section-13.1.2','rfc9110#section-14.1.2','rfc9110#section-15.3.3','rfc9110#section-15.5.6','rfc9111#section-5.2.2.4']
  for k,ref in zip(IDS,suffixes):
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn('https://www.rfc-editor.org/rfc/'+ref,D[k][f][-1])
 def test_strong_guard_and_wildcard(self):
  for aw,bw in itertools.product([False,True],repeat=2):
   self.assertEqual(strong(('v2',aw),('v2',bw)),not aw and not bw)
   self.assertFalse(strong(('v2',aw),('v1',bw)))
  stored={'value':'old'}
  for candidate in [('v1',False),('v2',True)]:
   before=dict(stored)
   if strong(('v2',False),candidate):stored['value']='new'
   self.assertEqual(stored,before)
  wildcard=lambda current:current is not None
  self.assertTrue(wildcard(('v2',True)));self.assertFalse(wildcard(None))
  self.claim(0,'return 412','atomically','both tags must be strong')
 def test_weak_method_dependent_response(self):
  for aw,bw in itertools.product([False,True],repeat=2):
   a,b=('v2',aw),('v2',bw);self.assertTrue(weak(a,b))
   for method,expected in [('GET',304),('HEAD',304),('PUT',412)]:
    self.assertEqual(conditional_none(method,a,b),expected)
    self.assertEqual(conditional_none(method,a,('v1',bw)),'continue')
  self.claim(1,'304','412','does not itself promise status 200')
 def test_suffix_open_ended_and_unsatisfiable(self):
  data=list(range(1000))
  cases=[({'suffix':200},data[800:]),({'suffix':1200},data),({'start':900},data[900:]),({'start':900,'end':1200},data[900:]),({'start':999},[999])]
  for kwargs,expected in cases:self.assertEqual(list(select_range(1000,**kwargs)),expected)
  for kwargs in [{'start':1000},{'suffix':0},{'start':8,'end':7}]:
   with self.assertRaises(ValueError):select_range(1000,**kwargs)
  self.claim(2,'800 through 999','100 octets','ignore Range','content coding')
 def test_accepted_is_not_terminal_success(self):
  outcome=lambda status:'unknown' if status is None else status if status in ['succeeded','failed'] else 'pending'
  self.assertEqual(outcome('accepted'),'pending')
  for terminal in ['failed','succeeded']:
   observed=[outcome(x) for x in ['queued','running',None,terminal]]
   self.assertEqual(observed,['pending','pending','unknown',terminal])
  self.assertNotEqual(outcome(None),'failed');self.claim(3,'not completion','outcome unknown','application-specific')
 def test_method_support_and_allow(self):
  known={'GET','HEAD','PUT'};supported={'GET','HEAD'}
  self.assertEqual(classify('GET',known,supported),('continue',None))
  self.assertEqual(classify('PUT',known,supported),(405,('GET','HEAD')))
  self.assertEqual(classify('INVENTED',known,supported),(501,None))
  self.assertEqual(classify('PUT',known,supported|{'PUT'}),('continue',None))
  self.claim(4,'405','501','must include Allow','not a promise')
 def test_storage_and_validation_are_distinct(self):
  self.assertEqual(cache_policy({'no-cache'}),(True,False))
  self.assertEqual(cache_policy({'no-cache'},validated=True),(True,True))
  self.assertEqual(cache_policy({'no-cache','max-age=3600'}),(True,False))
  for validated in [False,True]:
   self.assertEqual(cache_policy({'no-store'},validated),(False,False))
   self.assertEqual(cache_policy({'no-cache','no-store'},validated),(False,False))
  self.claim(5,'unqualified','must-understand exception','Neither directive is a guarantee')
if __name__=='__main__':unittest.main()
