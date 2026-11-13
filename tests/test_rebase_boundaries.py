import unittest,pathlib,json,gzip
from test_git_history_foundations import fixture
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["software-git-merge-rebase","software-v06-git-rebase","software-v08-deep-dive-git-rebase","software-v08-evidence-lab-git-rebase"]
def diverge(g,commit):
 g('switch','-c','topic');t=commit('feature.txt','feature','topic')
 g('switch','main');m=commit('main.txt','main','main');g('switch','topic')
 return t,m
class RebaseBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/rebase-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/software/devops.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),145)
  for key in b:
   changed={f for f in set(b[key])|set(d[key]) if b[key].get(f)!=d[key].get(f)}
   self.assertEqual(changed,{'essentialQuestion','reasoningSteps','labPlan'} if key in IDS else set(),key)
 def test_source_and_claims(self):
  d=json.loads((R/'deep-learning/software/devops.json').read_bytes())
  for key,words in zip(IDS,[['one parent','two-parent','disposable'],['IDs differ','not edited','parent'],['saved-topic','main still','No remote'],['unmerged','clean','not a universal']]):
   text=' '.join(d[key]['reasoningSteps'])
   self.assertIn('https://git-scm.com/docs/git-rebase',text)
   for word in words:self.assertIn(word,text)
 def test_replayed_patch_not_merge(self):
  with fixture() as (r,g,commit,a):
   t,m=diverge(g,commit);patch=g('diff',a,t,'--','feature.txt')
   g('rebase','main');head=g('rev-parse','HEAD')
   self.assertEqual(g('rev-list','--parents','-n','1','HEAD').split(),[head,m])
   self.assertEqual(g('rev-parse',t+'^'),a)
   self.assertEqual(g('diff',m,head,'--','feature.txt'),patch)
   self.assertEqual((r/'feature.txt').read_bytes(),b'feature\n');self.assertEqual((r/'main.txt').read_bytes(),b'main\n')
   self.assertNotEqual(g('rev-parse',t+'^{tree}'),g('rev-parse',head+'^{tree}'))
 def test_commit_identity(self):
  with fixture() as (r,g,commit,a):
   t,m=diverge(g,commit);subject=g('show','-s','--format=%s',t)
   g('rebase','main');head=g('rev-parse','HEAD')
   self.assertNotEqual(head,t);self.assertEqual(g('show','-s','--format=%s',head),subject)
   self.assertEqual(g('cat-file','-t',t),'commit')
   self.assertEqual(g('rev-parse',t+'^'),a);self.assertEqual(g('rev-parse',head+'^'),m)
 def test_reference_scope(self):
  with fixture() as (r,g,commit,a):
   t,m=diverge(g,commit);g('branch','saved-topic');g('rebase','main')
   self.assertEqual(g('symbolic-ref','--short','HEAD'),'topic')
   self.assertNotEqual(g('rev-parse','topic'),t)
   self.assertEqual(g('rev-parse','main'),m);self.assertEqual(g('rev-parse','saved-topic'),t)
   self.assertEqual(g('rev-parse','saved-topic^'),a);self.assertEqual(g('show','saved-topic:feature.txt'),'feature')
   self.assertEqual(g('remote'),'')
 def test_conflict_abort(self):
  with fixture() as (r,g,commit,a):
   g('switch','-c','topic');t=commit('note.txt','topic value','topic')
   g('switch','main');m=commit('note.txt','main value','main');g('switch','topic')
   self.assertEqual(g('status','--porcelain'),'')
   g('rebase','main',status=1)
   self.assertEqual(g('diff','--name-only','--diff-filter=U'),'note.txt')
   g('rebase','--abort')
   self.assertEqual(g('rev-parse','HEAD'),t);self.assertEqual(g('symbolic-ref','--short','HEAD'),'topic')
   self.assertEqual(g('rev-parse','main'),m);self.assertEqual((r/'note.txt').read_bytes(),b'topic value\n')
   self.assertEqual(g('status','--porcelain'),'')
if __name__=='__main__':unittest.main()
