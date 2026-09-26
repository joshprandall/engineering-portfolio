# Navigation and search ownership

`manifests/site-routes.json` owns routes, dependency units and primary navigation labels. `tools/build_shell_metadata.py` derives compact `assets/site-navigation.json` and global search metadata. Runtime navigation uses only `site-navigation.js`; resilience no longer binds menus, and learning's duplicate header handler was removed in a separate commit after standard pages passed.

The controller binds only an explicit header nav/menu. It closes on Escape, outside click, link activation and focus departure; Escape returns focus to its trigger. `aria-expanded`, labels and the current route are maintained. Valid server-rendered links remain if metadata fetching fails. Games/labs do not load this controller inside their independent controls.

`site-search.js` owns the standard global dialog, slash shortcut and focus return. Its lazy metadata covers route content and all 8,000 lesson titles with dedicated lesson URLs. It never loads game internals. Learning's detailed lesson search remains in `knowledge.js`; its slash shortcut still means library search. The two controllers are not mounted on the same learning shell.

Home and Learn have different, semantic solar link sets generated from navigation and actual corpus domains respectively. Solar links work without JavaScript and remain keyboard/touch accessible. Motion preferences can stop their decorative drift.
