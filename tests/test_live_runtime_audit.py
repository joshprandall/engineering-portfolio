"""Offline contract tests for the read-only live-byte auditor."""
import importlib.util
import io
from pathlib import Path
import unittest
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location('audit', Path(__file__).parents[1] / 'tools/audit_live_runtime.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class Response(io.BytesIO):
    status = 200
    url = 'https://example.test/site/page.js'
    headers = {'Content-Type': 'application/javascript'}


class LiveRuntimeAuditTest(unittest.TestCase):
    def compare(self, source=b'content\n', live=b'content\n', **kwargs):
        def open_response(request, timeout):
            self.assertEqual(request.get_method(), 'GET')
            self.assertEqual(request.full_url, 'https://example.test/site/page.js')
            self.assertEqual(timeout, 20)
            return Response(live)
        return audit.compare_file('page.js', source, 'https://example.test/site/', opener=open_response, **kwargs)

    def test_exact_match_uses_get_only(self):
        row = self.compare()
        self.assertTrue(row['matches'])
        self.assertEqual(row['liveBytes'], 8)

    def test_line_ending_difference_is_not_hidden(self):
        self.assertFalse(self.compare(live=b'content\r\n')['matches'])

    def test_limit_is_inclusive_and_overflow_has_no_success_hash(self):
        self.assertTrue(self.compare(source=b'ab', live=b'ab', max_bytes=2)['matches'])
        row = self.compare(live=b'abc', max_bytes=2)
        self.assertIn('byte limit', row['error'])
        self.assertNotIn('matches', row)
        self.assertNotIn('liveSha256', row)

    def test_missing_host_file_is_error_not_match(self):
        def missing(request, timeout):
            raise HTTPError(request.full_url, 404, 'Not Found', {}, None)
        row = audit.compare_file('page.js', b'', 'https://example.test/site/', opener=missing)
        self.assertEqual(row['status'], 404)
        self.assertNotIn('matches', row)

    def test_cross_host_redirect_cannot_establish_parity(self):
        def redirect(request, timeout):
            response = Response(b'content\n')
            response.url = 'https://login.test/page.js'
            return response
        row = audit.compare_file('page.js', b'content\n', 'https://example.test/site/', opener=redirect)
        self.assertIn('different host', row['error'])
        self.assertNotIn('matches', row)

    def test_network_error_is_distinct_from_a_byte_mismatch(self):
        def unavailable(request, timeout):
            raise OSError('offline')
        row = audit.compare_file('page.js', b'', 'https://example.test/site/', opener=unavailable)
        self.assertEqual(row['error'], 'offline')
        self.assertNotIn('matches', row)

    def test_inventory_is_sorted_deduplicated_and_text_only(self):
        manifest = {'files': [{'path': p} for p in ['z.js', 'a.html', 'x.mp4', 'data.json', 'z.js', 'lib/app.mjs']]}
        self.assertEqual(audit.manifest_paths(manifest), ['a.html', 'lib/app.mjs', 'z.js'])

    def test_inventory_rejects_ambiguous_or_escaping_paths(self):
        for name in ['../outside.js', '/absolute.js', 'a/../b.js', 'a\\b.js', 'C:/file.js', './a.js', 'a//b.js', '', None, 42]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                audit.manifest_paths({'files': [{'path': name}]})


if __name__ == '__main__':
    unittest.main()
