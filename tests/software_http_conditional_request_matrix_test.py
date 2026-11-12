"""Offline wire-level falsification cases for the fictional HTTP origin.

I use the unmodified loopback fixture from software_http_loopback_integration_test.py
and assert exact conditional-request behavior specified by RFC 9110 §13.1.2.
The test is intentionally RED against the current teaching fixture; it is
not a statement about any live API or a production conformance suite.

Run from repository root:
    python -m unittest discover -s tests -p software_http_conditional_request_matrix_test.py -v

References:
https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.2
https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.1
"""
import http.server
import json
import threading
import unittest

import software_http_loopback_integration_test as fixture


class ConditionalRequestMatrix(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), fixture.FixtureOrigin)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_address[1]

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=3)

    def setUp(self):
        self.server.resource = {"x": 1, "y": 2}
        self.server.etag = '"v1"'
        self.server.orders = []
        self.server.keys = {}

    def send(self, method, path="/resource", body=None, headers=None):
        return fixture.LoopbackHTTP.send(self, method, path, body, headers)

    def test_control_matching_strong_tag_returns_304(self):
        status, body, _ = self.send("GET", headers={"If-None-Match": '"v1"'})
        self.assertEqual((304, b""), (status, body))

    def test_control_unmatched_tag_returns_current_representation(self):
        status, body, _ = self.send("GET", headers={"If-None-Match": '"absent"'})
        self.assertEqual(200, status)
        self.assertEqual({"x": 1, "y": 2}, json.loads(body))

    def test_weak_tag_matches_strong_validator_on_get(self):
        status, body, _ = self.send("GET", headers={"If-None-Match": 'W/"v1"'})
        self.assertEqual((304, b""), (status, body))

    def test_tag_list_matches_any_current_validator(self):
        status, body, _ = self.send(
            "GET", headers={"If-None-Match": '"old", W/"v1", "other"'}
        )
        self.assertEqual((304, b""), (status, body))

    def test_wildcard_matches_existing_resource(self):
        status, body, _ = self.send("GET", headers={"If-None-Match": "*"})
        self.assertEqual((304, b""), (status, body))

    def test_head_weak_validator_returns_304_without_body(self):
        status, body, _ = self.send("HEAD", headers={"If-None-Match": 'W/"v1"'})
        self.assertEqual((304, b""), (status, body))

    def test_changed_put_representation_invalidates_strong_etag(self):
        status, original, metadata = self.send("GET")
        self.assertEqual(200, status)
        self.assertEqual({"x": 1, "y": 2}, json.loads(original))
        previous_tag = metadata["ETag"]
        self.assertFalse(previous_tag.startswith("W/"))
        put_status, put_body, _ = self.send("PUT", body={"x": 4})
        self.assertEqual((204, b""), (put_status, put_body))
        status, updated, metadata = self.send(
            "GET", headers={"If-None-Match": previous_tag}
        )
        self.assertEqual(200, status, "Stale strong validator must not return 304")
        self.assertEqual({"x": 4}, json.loads(updated))
        self.assertNotEqual(previous_tag, metadata.get("ETag"))

    def test_put_with_if_none_match_star_must_not_overwrite_existing_resource(self):
        status, body, _ = self.send("PUT", body={"x": 4}, headers={"If-None-Match": "*"})
        self.assertEqual((412, b""), (status, body))
        status, body, _ = self.send("GET")
        self.assertEqual(200, status)
        self.assertEqual({"x": 1, "y": 2}, json.loads(body))


if __name__ == "__main__":
    unittest.main(verbosity=2)
