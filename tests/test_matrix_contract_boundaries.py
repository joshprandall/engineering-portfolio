"""Exact rational matrix identities and counterexamples."""
import pathlib,json,gzip,unittest
from fractions import Fraction as F
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/math/linear-algebra.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/matrix-contract-boundaries.json.gz').read_bytes()))
IDS=["math-v08-deep-dive-matrix-multiplication","math-v08-evidence-lab-matrix-multiplication","math-v08-evidence-lab-matrix-inverse","math-v09-troubleshooting-lab-systems-of-linear-equations","math-v08-evidence-lab-matrix-rank","math-v09-misconception-clinic-determinants"]
REFS=["https://textbooks.math.gatech.edu/ila/matrix-multiplication.html","https://textbooks.math.gatech.edu/ila/matrix-multiplication.html","https://textbooks.math.gatech.edu/ila/matrix-inverses.html","https://textbooks.math.gatech.edu/ila/systems-of-eqns.html","https://textbooks.math.gatech.edu/ila/rank-thm.html","https://textbooks.math.gatech.edu/ila/determinants-definitions-properties.html"]
I=[[1,0],[0,1]]
def mm(a,b):
 if len(a[0])!=len(b):raise ValueError('dimension mismatch')
 return [[sum(F(x)*F(y) for x,y in zip(row,col)) for col in zip(*b)] for row in a]
def mv(a,v):return [r[0] for r in mm(a,[[x] for x in v])]
def det(a):return F(a[0][0])*a[1][1]-F(a[0][1])*a[1][0]
def inverse(a):
 d=det(a)
 if not d:raise ValueError('singular')
 return [[F(a[1][1])/d,-F(a[0][1])/d],[-F(a[1][0])/d,F(a[0][0])/d]]
def rank(a):
 rows=[[F(x) for x in row] for row in a];pivot=0
 for col in range(len(rows[0])):
  candidate=next((i for i in range(pivot,len(rows)) if rows[i][col]),None)
  if candidate is None:continue
  rows[pivot],rows[candidate]=rows[candidate],rows[pivot]
  scale=rows[pivot][col];rows[pivot]=[x/scale for x in rows[pivot]]
  for i in range(len(rows)):
   if i!=pivot:
    scale=rows[i][col];rows[i]=[x-scale*y for x,y in zip(rows[i],rows[pivot])]
  pivot+=1
  if pivot==len(rows):break
 return pivot
class MatrixContractBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  checkpoint=json.loads(gzip.decompress((R/'tests/baselines/basis-coordinate-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(B),list(checkpoint));self.assertEqual(list(checkpoint),list(D));self.assertEqual(len(D),135)
  for k in IDS:self.assertEqual(D[k],checkpoint[k],k)
  for k in B:self.assertEqual(sorted(f for f in set(B[k])|set(checkpoint[k]) if B[k].get(f)!=checkpoint[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_rectangular_one_sided_inverse(self):
  a=[[1,0,0],[0,1,0]];b=[[1,0],[0,1],[0,0]]
  self.assertEqual(mm(a,b),I);self.assertEqual(mm(b,a),[[1,0,0],[0,1,0],[0,0,0]])
  self.assertEqual(mv(mm(b,a),[2,3,4]),[2,3,0]);self.assertEqual(mv(mm(a,b),[2,3]),[2,3])
  with self.assertRaises(ValueError):mm(a,a)
  self.claim(0,'right inverse','not a two-sided','rectangular')
 def test_order_and_associativity(self):
  a=[[1,1],[0,1]];b=[[2,0],[0,1]]
  self.assertEqual(mm(a,b),[[2,1],[0,1]]);self.assertEqual(mm(b,a),[[2,2],[0,1]])
  self.assertEqual(mv(mm(a,b),[0,1]),[1,1]);self.assertEqual(mv(mm(b,a),[0,1]),[2,1])
  for v in [[0,1],[1,0],[-2,3],[F(1,3),F(2,5)]]:self.assertEqual(mv(a,mv(b,v)),mv(mm(a,b),v))
  self.assertEqual(mm(a,I),mm(I,a))
  self.claim(1,'not commutative in general','associative','B first')
 def test_inverse_order(self):
  a=[[1,1],[0,1]];b=[[2,0],[0,1]];ab=mm(a,b)
  ai,bi=inverse(a),inverse(b)
  correct=mm(bi,ai);wrong=mm(ai,bi)
  self.assertEqual(correct,[[F(1,2),F(-1,2)],[0,1]])
  self.assertEqual(correct,inverse(ab))
  self.assertEqual(mm(ab,correct),I);self.assertEqual(mm(correct,ab),I)
  self.assertEqual(mm(ab,wrong),[[1,-1],[0,1]])
  self.assertEqual(mv(correct,mv(ab,[2,3])),[2,3])
  self.claim(2,'reversed product','not I2')
 def test_singular_consistency(self):
  s=[[1,2],[2,4]]
  self.assertEqual(det(s),0)
  with self.assertRaises(ValueError):inverse(s)
  for t in [F(-2),F(0),F(1,3),F(5)]:self.assertEqual(mv(s,[3-2*t,t]),[3,6])
  self.assertEqual([2-2*1,4-2*2,7-2*3],[0,0,1])
  self.assertEqual(rank(s),rank([[1,2,3],[2,4,6]]))
  self.assertGreater(rank([[1,2,3],[2,4,7]]),rank(s))
  self.claim(3,'0=1','infinitely many','no solution is not')
 def test_rank_nullity_and_families(self):
  m=[[1,0,1],[0,1,1]];n=[-1,-1,1]
  self.assertEqual(rank(m),2);self.assertEqual(3-rank(m),1);self.assertEqual(mv(m,n),[0,0])
  for t in [F(-3),F(0),F(1,2),F(7)]:self.assertEqual(mv(m,[4-t,5-t,t]),[4,5])
  self.assertEqual(mv(m,[4,5,0]),mv(m,[3,4,1]))
  self.assertEqual(rank([[m[i][j] for j in [0,1]] for i in range(2)]),2)
  self.claim(4,'nullity(M)=1','not one-to-one','number of columns')
 def test_determinant_row_operations(self):
  c=[[2,1],[1,3]];self.assertEqual(det(c),5)
  self.assertEqual(det([[6,3],[1,3]]),15)
  for scalar in [-2,0,1,3]:self.assertEqual(det([[scalar*x for x in row] for row in c]),scalar**2*det(c))
  self.assertEqual(det([[6,3],[3,9]]),45)
  self.assertEqual(det(list(reversed(c))),-5)
  self.assertEqual(det([c[0],[c[1][i]+4*c[0][i] for i in range(2)]]),5)
  self.claim(5,'45','15','conditioning')
if __name__=='__main__':unittest.main()
