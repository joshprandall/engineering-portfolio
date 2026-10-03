/* Rendered glass contract. Opaque artwork/data marks are not UI backgrounds. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT || path.join(__dirname, '../staging/website-2.0-runtime'));
const output = path.resolve(process.env.PORTFOLIO_QA_DIR || path.join(__dirname, '../visual-qa/glass'));
fs.mkdirSync(output, { recursive: true });
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.woff2':'font/woff2' };
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (!file.startsWith(root + path.sep) && file !== root) return res.writeHead(403).end();
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).on('error', () => res.end()).pipe(res);
  } catch { res.writeHead(404).end(); }
});
const report = { browser:'Chromium', physicalDevices:false, pages:[], controls:[], failures:[] };
async function inspect(page, label) {
  const paint = await page.evaluate(() => {
    const alpha = color => {
      if (color === 'transparent') return 0;
      const slash = color.match(/\/\s*([\d.]+)(%)?\s*\)/);
      if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1);
      const rgba = color.match(/^rgba?\(([^)]+)\)$/);
      if (rgba) { const values = rgba[1].split(',').map(Number); return values.length === 4 ? values[3] : 1; }
      return color === 'none' ? 0 : 1;
    };
    const results = [];
    for (const e of document.querySelectorAll('body *')) {
      if (e.closest('#site-scene,svg,canvas,video,audio,img,option')) continue;
      const s = getComputedStyle(e), r = e.getBoundingClientRect();
      if (!e.getClientRects().length || s.visibility === 'hidden' || Number(s.opacity) === 0 || !r.width || !r.height) continue;
      // Axes, probability bars, progress marks and colored data dots are graphic ink.
      if (e.matches('.status-dot,.state-arrow,.center,.axis,.control-divider,.signal,.track>div,.prob-track>div,.lab-visual i,.battle-board,.legend-scale .gradient,.science-meter>span') || r.height <= 6 || r.width <= 4) continue;
      const colors = s.backgroundImage.match(/rgba?\([^)]*\)|color\([^)]*\)/g) || [];
      const opaqueGradient = s.backgroundImage.includes('gradient(') && colors.length > 0 && colors.every(c => alpha(c) === 1);
      if (alpha(s.backgroundColor) === 1 || opaqueGradient) results.push({
        tag:e.tagName, id:e.id, classes:typeof e.className === 'string' ? e.className : '',
        background:s.backgroundColor, image:s.backgroundImage, label:e.textContent.trim().replace(/\s+/g,' ').slice(0,80)
      });
    }
    return results;
  });
  // Approved filled controls must remain legible over the moving scene.
  const opaqueControls = new Set(['primary-nav','bell-measure','toast']);
  const unexpected = paint.filter(e => !opaqueControls.has(e.id) &&
    !e.classes.split(/\s+/).some(name => name === 'skip' || name === 'scene-sound-panel'));
  report.pages.push({ ...label, opaque:paint });
  if (unexpected.length) report.failures.push({ ...label, unexpected });
}
async function controlPaint(locator, label, filled = false) {
  const value = await locator.evaluate(e => {
    const s = getComputedStyle(e);
    return { background:s.backgroundColor, color:s.color, opacity:s.opacity, outline:s.outlineStyle, outlineWidth:s.outlineWidth };
  });
  report.controls.push({ ...label, ...value });
  const translucent = /rgba\([^)]*,\s*0?\.\d+\)|\/\s*0?\.\d+\s*\)/.test(value.background);
  assert(filled ? /^rgb\(/.test(value.background) : translucent, JSON.stringify({ ...label, ...value }));
  return value;
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless:true, executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE });
  try {
    const context = await browser.newContext({ viewport:{width:390,height:844}, reducedMotion:'reduce' });
    await context.route('https://**/*', route => route.abort());
    await context.addInitScript(() => localStorage.setItem('jr-site-ambient-muted-v3', '1'));
    const page = await context.newPage();
    page.on('pageerror', error => report.failures.push({ runtimeError:error.message }));
    const base = `http://127.0.0.1:${server.address().port}/`;
    const routes = [
      ...fs.readdirSync(root).filter(file => file.endsWith('.html')),
      'qubit-preview-20260921/index.html', 'geometric-lab/index.html',
      ...['visual','lab','practice','review'].map(view => `lesson.html?lesson=cloud-url-journey&view=${view}`)
    ];
    for (const route of routes) {
      await page.goto(base + route, { waitUntil:'domcontentloaded' });
      await page.waitForFunction(() => window.PortfolioTheme && document.body.classList.contains('living-scenes'));
      if (route.startsWith('lesson.html?')) await page.locator('.lesson-page-tabs').waitFor();
      if (route.startsWith('ai-') && await page.locator('#ai-lab-root').count()) await page.locator('[data-ai-reset]').waitFor();
      if (route === 'learn-capstones.html') await page.locator('.cap-check button').waitFor();
      for (const width of [390,1440]) {
        await page.setViewportSize({ width, height:width === 390 ? 844 : 1000 });
        for (const theme of ['dark','light']) {
          await page.evaluate(t => PortfolioTheme.setTheme(t, false), theme);
          await page.waitForTimeout(60);
          await inspect(page, { route, width, theme, state:'page' });
          const menu = page.locator('#menu,#mobile-menu');
          if (await menu.count()) {
            await menu.click();
            const solid = await page.locator('#primary-nav').evaluate(e => {
              const s = getComputedStyle(e); return { background:s.backgroundColor, image:s.backgroundImage, blur:s.backdropFilter, opacity:s.opacity };
            });
            assert.deepEqual(solid, { background:theme === 'dark' ? 'rgb(11, 18, 22)' : 'rgb(247, 249, 245)', image:'none', blur:'none', opacity:'1' });
            await page.keyboard.press('Escape');
          }
        }
      }
      console.log('GLASS', route);
    }
    for (const theme of ['dark','light']) {
      await page.setViewportSize({ width:390, height:844 });
      await page.goto(base + 'index.html');
      await page.evaluate(t => PortfolioTheme.setTheme(t, false), theme);
      const button = page.locator('#bell-measure');
      await button.scrollIntoViewIfNeeded();
      await page.mouse.move(0,0);
      const normal = await controlPaint(button, { theme, state:'default' }, true);
      await button.hover();
      await page.waitForTimeout(250);
      const hover = await controlPaint(button, { theme, state:'hover' }, true);
      assert.notEqual(normal.background, hover.background);
      await page.locator('#bell-basis').focus();
      await page.keyboard.press('Tab');
      assert(await button.evaluate(e => e === document.activeElement));
      const focus = await controlPaint(button, { theme, state:'focus' }, true);
      assert.notEqual(focus.outline, 'none');
      await page.mouse.down();
      await page.waitForTimeout(250);
      const pressed = await controlPaint(button, { theme, state:'pressed' }, true);
      assert.notEqual(pressed.background, hover.background);
      await page.mouse.up();
      await button.evaluate(e => e.disabled = true);
      await controlPaint(button, { theme, state:'disabled' }, true);
      await button.evaluate(e => e.disabled = false);
      await page.locator('#search-open').click();
      await inspect(page, { route:'index.html', theme, width:390, state:'search-open' });
      await page.keyboard.press('Escape');
      await page.locator('[data-scene-audio]').click();
      await inspect(page, { route:'index.html', theme, width:390, state:'sound-open' });
      await page.keyboard.press('Escape');
      await page.locator('.skip').focus();
      await controlPaint(page.locator('.skip'), { theme, state:'skip-focus' }, true);
      await page.locator('#toast').evaluate(e => { e.textContent = 'Saved on this device'; e.classList.add('show'); });
      await inspect(page, { route:'index.html', theme, width:390, state:'toast-visible' });
      await page.goto(base + 'geometric-lab/index.html');
      await page.evaluate(t => PortfolioTheme.setTheme(t, false), theme);
      for (const tab of ['geometry','models','diffusion','inverse','notebook','learn']) {
        await page.locator(`[data-tab="${tab}"]`).click();
        await inspect(page, { route:'geometric-lab/index.html', theme, width:390, state:tab });
      }
      await page.locator('[data-tab="geometry"]').click();
      await page.locator('#save-experiment').click();
      await inspect(page, { route:'geometric-lab/index.html', theme, width:390, state:'save-open' });
      await page.keyboard.press('Escape');
    }
    assert.deepEqual(report.failures, []);
    report.passed = true;
    console.log(`PASS glass: ${routes.length} routes/views, both themes, 390/1440px, solid menus, control and overlay states.`);
  } finally {
    fs.writeFileSync(path.join(output, 'glass.json'), JSON.stringify(report, null, 2) + '\n');
    await browser.close(); server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
