import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cyber-data-classification","cyber-v09-recall-drill-data-classification-protect-according-to-consequence","cyber-v09-misconception-clinic-data-classification-protect-according-to-consequence","cyber-v10-fault-isolation-lab-data-classification-protect-according-to-consequence"]
LEVELS=['NA','LOW','MODERATE','HIGH']
def validate(row):
 if len(row)!=3:raise ValueError('three objectives')
 for i,value in enumerate(row):
  if value not in LEVELS or (i>0 and value=='NA'):raise ValueError('invalid impact')
 return row
def aggregate(rows):
 if not rows:raise ValueError('missing information types')
 for row in rows:validate(row)
 return tuple(LEVELS[max(1,max(LEVELS.index(row[i]) for row in rows))] for i in range(3))
class ImpactCategories(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/impact-categories.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cyber/governance.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),113)
  for k in b:
   changes={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changes,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_source_and_limits(self):
  d=json.loads((R/'deep-learning/cyber/governance.json').read_bytes())
  for k,words in zip(IDS,[['public-information example','only'],['MODERATE,HIGH,HIGH','not equally spaced'],['not NA or LOW','local data-quality'],['not a ceiling','fixed-input']]):
   text=' '.join(d[k]['reasoningSteps'])
   self.assertIn('https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.199.pdf',text)
   for word in words:self.assertIn(word,text)
 def test_public_information_objectives(self):
  row=('NA','MODERATE','MODERATE');self.assertEqual(validate(row),row)
  for bad in [('LOW','NA','LOW'),('LOW','LOW','NA')]:
   with self.assertRaises(ValueError):validate(bad)
 def test_high_water_mark(self):
  rows=[('LOW','HIGH','LOW'),('MODERATE','LOW','MODERATE'),('LOW','LOW','HIGH')]
  expected=('MODERATE','HIGH','HIGH')
  for order in itertools.permutations(rows):self.assertEqual(aggregate(order),expected)
  self.assertEqual(aggregate(rows+rows),expected)
 def test_system_floor_not_unknown(self):
  self.assertEqual(aggregate([('NA','MODERATE','MODERATE')]),('LOW','MODERATE','MODERATE'))
  for bad in [(None,'LOW','LOW'),('UNKNOWN','LOW','LOW'),('LOW','LOW')]:
   with self.assertRaises(ValueError):aggregate([bad])
  with self.assertRaises(ValueError):aggregate([])
 def test_monotonicity_and_context_separation(self):
  triples=list(itertools.product(LEVELS[1:],repeat=3))
  for a,b in itertools.product(triples,repeat=2):
   result=aggregate([a,b])
   self.assertTrue(all(LEVELS.index(x)>=LEVELS.index(y) for x,y in zip(result,a)))
   self.assertEqual(aggregate([a,a]),a)
  self.assertEqual(aggregate([('LOW','MODERATE','LOW'),('LOW','LOW','HIGH')]),('LOW','MODERATE','HIGH'))
  self.assertEqual(aggregate([('HIGH','HIGH','HIGH'),('LOW','LOW','LOW')]),('HIGH','HIGH','HIGH'))
if __name__=='__main__':unittest.main()
