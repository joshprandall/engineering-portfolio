const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||path.join(__dirname,'..'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
    const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+path.sep))throw Error('outside');
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  }catch{
    res.writeHead(404);
    res.end();
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

  const evidence={
    profile:'constrained-auto-quality',
    emulatedHardwareConcurrency:2,
    emulatedDeviceMemoryGiB:4,
    cpuThrottleRate:4,
    deviceScaleFactor:2
  };

  try{
    const context=await browser.newContext({
      viewport:{width:1280,height:720},
      deviceScaleFactor:2
    });
    await context.addInitScript(()=>{
      try{Object.defineProperty(navigator,'hardwareConcurrency',{configurable:true,get:()=>2});}catch{}
      try{Object.defineProperty(navigator,'deviceMemory',{configurable:true,get:()=>4});}catch{}
    });

    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{
      if(message.type()==='error')errors.push('console: '+message.text());
    });

    const cdp=await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});

    let started=Date.now();
    await page.goto(base+'/games/3d-battle-chess/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#startGameBtn').waitFor({state:'visible',timeout:12000});
    evidence.setupReadyMs=Date.now()-started;

    await page.locator('#setupMode').selectOption('local');
    await page.locator('#setupView').selectOption('3d');
    await page.locator('#setupQuality').selectOption('auto');
    if(await page.locator('#setupSound').isChecked())await page.locator('#setupSound').uncheck();

    started=Date.now();
    await page.locator('#startGameBtn').click();
    await page.locator('#scene canvas').waitFor({state:'visible',timeout:15000});
    await page.waitForFunction(()=>document.querySelector('#board2d')?.children.length===64,{},{timeout:15000});
    evidence.gameReadyMs=Date.now()-started;

    evidence.renderScale=await page.evaluate(()=>{
      const canvas=document.querySelector('#scene canvas');
      if(!canvas)return null;
      const rect=canvas.getBoundingClientRect();
      return Number((canvas.width/Math.max(1,rect.width)).toFixed(2));
    });

    const toggleTimes=[];
    for(let i=0;i<4;i++){
      const target=i%2===0?'#board2d':'#scene canvas';
      started=Date.now();
      await page.keyboard.press('v');
      await page.locator(target).waitFor({state:'visible',timeout:5000});
      toggleTimes.push(Date.now()-started);
    }
    evidence.maxViewToggleMs=Math.max(...toggleTimes);
    evidence.viewToggleMs=toggleTimes;

    started=Date.now();
    await page.evaluate(()=>{
      const input=document.querySelector('#moveInput');
      input.value='e2e4';
      document.querySelector('#moveForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    });
    await page.waitForFunction(()=>document.querySelectorAll('#log li').length===1,{},{timeout:4000});
    evidence.moveResponseMs=Date.now()-started;

    const finalState=await page.evaluate(()=>({
      boardSquares:document.querySelector('#board2d')?.children.length||0,
      canvas:!!document.querySelector('#scene canvas'),
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth
    }));
    evidence.finalState=finalState;

    assert(evidence.setupReadyMs<12000,'Constrained setup must become interactive within 12s');
    assert(evidence.gameReadyMs<15000,'Constrained 3D game must become playable within 15s');
    assert(evidence.renderScale!==null&&evidence.renderScale<=1.25,'Auto quality must downshift render scale on constrained hardware');
    assert(evidence.maxViewToggleMs<5000,'2D/3D view toggles must remain responsive under CPU throttling');
    assert(evidence.moveResponseMs<4000,'A legal move must render promptly under CPU throttling');
    assert.equal(finalState.boardSquares,64,'Chess board must remain complete');
    assert.equal(finalState.canvas,true,'3D renderer must remain available');
    assert.equal(finalState.horizontalOverflow,false,'Constrained desktop viewport must not overflow horizontally');
    assert.deepEqual(errors,[],'No page or console errors are allowed');

    console.log('PASS Crown & Ash constrained-hardware performance/compatibility gate');
    console.log(JSON.stringify(evidence,null,2));
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
