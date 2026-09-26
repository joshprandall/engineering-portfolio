const {spawnSync}=require('node:child_process');
const commands=process.env.PYTHON?[[process.env.PYTHON]]:process.platform==='win32'?[['py','-3'],['python'],['python3']]:[['python3'],['python']];
const python=commands.find(c=>spawnSync(c[0],[...c.slice(1),'-c','import sys;assert sys.version_info >= (3,10)'],{stdio:'ignore'}).status===0);
if(!python){console.error('Python 3.10+ is required. Set PYTHON to its executable path.');process.exit(1);}
for(const [command,args]of [[python[0],[...python.slice(1),'-m','py_compile','tools/repair-osu-portfolio.py','tools/deploy_osu_live.py']],[process.execPath,['tests/site.test.mjs']],[process.execPath,['tests/chess-rules.test.mjs']],[python[0],[...python.slice(1),'-m','unittest','discover','-s','tests','-p','test_deploy.py']]]){
 const result=spawnSync(command,args,{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
