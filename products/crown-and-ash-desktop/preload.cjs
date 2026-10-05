const {contextBridge}=require('electron');

contextBridge.exposeInMainWorld('crownAndAshDesktop',Object.freeze({
 desktop:true,
 edition:'full',
 platform:process.platform
}));
