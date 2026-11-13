"""Disposable SQLite oracles; no filesystem databases, services or production SQL."""
import pathlib,json,gzip,sqlite3,unittest
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/software/databases.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/database-foundations.json.gz').read_bytes()))
IDS=['software-'+s for s in ['transactions','acid','normalization','database-indexes','sql-joins','schema-migrations']]
SOURCES=['lang_transaction.html','lang_conflict.html','foreignkeys.html','queryplanner.html','lang_select.html','lang_altertable.html']
class DatabaseFoundations(unittest.TestCase):
 def setUp(self):
  self.c=sqlite3.connect(':memory:',isolation_level=None)
 def tearDown(self):self.c.close()
 def rows(self,sql):return self.c.execute(sql).fetchall()
 def claim(self,i,*values):
  t=' '.join(D[IDS[i]]['reasoningSteps'])
  for v in values:self.assertIn(v,t)
 def test_scope(self):
  checkpoint=json.loads(gzip.decompress((R/'tests/baselines/sql-fanout-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(B),list(checkpoint));self.assertEqual(list(checkpoint),list(D));self.assertEqual(len(D),162)
  for k in IDS:self.assertEqual(D[k],checkpoint[k],k)
  for k in B:
   diff=sorted(f for f in set(B[k])|set(checkpoint[k]) if B[k].get(f)!=checkpoint[k].get(f))
   self.assertEqual(diff,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_structure_and_engine_boundary(self):
  for i,k in enumerate(IDS):
   x=D[k];self.assertNotIn('mean, why does it matter',x['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(x[f]),6);self.assertEqual(len(set(x[f])),6)
   self.assertIn('https://www.sqlite.org/'+SOURCES[i],x['reasoningSteps'][-1])
   self.assertIn('do not infer PostgreSQL behavior',x['reasoningSteps'][-1])
 def test_commit_and_rollback(self):
  c=self.c;c.execute('CREATE TABLE accounts(id TEXT PRIMARY KEY,balance INTEGER)')
  c.executemany('INSERT INTO accounts VALUES(?,?)',[('A',100),('B',50)])
  for end,expected in [('ROLLBACK',[(100,),(50,)]),('COMMIT',[(70,),(80,)])]:
   c.execute('BEGIN');c.execute("UPDATE accounts SET balance=balance-30 WHERE id='A'");c.execute("UPDATE accounts SET balance=balance+30 WHERE id='B'")
   self.assertEqual(self.rows('SELECT balance FROM accounts ORDER BY id'),[(70,),(80,)])
   c.execute(end);self.assertEqual(self.rows('SELECT balance FROM accounts ORDER BY id'),expected);self.assertFalse(c.in_transaction)
   self.assertEqual(self.rows('SELECT SUM(balance) FROM accounts'),[(150,)])
  self.claim(0,'70 and 80','100 and 50','150','not concurrent isolation')
 def test_statement_abort_needs_rollback(self):
  c=self.c;c.execute('CREATE TABLE inventory(id INTEGER PRIMARY KEY,quantity INTEGER NOT NULL CHECK(quantity>=0))');c.execute('INSERT INTO inventory VALUES(1,5)')
  c.execute('BEGIN');c.execute('UPDATE inventory SET quantity=4')
  with self.assertRaises(sqlite3.IntegrityError):c.execute('UPDATE inventory SET quantity=-1')
  self.assertTrue(c.in_transaction);self.assertEqual(self.rows('SELECT quantity FROM inventory'),[(4,)])
  c.execute('ROLLBACK');self.assertEqual(self.rows('SELECT quantity FROM inventory'),[(5,)])
  self.claim(1,'quantity is still 4','quantity 5','default ABORT')
 def test_normalized_name_and_foreign_key(self):
  flat=[(11,7,'Ada L'),(12,7,'Ada')];self.assertEqual(len({v[2] for v in flat}),2)
  c=self.c;c.execute('PRAGMA foreign_keys=ON');self.assertEqual(self.rows('PRAGMA foreign_keys'),[(1,)])
  c.execute('CREATE TABLE customer(id INTEGER PRIMARY KEY,name TEXT NOT NULL)')
  c.execute('CREATE TABLE orders(id INTEGER PRIMARY KEY,customer_id INTEGER NOT NULL REFERENCES customer(id))')
  c.execute("INSERT INTO customer VALUES(7,'Ada')");c.executemany('INSERT INTO orders VALUES(?,?)',[(11,7),(12,7)])
  c.execute("UPDATE customer SET name='Ada L' WHERE id=7")
  self.assertEqual(self.rows('SELECT o.id,c.name FROM orders o JOIN customer c ON c.id=o.customer_id ORDER BY o.id'),[(11,'Ada L'),(12,'Ada L')])
  with self.assertRaises(sqlite3.IntegrityError):c.execute('INSERT INTO orders VALUES(13,99)')
  self.assertEqual(self.rows('SELECT COUNT(*) FROM orders'),[(2,)])
  self.claim(2,'Ada L','customer 99','historical name snapshots')
 def test_index_preserves_results_and_insert(self):
  c=self.c;c.execute('CREATE TABLE items(id INTEGER PRIMARY KEY,bucket INTEGER)')
  c.executemany('INSERT INTO items VALUES(?,?)',[(i,i%10) for i in range(1000)])
  query='SELECT id FROM items WHERE bucket=3 ORDER BY id';before=self.rows(query)
  self.assertEqual(before,[(i,) for i in range(3,1000,10)])
  c.execute('CREATE INDEX idx_items_bucket ON items(bucket)')
  self.assertIn('idx_items_bucket',[r[1] for r in self.rows('PRAGMA index_list(items)')]);self.assertEqual(self.rows(query),before)
  self.assertTrue(self.rows('EXPLAIN QUERY PLAN '+query))
  c.execute('INSERT INTO items VALUES(1003,3)');self.assertEqual(self.rows(query),before+[(1003,)])
  self.claim(3,'100 rows','101 rows','version-dependent','does not measure')
 def test_join_cardinality_counts(self):
  c=self.c;c.execute('CREATE TABLE customers(id INTEGER PRIMARY KEY,name TEXT)');c.execute('CREATE TABLE orders(id INTEGER PRIMARY KEY,customer_id INTEGER)')
  c.executemany('INSERT INTO customers VALUES(?,?)',[(1,'Ada'),(2,'Bo'),(3,'Cy')]);c.executemany('INSERT INTO orders VALUES(?,?)',[(11,1),(12,1),(13,2)])
  self.assertEqual(self.rows('SELECT c.id,o.id FROM customers c JOIN orders o ON c.id=o.customer_id ORDER BY c.id,o.id'),[(1,11),(1,12),(2,13)])
  self.assertEqual(self.rows('SELECT c.id,o.id FROM customers c LEFT JOIN orders o ON c.id=o.customer_id ORDER BY c.id,o.id'),[(1,11),(1,12),(2,13),(3,None)])
  self.assertEqual(self.rows('SELECT c.id,COUNT(o.id),COUNT(*) FROM customers c LEFT JOIN orders o ON c.id=o.customer_id GROUP BY c.id ORDER BY c.id'),[(1,2,2),(2,1,1),(3,0,1)])
  self.claim(4,'four rows','2,1,0','2,1,1')
 def test_schema_rollback_and_commit(self):
  c=self.c;c.execute('CREATE TABLE tasks(id INTEGER PRIMARY KEY,title TEXT)');c.executemany('INSERT INTO tasks VALUES(?,?)',[(1,'alpha'),(2,'beta')])
  baseline=self.rows('SELECT * FROM tasks ORDER BY id');schema=self.rows('PRAGMA table_info(tasks)')
  for end in ['ROLLBACK','COMMIT']:
   c.execute('BEGIN');c.execute("ALTER TABLE tasks ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'")
   self.assertEqual(self.rows('SELECT status FROM tasks ORDER BY id'),[('pending',),('pending',)])
   c.execute("INSERT INTO tasks(id,title) VALUES(3,'gamma')");c.execute(end)
   if end=='ROLLBACK':
    self.assertEqual(self.rows('SELECT * FROM tasks ORDER BY id'),baseline);self.assertEqual(self.rows('PRAGMA table_info(tasks)'),schema)
   else:self.assertEqual(self.rows('SELECT status FROM tasks ORDER BY id'),[('pending',)]*3)
  self.claim(5,'original two-column schema','three rows','not proof of production lock safety')
if __name__=='__main__':
 print('SQLite fixture engine:',sqlite3.sqlite_version)
 unittest.main()
