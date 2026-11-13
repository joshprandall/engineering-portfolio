import unittest,pathlib,json,gzip
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-v10-checklist-lab-testing-at-multiple-layers","software-v10-trace-lab-testing-at-multiple-layers","software-v10-verification-lab-testing-at-multiple-layers","software-v10-design-critique-testing-at-multiple-layers"]
class UnittestLifecycleBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/unittest-lifecycle-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/testing.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),109)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/software/testing.json').read_bytes())
  for k in IDS:
   self.assertIn('https://docs.python.org/3.13/library/unittest.html',' '.join(d[k]['reasoningSteps']));self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_setup_failure_cleanup(self):
  events=[]
  class Fixture(unittest.TestCase):
   def setUp(self):
    events.append('setup');self.addCleanup(events.append,'cleanup-A');self.addCleanup(events.append,'cleanup-B');raise ValueError('setup')
   def runTest(self):events.append('body')
   def tearDown(self):events.append('tearDown')
  result=unittest.TestResult();Fixture().run(result)
  self.assertEqual(events,['setup','cleanup-B','cleanup-A']);self.assertEqual(result.testsRun,1);self.assertEqual(len(result.errors),1);self.assertEqual(result.failures,[]);self.assertFalse(result.wasSuccessful())
 def test_teardown_and_cleanup(self):
  for broken in [False,True]:
   events=[]
   class Fixture(unittest.TestCase):
    def setUp(self):events.append('setup');self.addCleanup(events.append,'cleanup-A');self.addCleanup(events.append,'cleanup-B')
    def runTest(self):events.append('body')
    def tearDown(self):
     events.append('tearDown')
     if broken:raise ValueError('tearDown')
   result=unittest.TestResult();Fixture().run(result)
   self.assertEqual(events,['setup','body','tearDown','cleanup-B','cleanup-A']);self.assertEqual(result.testsRun,1);self.assertEqual(len(result.errors),int(broken));self.assertEqual(result.wasSuccessful(),not broken)
 def test_subtests_preserve_failure(self):
  visited=[]
  class Fixture(unittest.TestCase):
   def runTest(self):
    for n in range(3):
     with self.subTest(n=n):visited.append(n);self.assertEqual(n%2,0)
  result=unittest.TestResult();result.failfast=False;Fixture().run(result)
  self.assertEqual(visited,[0,1,2]);self.assertEqual(result.testsRun,1);self.assertEqual(len(result.failures),1);self.assertEqual(result.errors,[]);self.assertFalse(result.wasSuccessful());self.assertIn('n=1',str(result.failures[0][0]))
 def test_exception_attribution(self):
  events=[]
  def prepare(broken):
   events.append('prepare')
   if broken:raise ValueError('prepare')
  def action():events.append('action');raise ValueError('action')
  with self.assertRaises(ValueError) as broad:
   prepare(True);action()
  self.assertEqual(events,['prepare']);self.assertEqual(str(broad.exception),'prepare')
  events.clear();prepare(False)
  with self.assertRaises(ValueError) as narrow:action()
  self.assertEqual(events,['prepare','action']);self.assertEqual(str(narrow.exception),'action')
if __name__=='__main__':unittest.main()
