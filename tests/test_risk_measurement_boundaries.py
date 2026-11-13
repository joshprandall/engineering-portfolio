"""Synthetic measurement counterexamples, not real vulnerability assessments."""
import pathlib,json,gzip,unittest
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/cyber/risk.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/risk-measurement-boundaries.json.gz').read_bytes()))
IDS=["cyber-v09-recall-drill-cve-and-cvss-are-different","cyber-v09-failure-analysis-lab-cve-and-cvss-are-different","cyber-v09-worked-example-cybersecurity-risk-communication","cyber-v09-decision-lab-cybersecurity-risk-communication","cyber-v09-evidence-verification-la-cybersecurity-risk-communication","cyber-v09-troubleshooting-lab-cybersecurity-risk-communication"]
REFS=["https://www.first.org/cvss/v4.0/user-guide","https://www.first.org/epss/","https://csrc.nist.gov/glossary/term/risk","https://csrc.nist.gov/glossary/term/risk","https://csrc.nist.gov/glossary/term/risk","https://csrc.nist.gov/glossary/term/risk"]
class RiskBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  C=json.loads(gzip.decompress((R/'tests/baselines/cvss-vector-labs.json.gz').read_bytes()))
  for k in IDS:self.assertEqual(C[k],D[k],k)
  self.assertEqual(list(C),list(B));self.assertEqual(len(C),105)
  for k in B:
   self.assertEqual(sorted(f for f in set(B[k])|set(C[k]) if B[k].get(f)!=C[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_severity_does_not_identify_probability(self):
  scores={'A':F(9),'B':F(6)}
  environments=[{'A':F(1,100),'B':F(1,5)},{'A':F(2,5),'B':F(1,50)}]
  self.assertGreater(scores['A'],scores['B'])
  self.assertLess(environments[0]['A'],environments[0]['B'])
  self.assertGreater(environments[1]['A'],environments[1]['B'])
  for probabilities in environments:
   for key,p in probabilities.items():
    self.assertTrue(0<=p<=1);self.assertNotEqual(p,scores[key]/10)
  self.claim(0,'severity','not a calibrated probability','hypothetical environments')
 def test_epss_fields_are_distinct(self):
  # Deliberately invented metadata, not a fetched FIRST score or computed percentile.
  report={'probability':F(8,100),'percentile':F(97,100),'horizon_days':30,'event':'exploited in the wild'}
  self.assertEqual(report['probability']*100,8);self.assertEqual(report['percentile']*100,97)
  self.assertNotEqual(report['probability'],report['percentile'])
  self.assertNotEqual(report['probability']*report['percentile'],report['probability'])
  self.assertEqual(report['horizon_days'],30)
  self.claim(1,'next 30 days','not a 97 percent exploitation probability','particular local host','invented')
 def test_expected_loss_not_impact(self):
  def distribution(p,loss):return [(1-p,0),(p,loss)]
  a=distribution(F(1,50),100000);b=distribution(F(1,5),20000)
  for outcomes in [a,b]:self.assertEqual(sum(p for p,_ in outcomes),1)
  expectation=lambda outcomes:sum(p*loss for p,loss in outcomes)
  self.assertEqual(expectation(a),2000);self.assertEqual(expectation(b),4000)
  self.assertGreater(max(loss for _,loss in a),max(loss for _,loss in b))
  self.assertLess(expectation(a),expectation(b))
  self.assertNotIn(expectation(a),[loss for _,loss in a])
  self.claim(2,'single-event model','2000 dollars','4000 dollars','not a forecast')
 def test_range_and_threshold(self):
  loss=100000;low=F(1,100);high=F(5,100);benchmark=3000
  self.assertEqual((low*loss,high*loss),(1000,5000))
  threshold=F(benchmark,loss);self.assertEqual(threshold,F(3,100))
  self.assertLess(low*loss,benchmark);self.assertEqual(threshold*loss,benchmark);self.assertGreater(high*loss,benchmark)
  self.claim(3,'0.03','not automatically an expected probability','not a measured confidence interval')
 def test_dependence_tables(self):
  p=F(1,10)
  independent={(1,1):p*p,(1,0):p*(1-p),(0,1):(1-p)*p,(0,0):(1-p)**2}
  correlated={(1,1):p,(1,0):F(0),(0,1):F(0),(0,0):1-p}
  disjoint={(1,1):F(0),(1,0):p,(0,1):p,(0,0):1-2*p}
  for table in [independent,correlated,disjoint]:
   self.assertEqual(sum(table.values()),1);self.assertTrue(all(v>=0 for v in table.values()))
   self.assertEqual(sum(v for (a,b),v in table.items() if a),p)
   self.assertEqual(sum(v for (a,b),v in table.items() if b),p)
  self.assertEqual([t[1,1] for t in [independent,correlated,disjoint]],[F(1,100),F(1,10),0])
  self.assertEqual(max(0,2*p-1),0);self.assertEqual(min(p,p),p)
  self.claim(4,'independent','0.01','0.10','range from 0 to 0.10')
 def test_ordinal_recoding_reverses_product(self):
  first={'Low':1,'Medium':2,'High':3};second={'Low':1,'Medium':2,'High':100}
  for scale in [first,second]:self.assertLess(scale['Low'],scale['Medium']);self.assertLess(scale['Medium'],scale['High'])
  pairs=[('High','Low'),('Medium','Medium')]
  products=lambda scale:[scale[a]*scale[b] for a,b in pairs]
  self.assertEqual(products(first),[3,4]);self.assertEqual(products(second),[100,4])
  self.assertLess(*products(first));self.assertGreater(*products(second))
  self.claim(5,'1,2,100','ordinal ordering alone','explicit policy')
if __name__=='__main__':unittest.main()
