'use strict';
// Owner visual freeze: academy research JSON stays non-rendered review material.
// No new teaser, top-level program tile, section, controls, or styling is permitted.
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const out=process.env.AI_QA_DIR||path.join(root,'qa-visual-freeze');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
 let p;
 try{p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));}catch{res.writeHead(400);res.end();return;}
 if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');const bytes=fs.readFileSync(p);res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(bytes);}catch{res.writeHead(404);res.end();}
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome',args:['--no-sandbox','--disable-gpu']});
 try{
  fs.mkdirSync(out,{recursive:true});
  for(const [mode,width,height] of [['phone',390,844],['desktop',1440,900]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
   const page=await context.newPage();
   const exceptions=[],failed=[];
   page.on('pageerror',e=>exceptions.push(e.message));
   page.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400&&!r.url().endsWith('/favicon.ico')&&!/\/assets\/(audio|scenes)\//.test(r.url()))failed.push(r.status()+' '+r.url())});
   await page.route('https://**/*',route=>route.abort());
   await page.goto(url+'/learn.html',{waitUntil:'domcontentloaded',timeout:25000});
   await page.locator('.academy-overview .academy-program-card').first().waitFor({state:'visible',timeout:25000});
   assert.equal(await page.locator('.academy-overview .academy-program-card').count(),7,mode+': preserve seven existing programs');
   assert.equal(await page.locator('[data-ai-path-teaser]').count(),0,mode+': no appended teaser');
   assert.equal(await page.locator('#ai-research-roadmap').count(),0,mode+': no inserted section');
   await page.screenshot({path:path.join(out,mode+'-learn-no-new-ui.png'),fullPage:true,animations:'disabled'});
   await page.goto(url+'/learn-paths.html',{waitUntil:'domcontentloaded',timeout:25000});
   await page.locator('main').waitFor({state:'visible',timeout:25000});
   assert.equal(await page.locator('#ai-research-roadmap').count(),0,mode+': draft pathway must not render');
   assert.equal(await page.locator('[data-ai-evidence],[data-ai-checkpoint]').count(),0,mode+': no draft forms injected');
   assert.equal(await page.locator('[data-ai-path-teaser]').count(),0,mode+': no draft teaser');
   const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert(overflow.scroll<=overflow.viewport+1,mode+': horizontal overflow '+JSON.stringify(overflow));
   assert.equal(exceptions.length,0,mode+': JS page errors '+exceptions.join(' | '));
   assert.equal(failed.length,0,mode+': unexpected core requests '+failed.join(' | '));
   await page.screenshot({path:path.join(out,mode+'-paths-no-new-ui.png'),fullPage:true,animations:'disabled'});
   await context.close();
   console.log('PASS '+mode+': seven unchanged program cards, no research teaser, no extra sections or controls, zero JS errors/new-feature 404s or overflow');
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error('FAIL',e.stack||e);server.close();process.exitCode=1;});
