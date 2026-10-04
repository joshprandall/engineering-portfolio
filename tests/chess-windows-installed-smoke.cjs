const assert=require('node:assert/strict');
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
assert(fs.statSync(installer).size>1_000_000,`Installer is unexpectedly small: ${installer}`);

function run(file,args,options={}){
  const result=spawnSync(file,args,{encoding:'utf8',windowsHide:true,...options});
  if(result.error)throw result.error;
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  assert.equal(result.signal,null,`${path.basename(file)} terminated by signal ${result.signal}`);
  assert.equal(result.status,0,`${path.basename(file)} exited with status ${result.status}`);
  return result;
}

function walk(root,predicate,depth=4){
  if(!root||!fs.existsSync(root))return[];
  const found=[];
  function visit(dir,level){
    if(level>depth)return;
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const full=path.join(dir,entry.name);
      if(entry.isDirectory())visit(full,level+1);
      else if(predicate(full,entry))found.push(full);
    }
  }
  visit(root,0);
  return found;
}

console.log(`Installing Crown & Ash test package: ${installer}`);
run(installer,['/S'],{timeout:120_000,stdio:['ignore','pipe','pipe']});

const roots=[
  process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'Programs'),
  process.env.ProgramFiles,
  process.env['ProgramFiles(x86)']
].filter(Boolean);

const appCandidates=roots.flatMap(root=>walk(
  root,
  full=>path.basename(full).toLowerCase()==='crown & ash.exe',
  5
));
assert(appCandidates.length>0,'Installed Crown & Ash executable was not found after silent NSIS install.');
appCandidates.sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs);
const appExe=appCandidates[0];
console.log(`Installed executable: ${appExe}`);

const profile=fs.mkdtempSync(path.join(os.tmpdir(),'crown-ash-fresh-profile-'));
const smoke=run(appExe,[
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--disable-default-apps'
],{
  timeout:90_000,
  env:{...process.env,CROWN_ASH_SMOKE:'1'}
});
assert.equal(smoke.status,0,'Packaged Crown & Ash fresh-profile smoke failed.');

const appDir=path.dirname(appExe);
const uninstallers=walk(
  appDir,
  full=>/^uninstall.*\.exe$/i.test(path.basename(full)),
  2
);
assert(uninstallers.length>0,'Crown & Ash uninstaller was not found in the installed application directory.');
console.log(`Uninstaller: ${uninstallers[0]}`);
run(uninstallers[0],['/S'],{timeout:120_000,stdio:['ignore','pipe','pipe']});

for(let i=0;i<20&&fs.existsSync(appExe);i++)Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,250);
assert.equal(fs.existsSync(appExe),false,'Crown & Ash executable remained after silent uninstall.');

fs.rmSync(profile,{recursive:true,force:true});
console.log('PASS Crown & Ash Windows installed smoke: NSIS install, packaged fresh-profile launch, built-in offline runtime check, clean exit, and uninstall.');
