import unittest,pathlib,json,gzip
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["physics-v06-lab-build-a-series-circuit","physics-v09-evidence-verification-la-build-a-series-circuit","physics-v09-quick-reference-build-a-series-circuit","physics-v09-recall-drill-build-a-series-circuit"]
def series(v,rs):
 if not rs or any(r<=0 for r in rs):raise ValueError('positive resistances required')
 i=F(v)/sum(rs);return i,[i*r for r in rs],[i*i*r for r in rs]
class SeriesCircuitEvidence(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/series-circuit-evidence.json.gz').read_bytes()));d=json.loads((R/'deep-learning/physics/lab.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),92)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/physics/lab.json').read_bytes())
  for k,w in zip(IDS,['steady-state','not a component rating','positive factor','not all in series']):
   t=' '.join(d[k]['reasoningSteps']);self.assertIn('https://openstax.org/books/university-physics-volume-2/pages/10-2-resistors-in-series-and-parallel',t);self.assertIn(w,t)
 def test_current_and_drops(self):
  i,v,p=series(12,[100,200]);self.assertEqual(i,F(1,25));self.assertEqual(v,[4,8]);self.assertEqual(sum(v),12)
  ii,vv,_=series(12,[200,100]);self.assertEqual(ii,i);self.assertEqual(vv,[8,4])
  self.assertNotEqual(12-v[0],12-vv[0])
 def test_power_constraints(self):
  i,v,p=series(12,[100,200]);self.assertEqual(p,[F(4,25),F(8,25)]);self.assertEqual(sum(p),12*i)
  self.assertEqual(p,[drop*i for drop in v])
  separate=[F(12**2,r) for r in [100,200]];self.assertEqual(separate,[F(36,25),F(18,25)])
  self.assertLess(p[0],p[1]);self.assertGreater(separate[0],separate[1])
 def test_common_scaling(self):
  i,v,p=series(12,[100,200])
  for k in [F(1,2),F(2),F(3)]:
   ii,vv,pp=series(12,[k*100,k*200]);self.assertEqual(ii,i/k);self.assertEqual(vv,v);self.assertEqual(pp,[x/k for x in p])
  for rs in [[],[0,100],[-1,100]]:
   with self.assertRaises(ValueError):series(12,rs)
 def test_loaded_divider(self):
  i,v,_=series(12,[100,100]);self.assertEqual(i,F(3,50));self.assertEqual(v[1],6)
  parallel=1/(F(1,100)+F(1,100));self.assertEqual(parallel,50)
  top,drops,_=series(12,[100,parallel]);out=drops[1];branch=out/100
  self.assertEqual(out,4);self.assertEqual(top,F(2,25));self.assertEqual(branch,F(1,25));self.assertEqual(top,2*branch)
  self.assertEqual(top*top*100+2*branch*branch*100,12*top)
if __name__=='__main__':unittest.main()
