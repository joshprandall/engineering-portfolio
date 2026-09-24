import importlib.util, shutil, tempfile, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('repair',ROOT/'tools/install_reviewed_repair.py')
repair=importlib.util.module_from_spec(spec);spec.loader.exec_module(repair)

def make_site(dest):
    dest.mkdir(parents=True,exist_ok=True)
    for name in ('index.html','knowledge.js','learning-depth.js','styles.css','site-theme.js','site-scenes.js','site-scenes.css'):
        shutil.copyfile(ROOT/name,dest/name)
    shutil.copytree(ROOT/'tests/fixtures/osu-chess',dest/'games/3d-battle-chess')
    (dest/'knowledge.js').write_text((dest/'knowledge.js').read_text()+'\n// A live-only extension must survive.\n')
    return dest

class RepairTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.site=make_site(Path(self.temp.name)/'public_html')
    def test_preservation_and_idempotency(self):
        engine=(self.site/'games/3d-battle-chess/engine.js').read_bytes()
        changes=repair.plan_changes(self.site,ROOT)
        self.assertNotIn('games/3d-battle-chess/engine.js',changes)
        repair.apply_changes(self.site,changes)
        self.assertEqual(engine,(self.site/'games/3d-battle-chess/engine.js').read_bytes())
        self.assertIn('A live-only extension must survive',(self.site/'knowledge.js').read_text())
        self.assertIn('refreshSharedView();',(self.site/'games/3d-battle-chess/battle.js').read_text())
        self.assertEqual({},repair.plan_changes(self.site,ROOT))
    def test_unknown_game_stops_before_write(self):
        p=self.site/'games/3d-battle-chess/battle.js';p.write_text('An unfamiliar version')
        before={p.relative_to(self.site):p.read_bytes() for p in self.site.rglob('*') if p.is_file()}
        with self.assertRaisesRegex(RuntimeError,'Chess version differs'):repair.plan_changes(self.site,ROOT)
        self.assertEqual(before,{p.relative_to(self.site):p.read_bytes() for p in self.site.rglob('*') if p.is_file()})
    def test_failed_public_verification_rolls_back(self):
        before={p.relative_to(self.site):p.read_bytes() for p in self.site.rglob('*') if p.is_file()}
        def fail(_):raise RuntimeError('Public bytes differ')
        with self.assertRaisesRegex(RuntimeError,'Public bytes differ'):
            repair.apply_changes(self.site,repair.plan_changes(self.site,ROOT),fail)
        self.assertEqual(before,{p.relative_to(self.site):p.read_bytes() for p in self.site.rglob('*') if p.is_file()})

if __name__=='__main__':unittest.main()
