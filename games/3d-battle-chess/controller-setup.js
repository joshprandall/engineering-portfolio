// Controller-only navigation for the pre-game setup screen.
// Intentionally stops at the setup boundary so the in-game controller loop remains authoritative.
const setup=document.getElementById('setupScreen');

if(setup){
 let lastButtons=[];
 let lastAxisAt=0;
 let pendingLaunch=null;

 const visible=element=>{
  if(!element||element.disabled||element.hidden||element.closest('[hidden]'))return false;
  const style=getComputedStyle(element);
  return style.display!=='none'&&style.visibility!=='hidden'&&element.getClientRects().length>0;
 };

 const targets=()=>[...setup.querySelectorAll('select,input[type="checkbox"],button,summary')].filter(visible);
 const setupActive=()=>!setup.classList.contains('hidden')&&visible(setup);

 function focusStep(delta){
  const list=targets();
  if(!list.length)return;
  const index=list.indexOf(document.activeElement);
  if(index<0){
   (delta<0?list[list.length-1]:list[0]).focus();
   return;
  }
  list[(index+delta+list.length)%list.length].focus();
 }

 function changeSelect(select,delta){
  const options=[...select.options].filter(option=>!option.disabled);
  if(options.length<2)return;
  const current=Math.max(0,options.findIndex(option=>option.value===select.value));
  const next=options[(current+delta+options.length)%options.length];
  if(!next||next.value===select.value)return;
  select.value=next.value;
  select.dispatchEvent(new Event('input',{bubbles:true}));
  select.dispatchEvent(new Event('change',{bubbles:true}));
 }

 function horizontal(delta){
  const active=document.activeElement;
  if(active instanceof HTMLSelectElement){
   changeSelect(active,delta);
   return;
  }
  if(active instanceof HTMLInputElement&&active.type==='checkbox'){
   const next=delta>0;
   if(active.checked!==next){
    active.checked=next;
    active.dispatchEvent(new Event('input',{bubbles:true}));
    active.dispatchEvent(new Event('change',{bubbles:true}));
   }
  }
 }

 function activate(){
  const list=targets();
  const active=list.includes(document.activeElement)?document.activeElement:null;
  if(!active){
   list[0]?.focus();
   return;
  }
  if(active instanceof HTMLSelectElement){
   changeSelect(active,1);
   return;
  }
  if(active instanceof HTMLButtonElement&&(active.id==='startGameBtn'||active.id==='continueGameBtn')){
   pendingLaunch=active;
   return;
  }
  active.click();
 }

 function cancel(){
  const openDetails=[...setup.querySelectorAll('details[open]')].find(visible);
  if(openDetails){
   openDetails.open=false;
   openDetails.querySelector('summary')?.focus();
   return;
  }
  const start=document.getElementById('startGameBtn');
  if(visible(start))start.focus();
 }

 function menuShortcut(){
  const start=document.getElementById('startGameBtn');
  if(visible(start))start.focus();
 }

 function frame(now){
  const pad=navigator.getGamepads?.()[0];
  if(!setupActive()||!pad){
   if(!setupActive()){lastButtons=[];pendingLaunch=null;}
   requestAnimationFrame(frame);
   return;
  }

  const pressed=pad.buttons.map(button=>!!button.pressed);
  const edge=index=>!!pressed[index]&&!lastButtons[index];

  if(pendingLaunch&&!pressed[0]){
   const launch=pendingLaunch;
   pendingLaunch=null;
   requestAnimationFrame(()=>{if(setupActive()&&visible(launch))launch.click();});
   lastButtons=pressed;
   requestAnimationFrame(frame);
   return;
  }

  if(edge(12))focusStep(-1);
  else if(edge(13))focusStep(1);
  else if(edge(14))horizontal(-1);
  else if(edge(15))horizontal(1);

  const axisReady=now-lastAxisAt>=180;
  if(axisReady){
   const x=pad.axes?.[0]??0;
   const y=pad.axes?.[1]??0;
   if(y<-.6){focusStep(-1);lastAxisAt=now;}
   else if(y>.6){focusStep(1);lastAxisAt=now;}
   else if(x<-.6){horizontal(-1);lastAxisAt=now;}
   else if(x>.6){horizontal(1);lastAxisAt=now;}
  }

  if(edge(0))activate();
  if(edge(1))cancel();
  if(edge(9))menuShortcut();

  lastButtons=pressed;
  requestAnimationFrame(frame);
 }

 window.addEventListener('gamepadconnected',()=>{
  if(setupActive()&&!targets().includes(document.activeElement))targets()[0]?.focus();
 });

 requestAnimationFrame(frame);
}
