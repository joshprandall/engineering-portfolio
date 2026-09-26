"""Fail-closed packaging contracts; never contact or write production."""
import importlib.util,json,sys,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import build_runtime

class RuntimeBuilder(unittest.TestCase):
    def test_corrupt_artifact_cannot_replace_staged_package(self):
        marker=ROOT/'staging/website-2.0-runtime-manifest.json'
        if not marker.exists():self.skipTest('Build a staged package first')
        before=marker.read_bytes();commit=json.loads(before)['sourceCommit']
        with patch.object(build_runtime,'read_bytes',return_value=b'wrong asset'):
            with self.assertRaisesRegex(ValueError,'Artifact checksum'):build_runtime.build(commit,refresh=True)
        self.assertEqual(marker.read_bytes(),before)

    def test_source_metadata_has_provenance_and_no_duplicate_payloads(self):
        marker=ROOT/'staging/website-2.0-runtime-manifest.json'
        if not marker.exists():self.skipTest('Build a staged package first')
        rows=json.loads(marker.read_bytes())['files'];hashes=set()
        for row in rows:
            for field in ('path','size','sha256','source','owningComponent','deploymentClassification'):self.assertIn(field,row)
            self.assertNotIn(row['sha256'],hashes,row['path']);hashes.add(row['sha256'])
            self.assertNotIn(row['path'].split('/')[0],('tests','tools','preservation','project-sources','.git','.github'))

if __name__=='__main__':unittest.main()
