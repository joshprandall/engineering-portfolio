'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const out=process.env.AI_QA_DIR||path.resolve(root,'qa-open-learning');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ttf':'font/ttf','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
  let target;
  try{target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));}catch{res.writeHead(400);res.end();return;}
  if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');const data=fs.readFileSync(target);res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end('Missing');}
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome',args:['--no-sandbox','--disable-gpu']});
 try{
  fs.mkdirSync(out,{recursive:true});
  for(const [kind,width,height] of [['phone',390,844],['desktop',1440,900]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
   const page=await context.newPage();
   const errors=[],httpFailures=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',res=>{if(res.url().startsWith(base)&&res.status()>=400&&!res.url().endsWith('/favicon.ico'))httpFailures.push(res.status()+' '+res.url());});
   await page.route('https://**/*',route=>route.abort());
   await page.goto(base+'/learn-paths.html#ai-research-roadmap',{waitUntil:'domcontentloaded',timeout:25000});
   await page.locator('#ai-research-roadmap .academy-module').first().waitFor({state:'visible',timeout:25000});
   assert.equal(await page.locator('#ai-research-roadmap details.academy-module').count(),10,kind+': ten modules');
   assert.equal(await page.locator('#ai-research-roadmap a[target="_blank"]').count()>=20,true,kind+': direct external materials');
   assert.equal(await page.locator('#ai-research-progress').innerText(),'0 of 10 stages self-attested with evidence on this browser. Not a grade or certificate.');
   const first=page.locator('input[data-ai-evidence]').first();
   await first.check();
   assert.match(await page.locator('#ai-research-progress').innerText(),/^1 of 10/);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#ai-research-roadmap .academy-module').first().waitFor({state:'visible',timeout:25000});
   assert.equal(await page.locator('input[data-ai-evidence]').first().isChecked(),true,kind+': evidence persists');
   await page.locator('input[data-ai-evidence]').first().uncheck();
   assert.match(await page.locator('#ai-research-progress').innerText(),/^0 of 10/);
   const overlap=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert(overlap.scroll<=overlap.viewport+1,kind+': no horizontal overflow '+JSON.stringify(overlap));
   await page.locator('#ai-research-roadmap').screenshot({path:path.join(out,kind+'-ai-research-path.png'),animations:'disabled',timeout:30000});
   await page.goto(base+'/learn.html',{waitUntil:'domcontentloaded',timeout:25000});
   await page.locator('[data-ai-path-teaser] a[href="learn-paths.html#ai-research-roadmap"]').waitFor({timeout:25000});
   assert.equal(await page.locator('.academy-overview .academy-program-card').count(),7,kind+': original seven program cards remain separate from the research pathway teaser');
   assert.equal(errors.length,0,kind+': JS page errors '+errors.join(' | '));
   const preExistingSparseMedia=httpFailures.filter(x=>/\/assets\/(scenes|audio)\//.test(x));
   const newFeatureFailures=httpFailures.filter(x=>!/\/assets\/(scenes|audio)\//.test(x));
   assert.equal(newFeatureFailures.length,0,kind+': feature or core HTTP requests '+newFeatureFailures.join(' | '));
   if(preExistingSparseMedia.length)console.log('KNOWN SPARSE WORKTREE: '+preExistingSparseMedia.length+' pre-existing scene/audio file 404s; independent full-site CI remains mandatory');
   console.log('PASS '+kind+': ten stages, external sources, working evidence persistence, homepage link, zero page exceptions/feature HTTP failures/overflow');
   await context.close();
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error('FAIL',e.stack||e);server.close();process.exitCode=1;});
