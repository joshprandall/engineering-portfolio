# Geometry & Scientific ML Lab — methods and scope

Version 2.0.0. Website adaptation and enhancements by Joshua Randall. Original GNP research and pretrained models by Blaine Quackenbush and Paul J. Atzberger. See [CREDITS.md](CREDITS.md) for the contribution record. All lengths and times are in arbitrary, mutually consistent units.

## Surface explorer

Built-in shapes are a unit sphere, torus (major radius 1.35, tube radius 0.5), and a finite saddle patch y = (x² − z²)/(2a). The size control scales every coordinate. Sphere points use a Fibonacci construction. Torus samples use an irrational angular progression around the major circle and evenly spaced cross-section angles; this is parameter-space sampling, not uniform area sampling. The saddle is sampled on a rectangular parameter grid. Coordinate noise is independent Gaussian noise with standard deviation `noise × size`. The seeded browser generator is deterministic. The analytic reference remains the clean-surface curvature at the original sampling locations; it is not curvature of a newly defined noisy surface.

Gaussian curvature:
- Sphere: K = 1/r².
- Torus: K = cos(v) / [r (R + r cos(v))].
- Saddle: K = −1 / [a² (1 + (x² + z²)/a²)²].

Baseline: for each point, the k nearest coordinates define a PCA frame. A fixed-size max heap retains the nearest candidates while scanning the point cloud, avoiding a full distance sort but retaining O(N²) distance evaluation over all query points. Project to the local frame, scale by neighborhood radius h, then fit z = c0 + c1 x + c2 y + c3 x² + c4 xy + c5 y² using weighted least squares. Weights are exp(−2(x²+y²)); a 1e−9 diagonal regularizer stabilizes the 6×6 system. From the fitted Monge patch the application computes Gaussian curvature K, signed mean curvature H, the two principal curvatures κ1 and κ2, an RMS fit residual, and the neighborhood radius. The UI exposes |H| and principal-curvature magnitudes because signed curvature depends on normal orientation. Built-in analytic surfaces provide an orientation reference; arbitrary imported point clouds do not. Missing fits are not silently converted into zero. This is an educational local polynomial baseline, not the upstream GNP or a state-of-the-art tuned competitor. Boundaries, poor sampling, duplicate points, high noise, and non-smooth surfaces are limitations. Imports remain capped at a deterministic 2,200-point sample for responsiveness.

The scale used to fit an object into the viewport changes only its visual framing. It does not change stored coordinates, computed values, or radius inference. Every view is individually framed; use the numeric radii rather than apparent on-screen diameter to compare sizes.

## Recorded GNP comparisons

Six actual inference runs: sphere and torus, each with coordinate noise σ = 0, 0.01, and 0.03. There are 1,200 points per case. The clean_30k model is used at zero noise and noise_70k for both noisy cases. Noise is generated with NumPy default_rng(42), independent across coordinates. Exact clean-surface normal orientations are passed to the GNP in all cases. This is extra geometric information compared with the PCA-based local fit, and may make these examples optimistic compared with real scans. The samples are controlled examples, not a statistically comprehensive benchmark or a reproduction of a paper's reported benchmark. No tuning or best-run selection was performed.

The upstream revision is 4ba306ac20f5674b773a8ba980aabeef33ed5385, package 2.0.0. The benchmark data includes SHA-256 hashes for weights, library versions, timing definitions, and all points, predictions, and reference values. Python predictions are rounded to seven decimals for the web bundle; the browser baseline is run on the bundled rounded input points. Errors shown in the application are recomputed from those bundled arrays. Runtime covers estimator setup, weight loading, patch construction, and quantity estimation on a CPU with two Torch threads. It excludes imports, the local baseline, and network download. Runtime is machine dependent.

Model selection loads saved outputs in a static webpage. Live browser surface calculations do not invoke the network. The separate run_gnp.py script produces new predictions locally and exports JSON that the website can read. No model weights or upstream implementation code are embedded in the web app. The 2026 paper's kernel extensions are described and linked, not implemented or validated here.

## Diffusion

Exact solution u(y,t) = 0.5 + 0.5(y/r) exp(−2Dt/r²) on a sphere of radius r. It solves the surface heat equation ∂u/∂t = D Δ_s u because y/r is a degree-one spherical harmonic with Laplacian eigenvalue −2/r². Surface average = 0.5. The initial field is restricted to this north–south pattern. There is no numerical time integration and no neural prediction in this tab. The decay timescale is r²/(2D). The animation time is illustrative, not physical seconds unless a consistent unit system is chosen.

## Gauss–Bonnet topology experiment

For a closed orientable surface, the experiment evaluates the Gauss–Bonnet identity

`∫_M K dA = 2πχ(M)`.

The sphere uses equal area weights `4πr²/N` on its Fibonacci samples. The torus uses the analytic area element `dA = r(R + r cos v) du dv`; with the v samples paired uniformly around the cross section, the analytic curvature quadrature cancels positive and negative contributions to floating-point accuracy. When the local-fit curvature field is selected, the same clean-surface area weights are retained deliberately. That isolates curvature-estimation error rather than mixing it with a second area-estimation problem. The inferred Euler characteristic `χ̂ = (∫K dA)/(2π)` is a numerical diagnostic, not a replacement for combinatorial topology.

## Spectral geometry experiment

The spectral tab is an exact spherical reference, not a numerical eigensolver. It visualizes the axisymmetric degree-ℓ spherical harmonic through the Legendre polynomial `P_ℓ(y/r)`. For a sphere of radius r,

`−Δ_S Y_ℓ^m = λ_ℓ Y_ℓ^m`, with `λ_ℓ = ℓ(ℓ+1)/r²`

and multiplicity `2ℓ+1`. Only the m = 0 / zonal representative is rendered; the full eigenspace contains rotated and non-axisymmetric combinations with the same eigenvalue. The weighted sample mean is shown as a finite-quadrature check; modes with ℓ > 0 have exact continuous surface mean zero.

## Mean-curvature-flow reference

The curvature-flow tab uses the exact shrinking-sphere solution under the convention `∂_t X = -2H n`, for which

`R(t)² = R₀² - 4t`

and the extinction time is `T = R₀²/4`. It reports current radius, area, and Gaussian curvature. This is an analytic validation trajectory for future numerical or learned flows; it does not run the pretrained GNP in the browser.

## Point inspection and quantitative error reporting

A click or tap without a drag selects the nearest visible point within a screen-space tolerance. The point inspector reports the actual stored sample coordinate and quantities appropriate to the active experiment. For live local geometry these include reference K when available, estimated K, |H|, principal-curvature magnitudes, fit RMS residual, and neighborhood radius. Recorded GNP comparisons expose reference K, GNP K, local-fit K, and absolute GNP error.

Where a reference field is available, error summaries include mean absolute error, root-mean-square error, signed bias, median absolute error, 95th-percentile absolute error, maximum absolute error, and Pearson correlation when both variances are nonzero. A constant reference field, such as sphere K, makes correlation undefined; the application reports no correlation rather than inventing one.

## Bayesian radius inference

Simulate K_i = 1/r_true² + ε_i, with independent ε_i ∼ Normal(0, σ²). The same seeded prefix is reused as the measurement count changes. Take new measurements changes the seed. The prior is uniform on radius [0.4, 2.5]; posterior probabilities are evaluated and normalized on 501 equally spaced radius points using shifted log likelihoods. The mean, maximum-a-posteriori estimate, and equal-tail 95% interval are computed from this discrete distribution. The chart peaks are scaled for readability; total probability is normalized in the stored arrays. This is an analytic sphere model, not the paper's general Bayesian manifold reconstruction method. Wrong likelihood, correlations, prior truncation, and grid resolution affect inference.

## Imports, notebook, privacy, and accessibility

Imports support plain XYZ, CSV (x,y,z header optional), OBJ vertex positions, and the documented GNP JSON schema. Triangle faces are not interpreted; this is a point-cloud tool. Imported references and GNP values are user-provided data; the browser validates their shape and numeric finiteness but cannot independently authenticate model provenance. The viewport may show only a deterministic 2,200-point sample. No cloud upload, telemetry, remote inference, CDN, or third-party runtime request is needed. The notebook is device-local browser storage. Export JSON for a durable copy; browser storage can be cleared or unavailable. Small device-storage limits may cause a direct JSON download instead of a notebook save.

Canvas rotation supports pointer dragging, arrow keys, plus/minus, and zoom buttons. Numerical values and explanations are also available as text. Animation is initially stopped. Scientific meaning is supported by values and labels, not color alone.

## Primary sources

- Vijendran, Deng, Chen, Ho & Shum, Artificial Intelligence for Geometry-Based Feature Extraction, Analysis and Synthesis in Artistic Images (2025): https://doi.org/10.1007/s10462-024-11051-3 ; manuscript https://arxiv.org/abs/2412.01450. Contextual survey; no image-analysis model from this paper is claimed as implemented here.
- Quackenbush & Atzberger, Geometric Neural Operators (2024): https://doi.org/10.1088/2632-2153/ad8980 ; manuscript https://arxiv.org/abs/2404.10843
- Transferable Foundation Models for Geometric Tasks on Point Cloud Representations (2025): https://doi.org/10.1088/2632-2153/ae1bf8 ; manuscript https://arxiv.org/abs/2503.04649
- Extending Neural Operators: Robust Handling of Functions Beyond the Training Set (2026 preprint): https://arxiv.org/abs/2603.03621
- Upstream software and pretrained weights: https://github.com/atzberg/geo_neural_op (GPL-3.0).
