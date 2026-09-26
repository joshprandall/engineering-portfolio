/* Real-document transitions catch competing theme owners, CSS overrides and lost preferences. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({ browser, base, output, failures }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('https://**/*',r=>r.abort()); // Explicit provider-outage acceptance; no streaming networkidle dependency.
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror', e => failures.push('Appearance: ' + (e.stack || e.message)));
  page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400 && !/games\/evil-wizard/.test(r.url())) failures.push('Appearance HTTP: ' + r.url()); });
  const theme = () => page.locator('html').getAttribute('data-theme');
  const open = async route => { await page.goto(base + '/' + route, { waitUntil: 'domcontentloaded' }); };
  const toggle = () => page.locator('[data-theme-toggle]').click();
  const pixels = () => page.locator('.scene-canvas').evaluate(c => c.toDataURL());
  await open('learn.html');
  await page.evaluate(() => { localStorage.removeItem('jr-site-theme'); localStorage.setItem('jr-knowledge-theme', 'light'); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await theme(), 'light');
  await toggle();
  await page.locator('#mobile-menu').click();
  await page.locator('#primary-nav a[href="projects.html"]').click();
  await page.waitForURL('**/projects.html');
  assert.equal(await theme(), 'dark', 'Learning → Projects retains Night');
  await toggle();
  if (await page.locator('#menu').isVisible()) await page.locator('#menu').click();
  await page.locator('#primary-nav a[href="learn.html"]').click();
  await page.waitForURL('**/learn.html');
  assert.equal(await theme(), 'light', 'Projects → Learning retains Day');
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await theme(), 'light', 'Reload retains Day');
  await page.goBack({ waitUntil: 'domcontentloaded' });
  assert.equal(await theme(), 'light', 'Back history retains latest choice');
  const tab = await context.newPage();
  await tab.goto(base + '/learn-browse.html', { waitUntil: 'domcontentloaded' });
  await tab.locator('[data-theme-toggle]').click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await tab.locator('[data-theme-toggle]').click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  await tab.close();

  const root = path.resolve(__dirname, '..');
  const routes = fs.readdirSync(root).filter(n => n.endsWith('.html')).concat(['geometric-lab/index.html', 'qubit-preview-20260921/index.html']);
  await page.setViewportSize({ width: 320, height: 740 });
  const layoutProblems = [];
  for (const route of routes) {
    await open(route);
    assert.equal(await theme(), 'light', route + ': saved Day survives page scripts');
    const control = page.locator('[data-theme-toggle]');
    assert(await control.isVisible(), route + ': appearance control visible');
    const box = await control.boundingBox();
    assert(box.x >= 0 && box.x + box.width <= 321, route + ': control fits smallest phone');
    assert.equal(await page.locator('#site-scene').count(), 1, route + ': one shared backdrop');
    if (!await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)) {
      layoutProblems.push(route);
      console.log('Overflow', route, await page.evaluate(() => [...document.querySelectorAll('main *')].map(e => ({tag:e.tagName,id:e.id,cls:e.className,width:Math.round(e.getBoundingClientRect().width)})).filter(e => e.width > innerWidth).slice(0,10)));
    }
    await toggle(); assert.equal(await theme(), 'dark', route + ': no competing toggle listener');
    await toggle();
  }
  assert.deepEqual(layoutProblems, [], 'No horizontal overflow on the smallest phone');
  console.log('PASS appearance: both navigation directions, reload, Back, tab sync, controls on all 32 pages');

  for (const mode of ['light', 'dark']) {
    await open('index.html');
    await page.evaluate(mode => PortfolioTheme.setTheme(mode), mode);
    let image = await pixels(); await page.waitForTimeout(400);
    assert.notEqual(await pixels(), image, mode + ': scenery moves');
    assert.equal(await page.locator('.scene-options [data-scene-motion]').count(), 0, mode + ': no legacy motion toggle');
    const sound=page.locator('header [data-scene-audio]');
    assert.equal(await sound.count(),1,mode+': one header sound control');
    assert(await sound.isVisible(),mode+': sound control visible');
    await sound.click();
    assert(await page.locator('header .scene-sound-panel').isVisible(),mode+': sound panel opens');
    await sound.click();
    assert.equal(await page.locator('body').getAttribute('data-motion'), 'running', mode + ': site motion remains running');
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    if (output) {
      for (const [name, width, height] of [['phone', 390, 844], ['desktop', 1440, 1000]]) {
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(output, `appearance-${mode}-${name}.png`) });
      }
      await open('learn.html');
      await page.screenshot({ path: path.join(output, `appearance-${mode}-learning.png`) });
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => localStorage.removeItem('jr-site-motion'));
  await page.evaluate(() => localStorage.removeItem('jr-knowledge-motion'));
  await open('projects.html');
  assert.equal(await page.locator('body').getAttribute('data-motion'), 'paused', 'Reduced-motion preference pauses decorative scenery');
  assert(await page.evaluate(()=>window.PortfolioTheme.isPaused()), 'Theme owner exposes reduced-motion state');
  let moving = await pixels(); await page.waitForTimeout(250); assert.equal(await pixels(), moving, 'Scenery remains still under reduced motion');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  // Private/storage-restricted browsers still get usable controls and an in-tab fallback.
  await context.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }); });
  await open('learn.html'); await toggle(); const fallback = await theme();
  await open('projects.html'); assert.equal(await theme(), fallback, 'Session fallback survives navigation');
  await toggle(); assert.notEqual(await theme(), fallback, 'Blocked localStorage does not break theme controls');
  // Single-process Chromium cannot safely tear down one of several browser contexts.
  // The enclosing suite closes the browser (and every context) in its finally block.
  if (process.env.PORTFOLIO_BROWSER_SINGLE_PROCESS !== '1') await context.close();
  assert.deepEqual(failures, [], 'No runtime failures during appearance navigation');
  console.log('PASS scenery: animation, persistent pause, reduced motion, private-mode fallback');
};
