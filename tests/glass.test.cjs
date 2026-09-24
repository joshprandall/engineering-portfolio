/* Real rendered surfaces, lesson transitions, and a delayed video decoder/network. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
module.exports = async ({browser,base,output,failures}) => {
 const root = path.resolve(__dirname,'..');
 const context = await browser.newContext({viewport:{width:390,height:844}});
 context.setDefaultTimeout(10000);
 const page = await context.newPage();
 page.on('pageerror',error=>failures.push('Glass: '+error.message));
 const css = (selector,property) => page.locator(selector).first().evaluate((el,p)=>getComputedStyle(el)[p],property);
 const alpha = color => color.startsWith('rgba') ? Number(color.match(/[\d.]+/g)[3]) : 1;
 for(const mode of ['dark','light']) {
  await page.goto(base+'/index.html',{waitUntil:'networkidle'});
  if(await page.locator('html').getAttribute('data-theme')!==mode) await page.locator('[data-theme-toggle]').click();
  await page.locator('.home-project').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const opacity = alpha(await css('.home-project','backgroundColor'));
  assert(opacity>=.5 && opacity<.95,mode+': frosted card has tint and transparency');
  assert(parseFloat(await css('.home-project p','fontSize'))>=17,mode+': comfortable paragraph size');
  assert(parseFloat(await css('.home-project p','fontWeight'))>=500,mode+': substantial paragraph weight');
  assert.equal(await css('.home-project','opacity'),'1','Text does not inherit artwork opacity');
  assert(parseFloat(await css('.home-project','borderRadius'))>=8);
  assert.equal(await css('.vnext-cosmos-scene','backgroundColor'),'rgba(0, 0, 0, 0)','Solar scene floats');
  assert.equal(await css('.vnext-sys-detail','backgroundColor'),'rgba(0, 0, 0, 0)','Solar caption floats');
  assert.equal(await css('.vnext-sys-detail p','textShadow'),'none','No conflicting light text outline');
  assert.equal(await css('.portrait-caption','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert(Number(await css('.portrait-cutout','opacity'))>Number(await css('.systems-photo','opacity')));
  await page.locator('#search-open').click();
  assert.equal(alpha(await css('#search-dialog','backgroundColor')),1,'Opened search is opaque');
  await page.keyboard.press('Escape');
  await page.locator('.portrait-caption').scrollIntoViewIfNeeded();
  await page.locator('.portrait-cutout').evaluate(im=>im.decode());
  if(output) await page.screenshot({path:path.join(output,`glass-portrait-${mode}.png`)});
  await page.goto(base+'/learn.html',{waitUntil:'networkidle'});
  await page.locator('.depth-planner').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  assert(alpha(await css('.depth-planner','backgroundColor'))<.95,'Learning landing tiles are glass');
  if(output) await page.screenshot({path:path.join(output,`glass-learning-${mode}.png`)});
  await page.goto(base+'/learn-labs.html',{waitUntil:'networkidle'});
  assert.equal(await page.locator('html').getAttribute('data-scene-surface'),'solid');
  assert.equal(alpha(await css('.lab-card','backgroundColor')),1,'Lab tiles are opaque');
  await page.goto(base+'/project-qpe.html',{waitUntil:'networkidle'});
  assert.equal(await page.locator('html').getAttribute('data-theme'),mode);
  assert.equal(await css('.scene-backdrop','visibility'),'hidden','Opened project is a solid workspace');
 }
 // Extreme bright and dark scenery must drive actual surface opacity and readable text.
 let backdropColor = 255;
 await context.route('**/assets/scenes/webb-cosmic-cliffs.webp',route=>route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48"><rect width="64" height="48" fill="rgb(${backdropColor},${backdropColor},${backdropColor})"/></svg>`}));
 const opacities=[];
 for(const brightness of [255,0]) {
  backdropColor=brightness;
  await page.goto(base+'/index.html',{waitUntil:'networkidle'});
  if(await page.locator('html').getAttribute('data-theme')!=='dark') await page.locator('[data-theme-toggle]').click();
  await page.locator('.home-project').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  opacities.push(alpha(await css('.home-project','backgroundColor')));
  const contrast=await page.locator('.home-project').first().evaluate((card,brightness)=>{
   const numbers=s=>s.match(/[\d.]+/g).map(Number);
   const fg=numbers(getComputedStyle(card.querySelector('p')).color);
   const bg=numbers(getComputedStyle(card).backgroundColor);
   const veil=numbers(getComputedStyle(document.querySelector('.scene-veil')).backgroundColor);
   const composite=bg.slice(0,3).map((v,i)=>v*bg[3]+(veil[i]*veil[3]+brightness*(1-veil[3]))*(1-bg[3]));
   const lum=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
   return (lum(fg)+.05)/(lum(composite)+.05);
  },brightness);
  assert(contrast>=4.5,'Body text contrast over '+brightness+' scenery: '+contrast);
 }
 assert(opacities[0]>opacities[1],'Brighter night scenery dynamically strengthens glass');
 await context.unroute('**/assets/scenes/webb-cosmic-cliffs.webp');
 // A distinct routed origin exercises real media without external CDN dependencies.
 let releaseNext;
 const delayed = new Promise(resolve=>{releaseNext=resolve;});
 const media = fs.readFileSync(path.join(root,'tests/fixtures/scene-motion.mp4'));
 await context.route('http://portfolio.test/**',async route=>{
  const u=new URL(route.request().url());
  const response=await context.request.get(base+u.pathname+u.search);
  await route.fulfill({response});
 });
 await context.route('https://images.pexels.com/**',route=>route.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(root,'assets/scenes/webb-cosmic-cliffs.webp'))}));
 await context.route('https://videos.pexels.com/**',async route=>{
  if(!route.request().url().includes('33886656')) await delayed;
  await route.fulfill({contentType:'video/mp4',headers:{'access-control-allow-origin':'*'},body:media});
 });
 try {
 await page.goto('http://portfolio.test/index.html',{waitUntil:'domcontentloaded'});
 if(await page.locator('html').getAttribute('data-theme')!=='light') await page.locator('[data-theme-toggle]').click();
 await page.waitForFunction(()=>document.querySelector('#site-scene').dataset.playback==='playing');
 const oldTime=await page.locator('.scene-video-a').evaluate(v=>v.currentTime);
 await page.waitForTimeout(9000);
 assert.equal(await page.locator('.scene-video-a').evaluate(v=>v.paused),false,'Outgoing footage keeps playing during delayed load');
 assert.notEqual(await page.locator('.scene-video-a').evaluate(v=>v.currentTime),oldTime);
 assert.equal(await css('.scene-video-a','opacity'),'1','A delayed video never exposes a blank scene');
 releaseNext();
 await page.waitForFunction(()=>document.querySelector('.scene-day-link').textContent==='Birds over water',{},{timeout:20000});
 await page.waitForTimeout(1600);
 assert.equal(await page.locator('.scene-video-b').evaluate(v=>v.paused),false,'Incoming scene is playing after crossfade');
 assert.equal(await page.locator('.scene-video-a').evaluate(v=>v.paused),true,'Old decoder stops after fade');
 assert.equal(await page.locator('#site-scene').getAttribute('data-contrast'),'sampled','Video frames drive adaptive contrast');
 await page.locator('.scene-options [data-scene-motion]').click();
 assert(await page.locator('.scene-video').evaluateAll(videos=>videos.every(v=>v.paused)),'Pause stops both video layers');
 await page.locator('.scene-options [data-scene-motion]').click();
 await page.waitForFunction(()=>!document.querySelector('.scene-video-b').paused);
 await page.locator('[data-theme-toggle]').click();
 assert(await page.locator('.scene-video').evaluateAll(videos=>videos.every(v=>v.paused)),'Night suspends day decoders');
 } finally {
  releaseNext(); // A failed assertion must not leave a routed request blocking shutdown.
  if(process.env.PORTFOLIO_BROWSER_SINGLE_PROCESS!=='1') await context.close();
 }
 console.log('PASS adaptive glass: card transparency, solid labs/dialogs, floating solar/portrait, delayed video, decoded crossfade, persistent pause');
};
