"""Ideal wave/SHM arithmetic, no audio generation or device operation."""
import pathlib,json,gzip,unittest,math
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/physics/waves.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/wave-motion-boundaries.json.gz').read_bytes()))
IDS=["physics-v09-design-review-traveling-wave-speed","physics-v09-scenario-analysis-wave-superposition","physics-v09-troubleshooting-lab-sound-frequency-and-pitch","physics-v09-design-review-doppler-effect","physics-v09-misconception-clinic-doppler-effect","physics-v09-failure-analysis-lab-simple-harmonic-motion"]
REFS=["https://openstax.org/books/university-physics-volume-1/pages/16-2-mathematics-of-waves","https://openstax.org/books/university-physics-volume-1/pages/16-5-interference-of-waves","https://openstax.org/books/university-physics-volume-1/pages/17-6-beats","https://openstax.org/books/university-physics-volume-1/pages/17-7-the-doppler-effect","https://openstax.org/books/university-physics-volume-1/pages/17-7-the-doppler-effect","https://openstax.org/books/university-physics-volume-1/pages/15-1-simple-harmonic-motion"]
class WaveMotionBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  self.assertEqual(list(D),list(B));self.assertEqual(len(D),103)
  for k in B:self.assertEqual(sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_pattern_vs_particle_velocity(self):
  amplitude,k,w=F(2,100),F(2),F(12)
  self.assertEqual(w/k,6);self.assertEqual(amplitude*w,F(24,100))
  phase=F(1);x=lambda t:(phase+w*t)/k
  self.assertEqual((x(3)-x(1))/2,6)
  xleft=lambda t:(phase-w*t)/k
  self.assertEqual((xleft(3)-xleft(1))/2,-6)
  self.assertEqual(2*amplitude*w,F(48,100))
  # Independent centered finite difference at x=t=0.
  h=1e-6;y=lambda t:.02*math.sin(-12*t)
  self.assertAlmostEqual((y(h)-y(-h))/(2*h),-.24,places=8)
  self.claim(0,'0.24 m/s','6 m/s','different motions')
 def test_interference(self):
  amplitude=lambda phi:math.sqrt(4+1+4*math.cos(phi))
  self.assertAlmostEqual(amplitude(math.pi),1);self.assertAlmostEqual(amplitude(0),3)
  self.assertAlmostEqual(amplitude(math.pi/2),math.sqrt(5))
  for theta in [0,.2,.7,1.1,2.4,math.pi]:
   self.assertAlmostEqual(2*math.cos(theta)+math.cos(theta+math.pi),math.cos(theta))
   self.assertAlmostEqual(2*math.cos(theta)+2*math.cos(theta+math.pi),0)
  self.claim(1,'1 cm','sqrt(5)','equal amplitudes','energy is destroyed')
 def test_beats(self):
  f1,f2=440,444
  self.assertEqual(abs(f2-f1),4);self.assertEqual(F(f1+f2,2),442);self.assertEqual(F(f2-f1,2),2)
  for t in [.0003,.0037,.017,.137,.263]:
   direct=math.cos(2*math.pi*f1*t)+math.cos(2*math.pi*f2*t)
   factored=2*math.cos(2*math.pi*2*t)*math.cos(2*math.pi*442*t)
   self.assertAlmostEqual(direct,factored,places=10)
  for t in [0,.25,.5,.75,1]:self.assertAlmostEqual(abs(math.cos(4*math.pi*t)),1)
  for t in [.125,.375,.625,.875]:self.assertAlmostEqual(math.cos(4*math.pi*t),0)
  self.claim(2,'4 Hz','2 Hz','does not require generating sound')
 def test_source_observer_asymmetry(self):
  v,f,s=F(340),F(500),F(34)
  observer=f*(v+s)/v;source=f*v/(v-s)
  self.assertEqual(observer,550);self.assertEqual(source,F(5000,9));self.assertEqual(source-observer,F(50,9))
  self.assertEqual(v/((v-s)/f),source);self.assertEqual((v+s)/(v/f),observer)
  self.assertEqual(f*(v+0)/v,f);self.assertEqual(f*v/(v-0),f)
  self.claim(3,'medium','5000/9','neither calculation is the relativistic')
 def test_inverse_doppler_ratio(self):
  v,f,s=F(340),F(500),F(34)
  approach=f*v/(v-s);recede=f*v/(v+s);ratio=approach/recede
  self.assertEqual((approach,recede),(F(5000,9),F(5000,11)))
  self.assertEqual(ratio,F(11,9));self.assertEqual(v*(ratio-1)/(ratio+1),34)
  self.assertGreater(approach,f);self.assertLess(recede,f)
  self.assertNotEqual(approach-f,f-recede)
  self.assertEqual(v*(F(1)-1)/(F(1)+1),0)
  self.claim(4,'11/9','34 m/s','unchanged','geometry')
 def test_shm_phases(self):
  x=lambda t:.2*math.cos(5*t);v=lambda t:-math.sin(5*t);a=lambda t:-5*math.cos(5*t)
  expected=[(0,.2,0,-5),(math.pi/10,0,-1,0),(math.pi/5,-.2,0,5),(2*math.pi/5,.2,0,-5)]
  for t,xx,vv,aa in expected:
   self.assertAlmostEqual(x(t),xx);self.assertAlmostEqual(v(t),vv);self.assertAlmostEqual(a(t),aa)
   self.assertAlmostEqual(a(t),-25*x(t))
  for t in [.01,.17,.9,2.3]:self.assertAlmostEqual(a(t),-25*x(t))
  self.assertAlmostEqual((5/(2*math.pi))*(2*math.pi/5),1)
  self.claim(5,'instantaneously turning around','5/(2*pi)','maximum speed, not rest')
if __name__=='__main__':unittest.main()
