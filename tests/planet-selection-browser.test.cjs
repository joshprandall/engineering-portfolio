/* Exercise real pointer, touch and keyboard input while the planets orbit. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const playwright=require('playwright'),engine=process.env.PORTFOLIO_BROWSER_ENGINE||'chromium';
const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||'.');
const output=path.resolve(process.env.PORTFOLIO_QA_DIR||'visual-qa/planet-selection');
const report={passed:false,physicalDevices:false,engine,checks:[],errors:[]};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.mp4':'video/mp4'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await playwright[engine].launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile});
   await context.route('https://**/*',route=>route.abort());
   const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
   for(const [route,count]of [['index.html',6],['learn.html',7],['ai-development.html',19]]){
    await page.goto(base+'/'+route,{waitUntil:'domcontentloaded'});
    await page.locator('.solar-navigation').scrollIntoViewIfNeeded();
    const names=await page.locator('.approved-planet-link').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));
    assert.equal(names.length,count);
    assert.equal(await page.getByRole('button',{name:/^Select /}).count(),count,'Planet controls must be exposed to assistive technology');
    for(const theme of ['dark','light']){
     await page.evaluate(value=>PortfolioTheme.setTheme(value,false),theme);
     for(const name of names){
      const group=page.getByRole('button',{name,exact:true});
      const hit=group.locator('.approved-hit');let box=await hit.boundingBox();assert(box.width>=43.5,'Touch target is at least 44 CSS pixels');
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2);box=await hit.boundingBox();
      const x=box.x+box.width/2,y=box.y+box.height/2;
      if(mobile)await page.touchscreen.tap(x,y);
      else{await page.mouse.down();await page.waitForTimeout(160);await page.mouse.up();}
      assert.equal(await group.getAttribute('aria-pressed'),'true',`${route} ${theme}: body ${name}`);
      const selectedHref=await page.locator('.solar-descriptor-link').getAttribute('href');assert(selectedHref&&selectedHref!=='#');
      report.checks.push({route,mobile,theme,name,input:mobile?'touch':'held mouse',destination:selectedHref});
     }
     // Click the outside edge of a long visible name, beyond the circular body.
     const target=names.find(n=>/Development|Leadership|Computing|Symbolic/.test(n))||names[1];
     const alternate=page.getByRole('button',{name:names[0],exact:true});await alternate.focus();await page.keyboard.press('Enter');
     const group=page.getByRole('button',{name:target,exact:true}),label=group.locator('.approved-label');let box=await label.boundingBox();
     await page.mouse.move(box.x+3,box.y+box.height-3);box=await label.boundingBox();
     const point={x:box.x+3,y:box.y+box.height-3};const probe=await page.evaluate(point=>({hit:document.elementFromPoint(point.x,point.y)?.tagName,stack:document.elementsFromPoint(point.x,point.y).slice(0,7).map(e=>({tag:e.tagName,cls:e.getAttribute('class'),label:e.closest('.approved-planet-link')?.getAttribute('aria-label')}))}),point);if(mobile)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
     assert.equal(await group.getAttribute('aria-pressed'),'true',`${route} ${theme}: visible label ${target} ${JSON.stringify(probe)}`);
     await alternate.focus();await page.waitForTimeout(200);assert(await alternate.evaluate(e=>e===document.activeElement),'Animation must preserve keyboard focus');
     await page.keyboard.press('Space');assert.equal(await alternate.getAttribute('aria-pressed'),'true');
     report.checks.push({route,mobile,theme,input:'label and keyboard'});
    }
    fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,`${route}-${mobile?'mobile':'desktop'}.png`)});
   }
   await context.close();
  }
  assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS planet selection:',report.checks.length,'mouse/touch/label/keyboard checks');
 }finally{fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'planet-selection.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
