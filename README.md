# Joshua Randall engineering portfolio

[![Site validation](https://github.com/joshprandall/engineering-portfolio/actions/workflows/validate.yml/badge.svg)](https://github.com/joshprandall/engineering-portfolio/actions/workflows/validate.yml)

This repository is the final static portfolio release for Joshua Randall. It combines the current portfolio layout with the project work that belongs in the portfolio: systems engineering, automation, knowledge tools, interactive computing labs, agent workflow design, browser games, and the supporting source notes.

Live portfolio target: https://web.engr.oregonstate.edu/~randjosh/

## Included project work

- Recovery Readiness Auditor
- Infrastructure Dependency Analyzer
- Employee Lifecycle Toolkit
- Asset Inventory Reconciler
- Kubernetes Operations Lab
- Engineering Portfolio site and accessibility validation workflow
- One qubit. Two outcomes.
- Cloud & Systems Knowledge Library, including the advanced-computing learning track
- Geometry & Physics Lab: curvature, diffusion, Bayesian inference, and research provenance
- Quantum Phase Estimation browser lab
- Emergent Systems Explorer: seeded graph dynamics and Kuramoto oscillators
- Project MIND Agent Workbench: deterministic planning, evidence, verification, and dry-run execution
- Crown & Ash — 3D Battle Chess
- Defeat the Evil Wizard browser build and source link
- Providing Energy from Fusion coursework presentation

The release keeps research claims scoped to what the included experiments actually demonstrate. Recorded numerical outputs are labeled as recorded outputs, illustrative noise is labeled as an illustrative model, and the agent workbench is local and deterministic.

## Working routes

- `index.html` — portfolio home
- `projects.html` — searchable/filterable project catalog
- `learn.html` and `learn-*.html` — knowledge library and learning views
- `geometric-lab/` — standalone geometry and physics lab
- `project-qpe.html` — phase-estimation experiment
- `project-emergent.html` — seeded network explorer
- `agent-workbench.html` — Project MIND workflow lab
- `project-battle-chess.html` — playable chess route
- `play-evil-wizard.html` — playable action-game route
- `qubit-preview-20260921/` — single-qubit interactive

## Local validation

```sh
npm test
node --check app.js
node --check agent-workbench.js
node --check labs/qpe.js
node --check labs/emergent.js
```

The static test checks required files, duplicate IDs, local references, skip links, landmarks, safe external links, project-card metadata, and the visible project count. Browser smoke tests cover the responsive home/project routes and the interactive geometry, phase-estimation, network, agent, chess, and qubit experiences.

The standalone project sources are kept under `project-sources/` so each interactive project has a readable source trail and validation notes. The small browser demos in `demos/` are the portfolio-facing examples for the asset and dependency projects.

## Run locally

No package installation is required for the static portfolio. Serve this directory from its repository root so module scripts, data files, and the standalone games resolve correctly:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

This is a plain static site. Copy the repository contents to the web root while preserving directory names and files. The expected OSU Engineering layout is documented in [DEPLOYMENT.md](DEPLOYMENT.md). Do not open individual HTML files from a file browser when validating the learning library or interactive labs; use a local HTTP server or the hosted web root.

## Boundaries

The repository contains public portfolio material only. It does not contain credentials, private employer systems, customer data, infrastructure secrets, or production configuration.
