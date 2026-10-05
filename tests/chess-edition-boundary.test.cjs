const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||path.join(__dirname,'..'));
const gameRoot=path.join(root,'games','3d-battle-chess');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};

const server=http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
  const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+path.sep))throw Error('outside');
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 }catch{
  res.writeHead(404);res.end();
 }
});

(async()=>{
 const edition=await import(pathToFileURL(path.join(gameRoot,'edition.js')).href);
 assert.equal(edition.resolveEdition({desktop:false,edition:'full',protocol:'https:'}),'basic');
 assert.equal(edition.resolveEdition({desktop:true,edition:'full',protocol:'https:'}),'basic','web protocol cannot unlock Full Edition');
 assert.equal(edition.resolveEdition({desktop:true,edition:'full',protocol:'file:'}),'full','desktop file runtime unlocks Full Edition');
 assert.deepEqual([...edition.capabilitiesFor('basic').themes],['classic']);
 assert.equal(edition.capabilitiesFor('basic').animatedCombat,false);
 assert.equal(edition.capabilitiesFor('basic').cinematicCaptures,false);
 assert.equal(edition.capabilitiesFor('basic').livingBoardPresence,false);
 assert.deepEqual([...edition.capabilitiesFor('full').themes],['classic','arcane','monsters','brick','cosmic']);
 assert.equal(edition.capabilitiesFor('full').animatedCombat,true);
 assert.equal(edition.capabilitiesFor('full').cinematicCaptures,true);
 assert.equal(edition.capabilitiesFor('full').livingBoardPresence,true);

 const preload=fs.readFileSync(path.join(root,'products','crown-and-ash-desktop','preload.cjs'),'utf8');
 assert.match(preload,/edition:'full'/,'desktop preload must identify the Full Edition');
 const index=fs.readFileSync(path.join(gameRoot,'index.html'),'utf8');
 assert.match(index,/Crown &amp; Ash — Basic Edition/,'public document must identify Basic Edition');
 assert.doesNotMatch(index,/<option value="(?:arcane|monsters|brick|cosmic)">/,'premium battle-set options must not ship in static website markup');

 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  // Even a page-script attempt to mimic the desktop bridge must not unlock premium content over HTTP.
  await context.addInitScript(()=>{window.crownAndAshDesktop={desktop:true,edition:'full',platform:'win32'};});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/games/3d-battle-chess/?combat=v8',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.crownAshEdition==='basic');

  assert.equal(await page.title(),'Crown & Ash — Basic Edition');
  assert.deepEqual(await page.locator('#setupTheme option').evaluateAll(options=>options.map(option=>option.value)),['classic']);
  assert.equal(await page.locator('[data-full-only]').first().isHidden(),true);
  assert.equal(await page.locator('#setupCombat').isDisabled(),true);

  await page.locator('#setupMode').selectOption('local');
  await page.locator('#setupView').selectOption('2d');
  await page.locator('#setupSound').uncheck();
  await page.locator('#startGameBtn').click();
  await page.waitForFunction(()=>document.querySelector('#board2d').children.length===64);
  assert.deepEqual(await page.locator('#theme option').evaluateAll(options=>options.map(option=>option.value)),['classic']);
  assert.equal(await page.locator('#combatToggle').isHidden(),true);

  await page.evaluate(()=>{
   const input=document.querySelector('#moveInput');
   input.value='e2e4';
   document.querySelector('#moveForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  });
  await page.waitForFunction(()=>document.querySelectorAll('#log li').length===1);
  const snapshot=await page.evaluate(async()=>{const {game}=await import('/games/3d-battle-chess/shared-game.js');return game.snapshot();});
  assert.equal(snapshot.moves.length,1,'Basic Edition must remain fully playable chess');
  assert.deepEqual(errors,[]);
  await context.close();
 }finally{
  await browser.close();
  server.close();
 }
 console.log('PASS Crown & Ash edition boundary: website remains Basic Edition; premium capability requires desktop file runtime.');
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
