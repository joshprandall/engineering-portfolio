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

 async function focusCase(id){
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
  const pulse=async index=>{
   await page.evaluate(index=>{const b=window.__testPad.buttons[index];b.pressed=true;b.touched=true;b.value=1;window.__testPad.timestamp++;},index);
   await sleep(260);
   await page.evaluate(index=>{const b=window.__testPad.buttons[index];b.pressed=false;b.touched=false;b.value=0;window.__testPad.timestamp++;},index);
   await sleep(260);
  };
  const activeId=()=>page.evaluate(()=>document.activeElement?.id||'');

  await pulse(13);
  assert.equal(await activeId(),'setupMode',`${id}: first controller navigation must enter setup controls`);
  await pulse(0);
  assert.equal(await page.locator('#setupMode').inputValue(),'local',`${id}: A/Cross must change focused setup select`);
  await pulse(13);await pulse(13);await pulse(13);
  assert.equal(await activeId(),'setupView',`${id}: D-pad must reach board selector`);
  await pulse(0);
  assert.equal(await page.locator('#setupView').inputValue(),'2d',`${id}: A/Cross must cycle board selector`);
  await pulse(13);await pulse(13);await pulse(13);
  assert.equal(await activeId(),'startGameBtn',`${id}: D-pad must reach Begin Battle`);
  await pulse(0);
  await page.waitForFunction(()=>document.body.classList.contains('playing')&&document.querySelector('#board2d').children.length===64);
  await page.waitForFunction(()=>!!document.querySelector('#scene canvas'),{},{timeout:15000});

  await pulse(9);
  assert.equal(await page.locator('#controls').evaluate(el=>el.classList.contains('open')),true,`${id}: Start/Options must open game menu`);
  assert.equal(await activeId(),'mode',`${id}: opening game menu must focus its first control`);
  await pulse(13);
  assert.equal(await activeId(),'theme',`${id}: D-pad must move focus inside game menu`);
  await pulse(1);
  assert.equal(await page.locator('#controls').evaluate(el=>el.classList.contains('open')),false,`${id}: B/Circle must close game menu`);

  await page.evaluate(()=>{
   const input=document.querySelector('#fenInput');input.value='7k/P7/8/8/8/8/8/7K w - - 0 1';
   document.querySelector('#loadFen').click();
  });
  for(let i=0;i<4;i++)await pulse(14);
  for(let i=0;i<5;i++)await pulse(12);
  await pulse(0);await pulse(12);await pulse(0);
  await page.waitForFunction(()=>!document.querySelector('#promotion').classList.contains('hidden'));
  await pulse(13);await pulse(0);
  await page.waitForFunction(async()=>{const {game}=await import('/games/3d-battle-chess/shared-game.js');return game.piece(0,0)?.t==='r';});

  await page.evaluate(()=>{
   const input=document.querySelector('#fenInput');input.value='7k/5Q2/6K1/8/8/8/8/8 w - - 0 1';
   document.querySelector('#loadFen').click();
  });
  for(let i=0;i<5;i++)await pulse(15);
  await pulse(13);await pulse(0);await pulse(15);await pulse(0);
  await page.waitForFunction(()=>!document.querySelector('#gameOver').classList.contains('hidden'));
  assert.equal(await activeId(),'rematch',`${id}: game-over dialog must focus Rematch`);
  await pulse(13);
  assert.equal(await activeId(),'resultSetup',`${id}: D-pad must move to Match Setup`);
  await pulse(0);
  await page.waitForFunction(()=>!document.querySelector('#setupScreen').classList.contains('hidden')&&!document.body.classList.contains('playing'));
  assert.deepEqual(errors,[],`${id}: controller UI focus path must not produce page errors`);
  await context.close();
 }

 try{
  await focusCase('Xbox Wireless Controller');
  await focusCase('DualSense Wireless Controller');
  console.log('PASS Crown & Ash controller UI focus: setup, menu, promotion, and result dialogs are operable with Xbox/DualSense-compatible controls.');
 }finally{
  await browser.close();server.close();
 }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
