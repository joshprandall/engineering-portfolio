const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

if(process.platform!=='win32'){
  console.log('SKIP Crown & Ash installed Windows smoke: Windows-only gate.');
  process.exit(0);
}

const installerArg=process.argv[2];
assert(installerArg,'Usage: node tests/chess-windows-installed-smoke.cjs <installer.exe>');
const installer=path.resolve(installerArg);
assert(fs.existsSync(installer),`Installer not found: ${installer}`);
assert(fs.statSync(installer).size>20_000_000,`Installer is unexpectedly small: ${installer}`);
const desktopPackage=JSON.parse(fs.readFileSync(path.join(__dirname,'..','products','crown-and-ash-desktop','package.json'),'utf8'));
assert.equal(path.basename(installer),`Crown-and-Ash-${desktopPackage.version}-x64.exe`,'Installer filename must match product version and x64 release naming.');

function sha256(file){
  const hash=crypto.createHash('sha256');
  const bytes=fs.readFileSync(file);
  hash.update(bytes);
  return hash.digest('hex');
}
const installerSha256=sha256(installer);
assert.match(installerSha256,/^[a-f0-9]{64}$/,'Installer SHA-256 is invalid.');
console.log(`Installer SHA-256: ${installerSha256}`);

function run(file,args,options={}){
  const result=spawnSync(file,args,{
    encoding:'utf8',
    windowsHide:true,
    maxBuffer:4*1024*1024,
    ...options
  });
  if(result.error)throw result.error;
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  assert.equal(result.signal,null,`${path.basename(file)} terminated by signal ${result.signal}`);
  assert.equal(result.status,0,`${path.basename(file)} exited with status ${result.status}`);
  return result;
}

function walk(root,predicate,depth=5){
  if(!root||!fs.existsSync(root))return[];
  const found=[];
  function visit(dir,level){
    if(level>depth)return;
    let entries;
    try{
      entries=fs.readdirSync(dir,{withFileTypes:true});
    }catch(error){
      if(error&&['EACCES','EPERM','ENOENT'].includes(error.code))return;
      throw error;
    }
    for(const entry of entries){
      const full=path.join(dir,entry.name);
      if(entry.isDirectory())visit(full,level+1);
      else if(predicate(full,entry))found.push(full);
    }
  }
  visit(root,0);
  return found;
}

const roots=[
  process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'Programs'),
  process.env.ProgramFiles,
  process.env['ProgramFiles(x86)']
].filter(Boolean);

const findInstalledExecutables=()=>roots.flatMap(root=>walk(
  root,
  full=>path.basename(full).toLowerCase()==='crown-and-ash.exe'
));

const before=new Set(findInstalledExecutables());
const installStarted=Date.now();
let appExe;
let profile;

try{
  console.log(`Installing Crown & Ash test package: ${installer}`);
  const install=run(installer,['/S'],{timeout:120_000,stdio:['ignore','pipe','pipe']});
  assert.doesNotMatch(
    `${install.stdout||''}\n${install.stderr||''}`,
    /is not recognized as an internal or external command/i,
    'NSIS install emitted a Windows command-parsing error.'
  );

  const appCandidates=findInstalledExecutables().filter(full=>{
    if(!before.has(full))return true;
    try{return fs.statSync(full).mtimeMs>=installStarted-2_000}catch{return false}
  });
  assert(appCandidates.length>0,'Installed Crown & Ash executable was not found after silent NSIS install.');
  appCandidates.sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs);
  appExe=appCandidates[0];
  assert.equal(path.basename(appExe),'Crown-and-Ash.exe','Installed executable name must remain shell-safe.');
  console.log(`Installed executable: ${appExe}`);
  assert(fs.statSync(appExe).size>20_000_000,`Installed executable is unexpectedly small: ${appExe}`);
  const resourcesDir=path.join(path.dirname(appExe),'resources');
  const appAsar=path.join(resourcesDir,'app.asar');
  assert(fs.existsSync(appAsar),'Installed release is missing resources/app.asar.');
  assert(fs.statSync(appAsar).size>100_000,'Installed app.asar is unexpectedly small.');
  assert.equal(fs.existsSync(path.join(resourcesDir,'app')),false,'Installed release must not expose a loose resources/app source tree.');
  const appExeSha256=sha256(appExe);
  const appAsarSha256=sha256(appAsar);
  assert.notEqual(appExeSha256,appAsarSha256,'Executable and app.asar must not share the same digest.');
  console.log(`Installed executable SHA-256: ${appExeSha256}`);
  console.log(`Installed app.asar SHA-256: ${appAsarSha256}`);

  profile=fs.mkdtempSync(path.join(os.tmpdir(),'crown-ash-fresh-profile-'));
  const resultPath=path.join(profile,'smoke-result.json');

  run(appExe,[
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--disable-default-apps'
  ],{
    timeout:90_000,
    stdio:['ignore','pipe','pipe'],
    env:{...process.env,CROWN_ASH_SMOKE:'1',CROWN_ASH_SMOKE_RESULT:resultPath}
  });

  assert(fs.existsSync(resultPath),'Installed runtime did not emit smoke evidence.');
  const evidence=JSON.parse(fs.readFileSync(resultPath,'utf8'));

  assert.equal(evidence.ready,true,'Installed runtime did not reach ready state.');
  assert.equal(typeof evidence.title,'string','Installed runtime did not report a document title.');
  assert(
    evidence.title.startsWith('Crown & Ash'),
    `Installed runtime title is not Crown & Ash branded: ${evidence.title}`
  );
  assert.equal(evidence.start,true,'Installed runtime start control was not present.');
  assert.equal(evidence.localThree,true,'Installed runtime did not use the pinned local Three.js bundle.');
  assert.equal(evidence.desktopBridge,true,'Installed runtime desktop preload bridge was unavailable.');
  assert.equal(evidence.protocol,'file:','Installed runtime was not loaded from the offline file protocol.');

  const appDir=path.dirname(appExe);
  const uninstallers=walk(
    appDir,
    full=>/^uninstall.*\.exe$/i.test(path.basename(full)),
    2
  );
  assert(uninstallers.length>0,'Crown & Ash uninstaller was not found in the installed application directory.');
  console.log(`Uninstaller: ${uninstallers[0]}`);
  run(uninstallers[0],['/S'],{timeout:120_000,stdio:['ignore','pipe','pipe']});

  for(let i=0;i<40&&fs.existsSync(appExe);i++){
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,250);
  }
  assert.equal(fs.existsSync(appExe),false,'Crown & Ash executable remained after silent uninstall.');

  console.log('PASS Crown & Ash Windows installed lifecycle + artifact integrity: versioned installer, SHA-256 evidence, ASAR packaging, silent install, installed fresh-profile offline/runtime assertions, clean smoke exit, and silent uninstall.');
}finally{
  if(profile)fs.rmSync(profile,{recursive:true,force:true});
}
