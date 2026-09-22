# Portfolio / Knowledge Platform reconciliation

This branch preserves the v1.1.0 Knowledge Platform import (94 imported release files and an 8,000-record verification manifest) and incorporates the separate `release/final-project-portfolio-2026-09-22` branch's newer 16-project catalog, project detail pages, standalone qubit route, Geometry & Physics Lab, QPE, Emergent Systems Explorer, MIND Workbench, Battle Chess, Evil Wizard launcher, and updated shared assets/CSS/JavaScript.

The Knowledge Platform `deep-learning/` tree is retained from the imported branch; the three overlapping advanced-computing JSON files have the same Git blob IDs as the newer portfolio branch. Source/project files stay separate from the site teaching dataset; the unrelated engine must not be introduced.

Release caveats: the newer Evil Wizard launcher embeds `games/evil-wizard/index.html`, but that browser export does not exist in this GitHub tree. The existing OSU export must be preserved and tested, or a verified web export must be added. The fusion page also references a live OSU video not included in this repository. Static tests do not validate either hosted asset or responsive layouts in a real browser. Do not describe the live site as updated until OSU deployment is verified.
