/* Real decoders, real media, no external runtime downloads; run in Chromium and WebKit CI. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http');
const playwright=require('playwright'),engine=process.env.PORTFOLIO_BROWSER_ENGINE||'chromium';
const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||'.');
const mediaKBps=Number(process.env.PORTFOLIO_MEDIA_KBPS||0),mobile=process.env.PORTFOLIO_MOBILE==='1';
const output=path.resolve(process.env.PORTFOLIO_QA_DIR||'visual-qa/ambience/'+engine);fs.mkdirSync(output,{recursive:true});
const report={passed:false,physicalDevices:false,engine,mobile,mediaKBps,media:[],errors:[],failedLocalRequests:[]};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp4':'video/mp4','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://local').pathname)}catch{res.writeHead(400).end();return;}
 let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.statSync(file).isFile())throw Error();}catch{report.failedLocalRequests.push(pathname);res.writeHead(404).end();return;}
 const size=fs.statSync(file).size,headers={'content-type':mime[path.extname(file)]||'application/octet-stream','accept-ranges':'bytes'};
 let start=0,end=size-1,status=200;
 if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!m||(!m[1]&&!m[2])){res.writeHead(416).end();return;}
  start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));end=m[1]&&m[2]?Math.min(size-1,Number(m[2])):size-1;
  if(start> end||start>=size){res.writeHead(416,{'content-range':`bytes */${size}`}).end();return;}status=206;headers['content-range']=`bytes ${start}-${end}/${size}`;
 }
 headers['content-length']=String(end-start+1);res.writeHead(status,headers);if(req.method==='HEAD'){res.end();return;}
 const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());
 if(mediaKBps&&path.extname(file)==='.mp4'){
  let timer;stream.on('data',chunk=>{stream.pause();res.write(chunk);timer=setTimeout(()=>stream.resume(),chunk.length/(mediaKBps*1024)*1000);});
  stream.on('end',()=>res.end());res.on('close',()=>clearTimeout(timer));
 }else stream.pipe(res);
});
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;report.origin=base;
 const browser=await playwright[engine].launch({executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,headless:true,...(engine==='chromium'?{args:['--no-sandbox']}: {})});try{
 const c=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1,...(mobile?{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'}:{}),recordVideo:{dir:output,size:{width:390,height:844}}});
 await c.addInitScript(()=>{if(!sessionStorage.getItem('ambience-test-started')){localStorage.setItem('jr-site-theme','dark');localStorage.setItem('jr-site-motion','running');localStorage.setItem('jr-site-ambient-muted-v3','0');localStorage.setItem('jr-site-ambient-volume-v6','.05');localStorage.removeItem('jr-site-light-scene-v2');sessionStorage.setItem('ambience-test-started','1');}});
 // Keep local media on a real streaming HTTP connection. Fulfilling a 56 MB
 // response through the automation protocol can stall WebKit's range pipeline.
 await c.route('https://**/*',route=>route.abort());
 const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
 await p.locator('[data-scene-audio]').click();
 const panel=await p.locator('.scene-sound-panel').evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(),m=s.backgroundColor.match(/rgba?\(([^)]+)\)/),parts=m?m[1].split(',').map(x=>Number(x.trim())):[];return {background:s.backgroundColor,alpha:parts.length>3?parts[3]:1,image:s.backgroundImage,shadow:s.boxShadow,blur:s.backdropFilter||s.webkitBackdropFilter||'none',border:s.borderTopWidth,children:[...e.children].map(c=>c.tagName),left:r.left,right:r.right,width:r.width,viewport:innerWidth}});
 assert(panel.alpha>=.9,'Sound panel must have a coherent high-contrast surface: '+JSON.stringify(panel));assert.equal(panel.image,'none');assert.notEqual(panel.shadow,'none');assert.notEqual(panel.border,'0px');assert.deepEqual(panel.children,['LABEL','DIV','BUTTON','SMALL']);assert(panel.left>=0&&panel.right<=panel.viewport+1&&panel.width<=panel.viewport-16,'Sound panel must fit viewport: '+JSON.stringify(panel));
 const slider=p.locator('#ambient-volume');await slider.focus();await slider.press('Home');assert(await p.evaluate(()=>SiteAudio.muted&&SiteAudio.volume===0));
 for(let i=0;i<5;i++)await slider.press('ArrowRight');assert(await p.evaluate(()=>!SiteAudio.muted&&Math.abs(SiteAudio.volume-.05)<.001));
 assert.equal(await slider.evaluate(el=>getComputedStyle(el).touchAction),'none','Volume slider must retain horizontal touch dragging instead of handing the gesture to page scrolling');
 await slider.evaluate(el=>{el.value='37';el.dispatchEvent(new Event('change',{bubbles:true}));});
 assert(await p.evaluate(()=>!SiteAudio.muted&&Math.abs(SiteAudio.volume-.37)<.001),'Committed native-range changes must update audio volume');
 const mute=p.locator('.scene-sound-mute');
 await slider.evaluate(el=>{el.value='37';el.dispatchEvent(new Event('change',{bubbles:true}));});
 await mute.click();assert(await p.evaluate(()=>SiteAudio.muted&&Math.abs(SiteAudio.volume-.37)<.001),'Mute must preserve selected nonzero volume');assert.equal(await mute.innerText(),'Unmute');await mute.click();assert(await p.evaluate(()=>!SiteAudio.muted&&Math.abs(SiteAudio.volume-.37)<.001),'Unmute must restore selected nonzero volume');
 await slider.evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert(await p.evaluate(()=>SiteAudio.muted&&SiteAudio.volume===0),'Zero on the native range must mute');
 await mute.click();assert(await p.evaluate(()=>!SiteAudio.muted&&Math.abs(SiteAudio.volume-.37)<.001),'Unmute after zero restores the previous nonzero selection');
 await slider.evaluate(el=>{el.value='5';el.dispatchEvent(new Event('change',{bubbles:true}));});
 assert(await p.evaluate(()=>!SiteAudio.muted&&Math.abs(SiteAudio.volume-.05)<.001),'Positive native-range changes set the new selected level');assert.equal(await mute.innerText(),'Mute');
 await p.locator('.scene-sound-up').click();assert(await p.evaluate(()=>Math.abs(SiteAudio.volume-.10)<.001),'Plus control raises volume by five percent');await p.locator('.scene-sound-down').click();assert(await p.evaluate(()=>Math.abs(SiteAudio.volume-.05)<.001),'Minus control lowers volume by five percent');
 await p.screenshot({path:path.join(output,'volume-slider-night.png')});
 await p.waitForFunction(()=>SiteAudio.element.currentTime>0&&!SiteAudio.element.paused&&SiteAudio.volumeBackend==='gain',null,{timeout:20000});
 report.night=await p.evaluate(()=>({time:SiteAudio.element.currentTime,source:SiteAudio.element.currentSrc,volume:SiteAudio.volume,levels:SiteAudio.outputLevels}));assert(report.night.source.endsWith('.wav'));assert.equal(report.night.volume,.05);
 const transform=await p.locator('.scene-night').evaluate(e=>e.style.transform);await p.waitForTimeout(1000);assert.notEqual(await p.locator('.scene-night').evaluate(e=>e.style.transform),transform,'Night camera must move');
 await p.keyboard.press('Escape');await p.locator('[data-theme-toggle]').first().click();
 async function frameHash(){return p.evaluate(()=>{const v=document.querySelector('.scene-video.is-active'),c=document.createElement('canvas');c.width=96;c.height=54;const ctx=c.getContext('2d');ctx.drawImage(v,0,0,96,54);const pixels=ctx.getImageData(0,0,96,54).data;let hash=0,min=255,max=0;for(let i=0;i<pixels.length;i+=4){hash=(Math.imul(hash,31)+pixels[i]+pixels[i+1]*3+pixels[i+2]*7)|0;min=Math.min(min,pixels[i]);max=Math.max(max,pixels[i]);}return {hash,range:max-min};});}
 for(const [scene,key]of [['forest-waterfall','waterfall'],['forest-river','river'],['birds-water','beach']]){
  await p.waitForFunction(id=>document.querySelector('#site-scene')?.dataset.visibleDayScene===id&&SiteAudio.scene===id,scene,{timeout:45000});
  await p.waitForFunction(()=>{const v=document.querySelector('.scene-video.is-active');return v&&v.readyState>=2&&!v.paused&&v.currentTime>0&&document.querySelector('.scene-day-fallback').classList.contains('video-ready')&&Number(getComputedStyle(v).opacity)>0&&SiteAudio.element.currentTime>0&&!SiteAudio.element.paused},null,{timeout:20000});
  const state=await p.evaluate(()=>{const v=document.querySelector('.scene-video.is-active');return {scene:SiteAudio.scene,key:SiteAudio.key,video:v.currentSrc,time:v.currentTime,muted:v.muted,opacity:Number(getComputedStyle(v).opacity),posterHidden:document.querySelector('.scene-day-fallback').classList.contains('video-ready'),audio:SiteAudio.element.currentSrc,levels:SiteAudio.outputLevels,beachAbandoned:SiteAudio.scene!=='birds-water'&&SiteAudio.beachElements.some(a=>!a.paused)}});
  assert.equal(state.key,key);assert.equal(state.levels.filter(x=>!x.paused&&!x.muted&&x.level>0).length,1,scene+': exactly one ambience owner is audible');assert(state.muted&&state.opacity>0&&state.posterHidden);assert(!state.beachAbandoned);assert(state.audio.startsWith(base+'/assets/audio/day/'));assert(key==='beach'?/beach-(near|far)\.mp3$/.test(state.audio):state.audio.endsWith('/'+key+'.mp3'));
  const before=await frameHash();let after=before;const deadline=Date.now()+10000;
  // A first decoded frame can precede sustained playback, especially during a
  // WebKit compositing transition. Require actual changing pixels within a
  // bounded window instead of assuming the very next frame arrives in 1.2 s.
  while(after.hash===before.hash&&Date.now()<deadline){await p.waitForTimeout(500);after=await frameHash();}
  report.lastProbe={scene,before,after,state:await p.evaluate(()=>{const v=document.querySelector('.scene-video.is-active');return {time:v.currentTime,paused:v.paused,readyState:v.readyState,networkState:v.networkState,error:v.error?.message,src:v.currentSrc,frames:v.getVideoPlaybackQuality?.().totalVideoFrames}})};
  assert(before.range>5&&after.range>5,'Decoded video must contain visible scenery');assert.notEqual(before.hash,after.hash,scene+': decoded pixels must animate within ten seconds');console.log('Decoded motion verified',scene,report.lastProbe.state);
  if(mediaKBps){
   const samples=[];let previous=await p.locator('.scene-video.is-active').evaluate(v=>v.currentTime),previousHash=after.hash;
   for(let i=0;i<6;i++){await p.waitForTimeout(1000);const now=await p.locator('.scene-video.is-active').evaluate(v=>({time:v.currentTime,duration:v.duration,ready:v.readyState}));const pixels=await frameHash();let advance=now.time-previous;if(advance<0&&previous>now.duration-2&&now.time<2)advance+=now.duration;samples.push({advance,pixelsChanged:pixels.hash!==previousHash,ready:now.ready});previous=now.time;previousHash=pixels.hash;}
   report.sustained??=[];report.sustained.push({scene,samples});
   assert(samples.filter(x=>x.advance>.4&&x.advance<2&&x.pixelsChanged).length>=5,scene+': background stalls on a 2 Mbps phone connection');
  }
  if(scene==='forest-waterfall'){await p.locator('[data-scene-audio]').click();await p.screenshot({path:path.join(output,'volume-slider-day.png')});await p.keyboard.press('Escape');}
  report.media.push({...state,decodedMotion:true});await p.screenshot({path:path.join(output,scene+'.png')});
 }
 await p.waitForFunction(()=>document.querySelector('#site-scene')?.dataset.visibleDayScene==='forest-waterfall'&&SiteAudio.key==='waterfall',null,{timeout:45000});
 assert.equal(await p.evaluate(()=>SiteAudio.outputLevels.filter(x=>!x.paused&&!x.muted&&x.level>0).length),1,'Beach → Waterfall leaves one ambience owner');
 await p.evaluate(()=>PortfolioTheme.setTheme('dark',false));
 await p.waitForFunction(()=>SiteAudio.key==='dark');assert.equal(await p.evaluate(()=>SiteAudio.outputLevels.filter(x=>!x.paused&&!x.muted&&x.level>0).length),1,'Day → Night leaves one ambience owner');
 await p.evaluate(()=>PortfolioTheme.setTheme('light',false));
 await p.evaluate(()=>{document.dispatchEvent(new CustomEvent('portfolio:scene-will-change',{detail:{id:'birds-water'}}));document.dispatchEvent(new CustomEvent('portfolio:scene',{detail:{id:'birds-water'}}));});
 await p.waitForFunction(()=>SiteAudio.key==='beach');assert.equal(await p.evaluate(()=>SiteAudio.outputLevels.filter(x=>!x.paused&&!x.muted&&x.level>0).length),1,'Night → Beach leaves one ambience owner');
 await p.evaluate(()=>PortfolioTheme.setMotion('paused'));await p.waitForFunction(()=>[...document.querySelectorAll('.scene-video')].every(v=>v.paused));const time=await p.locator('.scene-video.is-active').evaluate(v=>v.currentTime);await p.waitForTimeout(1000);assert(Math.abs(await p.locator('.scene-video.is-active').evaluate(v=>v.currentTime)-time)<.08);await p.evaluate(()=>PortfolioTheme.setMotion('running'));await p.waitForFunction(()=>!document.querySelector('.scene-video.is-active').paused);
 await p.evaluate(()=>{SiteAudio.setVolume(.13);SiteAudio.setMuted(true)});await p.goto(base+'/projects.html',{waitUntil:'domcontentloaded'});assert(await p.evaluate(()=>SiteAudio.muted&&SiteAudio.volume===.13&&SiteAudio.outputLevels.every(p=>p.paused&&p.muted)));await p.goBack({waitUntil:'domcontentloaded'});assert(await p.evaluate(()=>SiteAudio.muted));
 // Losing decorative canvas must not disable the background or sound controls.
 await p.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(...args){return this.classList.contains('scene-canvas')?null:original.apply(this,args)};});
 await p.goto(base+'/learn.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.querySelector('.scene-video.is-active')?.currentTime>0,null,{timeout:20000});assert(await p.evaluate(()=>SiteAudio.muted&&document.querySelectorAll('#site-scene').length===1));
 for(const [width,height]of [[320,568],[820,1180],[1440,900],[1920,1080],[844,390]]){await p.setViewportSize({width,height});await p.waitForTimeout(100);assert(await p.locator('.scene-backdrop').evaluate(e=>{const r=e.getBoundingClientRect();return r.left<=0&&r.top<=0&&r.right>=innerWidth&&r.bottom>=innerHeight}),'viewport covered');}
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedLocalRequests.filter(n=>/assets\/(scenes|audio)\//.test(n)),[]);report.passed=true;await c.close();console.log('PASS',engine,'actual moving Day video, matching local sound, Night motion/music, pause, preferences, navigation and canvas fallback.');
}finally{fs.writeFileSync(path.join(output,'media-playback.json'),JSON.stringify(report,null,2));await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
