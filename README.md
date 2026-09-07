# Engineering Portfolio

[![Site validation](https://github.com/joshprandall/engineering-portfolio/actions/workflows/validate.yml/badge.svg)](https://github.com/joshprandall/engineering-portfolio/actions/workflows/validate.yml)

A responsive static portfolio for professional experience, engineering coursework, technical projects, and long-term systems work.

**Live site:** https://web.engr.oregonstate.edu/~randjosh/

## What this project demonstrates

- Semantic, responsive HTML without a frontend framework.
- Shared CSS with deliberate wide, tablet, and phone layouts.
- Progressive enhancement with plain JavaScript.
- Keyboard-accessible navigation, tabs, search, filtering, dialogs, and controls.
- Dark/light theme persistence using local browser storage.
- Reduced-motion support.
- Canvas-based decorative systems visualization that is excluded from the accessibility tree.
- A project filter that keeps its visible result count synchronized.
- Automated repository checks in GitHub Actions.

## Design approach

The portfolio is intentionally static. There is no application server, database, build pipeline, API key, or runtime dependency for the site itself.

Content is available as normal HTML before JavaScript runs. JavaScript enhances navigation, theme handling, search, technical-discipline tabs, project filtering, copy feedback, and the animated systems map.

The visual system uses a restrained dark/light palette, strong typographic hierarchy, simple borders, and an orange accent to keep professional content readable while giving engineering work a recognizable identity.

## Accessibility

The source includes:

- A skip link to the main content.
- Semantic `header`, `nav`, `main`, `section`, and `footer` landmarks.
- Visible `:focus-visible` treatment.
- Native `dialog` for search.
- ARIA state on the mobile menu, tabs, project filters, and animation control.
- Keyboard navigation for the expertise tab set.
- `prefers-reduced-motion` support.
- Decorative canvas content marked `aria-hidden="true"`.
- Descriptive external-link labels and `rel="noopener noreferrer"` on new-tab links.

Automated checks are useful, but they are not a substitute for keyboard, screen-reader, responsive-layout, and browser testing.

## Validation

Run locally:

```sh
node tests/site.test.mjs
```

The validation script checks:

- Required source files.
- Duplicate element IDs.
- Local stylesheet/script references.
- Skip-link targets.
- Main landmarks and page language.
- New-tab link safety.
- Project filter metadata and visible project count.
- Core accessibility hooks.

GitHub Actions runs the same validation on pushes and pull requests.

## Project structure

```text
engineering-portfolio/
├── .github/
│   └── workflows/
│       └── validate.yml
├── tests/
│   └── site.test.mjs
├── app.js
├── index.html
├── projects.html
├── package.json
├── styles.css
└── README.md
```

## Run locally

No installation is required. Open `index.html` directly in a browser, or serve the folder with any static HTTP server.

For example, if Python is available:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

The live version is deployed as a static site through Oregon State University's Engineering web hosting. This repository is structured so the same HTML, CSS, and JavaScript can also be hosted on any ordinary static web host.

## Boundaries

This repository is a public portfolio artifact. It does not contain private employer systems, customer data, credentials, infrastructure secrets, or production configuration.
