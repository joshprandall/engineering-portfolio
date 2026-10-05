const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||path.join(__dirname,'..'));
const pageUrl=pathToFileURL(path.join(root,'games','3d-battle-chess','index.html')).href;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
 const browser=await chromium.launch({
  headless:true,
  executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,
  args:['--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
 });

 async function run(controllerId){
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addInitScript(id=>{
   const buttons=Array.from({length:18},()=>({pressed:false,touched:false,value:0}));
   const pad={id,index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons};
   Object.defineProperty(window,'__testPad',{value:pad});
   Object.defineProperty(navigator,'getGamepads',{value:()=>[pad],configurable:true});
  },controllerId);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pageUrl,{waitUntil:'load'});
  await page.waitForSelector('#setupMode');

  const pulse=async(index)=>{
   await page.evaluate(i=>{const b=window.__testPad.buttons[i];b.pressed=true;b.touched=true;b.value=1;window.__testPad.timestamp++;},index);
   await sleep(240);
   await page.evaluate(i=>{const b=window.__testPad.buttons[i];b.pressed=false;b.touched=false;b.value=0;window.__testPad.timestamp++;},index);
   await sleep(260);
  };
  const activeId=()=>page.evaluate(()=>document.activeElement?.id||'');

  assert.equal(await page.locator('#setupTheme option').count(),1,controllerId+': Basic Edition must expose only Classic');
  assert.equal(await page.locator('#setupCombat').evaluate(el=>el.disabled||el.hidden||!!el.closest('[hidden]')||getComputedStyle(el).display==='none'),true,controllerId+': premium combat must remain unavailable');

  await pulse(13);
  assert.equal(await activeId(),'setupMode',controllerId+': D-pad down must acquire setup focus');

  await pulse(15);
  assert.equal(await page.locator('#setupMode').inputValue(),'local',controllerId+': D-pad right must change mode');
  assert.equal(await page.locator('#setupDifficulty').isDisabled(),true,controllerId+': Local mode must disable AI difficulty');

  await pulse(14);
  assert.equal(await page.locator('#setupMode').inputValue(),'ai',controllerId+': D-pad left must change mode back');
  assert.equal(await page.locator('#setupDifficulty').isDisabled(),false,controllerId+': AI mode must restore difficulty');

  await pulse(13);
  await pulse(13);
  await pulse(13);
  assert.equal(await activeId(),'setupView',controllerId+': vertical setup navigation must reach Board');
  await pulse(15);
  assert.equal(await page.locator('#setupView').inputValue(),'2d',controllerId+': D-pad right must select 2D');

  await pulse(13);
  await pulse(13);
  assert.equal(await activeId(),'setupSound',controllerId+': setup navigation must reach Sound');
  await pulse(0);
  assert.equal(await page.locator('#setupSound').isChecked(),false,controllerId+': A/Cross must toggle Sound');

  await pulse(1);
  assert.equal(await activeId(),'startGameBtn',controllerId+': B/Circle must return to Begin Battle');

  await page.evaluate(()=>{const b=window.__testPad.buttons[0];b.pressed=true;b.touched=true;b.value=1;window.__testPad.timestamp++;});
  await sleep(260);
  assert.equal(await page.locator('#setupScreen').evaluate(el=>!el.classList.contains('hidden')),true,controllerId+': held launch button must not enter gameplay');
  await page.evaluate(()=>{const b=window.__testPad.buttons[0];b.pressed=false;b.touched=false;b.value=0;window.__testPad.timestamp++;});
  await page.waitForFunction(()=>document.querySelector('#setupScreen').classList.contains('hidden'),{},{timeout:7000});
  await page.waitForFunction(()=>document.querySelector('#board2d').children.length===64,{},{timeout:12000});
  await sleep(350);
  assert.equal(await page.locator('#board2d .selected').count(),0,controllerId+': launch press must not leak into board selection');

  assert.deepEqual(errors,[],controllerId+': setup path must not produce page errors');
  await context.close();
 }

 try{
  await run('Xbox Wireless Controller');
  await run('DualSense Wireless Controller');
  console.log('PASS Crown & Ash controller-only setup navigation and launch-edge isolation.');
 }finally{
  await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
