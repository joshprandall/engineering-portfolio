/* Native media on a non-localhost test origin: localhost intentionally disables video. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||'staging/website-2.0-runtime');
const output=path.resolve(process.env.PORTFOLIO_QA_DIR||'visual-qa/refinement');fs.mkdirSync(output,{recursive:true});
const report={passed:false,physicalDevices:false,origin:'http://portfolio.test',media:[],errors:[],externalAudioPlaybackVerified:false};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp4':'video/mp4','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
(async()=>{const browser=await chromium.launch({executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE,headless:true,args:['--no-sandbox']});try{
 const c=await browser.newContext({viewport:{width:390,height:844},recordVideo:{dir:output,size:{width:390,height:844}}});
 await c.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='portfolio.test'){await route.abort();return;}
  let f=path.resolve(root,'.'+u.pathname);if(!f.startsWith(root+'/'))return route.fulfill({status:403,body:''});if(u.pathname.endsWith('/'))f=path.join(f,'index.html');
  if(!fs.existsSync(f)||!fs.statSync(f).isFile())return route.fulfill({status:404,body:''});
  const size=fs.statSync(f).size,range=route.request().headers().range,headers={'content-type':mime[path.extname(f)]||'application/octet-stream','accept-ranges':'bytes'};
  if(range){const match=range.match(/bytes=(\d+)-(\d*)/);if(match){const start=Number(match[1]),end=Math.min(size-1,match[2]?Number(match[2]):size-1);if(start>=size)return route.fulfill({status:416,body:''});headers['content-range']=`bytes ${start}-${end}/${size}`;return route.fulfill({status:206,headers,body:fs.readFileSync(f).subarray(start,end+1)});}}
  await route.fulfill({status:200,headers,body:fs.readFileSync(f)});
 });
 const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.goto('http://portfolio.test/index.html',{waitUntil:'domcontentloaded'});
 await p.evaluate(()=>{window.__sceneEvents=[];document.addEventListener('portfolio:scene',e=>window.__sceneEvents.push(e.detail.id));});
 await p.locator('[data-scene-audio]').click();await p.locator('.scene-sound-mute').click();await p.evaluate(()=>SiteAudio.setMuted(false));
 await p.waitForFunction(()=>SiteAudio.element.currentTime>0&&!SiteAudio.element.paused,null,{timeout:15000});report.nightAudio=await p.evaluate(()=>({time:SiteAudio.element.currentTime,source:SiteAudio.element.currentSrc,volume:SiteAudio.volume}));
 await p.keyboard.press('Escape');await p.locator('[data-theme-toggle]').click();
 for(const scene of ['forest-waterfall','forest-river','birds-water']){
  await p.waitForFunction(id=>SiteAudio.scene===id,scene,{timeout:38000});
  await p.waitForFunction(()=>{const v=document.querySelector('.scene-video.is-active');return v&&v.readyState>=2&&!v.paused&&v.currentTime>0},null,{timeout:15000}).catch(async error=>{report.videoFailure=await p.evaluate(()=>({canPlayMP4:document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"'),videos:[...document.querySelectorAll('video')].map(v=>({src:v.currentSrc,error:v.error?.message,code:v.error?.code,state:v.readyState,paused:v.paused,time:v.currentTime})),scene:SiteAudio.scene}));report.outcome=report.videoFailure.canPlayMP4?'failed':'blocked: MP4 codec unavailable';throw error;});
  const state=await p.evaluate(()=>{const v=document.querySelector('.scene-video.is-active');return {scene:SiteAudio.scene,key:SiteAudio.key,video:v.currentSrc,time:v.currentTime,muted:v.muted,audio:SiteAudio.element.currentSrc,beachAbandoned:SiteAudio.scene!=='birds-water'&&SiteAudio.beachElements.some(a=>!a.paused)}});report.media.push(state);assert(state.muted);assert(!state.beachAbandoned);await p.screenshot({path:path.join(output,'media-'+scene+'.png')});console.log('NATIVE MEDIA',scene,state.time);
 }
 await p.evaluate(()=>SiteAudio.setMuted(true));await p.locator('[data-theme-toggle]').click();assert(await p.evaluate(()=>SiteAudio.element.paused&&SiteAudio.muted));await p.reload();assert(await p.evaluate(()=>SiteAudio.muted));
 for(const [width,height]of [[320,568],[820,1180],[1440,900],[1920,1080],[844,390]]){await p.setViewportSize({width,height});await p.waitForTimeout(150);assert(await p.locator('.scene-backdrop').evaluate(e=>{const r=e.getBoundingClientRect();return r.left<=0&&r.top<=0&&r.right>=innerWidth&&r.bottom>=innerHeight}),'viewport covered');}
 assert.deepEqual(report.errors,[]);report.passed=true;report.outcome='passed';await c.close();console.log('PASS native local Night audio, three actual Day videos, scene identity transitions, viewport fit and saved mute. External Day audio is excluded from this isolated playback test; production fallbacks require separate verification.');
}finally{fs.writeFileSync(path.join(output,'media-playback.json'),JSON.stringify(report,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
