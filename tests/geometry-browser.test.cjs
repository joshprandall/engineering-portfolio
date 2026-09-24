const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const rel=decodeURIComponent(new URL(req.url,'http://local').pathname);
  let file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return}
  try{
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  }catch{res.writeHead(404);res.end('Not found')}
});

async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({
    headless:true,
    executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    page.setDefaultTimeout(15000);
    const errors=[];
    page.on('pageerror',e=>errors.push('Runtime: '+e.message));
    page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push('HTTP '+r.status()+': '+r.url())});

    await page.goto(base+'/geometric-lab/index.html',{waitUntil:'networkidle'});
    assert.match(await page.locator('main h1').innerText(),/Scientific ML Lab/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'390px layout overflow');

    await page.locator('#shape').selectOption('sphere');
    await page.locator('#density').selectOption('600');
    await page.locator('#estimate').click();
    await page.waitForFunction(()=>/Computed .* local differential-geometry fits/.test(document.querySelector('#status')?.textContent||''));
    const fitText=await page.locator('#metrics').innerText();
    assert.match(fitText,/K MAE/);assert.match(fitText,/K RMSE/);assert.match(fitText,/95% \|K error\|/);

    const box=await page.locator('#scene').boundingBox();
    await page.locator('#scene').click({position:{x:box.width/2,y:box.height/2}});
    assert(await page.locator('#point-inspector').isVisible(),'Point inspector did not open');
    assert.match(await page.locator('#point-inspector').innerText(),/Estimated K/);

    await page.locator('#display').selectOption('mean');
    assert.match(await page.locator('#legend-title').innerText(),/Mean curvature/);
    await page.locator('#display').selectOption('kmax');
    assert.match(await page.locator('#legend-title').innerText(),/principal-curvature/);

    await page.locator('[data-tab="topology"]').click();
    assert.match(await page.locator('#mode-title').innerText(),/Gauss–Bonnet/);
    assert.match(await page.locator('#metrics').innerText(),/Inferred χ/);
    await page.locator('#gb-density').selectOption('600');
    await page.locator('#gb-estimate').click();
    await page.waitForFunction(()=>/Integrated .* local curvature estimates/.test(document.querySelector('#status')?.textContent||''));
    await page.locator('#gb-shape').selectOption('torus');
    const topoText=await page.locator('#metrics').innerText();
    assert.match(topoText,/Expected 2πχ/);

    await page.locator('[data-tab="spectrum"]').click();
    await page.locator('#spectrum-l').selectOption('3');
    const spectrumText=await page.locator('#metrics').innerText();
    assert.match(spectrumText,/Eigenvalue λℓ/);
    assert.match(spectrumText,/Multiplicity\s*7/);

    await page.locator('[data-tab="flow"]').click();
    assert.match(await page.locator('#metrics').innerText(),/Extinction time/);
    await page.locator('#flow-play').click();
    await page.waitForTimeout(150);
    assert(Number(await page.locator('#flow-time').inputValue())>0,'Curvature flow did not advance');
    await page.locator('#flow-play').click();

    await page.locator('[data-tab="diffusion"]').click();
    assert.match(await page.locator('#metrics').innerText(),/Timescale/);
    await page.locator('[data-tab="inverse"]').click();
    assert(await page.locator('#posterior-chart').isVisible(),'Posterior chart missing');

    await page.setViewportSize({width:320,height:740});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'320px layout overflow');

    for(const [name,userAgent,width,height] of [
      ['messenger-ios','Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/MessengerForiOS;FBAV/530.0.0.0.0]',390,844],
      ['facebook-android','Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/530.0.0.0.0;]',412,915],
      ['instagram-ios','Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 400.0.0.0.0',390,844]
    ]){
      const context=await browser.newContext({viewport:{width,height},userAgent,isMobile:true,hasTouch:true,deviceScaleFactor:1});
      const p=await context.newPage();
      const embeddedErrors=[];
      p.on('pageerror',e=>embeddedErrors.push(e.message));
      await p.goto(base+'/geometric-lab/index.html',{waitUntil:'networkidle'});
      assert(await p.locator('main h1').isVisible(),name+': heading missing');
      assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,name+': horizontal overflow');
      await p.locator('[data-tab="topology"]').tap();
      assert.match(await p.locator('#mode-title').innerText(),/Gauss–Bonnet/,name+': research navigation failed');
      assert.deepEqual(embeddedErrors,[],name+': runtime errors');
      await context.close();
    }

    assert.deepEqual(errors,[],'Geometry Lab emitted runtime/request errors');
    console.log('PASS Geometry Lab v2 browser suite');
  }finally{
    await browser.close();
    server.close();
  }
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
