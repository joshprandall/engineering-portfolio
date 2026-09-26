const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||path.join(__dirname,'../staging/website-2.0-runtime'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png'};
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep))throw Error('outside');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
const results=[],offline=process.env.CHESS_OFFLINE_ONLY==='1';
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const game=page=>page.evaluate(async()=>{const {game}=await import('/games/3d-battle-chess/shared-game.js');return {...game.snapshot(),positions:[...game.positions],historyLength:game.history.length};});
const enter=async(page,view='3d')=>{await page.goto(base+'/games/3d-battle-chess/',{waitUntil:'networkidle'});await page.locator('#setupMode').selectOption('local');await page.locator('#setupView').selectOption(view);await page.locator('#setupSound').uncheck();await page.locator('#startGameBtn').click();await page.waitForFunction(()=>document.querySelector('#board2d').children.length===64);};
const inputMove=async(page,value)=>{await page.evaluate(value=>{document.querySelector('#moveInput').value=value;document.querySelector('#moveForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));},value);};
try{
 for(const touch of (offline?[]:[false,true])){
  const context=await browser.newContext({viewport:touch?{width:844,height:390}:{width:1440,height:900},hasTouch:touch,isMobile:touch,userAgent:touch?'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36':undefined});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('Chess:',m.text());});page.on('requestfailed',r=>console.log('Chess request:',r.url(),r.failure()?.errorText));await enter(page);
  assert.equal(await page.locator('#fallback-hint').count(),0,'Setup must not start an independent emergency game');
  assert.equal(await page.locator('#scene canvas').count(),1,'3D renderer starts');
  const toggle=()=>touch?page.locator('#handView').click():page.keyboard.press('v');await toggle();assert(await page.locator('#board2d').isVisible());
  const square=(x,y)=>page.locator(`#board2d [data-x="${x}"][data-y="${y}"]`);
  if(touch){await square(4,6).tap();await square(4,4).tap();}else{await square(4,6).click();await square(4,4).click();}
  let saved=await game(page);assert.equal(saved.moves.length,1);
  for(let i=0;i<4;i++){await toggle();assert(await page.locator(i%2===0?'#scene':'#board2d').isVisible());assert.deepEqual(await game(page),saved,'View toggles preserve full game state/history');}
  await inputMove(page,'d7d5');await page.waitForFunction(()=>document.querySelectorAll('#log li').length===2);
  await toggle();await inputMove(page,'e4d5');await page.waitForFunction(()=>document.querySelectorAll('#log li').length===3,{},{timeout:15000});assert.equal((await game(page)).moves.at(-1).captured,'p');
  if(touch)await page.locator('#handUndo').click();else await page.keyboard.press('u');assert.equal((await game(page)).moves.length,2);
  if(touch)await page.locator('#handFlip').click();else await page.keyboard.press('f');assert.equal((await game(page)).moves.length,2);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if(touch){await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector('#rotateGate').classList.contains('active'));await page.setViewportSize({width:844,height:390});}
  assert.deepEqual(errors,[]);results.push({case:touch?'touch-landscape-portrait':'desktop',passed:true});await context.close();
 }
 // CDN failure must retain setup, legal gameplay, and state on a successful retry.
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();let block=true;
 await page.route('**/battle.js?*',route=>block?route.abort():route.continue());await enter(page,'2d');
 await inputMove(page,'e2e4');await inputMove(page,'d7d5');const before=await game(page);assert.equal(before.moves.length,2);
 if(!offline){block=false;await page.keyboard.press('v');await page.waitForFunction(()=>!!document.querySelector('#scene canvas'),{},{timeout:20000});assert.deepEqual(await game(page),before,'Emergency→3D shares singleton');await page.keyboard.press('v');}
 await inputMove(page,'e4d5');await page.waitForFunction(()=>document.querySelectorAll('#log li').length===3);assert.equal((await game(page)).moves.length,3,'Capture is applied once');
 await page.keyboard.press('u');assert.equal((await game(page)).moves.length,2);
 results.push({case:offline?'offline-module-failure-gameplay':'module-failure-retry-state-handoff',passed:true});await context.close();
 // No WebGL: advanced module still supplies keyboard entry and shared 2D rules.
 if(!offline){const noGL=await browser.newContext();await noGL.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/.test(kind)?null:original.call(this,kind,...args);};});const p=await noGL.newPage();await enter(p);await inputMove(p,'e2e4');assert.equal((await game(p)).moves.length,1);assert(await p.locator('#board2d').isVisible());results.push({case:'webgl-unavailable-keyboard',passed:true});await noGL.close();}
 const touchContext=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const touchPage=await touchContext.newPage();await touchPage.route('**/battle.js?*',r=>r.abort());await enter(touchPage,'2d');
 await touchPage.locator('#board2d [data-x="4"][data-y="6"]').tap();await touchPage.locator('#board2d [data-x="4"][data-y="4"]').tap();assert.equal((await game(touchPage)).moves.length,1);await touchPage.locator('#handUndo').tap();assert.equal((await game(touchPage)).moves.length,0);await touchPage.setViewportSize({width:390,height:844});assert.equal(await touchPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);results.push({case:'offline-touch-move-undo-responsive',passed:true});await touchContext.close();
 console.log(offline?'PASS offline emergency chess gameplay and touch/responsive; advanced 3D cases NOT RUN.':'PASS chess browser: desktop, touch, capture combat, undo, flip, repeated 2D/3D switching, orientation gate, module failure/retry and no-WebGL keyboard play.');
}finally{await browser.close();server.close();fs.mkdirSync(path.join(__dirname,'../docs/phase3-evidence'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../docs/phase3-evidence/chess-browser.json'),JSON.stringify(results,null,2)+'\n');}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
