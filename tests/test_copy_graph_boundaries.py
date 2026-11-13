import unittest,pathlib,json,gzip,copy
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-v09-scenario-analysis-python-lists","software-v09-failure-analysis-lab-python-lists","software-v09-scenario-analysis-python-mutable-and-immutable-types","software-v09-design-review-python-dictionaries"]
class CopyGraphBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/copy-graph-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/programming.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),158)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/software/programming.json').read_bytes())
  for k in IDS:
   self.assertIn('https://docs.python.org/3.13/library/copy.html',' '.join(d[k]['reasoningSteps']))
   self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_shared_child(self):
  shared=[1];source=[shared,shared];clone=copy.deepcopy(source)
  self.assertIs(source[0],source[1]);self.assertIsNot(clone,source);self.assertIsNot(clone[0],shared);self.assertIs(clone[0],clone[1])
  clone[0].append(9);self.assertEqual(clone,[[1,9],[1,9]]);self.assertEqual(source,[[1],[1]])
 def test_cycle(self):
  source=[];source.append(source);shallow=copy.copy(source);clone=copy.deepcopy(source)
  self.assertIs(source[0],source);self.assertIsNot(shallow,source);self.assertIs(shallow[0],source)
  self.assertIsNot(clone,source);self.assertIs(clone[0],clone);self.assertEqual(len(clone),1)
 def test_copy_pass(self):
  left=[1];right=left;together=copy.deepcopy([left,right]);separate=[copy.deepcopy(left),copy.deepcopy(right)]
  self.assertIs(together[0],together[1]);self.assertIsNot(together[0],left);self.assertIsNot(separate[0],separate[1])
  together[0].append(2);separate[0].append(2)
  self.assertEqual(together,[[1,2],[1,2]]);self.assertEqual(separate,[[1,2],[1]]);self.assertEqual(left,[1]);self.assertIs(right,left)
 def test_dictionary_rebinding(self):
  source={'config':{'retries':2}};shallow=source.copy()
  self.assertIsNot(source,shallow);self.assertIs(source['config'],shallow['config'])
  shallow['config']['retries']=3;self.assertEqual(source['config']['retries'],3)
  shallow['config']={'retries':4};self.assertEqual(source['config']['retries'],3);self.assertEqual(shallow['config']['retries'],4)
  self.assertIsNot(source['config'],shallow['config'])
  fresh={'config':{'retries':2}};deep=copy.deepcopy(fresh);deep['config']['retries']=4
  self.assertIsNot(deep['config'],fresh['config']);self.assertEqual(fresh['config']['retries'],2);self.assertEqual(deep['config']['retries'],4)
if __name__=='__main__':unittest.main()
