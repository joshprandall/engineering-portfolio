/* Verify the newly published teaching media and routes with native decoding. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const playwright=require('playwright');
const engine=process.env.PORTFOLIO_BROWSER_ENGINE||'chromium';
const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||'.');
const output=path.resolve(process.env.PORTFOLIO_QA_DIR||'visual-qa/professional-content');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.vtt':'text/vtt','.mp4':'video/mp4','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf'};
const cases=[
 ['learn.html','learn','learn-method.svg'],
 ['security-research.html','security','security-boundary.svg'],
 ['projects.html','projects','projects-method.svg'],
 ['ai-development.html','ai','ai-evaluation-workflow.svg']
];
const report={engine,passed:false,physicalDevices:false,checks:[],errors:[],missing:[]};
const server=http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://local').pathname)}catch{res.writeHead(400).end();return;}
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 let size;try{size=fs.statSync(file).size;}catch{report.missing.push(name);res.writeHead(404).end();return;}
 let start=0,end=size-1,status=200;
 if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match||(!match[1]&&!match[2])){res.writeHead(416).end();return;}
  start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));end=match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;
  if(start>end||start>=size){res.writeHead(416,{'content-range':`bytes */${size}`}).end();return;}status=206;
 }
 const headers={'content-type':mime[path.extname(file)]||'application/octet-stream','content-length':String(end-start+1),'accept-ranges':'bytes'};
 if(status===206)headers['content-range']=`bytes ${start}-${end}/${size}`;
 res.writeHead(status,headers);fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base=`http://127.0.0.1:${server.address().port}`;
  for(const [route,key,poster]of cases){
   // WebKit retains decoder state across navigations; test each asset in an independent browser.
   const browser=await playwright[engine].launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
   try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390});
   try{
   await context.route('https://**/*',route=>route.abort());
    const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
    try{
    await page.goto(base+'/'+route,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>Boolean(window.SiteAudio),null,{timeout:15000});
    const video=page.locator(`video:has(source[src="assets/content/${key}-method.mp4"])`);
    assert.equal(await video.count(),1,route+' has one local teaching video');
    assert.equal(await video.getAttribute('autoplay'),null,'teaching video never autoplays');
    assert.equal(await video.getAttribute('poster'),`assets/content/${poster}`);
    assert.equal(await video.locator('track[kind="captions"]').getAttribute('src'),`assets/content/${key}-method.vtt`);
    const image=page.locator(`img[src="assets/content/${poster}"]`);
    await image.scrollIntoViewIfNeeded();await image.evaluate(e=>e.decode());
    assert(await image.evaluate(e=>e.naturalWidth>0),'original SVG must render');
    assert(await page.locator('main').innerText().then(t=>/transcript/i.test(t)),route+' needs a transcript');
    const dimensions=await video.evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}});
    assert(dimensions.left>=-1&&dimensions.right<=width+1&&dimensions.width>200,route+' video fits viewport');
    if(width===1280){
     await video.evaluate(e=>{e.muted=true;e.textTracks[0].mode='showing';return e.play();});
     try { await page.waitForFunction(name=>{const v=document.querySelector(`video source[src="assets/content/${name}-method.mp4"]`)?.parentElement;return v&&v.readyState>=2&&v.currentTime>.25;},key,{timeout:20000}); }
     catch(error){const state=await video.evaluate(e=>({ready:e.readyState,network:e.networkState,time:e.currentTime,paused:e.paused,rate:e.playbackRate,error:e.error?.message,source:e.currentSrc}));throw Error(route+' video stalled: '+JSON.stringify(state)+' '+error.message);}
     await page.waitForFunction(name=>document.querySelector(`video source[src="assets/content/${name}-method.mp4"]`)?.parentElement?.textTracks[0]?.cues?.length===4,key,{timeout:10000});
     const state=await video.evaluate(e=>({duration:e.duration,width:e.videoWidth,height:e.videoHeight,time:e.currentTime,track:e.textTracks[0]?.mode,cues:e.textTracks[0]?.cues?.length}));
     assert.equal(state.duration,24);assert(state.width>=640&&state.height>=360);assert(state.time>.25);
     report.checks.push({route,width,...state});await video.evaluate(e=>e.pause());
    }else report.checks.push({route,width,svgDecoded:true,videoFits:true});
    }finally{await page.close();}
   }finally{await context.close();}
   }
   }finally{await browser.close();}
  }
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.missing.filter(p=>p.startsWith('/assets/content/')),[]);
  report.passed=true;console.log('PASS',engine,'four professional content videos/visuals on desktop and mobile.');
 }finally{fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'professional-content.json'),JSON.stringify(report,null,2));server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
