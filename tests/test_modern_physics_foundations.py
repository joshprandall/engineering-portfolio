"""Exact arithmetic on declared rounded inputs; not experimental physics validation."""
import pathlib,json,gzip,unittest,math
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/physics/modern-physics.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/modern-physics-foundations.json.gz').read_bytes()))
IDS=['physics-photons','physics-v06-photon-energy','physics-v08-deep-dive-photon-energy','physics-v08-evidence-lab-photon-energy','physics-debroglie','physics-v06-de-broglie-wavelength','physics-special-relativity','physics-v09-worked-example-special-relativity-space-and-time-depend-on-motion']
SLUGS=['6-2-photoelectric-effect']*4+['6-5-de-broglies-matter-waves']*2+['5-3-time-dilation','5-4-length-contraction']
H=F('6.626e-34');C=F('3e8');EV=F('1.602e-19')
def photon_energy(wavelength):
 if wavelength<=0:raise ValueError('Positive vacuum wavelength required')
 return H*C/wavelength
def matter_wavelength(momentum):
 if momentum<=0:raise ValueError('Positive momentum magnitude required')
 return H/momentum
def gamma(beta):
 if abs(beta)>=1:raise ValueError('Massive-clock inertial domain requires abs(beta)<1')
 return 1/math.sqrt(1-beta*beta)
class ModernPhysicsEvidence(unittest.TestCase):
 def claim(self,i,*values):
  t=' '.join(D[IDS[i]]['reasoningSteps'])
  for v in values:self.assertIn(v,t)
 def test_scope(self):
  self.assertEqual(list(B),list(D));self.assertEqual(len(D),96)
  for k in B:
   fields=sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f))
   self.assertEqual(fields,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_structure_sources(self):
  for i,k in enumerate(IDS):
   x=D[k];self.assertNotIn('mean, why does it matter',x['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(x[f]),6);self.assertEqual(len(set(x[f])),6)
   self.assertIn('https://openstax.org/books/university-physics-volume-3/pages/'+SLUGS[i],x['reasoningSteps'][-1])
   self.assertIn('rounded teaching inputs',x['reasoningSteps'][-1])
 def test_photon_units_and_energy(self):
  wavelength=F(500)*F('1e-9');self.assertEqual(wavelength,F('5e-7'))
  frequency=C/wavelength;energy=H*frequency
  self.assertEqual(frequency,F('6e14'));self.assertEqual(energy,F('3.9756e-19'))
  self.assertEqual(round(float(energy/EV),2),2.48);self.assertEqual(2*energy,F('7.9512e-19'))
  with self.assertRaises(ValueError):photon_energy(F(0))
  self.claim(0,'6.00e14 Hz','3.9756e-19 J','2.48eV','rounded')
 def test_wavelength_and_rate_ratios(self):
  short=photon_energy(F('400e-9'));long=photon_energy(F('800e-9'))
  self.assertEqual(short,F('4.9695e-19'));self.assertEqual(long,F('2.48475e-19'));self.assertEqual(short/long,2)
  power=F('0.001');self.assertEqual((power/long)/(power/short),2)
  self.claim(1,'4.9695e-19 J','2.48475e-19 J','twice the average photon arrival rate')
 def test_single_photon_threshold(self):
  maximum=lambda energy,work:energy-work if energy>=work else None
  self.assertEqual(maximum(F(3),F(2)),1);self.assertIsNone(maximum(F('1.5'),F(2)))
  for count in [1,10,1000000]:self.assertIsNone(maximum(F('1.5'),F(2)))
  self.claim(2,'Kmax=3-2=1eV','no photoemission','excludes multiphoton','maximum energy')
 def test_flux_average_and_power(self):
  power=F('0.001');wavelength=F('500e-9');energy=photon_energy(wavelength);rate=power/energy
  self.assertEqual(round(float(rate/F('1e15')),2),2.52);self.assertEqual(rate*energy,power)
  self.assertEqual((2*power)/energy,2*rate);self.assertEqual(power/photon_energy(2*wavelength),2*rate)
  self.claim(3,'2.52e15','average ideal photon rate','0.001W','not a guarantee')
 def test_debroglie_momentum(self):
  p=F('3.313e-24');w=matter_wavelength(p)
  self.assertEqual(w,F('2e-10'));self.assertEqual(w/F('1e-9'),F('0.200'));self.assertEqual(matter_wavelength(2*p),F('1e-10'))
  with self.assertRaises(ValueError):matter_wavelength(F(0))
  self.claim(4,'2.00e-10 m','0.200nm','1.00e-10 m','does not say')
 def test_nonrelativistic_approximation(self):
  mass=F('2e-27');velocity=F(1000)
  self.assertEqual(velocity/C,F(1,300000));self.assertEqual(mass*velocity,F('2e-24'))
  self.assertEqual(matter_wavelength(mass*velocity),F('3.313e-10'))
  self.assertEqual(matter_wavelength(mass*2*velocity),F('1.6565e-10'))
  self.claim(5,'1/300000','3.313e-10 m','1.6565e-10 m','p=gamma*m*v')
 def test_proper_time(self):
  beta=F(3,5);self.assertEqual(1/(1-beta*beta),F(25,16))
  g=F(5,4);self.assertEqual(g*g,F(25,16));self.assertEqual(8*g,10);self.assertEqual(F(10)/g,8)
  self.assertEqual(gamma(0.6),1.25)
  for b in [1,-1,1.1]:
   with self.assertRaises(ValueError):gamma(b)
  self.claim(6,'proper time 8 microseconds','10 microseconds','same two ticks','neglects gravity')
 def test_parallel_length_contraction(self):
  g=F(5,4);rest=F(100);moving=rest/g
  self.assertEqual(moving,80);self.assertEqual(rest*g,125);self.assertEqual(moving*g,100)
  self.claim(7,'L=L0/gamma=80m','same coordinate time','125m','Transverse dimensions','camera image')
if __name__=='__main__':unittest.main()
