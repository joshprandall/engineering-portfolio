# Credits and contributions

## Original research and pretrained software

Blaine Quackenbush and Paul J. Atzberger developed the Geometric Neural Operators research underlying the pretrained-model demonstrations. Credit for the GNP methodology, upstream implementation, and pretrained models belongs to them and the contributors identified in their repository.

- Quackenbush, Blaine, and Paul J. Atzberger. Geometric Neural Operators (2024). https://doi.org/10.1088/2632-2153/ad8980 — open manuscript: https://arxiv.org/abs/2404.10843
- Quackenbush, Blaine, and Paul J. Atzberger. Transferable Foundation Models for Geometric Tasks on Point Cloud Representations: Geometric Neural Operators (2025). https://doi.org/10.1088/2632-2153/ae1bf8 — open manuscript: https://arxiv.org/abs/2503.04649
- Quackenbush, Blaine, and Paul J. Atzberger. Extending Neural Operators: Robust Handling of Functions Beyond the Training Set (2026 preprint). https://arxiv.org/abs/2603.03621
- geo_neural_op source and pretrained weights: https://github.com/atzberg/geo_neural_op — GNU GPL version 3. Revision used: 4ba306ac20f5674b773a8ba980aabeef33ed5385. The software and weights are installed separately, not redistributed in this website package.

The six recorded neural prediction sets were computed using these upstream pretrained models. Their provenance, model names, weight hashes, inputs, and evaluation conditions accompany the data. Attribution of the website does not transfer authorship of the neural models or their predictions to the website developer.

## Contextual geometry-AI literature

- Mridula Vijendran, Jingjing Deng, Shuang Chen, Edmond S. L. Ho, and Hubert P. H. Shum. *Artificial Intelligence for Geometry-Based Feature Extraction, Analysis and Synthesis in Artistic Images: A Survey* (Artificial Intelligence Review 58, 64, 2025). https://doi.org/10.1007/s10462-024-11051-3 — open manuscript: https://arxiv.org/abs/2412.01450

This survey is cited as broader context for explicit geometric representations in AI. The Geometry Lab does not claim to reproduce its surveyed artistic-image extraction, classification, or synthesis systems.

## Website adaptation and completed enhancements — Joshua Randall

Website adaptation, implementation, and enhancements by Joshua Randall:

- Interactive 3D point-cloud viewer with pointer and keyboard controls.
- Responsive navigation, light/dark themes, and accessible text explanations.
- Live second-order local polynomial geometry estimator exposing Gaussian curvature, mean-curvature magnitude, principal-curvature magnitudes, fit residuals, and neighborhood scale.
- Point-level scientific inspector for interrogating local geometry and model error rather than relying on color maps alone.
- Six-case GNP evaluation presentation with MAE, RMSE, bias, tail-error measurements, runtime metadata, and reproducibility records.
- Interactive exact sphere-diffusion demonstration.
- Gauss–Bonnet global-topology validation experiment with explicit surface quadrature.
- Exact spherical Laplace–Beltrami spectral-mode explorer with eigenvalue and multiplicity checks.
- Exact shrinking-sphere mean-curvature-flow validation trajectory.
- Bayesian sphere-radius inference demonstration and posterior visualization.
- Point-cloud import/export and local experiment notebook.
- Companion Python workflow for generating and importing new GNP predictions.
- Guided experiments, scientific scope notes, integration instructions, and validation checks.

These are completed application and educational enhancements. The underlying curvature identities, PCA, weighted least squares, Gauss–Bonnet theorem, spherical harmonics, Laplace–Beltrami spectrum, mean-curvature flow, heat equation, and Bayesian inference are established mathematics. This project does not claim their invention, a new GNP architecture, or a demonstrated improvement to the authors' pretrained models. Comparative results are reported as measured, including the case where the conventional fit performed better.

## Licensing

Copyright © 2026 Joshua Randall for the original website implementation, companion scripts, and original explanatory material in this package, distributed under the included MIT license. External research, software, and pretrained weights retain their own authorship and license terms. The MIT license does not relicense the authors' papers or GPL-3.0 software and weights.
