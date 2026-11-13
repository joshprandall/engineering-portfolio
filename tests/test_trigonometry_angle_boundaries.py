"""Independent angle-unit and geometric boundary fixtures."""
import pathlib,json,gzip,unittest,math
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/math/trigonometry.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/trigonometry-angle-boundaries.json.gz').read_bytes()))
IDS=["math-v09-misconception-clinic-radians","math-v09-decision-lab-radians","math-v09-scenario-analysis-unit-circle-coordinates","math-v09-teach-back-lab-unit-circle-coordinates","math-v09-quick-reference-unit-circle-coordinates","math-v09-troubleshooting-lab-radians"]
REFS=["https://openstax.org/books/precalculus-2e/pages/5-1-angles","https://openstax.org/books/precalculus-2e/pages/5-1-angles","https://openstax.org/books/precalculus-2e/pages/5-2-unit-circle-sine-and-cosine-functions","https://openstax.org/books/precalculus-2e/pages/5-2-unit-circle-sine-and-cosine-functions","https://docs.python.org/3/library/math.html","https://openstax.org/books/precalculus-2e/pages/5-1-angles"]
class AngleBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  self.assertEqual(list(D),list(B));self.assertEqual(len(D),97)
  for k in B:
   self.assertEqual(sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_arc_units_and_chord(self):
  for degrees in [60,90]:
   theta=math.radians(degrees);arc=6*theta
   self.assertAlmostEqual(arc,float(F(degrees,360))*2*math.pi*6)
   point=(6*math.cos(theta),6*math.sin(theta))
   chord=math.hypot(point[0]-6,point[1])
   self.assertAlmostEqual(chord,12*math.sin(theta/2));self.assertLess(chord,arc)
  self.assertAlmostEqual(6*math.radians(60),2*math.pi)
  self.assertAlmostEqual(12*math.sin(math.pi/6),6)
  self.assertEqual(6*60,360);self.assertNotAlmostEqual(360,2*math.pi)
  self.claim(0,'2*pi cm','360 cm','chord')
 def test_terminal_angle_not_distance(self):
  a=math.pi/2;b=5*math.pi/2
  self.assertAlmostEqual(math.sin(a),math.sin(b));self.assertAlmostEqual(math.cos(a),math.cos(b))
  self.assertAlmostEqual(2*a,math.pi);self.assertAlmostEqual(2*b,5*math.pi)
  increments=[math.pi,-math.pi]
  self.assertEqual(sum(increments),0);self.assertAlmostEqual(2*sum(map(abs,increments)),4*math.pi)
  self.assertEqual(2*abs(sum(increments)),0)
  self.claim(1,'pi and 5*pi','monotone segment','4*pi')
 def test_coordinate_normalization(self):
  x,y=F(-3),F(4);radius=5
  self.assertEqual(x*x+y*y,25);self.assertEqual((x/radius,y/radius),(F(-3,5),F(4,5)))
  self.assertEqual((x/radius)**2+(y/radius)**2,1)
  for scale in [F(1,2),F(2),F(7)]:
   self.assertEqual((x*scale/(radius*scale),y*scale/(radius*scale)),(F(-3,5),F(4,5)))
  def direction(x,y):
   norm=math.hypot(x,y)
   if norm==0:raise ValueError('zero direction')
   return x/norm,y/norm
  self.assertEqual(direction(-6,8),(-.6,.8))
  with self.assertRaises(ValueError):direction(0,0)
  self.claim(2,'(-3/5,4/5)','quadrant II','negative scale')
 def test_sine_ambiguity(self):
  a,b=math.pi/6,5*math.pi/6
  self.assertAlmostEqual(math.asin(.5),a)
  for k in range(-4,5):
   for theta in [a+2*math.pi*k,b+2*math.pi*k]:
    self.assertAlmostEqual(math.sin(theta),.5)
    self.assertAlmostEqual(math.sin(theta)**2+math.cos(theta)**2,1)
  self.assertAlmostEqual(math.cos(a),math.sqrt(3)/2);self.assertAlmostEqual(math.cos(b),-math.sqrt(3)/2)
  self.assertNotAlmostEqual(a,b);self.assertGreater(math.cos(a),0);self.assertLess(math.cos(b),0)
  self.claim(3,'5*pi/6','any integer','positive cosine')
 def test_atan2_quadrants(self):
  for x,y,angle in [(1,1,math.pi/4),(-1,1,3*math.pi/4),(-1,-1,-3*math.pi/4),(1,-1,-math.pi/4),(0,1,math.pi/2),(-3,4,math.atan2(4,-3))]:
   theta=math.atan2(y,x);self.assertAlmostEqual(theta,angle)
   radius=math.hypot(x,y);self.assertAlmostEqual(math.cos(theta),x/radius);self.assertAlmostEqual(math.sin(theta),y/radius)
  self.assertAlmostEqual(math.atan((-1)/(-1)),math.pi/4)
  self.assertAlmostEqual(math.atan2(-1,-1)%(2*math.pi),5*math.pi/4)
  self.assertNotAlmostEqual(math.atan2(4,-3),math.atan2(-3,4))
  self.claim(4,'y first, x second','5*pi/4','Reject (0,0)')
 def test_angular_and_linear_speeds(self):
  frequency=F(30,60);period=1/frequency;self.assertEqual(frequency,F(1,2));self.assertEqual(period,2)
  omega=2*math.pi*float(frequency);self.assertAlmostEqual(omega,math.pi)
  for radius in [2,5]:
   speed=radius*omega;self.assertAlmostEqual(speed,2*math.pi*radius/float(period))
  self.assertAlmostEqual((5*omega)/(2*omega),2.5)
  self.assertNotAlmostEqual(30,omega)
  self.claim(5,'30 revolutions per minute','2 seconds','nonnegative magnitude')
if __name__=='__main__':unittest.main()
