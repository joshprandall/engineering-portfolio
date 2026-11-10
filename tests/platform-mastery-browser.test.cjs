const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const fs = require('node:fs');

const PORT = 8772;
const BASE = 'http://127.0.0.1:' + PORT + '/';

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(BASE + 'learn.html');
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('local HTTP server did not become ready');
}

test('Learn, AI Builder Academy, and all 50 Cyber Range tools function in a browser', { timeout: 180_000 }, async () => {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

    await page.goto(BASE + 'learn.html', { waitUntil: 'domcontentloaded' });
    await page.locator('.academy-overview').waitFor({ timeout: 30_000 });
    assert.equal(await page.locator('.academy-program-card').count(), 7, 'Learn overview must expose seven programs');

    await page.goto(BASE + 'learn-cloud.html', { waitUntil: 'domcontentloaded' });
    await page.locator('.academy-syllabus').waitFor({ timeout: 15_000 });
    assert.match(await page.locator('.academy-syllabus').innerText(), /Cloud & Systems Engineering/);
    assert.ok(await page.locator('.academy-module').count() >= 5, 'Cloud syllabus must expose modules');

    await page.goto(BASE + 'lesson.html?lesson=cloud-subnetting&view=overview', { waitUntil: 'domcontentloaded' });
    await page.locator('.academy-lesson-contract').waitFor({ timeout: 30_000 });
    const contract = await page.locator('.academy-lesson-contract').innerText();
    assert.match(contract, /LESSON MASTERY CONTRACT/);
    assert.match(contract, /Explain/);
    assert.match(contract, /Troubleshoot/);
    assert.match(contract, /Verify/);

    await page.goto(BASE + 'ai-development.html', { waitUntil: 'domcontentloaded' });
    await page.locator('.ai-mastery-overview').waitFor({ timeout: 15_000 });
    assert.equal(await page.locator('.ai-builder-card').count(), 19, 'AI overview must expose 19 build systems');

    const aiManifest = JSON.parse(fs.readFileSync('assets/ai-build-mastery.json', 'utf8'));
    for (const system of aiManifest.systems) {
      await page.goto(BASE + system.page, { waitUntil: 'domcontentloaded' });
      await page.locator('.ai-build-master').waitFor({ timeout: 15_000 });
      assert.ok(await page.locator('.ai-build-step').count() >= 6, system.id + ': build path is incomplete');
      assert.ok(await page.locator('.ai-build-metric').count() >= 3, system.id + ': evaluation contract is incomplete');
      assert.ok((await page.locator('.ai-build-code code').innerText()).trim().length > 0, system.id + ': starter scaffold missing');
      await page.locator('#ai-lab-root').waitFor({ timeout: 10_000 });
      assert.ok((await page.locator('#ai-lab-root').innerText()).trim().length > 20, system.id + ': interactive lab did not initialize');
    }

    await page.goto(BASE + 'security-research.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#cyber-range-toolkit').waitFor({ timeout: 15_000 });
    const cyberManifest = JSON.parse(fs.readFileSync('assets/security-toolkit.json', 'utf8'));
    assert.equal(cyberManifest.tools.length, 50);
    assert.equal(await page.locator('[data-security-tool]').count(), 50, 'Cyber Range must render all 50 tools');

    for (const tool of cyberManifest.tools) {
      const opener = page.locator('[data-security-tool="' + tool.id + '"]');
      await opener.click({ force: true });
      assert.equal(await page.locator('#security-workbench-title').innerText(), tool.title, tool.id + ': wrong workbench tool');
      await page.locator('#security-tool-run').click({ force: true });

      await page.waitForFunction(() => {
        const out = document.querySelector('#security-tool-output');
        if (!out) return false;
        const text = out.innerText || '';
        return !/Sample loaded|Select a tool|Sample reloaded/.test(text) && text.trim().length > 10;
      }, null, { timeout: 5_000 });

      const report = await page.locator('#security-tool-output').innerText();
      assert.doesNotMatch(report, /Input error/i, tool.id + ': safe fixture caused an input error');
      assert.ok(report.trim().length > 10, tool.id + ': analysis produced no report');
    }

    console.log('Platform mastery browser test passed: 7 Learn programs, lesson mastery, 19 AI builds, 50 cyber tools.');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
});
