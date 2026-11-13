import unittest,pathlib,json,gzip,math
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["physics-quantum-measurement","physics-v09-scenario-analysis-quantum-measurement-probabilities-become-outcomes","physics-v09-decision-lab-quantum-measurement-probabilities-become-outcomes","physics-v09-teach-back-lab-quantum-measurement-probabilities-become-outcomes"]
def probabilities(state):
 p=tuple(abs(x)**2 for x in state)
 if len(p)!=2 or not math.isclose(sum(p),1,rel_tol=0,abs_tol=1e-12):raise ValueError('unit two-component state required')
 return p
def h(state):
 a,b=state;return ((a+b)/math.sqrt(2),(a-b)/math.sqrt(2))
class MeasurementLabBoundaries(unittest.TestCase):
 def assertVector(self,a,b):
  for x,y in zip(a,b):self.assertAlmostEqual(abs(x-y),0,places=12)
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/measurement-lab-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/physics/quantum.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),90)
  for k in b:
   changed={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/physics/quantum.json').read_bytes())
  for k in IDS:self.assertIn('https://learn.microsoft.com/en-us/azure/quantum/concepts-the-qubit',' '.join(d[k]['reasoningSteps']))
 def test_complex_probabilities(self):
  state=(3/5,4j/5);p=probabilities(state);self.assertVector(p,(9/25,16/25));self.assertAlmostEqual(sum(p),1)
  self.assertTrue(all(0<=x<=1 for x in p));self.assertAlmostEqual((state[1]**2).real,-16/25)
  self.assertAlmostEqual((state[1].conjugate()*state[1]).real,16/25)
  with self.assertRaises(ValueError):probabilities((1,1))
  with self.assertRaises(ValueError):probabilities((0,0))
 def test_global_phase(self):
  state=(3/5,4j/5);phased=tuple(1j*x for x in state);self.assertVector(phased,(3j/5,-4/5))
  self.assertVector(probabilities(state),probabilities(phased));self.assertVector(h(phased),tuple(1j*x for x in h(state)))
  self.assertVector(probabilities(h(state)),probabilities(h(phased)))
 def test_relative_phase(self):
  plus=(1/math.sqrt(2),1/math.sqrt(2));minus=(plus[0],-plus[1])
  self.assertVector(probabilities(plus),(.5,.5));self.assertVector(probabilities(minus),(.5,.5))
  self.assertVector(h(plus),(1,0));self.assertVector(h(minus),(0,1))
  self.assertVector(h(h(plus)),plus);self.assertVector(h(h(minus)),minus)
 def test_conditional_repeat(self):
  self.assertVector(probabilities((1,0)),(1,0));self.assertVector(probabilities((0,1)),(0,1))
  fresh=probabilities((3/5,4j/5));self.assertVector(fresh,(9/25,16/25))
  self.assertNotEqual(fresh,probabilities((1,0)));self.assertNotEqual(fresh,probabilities((0,1)))
  self.assertVector(probabilities(h((1,0))),(.5,.5))
if __name__=='__main__':unittest.main()
