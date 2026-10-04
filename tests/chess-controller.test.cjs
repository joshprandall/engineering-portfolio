const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');

const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||path.join(__dirname,'../staging/website-2.0-runtime'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png'};
const server=http.createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
    const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+path.sep))throw Error('outside');
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  }catch{
    res.writeHead(404);
    res.end();
  }
});

const controllers=[
  {case:'xbox-standard',id:'Xbox Wireless Controller'},
  {case:'playstation-standard',id:'DualSense Wireless Controller'}
];

async function setButton(page,index,pressed){
  await page.evaluate(({index,pressed})=>{
    const button=window.__padHarness.buttons[index];
    button.pressed=pressed;
    button.value=pressed?1:0;
  },{index,pressed});
}
async function tapButton(page,index,condition){
  await setButton(page,index,true);
  await page.waitForFunction(condition,undefined,{timeout:3000});
  await setButton(page,index,false);
  await page.waitForTimeout(80);
}
async function axisStep(page,value,x,y){
  await page.evaluate(value=>{window.__padHarness.axes[1]=value;},value);
  await page.waitForFunction(({x,y})=>{
    const cursor=document.querySelector('#board2d .cursor');
    return cursor?.dataset.x===String(x)&&cursor?.dataset.y===String(y);
  },{x,y},{timeout:3000});
  await page.evaluate(()=>{window.__padHarness.axes[1]=0;});
  await page.waitForTimeout(190);
}
async function snapshot(page){
  return page.evaluate(async()=>{
    const {game}=await import('/games/3d-battle-chess/shared-game.js');
    return {...game.snapshot(),positions:[...game.positions],historyLength:game.history.length};
  });
}

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({
    headless:true,
    executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
  });
  const results=[];
  try{
    for(const profile of controllers){
      const context=await browser.newContext({viewport:{width:1440,height:900}});
      await context.addInitScript(({id})=>{
        const state={
          id,
          axes:Array(8).fill(0),
          buttons:Array.from({length:16},()=>({pressed:false,touched:false,value:0}))
        };
        window.__padHarness=state;
        navigator.getGamepads=()=>[{
          id:state.id,index:0,connected:true,mapping:'standard',
          axes:state.axes,buttons:state.buttons,timestamp:performance.now()
        }];
      },{id:profile.id});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));

      await page.goto(base+'/games/3d-battle-chess/',{waitUntil:'networkidle'});
      await page.locator('#setupMode').selectOption('local');
      await page.locator('#setupView').selectOption('2d');
      await page.locator('#setupSound').uncheck();
      await page.locator('#startGameBtn').click();
      await page.waitForFunction(()=>document.querySelector('#board2d').children.length===64&&!document.querySelector('#board2d').classList.contains('hidden'));

      assert.equal(await page.evaluate(()=>navigator.getGamepads()[0]?.mapping),'standard');

      // A selects e2. Left stick advances the cursor to e4. A confirms the move.
      await tapButton(page,0,()=>document.querySelector('#board2d .selected')?.dataset.y==='6');
      await axisStep(page,-1,4,5);
      await axisStep(page,-1,4,4);
      await tapButton(page,0,()=>document.querySelectorAll('#log li').length===1);
      let state=await snapshot(page);
      assert.equal(state.moves.length,1);
      assert.equal(state.board[4][4]?.t,'p');
      assert.equal(state.board[4][4]?.c,'w');

      // Select e7 and B-cancel without changing game state.
      await axisStep(page,-1,4,3);
      await axisStep(page,-1,4,2);
      await axisStep(page,-1,4,1);
      await tapButton(page,0,()=>document.querySelector('#board2d .selected')?.dataset.y==='1');
      const beforeCancel=await snapshot(page);
      await tapButton(page,1,()=>!document.querySelector('#board2d .selected'));
      assert.deepEqual(await snapshot(page),beforeCancel);

      // X flips board orientation.
      await tapButton(page,2,()=>document.querySelector('#board2d').firstElementChild.dataset.x==='7');

      // Y switches 2D/3D and back without mutating state.
      const beforeView=await snapshot(page);
      await tapButton(page,3,()=>!document.querySelector('#scene').hidden&&document.querySelector('#board2d').classList.contains('hidden'));
      assert.deepEqual(await snapshot(page),beforeView);
      await tapButton(page,3,()=>document.querySelector('#scene').hidden&&!document.querySelector('#board2d').classList.contains('hidden'));
      assert.deepEqual(await snapshot(page),beforeView);

      // Start opens the controls menu.
      await tapButton(page,9,()=>document.querySelector('#controls').classList.contains('open')&&document.querySelector('#menuBtn').getAttribute('aria-expanded')==='true');

      // LB undoes the completed local move.
      await tapButton(page,4,()=>document.querySelectorAll('#log li').length===0);
      state=await snapshot(page);
      assert.equal(state.moves.length,0);
      assert.equal(state.board[6][4]?.t,'p');
      assert.equal(state.board[6][4]?.c,'w');

      assert.deepEqual(errors,[]);
      results.push({case:profile.case,passed:true,verified:['left-stick cursor','A select/confirm','B cancel','X flip','Y view','LB undo','Start menu']});
      await context.close();
    }
    console.log('PASS Crown & Ash standardized Gamepad API flows for Xbox and PlayStation-compatible mappings.');
  }finally{
    await browser.close();
    server.close();
    fs.mkdirSync(path.join(__dirname,'../docs/phase3-evidence'),{recursive:true});
    fs.writeFileSync(path.join(__dirname,'../docs/phase3-evidence/chess-controller.json'),JSON.stringify(results,null,2)+'\n');
  }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
