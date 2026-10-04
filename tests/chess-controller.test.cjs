const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');

const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||path.join(__dirname,'../staging/website-2.0-runtime'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png'};
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep))throw Error('outside');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});

 async function controllerCase(id){
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addInitScript(controllerId=>{
   const buttons=Array.from({length:18},()=>({pressed:false,touched:false,value:0}));
   const pad={id:controllerId,index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons};
   Object.defineProperty(window,'__testPad',{value:pad,writable:false,configurable:false});
   Object.defineProperty(navigator,'getGamepads',{value:()=>[pad],configurable:true});
  },id);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/games/3d-battle-chess/',{waitUntil:'networkidle'});
  await page.locator('#setupMode').selectOption('local');
  await page.locator('#setupView').selectOption('2d');
  await page.locator('#setupSound').uncheck();
  await page.locator('#startGameBtn').click();
  await page.waitForFunction(()=>document.querySelector('#board2d').children.length===64);
  // The emergency 2D board can appear before the advanced module is ready. The hidden renderer canvas proves init3D/connectButtons/gamepadLoop have completed.
  await page.waitForFunction(()=>!!document.querySelector('#scene canvas'),{},{timeout:15000});
  await sleep(100);

  const game=()=>page.evaluate(async()=>{const {game}=await import('/games/3d-battle-chess/shared-game.js');return{moves:game.moves.map(m=>({...m})),turn:game.turn};});
  const cursor=()=>page.locator('#board2d .cursor').evaluate(el=>({x:Number(el.dataset.x),y:Number(el.dataset.y)}));
  const pulse=async index=>{
   await page.evaluate(index=>{const b=window.__testPad.buttons[index];b.pressed=true;b.touched=true;b.value=1;window.__testPad.timestamp++;},index);
   await sleep(70);
   await page.evaluate(index=>{const b=window.__testPad.buttons[index];b.pressed=false;b.touched=false;b.value=0;window.__testPad.timestamp++;},index);
   await sleep(70);
  };
  const stick=async(x,y)=>{
   await page.evaluate(([x,y])=>{window.__testPad.axes[0]=x;window.__testPad.axes[1]=y;window.__testPad.timestamp++;},[x,y]);
   await sleep(210);
   await page.evaluate(()=>{window.__testPad.axes[0]=0;window.__testPad.axes[1]=0;window.__testPad.timestamp++;});
   await sleep(80);
  };

  await stick(1,0);
  assert.deepEqual(await cursor(),{x:5,y:6},`${id}: left stick must move board cursor`);
  await stick(-1,0);
  assert.deepEqual(await cursor(),{x:4,y:6},`${id}: left stick must return board cursor`);

  // Standard Gamepad mapping: D-pad is buttons 12/13/14/15 (up/down/left/right).
  await pulse(15);
  assert.deepEqual(await cursor(),{x:5,y:6},`${id}: D-pad right must move board cursor`);
  await pulse(14);
  assert.deepEqual(await cursor(),{x:4,y:6},`${id}: D-pad left must move board cursor`);

  // A / Cross: select e2, move cursor to e4, commit legal move.
  await pulse(0);
  assert.equal(await page.locator('#board2d .selected').count(),1,`${id}: primary face button must select a piece`);
  await pulse(12);await pulse(12);
  assert.deepEqual(await cursor(),{x:4,y:4},`${id}: D-pad up must navigate two ranks`);
  await pulse(0);
  await page.waitForFunction(async()=>{const {game}=await import('/games/3d-battle-chess/shared-game.js');return game.moves.length===1;});
  assert.equal((await game()).moves[0].from,'e2',`${id}: primary face button must commit selected move`);
  assert.equal((await game()).moves[0].to,'e4');

  // Navigate to e7, select black pawn, B / Circle cancels.
  for(let i=0;i<3;i++)await pulse(12);
  await pulse(0);
  assert.equal(await page.locator('#board2d .selected').count(),1,`${id}: black piece must be selectable on its turn`);
  await pulse(1);
  assert.equal(await page.locator('#board2d .selected').count(),0,`${id}: secondary face button must cancel selection`);

  // X / Square flips board; Y / Triangle toggles view.
  const firstBefore=await page.locator('#board2d [role="gridcell"]').first().evaluate(el=>[el.dataset.x,el.dataset.y]);
  await pulse(2);
  const firstAfter=await page.locator('#board2d [role="gridcell"]').first().evaluate(el=>[el.dataset.x,el.dataset.y]);
  assert.notDeepEqual(firstAfter,firstBefore,`${id}: X/Square must flip the board`);
  await pulse(3);
  await page.waitForFunction(()=>!document.querySelector('#scene').hidden);
  assert.equal(await page.locator('#scene canvas').count(),1,`${id}: Y/Triangle must switch to 3D`);
  await pulse(3);
  await page.waitForFunction(()=>!document.querySelector('#board2d').classList.contains('hidden'));

  // LB/L1 undo and Menu/Options toggle controls.
  await pulse(4);
  assert.equal((await game()).moves.length,0,`${id}: LB/L1 must undo the previous move`);
  await pulse(9);
  assert.equal(await page.locator('#controls').evaluate(el=>el.classList.contains('open')),true,`${id}: Menu/Options must open controls`);
  await pulse(9);
  assert.equal(await page.locator('#controls').evaluate(el=>el.classList.contains('open')),false,`${id}: Menu/Options must close controls`);

  assert.deepEqual(errors,[],`${id}: controller path must not produce page errors`);
  await context.close();
 }

 try{
  await controllerCase('Xbox Wireless Controller');
  await controllerCase('DualSense Wireless Controller');
  console.log('PASS Crown & Ash standard gamepad: Xbox/DualSense left-stick + D-pad navigation, A/Cross select, B/Circle cancel, X/Square flip, Y/Triangle view, LB/L1 undo, Menu/Options controls.');
 }finally{
  await browser.close();server.close();
 }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
