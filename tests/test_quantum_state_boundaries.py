"""Tiny ideal-state calculations, no quantum device or external simulator."""
import pathlib,json,gzip,unittest,math
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/advanced/quantum.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/quantum-state-boundaries.json.gz').read_bytes()))
IDS=["advanced-v07-qubit-state-vector","advanced-v07-relative-phase","advanced-v09-quick-reference-quantum-tensor-product","advanced-v07-bell-state","advanced-v09-teach-back-lab-the-no-cloning-theorem","advanced-v07-unitary-quantum-gate"]
REFS=["https://learn.microsoft.com/en-us/azure/quantum/concepts-the-qubit","https://learn.microsoft.com/en-us/azure/quantum/concepts-the-qubit","https://learn.microsoft.com/en-us/azure/quantum/concepts-multiple-qubits","https://learn.microsoft.com/en-us/azure/quantum/concepts-multiple-qubits","https://learn.microsoft.com/en-us/azure/quantum/concepts-multiple-qubits","https://learn.microsoft.com/en-us/azure/quantum/concepts-multiple-qubits"]
S=1/math.sqrt(2)
def inner(a,b):return sum(x.conjugate()*y for x,y in zip(a,b))
def probabilities(v):return [abs(x)**2 for x in v]
def apply(m,v):return [sum(x*y for x,y in zip(row,v)) for row in m]
def tensor(a,b):return [x*y for x in a for y in b]
def gram(m):
 return [[sum(row[i].conjugate()*row[j] for row in m) for j in range(len(m[0]))] for i in range(len(m[0]))]
def normalized(v):
 norm=math.sqrt(sum(probabilities(v)))
 if norm==0:raise ValueError('zero vector')
 return [x/norm for x in v]
class QuantumStateBoundaries(unittest.TestCase):
 def closevec(self,a,b):
  self.assertEqual(len(a),len(b))
  for x,y in zip(a,b):self.assertLess(abs(x-y),1e-12)
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  self.assertEqual(list(D),list(B));self.assertEqual(len(D),116)
  for k in B:
   self.assertEqual(sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_complex_normalization(self):
  raw=[3,4j];state=[3/5,4j/5]
  self.assertAlmostEqual(sum(probabilities(raw)),25)
  self.closevec(normalized(raw),state);self.closevec(probabilities(state),[9/25,16/25])
  self.assertAlmostEqual(sum(probabilities(state)),1)
  with self.assertRaises(ValueError):normalized([0,0])
  self.closevec(probabilities([1j*x for x in state]),probabilities(state))
  self.claim(0,'9/25','16/25','zero vector','not guaranteed finite-shot')
 def test_relative_vs_global_phase(self):
  plus=[S,S];minus=[S,-S];u=[[S,S],[S,-S]]
  self.closevec(probabilities(plus),probabilities(minus))
  self.closevec(apply(u,plus),[1,0]);self.closevec(apply(u,minus),[0,1])
  for row,want in zip(gram(u),[[1,0],[0,1]]):self.closevec(row,want)
  for phase in [1,-1,1j,-1j]:
   self.closevec(probabilities(apply(u,[phase*x for x in plus])),[1,0])
   self.closevec(probabilities(apply(u,[phase*x for x in minus])),[0,1])
  self.claim(1,'Relative phase','global phase','not imply equal quantum states')
 def test_tensor_order(self):
  a=[3/5,4j/5];b=[0,1];ab=tensor(a,b);ba=tensor(b,a)
  self.closevec(ab,[0,3/5,0,4j/5]);self.closevec(ba,[0,0,3/5,4j/5])
  self.closevec([ab[i] for i in [0,2,1,3]],ba)
  p,q=probabilities(ab),probabilities(ba)
  self.closevec([p[0]+p[2],p[1]+p[3]],[0,1])
  self.closevec([q[0]+q[1],q[2]+q[3]],[0,1])
  self.assertAlmostEqual(sum(p),1);self.assertAlmostEqual(sum(q),1)
  self.claim(2,'left bit','right bit','register order')
 def test_marginals_vs_joint(self):
  bell=[S,0,0,S];product=tensor([S,S],[S,S])
  p,q=probabilities(bell),probabilities(product)
  self.closevec(p,[.5,0,0,.5]);self.closevec(q,[.25]*4)
  for v in [p,q]:
   self.closevec([v[0]+v[1],v[2]+v[3]],[.5,.5])
   self.closevec([v[0]+v[2],v[1]+v[3]],[.5,.5])
  self.assertAlmostEqual(p[0]+p[3],1);self.assertAlmostEqual(q[0]+q[3],.5)
  determinant=lambda v:v[0]*v[3]-v[1]*v[2]
  self.assertAlmostEqual(determinant(bell),.5);self.assertAlmostEqual(determinant(product),0)
  self.claim(3,'do not prove entanglement','classical mixture','additional evidence')
 def test_cnot_not_general_cloning(self):
  cnot=[[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0]]
  self.closevec(apply(cnot,tensor([1,0],[1,0])),[1,0,0,0])
  self.closevec(apply(cnot,tensor([0,1],[1,0])),[0,0,0,1])
  actual=apply(cnot,tensor([S,S],[1,0]));desired=tensor([S,S],[S,S])
  self.closevec(actual,[S,0,0,S]);self.closevec(desired,[.5]*4)
  self.assertGreater(sum(abs(x-y)**2 for x,y in zip(actual,desired)),.5)
  self.assertNotEqual(probabilities(actual),probabilities(desired))
  self.claim(4,'not by itself the general proof','counterexample','first qubit as control')
 def test_unitarity_not_just_column_lengths(self):
  a=[[1,1],[0,0]];x=[[0,1],[1,0]]
  for basis in [[1,0],[0,1]]:self.assertAlmostEqual(sum(probabilities(apply(a,basis))),1)
  self.assertEqual(inner(apply(a,[1,0]),apply(a,[0,1])),1)
  self.assertEqual(gram(a),[[1,1],[1,1]]);self.assertEqual(gram(x),[[1,0],[0,1]])
  self.assertAlmostEqual(sum(probabilities(apply(a,[S,S]))),2)
  for v in [[1,0],[0,1],[S,S],[3/5,4j/5]]:
   self.assertAlmostEqual(sum(probabilities(apply(x,v))),1)
   self.closevec(apply(x,apply(x,v)),v)
  self.claim(5,'orthonormal columns','squared norm 2','Renormalizing')
if __name__=='__main__':unittest.main()
