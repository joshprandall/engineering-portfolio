/* Exercise real navigation, rendering, and science controls across responsive layouts. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||path.join(__dirname,'../staging/website-2.0-runtime'));
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
  const page=await browser.newPage();await page.route('https://**/*',r=>r.abort());page.setDefaultTimeout(8000);page.setDefaultNavigationTimeout(15000);
  page.on('pageerror',e=>failures.push(`Runtime: ${e.message}`));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400&&!/games\/evil-wizard/.test(r.url()))failures.push(`HTTP ${r.status()}: ${r.url()}`);});
  if(output)fs.mkdirSync(output,{recursive:true});
  if(!process.env.PORTFOLIO_SKIP_APPEARANCE)await require('./appearance.test.cjs')({browser,base,output,failures});
  for(const [name,width,height] of [['phone',390,844],['small-phone',320,740],['tablet',820,1180],['desktop',1440,1000]]){
   console.log('Checking '+name);await page.setViewportSize({width,height});await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   console.log('Loaded '+name);assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','Living-scene body stays transparent');assert(await page.locator('.scene-backdrop').isVisible(),'Living background renders behind glass UI');
   await page.waitForFunction(()=>Boolean(window.SitePageScroll));
   assert.equal(await page.locator('.site-page-scroll').count(),1,name+': one shared page scroll control');
   const pageScrollPaint=await page.locator('.site-page-scroll').evaluate(el=>{const s=getComputedStyle(el),t=getComputedStyle(el.firstElementChild);return{background:s.backgroundColor,border:s.borderTopWidth,shadow:s.boxShadow,thumbWidth:parseFloat(t.width),thumbBackground:t.backgroundColor,hidden:el.hidden};});
   assert.equal(pageScrollPaint.background,'rgba(0, 0, 0, 0)',name+': page scroll control has no opaque rail');
   assert.equal(pageScrollPaint.border,'0px',name+': page scroll control has no rail border');
   assert.equal(pageScrollPaint.shadow,'none',name+': page scroll control has no rail shadow');
   assert(pageScrollPaint.thumbWidth>=4,name+': page scroll thumb is visible');
   if(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+2)){
     assert.equal(pageScrollPaint.hidden,false,name+': page scroll thumb is available on scrollable pages');
     const beforeY=await page.evaluate(()=>scrollY);await page.locator('.site-page-scroll-thumb').focus();await page.keyboard.press('PageDown');await page.waitForTimeout(60);assert((await page.evaluate(()=>scrollY))>beforeY,name+': page scroll thumb supports keyboard navigation');await page.evaluate(()=>scrollTo(0,0));
   }
   assert.equal(await page.locator('.solar-navigation[data-solar="portfolio"] .solar-planet-link[aria-label="Home"]').count(),0,'Homepage solar has no Home planet');
   assert.equal((await page.locator('.solar-navigation[data-solar="portfolio"] .solar-descriptor-title').innerText()).trim(),'About Me','Homepage solar defaults to About Me after Home removal');
   assert(await page.locator('#selected-work').isVisible(),'Current home project section renders');
   if(await page.locator('#menu').isVisible()){
    for(let n=0;n<3;n++){
     await page.locator('#menu').click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'true');assert(await page.locator('#primary-nav').isVisible());
     await page.locator('#menu').click();assert.equal(await page.locator('#menu').getAttribute('aria-expanded'),'false');await page.locator('#primary-nav').waitFor({state:'hidden'});
    }
    await page.locator('#menu').click();await page.keyboard.press('Escape');await page.locator('#primary-nav').waitFor({state:'hidden'});
    await page.locator('#menu').click();await page.locator('#primary-nav a[href="index.html"]').click();await page.locator('#primary-nav').waitFor({state:'hidden'});
   }
   await page.locator('#search-open').click();await page.locator('#search-input').fill('quantum');await page.locator('#search-results a').first().waitFor();assert((await page.locator('#search-results a').count())>0);await page.keyboard.press('Escape');
   await page.locator('#bell-basis').selectOption('YY');await page.locator('#bell-measure').click();assert.match(await page.locator('#bell-result').innerText(),/00 = 0, 01 = \d+, 10 = \d+, 11 = 0/);
   await page.locator('#bell-basis').selectOption('ZZ');await page.locator('#bell-measure').click();assert.match(await page.locator('#bell-result').innerText(),/01 = 0, 10 = 0/);
   await page.locator('#bell-basis').selectOption('ZX');await page.locator('#bell-measure').click();assert.match(await page.locator('#bell-result').innerText(),/1,000 simulated pairs/);
   await page.locator('#bell-basis').selectOption('ZZ');
   await page.locator('#quantum-cube').scrollIntoViewIfNeeded();
   const capture=()=>page.locator('#quantum-cube').evaluate(c=>c.toDataURL());
   let frame=await capture(),animated=false;for(let attempt=0;attempt<6&&!animated;attempt++){await page.waitForTimeout(120);animated=(await capture())!==frame;}assert(animated,'Cubes animate');
   await page.locator('#cube-pause').click();await page.waitForTimeout(80);frame=await capture();await page.waitForTimeout(140);assert.equal(await capture(),frame,'Cube pause stops rendering motion');await page.locator('#cube-pause').click();
   assert.equal(await page.locator('header [data-scene-audio]').count(),1,'Header owns the only ambient sound control');await page.waitForTimeout(90);frame=await capture();await page.waitForTimeout(140);assert.notEqual(await capture(),frame,'Global site motion remains active');
   if(name==='phone'){
    const glassCases=[['/','.home-project'],['/projects.html','.project-card'],['/learn.html','.domain-card'],['/learn-browse.html','.lesson-card'],['/learn-paths.html','.path-card'],['/learn-capstones.html','#cap-detail']];
    for(const [route,selector] of glassCases){
     await page.goto(base+route,{waitUntil:'domcontentloaded'});
     const loc=page.locator(selector).first();if(!(await loc.count()))continue;
     const paint=await loc.evaluate(e=>{const c=getComputedStyle(e);return {color:c.backgroundColor,image:c.backgroundImage}});
     const m=paint.color.match(/rgba?\(([^)]+)\)/);let translucent=false;
     if(m){const parts=m[1].split(',').map(x=>Number(x.trim()));const alpha=parts.length>3?parts[3]:1;translucent=alpha>0&&alpha<.6;}
     if(!translucent&&paint.image!=='none'){const alphas=[...paint.image.matchAll(/rgba\([^)]*,\s*([0-9.]+)\)/g)].map(x=>Number(x[1]));translucent=alphas.length>0&&alphas.every(a=>a<.6);}
     assert(translucent,route+' '+selector+' remains genuinely translucent, got '+JSON.stringify(paint));
    }
    await page.goto(base+'/',{waitUntil:'domcontentloaded'});

    const mobileCardCases=[
      ['/', '.contact', '.contact h2'],
      ['/', '.home-project', '.home-project h3'],
      ['/projects.html', '.project-card', '.project-card h2'],
      ['/learn.html', '.domain-card', '.domain-card :is(h2,h3)'],
      ['/game-development.html', '.destination-card', '.destination-card h2, .destination-card h3']
    ];
    for(const [route,cardSelector,copySelector] of mobileCardCases){
      await page.goto(base+route,{waitUntil:'domcontentloaded'});
      const card=page.locator(cardSelector+':visible').first();
      if(!(await card.count()))continue;
      const cardMetrics=await card.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{left:r.left,right:r.right,padL:parseFloat(s.paddingLeft)||0,padR:parseFloat(s.paddingRight)||0,textAlign:s.textAlign};});
      assert(cardMetrics.padL>=18&&cardMetrics.padR>=18,route+' '+cardSelector+': mobile card keeps a real inner gutter '+JSON.stringify(cardMetrics));
      assert.equal(cardMetrics.textAlign,'center',route+' '+cardSelector+': mobile card presentation is centered');
      const copy=page.locator(copySelector+':visible').first();
      if(await copy.count()){
        const m=await copy.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect(),p=el.closest('.contact,.home-project,.project-card,.domain-card,.destination-card')?.getBoundingClientRect();return{textAlign:s.textAlign,left:r.left,right:r.right,width:r.width,cardLeft:p?.left,cardRight:p?.right};});
        assert.equal(m.textAlign,'center',route+' '+copySelector+': card copy is centered');
        assert(m.width>0&&m.left>=(m.cardLeft??m.left)+14&&m.right<=(m.cardRight??m.right)-14,route+' '+copySelector+': copy stays visibly inset from card edges '+JSON.stringify(m));
      }
    }
    await page.goto(base+'/',{waitUntil:'domcontentloaded'});
    const contactAction=page.locator('.contact-actions .button').first();
    assert.equal(await contactAction.evaluate(el=>getComputedStyle(el).justifyContent),'center','Phone contact buttons center their labels');
   }
   if(name==='phone'||name==='small-phone'){
    await page.locator('#direction').scrollIntoViewIfNeeded();
    assert(await page.locator('#education-title').isVisible(),name+': Education heading renders when scrolled into view');
    assert.equal(await page.locator('.education-cards article').count(),3,name+': all three Education cards are present');
    const educationBox=await page.locator('#direction').boundingBox();assert(educationBox&&educationBox.height>300,name+': Education section has rendered content height');
    if(output&&name==='phone')await page.locator('#direction').screenshot({animations:'disabled',path:path.join(output,'education-phone.png')});
   }
   for(const img of await page.locator('main img:visible').all()){await img.scrollIntoViewIfNeeded();try{await img.evaluate(im=>im.decode());}catch(error){throw new Error('Image decode failed: '+(await img.getAttribute('src')).slice(0,180));}}
   const portrait=page.locator('.portrait-photo img');assert(await portrait.isVisible(),'Portrait is visible over systems artwork');
   const pb=await portrait.boundingBox(),ab=await page.locator('.about-imagery').boundingBox();assert(pb&&ab&&pb.x>=ab.x-2&&pb.x+pb.width<=ab.x+ab.width+2,'Portrait stays inside systems composition');
   assert.equal(await page.locator('.quantum-banner').count(),0,'Quantum banner artwork is removed from the homepage DOM');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name}: no horizontal overflow`);
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
   if(output){await page.screenshot({animations:'disabled',path:path.join(output,`home-${name}.png`),fullPage:true});if(await page.locator('#menu').isVisible()){await page.locator('#menu').click();await page.screenshot({animations:'disabled',path:path.join(output,`menu-${name}.png`)});await page.locator('#menu').click();}}
   await page.locator('#theme').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
   const dayScrollPaint=await page.locator('.site-page-scroll').evaluate(el=>({background:getComputedStyle(el).backgroundColor,thumb:getComputedStyle(el.firstElementChild).backgroundColor,width:el.getBoundingClientRect().width,right:innerWidth-el.getBoundingClientRect().right}));
   assert.equal(dayScrollPaint.background,'rgba(0, 0, 0, 0)',name+': Day page scroller retains no rail');
   assert(dayScrollPaint.width<=16&&dayScrollPaint.right>=0,name+': Day page thumb stays slim at the far edge');
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
   if(output&&name==='phone'){await page.screenshot({animations:'disabled',path:path.join(output,'home-phone-light.png'),fullPage:true});}
   await page.locator('#theme').click();
   console.log(`PASS ${name}: navigation, search, selected work, Bell outcomes, animation and pause, images, theme, layout`);
  }
  // Global scene/audio architecture must follow shared-shell pages, not a Home/Learn allowlist.
  for(const route of ['ai-development.html','security-research.html','project-qpe.html','learn-browse.html','lesson.html']){
   await page.setViewportSize({width:390,height:844});await page.goto(base+'/'+route,{waitUntil:'domcontentloaded'});
   await page.locator('#site-scene').waitFor({state:'attached'});
   assert.equal(await page.locator('#site-scene').count(),1,route+': exactly one global scene backdrop');
   assert.equal(await page.locator('header [data-scene-audio]').count(),1,route+': exactly one ambient sound control');
   assert.equal(await page.evaluate(()=>Boolean(window.SiteAudio)),true,route+': SiteAudio is available');
   assert.equal(await page.evaluate(()=>window.SiteAudio.suppressed),false,route+': normal shared-shell page is not audio-suppressed');
  }
  await page.goto(base+'/ai-development.html',{waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(()=>window.SiteAudio?.suppressed),false,'AI Development receives active ambient audio architecture');

  // Day ambience must follow the visual scene as one state machine. The
  // outgoing beach players are hard-muted before the waterfall is committed.
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>window.PortfolioTheme.setTheme('light'));
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light'&&Boolean(window.SiteAudio));
  // Capture each synthetic event synchronously. Otherwise the real scene owner
  // can commit its actual scene between separate cross-process evaluations.
  const transitions=await page.evaluate(()=>{
    const emit=(name,id)=>document.dispatchEvent(new CustomEvent(name,{detail:{id}}));
    emit('portfolio:scene','birds-water');
    const beach={scene:SiteAudio.scene,key:SiteAudio.key};
    emit('portfolio:scene-will-change','forest-waterfall');
    const silenced={pending:SiteAudio.pendingScene,beach:SiteAudio.outputLevels.slice(1)};
    emit('portfolio:scene','forest-waterfall');
    return {beach,silenced,waterfall:{scene:SiteAudio.scene,pending:SiteAudio.pendingScene,key:SiteAudio.key}};
  });
  assert.equal(transitions.beach.scene,'birds-water','Day audio tracks the committed beach scene');
  assert.equal(transitions.beach.key,'beach','Beach scene selects beach ambience');
  assert.equal(transitions.silenced.pending,'forest-waterfall','Audio records the pending visual scene');
  assert(transitions.silenced.beach.every(a=>a.paused&&a.muted&&a.level===0),'Outgoing beach ambience is silent before waterfall becomes visible');
  assert.equal(transitions.waterfall.scene,'forest-waterfall','Committed waterfall scene becomes the audio source of truth');
  assert.equal(transitions.waterfall.pending,'','Pending scene clears after commit');
  assert.equal(transitions.waterfall.key,'waterfall','Waterfall scene selects waterfall ambience immediately');

  // Hamburger navigation is intentionally solid even over moving scenery.
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#menu').click();await page.locator('#primary-nav').waitFor({state:'visible'});
  const menuPaint=await page.locator('#primary-nav').evaluate(el=>{const c=getComputedStyle(el).backgroundColor,m=c.match(/rgba?\(([^)]+)\)/);const p=m?m[1].split(',').map(x=>Number(x.trim())):[];return{color:c,alpha:p.length>3?p[3]:1,backdrop:getComputedStyle(el).backdropFilter||getComputedStyle(el).webkitBackdropFilter||'none'};});
  assert.equal(menuPaint.alpha,1,'Hamburger menu background must be opaque: '+JSON.stringify(menuPaint));
  assert(menuPaint.backdrop==='none'||menuPaint.backdrop==='', 'Hamburger menu must not depend on backdrop translucency: '+JSON.stringify(menuPaint));
  await page.keyboard.press('Escape');

  // Security Research tools execute entirely against local/synthetic inputs.
  await page.goto(base+'/security-research.html',{waitUntil:'domcontentloaded'});
  assert(await page.locator('#security-title').isVisible(),'Security Research heading is visible');
  for(const id of ['vuln-run','fuzz-run','linux-run','ad-run','container-run','surface-run']){await page.locator('#'+id).click();}
  for(const id of ['vuln-output','fuzz-output','linux-output','ad-output','container-output','surface-output'])assert(await page.locator('#'+id+' h3').first().isVisible(),id+': interactive analysis produced output');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Security Research has no phone-width horizontal overflow');
  console.log('PASS global runtime, solid menu, AI ambience and Security Research tools');

  // Every project detail page must display a heading and working primary navigation.
  const routes=fs.readdirSync(root).filter(n=>/^project-.*\.html$/.test(n));
  for(const route of routes){
   await page.setViewportSize({width:390,height:844});await page.goto(base+'/'+route,{waitUntil:'domcontentloaded'});
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
  await page.goto(base+'/projects.html',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.project-card').count(),16);
  for(const button of await page.locator('.filter-bar button').all()){await button.click();const visible=await page.locator('.project-card:visible').count();assert(visible>0,'Category has visible projects');}
  for(const route of ['learn.html','learn-browse.html','learn-labs.html','learn-paths.html','learn-mastery.html','learn-practice.html','learn-glossary.html','learn-map.html','learn-verify.html','learn-capstones.html','agent-workbench.html','qubit-preview-20260921/']){
   await page.goto(base+'/'+route,{waitUntil:'domcontentloaded'});assert(await page.locator('main h1:visible,main h2:visible').first().isVisible(),route+': visible page heading');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,route+': no overflow');
   if(await page.locator('#mobile-menu').count()){
    await page.locator('#mobile-menu').click();assert(await page.locator('#primary-nav').isVisible());await page.keyboard.press('Escape');await page.locator('#primary-nav').waitFor({state:'hidden'});
   }
   assert.equal(await page.locator('.hx-phone-dock,.hx-tablet-rail').count(),0,'No floating navigation');
   console.log('PASS app '+route);
  }
  // Exercise the new mastery route and a complete lesson, not just their headings.
  await page.goto(base+'/learn.html',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('[data-depth-stage]').count(),8);
  await page.locator('[data-depth-stage="research"]').click();assert.equal(await page.locator('[data-depth-stage="research"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-build-route]').click();await page.waitForURL('**/learn-paths.html?**');
  assert.equal(await page.locator('#learning-depth').count(),0,'Full ladder stays on Learn home');
  assert.match(await page.locator('#depth-context').innerText(),/Doctoral \/ Research/);
  const depthTitle=(await page.locator('#depth-context strong').innerText()).trim(),depthSummary=(await page.locator('#depth-context [data-depth-summary]').innerText()).trim();
  assert(!depthSummary.startsWith(depthTitle),`Target-depth summary must not repeat "${depthTitle}"`);
  assert.equal(await page.locator('#depth-context [data-depth-summary]').getAttribute('data-depth-summary'),'compact');
  assert(await page.locator('#vnext-path-band').isVisible());
  await page.goto(base+'/learn-browse.html',{waitUntil:'domcontentloaded'});
  await page.locator('.lesson-card[data-popout="0"]').first().click();await page.waitForURL('**/lesson.html?**');assert(await page.locator('.lesson-title').isVisible());
  await page.locator('#learner-mode').selectOption('research');
  assert.match(await page.locator('#lesson-page-content').innerText(),/Research|research/);
  await page.locator('#save-current').click();assert.match(await page.locator('#save-current').innerText(),/Saved/);
  await page.locator('[data-home-lesson]').click();await page.waitForURL('**/learn.html');assert(!await page.locator('#lesson-view').isVisible());
  await page.setViewportSize({width:1440,height:1000});await page.locator('#mobile-menu').click();assert(await page.locator('#primary-nav').isVisible(),'Desktop learning hamburger works');await page.keyboard.press('Escape');
  console.log('PASS learning: mastery planner, compact paths, research lesson controls, saved progress, navigation');

  // Embedded/in-app browser compatibility is a release requirement, not an external-browser handoff.
  // Smoke the critical site surfaces with representative Messenger, Facebook, and Instagram WebView UAs.
  const embeddedCases=[
   ['messenger-ios','Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/MessengerForiOS;FBAV/530.0.0.0.0]',390,844],
   ['facebook-android','Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/530.0.0.0.0;]',412,915],
   ['instagram-ios','Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 400.0.0.0.0',390,844]
  ];
  const embeddedRoutes=['/','/projects.html','/security-research.html','/learn.html','/play-evil-wizard.html','/project-battle-chess.html','/project-geometric-ai.html'];
  for(const [name,userAgent,width,height] of embeddedCases){
   const context=await browser.newContext({viewport:{width,height},userAgent,isMobile:true,hasTouch:true,deviceScaleFactor:1});
   const embedded=await context.newPage();embedded.setDefaultTimeout(8000);embedded.setDefaultNavigationTimeout(15000);
   const embeddedErrors=[];
   embedded.on('pageerror',e=>embeddedErrors.push(`Runtime: ${e.message}`));
   embedded.on('response',res=>{if(res.url().startsWith(base)&&res.status()>=400&&!/games\/evil-wizard/.test(res.url()))embeddedErrors.push(`HTTP ${res.status()}: ${res.url()}`);});
   for(const route of embeddedRoutes){
    await embedded.goto(base+route,{waitUntil:'domcontentloaded'});
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
