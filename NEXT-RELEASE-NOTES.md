# Joshua Randall Portfolio + Knowledge Platform — vNext review build

This is a **review build**, not a verified production release or a claim that all projects, labs, and lessons are complete. It builds upon the reconciled v1.1.0 website and preserves host-only assets when installed as an overlay. No Unreal Engine files are included.

## Implemented in this build

- A redesigned five-mode Connected Systems explorer: Architect, Build, Secure, Automate, Evolve. Each selection changes the network edges, labeled nodes, headline, explanation, bullets and linked project. Nodes can be selected by pointer or keyboard.
- A responsive artistic photonic-laboratory backdrop using the reference image supplied in this conversation, enhanced by animated two-qubit graphics. Its Bell-state demonstration samples the **ideal** joint outcomes for Z/Z, X/X, Y/Y and Z/X measurement settings. This is an explanatory **classical simulation and artistic rendering**, not quantum hardware or a literal signal between entangled particles. Reduced-motion preference is respected.
- Education wording reflects concurrent study: MIT Quantum Engineering program; Oregon State University bachelor's studies in Computer Science and Electrical & Computer Engineering with minors in Data Science, Mathematics and Physics. The site does not claim an MIT degree or confirmed credit status. The OSU logo and a typographic MIT marker identify the programs.
- Project cards link to dedicated same-site pages. GitHub source links open separate tabs; game/lab links open their dedicated applications. Added a single-qubit project page and previous/all/next navigation across project details.
- Learning Paths offer a searchable syllabus for each of the 300 mapped sequences. Eight foundation routes are highlighted by default. All lesson links resolve to the existing 8,000-object library; reflection checkpoints are local to the user's browser. The existing 225 paths whose data only supplies a `summary` now show that summary rather than `undefined`.

## Additional progress in this candidate

- Added eight authored, domain-specific foundation capstones: systems/DNS, HPC/Amdahl, software parsing and tests, least-privilege security, incident leadership, mathematical rotations, coherent-wave interference, and Bell-state-versus-classical correlation. Each has a worked example, lab procedure, conceptual quiz with reasoning and evidence checklist. These are real teaching modules, not mechanically expanded lesson counts.
- The two learning-library catalog cards now open their own dedicated overview pages; all 16 cards have real same-site entry pages and previous/all/next navigation, including on phones.
- Added static integrity checks covering the authored capstones, 16 dedicated-card routes, project navigation, JavaScript syntax, and path ID references. The remaining 292 paths are not newly authored by this change and are not claimed to be complete.

## What was validated

- Python static audit: 508 relative HTML references checked; zero unexplained missing files (the two known OSU-hosted items are exempted); all 300 paths and their 4,077 lesson references resolve.
- JavaScript syntax checks passed. Chess engine: 20 initial legal moves, e2e4, e7e5, Nf3, undo and computer-move selection passed a focused smoke test.
- An independent browser/UI run was attempted but the test browser in this environment was blocked from opening even local URLs by administrator policy. **Phone/tablet rendering, real-device 3D chess and all 8,000 lesson activities have not been end-to-end certified.**

## Outstanding editorial and functionality work

- Of 8,000 unique titled objects, 3,662 unique explanations exist. 2,345 core explanations contain fewer than 55 words; many are derived exercises rather than full standalone instructional chapters. Their learning value and sources need an editorial review; **an object count is not evidence of curriculum completeness**.
- Of 300 paths, 225 depend on a summary field rather than individually authored descriptions. The release includes a useful display fallback and ordered syllabi, but those paths are not represented as individually fully developed curricula.
- Game mechanics and all separate lab interactions must be exercised on the live site, including WebGL, permission and external CDN loading. Do not claim every project works from static checks alone.
- The original OSU-only Evil Wizard browser export and fusion video are not in this package and must be preserved intact.
- Factual career details beyond the changes grounded in the user's explicit statements still require their review. MIT credit status is intentionally unspecified.

## Safe deployment

1. Keep the existing full OSU backup from 2026-09-22. Create a fresh `public_html` backup outside the web root before installing this overlay.
2. Inspect and compare the files in `vnext-overlay.zip` to the live originals; **do not blindly overwrite** any page modified since the prior release. Extract into a staging directory and install only reviewed files. Do not use `cp -a` to replace the `public_html` directory itself; it previously caused a 403 due to permissions.
3. Preserve the host-only game and media. Ensure directories are web-traversable (`755`) and files web-readable (`644`) using narrow path-specific changes rather than recursive chmod.
4. Visit the live pages in Chrome, including two browser widths, and exercise all new controls and the qubit and game; roll back if any check fails.

This is a release candidate, not a production declaration. Publishing source to GitHub does not deploy OSU. Browser integration and source-specific educational review are still required before going live.
