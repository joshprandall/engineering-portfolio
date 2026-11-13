import unittest,pathlib,json,gzip,sqlite3
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-v09-scenario-analysis-sql-joins-combining-related-rows","software-v09-troubleshooting-lab-sql-aggregate-functions","software-v09-design-review-sql-group-by","software-v09-design-review-sql-inner-join"]
REFS=["https://www.sqlite.org/lang_select.html","https://www.sqlite.org/lang_aggfunc.html","https://www.sqlite.org/lang_select.html","https://www.sqlite.org/lang_expr.html"]
class SqlFanoutBoundaries(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(':memory:');self.addCleanup(self.db.close)
  self.db.executescript('CREATE TABLE customers(id INTEGER PRIMARY KEY); CREATE TABLE orders(id INTEGER PRIMARY KEY,customer_id INTEGER,amount INTEGER); CREATE TABLE tickets(id INTEGER PRIMARY KEY,customer_id INTEGER); INSERT INTO customers VALUES(1),(2); INSERT INTO orders VALUES(101,1,10),(102,1,10); INSERT INTO tickets VALUES(201,1),(202,1),(203,1);')
 def rows(self,sql):return self.db.execute(sql).fetchall()
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/sql-fanout-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/databases.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),162)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/software/databases.json').read_bytes())
  for k,url in zip(IDS,REFS):
   self.assertIn(url,' '.join(d[k]['reasoningSteps']));self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_fanout(self):
  self.assertEqual(self.rows('SELECT o.id,t.id FROM customers c JOIN orders o ON o.customer_id=c.id JOIN tickets t ON t.customer_id=c.id ORDER BY o.id,t.id'),[(101,201),(101,202),(101,203),(102,201),(102,202),(102,203)])
  self.assertEqual(self.rows('SELECT c.id,SUM(o.amount) FROM customers c JOIN orders o ON o.customer_id=c.id JOIN tickets t ON t.customer_id=c.id GROUP BY c.id ORDER BY c.id'),[(1,60)])
  self.assertEqual(self.rows('SELECT SUM(amount) FROM orders'),[(20,)])
 def test_distinct_amount_is_not_entity(self):
  self.assertEqual(self.rows('SELECT COUNT(o.id),COUNT(DISTINCT o.id),SUM(o.amount),SUM(DISTINCT o.amount) FROM orders o JOIN tickets t ON t.customer_id=o.customer_id'),[(6,2,60,10)])
  self.assertEqual(self.rows('SELECT SUM(amount) FROM orders'),[(20,)])
 def test_preaggregate(self):
  query='WITH os AS (SELECT customer_id,SUM(amount) AS total FROM orders GROUP BY customer_id),ts AS (SELECT customer_id,COUNT(*) AS n FROM tickets GROUP BY customer_id) SELECT c.id,COALESCE(os.total,0),COALESCE(ts.n,0) FROM customers c LEFT JOIN os ON os.customer_id=c.id LEFT JOIN ts ON ts.customer_id=c.id ORDER BY c.id'
  self.assertEqual(self.rows(query),[(1,20,3),(2,0,0)])
  self.assertEqual(self.rows('SELECT customer_id,SUM(amount) FROM orders GROUP BY customer_id'),[(1,20)])
  self.assertEqual(self.rows('SELECT customer_id,COUNT(*) FROM tickets GROUP BY customer_id'),[(1,3)])
 def test_exists(self):
  query='SELECT c.id FROM customers c WHERE EXISTS (SELECT 1 FROM tickets t WHERE t.customer_id=c.id) ORDER BY c.id'
  self.assertEqual(self.rows('SELECT c.id FROM customers c JOIN tickets t ON t.customer_id=c.id ORDER BY c.id,t.id'),[(1,),(1,),(1,)])
  self.assertEqual(self.rows(query),[(1,)])
  self.assertEqual(self.rows('SELECT DISTINCT c.id FROM customers c JOIN tickets t ON t.customer_id=c.id ORDER BY c.id'),[(1,)])
  self.db.execute('INSERT INTO tickets VALUES(204,2)');self.assertEqual(self.rows(query),[(1,),(2,)])
if __name__=='__main__':unittest.main()
