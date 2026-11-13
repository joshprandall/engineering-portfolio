"""Executable Bash fixtures, never host configuration changes."""
import pathlib,json,gzip,unittest,subprocess,shutil,os,tempfile
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/cloud/linux.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/bash-shell-foundations.json.gz').read_bytes()))
IDS=["cloud-v05-bash-exit-status","cloud-v06-bash-pipeline-exit-status","cloud-v07-bash-and-and-or-lists","cloud-v07-bash-quoting","cloud-v07-bash-command-substitution","cloud-v07-bash-standard-error-redirection"]
SLUGS=["Exit-Status","Pipelines","Lists","Double-Quotes","Command-Substitution","Redirections"]
BASH=shutil.which('bash') if os.name!='nt' else r'C:\Program Files\Git\bin\bash.exe'
def run(code,cwd=None):
 if not BASH or not pathlib.Path(BASH).exists():raise unittest.SkipTest('Bash is required for executable shell fixtures')
 env=os.environ.copy()
 for k in ['BASH_ENV','ENV','SHELLOPTS','BASHOPTS']:env.pop(k,None)
 return subprocess.run([BASH,'--noprofile','--norc','-c',"set +e; set +u; set +o pipefail; IFS=$' \\t\\n'; "+code],cwd=cwd,env=env,capture_output=True,timeout=10)
class BashShellFoundations(unittest.TestCase):
 def test_scope(self):
  self.assertEqual(list(B),list(D));self.assertEqual(len(D),147)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,slug in zip(IDS,SLUGS):
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn('/'+slug+'.html',D[k][f][-1])
 def test_saved_status(self):
  for code,want in [('(exit 7); rc=$?; true; printf %s "$rc"',b'7'),('(exit 7); true; printf %s "$?"',b'0'),('(exit 0); rc=$?; printf %s "$rc"',b'0')]:
   p=run(code);self.assertEqual((p.stdout,p.stderr,p.returncode),(want,b'',0))
 def test_pipefail(self):
  for code,status in [('(exit 7) | (exit 0)',0),('set -o pipefail; (exit 7) | (exit 0)',7),('set -o pipefail; (exit 7) | (exit 3) | (exit 0)',3),('set -o pipefail; (exit 0) | (exit 0)',0),('set -o pipefail; ! (exit 7) | (exit 0)',0)]:
   p=run(code);self.assertEqual((p.returncode,p.stdout,p.stderr),(status,b'',b''))
 def test_lists(self):
  for code,out,status in [('true && printf yes',b'yes',0),('false && printf skipped',b'',1),('true && (exit 9) || printf fallback',b'fallback',0),('false && printf skipped || printf fallback',b'fallback',0),('if true; then (exit 9); else printf fallback; fi',b'',9)]:
   p=run(code);self.assertEqual((p.stdout,p.returncode,p.stderr),(out,status,b''))
 def test_arguments(self):
  for val in ['alpha beta','']:
   for expansion,count in [('"$value"',1),('$value',2 if val else 0)]:
    p=run("value='"+val+"'; set -- "+expansion+"; printf %s \"$#\"");self.assertEqual(p.stdout,str(count).encode());self.assertEqual(p.returncode,0)
  self.assertEqual(run("value=changed; printf %s '$value'").stdout,b'$value')
 def test_substitution(self):
  for suffix in ['','\\n','\\n\\n']:
   prefix="value=$(printf 'a\\nb"+suffix+"'); "
   self.assertEqual(run(prefix+'printf %s "$value"').stdout,b'a\nb')
   self.assertEqual(run(prefix+'printf %s "${#value}"').stdout,b'3')
   self.assertEqual(run(prefix+'set -- $value; printf %s "$#"').stdout,b'2')
 def test_redirection_order(self):
  group="{ printf 'out\\n'; printf 'err\\n' >&2; } "
  for redirects,want_file,want_out in [('>capture.txt 2>&1',b'out\nerr\n',b''),('2>&1 >capture.txt',b'out\n',b'err\n')]:
   with tempfile.TemporaryDirectory() as tmp:
    p=run(group+redirects,tmp)
    self.assertEqual((p.stdout,p.stderr,p.returncode),(want_out,b'',0))
    self.assertEqual((pathlib.Path(tmp)/'capture.txt').read_bytes(),want_file)
if __name__=='__main__':unittest.main()
