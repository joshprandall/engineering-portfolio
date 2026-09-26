JOSHUA RANDALL — KNOWLEDGE PLATFORM v0.2.0
===========================================

CONTENT + EXPERIENCE RELEASE
----------------------------
This package upgrades the current Joshua Randall portfolio with the second working release
of the public technical learning platform. It remains an overlay for the existing OSU site.

WHAT CHANGED SINCE v0.1.0
-------------------------
- Published learning objects increased from 77 to 112.
- Guided learning paths increased from 8 to 12.
- Added a 71-term technical glossary with direct links into related lessons.
- Added a structured curriculum/table-of-contents explorer for all seven domains.
- Added a clickable cross-domain knowledge graph that grows from lesson relationships.
- Search is now weighted instead of simple substring-only matching.
- Search understands useful aliases such as DNS, TCP, RTO, RPO, API, RBAC, PKI, HPC,
  NUMA, qubit, CI/CD, and several identity/infrastructure abbreviations.
- Search surfaces related glossary terms and roadmap topics when useful.
- Added browser-local “Continue learning” history.
- Added optional focus-reading mode for long lessons.
- Added adjustable narration speed.
- Guided-path context now appears beside lessons with previous/next navigation.
- Added ten more interactive teaching models:
    TCP handshake
    load-balancer health and routing
    binary conversion
    Boolean logic gates
    memory-latency hierarchy
    FIFO queues
    RBAC permissions
    SLO/error-budget calculation
    projectile motion
    Doppler shift with deliberate, click-to-play audio
- Roadmap topics promoted into published lessons were removed from the roadmap count.

CURRENT CONTENT
---------------
- 7 knowledge domains
- 112 published learning objects
- 12 guided learning paths
- 368 additional roadmap topics
- 71 glossary terms
- Long-term interface target: 5,500+ learning objects, with no architectural hard limit

CORE CAPABILITIES
-----------------
- Smart client-side search across titles, summaries, lesson text, categories, tags, and aliases
- Domain, level, type, and saved-item filters
- Deep links to individual lessons and domains
- Curriculum/table-of-contents navigation
- Guided paths with local progress
- Local bookmarks and completion tracking
- Continue-learning history stored only in the visitor's browser
- Cross-domain knowledge graph
- Searchable glossary
- Quizzes with explanations
- Interactive visual models and calculators
- Optional browser speech narration for full lessons and short summaries
- Adjustable narration speed
- Optional educational sound effects (OFF by default)
- No automatic audio
- Dark/light themes
- Pause-animation control and prefers-reduced-motion support
- Focus-reading mode
- Responsive desktop/mobile layout
- Primary/authoritative references where appropriate
- Transparent roadmap labeling for unpublished topics

FILES IN public_html/
---------------------
index.html             Existing portfolio home with Learn navigation
projects.html          Existing projects page with Knowledge Library links
learn.html             Learning platform UI
knowledge.css          Learning platform visual system and responsive layout
knowledge-data.js      Structured v0.2.0 content database
knowledge.js           Search, routing, progress, audio, graph, glossary, quizzes, and interactives
README_KNOWLEDGE_PLATFORM.txt  Copy of this release guide

IMPORTANT: THIS IS AN OVERLAY PACKAGE
-------------------------------------
Your existing OSU site still needs its existing files, including:
- styles.css
- app.js
- resume.html
- assets/

DO NOT delete those existing files.

Copy the CONTENTS of this package's public_html folder into your existing OSU public_html
folder. Allow index.html and projects.html to replace the versions already there. Add or
replace the Learn files beside them.

CURRENT OSU ENGINEERING WEB PATH FROM THE PRIOR SETUP
-----------------------------------------------------
\\stak.engr.oregonstate.edu\users\randjosh\public_html

PUBLIC SITE
-----------
https://web.engr.oregonstate.edu/~randjosh/

AFTER UPLOAD — QUICK TEST
-------------------------
1. Hard-refresh the site (Ctrl+F5 on Windows).
2. Confirm Learn appears in the main navigation.
3. Open Learn and confirm the page shows 112 published objects, 12 paths, and 71 glossary terms.
4. Open the Table of Contents and switch between domains.
5. Search for DNS, RBAC, NUMA, or RTO.
6. Search for “AD” and confirm the roadmap can surface Active Directory-related material.
7. Open “The TCP Three-Way Handshake” and run the animation.
8. Open “Load Balancing: One Service, Many Backends”; disable a backend and send requests.
9. Open the binary, Boolean logic, queue, or RBAC interactives.
10. Open the projectile or Doppler lesson; Doppler audio plays only when explicitly clicked.
11. Test the glossary and the G keyboard shortcut.
12. Open a lesson, enable Focus reading, change narration speed, and test Listen.
13. Mark a lesson complete and verify guided-path progress changes.
14. Return to the library and verify Continue learning appears.
15. Test dark/light mode, paused animation, mobile navigation, and phone layout.

TECHNICAL NOTES
---------------
- No database server is required for this release.
- No npm install, build step, API key, paid service, framework, or backend is required.
- knowledge-data.js is structured data; the renderer does not care whether the library has
  112 items or several thousand.
- Search is a lightweight weighted local index, not an external AI/search service.
- Bookmarks, completion, recent lesson, theme, focus, motion, sound, and narration speed use
  browser localStorage.
- Lesson narration uses the browser SpeechSynthesis API; voices vary by browser/device.
- Audio demonstrations use the Web Audio API and begin only after a deliberate user action.
- The interface supports prefers-reduced-motion.

CONTENT STANDARD
----------------
Quality before count:
  accurate -> understandable -> useful -> connected -> reviewable

Teaching principle:
  Read it. See it. Hear it. Build it. Break it. Fix it. Understand it.
