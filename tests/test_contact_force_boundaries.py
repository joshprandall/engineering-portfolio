import unittest,pathlib,json,gzip
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["physics-v10-worked-walkthrough-newton-third-law","physics-v10-exam-style-practice-newton-s-third-law","physics-v10-scenario-brief-free-body-diagram","physics-v10-recovery-lab-friction-forces"]
class ContactForceBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/contact-force-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/physics/mechanics.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),120)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/physics/mechanics.json').read_bytes())
  for i,k in enumerate(IDS):
   self.assertIn('https://openstax.org/books/university-physics-volume-1/pages/'+('6-2-friction' if i==3 else '5-5-newtons-third-law'),' '.join(d[k]['reasoningSteps']))
   self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_force_receiver_ledger(self):
  forces={('support','object'):20,('object','support'):-20,('earth','object'):-20,('object','earth'):20}
  for (source,receiver),value in forces.items():self.assertEqual(forces[(receiver,source)],-value)
  self.assertEqual(sum(v for (s,r),v in forces.items() if r=='object'),0)
  self.assertNotEqual(('support','object')[::-1],('earth','object'))
  self.assertEqual(sum(v for (s,r),v in forces.items() if r=='support'),-20)
 def test_two_blocks(self):
  a=F(20,5);self.assertEqual(a,4)
  for pushed,other,contact in [(3,2,8),(2,3,12)]:
   self.assertEqual(other*a,contact);self.assertEqual(20-contact,pushed*a)
   self.assertEqual((20-contact)+contact,(pushed+other)*a)
 def test_support_acceleration(self):
  m,g=F(2),F(10)
  for a,n in [(2,24),(0,20),(-2,16),(-10,0)]:
   self.assertEqual(m*(g+a),n);self.assertEqual(n-m*g-m*a,0);self.assertGreaterEqual(n,0)
  self.assertEqual(m*(g-12),-4);self.assertLess(m*(g-12),0)
  self.assertEqual(m*g,20)
 def test_friction_regimes(self):
  m,g=F(5),F(10);n=m*g;limit=F(2,5)*n
  self.assertEqual(n,50);self.assertEqual(limit,20)
  for push in [0,12,20]:
   required=-push;self.assertLessEqual(abs(required),limit);self.assertEqual(push+required,0)
  self.assertGreater(25,limit);kinetic=F(3,10)*n
  self.assertEqual(kinetic,15);self.assertEqual((25-kinetic)/m,2)
if __name__=='__main__':unittest.main()
