# Joshua Randall | Engineering Portfolio

[![Site validation](https://github.com/joshprandall/engineering-portfolio/actions/workflows/validate.yml/badge.svg)](https://github.com/joshprandall/engineering-portfolio/actions/workflows/validate.yml)

I use this repository to build and document my engineering portfolio, interactive projects, and technical learning resources. My work spans systems and network engineering, software development, cybersecurity, mathematical modeling, physics, automation, and game development.

**Portfolio:** https://web.engr.oregonstate.edu/~randjosh/

## Engineering work

My portfolio includes projects that can be inspected, tested, and explored rather than just described:

- Recovery Readiness Auditor
- Infrastructure Dependency Analyzer
- Employee Lifecycle Toolkit
- Asset Inventory Reconciler
- Kubernetes Operations Lab
- Engineering Portfolio and accessibility validation workflow
- One qubit. Two outcomes.
- Cloud & Systems Knowledge Library and advanced-computing coursework
- Geometry & Physics Lab — curvature, diffusion, Bayesian inference, and research provenance
- Quantum Phase Estimation browser lab
- Emergent Systems Explorer — seeded graph dynamics and Kuramoto oscillators
- Project MIND Agent Workbench — deterministic planning, evidence, verification, and dry-run execution
- Crown & Ash — 3D Battle Chess
- Defeat the Evil Wizard — browser game and source reference
- Providing Energy from Fusion coursework presentation

My goal is to pair technical explanations with working software, measurable experiments, and reproducible tests. Where a project uses an illustrative model or recorded result, I distinguish that from a real-world measurement or a general scientific claim.

## Learning library

I'm expanding the learning sections into a structured collection of engineering and computer-science material. Lessons are being developed with prerequisites, substantive explanations, worked examples, practical exercises, and checks of the underlying reasoning.

University courses, research publications, textbooks, and standards are used as cited references where appropriate. The library is my independent educational work; external references do not imply institutional affiliation or academic credit.

## Site architecture and appearance

The published portfolio has an established visual design, solar-navigation experience, background scenes, audio, and interactive games. I preserve those features when improving technical or educational content.

`site-theme.js` initializes the shared `jr-site-theme` and `jr-site-motion` preferences before page styles. The implementation synchronizes preferences across open tabs, handles restored pages, and supports a session-storage fallback. Shared pages use `site-scenes.css`, deferred `site-scenes.js`, and `button[data-theme-toggle]`.

The night scene retains the credited Webb Cosmic Cliffs imagery. Daytime scenes use the existing waterfall, river, and beach videos. Audio and animation behavior respect saved preferences and reduced-motion settings.

For design and implementation details, see [protected baseline](docs/WEBSITE-2.0-PROTECTED-BASELINE.md), [audio ownership](docs/WEBSITE-2.0-AUDIO.md), and [authoring guide](docs/WEBSITE-2.0-AUTHORING.md).

## Interactive routes

| Route | Project |
| --- | --- |
| `index.html` | Portfolio home |
| `projects.html` | Searchable project catalog |
| `learn.html` and `learn-*.html` | Learning library |
| `geometric-lab/` | Geometry and physics experiments |
| `project-qpe.html` | Quantum phase-estimation experiment |
| `project-emergent.html` | Network dynamics explorer |
| `agent-workbench.html` | Project MIND workflow laboratory |
| `project-battle-chess.html` | Battle chess |
| `play-evil-wizard.html` | Action game |
| `qubit-preview-20260921/` | Single-qubit interactive |

Related project source and validation notes are organized under `project-sources/`; browser demonstrations for infrastructure and dependency projects are under `demos/`.

## Run and validate locally

From the repository root:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000`. Serving the files over HTTP is important for module scripts, JSON data, and the interactive projects.

My standard checks include:

```sh
npm test
node --check app.js
node --check agent-workbench.js
node --check labs/qpe.js
node --check labs/emergent.js
```

The validation suite covers structural integrity, local references, accessibility landmarks, external-link safety, project metadata, and browser behavior. A passing individual test is not a substitute for full-site validation.

## Deployment and change control

The live website is hosted through Oregon State University Engineering. I use scoped, backup-first deployment procedures and verify the actual published assets rather than assuming the repository and live server are identical. I do not replace the entire web root or overwrite the game directories as part of a routine content update. See [DEPLOYMENT.md](DEPLOYMENT.md).

Draft curriculum pull requests are not automatically published. Changes to the existing visual design, audio, games, or personal records require separate review.

## Repository boundaries

This repository is for public portfolio work. It does not contain employer production configurations, private customer data, credentials, or infrastructure secrets.
