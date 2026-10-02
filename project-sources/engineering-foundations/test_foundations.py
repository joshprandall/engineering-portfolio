import math
import sqlite3
import unittest
import foundations as f


class FoundationTests(unittest.TestCase):
    def test_prefix_boundaries(self):
        self.assertEqual(f.prefix()['network'], '192.168.10.64/26')
        self.assertEqual(f.prefix()['usable'], 62)
        for bits, count in [(0, 2**32-2), (31, 2), (32, 1)]:
            self.assertEqual(f.prefix('192.0.2.0', bits)['usable'], count)
        for address in ('10..0.1', '256.0.0.0', '010.0.0.1'):
            with self.assertRaises(ValueError): f.prefix(address)

    def test_eigen_residual(self):
        self.assertEqual(f.eigen()['residual'], 0)
        self.assertEqual(f.eigen(vector=(1, -1), eigenvalue=1)['residual'], 0)
        self.assertAlmostEqual(f.eigen(vector=(1, -1))['residual'], math.sqrt(8))
        with self.assertRaises(ValueError): f.eigen(vector=(0, 0))

    def test_bayes(self):
        self.assertAlmostEqual(f.bayes()['posterior'], 90/585)
        with self.assertRaises(ValueError): f.bayes(0, 1, 0)

    def test_qubit_and_bell(self):
        self.assertAlmostEqual(f.qubit()['y_plus'], 1)
        self.assertAlmostEqual(f.qubit(90, 0)['x_plus'], 1)
        for basis, expected in [('X', 1), ('Y', -1), ('Z', 1)]:
            out = f.bell(basis=basis)
            self.assertEqual(out['correlation'], expected)
            self.assertEqual(sum(out['probabilities']), 1)
        self.assertEqual(f.bell(0)['purity'], .5)

    def test_recovery_and_budget(self):
        self.assertFalse(f.recovery()['demonstrated'])
        self.assertTrue(f.recovery(age=15)['demonstrated'])
        self.assertFalse(f.recovery(age=15, validation='not tested')['demonstrated'])
        self.assertAlmostEqual(f.slo()['allowed_bad'], 1000)
        self.assertAlmostEqual(f.slo()['consumed_percent'], 150)
        self.assertIsNone(f.slo(100)['consumed_percent'])

    def test_transaction_rollback_replay_and_conflict(self):
        rows = [dict(id='A1', owner='Operations', count=3), dict(id='A2', owner='Research', count=0)]
        db = f.database()
        self.addCleanup(db.close)
        with self.assertRaises(RuntimeError): f.ingest(db, 'batch-1', rows, fail_after=1)
        self.assertEqual(db.execute('SELECT COUNT(*) FROM inventory').fetchone()[0], 0)
        self.assertEqual(db.execute('SELECT COUNT(*) FROM requests').fetchone()[0], 0)
        self.assertEqual(f.ingest(db, 'batch-1', rows)['inserted'], 2)
        self.assertTrue(f.ingest(db, 'batch-1', rows)['replay'])
        with self.assertRaises(ValueError): f.ingest(db, 'batch-1', rows[:1])
        with self.assertRaises(sqlite3.IntegrityError): f.ingest(db, 'batch-2', rows)
        self.assertEqual(db.execute('SELECT COUNT(*) FROM requests').fetchone()[0], 1)
        with self.assertRaises(ValueError): f.ingest(db, 'bad', [dict(id='B', owner='IT', count=True)])


if __name__ == '__main__': unittest.main()
