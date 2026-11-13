"""Actual Python arithmetic plus exact controls; no empirical production claims."""
import pathlib,json,gzip,unittest,math,sys,itertools
from decimal import Decimal as D,localcontext,getcontext,ROUND_HALF_EVEN
R=pathlib.Path(__file__).resolve().parents[1]
LESSONS=json.loads((R/'deep-learning/math/numerical-methods.json').read_bytes())
BASE=json.loads(gzip.decompress((R/'tests/baselines/floating-boundary-foundations.json.gz').read_bytes()))
IDS=['math-v09-design-review-floating-point-error-computers-approximate-real-numbers','math-v09-worked-example-floating-point-error-computers-approximate-real--2','math-v09-evidence-verificat-floating-point-error-computers-approximate-real--2','math-v09-design-review-floating-point-error-computers-approximate-real--2','math-v09-worked-example-floating-point-error-computers-approximate-real--3','math-v09-evidence-verificat-floating-point-error-computers-approximate-real--3']
class FloatingBoundaryFoundations(unittest.TestCase):
 def binary64(self):
  if (sys.float_info.radix,sys.float_info.mant_dig,sys.float_info.rounds)!=(2,53,1):self.skipTest('binary64 nearest-rounding fixture requires radix2,53bits,rounds1')
 def claim(self,i,*values):
  s=' '.join(LESSONS[IDS[i]]['reasoningSteps'])
  for v in values:self.assertIn(v,s)
 def test_scope(self):
  checkpoint=json.loads(gzip.decompress((R/'tests/baselines/decimal-context-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(BASE),list(checkpoint));self.assertEqual(list(checkpoint),list(LESSONS));self.assertEqual(len(LESSONS),98)
  for k in IDS:self.assertEqual(LESSONS[k],checkpoint[k],k)
  for k in BASE:
   changed=sorted(f for f in set(BASE[k])|set(checkpoint[k]) if BASE[k].get(f)!=checkpoint[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  refs=['library/math.html#math.isclose','tutorial/floatingpoint.html','library/math.html#math.isnan','library/functions.html#round','library/decimal.html','tutorial/floatingpoint.html']
  for k,ref in zip(IDS,refs):
   self.assertNotIn('mean, why does it matter',LESSONS[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(LESSONS[k][f]),6);self.assertIn('https://docs.python.org/3/'+ref,LESSONS[k][f][-1])
 def test_closeness_not_transitive(self):
  close=lambda a,b,t=.5:math.isclose(a,b,rel_tol=0,abs_tol=t)
  self.assertTrue(close(0,.5));self.assertTrue(close(.5,1));self.assertFalse(close(0,1))
  for a,b in itertools.product([0,.5,1],repeat=2):
   self.assertEqual(close(a,b),close(b,a));self.assertEqual(close(a,b),close(a*1000,b*1000,500))
  self.assertFalse(close(0,500));self.claim(0,'not transitive','units','equality boundary')
 def test_integer_spacing(self):
  self.binary64();n=2**53
  self.assertEqual(n,9007199254740992);self.assertEqual(n+1,9007199254740993)
  self.assertEqual(math.ulp(float(n)),2);self.assertEqual(math.nextafter(float(n),math.inf),float(n+2))
  self.assertEqual(float(n)+1,float(n));self.assertEqual(float(n+1),float(n))
  self.assertEqual(float(n)+2,float(n+2));self.assertEqual(float(n-1)+1,float(n))
  self.assertNotEqual(int(float(n+1)),n+1);self.claim(1,'9007199254740993','spacing above this boundary is 2')
 def test_nan_interval_validation(self):
  x=float('nan');self.assertFalse(x<0);self.assertFalse(x>1);self.assertFalse(x==x);self.assertTrue(math.isnan(x))
  naive=lambda x:not(x<0 or x>1)
  robust=lambda x:math.isfinite(x) and 0<=x<=1
  self.assertTrue(naive(x));self.assertFalse(robust(x))
  for v in [x,-math.inf,math.inf,-.01,1.01]:self.assertFalse(robust(v))
  for v in [0,.5,1]:self.assertTrue(robust(v))
  self.assertFalse(math.isclose(x,x));self.assertTrue(math.isclose(math.inf,math.inf));self.assertFalse(math.isclose(math.inf,-math.inf))
  self.claim(2,'both x<0 and x>1 are false','math.isfinite','not an ordinary point')
 def test_rounding_representation(self):
  self.binary64();self.assertEqual([round(x) for x in [2.5,3.5,-2.5,-3.5]],[2,4,-2,-4])
  self.assertLess(D.from_float(2.675),D('2.675'));self.assertEqual(round(2.675,2),2.67)
  with localcontext() as c:
   c.prec=28
   self.assertEqual(D('2.675').quantize(D('.01'),rounding=ROUND_HALF_EVEN),D('2.68'))
   self.assertEqual(D.from_float(2.675).quantize(D('.01'),rounding=ROUND_HALF_EVEN),D('2.67'))
  self.claim(3,'2.67','2.68','ROUND_HALF_EVEN')
 def test_decimal_construction_and_context(self):
  self.assertGreater(D.from_float(.1),D('.1'));before=getcontext().prec
  with localcontext() as c:c.prec=3;short=D(1)/D(7)
  with localcontext() as c:
   c.prec=6;long=D(1)/D(7)
   self.assertEqual(short+D(0),D('.143'));self.assertNotEqual(short,long)
  self.assertEqual(short,D('.143'));self.assertEqual(long,D('.142857'));self.assertEqual(getcontext().prec,before)
  self.claim(4,'0.143','0.142857','local context','captures the already-stored')
 def test_cancellation_reformulation(self):
  self.binary64();x=1e-16;direct=math.sqrt(1+x)-1;stable=x/(math.sqrt(1+x)+1)
  self.assertEqual(direct,0);self.assertEqual(stable,5e-17)
  before=getcontext().prec
  with localcontext() as c:
   c.prec=80;exactx=D('1e-16');reference=(1+exactx).sqrt()-1
   self.assertGreater(reference,0)
   self.assertEqual(abs(D.from_float(direct)-reference)/reference,1)
   self.assertLess(abs(D.from_float(stable)-reference)/reference,D('1e-15'))
   self.assertLess(abs(reference-exactx/((1+exactx).sqrt()+1)),D('1e-78'))
  self.assertEqual(getcontext().prec,before)
  for v in [0.,-1.]:self.assertEqual(math.sqrt(1+v)-1,v/(math.sqrt(1+v)+1))
  with self.assertRaises(ValueError):math.sqrt(1-2)
  self.claim(5,'5e-17','relative error 1','below 1e-15')
if __name__=='__main__':unittest.main()
