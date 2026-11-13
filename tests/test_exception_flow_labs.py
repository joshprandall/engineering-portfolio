import unittest,pathlib,json,gzip
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-v08-deep-dive-python-exception-handling","software-v08-evidence-lab-python-exception-handling","software-v08-evidence-lab-python-finally-clause","software-v08-evidence-lab-python-exception-chaining"]
URL='https://docs.python.org/3.13/tutorial/errors.html'
class ExceptionFlowLabs(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/exception-flow-labs.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/programming.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),158)
  for k in b:self.assertEqual({f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}, {'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_claims(self):
  d=json.loads((R/'deep-learning/software/programming.json').read_bytes())
  for k,phrase in zip(IDS,['first matching','not handled','suppress a pending','__cause__']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn(URL,t);self.assertIn(phrase,t)
 def test_first_matching_handler(self):
  class InputIssue(Exception):pass
  class MissingField(InputIssue):pass
  def broad_first(cls):
   try:raise cls()
   except InputIssue:return 'broad'
   except MissingField:return 'specific'
  def specific_first(cls):
   try:raise cls()
   except MissingField:return 'specific'
   except InputIssue:return 'broad'
  self.assertEqual(broad_first(MissingField),'broad');self.assertEqual(specific_first(MissingField),'specific')
  self.assertEqual(specific_first(InputIssue),'broad')
 def test_else_exception_scope(self):
  def convert(text,events):
   try:value=int(text)
   except ValueError:events.append('conversion handled');return None
   else:events.append(('converted',value));raise ValueError('later validation')
  events=[]
  self.assertIsNone(convert('twelve',events));self.assertEqual(events,['conversion handled'])
  events=[]
  with self.assertRaisesRegex(ValueError,'later validation'):convert('12',events)
  self.assertEqual(events,[('converted',12)])
 def test_finally_override_and_preservation(self):
  # Intentional anti-pattern examples under test, not production error handling.
  def override_return():
   try:return 3
   finally:return 8
  def override_error():
   try:raise ValueError('pending')
   finally:return 8
  events=[]
  def preserve():
   try:raise ValueError('pending')
   finally:events.append('cleanup')
  self.assertEqual(override_return(),8);self.assertEqual(override_error(),8)
  with self.assertRaisesRegex(ValueError,'pending'):preserve()
  self.assertEqual(events,['cleanup'])
 def test_explicit_cause(self):
  def translate():
   try:return {}['id']
   except KeyError as original:raise ValueError('invalid local record') from original
  with self.assertRaises(ValueError) as caught:translate()
  self.assertEqual(str(caught.exception),'invalid local record')
  self.assertIsInstance(caught.exception.__cause__,KeyError);self.assertEqual(caught.exception.__cause__.args,('id',))
if __name__=='__main__':unittest.main()
