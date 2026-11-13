"""Defensive SQL fixtures; every database is disposable :memory:, no external target."""
import pathlib,json,gzip,unittest,sqlite3
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/cyber/application-security.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/sql-parameter-boundaries.json.gz').read_bytes()))
IDS=['cyber-v08-deep-dive-sql-injection-parameterization','cyber-v08-evidence-lab-sql-injection-parameterization','cyber-v09-decision-lab-sql-injection-parameterization','cyber-v09-failure-analysis-lab-sql-injection-parameterization','cyber-v09-teach-back-lab-sql-injection-never-build-queries-by-concatenating-input','cyber-v10-boundary-condition-lab-sql-injection-parameterization']
class SqlParameterBoundaries(unittest.TestCase):
 def setUp(self):self.db=sqlite3.connect(':memory:');self.addCleanup(self.db.close)
 def claim(self,i,*values):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for v in values:self.assertIn(v,text)
 def test_scope(self):
  self.assertEqual(list(D),list(B));self.assertEqual(len(D),116)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  refs=['https://docs.python.org/3/library/sqlite3.html','https://docs.python.org/3/library/sqlite3.html','https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html','https://www.sqlite.org/lang_expr.html','https://www.sqlite.org/lang_expr.html','https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html']
  for k,ref in zip(IDS,refs):
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(D[k][f]),6);self.assertIn(ref,D[k][f][-1])
 def test_literal_apostrophe(self):
  self.db.execute('CREATE TABLE people(name TEXT)')
  self.db.executemany('INSERT INTO people VALUES(?)',[('Ada',),("O'Reilly",)])
  query='SELECT name FROM people WHERE name = ?'
  self.assertEqual(self.db.execute(query,("O'Reilly",)).fetchall(),[("O'Reilly",)])
  self.assertEqual(self.db.execute(query,("O'Reilly --",)).fetchall(),[])
  self.assertEqual(self.db.execute('SELECT count(*) FROM people').fetchone()[0],2)
  self.claim(0,'one-element parameter tuple','not authorization')
 def test_in_placeholder_count(self):
  self.db.execute('CREATE TABLE items(id INTEGER)')
  self.db.executemany('INSERT INTO items VALUES(?)',[(1,),(2,),(3,)])
  self.assertEqual(self.db.execute('SELECT id FROM items WHERE id IN (?)',('1,3',)).fetchall(),[])
  def lookup(values):
   if not values:return []
   marks=','.join('?' for unused in values)
   return [r[0] for r in self.db.execute('SELECT id FROM items WHERE id IN ('+marks+') ORDER BY id',values)]
  for values in [[],[1],[1,3],[1,1],[4],[3,2,1]]:
   self.assertEqual(lookup(values),sorted(set(values)&{1,2,3}))
  self.claim(1,'one scalar string','IN (?,?)','empty-list')
 def test_structural_allowlist(self):
  self.db.execute('CREATE TABLE scores(name TEXT,score INTEGER)')
  self.db.executemany('INSERT INTO scores VALUES(?,?)',[('A',20),('B',10),('C',30)])
  self.assertEqual(self.db.execute('SELECT ?',('score',)).fetchone()[0],'score')
  self.assertEqual(self.db.execute('SELECT score FROM scores WHERE name=?',('A',)).fetchone()[0],20)
  def ordered(mode):
   fragments={'low':'score ASC, name ASC','high':'score DESC, name ASC'}
   if mode not in fragments:raise ValueError('unsupported sort mode')
   return [r[0] for r in self.db.execute('SELECT name FROM scores WHERE score>=? ORDER BY '+fragments[mode],(10,))]
  self.assertEqual(ordered('low'),list('BAC'));self.assertEqual(ordered('high'),list('CAB'))
  with self.assertRaises(ValueError):ordered('unknown')
  self.claim(2,'B,A,C','C,A,B','Reject unknown sort tokens')
 def test_like_escaping_is_separate(self):
  names=['a_b','axb','a%b','azzb','a!b'];self.db.execute('CREATE TABLE labels(value TEXT)')
  self.db.executemany('INSERT INTO labels VALUES(?)',[(v,) for v in names])
  plain={r[0] for r in self.db.execute('SELECT value FROM labels WHERE value LIKE ?',('a_b',))}
  self.assertEqual(plain,{'a_b','axb','a%b','a!b'})
  escape=lambda s:s.replace('!','!!').replace('%','!%').replace('_','!_')
  for value in names:
   rows=self.db.execute("SELECT value FROM labels WHERE value LIKE ? ESCAPE '!'",(escape(value),)).fetchall()
   self.assertEqual(rows,[(value,)])
  self.assertEqual([escape(s) for s in ['a_b','a%b','a!b']],['a!_b','a!%b','a!!b'])
  self.claim(3,'one-character wildcard','Escape ! first','only literal a_b')
 def test_null_is_not_empty(self):
  self.db.execute('CREATE TABLE vals(id INTEGER,value TEXT)')
  self.db.executemany('INSERT INTO vals VALUES(?,?)',[(1,None),(2,''),(3,'x')])
  self.assertEqual(self.db.execute('SELECT id FROM vals WHERE value=?',(None,)).fetchall(),[])
  self.assertEqual(self.db.execute('SELECT id FROM vals WHERE value IS NULL').fetchall(),[(1,)])
  self.assertEqual(self.db.execute('SELECT id FROM vals WHERE value=?',('',)).fetchall(),[(2,)])
  self.assertEqual(self.db.execute('SELECT NULL = NULL, NULL IS NULL').fetchone(),(None,1))
  self.assertEqual(self.db.execute('SELECT id FROM vals WHERE value IS ?',(None,)).fetchall(),[(1,)])
  self.claim(4,'not the empty string','three-valued','SQLite-specific')
 def test_stored_value_rebound(self):
  self.db.execute('CREATE TABLE notes(value TEXT)');self.db.execute('CREATE TABLE people(name TEXT)')
  value="O'Reilly --";self.db.execute('INSERT INTO notes VALUES(?)',(value,))
  self.db.executemany('INSERT INTO people VALUES(?)',[("O'Reilly",),(value,)])
  stored=self.db.execute('SELECT value FROM notes').fetchone()[0];self.assertEqual(stored,value)
  self.assertEqual(self.db.execute('SELECT name FROM people WHERE name=?',(stored,)).fetchall(),[(value,)])
  self.assertEqual(self.db.execute('SELECT count(*) FROM notes').fetchone()[0],1)
  self.assertEqual(self.db.execute('SELECT count(*) FROM people').fetchone()[0],2)
  self.claim(5,'still data','both boundaries','only O\'Reilly --')
if __name__=='__main__':unittest.main()
