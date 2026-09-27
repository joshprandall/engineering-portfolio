"""Release-safety contracts for the candidate metadata; no live filesystem access."""
import hashlib
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/'manifests'/name).read_text(encoding='utf-8'))

class ManifestContracts(unittest.TestCase):
    def test_every_page_and_required_route_is_packaged(self):
        runtime={r['path'] for r in read('runtime-files.json')['files']}
        manifest=read('site-routes.json');routes={r['path'] for r in manifest['routes']}
        self.assertEqual(routes,{p for p in runtime if p.endswith('.html')})
        self.assertTrue({'expertise-experience.html','game-development.html','lesson.html'}<=routes)
        self.assertEqual(manifest['unresolvedReferences'],[])
        for route in manifest['routes']:
            self.assertTrue(set(route['runtimeDependencies'])<=runtime,route['path'])
            self.assertTrue(set(route['linkedRoutes'])<=routes,route['path'])
        wizard=next(r for r in manifest['routes'] if r['path']=='games/evil-wizard/play.html')
        self.assertTrue({'games/evil-wizard/index.pck','games/evil-wizard/index.wasm','games/evil-wizard/index.js'}<=set(wizard['runtimeDependencies']))
        lesson=next(r for r in manifest['routes'] if r['path']=='lesson.html')
        self.assertTrue({p for p in runtime if p.startswith('deep-learning/')}<=set(lesson['runtimeDependencies']))

    def test_distinct_exports_are_complete_and_not_claimed_reproducible(self):
        builds=read('evil-wizard-builds.json');self.assertFalse(builds['sourceReproductionVerified'])
        self.assertEqual(sum(u['canonical'] for u in builds['units']),1)
        hashes=set()
        for unit in builds['units']:
            pck=next(m for m in unit['members'] if m['path'].endswith('/index.pck'))
            hashes.add(pck['sha256']);self.assertTrue(any(m['path'].endswith('/index.wasm') for m in unit['members']))
            storage=pck['storage'];self.assertEqual(storage['kind'],'repository-file')
            self.assertEqual(hashlib.sha256((ROOT/storage['path']).read_bytes()).hexdigest(),pck['sha256'])
        self.assertEqual(len(hashes),4)

    def test_cleanup_cannot_authorize_deletion_or_hide_access_gaps(self):
        cleanup=read('production-cleanup.json');self.assertFalse(cleanup['executionAllowed'])
        rows={r['path']:r for r in cleanup['files']}
        self.assertEqual(len(rows),398)
        for row in rows.values():
            self.assertFalse(row['deleteAuthorized']);self.assertIn(row['category'],cleanup['categories'])
        for path in ('quantum2.jpg','_shellfish_uploading_4336159125157019876','.codex/'):
            self.assertEqual(rows[path]['category'],'UNRESOLVED');self.assertIsNone(rows[path]['sha256'])
        self.assertEqual(rows['assets/fusion-presentation.mp4']['category'],'PRESERVE_AS_ARTIFACT')

    def test_remote_media_contracts_and_no_invented_hashes(self):
        rows=read('external-dependencies.json')['dependencies']
        self.assertTrue({'pexels','wikimedia','three-cdn','osu'}<={r['provider'] for r in rows})
        for row in rows:
            self.assertTrue(row['fallbackContract']);self.assertTrue(row['consumers']);self.assertIsNone(row['sha256'])

if __name__=='__main__':unittest.main()
