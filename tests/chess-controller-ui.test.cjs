const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');

const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||path.join(__dirname,'../staging/website-2.0-runtime'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep))throw Error('outside');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.addInitScript(()=>{
  const buttons=Array.from({length:18},()=>({pressed:false,touched:false,value:0}));
  const pad={id:'Xbox Wireless Controller',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons};
  Object.defineProperty(window,'__testPad',{value:pad,writable:false});
  Object.defineProperty(navigator,'getGamepads',{value:()=>[pad],configurable:true});
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/games/3d-battle-chess/`,{waitUntil:'networkidle'});

 const pulse=async index=>{
  await page.evaluate(index=>{const b=window.__testPad.buttons[index];b.pressed=true;b.touched=true;b.value=1;window.__testPad.timestamp++;},index);
  await sleep(70);
  await page.evaluate(index=>{const b=window.__testPad.buttons[index];b.pressed=false;b.touched=false;b.value=0;window.__testPad.timestamp++;},index);
  await sleep(90);
 };
 const activeId=()=>page.evaluate(()=>document.activeElement?.id||document.activeElement?.tagName||'');

 await pulse(13);
 assert.equal(await activeId(),'setupMode','D-pad down must enter setup focus navigation');
 for(let i=0;i<7;i++)await pulse(13);
 assert.equal(await activeId(),'startGameBtn','controller focus must reach Start Game without keyboard or mouse');
 await pulse(0);
 await page.waitForFunction(()=>!document.querySelector('#gameShell').classList.contains('hidden'));
 assert.equal(await page.locator('#gameShell').getAttribute('aria-hidden'),'false','A/Cross on Start Game must launch the match');

 await pulse(9);
 await page.waitForFunction(()=>document.querySelector('#controls').classList.contains('open'));
 assert.equal(await activeId(),'mode','opening the game menu from controller must focus its first control');
 await pulse(13);
 assert.equal(await activeId(),'theme','D-pad down must navigate game-menu controls');
 await pulse(1);
 assert.equal(await page.locator('#controls').evaluate(el=>el.classList.contains('open')),false,'B/Circle must close the game menu');
 assert.equal(await activeId(),'menuBtn','closing the game menu must return focus to its opener');

 assert.deepEqual(errors,[],'controller UI path must not create page errors');
 console.log('PASS Crown & Ash controller-first setup and in-game menu focus navigation.');
 await context.close();await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
