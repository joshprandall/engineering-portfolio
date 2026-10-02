import contextlib
import io
import itertools
import json
import math
from pathlib import Path
import unittest
import tempfile
import numpy as np
import ai_models as ai
import quantum_models as q
import systems_models as s
import extensions as e


class StudyTests(unittest.TestCase):
    def test_all_authored_cases(self):
        units=json.loads((Path(__file__).parent/'units.json').read_text())
        self.assertEqual(len(units),41)
        for unit in units:
            with self.subTest(unit=unit['id']),contextlib.redirect_stdout(io.StringIO()):
                exec(unit['code'],{'m':__import__(unit['module']),'math':math})

    def test_symmetry_and_causality(self):
        for p in itertools.permutations(range(3)):
            self.assertLess(ai.gnn(p)['permutation_residual'],1e-12)
        for angle in (0,.3,1.,math.pi):
            self.assertLess(ai.egnn(angle)['equivariance_residual'],1e-12)
        self.assertEqual(ai.attention(-100)['earlier_token_change'],0)

    def test_no_evidence_and_denied_effects(self):
        self.assertEqual(ai.retrieval('xyzzy')['retrieved'],[])
        with self.assertRaises(PermissionError):ai.agent(allowed=False)
        with self.assertRaises(ValueError):ai.agent(conflicting_retry=True)
        self.assertEqual(ai.mind(True)['status'],'blocked')

    def test_quantum_boundaries(self):
        for gamma in (0,.3,1):
            result=q.density(gamma)
            self.assertAlmostEqual(result['trace'],1)
            self.assertGreaterEqual(min(result['eigenvalues']),-1e-12)
        for bits in (2,3,4):
            for integer in range(2**bits):
                result=q.qpe(integer/(2**bits),bits)
                self.assertAlmostEqual(result['probabilities'][integer],1)
        for probability in (0,.1,.5,1):
            result=q.repetition(probability)
            self.assertAlmostEqual(result['logical_bit_error'],3*probability**2-2*probability**3)
        for call in (lambda:q.density(-.1),lambda:q.grover(marked=20),lambda:q.hardware(t2=201)):
            with self.assertRaises(ValueError):call()

    def test_recorded_geometry_metric_consistency(self):
        data=json.loads((Path(__file__).parent/'fixtures/gnp-recorded.json').read_text())
        for case,row in zip(data['cases'],s.gnp_audit()['rows']):
            self.assertAlmostEqual(row['gnp_mae'],case['gnp_mae'],places=6)
            self.assertAlmostEqual(row['baseline_mae'],case['baseline_mae'],places=6)

    def test_numerical_and_operational_edges(self):
        self.assertLess(s.kuramoto(dt=.01)['phase_rms_difference'],s.kuramoto(dt=.02)['phase_rms_difference'])
        self.assertFalse(s.kubernetes(started=False,ready=True)['eligible_endpoint'])
        self.assertEqual(s.constraint(capacity=0)['objective'],0)
        with self.assertRaises(ValueError):e.robot(3,0)
        self.assertFalse(e.personal(consent=True,now=20)['stored'])
        for bits in (2,4,8):
            result=e.quantization(bits)
            self.assertLessEqual(result['maximum_error'],result['half_step']+1e-12)

    def test_optional_gnp_adapter_input_boundary(self):
        from run_gnp import load_input
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'points.npz'
            points=np.ones((32,3));normals=np.tile([0.,0.,2.],(32,1))
            np.savez(path,points=points,normals=normals)
            loaded,unit=load_input(path)
            self.assertEqual(loaded.shape,(32,3))
            self.assertTrue(np.allclose(np.linalg.norm(unit,axis=1),1))
            np.savez(path,points=points,normals=np.zeros_like(points))
            with self.assertRaises(ValueError):load_input(path)


if __name__=='__main__':unittest.main()
