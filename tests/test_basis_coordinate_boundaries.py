import unittest,pathlib,json,gzip
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["math-v08-deep-dive-basis","math-v08-evidence-lab-basis","math-v09-misconception-clinic-basis","math-v10-counterexample-lab-basis"]
def mv(a,v):return [sum(F(x)*F(y) for x,y in zip(row,v)) for row in a]
def det(a):return F(a[0][0])*a[1][1]-F(a[0][1])*a[1][0]
def coordinates(a,x):
 d=det(a)
 if not d:raise ValueError('dependent columns')
 return [(F(a[1][1])*x[0]-F(a[0][1])*x[1])/d,(-F(a[1][0])*x[0]+F(a[0][0])*x[1])/d]
class BasisCoordinateBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/basis-coordinate-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/math/linear-algebra.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),135)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/math/linear-algebra.json').read_bytes())
  for k in IDS:
   self.assertIn('https://textbooks.math.gatech.edu/ila/bases-as-coord-systems.html',' '.join(d[k]['reasoningSteps']));self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_nonstandard_roundtrip(self):
  a=[[1,1],[1,-1]];self.assertEqual(det(a),-2);self.assertEqual(coordinates(a,[4,2]),[3,1]);self.assertEqual(mv(a,[3,1]),[4,2])
  for x in [[0,0],[4,2],[F(1,2),F(-3,2)]]:self.assertEqual(mv(a,coordinates(a,x)),x)
  for c in [[0,0],[3,1],[F(-2,3),F(5,7)]]:self.assertEqual(coordinates(a,mv(a,c)),c)
 def test_order_and_scale(self):
  reversed_basis=[[1,1],[-1,1]];scaled=[[2,1],[2,-1]]
  self.assertEqual(coordinates(reversed_basis,[4,2]),[1,3]);self.assertEqual(mv(reversed_basis,[1,3]),[4,2]);self.assertEqual(mv(reversed_basis,[3,1]),[4,-2])
  self.assertEqual(coordinates(scaled,[4,2]),[F(3,2),1]);self.assertEqual(mv(scaled,[F(3,2),1]),[4,2]);self.assertEqual(mv(scaled,[3,1]),[7,5])
 def test_dependent_list(self):
  a=[[1,2],[2,4]];self.assertEqual(det(a),0);self.assertEqual(mv(a,[3,0]),[3,6]);self.assertEqual(mv(a,[1,1]),[3,6])
  for t in [F(-2),F(0),F(1),F(3,2),F(7,5)]:self.assertEqual(mv(a,[3-2*t,t]),[3,6])
  self.assertNotEqual(7,2*3)
  with self.assertRaises(ValueError):coordinates(a,[3,6])
 def test_subspace_membership(self):
  a=[[1,0],[0,1],[1,1]]
  def plane_coordinates(x):
   if x[2]!=x[0]+x[1]:raise ValueError('outside plane')
   return x[:2]
  self.assertEqual(mv(a,[2,-1]),[2,-1,1]);self.assertEqual(plane_coordinates([2,-1,1]),[2,-1])
  with self.assertRaises(ValueError):plane_coordinates([2,-1,0])
  for c in [[0,0],[1,0],[0,1],[F(2,3),F(-4,5)]]:self.assertEqual(plane_coordinates(mv(a,c)),c)
if __name__=='__main__':unittest.main()
