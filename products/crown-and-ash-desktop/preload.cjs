const {contextBridge}=require('electron');

contextBridge.exposeInMainWorld('crownAndAshDesktop',Object.freeze({
 desktop:true,
 platform:process.platform
}));
