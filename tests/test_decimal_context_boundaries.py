import unittest,pathlib,json,gzip
from decimal import Decimal as D,Context,localcontext,getcontext,ROUND_HALF_EVEN,ROUND_HALF_UP,ROUND_DOWN,Rounded,Inexact
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["math-v09-design-review-floating-point-error-computers-approximate-real--3","math-v09-worked-example-floating-point-error-computers-approximate-real--4","math-v09-evidence-verificat-floating-point-error-computers-approximate-real--4","math-v09-design-review-floating-point-error-computers-approximate-real--4"]
class DecimalContextBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/decimal-context-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/math/numerical-methods.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),98)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/math/numerical-methods.json').read_bytes())
  for k in IDS:
   self.assertIn('https://docs.python.org/3.13/library/decimal.html',' '.join(d[k]['reasoningSteps']));self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_construction_and_arithmetic(self):
  with localcontext(Context(prec=3,rounding=ROUND_HALF_EVEN)):
   x=D('1.2345');self.assertEqual(str(x),'1.2345');self.assertEqual(str(x+D('0')),'1.23');self.assertEqual(str(x),'1.2345')
 def test_tie_policy(self):
  with localcontext(Context(prec=12)):
   for raw,even,up in [('2.345','2.34','2.35'),('-2.345','-2.34','-2.35'),('2.355','2.36','2.36')]:
    for policy,want in [(ROUND_HALF_EVEN,even),(ROUND_HALF_UP,up)]:
     actual=D(raw).quantize(D('0.01'),rounding=policy);self.assertEqual(str(actual),want);self.assertEqual(actual.as_tuple().exponent,-2)
 def test_flags(self):
  with localcontext(Context(prec=12,rounding=ROUND_HALF_EVEN)) as c:
   c.clear_flags();self.assertEqual(str(D('1.2300').quantize(D('0.01'))),'1.23');self.assertTrue(c.flags[Rounded]);self.assertFalse(c.flags[Inexact])
   c.clear_flags();self.assertEqual(str(D('1.234').quantize(D('0.01'))),'1.23');self.assertTrue(c.flags[Rounded]);self.assertTrue(c.flags[Inexact])
   D('1.2300').quantize(D('0.01'));self.assertTrue(c.flags[Inexact])
   c.clear_flags();D('1.2300').quantize(D('0.01'));self.assertTrue(c.flags[Rounded]);self.assertFalse(c.flags[Inexact])
 def test_context_restoration(self):
  original=getcontext()
  with localcontext(Context(prec=9,rounding=ROUND_HALF_EVEN)) as outer:
   with self.assertRaises(ValueError):
    with localcontext(Context(prec=3,rounding=ROUND_DOWN)) as inner:
     self.assertIs(getcontext(),inner);self.assertEqual(str(D(1)/D(7)),'0.142');raise ValueError('fixture')
   self.assertIs(getcontext(),outer);self.assertEqual(outer.prec,9);self.assertEqual(outer.rounding,ROUND_HALF_EVEN);self.assertEqual(str(D(1)/D(7)),'0.142857143')
  self.assertIs(getcontext(),original)
if __name__=='__main__':unittest.main()
