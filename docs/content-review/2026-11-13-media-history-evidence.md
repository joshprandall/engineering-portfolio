# Hosted evidence narrows WebKit failures to history navigation

Exact candidate: 1e3e07a0a1a03e061028e27a715de31c3fcc1ff5. Site-validation run: 43378940134. See adjacent JSON for selected machine-readable artifact evidence.

Both WebKit desktop and phone reports contain one ResizeObserver undelivered-notifications page error on **index.html during preferences-navigation**, after returning from projects.html. This occurs before canvas-fallback and viewport-size probes, so attributing these particular failures to those later probes is unsupported. Both error stacks are empty; phase establishes timing, not the responsible callback.

Both profiles also record project-evaluation.json fetch failure on projects.html as **Load request cancelled**, shortly before the return to index.html. In this run that fetch cancellation is diagnostic-only: it did not add an access-control page error. This is consistent with an in-flight fetch interrupted by the harness's immediate goBack, not evidence that the file is absent or that production CORS is broken. The earlier access-control page error remains a separate observation, not conclusively explained.

All three moving day scenes decoded successfully in both failing WebKit reports. Chromium's complete media test passed. Zero structured entries were dropped. WebKit ZIP SHA-256 values were independently checked against GitHub artifact digests; the Chromium digest is API-reported only.

Read-only source review found multiple home-page ResizeObserver candidates: shared header-height measurement, canvas drawing in app.js, the portfolio scene and quantum cube. Header measurement alone is not proven responsible. No runtime fix, callback suppression, test waiver, UI alteration or deployment was performed. The existing release failure remains open.

Next controlled isolation should compare index -> projects -> history-back against a fresh index navigation, then observe callback identities on a diagnostic-only copy. Preserve an uninstrumented control because observer tracing can affect timing. AL had no Playwright module installed in this checkout; no package/browser installation or competing local browser workload was started. Hosted artifacts were sufficient for this narrower result.
