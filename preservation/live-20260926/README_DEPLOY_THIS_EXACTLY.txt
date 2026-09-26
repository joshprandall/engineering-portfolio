JOSHUA RANDALL KNOWLEDGE PLATFORM v0.2.1 — DEPLOYMENT HOTFIX

WHY THIS EXISTS
The v0.2.0 package already contains the correct Knowledge Library cards. If the live Projects page still shows "07 / PLANNED STUDY" and "08 / PLANNED STUDY", the live server is still serving the older projects.html.

DO THIS
1. Open this ZIP.
2. Open the folder named public_html INSIDE the ZIP.
3. Select the SIX FILES INSIDE that folder:
   - index.html
   - projects.html
   - learn.html
   - knowledge.css
   - knowledge.js
   - knowledge-data.js
4. Copy those six files directly into your EXISTING OSU public_html folder.
5. When Windows asks, choose REPLACE THE FILES IN THE DESTINATION.

DO NOT copy the outer public_html folder into your existing public_html folder. The result must NOT be public_html/public_html/projects.html.

EXPECTED LIVE CARD TEXT
07 / KNOWLEDGE LIBRARY
Cloud & Systems Knowledge Library
Active knowledge platform · v0.2.0
Start learning ↗

08 / KNOWLEDGE LIBRARY
Advanced Computing
Active knowledge platform · v0.2.0
Explore the library ↗

AFTER COPYING
Open the live Projects page and press Ctrl+F5.
If needed, append ?v=021 to the projects.html URL once to bypass a stale browser cache.
