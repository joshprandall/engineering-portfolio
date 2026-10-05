const fs=require('node:fs');

const battlePath='games/3d-battle-chess/battle.js';
let battle=fs.readFileSync(battlePath,'utf8');

const setupNeedle=" updateContinueButton();\n window.addEventListener('orientationchange',()=>setTimeout(updateRotateGate,120));\n}";
const setupReplacement=" updateContinueButton();\n window.addEventListener('orientationchange',()=>setTimeout(updateRotateGate,120));\n if(!gamepadFrame)gamepadFrame=requestAnimationFrame(gamepadLoop);\n}";
if(!battle.includes(setupNeedle))throw new Error('connectSetup anchor not found');
battle=battle.replace(setupNeedle,setupReplacement);

const start=battle.indexOf('function gamepadLoop(){');
const end=battle.indexOf('\nfunction connectButtons(){',start);
if(start<0||end<0)throw new Error('gamepadLoop block not found');

const replacement=`function controllerElementVisible(el){
 return !!el&&!el.hidden&&!el.classList.contains('hidden')&&!el.closest('[hidden],.hidden')&&getComputedStyle(el).display!=='none';
}
function controllerContext(){
 const promotion=$('#promotion'),gameOver=$('#gameOver'),controls=$('#controls');
 const choose=ids=>ids.map(id=>$('#'+id)).filter(controllerElementVisible);
 if(!started&&!setupScreen.classList.contains('hidden'))return{key:'setup',items:choose(['setupMode','setupTheme','setupDifficulty','setupView','setupQuality','setupSound','setupCombat','startGameBtn','continueGameBtn'])};
 if(promotion&&!promotion.classList.contains('hidden'))return{key:'promotion',items:[...$('#promotionChoices').querySelectorAll('button')].filter(controllerElementVisible)};
 if(gameOver&&!gameOver.classList.contains('hidden'))return{key:'result',items:choose(['rematch','resultSetup'])};
 if(started&&controls?.classList.contains('open'))return{key:'menu',items:choose(['mode','theme','difficulty','quality','newGame','undo','flip','viewToggle','combatToggle','sound','saveGame','fullscreenBtn','exitGame'])};
 return null;
}
function syncControllerContext(context){
 if(!context?.items.length)return;
 if(gamepadLoop.uiKey!==context.key){
  gamepadLoop.uiKey=context.key;
  gamepadLoop.uiIndex=Math.max(-1,context.items.indexOf(document.activeElement));
 }
}
function focusControllerItem(context,delta){
 if(!context?.items.length)return;
 syncControllerContext(context);
 gamepadLoop.uiIndex=clamp((gamepadLoop.uiIndex??-1)+delta,0,context.items.length-1);
 const target=context.items[gamepadLoop.uiIndex];
 if(target&&!target.disabled)target.focus();
}
function activateControllerItem(context){
 if(!context?.items.length)return false;
 syncControllerContext(context);
 const active=document.activeElement;
 let index=context.items.indexOf(active);
 if(index<0)index=Math.max(0,gamepadLoop.uiIndex||0);
 const target=context.items[index];
 if(!target||target.disabled)return false;
 gamepadLoop.uiIndex=index;
 if(target.tagName==='SELECT'){
  const options=[...target.options].filter(option=>!option.disabled&&!option.hidden);
  const current=Math.max(0,options.indexOf(target.selectedOptions[0]));
  target.value=options[(current+1)%options.length].value;
  target.dispatchEvent(new Event('change',{bubbles:true}));
 }else target.click();
 return true;
}
function closeControllerMenu(){
 const controls=$('#controls');
 if(!controls?.classList.contains('open'))return false;
 controls.classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');
 gamepadLoop.uiKey='board';gamepadLoop.uiIndex=-1;
 sceneEl?.focus?.();
 return true;
}
function gamepadLoop(){
 const pad=navigator.getGamepads?.()[0];
 if(pad){
  const pressed=pad.buttons.map(button=>button.pressed),edge=index=>pressed[index]&&!lastGamepadButtons[index];
  const now=performance.now(),axisReady=!gamepadLoop.lastAxis||now-gamepadLoop.lastAxis>170;
  const promotionOpen=!$('#promotion').classList.contains('hidden'),resultOpen=!$('#gameOver').classList.contains('hidden');
  let context=controllerContext(),dx=0,dy=0;
  if(edge(9)&&started&&!promotionOpen&&!resultOpen){
   const controls=$('#controls'),open=controls.classList.toggle('open');
   $('#menuBtn').setAttribute('aria-expanded',String(open));
   gamepadLoop.uiKey=open?'menu':'board';gamepadLoop.uiIndex=open?0:-1;
   if(open)$('#mode')?.focus();else sceneEl?.focus?.();
   context=controllerContext();
  }
  if(edge(14))dx=-1;else if(edge(15))dx=1;
  if(edge(12))dy=-1;else if(edge(13))dy=1;
  if(context){
   if(dy)focusControllerItem(context,dy>0?1:-1);
   else if(dx)focusControllerItem(context,dx>0?1:-1);
   else if(axisReady){
    const ay=pad.axes[1]??pad.axes[7]??0,ax=pad.axes[0]??pad.axes[6]??0;
    const step=Math.abs(ay)>.55?(ay>0?1:-1):Math.abs(ax)>.55?(ax>0?1:-1):0;
    if(step){focusControllerItem(context,step);gamepadLoop.lastAxis=now}
   }
   if(edge(0))activateControllerItem(controllerContext()||context);
   if(edge(1)&&context.key==='menu')closeControllerMenu();
  }else if(started){
   if(dx||dy){keyboardCursor=true;nudgeCursor(dx,dy)}
   else if(axisReady){
    if(pad.axes[0]<-.55||pad.axes[6]<-.55)dx=-1;else if(pad.axes[0]>.55||pad.axes[6]>.55)dx=1;
    if(pad.axes[1]<-.55||pad.axes[7]<-.55)dy=-1;else if(pad.axes[1]>.55||pad.axes[7]>.55)dy=1;
    if(dx||dy){keyboardCursor=true;nudgeCursor(dx,dy);gamepadLoop.lastAxis=now}
   }
   if(edge(0)){keyboardCursor=true;chooseSquare(handCursor.x,handCursor.y)}
   if(edge(1)){selected=null;legal=[];highlight()}
   if(edge(2))flipBoard();
   if(edge(3))setView(viewMode==='3d'?'2d':'3d');
   if(edge(4))undoMove();
  }
  lastGamepadButtons=pressed;
 }else lastGamepadButtons=[];
 gamepadFrame=requestAnimationFrame(gamepadLoop);
}`;

battle=battle.slice(0,start)+replacement+battle.slice(end);
fs.writeFileSync(battlePath,battle);

const workflowPath='.github/workflows/crown-and-ash-controller.yml';
let workflow=fs.readFileSync(workflowPath,'utf8');
workflow=workflow.replaceAll('      - "tests/chess-controller.test.cjs"','      - "tests/chess-controller.test.cjs"\n      - "tests/chess-controller-focus.test.cjs"');
const step=`      - name: Verify controller focus across setup, menus, promotion, and results
        env:
          PORTFOLIO_RUNTIME_ROOT: \${{ github.workspace }}
          PORTFOLIO_BROWSER_EXECUTABLE: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
        run: node tests/chess-controller-focus.test.cjs
`;
if(!workflow.includes('node tests/chess-controller-focus.test.cjs'))workflow=workflow.trimEnd()+'\n'+step;
fs.writeFileSync(workflowPath,workflow);
