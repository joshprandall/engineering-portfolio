const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const {chromium}=require('playwright');
const root=path.resolve(process.env.PORTFOLIO_RUNTIME_ROOT||path.join(__dirname,'../staging/website-2.0-runtime'));
const output=path.resolve(process.env.PORTFOLIO_QA_DIR||path.join(__dirname,'../visual-qa/content'));fs.mkdirSync(output,{recursive:true});
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'knowledge-data.js'),'utf8'),sandbox);
vm.runInNewContext(fs.readFileSync(path.join(root,'knowledge-upgrades.js'),'utf8'),sandbox);
const lessons=sandbox.window.JR_KNOWLEDGE.lessons.filter(l=>l.flagship?.release==='3.1');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.mp4':'video/mp4','.mp3':'audio/mpeg','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!f.startsWith(root+'/'))return res.writeHead(403).end();try{res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).on('error',()=>res.end()).pipe(res)}catch{res.writeHead(404).end()}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PORTFOLIO_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={engine:await browser.version(),viewports:[320,390,430,820,1024,1440,1920],themes:['dark','light'],lessons:[],studyRoutes:[],physicalDevice:false,errors:[]};
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await context.route('https://**/*',route=>route.abort());
  const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  for(const lesson of lessons){
   await page.goto(base+`lesson.html?lesson=${lesson.id}&view=lab`,{waitUntil:'domcontentloaded'});
   const host=page.locator('[data-flagship-experiment]');await host.locator('dl').waitFor();await page.waitForTimeout(350);
   assert.equal(await host.getAttribute('data-flagship-experiment'),lesson.flagship.experiment);
   const initial=await host.locator('[data-experiment-output]').innerText();
   const field=host.locator('input,textarea,select').first();const tag=await field.evaluate(e=>e.tagName);
   if(tag==='SELECT')await field.selectOption('Y');else await field.fill('');
   assert.equal(await host.locator('[data-experiment-export]').isEnabled(),false);
   if(tag!=='SELECT'){await host.locator('[type=submit]').click();assert(await host.locator('[role=alert]').isVisible());}
   await host.locator('[type=reset]').click();assert.equal(await host.locator('[data-experiment-output]').innerText(),initial);
   const [download]=await Promise.all([page.waitForEvent('download'),host.locator('[data-experiment-export]').click()]);assert.match(download.suggestedFilename(),/experiment.json$/);
   await page.locator('[data-lab-notes]').fill('Content regression: prediction and observed result.');await page.reload();assert.equal(await page.locator('[data-lab-notes]').inputValue(),'Content regression: prediction and observed result.');
   for(const width of report.viewports){await page.setViewportSize({width,height:900});for(const theme of report.themes){await page.evaluate(t=>PortfolioTheme.setTheme(t),theme);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),lesson.id+' overflow at '+width+' '+theme);}}
   if(lesson.flagship.experiment==='prefix'){await page.setViewportSize({width:390,height:844});await host.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'prefix-phone.png')});await page.setViewportSize({width:1440,height:900});await page.screenshot({path:path.join(output,'prefix-desktop.png')});}
   await page.locator('[data-lesson-view=practice]').click();
   const questions=[lesson.quiz,...lesson.assessment];
   for(let i=0;i<questions.length;i++){await page.locator(`.quiz-options [data-option="${questions[i].answer}"]`).click();assert.match(await page.locator('#quiz-feedback').innerText(),/^Correct\./);assert.equal(await page.locator('[data-option-explanations] li').count(),questions[i].options.length);await page.locator('[data-quiz-retry]').click();assert.equal(await page.locator('.quiz-options button:disabled').count(),0);if(i<questions.length-1)await page.locator('[data-quiz-go]').last().click();}
   await page.locator('[data-lesson-view=video]').click();assert.equal(await page.locator('.video-companion iframe').count(),0);
   report.lessons.push(lesson.id);
  }
  const routes=fs.readdirSync(root).filter(f=>f.endsWith('.html')&&fs.readFileSync(path.join(root,f),'utf8').includes('<!-- STUDY COMPANIONS START -->'));
  for(const route of routes){await page.goto(base+route,{waitUntil:'domcontentloaded'});assert(await page.locator('.study-companion').count()>0);for(const width of [320,390,820,1440]){await page.setViewportSize({width,height:900});for(const theme of report.themes){await page.evaluate(t=>PortfolioTheme.setTheme(t),theme);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' overflow '+width+' '+theme);}}report.studyRoutes.push(route);}
  await page.goto(base+'ai-machine-learning.html#study-classifier');await page.setViewportSize({width:390,height:844});await page.locator('#study-classifier').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'classifier-phone.png')});
  await page.goto(base+'learn-paths.html#authored-sequence');assert.equal(await page.locator('#authored-sequence ol>li').count(),32);

  // Website 3.0 knowledge expansion: exercise the actual new controls, not only static markup.
  await page.goto(base+'learn.html',{waitUntil:'domcontentloaded'});await page.locator('[data-solar="learning"][data-approved-solar="1"]').waitFor();assert.equal(await page.locator('[data-solar="learning"] .approved-planet-link').count(),9);
  const solarNames=await page.locator('[data-solar="learning"] .approved-planet-link').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')));assert(solarNames.includes('Select Coding'));assert(solarNames.includes('Select Quantum'));

  await page.goto(base+'learn-coding.html',{waitUntil:'domcontentloaded'});await page.locator('#run-code').waitFor();assert.equal(await page.locator('#code-frame').getAttribute('sandbox'),'allow-scripts');await page.locator('#complexity-class').selectOption('quadratic');await page.locator('#complexity-n').fill('1000');assert.match(await page.locator('#complexity-output').innerText(),/1,000,000 operations/);await page.locator('#track-select').selectOption('hpc');assert.match(await page.locator('#track-output').innerText(),/MPI/);

  await page.goto(base+'learn-quantum.html',{waitUntil:'domcontentloaded'});await page.locator('[data-gate="H"]').click();assert.match(await page.locator('#p0').innerText(),/50\.00%/);assert.match(await page.locator('#p1').innerText(),/50\.00%/);await page.locator('#sample-shots').click();assert.match(await page.locator('#shot-output').innerText(),/Expected probability/);

  await page.goto(base+'ai-development.html',{waitUntil:'domcontentloaded'});await page.locator('#ai-plan-output').waitFor();assert.match(await page.locator('#ai-plan-output').innerText(),/architecture/i);assert.equal(await page.locator('[data-ai-check]').count(),12);

  await page.goto(base+'security-research.html',{waitUntil:'domcontentloaded'});await page.locator('#agentsec-sample').click();await page.locator('#agentsec-run').click();assert.match(await page.locator('#agentsec-output').innerText(),/approval boundary|Broad tool scope/i);await page.locator('#pqc-sample').click();await page.locator('#pqc-run').click();assert.match(await page.locator('#pqc-output').innerText(),/Quantum-vulnerable public-key algorithm/);

  await page.goto(base+'game-development.html',{waitUntil:'domcontentloaded'});await page.locator('#frame-output').waitFor();assert.match(await page.locator('#frame-output').innerText(),/16\.67 ms per frame/);assert.equal(await page.locator('[data-release]').count(),10);

  await page.goto(base+'projects.html',{waitUntil:'domcontentloaded'});await page.locator('#project-filter').fill('quantum');assert((await page.locator('.project-card:visible').count())>=2);await page.locator('[data-project-category="knowledge"]').click();assert.equal(await page.locator('.project-card:visible').count(),2);

  for(const route of ['learn-coding.html','learn-quantum.html','ai-development.html','security-research.html','game-development.html','projects.html']){
    await page.goto(base+route,{waitUntil:'domcontentloaded'});
    for(const width of [320,390,820,1440]){await page.setViewportSize({width,height:900});for(const theme of report.themes){await page.evaluate(t=>PortfolioTheme.setTheme(t),theme);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' expansion overflow '+width+' '+theme);}}
  }

  assert.deepEqual(report.errors,[]);console.log('PASS content browser:',report.lessons.length,'lessons, 40 explained questions,',report.studyRoutes.length,'study routes + knowledge expansion');
 }finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
