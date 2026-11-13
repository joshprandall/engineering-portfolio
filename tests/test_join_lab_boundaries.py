import unittest,pathlib,json,gzip,sqlite3
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-v06-lab-visualize-sql-joins","software-v09-practical-lab-visualize-sql-joins","software-v09-teach-back-lab-visualize-sql-joins","software-v09-worked-example-visualize-sql-joins"]
class JoinLabBoundaries(unittest.TestCase):
 def setUp(self):self.db=sqlite3.connect(':memory:')
 def tearDown(self):self.db.close()
 def rows(self,sql):return self.db.execute(sql).fetchall()
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/join-lab-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/lab.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),110)
  for k in b:
   changed={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/software/lab.json').read_bytes())
  for k in IDS:self.assertIn('https://www.sqlite.org/lang_select.html',' '.join(d[k]['reasoningSteps']))
 def test_on_where(self):
  self.db.executescript('CREATE TABLE departments(id INTEGER);CREATE TABLE employees(id INTEGER,department INTEGER,active INTEGER);INSERT INTO departments VALUES(1),(2);INSERT INTO employees VALUES(10,1,1),(11,1,0);')
  self.assertEqual(self.rows('SELECT d.id,e.id FROM departments d LEFT JOIN employees e ON e.department=d.id AND e.active=1 ORDER BY d.id,e.id'),[(1,10),(2,None)])
  self.assertEqual(self.rows('SELECT d.id,e.id FROM departments d LEFT JOIN employees e ON e.department=d.id WHERE e.active=1 ORDER BY d.id,e.id'),[(1,10)])
 def test_projection_multiplicity(self):
  prefix='WITH c(id) AS (VALUES(1)),o(id,customer) AS (VALUES(10,1),(11,1)) '
  self.assertEqual(self.rows(prefix+'SELECT c.id,o.id FROM c JOIN o ON o.customer=c.id ORDER BY c.id,o.id'),[(1,10),(1,11)])
  self.assertEqual(self.rows(prefix+'SELECT c.id FROM c JOIN o ON o.customer=c.id ORDER BY c.id'),[(1,),(1,)])
  self.assertEqual(self.rows(prefix+'SELECT DISTINCT c.id FROM c JOIN o ON o.customer=c.id ORDER BY c.id'),[(1,)])
 def test_null_join_keys(self):
  prefix='WITH l(id,k) AS (VALUES(10,1),(11,NULL)),r(id,k) AS (VALUES(20,1),(21,NULL)) '
  self.assertEqual(self.rows(prefix+'SELECT l.id,r.id FROM l JOIN r ON l.k=r.k ORDER BY l.id,r.id'),[(10,20)])
  self.assertEqual(self.rows(prefix+'SELECT l.id,r.id FROM l LEFT JOIN r ON l.k=r.k ORDER BY l.id,r.id'),[(10,20),(11,None)])
  self.assertEqual(self.rows('SELECT NULL=NULL'),[(None,)])
 def test_natural_schema_coupling(self):
  before="WITH l(id,label) AS (VALUES(1,'left')),r(id,value) AS (VALUES(1,'right')) "
  after="WITH l(id,label) AS (VALUES(1,'left')),r(id,label,value) AS (VALUES(1,'different','right')) "
  self.assertEqual(self.rows(before+'SELECT l.id,r.id FROM l NATURAL JOIN r'),[(1,1)])
  self.assertEqual(self.rows(after+'SELECT l.id,r.id FROM l NATURAL JOIN r'),[])
  self.assertEqual(self.rows(after+'SELECT l.id,r.id FROM l JOIN r ON l.id=r.id'),[(1,1)])
if __name__=='__main__':unittest.main()
