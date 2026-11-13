"""Actual child Bash fixtures; only synthetic temporary files are written."""
import pathlib,json,gzip,unittest,subprocess,shutil,os,tempfile
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/cloud/linux.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/bash-execution-boundaries.json.gz').read_bytes()))
IDS=["cloud-v09-teach-back-lab-bash-pipelines","cloud-v09-quick-reference-bash-append-redirection","cloud-v09-misconception-clinic-bash-standard-output-redirection","cloud-v09-troubleshooting-lab-bash-quoting"]
REFS=["https://www.gnu.org/software/bash/manual/html_node/Pipelines.html","https://www.gnu.org/software/bash/manual/html_node/Redirections.html","https://www.gnu.org/software/bash/manual/html_node/Redirections.html","https://www.gnu.org/software/bash/manual/html_node/Special-Parameters.html"]
BASH=shutil.which('bash') if os.name!='nt' else r'C:\Program Files\Git\bin\bash.exe'
def run(code,cwd):
 if not BASH or not pathlib.Path(BASH).exists():raise unittest.SkipTest('Bash required for actual shell fixtures')
 env={k:v for k,v in os.environ.items() if k.upper() in {'PATH','SYSTEMROOT','WINDIR','TEMP','TMP'}}
 env['HOME']=str(cwd);env['LC_ALL']='C'
 prefix="set +e; set +u; set +o pipefail; set +C; set +m; shopt -u lastpipe; IFS=$' \\t\\n'; "
 return subprocess.run([BASH,'--noprofile','--norc','-c',prefix+code],cwd=cwd,env=env,capture_output=True,timeout=10)
class BashExecutionBoundaries(unittest.TestCase):
 def claim(self,i,*words):
  text=' '.join(D[IDS[i]]['reasoningSteps'])
  for word in words:self.assertIn(word,text)
 def test_scope(self):
  checkpoint=json.loads(gzip.decompress((R/'tests/baselines/mode-bit-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(B),list(checkpoint));self.assertEqual(list(checkpoint),list(D));self.assertEqual(len(D),147)
  for k in IDS:self.assertEqual(D[k],checkpoint[k],k)
  for k in B:
   self.assertEqual(sorted(f for f in set(B[k])|set(checkpoint[k]) if B[k].get(f)!=checkpoint[k].get(f)),['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,src in zip(IDS,REFS):
   self.assertFalse(D[k]['essentialQuestion'].startswith('What does '))
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn(src,D[k][f][-1])
 def test_pipeline_and_redirected_loop(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=run("count=0; printf 'a\\nb\\n' | { while IFS= read -r line; do count=$((count+1)); done; printf 'inner=%s\\n' \"$count\"; }; printf 'outer=%s\\n' \"$count\"",tmp)
   self.assertEqual((p.returncode,p.stdout,p.stderr),(0,b'inner=2\nouter=0\n',b''))
   pathlib.Path(tmp,'records.txt').write_bytes(b'a\nb\n')
   p=run("count=0; while IFS= read -r line; do count=$((count+1)); done <records.txt; printf 'outer=%s\\n' \"$count\"",tmp)
   self.assertEqual((p.returncode,p.stdout,p.stderr),(0,b'outer=2\n',b''))
  self.claim(0,'lastpipe explicitly disabled','parent shell','current shell')
 def test_truncation_and_append_before_failure(self):
  with tempfile.TemporaryDirectory() as tmp:
   path=pathlib.Path(tmp,'capture.txt')
   for operator,expected in [('>',b''),('>>',b'old')]:
    path.write_bytes(b'old');p=run('(exit 7) '+operator+'capture.txt; rc=$?; printf %s "$rc"',tmp)
    self.assertEqual((p.returncode,p.stdout,p.stderr),(0,b'7',b''));self.assertEqual(path.read_bytes(),expected)
   path.write_bytes(b'old');p=run("printf %s new >>capture.txt",tmp)
   self.assertEqual((p.returncode,p.stdout,p.stderr),(0,b'',b''));self.assertEqual(path.read_bytes(),b'oldnew')
  self.claim(1,'already empty','oldnew','not a rollback')
 def test_redirection_failure_prevents_body(self):
  with tempfile.TemporaryDirectory() as tmp:
   self.assertFalse(pathlib.Path(tmp,'missing-parent').exists())
   code="body(){ printf %s entered >marker.txt; }; body >missing-parent/out.txt; rc=$?; printf %s \"$rc\""
   p=run(code,tmp);self.assertEqual(p.returncode,0);self.assertNotEqual(p.stdout,b'0');self.assertTrue(p.stderr)
   self.assertFalse(pathlib.Path(tmp,'marker.txt').exists());self.assertFalse(pathlib.Path(tmp,'missing-parent/out.txt').exists())
   p=run("body(){ printf %s entered >marker.txt; }; body >capture.txt",tmp)
   self.assertEqual((p.returncode,p.stdout,p.stderr),(0,b'',b''))
   self.assertEqual(pathlib.Path(tmp,'marker.txt').read_bytes(),b'entered')
  self.claim(2,'function body does not','nonzero','failure phase')
 def test_quoted_positional_parameters(self):
  reporter='report(){ printf "n=%s" "$#"; for arg in "$@"; do printf "<%s>" "$arg"; done; }; '
  with tempfile.TemporaryDirectory() as tmp:
   cases=[
    ('set -- "alpha beta" "" gamma; report "$@"',b'n=3<alpha beta><><gamma>'),
    ('set -- "alpha beta" "" gamma; report "$*"',b'n=1<alpha beta  gamma>'),
    ('set --; report "$@"',b'n=0'),
    ('set --; report "$*"',b'n=1<>'),
    ('IFS=:; set -- "alpha beta" "" gamma; report "$*"',b'n=1<alpha beta::gamma>'),
    ('IFS=:; set -- "alpha beta" "" gamma; report "$@"',b'n=3<alpha beta><><gamma>')]
   for code,want in cases:
    p=run(reporter+code,tmp);self.assertEqual((p.returncode,p.stdout,p.stderr),(0,want,b''))
  self.claim(3,'three separate arguments','one empty argument','two spaces')
if __name__=='__main__':unittest.main()
