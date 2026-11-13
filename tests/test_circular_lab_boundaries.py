import unittest,pathlib,json,gzip,math
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["physics-v06-lab-centripetal-acceleration","physics-v09-troubleshooting-lab-centripetal-acceleration","physics-v09-design-review-centripetal-acceleration","physics-v09-scenario-analysis-centripetal-acceleration"]
def radial(v,r):
 if r<=0:raise ValueError('positive radius required')
 return v*v/r
def dot(a,b):return sum(x*y for x,y in zip(a,b))
class CircularLabBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/circular-lab-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/physics/lab.json').read_bytes())
  c=json.loads(gzip.decompress((R/'tests/baselines/series-circuit-evidence.json.gz').read_bytes()))
  self.assertEqual(list(b),list(d));self.assertEqual(list(c),list(d));self.assertEqual(len(d),92)
  for k in IDS:self.assertEqual(d[k],c[k],k)
  for k in b:
   changed={f for f in set(b[k])|set(c[k]) if b[k].get(f)!=c[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/physics/lab.json').read_bytes())
  for k in IDS:self.assertIn('https://openstax.org/books/university-physics-volume-1/pages/4-4-uniform-and-nonuniform-circular-motion',' '.join(d[k]['reasoningSteps']))
 def test_controlled_variable(self):
  self.assertEqual([radial(F(6),F(r)) for r in [2,4]],[18,9])
  self.assertEqual([F(3)**2*r for r in [2,4]],[18,36])
  for r in [F(1,2),F(2),F(4)]:self.assertEqual(radial(3*r,r),9*r)
  for r in [0,-1]:
   with self.assertRaises(ValueError):radial(F(6),r)
 def test_cardinal_vectors(self):
  positions=[(2,0),(0,2),(-2,0),(0,-2)]
  velocities=[];accelerations=[]
  for x,y in positions:
   v=(-3*y,3*x);a=(-9*x,-9*y);velocities.append(v);accelerations.append(a)
   self.assertEqual(dot((x,y),v),0);self.assertEqual(dot(v,a),0)
   self.assertEqual(dot(v,v),36);self.assertEqual(dot(a,a),324);self.assertLess(dot((x,y),a),0)
  self.assertEqual(velocities[:2],[(0,6),(-6,0)]);self.assertEqual(accelerations[:2],[(-18,0),(0,-18)])
  self.assertNotEqual(velocities[0],velocities[1])
 def test_rpm_units(self):
  frequency=F(120,60);period=1/frequency;r=F(1,2)
  self.assertEqual(frequency,2);self.assertEqual(period,F(1,2))
  omega=2*math.pi*float(frequency);v=omega*float(r)
  self.assertAlmostEqual(omega,4*math.pi,places=12);self.assertAlmostEqual(v,2*math.pi,places=12)
  self.assertAlmostEqual(v,2*math.pi*float(r)/float(period),places=12)
  self.assertAlmostEqual(v*v/float(r),8*math.pi**2,places=12)
  self.assertAlmostEqual(omega*omega*float(r),v*v/float(r),places=12)
 def test_radial_tangential(self):
  ac=radial(F(3),F(3));self.assertEqual(ac,3)
  up=(-ac,4);down=(-ac,-4);v=(0,3)
  self.assertEqual(dot(up,up),25);self.assertEqual(dot(down,down),25)
  self.assertEqual(math.hypot(*up),5);self.assertNotEqual(math.hypot(*up),ac+4)
  self.assertEqual(dot(v,up),12);self.assertEqual(dot(v,down),-12);self.assertNotEqual(up,down)
if __name__=='__main__':unittest.main()
