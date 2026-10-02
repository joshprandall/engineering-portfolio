# Engineering studies — content releases 3.2 through 3.6

This package adds 41 executable, bounded study companions to the existing AI,
quantum, Geometry project, systems and security pages. Together with the separate
eight-unit foundation package, it supports the authored 32-unit sequence and 17
extensions. `units.json` is the human-authored teaching source; `notebooks/` holds
the corresponding notebooks. The implementation modules expose small functions
that can be inspected and changed independently.

## Reproduce

Use Python 3.12 and install `requirements.txt` in an isolated environment:

```sh
python -m venv .venv
# Activate that environment using the command appropriate to your shell.
python -m pip install -r requirements.txt
python -m unittest discover -p 'test_*.py'
```

Open a notebook in Jupyter and run cells from top to bottom. Kernel restart resets
state. The models run on a CPU without credentials, network calls, a GPU, a model
API, or downloaded weights. SQLite fixtures use in-memory databases only.
`expected-results.json` records actual default outputs under Python 3.12 and
NumPy 2.3.5; assertions use tolerances where floating-point values can vary.

Each notebook contains a derivation or mechanism explanation, model table,
numerical prediction, executable assertions, perturbation task, explained
self-check and primary references. The code and documentation explicitly label
fixed weights, fictional inputs, exact probabilities, historical results and
omitted mechanisms. A worked toy is not silently presented as a trained production
system, complete quantum algorithm or device experiment.

## Optional environments

`mpi_sum.py` is a separate real MPI collective example. Install a compatible MPI
implementation and mpi4py, then run `mpiexec -n 4 python mpi_sum.py`. The main HPC
notebook is a sequential rank simulation, so its successful run is not evidence
that an MPI environment was tested.

The GNP audit recomputes metrics from six previously recorded arrays; it does not
load weights. `fixtures/gnp-recorded.json` is copied from the unchanged portfolio
benchmark at baseline commit `e31cdd9efe0007159d4dd130e9bd5d5d9a7bb41e`, retaining
the upstream revision, weight hashes, authors, information asymmetry and timing
definition. See `GNP-REPRODUCTION.md` for the separately scoped inference path.

Jupyter kernel execution, browser interaction, optional MPI, optional new GNP
inference, physical-device behavior and production deployment are separate
validation states. See the repository's `docs/CONTENT-RELEASES.md` for recorded
acceptance evidence. Do not read a missing optional runtime as a passing test.

## Integration rubric

Retain the input, predicted value, result, tolerance, failed/perturbed case,
interpretation and one claim-specific source locator. State at least one result
the model cannot establish. For research extensions, identify which new data,
implementation or controlled comparison would be required to support the claim.

`SHA256SUMS` identifies the package payload. `references.bib` is the bibliography;
source texts, third-party code, model weights and media are not bundled.
