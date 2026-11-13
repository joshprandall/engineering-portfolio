'use strict';
// Test-only passive event evidence. Does not catch, suppress or reclassify failures.
function createMediaDiagnostics(report, { origin, now = () => Date.now(), limit = 200 } = {}) {
  if (!Number.isInteger(limit) || limit < 1) throw new TypeError('positive diagnostic limit required');
  report.diagnostics = [];
  report.diagnosticsDropped = 0;
  const pages = new WeakSet();
  let phase = 'initialization';
  const local = url => { try { return new URL(url).origin === origin; } catch { return false; } };
  const record = entry => {
    if (report.diagnostics.length >= limit) { report.diagnosticsDropped++; return; }
    report.diagnostics.push({ at: now(), phase, ...entry });
  };
  return {
    phase(name) { phase = String(name); },
    attach(page, label, { gateErrors = false } = {}) {
      if (pages.has(page)) return;
      pages.add(page);
      const context = () => ({ page: label, pageUrl: page.url() });
      page.on('pageerror', error => {
        // Preserve the preexisting primary-page failure list exactly, even when
        // the richer diagnostic list reaches its bounded storage limit.
        if (gateErrors) report.errors.push(error.message);
        record({ kind: 'pageerror', ...context(), message: error.message, stack: error.stack || '' });
      });
      page.on('console', message => {
        if (message.type() !== 'error') return;
        record({ kind: 'console-error', ...context(), message: message.text(), location: message.location() });
      });
      page.on('requestfailed', request => {
        if (!local(request.url())) return; // Remote HTTPS is intentionally blocked by this harness.
        record({ kind: 'local-requestfailed', ...context(), requestUrl: request.url(),
          resourceType: request.resourceType(), failure: request.failure()?.errorText || '' });
      });
      page.on('response', response => {
        if (!local(response.url()) || response.status() < 400) return;
        record({ kind: 'local-http-error', ...context(), requestUrl: response.url(), status: response.status() });
      });
    }
  };
}
module.exports = { createMediaDiagnostics };
