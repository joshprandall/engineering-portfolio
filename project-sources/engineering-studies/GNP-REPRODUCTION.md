# Recorded audit and optional new inference

The main notebook audits the six unchanged recorded runs. Their exact-normal
input gives GNP information that the PCA-based baseline does not receive. The
fixture preserves that limitation and the historical weights/timing metadata.

For new inference, obtain the upstream repository separately and check out
`4ba306ac20f5674b773a8ba980aabeef33ed5385`. Follow that revision's README to create
its Python 3.12 / Torch 2.6 CPU environment, including compatible torch-scatter and
torch-cluster dependencies. Read its GPL-3.0 license. This package does not install
those dependencies automatically or bundle the model weights.

The optional `run_gnp.py` adapter accepts an NPZ file containing `points` and
`normals` arrays of equal shape (N,3), checks a supplied upstream checkout and
the selected weight hash, performs Gaussian-curvature inference on the CPU, and
writes an output JSON only to the path explicitly supplied by the caller. Its
`--validate-only` path checks inputs without importing Torch or GNP.

```sh
python run_gnp.py input.npz output.json --upstream /path/to/pinned/geo_neural_op --validate-only
python run_gnp.py input.npz output.json --upstream /path/to/pinned/geo_neural_op --model clean_30k
```

Normal estimation is the caller's declared responsibility. To study fairness,
compare exact-normal and estimated-normal cases using the same points and metric.
The adapter's input validation is tested here; a new pretrained inference run is
not included in the recorded acceptance evidence. Its upstream API was checked
against the pinned `gnp/estimator.py`, not inferred from current documentation.
