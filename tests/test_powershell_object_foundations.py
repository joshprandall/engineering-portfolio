"""One isolated in-memory PowerShell fixture; no administrative commands."""
import pathlib,json,gzip,unittest,shutil,subprocess,base64,functools
R=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((R/'deep-learning/cloud/automation.json').read_bytes())
B=json.loads(gzip.decompress((R/'tests/baselines/powershell-object-foundations.json.gz').read_bytes()))
IDS=["cloud-v05-powershell-pipeline","cloud-v06-powershell-object-pipeline","cloud-v09-practical-lab-powershell-object-pipeline","cloud-v09-design-review-powershell-pipeline","cloud-v09-evidence-verification-la-powershell-object-pipeline","cloud-v09-failure-analysis-lab-powershell-object-pipeline"]
URLS=["https://learn.microsoft.com/powershell/module/microsoft.powershell.core/where-object","https://learn.microsoft.com/powershell/module/microsoft.powershell.utility/select-object","https://learn.microsoft.com/powershell/module/microsoft.powershell.utility/sort-object","https://learn.microsoft.com/powershell/module/microsoft.powershell.utility/select-object","https://learn.microsoft.com/powershell/module/microsoft.powershell.utility/group-object","https://learn.microsoft.com/powershell/module/microsoft.powershell.utility/measure-object"]
SCRIPT=r"""
$ErrorActionPreference='Stop'
$rows=@([pscustomobject]@{Name='B';Size=[int]2;Ready=$false;Group='red'},[pscustomobject]@{Name='A';Size=[int]10;Ready=$true;Group='blue'},[pscustomobject]@{Name='C';Size=[int]10;Ready=$true;Group='red'},[pscustomobject]@{Name='D';Size=[int]5;Ready=$true;Group='blue'})
$filtered=@($rows | Where-Object {$_.Ready -and $_.Size -ge 5})
$projected=@($rows | Select-Object -Property Name)
$expanded=@($rows | Select-Object -ExpandProperty Name)
$pair=@($rows | Select-Object -Property Name,Size)
$groups=@($rows | Group-Object -Property Group | Sort-Object -Property Name)
$summary=@($groups | ForEach-Object {[pscustomobject]@{Name=$_.Name;Count=$_.Count;Members=@($_.Group.Name | Sort-Object)}})
$all=$rows | Measure-Object -Property Size -Sum -Average -Minimum -Maximum
$ready=$rows | Where-Object {$_.Ready} | Measure-Object -Property Size -Sum -Average -Minimum -Maximum
[pscustomobject]@{
 Names=@($filtered.Name);Sizes=@($filtered.Size);Numeric=@($filtered | ForEach-Object {$_.Size -is [int]});Empty=@($rows | Where-Object {$_.Size -ge 11}).Count
 FilterThenTake=@($rows | Where-Object {$_.Ready} | Select-Object -First 2 | ForEach-Object {$_.Name})
 TakeThenFilter=@($rows | Select-Object -First 2 | Where-Object {$_.Ready} | ForEach-Object {$_.Name})
 FirstOneBeforeFilter=@($rows | Select-Object -First 1 | Where-Object {$_.Ready}).Count
 Ascending=@($rows | Sort-Object -Property Size,Name | ForEach-Object {$_.Name})
 Mixed=@($rows | Sort-Object -Property @{Expression='Size';Descending=$true},@{Expression='Name';Descending=$false} | ForEach-Object {$_.Name})
 Original=@($rows.Name);ProjectedProperties=@($projected[0].PSObject.Properties.Name);Expanded=$expanded;ExpandedStrings=@($expanded | ForEach-Object {$_ -is [string]});PairNumeric=@($pair | ForEach-Object {$_.Size -is [int]})
 Groups=$summary;All=$all;Ready=$ready
} | ConvertTo-Json -Depth 6 -Compress
"""
@functools.lru_cache(maxsize=1)
def evidence():
 shell=shutil.which('pwsh') or shutil.which('powershell')
 if not shell:raise unittest.SkipTest('PowerShell required for executable object-pipeline cases')
 encoded=base64.b64encode(SCRIPT.encode('utf-16le')).decode()
 p=subprocess.run([shell,'-NoProfile','-NonInteractive','-EncodedCommand',encoded],capture_output=True,timeout=30)
 if p.returncode:raise AssertionError(p.stderr.decode(errors='replace'))
 return json.loads(p.stdout.decode('utf-8-sig'))
class PowerShellObjectFoundations(unittest.TestCase):
 def test_scope(self):
  C=json.loads(gzip.decompress((R/'tests/baselines/plan-boundaries.json.gz').read_bytes()))
  self.assertEqual(list(B),list(D));self.assertEqual(list(C),list(D));self.assertEqual(len(D),98)
  for k in IDS:self.assertEqual(D[k],C[k],k)
  for k in B:
   changed=sorted(f for f in set(B[k])|set(C[k]) if B[k].get(f)!=C[k].get(f))
   self.assertEqual(changed,['essentialQuestion','labPlan','reasoningSteps'] if k in IDS else [],k)
 def test_sources(self):
  for k,url in zip(IDS,URLS):
   self.assertNotIn('mean, why does it matter',D[k]['essentialQuestion'])
   for f in ['reasoningSteps','labPlan']:self.assertEqual(len(D[k][f]),6);self.assertIn(url,D[k][f][-1])
 def test_typed_filter(self):
  e=evidence();self.assertEqual(e['Names'],['A','C','D']);self.assertEqual(e['Sizes'],[10,10,5]);self.assertEqual(e['Numeric'],[True]*3);self.assertEqual(e['Empty'],0)
 def test_pipeline_order(self):
  e=evidence();self.assertEqual(e['FilterThenTake'],['A','C']);self.assertEqual(e['TakeThenFilter'],['A']);self.assertEqual(e['FirstOneBeforeFilter'],0)
 def test_sort_keys(self):
  e=evidence();self.assertEqual(e['Ascending'],['B','D','A','C']);self.assertEqual(e['Mixed'],['A','C','D','B']);self.assertEqual(e['Original'],['B','A','C','D'])
 def test_projection_vs_expansion(self):
  e=evidence();self.assertEqual(e['ProjectedProperties'],['Name']);self.assertEqual(e['Expanded'],['B','A','C','D']);self.assertEqual(e['ExpandedStrings'],[True]*4);self.assertEqual(e['PairNumeric'],[True]*4)
 def test_groups(self):
  e=evidence();self.assertEqual(e['Groups'],[{'Name':'blue','Count':2,'Members':['A','D']},{'Name':'red','Count':2,'Members':['B','C']}]);self.assertEqual(sum(g['Count'] for g in e['Groups']),4)
 def test_measure_population(self):
  e=evidence();self.assertEqual({k:e['All'][k] for k in ['Count','Sum','Average','Minimum','Maximum']},{'Count':4,'Sum':27,'Average':6.75,'Minimum':2,'Maximum':10});self.assertEqual(e['Ready']['Count'],3);self.assertEqual(e['Ready']['Sum'],25);self.assertAlmostEqual(e['Ready']['Average'],25/3);self.assertNotEqual(e['Ready']['Average'],25/4)
if __name__=='__main__':unittest.main()
