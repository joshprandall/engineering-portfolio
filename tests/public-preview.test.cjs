const assert=require('node:assert/strict');
const {chromium}=require('playwright');

async function run(){
  const sha=process.env.GITHUB_SHA;
  assert(sha,'GITHUB_SHA is required');
  const base='https://raw.githack.com/joshprandall/engineering-portfolio/'+sha+'/index.html';
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(35000);
  try{
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForFunction(()=>Boolean(window.SiteAudio)&&Boolean(document.querySelector('[data-scene-audio]')));

    // A real user gesture must unlock preview audio.
    await page.locator('[data-scene-audio]').click();
    await page.locator('#ambient-volume').evaluate(el=>{el.value='35';el.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.waitForFunction(()=>!SiteAudio.muted&&Math.abs(SiteAudio.volume-.35)<.001);
    await page.waitForFunction(()=>SiteAudio.key==='dark'&&SiteAudio.outputLevels.some(x=>!x.paused&&x.level>.30),null,{timeout:30000});

    const mute=page.locator('.scene-sound-mute');
    await mute.click();
    await page.waitForFunction(()=>SiteAudio.muted);
    assert.equal((await mute.innerText()).trim(),'Unmute');
    await mute.click();
    await page.waitForFunction(()=>!SiteAudio.muted&&Math.abs(SiteAudio.volume-.35)<.001);
    assert.equal((await mute.innerText()).trim(),'Mute');

    // Day must use the approved moving source even when raw branch hosting does
    // not contain reconstructed release media at canonical paths.
    await page.locator('[data-theme-toggle]').click();
    await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
    await page.waitForFunction(()=>{
      const video=document.querySelector('.scene-video.is-active');
      return video&&!video.paused&&video.readyState>=2&&getComputedStyle(video).opacity!=='0';
    },null,{timeout:45000});
    await page.waitForFunction(()=>SiteAudio.theme==='light'&&SiteAudio.key&&SiteAudio.key!=='dark'&&SiteAudio.outputLevels.some(x=>!x.paused&&x.level>.30),null,{timeout:30000});

    const before=await page.locator('#site-scene').getAttribute('data-visible-day-scene');
    await page.waitForFunction(prev=>document.querySelector('#site-scene')?.dataset.visibleDayScene&&document.querySelector('#site-scene').dataset.visibleDayScene!==prev,before,{timeout:35000});
    const after=await page.locator('#site-scene').getAttribute('data-visible-day-scene');
    assert.notEqual(after,before,'Day preview scene should rotate');

    const result=await page.evaluate(()=>({
      theme:document.documentElement.dataset.theme,
      scene:document.querySelector('#site-scene')?.dataset.visibleDayScene,
      video:document.querySelector('.scene-video.is-active')?.currentSrc,
      audio:{key:SiteAudio.key,scene:SiteAudio.scene,volume:SiteAudio.volume,muted:SiteAudio.muted,levels:SiteAudio.outputLevels}
    }));
    console.log('PASS public preview media',JSON.stringify(result));
  }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exit(1);});
