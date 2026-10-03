const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.vtt': 'text/vtt', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  const target = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!target.startsWith(root + path.sep)) return res.writeHead(403).end();
  res.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).on('error', () => { if (!res.headersSent) res.writeHead(404); res.end(); }).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless: true, executablePath: process.env.PORTFOLIO_BROWSER_EXECUTABLE, args: ['--no-sandbox']});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/security-research.html`);
    await page.locator('#vuln-run').click();
    assert.match(await page.locator('#vuln-output').textContent(), /Virtual root boundary escape reproduced/);
    assert.match(await page.locator('#vuln-output').textContent(), /Boundary escape rejected|Rejected/);
    await page.locator('#vuln-input').fill('index.txt');
    await page.locator('#vuln-run').click();
    assert.match(await page.locator('#vuln-output').textContent(), /No boundary escape reproduced/);
    assert.match(await page.locator('#vuln-output').textContent(), /\/srv\/app\/public\/index.txt/);
    const image = page.locator('img[src="assets/content/security-boundary.svg?v=20261003-professional-content-v3"]');
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(el => el.decode());
    assert.equal(await image.evaluate(el => el.complete && el.naturalWidth > 0), true);
    assert.equal(await page.locator('video[controls][preload="none"] track[kind="captions"]').getAttribute('src'), 'assets/content/security-method.vtt?v=20261003-professional-content-v3');
    assert.match(await page.locator('main').textContent(), /Video transcript: virtual path-boundary walkthrough/);
    assert.deepEqual(errors, []);
    console.log('PASS Security content: escape and allowed-path controls, rendered original visual, video captions and transcript.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
