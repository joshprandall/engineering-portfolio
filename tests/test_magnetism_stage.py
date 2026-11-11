"""Review-only academic release artifact tests; do not connect to OSU."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("magnetism_stage", ROOT / "tools" / "build_magnetism_stage.py")
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)

class AcademicStagingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.archive = Path(cls.temp.name) / "magnetism-review.zip"
        stage.build(cls.archive)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_only_reviewed_magnetism_file_permitted(self):
        self.assertEqual(stage.check_policy(), ROOT / "deep-learning/physics/magnetism.json")
        for name in ("index.html", "resume.html", "solar-navigation.js",
                     "assets/audio/day/beach-near.ogg", "../index.html",
                     "deep-learning/math/linear-algebra.json"):
            with self.subTest(name=name):
                with self.assertRaises(ValueError):
                    stage.check_policy(name)

    def test_stage_contains_exactly_two_known_members(self):
        with ZipFile(self.archive) as zip_:
            self.assertEqual(sorted(zip_.namelist()), sorted((stage.CONTENT_PATH, stage.MANIFEST)))
            self.assertNotIn("CONTENT_ONLY_MANIFEST.json", zip_.namelist())
            self.assertNotIn("index.html", zip_.namelist())

    def test_verifies_own_sha_and_original_content(self):
        stage.verify(self.archive)
        with ZipFile(self.archive) as zip_:
            metadata = json.loads(zip_.read(stage.MANIFEST))
        self.assertEqual(metadata["kind"], "ACADEMIC_ONE_FILE_REVIEW_ONLY_NOT_DEPLOYED")
        self.assertEqual(metadata["records"], 97)
        self.assertEqual(len(metadata["authored_lesson_ids"]), 12)

    def test_older_public_hash_is_preflight_reference_not_new_file_hash(self):
        with ZipFile(self.archive) as zip_:
            metadata = json.loads(zip_.read(stage.MANIFEST))
        old = metadata["observed_live_before_staging"]
        self.assertEqual(old["sha256"], stage.OBSERVED_LIVE_SHA256)
        self.assertEqual(old["bytes"], stage.OBSERVED_LIVE_BYTES)
        self.assertNotEqual(metadata["sha256"], old["sha256"])
        self.assertIn("recheck", metadata["deployment_gate"])

    def test_stage_rejects_modified_data_even_if_filename_unchanged(self):
        with ZipFile(self.archive) as source, tempfile.TemporaryDirectory() as directory:
            file_ = Path(directory) / "tampered.zip"
            with ZipFile(file_, "w") as bad:
                for name in source.namelist():
                    contents = source.read(name)
                    if name == stage.CONTENT_PATH:
                        contents += b"\n "
                    bad.writestr(name, contents)
            with self.assertRaises(ValueError):
                stage.verify(file_)

    def test_stage_rejects_extra_protected_member(self):
        with ZipFile(self.archive) as source, tempfile.TemporaryDirectory() as directory:
            file_ = Path(directory) / "forbidden.zip"
            with ZipFile(file_, "w") as bad:
                for name in source.namelist():
                    bad.writestr(name, source.read(name))
                bad.writestr("index.html", b"not allowed")
            with self.assertRaises(ValueError):
                stage.verify(file_)

    def test_stage_rejects_manifest_kind_mutation(self):
        with ZipFile(self.archive) as source, tempfile.TemporaryDirectory() as directory:
            file_ = Path(directory) / "wrong-kind.zip"
            with ZipFile(file_, "w") as bad:
                for name in source.namelist():
                    contents = source.read(name)
                    if name == stage.MANIFEST:
                        info = json.loads(contents)
                        info["kind"] = "DEPLOYED"
                        contents = json.dumps(info).encode("utf-8")
                    bad.writestr(name, contents)
            with self.assertRaises(ValueError):
                stage.verify(file_)

if __name__ == "__main__":
    unittest.main()
