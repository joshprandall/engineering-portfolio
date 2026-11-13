"""Inert retry traces and a real in-memory SQLite atomicity fixture."""
import pathlib,json,gzip,unittest,sqlite3
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/advanced/distributed-systems.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/retry-outcome-boundaries.json.gz').read_bytes()))
IDS=["advanced-v05-replication-tradeoffs","advanced-v09-troubleshooting-lab-replication-tradeoffs","advanced-v09-quick-reference-replication-multiple-copies-of-state","advanced-v10-field-note-replication-tradeoffs"]
REFS=["https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/","https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/","https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/","https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/"]
class RetryBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  self.assertEqual(list(D),list(B));self.assertEqual(len(D),108)
  for k in B:
   self.assertEqual(sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_timeout_indistinguishable_histories(self):
  histories=[{'observation':'timeout','server_counter':0},{'observation':'timeout','server_counter':1}]
  self.assertEqual(histories[0]['observation'],histories[1]['observation'])
  self.assertNotEqual(histories[0]['server_counter'],histories[1]['server_counter'])
  after_retry=[h['server_counter']+1 for h in histories];self.assertEqual(after_retry,[1,2])
  self.claim(0,'response was lost','final states 1 and 2','not a complete replication protocol')
 def test_intent_identity_and_mismatch(self):
  records={};resources=[]
  def create(caller,request_id,parameters):
   key=(caller,request_id)
   if key in records:
    prior,result=records[key]
    if prior!=parameters:raise ValueError('parameter mismatch')
    return result
   result='resource-'+str(len(resources)+1);resources.append(result)
   records[key]=(parameters,result);return result
  first=create('A','r1',('size','small'))
  self.assertEqual(create('A','r1',('size','small')),first);self.assertEqual(len(resources),1)
  self.assertNotEqual(create('A','r2',('size','small')),first);self.assertEqual(len(resources),2)
  before=(dict(records),list(resources))
  with self.assertRaises(ValueError):create('A','r1',('size','large'))
  self.assertEqual((records,resources),before)
  self.assertNotEqual(create('B','r1',('size','small')),first);self.assertEqual(len(resources),3)
  self.claim(1,'(caller,request_id)','parameter mismatch','no token expiry','not a universal exactly-once guarantee')
 def test_atomic_sqlite_boundary(self):
  # Unsafe token-first crash: skip loses work. Unsafe state-first crash: retry duplicates it.
  token_first={'record':True,'counter':0}
  if not token_first['record']:token_first['counter']+=1
  self.assertEqual(token_first['counter'],0)
  state_first={'record':False,'counter':1}
  if not state_first['record']:state_first['counter']+=1
  self.assertEqual(state_first['counter'],2)
  db=sqlite3.connect(':memory:')
  try:
   db.executescript('CREATE TABLE requests (key TEXT PRIMARY KEY,result INTEGER NOT NULL);CREATE TABLE counter (value INTEGER NOT NULL);INSERT INTO counter VALUES(0);')
   def run(key,fail=False):
    with db:
     row=db.execute('SELECT result FROM requests WHERE key=?',(key,)).fetchone()
     if row:return row[0]
     value=db.execute('SELECT value FROM counter').fetchone()[0]+1
     db.execute('INSERT INTO requests VALUES (?,?)',(key,value));db.execute('UPDATE counter SET value=?',(value,))
     if fail:raise RuntimeError('injected before commit')
     return value
   with self.assertRaises(RuntimeError):run('r1',True)
   self.assertEqual(db.execute('SELECT count(*) FROM requests').fetchone()[0],0)
   self.assertEqual(db.execute('SELECT value FROM counter').fetchone()[0],0)
   self.assertEqual(run('r1'),1);self.assertEqual(run('r1'),1)
   self.assertEqual(db.execute('SELECT count(*) FROM requests').fetchone()[0],1)
   self.assertEqual(db.execute('SELECT value FROM counter').fetchone()[0],1)
  finally:db.close()
  self.claim(2,'both the record and increment disappear','counter remains 1','outside its boundary')
 def test_nested_attempt_budgets(self):
  def leaves(budgets):
   if any(not isinstance(n,int) or n<1 for n in budgets):raise ValueError('positive attempt budget required')
   count=0
   def attempt(level):
    nonlocal count
    if level==len(budgets):count+=1;return
    for _ in range(budgets[level]):attempt(level+1)
   attempt(0);return count
  self.assertEqual(leaves([3,3,3]),27);self.assertEqual(leaves([3,1,1]),3)
  self.assertEqual(leaves([4,4,4]),64);self.assertEqual(leaves([1,1,1]),1)
  for invalid in [[0,3,3],[-1,2,2],[1,1.5,1]]:
   with self.assertRaises(ValueError):leaves(invalid)
  self.claim(3,'including the initial attempt','3^3=27','4^3=64','not measured service traffic')
if __name__=='__main__':unittest.main()
