# Engineering foundations — content release 3.1

Eight small experiments accompany the eight existing lesson IDs listed in
`lessons.json`. The browser calculators and this Python implementation are
independent implementations of the same stated models. No production service,
quantum device, network, or external dataset is contacted.

## Run

Python 3.10 or newer is sufficient for the source and tests:

```sh
python foundations.py
python -m unittest discover -p 'test_*.py'
```

Open `notebooks/prefix.ipynb` first, or choose a notebook by the experiment name
in `lessons.json`. To use Jupyter locally, create an environment and install the
optional notebook dependencies in `requirements-notebooks.txt`. The experiment
code itself uses only the Python standard library. Run cells from top to bottom;
restart the kernel to reset all state. The ingestion notebook creates only an
in-memory SQLite database and explicitly closes it.

The notebooks contain explanations, worked predictions, assertions, a deliberate
failure or perturbation, integration questions, and primary-source links. The
reference values are documented in `expected-results.json`; rounded displays are
not exact equality claims. Numerical comparisons use a stated tolerance.

## Interpret results

- Prefix counts distinguish conventional broadcast subnets, point-to-point /31,
  and a /32 address. They do not include provider reservations.
- Eigenvector residuals test one proposed pair for a 2 by 2 real matrix.
- Bayes uses fictional, known detector rates and expected counts.
- Qubit/Bell calculations are ideal probabilities, not measured device data.
- Recovery targets and SLOs are fictional requirements, not observed portfolio
  service guarantees. An SLO request budget is not a downtime allowance.
- Ingestion tests atomic transactions, injected failure, and idempotency. Its
  single-process, in-memory fixture is not a production ingestion service.

`lessons.json` gives exact lesson boundaries, assumptions, and integration tasks.
Completing a notebook or quiz does not certify operational readiness. For the
capstone, retain your predictions, exported results, failed case, interpretation,
and a short explanation of what the model cannot establish.

## Provenance

Authoring baseline: portfolio commit
`e31cdd9efe0007159d4dd130e9bd5d5d9a7bb41e`.
Review date: 2026-10-02. This companion is new work added after that baseline.
`SHA256SUMS` identifies the exact package payload. `references.bib` lists
claim-specific references; a citation does not mean endorsement or permission
to redistribute the referenced text. No third-party source text, video, weights,
or dataset is bundled. See `LICENSE-NOTICE.md`.
