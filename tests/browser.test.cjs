/* Exercise real navigation, rendering, and science controls across responsive layouts. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const output=process.env.PORTFOLIO_QA_DIR;
const failures=[];
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const rel=decodeURIComponent(new URL(req.url,'http://local').pathname);
 let file=path.resolve(root,'.'+rel);
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const bytes=fs.readFileSync(file);res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}
});
async function run(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const args=['--no-sandbox','--disable-dev-shm-usage'];
 if(process.env.PORTFOLIO_BROWSER_SINGLE_PROCESS==='1')args.push('--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader');
 else args.push('--disable-gpu');
 const browser=await chromium.launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,args});
 try{
  const page=await browser.newPage();page.setDefaultTimeout(8000);page.setDefaultNavigationTimeout(15000);
  page.on('pageerror',e=>failures.push(`Runtime: ${e.message}`));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400&&!/games\/evil-wizard/.test(r.url()))failures.push(`HTTP ${r.status()}: ${r.url()}`);});
  if(output)fs.mkdirSync(output,{recursive:true});
  await require('./appearance.test.cjs')({browser,base,output,failures});
  for(const [name,width,height] of [['phone',390,844],['small-phone',320,740],['tablet',820,1180],['desktop',1440,1000]]){
   console.log('Checking '+name);await page.setViewportSize({width,height});await page.goto(base+'/',{waitUntil:'networkidle'});
   console.log('Loaded '+name);assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(16, 20, 22)','Dark theme actually renders');assert.equal(await page.locator('.vnext-world').count(),5,'Five selectable planets');
   for(const label of ['Build','Secure','Automate','Evolve','Architect']){
    const world=page.locator('.vnext-world').filter({has:page.locator('strong',{hasText:label})}).first();
    await world.evaluate(el=>el.click());
    assert.equal(await world.getAttribute('aria-pressed'),'true');
    assert.match((await page.locator('.vnext-sys-meta').textContent())||'',new RegExp(label,'i'));
   }
   assert.equal(await page.locator('.vnext-system-tabs').count(),0,'Top solar capability buttons are removed');
   assert.equal(await page.locator('.vnext-sys-top').count(),0,'Solar top status strip is removed');
   assert.equal(await page.locator('.vnext-cosmos-hint').count(),0,'Solar hint container is removed');
   if(await page.locator('#menu').isVisible()){
    for(let n=0;n<3;n++){
     await page.locator('#menu').click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');assert(await page.locator('#primary-nav').isVisible());
     await page.locator('#menu').click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');assert(!await page.locator('#primary-nav').isVisible());
    }
    await page.locator('#menu').click();await page.keyboard.press('Escape');assert(!await page.locator('#primary-nav').isVisible());
    await page.locator('#menu').click();await page.locator('#primary-nav a[href="index.html#direction"]').click();assert(!await page.locator('#primary-nav').isVisible());
   }
   await page.locator('#search-open').click();await page.locator('#search-input').fill('quantum');assert((await page.locator('#search-results a').count())>0);await page.keyboard.press('Escape');
   await page.locator('.capability-list summary').first().click();assert.equal(await page.locator('.capability-list details').first().getAttribute('open'),'');
   await page.locator('.capability-list summary').first().click();
   await page.locator('#bell-basis').selectOption('YY');await page.locator('#bell-measure').click();assert.match(await page.locator('#bell-result').innerText(),/00 = 0, 01 = \d+, 10 = \d+, 11 = 0/);
   await page.locator('#bell-basis').selectOption('ZZ');await page.locator('#bell-measure').click();assert.match(await page.locator('#bell-result').innerText(),/01 = 0, 10 = 0/);
   await page.locator('#bell-basis').selectOption('ZX');await page.locator('#bell-measure').click();assert.match(await page.locator('#bell-result').innerText(),/1,000 simulated pairs/);
   await page.locator('#bell-basis').selectOption('ZZ');
   await page.locator('#quantum-cube').scrollIntoViewIfNeeded();
   const capture=()=>page.locator('#quantum-cube').evaluate(c=>c.toDataURL());
   let frame=await capture(),animated=false;for(let attempt=0;attempt<6&&!animated;attempt++){await page.waitForTimeout(120);animated=(await capture())!==frame;}assert(animated,'Cubes animate');
   await page.locator('#cube-pause').click();await page.waitForTimeout(80);frame=await capture();await page.waitForTimeout(140);assert.equal(await capture(),frame,'Cube pause stops rendering motion');await page.locator('#cube-pause').click();
   assert.equal(await page.locator('#motion').getAttribute('data-scene-audio'),'','Former motion control is the global ambience mute');await page.waitForTimeout(90);frame=await capture();await page.waitForTimeout(140);assert.notEqual(await capture(),frame,'Global site motion remains active');
   await page.locator('.vnext-cosmos').scrollIntoViewIfNeeded();let positions=await page.locator('.vnext-world').evaluateAll(es=>es.map(e=>e.style.transform));await page.waitForTimeout(140);assert.notDeepEqual(await page.locator('.vnext-world').evaluateAll(es=>es.map(e=>e.style.transform)),positions,'Orbital animation remains active');
   for(const img of await page.locator('main img:visible').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(im=>im.decode());}
   const portrait=page.locator('.portrait-photo img');assert(await portrait.isVisible(),'Portrait is visible over systems artwork');
   const pb=await portrait.boundingBox(),ab=await page.locator('.about-imagery').boundingBox();assert(pb&&ab&&pb.x>=ab.x-2&&pb.x+pb.width<=ab.x+ab.width+2,'Portrait stays inside systems composition');
   assert.equal(await page.locator('.quantum-banner').count(),0,'Quantum banner artwork is removed from the homepage DOM');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name}: no horizontal overflow`);
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
   if(output){await page.screenshot({animations:'disabled',path:path.join(output,`home-${name}.png`),fullPage:true});if(await page.locator('#menu').isVisible()){await page.locator('#menu').click();await page.screenshot({animations:'disabled',path:path.join(output,`menu-${name}.png`)});await page.locator('#menu').click();}}
   await page.locator('#theme').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
   const lightCardSurface=await page.locator('.home-project').first().evaluate(el=>{const s=getComputedStyle(el);return{color:s.backgroundColor,image:s.backgroundImage}});
   const surfaceText=`${lightCardSurface.color} ${lightCardSurface.image}`;
   const alphaValues=[...surfaceText.matchAll(/rgba\([^)]*,\s*([\d.]+)\)/g)].map(m=>Number(m[1]));
   const hasTranslucentLayer=alphaValues.some(alpha=>alpha>0&&alpha<=.60);
   assert(hasTranslucentLayer,`Light project tiles stay translucent, got ${lightCardSurface.color} / ${lightCardSurface.image}`);
   const lightInk=await page.locator('#hero-title').evaluate(el=>getComputedStyle(el).color);
   const lightRgb=(lightInk.match(/\d+/g)||[]).slice(0,3).map(Number);
   assert(lightRgb.length===3&&Math.max(...lightRgb)<80,`Light-mode hero text stays decisively dark, got ${lightInk}`);
   const heroShadow=await page.locator('#hero-title').evaluate(el=>getComputedStyle(el).textShadow);
   assert(!/rgb\(0, 0, 0\)/.test(heroShadow),`Light-mode hero must not use a black outline/shadow, got ${heroShadow}`);
   const solarLabel=page.locator('.vnext-world strong').first();
   const solarShadow=await solarLabel.evaluate(el=>getComputedStyle(el).textShadow);
   const solarColor=await solarLabel.evaluate(el=>getComputedStyle(el).color);
   assert(!/rgb\(0, 0, 0\)/.test(solarShadow),`Light solar labels must not use black halos, got ${solarShadow}`);
   assert.equal(await solarLabel.evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)','Light solar labels remain container-free');
   if(output&&name==='phone'){await page.screenshot({animations:'disabled',path:path.join(output,'home-phone-light.png'),fullPage:true});}
   await page.locator('#theme').click();
   console.log(`PASS ${name}: navigation, planet selectors, search, skills, Bell outcomes, animation and pause, images, theme, layout`);
  }
  // Every project detail page must display a heading and working primary navigation.
  const routes=fs.readdirSync(root).filter(n=>/^project-.*\.html$/.test(n));
  for(const route of routes){
   await page.setViewportSize({width:390,height:844});await page.goto(base+'/'+route,{waitUntil:'networkidle'});
   assert(await page.locator('h1').isVisible(),route+': project heading visible');
   await page.locator('#menu').click();assert(await page.locator('#primary-nav').isVisible(),route+': menu opens');await page.locator('#menu').click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,route+': no overflow');
   if(route==='project-qpe.html'){await page.locator('[data-p=".125,3,0"]').click();assert.match(await page.locator('#qpe-result').innerText(),/Dominant 001 → 0.125000/);assert.equal(await page.locator('#qpe-rows tr').count(),8);}
   if(route==='project-emergent.html'){await page.locator('#step-network').click();assert.match(await page.locator('#network-status').innerText(),/100/);}
   if(route==='project-recovery.html'){await page.locator('#rb').fill('1');await page.locator('#rt').fill('1');await page.locator('#rb').dispatchEvent('input');assert.match(await page.locator('#rs').innerText(),/No gaps/);}
   if(route==='project-dependency.html'){await page.locator('#dn button').filter({hasText:'Internet'}).click();assert.match(await page.locator('#ds').innerText(),/6 downstream/);}
   if(route==='project-lifecycle.html'){await page.locator('#lp').check();assert.match(await page.locator('#lx').innerText(),/Blocked/);}
   if(route==='project-fusion.html'){await page.locator('#fn button').filter({hasText:'Materials'}).click();assert.equal(await page.locator('#ft').innerText(),'Materials');assert(await page.locator('video[controls]').isVisible());}
   if(route==='project-portfolio.html'){await page.locator('#pr').click();assert.match(await page.locator('#ps').innerText(),/6\/6/);}
   if(route==='project-asset-inventory.html'){await page.locator('#ar').click();assert.match(await page.locator('#az').innerText(),/ADDED/);}
   if(route==='project-kubernetes-lab.html'){await page.locator('#ku').fill('0');await page.locator('#kf').check();assert.match(await page.locator('#ks').innerText(),/would pause/);}
   console.log('PASS project '+route);
  }
  await page.goto(base+'/projects.html',{waitUntil:'networkidle'});
  assert.equal(await page.locator('.project-card').count(),16);
  for(const button of await page.locator('.filter-bar button').all()){await button.click();const visible=await page.locator('.project-card:visible').count();assert(visible>0,'Category has visible projects');}
  for(const route of ['learn.html','learn-browse.html','learn-labs.html','learn-paths.html','learn-mastery.html','learn-practice.html','learn-glossary.html','learn-map.html','learn-verify.html','learn-capstones.html','agent-workbench.html','qubit-preview-20260921/']){
   await page.goto(base+'/'+route,{waitUntil:'networkidle'});assert(await page.locator('main h1:visible,main h2:visible').first().isVisible(),route+': visible page heading');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,route+': no overflow');
   if(await page.locator('#mobile-menu').count()){
    await page.locator('#mobile-menu').click();assert(await page.locator('#primary-nav').isVisible());await page.keyboard.press('Escape');assert(!await page.locator('#primary-nav').isVisible());
   }
   assert.equal(await page.locator('.hx-phone-dock,.hx-tablet-rail').count(),0,'No floating navigation');
   console.log('PASS app '+route);
  }
  // Geometry Lab v2: exercise real controls, worker calculations, and research tabs.
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/geometric-lab/index.html',{waitUntil:'networkidle'});
  assert.match(await page.locator('main h1').innerText(),/Scientific ML Lab/,'Geometry Lab v2 heading missing');
  await page.locator('#shape').selectOption('sphere');
  await page.locator('#density').selectOption('600');
  await page.locator('#estimate').click();
  await page.waitForFunction(()=>/Computed .* local differential-geometry fits/.test(document.querySelector('#status')?.textContent||''));
  assert.match(await page.locator('#metrics').innerText(),/K MAE/,'Geometry live-fit metrics missing');
  const sceneBox=await page.locator('#scene').boundingBox();
  await page.locator('#scene').click({position:{x:sceneBox.width/2,y:sceneBox.height/2}});
  assert(await page.locator('#point-inspector').isVisible(),'Geometry point inspector must open from a tap/click');

  await page.locator('[data-tab="topology"]').click();
  assert.match(await page.locator('#mode-title').innerText(),/Gauss–Bonnet/,'Topology experiment did not load');
  await page.locator('#gb-density').selectOption('600');
  await page.locator('#gb-estimate').click();
  await page.waitForFunction(()=>/Integrated .* local curvature estimates/.test(document.querySelector('#status')?.textContent||''));
  assert.match(await page.locator('#metrics').innerText(),/Inferred χ/,'Gauss–Bonnet metrics missing');

  await page.locator('[data-tab="spectrum"]').click();
  await page.locator('#spectrum-l').selectOption('3');
  assert.match(await page.locator('#metrics').innerText(),/Eigenvalue λℓ/,'Spectral metrics missing');
  assert.match(await page.locator('#metrics').innerText(),/Multiplicity\s*7/,'Spectral multiplicity incorrect in UI');

  await page.locator('[data-tab="flow"]').click();
  assert.match(await page.locator('#metrics').innerText(),/Extinction time/,'Curvature-flow metrics missing');
  await page.locator('#flow-play').click();
  await page.waitForTimeout(120);
  assert(Number(await page.locator('#flow-time').inputValue())>0,'Curvature-flow animation must advance time');
  await page.locator('#flow-play').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Geometry Lab v2 must not overflow on phone');
  console.log('PASS Geometry Lab v2: local fit, point inspection, topology, spectrum, flow, phone layout');

  // Exercise the new mastery route and a complete lesson, not just their headings.
  await page.goto(base+'/learn.html',{waitUntil:'networkidle'});
  assert.equal(await page.locator('[data-depth-stage]').count(),8);
  await page.locator('[data-depth-stage="research"]').click();assert.equal(await page.locator('[data-depth-stage="research"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-build-route]').click();await page.waitForURL('**/learn-paths.html?**');
  assert.equal(await page.locator('#learning-depth').count(),0,'Full ladder stays on Learn home');
  assert.match(await page.locator('#depth-context').innerText(),/Doctoral \/ Research/);
  assert(await page.locator('#vnext-path-band').isVisible());
  await page.goto(base+'/learn-browse.html',{waitUntil:'networkidle'});
  await page.locator('.lesson-card[data-popout="0"]').first().click();assert(await page.locator('.lesson-title').isVisible());
  await page.locator('#learner-mode').selectOption('research');
  assert.match(await page.locator('#lesson-page-content').innerText(),/Research|research/);
  await page.locator('#save-current').click();assert.match(await page.locator('#save-current').innerText(),/Saved/);
  await page.locator('[data-home-lesson]').click();assert(!await page.locator('#lesson-view').isVisible());
  await page.setViewportSize({width:1440,height:1000});await page.locator('#mobile-menu').click();assert(await page.locator('#primary-nav').isVisible(),'Desktop learning hamburger works');await page.keyboard.press('Escape');
  console.log('PASS learning: mastery planner, compact paths, research lesson controls, saved progress, navigation');

  // Embedded/in-app browser compatibility is a release requirement, not an external-browser handoff.
  // Smoke the critical site surfaces with representative Messenger, Facebook, and Instagram WebView UAs.
  const embeddedCases=[
   ['messenger-ios','Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/MessengerForiOS;FBAV/530.0.0.0.0]',390,844],
   ['facebook-android','Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/530.0.0.0.0;]',412,915],
   ['instagram-ios','Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 400.0.0.0.0',390,844]
  ];
  const embeddedRoutes=['/','/projects.html','/learn.html','/play-evil-wizard.html','/project-battle-chess.html','/project-geometric-ai.html','/geometric-lab/index.html'];
  for(const [name,userAgent,width,height] of embeddedCases){
   const context=await browser.newContext({viewport:{width,height},userAgent,isMobile:true,hasTouch:true,deviceScaleFactor:1});
   const embedded=await context.newPage();embedded.setDefaultTimeout(8000);embedded.setDefaultNavigationTimeout(15000);
   const embeddedErrors=[];
   embedded.on('pageerror',e=>embeddedErrors.push(`Runtime: ${e.message}`));
   embedded.on('response',res=>{if(res.url().startsWith(base)&&res.status()>=400&&!/games\/evil-wizard/.test(res.url()))embeddedErrors.push(`HTTP ${res.status()}: ${res.url()}`);});
   for(const route of embeddedRoutes){
    await embedded.goto(base+route,{waitUntil:'networkidle'});
    assert(await embedded.locator('body').isVisible(),`${name} ${route}: body visible`);
    assert(await embedded.locator('main h1:visible,main h2:visible').first().isVisible(),`${name} ${route}: primary heading visible`);
    assert.equal(await embedded.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name} ${route}: no horizontal overflow`);
    const menu=embedded.locator('#menu,#mobile-menu').first();
    if(await menu.count()&&await menu.isVisible()){
     await menu.click();assert(await embedded.locator('#primary-nav').isVisible(),`${name} ${route}: hamburger opens`);await embedded.keyboard.press('Escape');
    }
   }
   assert.deepEqual(embeddedErrors,[],`${name}: no embedded-browser runtime/request failures`);
   await context.close();
   console.log(`PASS embedded browser ${name}`);
  }

  assert.deepEqual(failures,[],'No runtime or local request failures');
  console.log('PASS browser regression suite');
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
