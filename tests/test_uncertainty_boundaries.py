import unittest,pathlib,json,gzip,math,cmath
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["physics-uncertainty","physics-v09-worked-example-the-uncertainty-principle","physics-v09-failure-analysis-lab-the-uncertainty-principle","physics-v09-evidence-verification-la-the-uncertainty-principle"]
def wave(x,sigma,mu=0,k=0,c=0):
 if sigma<=0:raise ValueError('positive width required')
 y=x-mu
 return (2*math.pi*sigma*sigma)**(-.25)*cmath.exp(-y*y/(4*sigma*sigma)+1j*(k*x+c*y*y/(4*sigma*sigma)))
def derivative(x,sigma,mu=0,k=0,c=0):
 y=x-mu
 return wave(x,sigma,mu,k,c)*(-y/(2*sigma*sigma)+1j*(k+c*y/(2*sigma*sigma)))
def moments(sigma,mu=0,k=0,c=0,n=4000):
 dx=20*sigma/n;norm=x1=x2=p2=0.;p1=0j
 for i in range(n):
  x=mu-10*sigma+(i+.5)*dx;v=wave(x,sigma,mu,k,c);d=derivative(x,sigma,mu,k,c);rho=abs(v)**2
  norm+=rho*dx;x1+=x*rho*dx;x2+=x*x*rho*dx;p1+=v.conjugate()*(-1j*d)*dx;p2+=abs(d)**2*dx
 return norm,x1,x2,p1,p2
class UncertaintyBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/uncertainty-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/physics/quantum.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),90)
  for key in b:
   changed={f for f in set(b[key])|set(d[key]) if b[key].get(f)!=d[key].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if key in IDS else set(),key)
 def test_source_and_claims(self):
  d=json.loads((R/'deep-learning/physics/quantum.json').read_bytes())
  for key,words in zip(IDS,[['standard deviations','dimensionless','exact support'],['second moment','minimum-uncertainty'],['chirp','phase','sqrt(1+c^2)/2'],['17/4','squared means']]):
   text=' '.join(d[key]['reasoningSteps'])
   self.assertIn('https://openstax.org/books/university-physics-volume-3/pages/7-2-the-heisenberg-uncertainty-principle',text)
   for word in words:self.assertIn(word,text)
 def test_normalization_and_unchirped_widths(self):
  for sigma in [.5,1,2]:
   norm,x,x2,p,p2=moments(sigma)
   self.assertAlmostEqual(norm,1,places=11);self.assertAlmostEqual(x,0,places=11)
   self.assertAlmostEqual(x2,sigma*sigma,places=10);self.assertAlmostEqual(abs(p),0,places=11)
   self.assertAlmostEqual(p2,1/(4*sigma*sigma),places=11)
   self.assertAlmostEqual(math.sqrt(x2*p2),.5,places=11)
  with self.assertRaises(ValueError):wave(0,0)
 def test_chirp_density_and_spread(self):
  for c in [0,1,-1,3]:
   for x in [-2,-.5,0,1,3]:self.assertAlmostEqual(abs(wave(x,1,c=c))**2,abs(wave(x,1))**2,places=13)
   norm,x,x2,p,p2=moments(1,c=c)
   self.assertAlmostEqual(x2,1,places=11);self.assertAlmostEqual(abs(p),0,places=11)
   self.assertAlmostEqual(p2,(1+c*c)/4,places=10)
   self.assertGreaterEqual(math.sqrt(x2*p2)+1e-11,.5)
 def test_derivative_and_refinement(self):
  h=1e-5
  for c in [0,1,-1,3]:
   for x in [-1,.25,2]:
    finite=(wave(x+h,1,mu=.5,k=2,c=c)-wave(x-h,1,mu=.5,k=2,c=c))/(2*h)
    self.assertLess(abs(finite-derivative(x,1,mu=.5,k=2,c=c)),2e-9)
  coarse=moments(1,c=1,n=1000);fine=moments(1,c=1,n=4000)
  self.assertAlmostEqual(coarse[4],fine[4],places=11);self.assertAlmostEqual(fine[4],.5,places=11)
 def test_centered_variances(self):
  norm,x,x2,p,p2=moments(1,mu=3,k=2)
  self.assertAlmostEqual(norm,1,places=11);self.assertAlmostEqual(x,3,places=11)
  self.assertAlmostEqual(x2,10,places=10);self.assertAlmostEqual(p.real,2,places=11);self.assertAlmostEqual(p.imag,0,places=11)
  self.assertAlmostEqual(p2,17/4,places=10)
  vx=x2-x*x;vp=p2-p.real*p.real
  self.assertAlmostEqual(vx,1,places=10);self.assertAlmostEqual(vp,.25,places=10)
  self.assertAlmostEqual(math.sqrt(vx*vp),.5,places=10)
  self.assertGreater(math.sqrt(x2*p2),.5)
if __name__=='__main__':unittest.main()
