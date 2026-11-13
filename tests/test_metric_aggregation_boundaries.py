"""Exact synthetic metric examples; not a PromQL evaluator."""
import pathlib,json,gzip,unittest,math
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/cloud/observability.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/metric-aggregation-boundaries.json.gz').read_bytes()))
IDS=["cloud-v05-prometheus-time-series-data","cloud-v09-troubleshooting-lab-observability-metrics","cloud-v09-decision-lab-observability-metrics","cloud-v09-misconception-clinic-observability-metrics","cloud-v09-decision-lab-promql-instant-vector","cloud-v09-teach-back-lab-prometheus-time-series"]
REFS=["https://prometheus.io/docs/concepts/data_model/","https://prometheus.io/docs/practices/histograms/","https://prometheus.io/docs/practices/histograms/","https://prometheus.io/docs/practices/histograms/","https://prometheus.io/docs/prometheus/latest/querying/functions/","https://prometheus.io/docs/prometheus/latest/querying/functions/"]
class MetricAggregationBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  self.assertEqual(list(D),list(B));self.assertEqual(len(D),97)
  for k in B:self.assertEqual(sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_series_key(self):
  def key(name,labels):
   if any(v=='' for v in labels.values()):raise ValueError('fixture only models nonempty labels')
   return name,tuple(sorted(labels.items()))
  a=key('requests_total',dict(job='api',instance='a'))
  self.assertEqual(a,key('requests_total',dict(instance='a',job='api')))
  self.assertNotEqual(a,key('requests_total',dict(job='api',instance='b')))
  self.assertNotEqual(a,key('requests_total',dict(job='api',instance='a',zone='west')))
  self.assertNotEqual(a,key('other_total',dict(job='api',instance='a')))
  samples=[(a,1,5),(a,2,9)];self.assertEqual(len({k for k,_,_ in samples}),1)
  with self.assertRaises(ValueError):key('x',{'job':''})
  self.claim(0,'nonempty','timestamp','Empty label values')
 def test_cumulative_buckets(self):
  samples=list(map(F,['0.05','0.1','0.2','0.3','0.8','1.2']))
  boundaries=list(map(F,['0.1','0.3','1.0']))+[math.inf]
  cumulative=[sum(x<=b for x in samples) for b in boundaries]
  self.assertEqual(cumulative,[2,4,5,6]);self.assertEqual(sum(cumulative),17)
  disjoint=[cumulative[0]]+[b-a for a,b in zip(cumulative,cumulative[1:])]
  self.assertEqual(disjoint,[2,2,1,1]);self.assertEqual(sum(disjoint),len(samples))
  self.assertEqual(F(cumulative[1],cumulative[-1]),F(2,3))
  self.assertTrue(all(a<=b for a,b in zip(cumulative,cumulative[1:])))
  self.assertEqual(sum(x<F('0.1') for x in samples),1)
  self.assertEqual(sum(x<F('0.3') for x in samples),3)
  self.claim(1,'17, not six','upper-inclusive','2/3')
 def test_event_weighted_mean(self):
  a=[F(1)]*2;b=[F(1,10)]*8
  def mean(groups):
   count=sum(len(g) for g in groups)
   return sum(map(sum,groups),F(0))/count if count else None
  self.assertEqual(mean([a,b]),F(7,25))
  self.assertEqual((sum(a)/len(a)+sum(b)/len(b))/2,F(11,20))
  self.assertEqual(mean([a,b,[]]),mean([a,b]))
  self.assertIsNone(mean([[],[]]))
  self.assertEqual(sum(a+b)/len(a+b),F('0.28'))
  self.claim(2,'0.28','0.55','zero total count')
 def test_quantile_nonaggregation(self):
  def nearest_rank(samples,p):
   if not samples or not 0<p<=1:raise ValueError('invalid empirical rank')
   return sorted(samples)[math.ceil(p*len(samples))-1]
  a=[1]*100;b=[100];p=F(95,100)
  qa,qb=nearest_rank(a,p),nearest_rank(b,p)
  self.assertEqual((qa,qb),(1,100));self.assertEqual(math.ceil(p*101),96)
  global_q=nearest_rank(a+b,p);self.assertEqual(global_q,1)
  self.assertEqual(F(qa+qb,2),F(101,2));self.assertEqual(F(100*qa+qb,101),F(200,101))
  self.assertNotEqual(F(qa+qb,2),global_q);self.assertNotEqual(F(100*qa+qb,101),global_q)
  with self.assertRaises(ValueError):nearest_rank([],p)
  self.claim(3,'rank is 96','200/101','not additive')
 def test_presence_not_truthiness(self):
  absent=lambda vector:[1] if len(vector)==0 else []
  self.assertEqual(absent([]),[1])
  for v in [[0],[7],[0,0]]:self.assertEqual(absent(v),[])
  self.assertNotEqual([], [0])
  self.assertEqual(([] or [0]),[0])
  self.claim(4,'rather than truthiness','not label inference','does not identify its cause')
 def test_sample_vs_time_weighting(self):
  values=[F(0),F(0),F(9)]
  def held_mean(times,end):
   lengths=[b-a for a,b in zip(times,times[1:]+[end])]
   return sum(v*dt for v,dt in zip(values,lengths))/(end-times[0])
  self.assertEqual(sum(values)/len(values),3)
  self.assertEqual(held_mean([1,2,10],11),F(9,10))
  self.assertEqual(held_mean([1,2,3],11),F(36,5))
  self.assertEqual(sum(values)/len(values),3)
  self.claim(5,'0.9, not 3','equal weight','step-hold')
if __name__=='__main__':unittest.main()
