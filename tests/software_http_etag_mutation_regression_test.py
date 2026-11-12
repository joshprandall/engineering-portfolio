"""Offline HTTP validator regression against the existing synthetic loopback origin.

Run from the repository root:
    python tests/software_http_etag_mutation_regression_test.py

The first GET captures a strong entity tag. A subsequent PUT changes the
selected representation's bytes. Revalidating against the old tag must then
return the new 200 representation, not a misleading 304. This checks only
the teaching fixture; it does not contact external systems or test a live API.

RFC 9110 sections 8.8.1, 8.8.3 and 13.1.2:
https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.1
https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.2
"""
import json
import unittest

import software_http_loopback_integration_test as fixture


class ValidatorMutationRegression(fixture.LoopbackHTTP):
    def test_put_invalidates_prior_strong_validator(self):
        original_status, original_body, original_headers = self.send(
            "GET", "/resource"
        )
        self.assertEqual(200, original_status)
        self.assertEqual({"x": 1, "y": 2}, json.loads(original_body))
        old_tag = original_headers["ETag"]
        self.assertTrue(old_tag.startswith('"') and old_tag.endswith('"'))
        self.assertFalse(old_tag.startswith('W/'))

        put_status, put_body, _ = self.send(
            "PUT", "/resource", {"x": 4}
        )
        self.assertEqual((204, b""), (put_status, put_body))

        new_status, new_body, new_headers = self.send(
            "GET", "/resource", headers={"If-None-Match": old_tag}
        )
        self.assertEqual(
            200, new_status,
            "A 304 would incorrectly validate a pre-PUT cached representation."
        )
        self.assertEqual({"x": 4}, json.loads(new_body))
        self.assertNotEqual(
            old_tag, new_headers.get("ETag"),
            "A strong ETag must change when the selected representation changes."
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
