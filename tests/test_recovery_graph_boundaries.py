import unittest,pathlib,json,gzip,itertools
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cloud-v05-contingency-planning","cloud-v05-lab-choose-rto-and-rpo-priorities","cloud-v07-backup-restore-testing","cloud-v09-recall-drill-backup-restore-testing"]
DURATION={'identity':4,'network':6,'database':8,'application':3,'validation':2}
DEPS={'identity':[],'network':[],'database':['identity','network'],'application':['database'],'validation':['application']}
def finish(durations,deps):
 if set(durations)!=set(deps) or any(not isinstance(v,(int,float)) or v<0 for v in durations.values()):raise ValueError('invalid task definition')
 if any(p not in durations for ps in deps.values() for p in ps):raise ValueError('missing prerequisite')
 done={};remaining=set(durations)
 while remaining:
  ready=[t for t in remaining if all(p in done for p in deps[t])]
  if not ready:raise ValueError('dependency cycle')
  for t in ready:done[t]=max((done[p] for p in deps[t]),default=0)+durations[t];remaining.remove(t)
 return done
def targets(elapsed,disruption,snapshot,rto,rpo):
 if snapshot>disruption or min(elapsed,rto,rpo)<0:raise ValueError('invalid observation')
 return elapsed<=rto,disruption-snapshot<=rpo
class RecoveryGraphBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/recovery-graph-boundaries.json.gz').read_bytes()));d=json.loads(gzip.decompress((R/'tests/baselines/restore-validation-labs.json.gz').read_bytes()))
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),93)
  current=json.loads((R/'deep-learning/cloud/recovery.json').read_bytes())
  for k in IDS:self.assertEqual(d[k],current[k],k)
  for key in b:
   changed={f for f in set(b[key])|set(d[key]) if b[key].get(f)!=d[key].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if key in IDS else set(),key)
 def test_source_and_claims(self):
  d=json.loads((R/'deep-learning/cloud/recovery.json').read_bytes())
  for key,words in zip(IDS,[['19 minutes','23','sufficient parallel'],['42-38=4','RTO 18','minute 17'],['data-integrity','function','does not implement'],['leaves','17','one worker']]):
   text=' '.join(d[key]['reasoningSteps'])
   self.assertIn('https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf',text)
   for word in words:self.assertIn(word,text)
 def test_dependency_completion(self):
  self.assertEqual(finish(DURATION,DEPS),{'identity':4,'network':6,'database':14,'application':17,'validation':19})
  # Dictionary insertion order is not the dependency order.
  self.assertEqual(finish(dict(reversed(list(DURATION.items()))),dict(reversed(list(DEPS.items())))),finish(DURATION,DEPS))
  self.assertEqual(sum(DURATION.values()),23)
 def test_invalid_graphs(self):
  missing={**DEPS,'database':['unknown']}
  cycle={**DEPS,'identity':['validation']}
  for deps in [missing,cycle]:
   with self.assertRaises(ValueError):finish(DURATION,deps)
  with self.assertRaises(ValueError):finish({**DURATION,'identity':-1},DEPS)
 def test_independent_targets_and_validation(self):
  self.assertEqual(targets(19,42,38,18,5),(False,True))
  self.assertEqual(targets(17,42,38,18,5),(True,True))
  self.assertEqual(targets(19,42,38,20,5),(True,True))
  self.assertEqual(targets(19,42,35,20,5),(True,False))
  cases=list(itertools.product([False,True],repeat=3))
  self.assertEqual([x for x in cases if all(x)],[(True,True,True)])
  for missing in range(3):
   gates=[True]*3;gates[missing]=False;self.assertFalse(all(gates))
 def test_bottleneck_changes(self):
  self.assertEqual(finish({**DURATION,'identity':2},DEPS)['validation'],19)
  self.assertEqual(finish({**DURATION,'network':4},DEPS)['validation'],17)
  self.assertEqual(finish({**DURATION,'database':6},DEPS)['validation'],17)
  # Add resource serialization as a real predecessor rather than claiming parallelism.
  serial={**DEPS,'network':['identity']}
  self.assertEqual(finish(DURATION,serial)['validation'],23)
if __name__=='__main__':unittest.main()
