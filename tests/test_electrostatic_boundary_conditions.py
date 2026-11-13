"""Exact arithmetic for explicitly bounded electrostatic/circuit models."""
import pathlib,json,gzip,unittest
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/physics/electricity.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/electrostatic-boundary-conditions.json.gz').read_bytes()))
IDS=["physics-v10-exam-style-practic-capacitance-2","physics-v10-decision-matrix-lab-capacitance","physics-v10-concept-connection-capacitance-storing-energy-in-an-electric-field","physics-v10-transfer-challenge-electric-field-2","physics-v10-transfer-lab-electric-potential-difference","physics-v10-worked-walkthrough-ohm-law-2"]
REFS=["https://openstax.org/books/university-physics-volume-2/pages/8-5-molecular-model-of-a-dielectric","https://openstax.org/books/university-physics-volume-2/pages/8-5-molecular-model-of-a-dielectric","https://openstax.org/books/university-physics-volume-2/pages/8-3-energy-stored-in-a-capacitor","https://openstax.org/books/university-physics-volume-2/pages/7-3-calculations-of-electric-potential","https://openstax.org/books/university-physics-volume-2/pages/7-3-calculations-of-electric-potential","https://openstax.org/books/university-physics-volume-2/pages/10-1-electromotive-force"]
MICRO=F(1,10**6);NANO=F(1,10**9)
def energy(c,v):return c*v*v/2
def point_values(charges,x):
 k=F(9*10**9);potential=F(0);field=F(0)
 for q,position in charges:
  delta=x-position;distance=abs(delta)
  if distance==0:raise ValueError('source singularity')
  potential+=k*q/distance;field+=k*q*delta/distance**3
 return potential,field
class ElectrostaticBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  self.assertEqual(list(D),list(B));self.assertEqual(len(D),112)
  for k in B:
   self.assertEqual(sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_isolated_dielectric(self):
  c=2*MICRO;v=F(12);q=c*v;initial=energy(c,v)
  self.assertEqual(q,24*MICRO);self.assertEqual(initial,144*MICRO)
  final_c=3*c;final_v=q/final_c;final=energy(final_c,final_v)
  self.assertEqual(final_c,6*MICRO);self.assertEqual(final_v,4)
  self.assertEqual(final,q*q/(2*final_c));self.assertEqual(final,48*MICRO)
  self.assertEqual(initial-final,96*MICRO)
  self.claim(0,'free plate charge stays','48 microjoules','mechanical work')
 def test_connected_dielectric(self):
  c=2*MICRO;v=F(12);final_c=3*c
  q0=c*v;q1=final_c*v;u0=energy(c,v);u1=energy(final_c,v)
  self.assertEqual((q0,q1),(24*MICRO,72*MICRO))
  self.assertEqual((u0,u1),(144*MICRO,432*MICRO))
  source_work=v*(q1-q0);delta=u1-u0;mechanical=source_work-delta
  self.assertEqual(source_work,576*MICRO);self.assertEqual(delta,288*MICRO);self.assertEqual(mechanical,288*MICRO)
  self.assertEqual(source_work,delta+mechanical)
  self.claim(1,'576 microjoules','remaining 288 microjoules','voltage remains 12 V')
 def test_charge_sharing(self):
  c1=c2=2*MICRO;v1=F(12);v2=F(0)
  q=c1*v1+c2*v2;vf=q/(c1+c2)
  self.assertEqual(q,24*MICRO);self.assertEqual(vf,6);self.assertEqual(c1*vf,12*MICRO)
  initial=energy(c1,v1)+energy(c2,v2);final=energy(c1,vf)+energy(c2,vf)
  self.assertEqual((initial,final),(144*MICRO,72*MICRO))
  effective=c1*c2/(c1+c2)
  # Integrate R*i0^2*exp(-2t/tau): R*i0^2*tau/2.
  for resistance in [F(1),F(10),F(1000)]:
   tau=resistance*effective;i0=(v1-v2)/resistance
   heat=resistance*i0*i0*tau/2
   self.assertEqual(heat,initial-final);self.assertEqual(heat,72*MICRO)
  self.claim(2,'finite positive resistance','72 microjoules','singular idealization')
 def test_equal_charge_midpoint(self):
  charges=[(NANO,F(-1,10)),(NANO,F(1,10))]
  self.assertEqual(point_values(charges,F(0)),(180,0))
  self.assertEqual(point_values(charges[:1],F(0)),(90,900));self.assertEqual(point_values(charges[1:],F(0)),(90,-900))
  # Symmetry makes the centered local slope zero; nearby potential is not constant.
  h=F(1,1000);left=point_values(charges,-h)[0];right=point_values(charges,h)[0]
  self.assertEqual((right-left)/(2*h),0);self.assertNotEqual(right,180)
  shift=F(37);self.assertEqual(((right+shift)-(left+shift))/(2*h),0)
  self.claim(3,'180 V','vector sum is zero','reference')
 def test_opposite_charge_midpoint(self):
  charges=[(NANO,F(-1,10)),(-NANO,F(1,10))]
  self.assertEqual(point_values(charges,F(0)),(0,1800))
  self.assertEqual(point_values(charges[1:],F(0)),(-90,900))
  potential,field=point_values(charges,F(0))
  self.assertEqual(NANO*field,F(18,10)*MICRO);self.assertEqual(NANO*potential,0)
  h=F(1,100000);gradient=-(point_values(charges,h)[0]-point_values(charges,-h)[0])/(2*h)
  self.assertLess(abs(gradient-field),F(1,1000))
  self.claim(4,'E_x=1800 N/C','not evidence of zero force');self.assertIn('1.8 micronewtons',' '.join(D[IDS[4]]['labPlan']))
 def test_loaded_source(self):
  emf=F(12);internal=F(1)
  for load,expected in [(F(5),(2,10,24,20,4)),(F(11),(1,11,12,11,1))]:
   current=emf/(load+internal);terminal=current*load
   supplied=emf*current;received=current*current*load;heat=current*current*internal
   self.assertEqual((current,terminal,supplied,received,heat),expected)
   self.assertEqual(terminal,emf-current*internal);self.assertEqual(supplied,received+heat)
  self.claim(5,'10 V','20 W','11 W','discharging-model')
if __name__=='__main__':unittest.main()
