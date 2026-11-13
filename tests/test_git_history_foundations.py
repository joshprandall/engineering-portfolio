"""Git history checks use only disposable repositories and no network."""
import pathlib,json,gzip,unittest,subprocess,shutil,os,tempfile,contextlib
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/software/devops.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/git-history-foundations.json.gz').read_bytes()))
IDS=["software-v08-evidence-lab-git-commit","software-v08-evidence-lab-git-branch","software-v08-evidence-lab-git-head","software-v08-evidence-lab-git-merge","software-v08-evidence-lab-git-revert","software-v08-evidence-lab-git-cherry-pick"]
SLUGS=["git-commit","git-branch","git-symbolic-ref","git-merge","git-revert","git-cherry-pick"]
@contextlib.contextmanager
def fixture():
 git=shutil.which('git')
 if not git:raise unittest.SkipTest('Git required for disposable history fixtures')
 with tempfile.TemporaryDirectory() as tmp:
  root=pathlib.Path(tmp);repo=root/'repo';repo.mkdir();empty=root/'empty';empty.mkdir()
  env={k:v for k,v in os.environ.items() if not k.startswith('GIT_')}
  env.update(GIT_CONFIG_NOSYSTEM='1',GIT_CONFIG_GLOBAL=os.devnull,GIT_AUTHOR_NAME='Synthetic Fixture',GIT_AUTHOR_EMAIL='fixture@example.invalid',GIT_COMMITTER_NAME='Synthetic Fixture',GIT_COMMITTER_EMAIL='fixture@example.invalid',GIT_AUTHOR_DATE='2020-01-01T00:00:00+00:00',GIT_COMMITTER_DATE='2020-01-01T00:00:00+00:00',GIT_TERMINAL_PROMPT='0')
  def g(*args,status=0):
   p=subprocess.run([git,'-c','core.autocrlf=false','-c','commit.gpgSign=false','-c','core.hooksPath='+str(empty),*args],cwd=repo,env=env,capture_output=True,timeout=15)
   if p.returncode!=status:raise AssertionError((args,p.returncode,p.stderr.decode(errors='replace')))
   return p.stdout.decode().strip()
  def commit(name,text,message):
   (repo/name).write_bytes((text+'\n').encode());g('add','--',name);g('commit','-m',message);return g('rev-parse','HEAD')
  g('init','-b','main','--template='+str(empty));a=commit('note.txt','base','base')
  yield repo,g,commit,a
class GitHistoryFoundations(unittest.TestCase):
 def test_scope(self):
  self.assertEqual(list(B),list(D));self.assertEqual(len(D),145)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(D[k]) if B[k].get(f)!=D[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,slug in zip(IDS,SLUGS):
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:
    self.assertEqual(len(D[k][f]),6);self.assertIn('https://git-scm.com/docs/'+slug,D[k][f][-1])
 def test_commit_index_not_worktree(self):
  with fixture() as (r,g,c,a):
   (r/'note.txt').write_bytes(b'staged\n');g('add','note.txt');(r/'note.txt').write_bytes(b'working\n');g('commit','-m','index snapshot')
   self.assertEqual(g('show','HEAD:note.txt'),'staged');self.assertEqual(g('show',':note.txt'),'staged');self.assertEqual((r/'note.txt').read_bytes(),b'working\n')
   self.assertEqual(g('diff','--name-only'),'note.txt');self.assertEqual(g('diff','--cached','--name-only'),'')
 def test_branch_creation_does_not_switch(self):
  with fixture() as (r,g,c,a):
   g('branch','topic');self.assertEqual(g('symbolic-ref','--short','HEAD'),'main');self.assertEqual(g('rev-parse','topic'),a)
   b=c('note.txt','next','next');self.assertNotEqual(b,a);self.assertEqual(g('rev-parse','main'),b);self.assertEqual(g('rev-parse','topic'),a)
   g('switch','topic');self.assertEqual((r/'note.txt').read_bytes(),b'base\n')
 def test_detached_head_can_be_named(self):
  with fixture() as (r,g,c,a):
   g('switch','--detach',a);self.assertEqual(g('symbolic-ref','-q','HEAD',status=1),'');self.assertEqual(g('rev-parse','HEAD'),a)
   b=c('note.txt','detached','detached');self.assertNotEqual(b,a);self.assertEqual(g('rev-parse','main'),a)
   g('branch','rescued');g('switch','rescued');self.assertEqual(g('symbolic-ref','--short','HEAD'),'rescued');self.assertEqual(g('rev-parse','HEAD'),b)
 def test_fast_forward_and_two_parent_merge(self):
  with fixture() as (r,g,c,a):
   g('switch','-c','topic');b=c('feature.txt','feature','topic');g('switch','main');g('merge','--ff-only','topic');self.assertEqual(g('rev-parse','HEAD'),b);self.assertEqual(g('rev-list','--count','HEAD'),'2')
  with fixture() as (r,g,c,a):
   g('switch','-c','topic');t=c('feature.txt','feature','topic');g('switch','main');m=c('main.txt','main','main');g('merge','--no-ff','--no-edit','topic')
   parents=g('rev-list','--parents','-n','1','HEAD').split();self.assertEqual(parents[1:],[m,t]);self.assertEqual((r/'feature.txt').read_bytes(),b'feature\n');self.assertEqual((r/'main.txt').read_bytes(),b'main\n')
 def test_revert_preserves_history(self):
  with fixture() as (r,g,c,a):
   b=c('note.txt','changed','change');g('revert','--no-edit',b);rev=g('rev-parse','HEAD');self.assertNotEqual(rev,a);self.assertEqual(g('rev-parse','HEAD^'),b)
   self.assertEqual((r/'note.txt').read_bytes(),b'base\n');g('merge-base','--is-ancestor',b,rev);self.assertEqual(g('rev-list','--count','HEAD'),'3');self.assertEqual(g('rev-parse',a+'^{tree}'),g('rev-parse','HEAD^{tree}'))
 def test_cherry_pick_copies_change_not_ancestry(self):
  with fixture() as (r,g,c,a):
   g('switch','-c','topic');t=c('feature.txt','feature','topic');g('switch','main');m=c('main.txt','main','main');g('cherry-pick',t);p=g('rev-parse','HEAD')
   self.assertNotEqual(p,t);self.assertEqual(g('rev-list','--parents','-n','1','HEAD').split()[1:],[m]);self.assertEqual(g('rev-parse','topic'),t);g('merge-base','--is-ancestor',t,p,status=1)
   self.assertEqual((r/'feature.txt').read_bytes(),b'feature\n');self.assertEqual((r/'main.txt').read_bytes(),b'main\n')
if __name__=='__main__':unittest.main()
