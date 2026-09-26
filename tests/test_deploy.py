"""Integration checks for release preservation and rollback on a temporary site."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('deploy', Path(__file__).parents[1] / 'tools/deploy_osu_live.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class DeploymentTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source, self.site = self.root / 'release', self.root / 'public_html'
        for name in deploy.REQUIRED:
            self.write(self.source / name, 'new ' + name)
        self.write(self.source / 'index.html', '<link href="portfolio-home.css"><script src="quantum-cube.js"></script>')
        self.write(self.source / 'projects.html', '<article class="project-card"></article>' * 16)
        self.write(self.source / 'games/evil-wizard/index.html', 'must never overwrite the game')
        self.write(self.source / 'geometric-lab/math.js', 'must never overwrite lab calculations')
        self.write(self.site / 'geometric-lab/math.js', 'host lab calculations')
        for name in (*deploy.PROTECTED_REQUIRED, 'assets/fusion-presentation.mp4', 'index.html', 'app.js', 'private-host-page.html'):
            self.write(self.site / name, 'original ' + name)
        self.before = self.snapshot()

    @staticmethod
    def write(path, content):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)

    def snapshot(self):
        return {p.relative_to(self.site).as_posix(): p.read_bytes() for p in self.site.rglob('*') if p.is_file()}

    def test_release_updates_pages_and_preserves_host_experiences(self):
        backup = deploy.deploy(self.source, self.site)
        self.assertTrue(backup.is_file())
        self.assertEqual((self.site / 'index.html').read_bytes(), (self.source / 'index.html').read_bytes())
        for name, content in self.before.items():
            if deploy.protected(name) or name == 'private-host-page.html':
                self.assertEqual((self.site / name).read_bytes(), content)
        self.assertEqual((self.site / 'project-battle-chess.html').read_bytes(), (self.source / 'project-battle-chess.html').read_bytes())
        for name in deploy.THEME_SHELL_FILES:
            self.assertEqual((self.site / name).read_bytes(), (self.source / name).read_bytes())
        self.assertEqual((self.site / 'geometric-lab/math.js').read_text(), 'host lab calculations')

    def test_new_scene_directories_are_web_readable_with_restrictive_umask(self):
        import os
        previous = os.umask(0o077)
        original_chmod = Path.chmod
        try:
            with patch.object(Path, 'chmod', autospec=True, side_effect=original_chmod) as chmod:
                deploy.deploy(self.source, self.site)
        finally:
            os.umask(previous)
        self.assertIn(((self.site / 'assets/scenes', 0o755), {}), chmod.call_args_list)
        self.assertIn(((self.site / 'assets/scenes/.webb-cosmic-cliffs.webp.deploying', 0o644), {}), chmod.call_args_list)
        installed = self.site / 'assets/scenes/webb-cosmic-cliffs.webp'
        self.assertEqual(installed.read_bytes(), (self.source / 'assets/scenes/webb-cosmic-cliffs.webp').read_bytes())
        if os.name != 'nt':
            self.assertEqual((self.site / 'assets/scenes').stat().st_mode & 0o777, 0o755)
            self.assertEqual(installed.stat().st_mode & 0o777, 0o644)

    def test_failed_public_verification_restores_every_original_and_removes_new_files(self):
        def failed_check():
            self.assertTrue((self.site / 'quantum-cube.js').exists())
            raise RuntimeError('Public HTTP verification failed')
        with self.assertRaisesRegex(RuntimeError, 'Public HTTP'):
            deploy.deploy(self.source, self.site, failed_check)
        self.assertEqual(self.snapshot(), self.before)

    def test_interrupted_copy_rolls_back_partial_install(self):
        real_copy = deploy.copy_file
        def interrupted(source, target):
            if source.name == 'index.html':
                raise OSError('Simulated write failure')
            real_copy(source, target)
        with patch.object(deploy, 'copy_file', interrupted), self.assertRaises(OSError):
            deploy.deploy(self.source, self.site)
        self.assertEqual(self.snapshot(), self.before)

    def test_incomplete_release_changes_nothing(self):
        (self.source / 'quantum-cube.js').unlink()
        with self.assertRaisesRegex(RuntimeError, 'Incomplete release'):
            deploy.deploy(self.source, self.site)
        self.assertEqual(self.snapshot(), self.before)

    def test_destination_escape_changes_nothing(self):
        external = self.root / 'outside.js'
        self.write(external, 'outside')
        before = self.snapshot()
        # Exercise the escape guard on every platform, independent of symlink privilege.
        original_resolve = Path.resolve
        target = self.site / 'quantum-cube.js'
        def resolved(path, *args, **kwargs):
            return external if path == target else original_resolve(path, *args, **kwargs)
        with patch.object(Path, 'resolve', autospec=True, side_effect=resolved):
            with self.assertRaisesRegex(RuntimeError, 'outside public_html'):
                deploy.deploy(self.source, self.site)
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(external.read_text(), 'outside')

    def test_real_symlink_escape_changes_nothing(self):
        external = self.root / 'outside.js'
        self.write(external, 'outside')
        try:
            (self.site / 'quantum-cube.js').symlink_to(external)
        except OSError as error:
            if getattr(error, 'winerror', None) == 1314:
                self.skipTest('Windows lacks symlink privilege; portable escape-policy test still runs')
            raise
        before = self.snapshot()
        with self.assertRaisesRegex(RuntimeError, 'outside public_html'):
            deploy.deploy(self.source, self.site)
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(external.read_text(), 'outside')


if __name__ == '__main__':
    unittest.main()
