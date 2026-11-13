"""Exact-rational thermodynamic models with explicit boundary and sign assumptions."""
import pathlib,json,gzip,unittest
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/physics/thermodynamics.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/thermodynamic-boundaries.json.gz').read_bytes()))
IDS=["physics-v09-worked-example-entropy","physics-v09-decision-lab-first-law-of-thermodynamics","physics-v09-failure-analysis-lab-first-law-of-thermodynamics","physics-v09-evidence-verification-la-heat","physics-v09-practical-lab-temperature","physics-v09-design-review-the-ideal-gas-law"]
SLUGS=["4-6-entropy","3-3-first-law-of-thermodynamics","3-3-first-law-of-thermodynamics","1-4-heat-transfer-specific-heat-and-calorimetry","1-2-thermometers-and-temperature-scales","2-1-molecular-model-of-an-ideal-gas"]
class ThermodynamicBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  self.assertEqual(list(D),list(B));self.assertEqual(len(D),96)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,slug in zip(IDS,SLUGS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6)
    self.assertIn('https://openstax.org/books/university-physics-volume-2/pages/'+slug,D[k][f][-1])
 def test_reservoir_entropy(self):
  hot,cold=-F(120,600),F(120,300)
  self.assertEqual(hot,-F(1,5));self.assertEqual(cold,F(2,5));self.assertEqual(hot+cold,F(1,5))
  self.assertEqual(-120+120,0);self.assertLess(-hot-cold,0)
  for tc in [100,200,300,400]:
   self.assertEqual(F(120,tc)-F(120,tc),0)
   for th in [tc+1,tc*2,tc*3]:self.assertGreater(F(120,tc)-F(120,th),0)
  self.claim(0,'1/5 J/K','reversible reference path','no work')
 def test_state_and_path(self):
  a,b=(500,300),(800,600)
  self.assertEqual(a[0]-a[1],200);self.assertEqual(b[0]-b[1],200)
  q,w=a[0]-b[0],a[1]-b[1]
  self.assertEqual((q,w,q-w),(-300,-300,0))
  for heat,work in [a,b,(-800,-600)]:
   self.assertEqual(heat-work,heat+(-work))
  self.claim(1,'200 J','-300 J','physically realizable')
 def test_adiabatic_work(self):
  def delta_u(q,w_by):return q-w_by
  self.assertEqual(delta_u(0,-90),90)
  self.assertEqual(delta_u(0,90),-90)
  self.assertEqual(delta_u(0,0),0)
  for won in [-90,0,90]:self.assertEqual(delta_u(0,-won),won)
  self.claim(2,'not constant temperature','+90 J','heat capacity')
 def test_heat_capacity_weighting(self):
  def equilibrium(c1,t1,c2,t2):return F(c1*t1+c2*t2,c1+c2)
  tf=equilibrium(100,60,300,20)
  self.assertEqual(tf,30);self.assertTrue(20<tf<60)
  self.assertEqual((100*(tf-60),300*(tf-20)),(-3000,3000))
  self.assertEqual(100*(40-60)+300*(40-20),4000)
  self.assertEqual(equilibrium(100,60,100,20),40)
  offset=F(27315,100)
  self.assertEqual(equilibrium(100,60+offset,300,20+offset),tf+offset)
  self.claim(3,'303.15 K','4000 J','phase changes')
 def test_temperature_affine_scale(self):
  off=F(27315,100);t1,t2=20+off,40+off
  self.assertEqual(t2-t1,20);self.assertEqual(t2/t1,F(6263,5863))
  self.assertNotEqual(t2/t1,2)
  self.assertEqual(2*t1-off,F(31315,100))
  self.assertEqual(F(9,5)*(t2-t1),36)
  self.assertEqual((50+off)-(30+off),20)
  self.assertNotEqual((50+off)/(30+off),t2/t1)
  self.claim(4,'6263/5863','313.15 C','36 F')
 def test_absolute_pressure(self):
  def final_gauge(gauge,ambient,t1,t2):
   return (gauge+ambient)*F(t2,t1)-ambient
  self.assertEqual(final_gauge(100,100,300,600),300)
  self.assertEqual(F(200,300),F(400,600))
  self.assertEqual(final_gauge(0,100,300,600),100)
  self.assertNotEqual(100*F(600,300),300)
  for gauge in [0,50,100,200]:
   final=final_gauge(gauge,100,300,600)
   self.assertEqual(F(final+100,600),F(gauge+100,300))
  self.claim(5,'absolute pressure','300 kPa','not a safe heating procedure')
if __name__=='__main__':unittest.main()
