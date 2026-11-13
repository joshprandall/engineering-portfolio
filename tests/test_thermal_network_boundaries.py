import unittest,pathlib,json,gzip
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["physics-v09-teach-back-lab-heat","physics-v09-worked-example-heat-2","physics-v09-troubleshooting-lab-temperature","physics-v10-concept-mapping-lab-heat"]
REFS=["https://openstax.org/books/university-physics-volume-2/pages/1-6-mechanisms-of-heat-transfer","https://openstax.org/books/university-physics-volume-2/pages/1-6-mechanisms-of-heat-transfer","https://openstax.org/books/university-physics-volume-2/pages/1-4-heat-transfer-specific-heat-and-calorimetry","https://openstax.org/books/university-physics-volume-2/pages/1-4-heat-transfer-specific-heat-and-calorimetry"]
class ThermalNetworkBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/thermal-network-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/physics/thermodynamics.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),96)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/physics/thermodynamics.json').read_bytes())
  for k,url in zip(IDS,REFS):
   self.assertIn(url,' '.join(d[k]['reasoningSteps']));self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_series(self):
  r1=F(2,100)/(F(2,10)*F(1,2));r2=F(3,100)/(F(1,10)*F(1,2));self.assertEqual((r1,r2),(F(1,5),F(3,5)))
  power=F(20)/(r1+r2);self.assertEqual(power,25);interface=40-power*r1
  self.assertEqual(interface,35);self.assertEqual(interface-power*r2,20);self.assertEqual((40-interface)/r1,power);self.assertEqual((interface-20)/r2,power);self.assertEqual(power*r1+power*r2,20)
 def test_parallel(self):
  r1,r2=F(1,5),F(3,5);p1,p2=20/r1,20/r2;total=p1+p2;equivalent=20/total
  self.assertEqual((p1,p2,total),(100,F(100,3),F(400,3)));self.assertEqual(equivalent,F(3,20));self.assertEqual(equivalent,1/(1/r1+1/r2));self.assertLess(equivalent,min(r1,r2));self.assertNotEqual(total,20/(r1+r2))
 def test_capacity_balance(self):
  def equilibrium(capacities,temps):return sum(F(c)*t for c,t in zip(capacities,temps))/sum(capacities)
  tf=equilibrium([100,300],[80,20]);self.assertEqual(tf,35);self.assertEqual((100*(tf-80),300*(tf-20)),(-4500,4500));self.assertEqual(100*(tf-80)+300*(tf-20),0)
  self.assertEqual(100*(50-80)+300*(50-20),6000)
  tf3=equilibrium([100,300,100],[80,20,20]);self.assertEqual(tf3,32);self.assertEqual(100*(tf3-80)+300*(tf3-20)+100*(tf3-20),0)
  for t in [tf,tf3]:self.assertGreater(t,20);self.assertLess(t,80)
 def test_variable_capacity(self):
  def q(lo,hi):return F(2,2)*(hi*hi-lo*lo)
  self.assertEqual(q(100,200),30000);self.assertEqual(2*100*100,20000);self.assertEqual(2*200*100,40000)
  self.assertEqual(F(2*100+2*200,2)*100,30000);self.assertEqual((q(100,150),q(150,200)),(12500,17500));self.assertEqual(q(100,150)+q(150,200),q(100,200));self.assertEqual(q(200,100),-30000)
if __name__=='__main__':unittest.main()
