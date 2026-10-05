const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||path.join(__dirname,'..'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
    if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
    const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+path.sep))throw Error('outside');
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  }catch{
    res.writeHead(404);res.end();
  }
});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({
    headless:true,
    executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
  });
  try{
    const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    const page=await context.newPage();
    const pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(error.message));

    await page.goto(base+'/games/3d-battle-chess/',{waitUntil:'networkidle'});

    assert.equal(await page.locator('#setupScreen').getAttribute('aria-labelledby'),'setupTitle');
    assert.equal((await page.locator('#setupTitle').textContent()).trim(),'Claim the crown.');
    assert.equal((await page.locator('#startGameBtn').textContent()).trim(),'BEGIN BATTLE');
    assert.equal(await page.locator('#continueGameBtn').getAttribute('type'),'button');

    for(const id of ['setupMode','setupTheme','setupDifficulty','setupView','setupQuality']){
      const control=page.locator('#'+id);
      assert.equal(await control.count(),1,`${id} must exist`);
      const wrappingLabel=control.locator('xpath=ancestor::label[1]');
      assert.equal(await wrappingLabel.count(),1,`${id} must have an associated wrapping label`);
      assert((await wrappingLabel.innerText()).trim().length>0,`${id} label must have visible text`);
    }

    assert.equal(await page.locator('#setupSound').getAttribute('type'),'checkbox');
    assert.equal(await page.locator('#setupCombat').getAttribute('type'),'checkbox');
    assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);

    await page.locator('#setupMode').selectOption('local');
    await page.locator('#setupView').selectOption('2d');
    if(await page.locator('#setupSound').isChecked())await page.locator('#setupSound').uncheck();
    await page.locator('#startGameBtn').click();

    await page.waitForFunction(()=>document.querySelectorAll('#board2d [role="gridcell"]').length===64);
    assert.equal(await page.locator('#board2d').getAttribute('role'),'grid');
    assert.equal(await page.locator('#board2d').getAttribute('aria-label'),'Interactive two-dimensional chessboard');
    assert.equal(await page.locator('#board2d [role="gridcell"]').count(),64);

    const labels=await page.locator('#board2d [role="gridcell"]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label')));
    assert(labels.every(label=>typeof label==='string'&&label.trim().length>0),'Every board square must have a non-empty accessible name');
    assert(labels.includes('White Pawn on e2'),'Piece accessibility must identify role, color, and coordinate');

    assert.equal(await page.locator('.hud').getAttribute('aria-live'),'polite');
    assert.equal(await page.locator('#toast').getAttribute('aria-live'),'polite');
    assert.equal(await page.locator('#promotion').getAttribute('aria-modal'),'true');
    assert.equal(await page.locator('#gameOver').getAttribute('aria-modal'),'true');

    // Prove a complete legal move can be made with keyboard-only board interaction.
    await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();});
    await page.keyboard.press('Enter');      // select e2
    await page.keyboard.press('ArrowUp');    // e3
    await page.keyboard.press('ArrowUp');    // e4
    await page.keyboard.press('Enter');      // move e2 -> e4
    await page.waitForFunction(()=>document.querySelectorAll('#log li').length===1,{},{timeout:5000});
    assert.match((await page.locator('#log li').first().textContent())||'',/White/);

    // Keyboard shortcuts must remain state-safe and usable.
    await page.keyboard.press('f');
    assert.equal(await page.locator('#board2d [role="gridcell"]').count(),64);
    await page.keyboard.press('u');
    await page.waitForFunction(()=>document.querySelectorAll('#log li').length===0);
    assert.equal(await page.locator('#turn').textContent(),'White to move');

    const controls=['#newGame','#undo','#flip','#viewToggle','#sound','#saveGame','#fullscreenBtn','#exitGame','#copyFen','#downloadPgn','#loadFen'];
    for(const selector of controls){
      const button=page.locator(selector);
      assert.equal(await button.count(),1,`${selector} must exist`);
      const name=((await button.getAttribute('aria-label'))||(await button.textContent())||'').trim();
      assert(name.length>0,`${selector} must expose an accessible name`);
    }

    assert.deepEqual(pageErrors,[],'Accessibility journey must not trigger page errors');
    console.log('PASS Crown & Ash Basic Edition accessibility: semantic controls, live regions, labeled board, reduced-motion preference, and keyboard-only play.');
    await context.close();
  }finally{
    await browser.close();
    server.close();
  }
})().catch(error=>{
  console.error(error);
  server.close();
  process.exitCode=1;
});
