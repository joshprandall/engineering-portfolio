JOSHUA RANDALL — KNOWLEDGE PLATFORM v0.3.0
CONTENT EXPANSION RELEASE

WHAT THIS RELEASE DOES
- Expands the published library from 112 to 184 learning objects (+72).
- Expands guided learning paths to 24.
- Expands the searchable glossary to 122 terms.
- Keeps 316 additional curriculum topics mapped for future publication.
- Preserves the v0.2.x search, curriculum, progress, bookmarks, narration,
  audio, glossary, knowledge graph, quizzes, and interactive learning system.

NEW CONTENT AREAS IN v0.3.0
Cloud & Systems:
- ICMP, routing tables, IPv6, Linux processes, Linux filesystem hierarchy,
  Kerberos, Conditional Access, containers vs VMs, DNS troubleshooting,
  and the 3-2-1 backup principle.

Advanced Computing:
- CPU pipelines, branch prediction, TLBs, false sharing, the roofline model,
  GPU warp divergence, MPI collectives, distributed consensus, entanglement,
  and a cache-locality lab.

Software Engineering:
- Arrays vs linked lists, hash tables, trees, graphs, HTTP method semantics,
  normalization, transaction isolation, feature flags, observability-by-design,
  and a systematic debugging guide.

Cybersecurity:
- Secure password storage, sessions, XSS, SQL injection, SSRF, EDR, SIEM,
  data classification, ransomware recovery design, and a sign-in triage lab.

Leadership & IT Management:
- Service ownership, incident severity, capacity planning, executive communication,
  structured hiring, roadmaps, CapEx/OpEx, vendor lock-in, operational metrics,
  and a postmortem-writing lab.

Mathematics:
- Trigonometry, limits, chain rule, gradients, determinants, orthogonality,
  combinatorics, probability distributions, floating-point error,
  and a gradient-descent lab.

Physics:
- Dimensional analysis, circular motion, torque, simple harmonic motion,
  ideal gases, capacitance, Kirchhoff laws, Faraday induction,
  de Broglie wavelength, uncertainty, and a projectile-motion lab.

DEPLOYMENT — IMPORTANT
This is an overlay for the existing OSU site.

1. Extract this ZIP.
2. Open the extracted public_html folder.
3. Copy the FILES INSIDE that public_html folder into your existing OSU public_html.
4. Choose REPLACE for matching files.
5. Do NOT delete your existing assets folder, styles.css, app.js, or resume.html.
6. Hard-refresh the live site with Ctrl+F5.

FILES THIS RELEASE REPLACES / ADDS
- index.html
- projects.html
- learn.html
- knowledge.css
- knowledge.js
- knowledge-data.js
- README_KNOWLEDGE_PLATFORM.txt

EXPECTED LIVE RESULT
Projects should show cards 07 and 08 as KNOWLEDGE LIBRARY, not PLANNED STUDY.
The Learn page should report:
- 184 published learning objects
- 24 guided paths
- 122 glossary terms
- 316 mapped-next curriculum topics

DESIGN PRINCIPLE
Read it. See it. Hear it. Build it. Break it. Fix it. Understand it.

The platform remains data-driven and is intended to scale into thousands of
learning objects without redesigning the interface for each content expansion.
