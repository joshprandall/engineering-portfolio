"""Exact declared models, not parallel hardware measurements."""
import pathlib,json,gzip,unittest,itertools
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/advanced/parallel-computing.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/parallel-scaling-foundations.json.gz').read_bytes()))
IDS=["advanced-amdahl","advanced-v05-lab-estimate-amdahl-speedup","advanced-v05-parallel-overhead","advanced-v05-load-imbalance","advanced-v05-barriers","advanced-gustafson"]
def fixed(s,n):
 if not 0<=s<=1 or not isinstance(n,int) or n<=0:raise ValueError('fraction and positive integer workers required')
 return s+(1-s)/n
class ParallelScalingFoundations(unittest.TestCase):
 def claim(self,i,*values):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for value in values:self.assertIn(value,text)
 def test_scope(self):
  C=json.loads(gzip.decompress((R/'tests/baselines/concurrency-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(B),list(D));self.assertEqual(list(C),list(D));self.assertEqual(len(D),129)
  for k in IDS:self.assertEqual(D[k],C[k],k)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(C[k]) if B[k].get(f)!=C[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k in IDS:
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn('https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial',D[k][f][-1])
 def test_amdahl(self):
  s=F(1,5);self.assertEqual([fixed(s,n) for n in [1,2,4,8]],[1,F(3,5),F(2,5),F(3,10)])
  self.assertEqual(1/fixed(s,4),F(5,2));self.assertEqual(1/fixed(s,8),F(10,3));self.assertEqual(1/fixed(s,4)/4,F(5,8))
  for n in range(1,33):self.assertLess(1/fixed(s,n),5);self.assertEqual(fixed(F(1),n),1);self.assertEqual(1/fixed(F(0),n),n)
  for s,n in [(F(-1),1),(F(2),1),(F(1,2),0),(F(1,2),-1)]:
   with self.assertRaises(ValueError):fixed(s,n)
  self.claim(0,'2.5','10/3','approaches 5','source-code lines')
 def test_target_worker_count(self):
  s=F(1,10);eligible=[n for n in range(1,101) if 1/fixed(s,n)>=4]
  self.assertEqual(min(eligible),6);self.assertEqual(fixed(s,5),F(7,25));self.assertEqual(fixed(s,6),F(1,4))
  for n in range(1,101):self.assertGreater(fixed(s,n),s);self.assertLess(1/fixed(s,n),10)
  self.claim(1,'N>=6','25/7','no finite')
 def test_overhead(self):
  times={n:fixed(F(1,10),n)+F(n-1,50) for n in range(1,17)}
  self.assertEqual(times[1],1);self.assertEqual(times[4],F(77,200));self.assertEqual(times[8],F(141,400));self.assertEqual(times[16],F(73,160))
  self.assertEqual(min(times,key=times.get),7);self.assertEqual(times[7],F(61,175));self.assertEqual(times[6],F(7,20))
  self.assertLess(times[8],times[4]);self.assertGreater(times[16],times[8]);self.claim(2,'61/175','invented teaching function')
 def test_indivisible_assignment(self):
  jobs=[8,1,1,1];loads=[]
  for assignment in itertools.product([0,1],repeat=4):
   pair=[sum(t for t,w in zip(jobs,assignment) if w==worker) for worker in [0,1]];loads.append(max(pair))
  self.assertEqual(len(loads),16);self.assertEqual(min(loads),8);self.assertEqual([sum(jobs[:2]),sum(jobs[2:])],[9,2])
  self.assertEqual(F(sum(jobs),2*9),F(11,18));self.assertEqual(F(sum(jobs),2*8),F(11,16));self.claim(3,'indivisible','loads 8 and 3','only a lower bound')
 def test_barrier_timeline(self):
  arrivals=[2,5,3];release=max(arrivals);wait=[release-t for t in arrivals]
  self.assertEqual(release,5);self.assertEqual(wait,[3,0,2]);self.assertEqual(sum(wait),5);self.assertEqual([release+1]*3,[6,6,6])
  self.assertEqual([max([4,4,4])-t for t in [4,4,4]],[0,0,0]);self.claim(4,'worker-seconds','wall-clock time 6','memory-order')
 def test_scaled_work_baseline(self):
  s=F(1,10);parallel=1-s
  for n in [1,4,8]:self.assertEqual(s+n*parallel,n-(n-1)*s)
  self.assertEqual(s+4*parallel,F(37,10));self.assertEqual(s+8*parallel,F(73,10));self.assertEqual(s+parallel,1)
  self.assertNotEqual(s+4*parallel,1/fixed(s,4));self.claim(5,'3.7','parallel run','not interchangeable')
if __name__=='__main__':unittest.main()
