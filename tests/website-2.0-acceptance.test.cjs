const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||'.');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server=http.createServer((req,res)=>{
  const rel=decodeURIComponent(new URL(req.url,'http://portfolio.test').pathname);
  let file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
  try{
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    const bytes=fs.readFileSync(file);
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
    res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found');}
});

(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port;
  const base=`http://portfolio.test:${port}`;
  const chrome=process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined;
  const browser=await chromium.launch({
    headless:true,
    executablePath:chrome,
    args:['--no-sandbox','--disable-dev-shm-usage',`--host-resolver-rules=MAP portfolio.test 127.0.0.1`]
  });

  try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    page.setDefaultTimeout(10000);

    // Exercise the real video/audio browser paths without depending on a CDN.
    const videoFixture=fs.readFileSync(path.join(root,'assets/fusion-presentation.mp4'));
    const audioFixture=fs.readFileSync(path.join(root,'assets/audio/dark-theme-user.wav'));
    await page.route('**/assets/scenes/day/*.mp4',route=>route.fulfill({status:200,contentType:'video/mp4',body:videoFixture}));
    await page.route('**/assets/audio/day/*.ogg',route=>route.fulfill({status:200,contentType:'audio/wav',body:audioFixture}));
    await page.route('https://**/*',route=>route.abort());

    await page.goto(base+'/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>Boolean(window.PortfolioTheme&&window.SiteAudio&&document.querySelector('#site-scene')));

    // Homepage/navigation contract.
    assert.equal(await page.locator('.solar-navigation[data-solar="portfolio"] .solar-planet-link').count(),6,'Homepage solar has exactly six destinations');
    assert.equal(await page.locator('.solar-navigation[data-solar="portfolio"] [aria-label="Home"]').count(),0,'Homepage solar has no Home planet');
    assert.equal((await page.locator('.solar-descriptor-title').innerText()).trim(),'About Me','Homepage defaults to About Me tile');
    await page.locator('#menu').click();
    const menu=await page.locator('#primary-nav').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,backdrop:getComputedStyle(el).backdropFilter||'none'}));
    assert(!/rgba\([^)]*,\s*0\.?\d*\)/.test(menu.bg),'Hamburger menu is opaque');
    assert(menu.backdrop==='none'||menu.backdrop==='','Hamburger menu has no translucent backdrop');
    await page.keyboard.press('Escape');

    // Day contract: real video element is actually playing, not just a moving poster.
    await page.evaluate(()=>PortfolioTheme.setTheme('light'));
    await page.waitForFunction(()=>{
      const v=document.querySelector('.scene-video.is-active');
      return v&&v.readyState>=2&&!v.paused&&v.currentTime>=0;
    },null,{timeout:15000});
    const day=await page.locator('.scene-video.is-active').evaluate(v=>({paused:v.paused,ready:v.readyState,src:new URL(v.currentSrc).pathname}));
    assert.equal(day.paused,false,'Day background video is playing');
    assert(day.ready>=2,'Day background video has decoded media');
    assert.match(day.src,/assets\/scenes\/day\/(waterfall|river|beach-birds)\.mp4$/,'Day background uses same-origin scene media');

    // Day audio contract: scene is the single source of truth and old ambience is silent before commit.
    await page.evaluate(()=>{SiteAudio.setMuted(false);SiteAudio.setVolume(.05);});
    for(const [from,to,key] of [
      ['birds-water','forest-waterfall','waterfall'],
      ['forest-waterfall','forest-river','river'],
      ['forest-river','birds-water','beach']
    ]){
      await page.evaluate(id=>document.dispatchEvent(new CustomEvent('portfolio:scene',{detail:{id}})),from);
      await page.evaluate(id=>document.dispatchEvent(new CustomEvent('portfolio:scene-will-change',{detail:{id}})),to);
      const pre=await page.evaluate(()=>({
        pending:SiteAudio.pendingScene,
        primary:{paused:SiteAudio.element?.paused,muted:SiteAudio.element?.muted,volume:SiteAudio.element?.volume},
        beach:SiteAudio.beachElements.map(a=>({paused:a.paused,muted:a.muted,volume:a.volume}))
      }));
      assert.equal(pre.pending,to,'Outgoing ambience knows the pending visual scene');
      if(from==='birds-water') assert(pre.beach.every(a=>a.paused&&a.muted&&a.volume===0),'Bird ambience is fully silent before visual switch');
      await page.evaluate(id=>document.dispatchEvent(new CustomEvent('portfolio:scene',{detail:{id}})),to);
      assert.equal(await page.evaluate(()=>SiteAudio.key),key,`${to} selects ${key} ambience`);
      assert.equal(await page.evaluate(()=>SiteAudio.pendingScene),'','Pending audio handoff clears on visual commit');
    }

    // Sound control contract.
    assert.equal(await page.evaluate(()=>SiteAudio.maxVolume),1,'Sound slider may reach 100% when user chooses');
    assert(Math.abs((await page.evaluate(()=>SiteAudio.volume))-.05)<.001,'Default/selected background level is 5%');
    await page.evaluate(()=>SiteAudio.setVolume(.37));
    assert(Math.abs((await page.evaluate(()=>SiteAudio.volume))-.37)<.001,'Sound slider value is honored');
    await page.evaluate(()=>SiteAudio.setMuted(true));
    assert.equal(await page.evaluate(()=>SiteAudio.muted),true,'Mute works');
    await page.evaluate(()=>SiteAudio.setMuted(false));

    // Night contract: fitted moving camera + independent visible twinkle canvas.
    await page.evaluate(()=>PortfolioTheme.setTheme('dark'));
    const before=await page.evaluate(()=>{
      const night=document.querySelector('.scene-night'),canvas=document.querySelector('.scene-canvas'),veil=document.querySelector('.scene-veil'),backdrop=document.querySelector('#site-scene');
      const nr=night.getBoundingClientRect(),br=backdrop.getBoundingClientRect();
      return {
        transform:getComputedStyle(night).transform,
        canvas:canvas.toDataURL(),
        canvasZ:Number(getComputedStyle(canvas).zIndex),
        veilZ:Number(getComputedStyle(veil).zIndex),
        covers:nr.left<=br.left&&nr.top<=br.top&&nr.right>=br.right&&nr.bottom>=br.bottom
      };
    });
    await page.waitForTimeout(1200);
    const after=await page.evaluate(()=>{
      const night=document.querySelector('.scene-night'),canvas=document.querySelector('.scene-canvas'),backdrop=document.querySelector('#site-scene');
      const nr=night.getBoundingClientRect(),br=backdrop.getBoundingClientRect();
      return {transform:getComputedStyle(night).transform,canvas:canvas.toDataURL(),covers:nr.left<=br.left&&nr.top<=br.top&&nr.right>=br.right&&nr.bottom>=br.bottom};
    });
    assert(before.covers&&after.covers,'Night background remains fitted throughout pan');
    assert.notEqual(after.transform,before.transform,'Night camera moves');
    assert.notEqual(after.canvas,before.canvas,'Night stars visibly twinkle/move');
    assert(before.canvasZ>before.veilZ,'Twinkle canvas is above readability veil');

    // Cross-page shared-shell contract.
    for(const route of ['ai-development.html','security-research.html','projects.html','learn.html']){
      await page.goto(base+'/'+route,{waitUntil:'domcontentloaded'});
      assert.equal(await page.locator('#site-scene').count(),1,route+': exactly one shared background');
      assert.equal(await page.locator('header [data-scene-audio]').count(),1,route+': exactly one sound control');
      assert.equal(await page.evaluate(()=>Boolean(window.SiteAudio)),true,route+': shared SiteAudio runtime exists');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,route+': no horizontal overflow on phone');
    }

    console.log('PASS WEBSITE 2.0 ACCEPTANCE: Day video, Day audio sync, Night motion/twinkle, sound, solar, navigation, shared-shell pages.');
    await context.close();
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
