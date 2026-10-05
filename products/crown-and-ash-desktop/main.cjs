const path=require('node:path');
const {app,BrowserWindow,Menu,shell}=require('electron');

app.setName('Crown & Ash');

function createWindow(){
 const gameRoot=path.join(__dirname,'app');
 const gameEntry=path.join(gameRoot,'index.html');
 const window=new BrowserWindow({
  width:1600,
  height:1000,
  minWidth:1024,
  minHeight:640,
  backgroundColor:'#071019',
  autoHideMenuBar:true,
  show:false,
  title:'Crown & Ash',
  webPreferences:{
   preload:path.join(__dirname,'preload.cjs'),
   contextIsolation:true,
   nodeIntegration:false,
   sandbox:true,
   webSecurity:true,
   spellcheck:false
  }
 });
 Menu.setApplicationMenu(null);
 window.once('ready-to-show',()=>window.show());
 window.webContents.setWindowOpenHandler(({url})=>{if(/^https?:/i.test(url))void shell.openExternal(url);return{action:'deny'}});
 window.webContents.on('will-navigate',(event,url)=>{
  if(url.startsWith('file:')&&decodeURI(new URL(url).pathname).includes('/app/'))return;
  event.preventDefault();
  if(/^https?:/i.test(url))void shell.openExternal(url);
 });
 window.webContents.on('before-input-event',(event,input)=>{
  if(input.type!=='keyDown')return;
  if(input.key==='F11'){event.preventDefault();window.setFullScreen(!window.isFullScreen())}
  if(!app.isPackaged&&(input.key==='F12'||input.control&&input.shift&&input.key.toLowerCase()==='i'))window.webContents.toggleDevTools();
 });
 if(process.env.CROWN_ASH_SMOKE==='1'){
  window.webContents.once('did-fail-load',(_event,code,description)=>{console.error(`CROWN_ASH_DESKTOP_LOAD_FAILED ${code} ${description}`);app.exit(1)});
  window.webContents.once('did-finish-load',async()=>{
   const result=await window.webContents.executeJavaScript("({title:document.title,start:!!document.querySelector('#startGameBtn'),localThree:document.querySelector('script[type=importmap]')?.textContent.includes('./vendor/three/'),edition:window.crownAndAshDesktop?.edition||null,desktopBridge:window.crownAndAshDesktop?.desktop===true,protocol:location.protocol})");
   console.log(`CROWN_ASH_DESKTOP_READY ${JSON.stringify(result)}`);
   app.exit(result.start&&result.localThree&&result.desktopBridge&&result.edition==='full'&&result.protocol==='file:'?0:1);
  });
 }
 void window.loadFile(gameEntry);
}

app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
