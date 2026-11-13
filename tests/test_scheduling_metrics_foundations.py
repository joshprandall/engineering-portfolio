"""Independent single-CPU teaching models, not production scheduling measurements."""
import pathlib,json,gzip,unittest,itertools
from fractions import Fraction as F
from collections import deque
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/advanced/operating-systems.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/scheduling-metrics-foundations.json.gz').read_bytes()))
IDS=['advanced-v09-scenario-analysis-cpu-scheduling-choosing-what-runs-next','advanced-v09-decision-lab-cpu-scheduling-choosing-what-runs-next','advanced-v09-troubleshooting-lab-preemptive-scheduling','advanced-v10-scenario-brief-cpu-scheduling-choosing-what-runs-next','advanced-v09-quick-reference-preemptive-scheduling','advanced-v10-trace-lab-cpu-scheduling-choosing-what-runs-next']
def fcfs(jobs):
 t=0;trace=[]
 for name,arrival,burst in jobs:
  start=max(t,arrival);t=start+burst;trace.append((name,start,t))
 return trace
def rr(demands,q,cost=F(0)):
 ready=deque(demands);left=dict(demands);t=F(0);trace=[];previous=None
 while ready:
  name,unused=ready.popleft()
  if previous is not None and previous!=name:t+=cost
  start=t;used=min(q,left[name]);t+=used;left[name]-=used
  trace.append((name,start,t));previous=name
  if left[name]:ready.append((name,left[name]))
 return trace
def metrics(trace,arrivals):
 first={};finish={}
 for name,start,end in trace:first.setdefault(name,start);finish[name]=end
 return {k:first[k]-a for k,a in arrivals.items()},{k:finish[k]-a for k,a in arrivals.items()}
class SchedulingMetricsFoundations(unittest.TestCase):
 def claim(self,i,*values):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for x in values:self.assertIn(x,text)
 def test_scope(self):
  self.assertEqual(list(B),list(D));self.assertEqual(len(D),106)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k in IDS:
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6)
    self.assertIn('https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf',D[k][f][-1])
 def test_fcfs_metrics_and_translation(self):
  jobs=[('A',0,6),('B',1,2),('C',2,1)]
  trace=fcfs(jobs);self.assertEqual(trace,[('A',0,6),('B',6,8),('C',8,9)])
  resp,turn=metrics(trace,{n:a for n,a,b in jobs})
  self.assertEqual(list(resp.values()),[0,5,6]);self.assertEqual(list(turn.values()),[6,7,7])
  self.assertEqual(F(sum(turn.values()),3),F(20,3));self.assertEqual(F(sum(resp.values()),3),F(11,3))
  shifted=[(n,a+10,b) for n,a,b in jobs]
  self.assertEqual(metrics(fcfs(shifted),{n:a for n,a,b in shifted}),(resp,turn))
  self.claim(0,'20/3','23/3','11/3')
 def test_sjf_exhaustive_permutations(self):
  jobs=[('A',0,6),('B',0,2),('C',0,1)]
  sums={tuple(j[0] for j in order):sum(end for _,_,end in fcfs(order)) for order in itertools.permutations(jobs)}
  self.assertEqual(len(sums),6);self.assertEqual(min(sums,key=sums.get),('C','B','A'))
  self.assertEqual(sums[('A','B','C')],23);self.assertEqual(sums[('C','B','A')],13)
  for order in itertools.permutations(jobs):self.assertEqual(fcfs(order)[-1][2],9)
  self.claim(1,'13/3','10/3','known demands')
 def test_stcf_eligibility_remaining_and_tie(self):
  arrivals={'A':0,'B':1,'C':2};left={'A':6,'B':2,'C':1};trace=[];current=None
  for t in range(9):
   ready=[k for k in left if arrivals[k]<=t and left[k]>0]
   shortest=min(left[k] for k in ready)
   if current not in ready or left[current]!=shortest:current=next(k for k in ready if left[k]==shortest)
   trace.append((current,t,t+1));left[current]-=1
  self.assertEqual(''.join(n for n,_,_ in trace),'ABBCAAAAA')
  resp,turn=metrics(trace,arrivals)
  self.assertEqual(resp,{'A':0,'B':0,'C':1});self.assertEqual(turn,{'A':9,'B':2,'C':2})
  self.assertEqual(left,dict.fromkeys(left,0));self.assertEqual(F(sum(turn.values()),3),F(13,3))
  self.claim(2,'A=9, B=3, C=4','A=3, B=0, C=1','keep the currently running B')
 def test_rr_metric_tradeoff(self):
  jobs=[('A',3),('B',3),('C',3)];arr=dict.fromkeys('ABC',0)
  trace=rr(jobs,1);self.assertEqual(''.join(n for n,_,_ in trace),'ABCABCABC')
  resp,turn=metrics(trace,arr);self.assertEqual(list(resp.values()),[0,1,2]);self.assertEqual(list(turn.values()),[7,8,9])
  fifo=fcfs([(n,0,b) for n,b in jobs]);fr,ft=metrics(fifo,arr)
  self.assertEqual(F(sum(fr.values()),3),3);self.assertEqual(F(sum(ft.values()),3),6)
  self.assertEqual(rr(jobs,3),fifo);self.claim(3,'turnaround 8','averaging 1','turnaround is 6')
 def test_quantum_switch_cost(self):
  jobs=[('A',4),('B',4)];small=rr(jobs,1,F(1,4));large=rr(jobs,2,F(1,4))
  self.assertEqual(len(small),8);self.assertEqual(len(large),4)
  self.assertEqual(small[-1][2],F(39,4));self.assertEqual(large[-1][2],F(35,4))
  self.assertEqual(8/small[-1][2],F(32,39));self.assertEqual(8/large[-1][2],F(32,35))
  self.assertEqual(small[1][1],F(5,4));self.assertEqual(large[1][1],F(9,4))
  for q in [1,2]:self.assertEqual(rr(jobs,q)[-1][2],8)
  self.claim(4,'9.75','8.75','32/39','32/35','1.25','2.25')
 def test_idle_windows(self):
  jobs=[('A',3,2),('B',8,1)];trace=fcfs(jobs)
  self.assertEqual(trace,[('A',3,5),('B',8,9)])
  busy=sum(end-start for _,start,end in trace);self.assertEqual(busy,3)
  self.assertEqual(F(busy,9),F(1,3));self.assertEqual(F(busy,9-3),F(1,2))
  self.assertEqual(metrics(trace,{'A':3,'B':8}),({'A':0,'B':0},{'A':2,'B':1}))
  self.assertEqual(F(busy,fcfs([(n,a+2,b) for n,a,b in jobs])[-1][2]),F(3,11))
  self.claim(5,'utilization is 1/3','utilization 1/2','response 0')
if __name__=='__main__':unittest.main()
