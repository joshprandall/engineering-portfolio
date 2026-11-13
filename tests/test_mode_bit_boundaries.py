import unittest,pathlib,json,gzip,stat
R=pathlib.Path(__file__).resolve().parents[1]
IDS=["cloud-linux-permissions","cloud-v05-lab-decode-linux-permissions-quickly","cloud-v09-teach-back-lab-decode-linux-permissions-quickly","cloud-v10-flash-review-decode-linux-permissions-quickly"]
REFS=["https://www.gnu.org/software/coreutils/manual/html_node/Numeric-Modes.html","https://docs.python.org/3.13/library/stat.html","https://docs.python.org/3.13/library/stat.html","https://man7.org/linux/man-pages/man2/umask.2.html"]
class ModeBitBoundaries(unittest.TestCase):
 def test_scope(self):
  b=json.loads(gzip.decompress((R/'tests/baselines/mode-bit-boundaries.json.gz').read_bytes()));d=json.loads((R/'deep-learning/cloud/linux.json').read_bytes())
  self.assertEqual(list(b),list(d));self.assertEqual(len(d),147)
  for k in b:
   fields={f for f in set(b[k])|set(d[k]) if b[k].get(f)!=d[k].get(f)}
   self.assertEqual(fields,{'essentialQuestion','reasoningSteps','labPlan'} if k in IDS else set(),k)
 def test_sources(self):
  d=json.loads((R/'deep-learning/cloud/linux.json').read_bytes())
  for k,url in zip(IDS,REFS):
   self.assertIn(url,' '.join(d[k]['reasoningSteps']));self.assertFalse(d[k]['essentialQuestion'].startswith('What does '))
 def test_octal_roundtrip(self):
  self.assertEqual(((0o640>>6)&7,(0o640>>3)&7,0o640&7),(6,4,0));self.assertEqual(stat.filemode(stat.S_IFREG|0o640),'-rw-r-----')
  for mode in range(512):
   u,g,o=(mode>>6)&7,(mode>>3)&7,mode&7
   self.assertEqual((u<<6)|(g<<3)|o,mode)
   expected=''.join(char if digit&bit else '-' for digit in [u,g,o] for bit,char in [(4,'r'),(2,'w'),(1,'x')])
   self.assertEqual(stat.filemode(stat.S_IFREG|mode),'-'+expected)
 def test_type_and_permissions(self):
  regular=stat.S_IFREG|0o750;directory=stat.S_IFDIR|0o750
  self.assertEqual(stat.S_IFMT(regular),stat.S_IFREG);self.assertEqual(stat.S_IFMT(directory),stat.S_IFDIR)
  self.assertEqual(stat.S_IMODE(regular),0o750);self.assertEqual(stat.S_IMODE(directory),0o750)
  self.assertEqual(stat.filemode(regular),'-rwxr-x---');self.assertEqual(stat.filemode(directory),'drwxr-x---')
 def test_special_display(self):
  for kind,mode,want in [(stat.S_IFREG,0o4755,'-rwsr-xr-x'),(stat.S_IFREG,0o4644,'-rwSr--r--'),(stat.S_IFREG,0o2755,'-rwxr-sr-x'),(stat.S_IFREG,0o2745,'-rwxr-Sr-x'),(stat.S_IFDIR,0o1777,'drwxrwxrwt'),(stat.S_IFDIR,0o1776,'drwxrwxrwT')]:
   self.assertEqual(stat.filemode(kind|mode),want);self.assertEqual(stat.S_IMODE(kind|mode),mode);self.assertNotEqual(stat.S_IMODE(kind|mode),(kind|mode)&0o777)
 def test_mask_not_subtraction(self):
  def filtered(request,mask):return request&~mask&0o777
  self.assertEqual(filtered(0o666,0o027),0o640);self.assertEqual(filtered(0o777,0o027),0o750);self.assertEqual(0o666-0o027,0o637);self.assertEqual(filtered(0o644,0o022),0o644)
  for request in range(512):
   for mask in [0,0o022,0o027,0o077,0o777]:
    result=filtered(request,mask);self.assertEqual(result&~request,0);self.assertEqual(result&mask,0);self.assertEqual(filtered(result,mask),result)
if __name__=='__main__':unittest.main()
