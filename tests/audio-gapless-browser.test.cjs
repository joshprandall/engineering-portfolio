/* Real browser/audio-decoder coverage for the Night PCM loop. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||'.');
const boundaries=Number(process.env.PORTFOLIO_LOOP_BOUNDARIES??2);
const mobile=process.env.PORTFOLIO_MOBILE==='1';
const label=process.env.PORTFOLIO_BROWSER_LABEL||path.basename(process.env.PORTFOLIO_BROWSER_EXECUTABLE||'chromium');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const report={label,mobile,boundaries,passed:false,errors:[]};
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://local').pathname)}catch{res.writeHead(400).end();return;}
 let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.statSync(file).isFile())throw Error();}catch{res.writeHead(404).end();return;}
 const size=fs.statSync(file).size;let start=0,end=size-1,status=200;const headers={'content-type':mime[path.extname(file)]||'application/octet-stream','accept-ranges':'bytes'};
 if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match){res.writeHead(416).end();return;}start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));end=match[2]?Math.min(size-1,Number(match[2])):size-1;status=206;headers['content-range']=`bytes ${start}-${end}/${size}`;}
 headers['content-length']=String(end-start+1);res.writeHead(status,headers);if(req.method==='HEAD'){res.end();return;}fs.createReadStream(file,{start,end}).pipe(res);
});
const state=page=>page.evaluate(()=>({
 key:SiteAudio.key,backend:SiteAudio.darkBackend,duration:SiteAudio.darkDuration,
 position:SiteAudio.darkPosition,loops:SiteAudio.darkLoopCount,starts:SiteAudio.darkSourceStarts,
 rate:SiteAudio.darkPlaybackRate,volume:SiteAudio.volume,muted:SiteAudio.muted,
 active:SiteAudio.outputLevels.filter(item=>!item.paused&&!item.muted&&item.level>0),
 levels:SiteAudio.outputLevels
}));
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 try{
  const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}:{viewport:{width:1440,height:900}});
  await context.route('https://**/*',route=>route.abort());
  await context.addInitScript(()=>{localStorage.setItem('jr-site-theme','dark');localStorage.setItem('jr-site-ambient-muted-v3','0');localStorage.setItem('jr-site-ambient-volume-v6','.05');localStorage.removeItem('jr-dark-theme-time-v1');});
  const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});await page.mouse.click(8,8);await page.evaluate(()=>SiteAudio.play());
  await page.waitForFunction(()=>SiteAudio.darkBackend==='buffer'&&SiteAudio.darkDuration>20&&SiteAudio.darkPosition>0,null,{timeout:20000});
  report.initial=await state(page);assert.equal(report.initial.starts,1);assert.equal(report.initial.rate,1);assert.equal(report.initial.active.length,1);assert.equal(report.initial.active[0].backend,'buffer');assert(Math.abs(report.initial.active[0].level-.05)<.001);
  if(boundaries>0){
   const timeout=Math.ceil((report.initial.duration*boundaries+15)*1000);
   await page.waitForFunction(target=>SiteAudio.darkLoopCount>=target,boundaries,{timeout});
   report.afterBoundaries=await state(page);assert(report.afterBoundaries.loops>=boundaries);assert.equal(report.afterBoundaries.starts,1);assert.equal(report.afterBoundaries.rate,1);assert.equal(report.afterBoundaries.active.length,1);assert.equal(report.afterBoundaries.active[0].backend,'buffer');
  }
  await page.evaluate(()=>SiteAudio.setMuted(true));report.muted=await state(page);assert.equal(report.muted.active.length,0);
  await page.evaluate(()=>SiteAudio.setMuted(false));await page.waitForFunction(()=>SiteAudio.darkBackend==='buffer'&&SiteAudio.outputLevels.filter(item=>!item.paused&&!item.muted&&item.level>0).length===1);report.unmuted=await state(page);assert.equal(report.unmuted.rate,1);
  await page.evaluate(()=>PortfolioTheme.setTheme('light',false));await page.waitForFunction(()=>SiteAudio.key!=='dark');report.light=await state(page);assert.equal(report.light.levels.filter(item=>item.backend==='buffer'&&!item.paused).length,0);
  await page.evaluate(()=>PortfolioTheme.setTheme('dark',false));await page.waitForFunction(()=>SiteAudio.key==='dark'&&SiteAudio.darkBackend==='buffer'&&SiteAudio.outputLevels.filter(item=>!item.paused&&!item.muted&&item.level>0).length===1);report.darkAgain=await state(page);assert.equal(report.darkAgain.rate,1);
  assert.deepEqual(report.errors,[]);report.passed=true;console.log(`PASS ${label}: ${boundaries} complete Night boundaries, one looping buffer source, mobile=${mobile}`);await context.close();
 }finally{
  const output=path.resolve(process.env.PORTFOLIO_QA_DIR||'visual-qa/audio-gapless');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,`${label}${mobile?'-mobile':''}.json`),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();
 }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
