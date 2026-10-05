import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {chooseComputerMove,computerProfile} from './engine.js';
import {game} from './shared-game.js';
import {PALETTES} from './pieces.js';
import {createCharacter} from './characters.js';
import {createV8BoardPiece} from './combat-v8/character-factory.js';
import {animateDuel} from './duels.js';
import {animateDuelV8} from './duels-v8.js';
import {castleAttempt,castleNotation} from './castle-controls.js';
import {ATTACK_NAMES} from './attacks.js';
import {GameAudio} from './audio.js';
import {loadSettings,saveSettings,loadSavedMatch,saveMatch,savedMatchSummary} from './game-storage.js';
import {currentEdition,currentCapabilities,FULL_EDITION} from './edition.mjs';

const $=s=>document.querySelector(s);
const sceneEl=$('#scene'),board2d=$('#board2d'),logEl=$('#log'),turnEl=$('#turn'),stateEl=$('#state'),gameShell=$('#gameShell'),setupScreen=$('#setupScreen'),rotateGate=$('#rotateGate'),audio=new GameAudio();
const themes=PALETTES;
const edition=currentEdition(window),capabilities=currentCapabilities(window);
let theme='classic',selected=null,legal=[],busy=false,soundOn=true,animatedCombat=capabilities.animatedCombat,quality='auto',aiTimer=null,generation=0,toastTimer=null,scene,camera,renderer,orbit,boardGroup,pieceGroup,fxGroup;
let viewMode='3d',flipped=false,handCursor={x:4,y:6},keyboardCursor=false,fullscreenStarted=false,webglReady=false,initialized=false,started=false,resultShown=false,gamepadFrame=0,lastGamepadButtons=[];
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const query=new URLSearchParams(location.search);
const useV8Combat=capabilities.cinematicCaptures&&query.get('combat')!=='v7';
const themeLabels={classic:'Classic',arcane:'Arcane',monsters:'Monsters',brick:'Brick Battle',cosmic:'Cosmic War'};
const normalizeTheme=value=>capabilities.themes.includes(value)?value:'classic';
const normalizeCombat=value=>capabilities.animatedCombat&&value!==false;
const handheldDevice=()=>{
 const ua=navigator.userAgent||'';
 const explicit=/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
 const ipadDesktopUA=navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 const coarseTouch=navigator.maxTouchPoints>0&&matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<=1024;
 return explicit||ipadDesktopUA||coarseTouch;
};
const glyphs={w:{p:'♙',n:'♘',b:'♗',r:'♖',q:'♕',k:'♔'},b:{p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'}};
const roleNames={p:'Pawn',n:'Knight',b:'Bishop',r:'Rook',q:'Queen',k:'King'};
const coord=(x,y)=>String.fromCharCode(97+x)+(8-y);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const handheldActive=()=>handheldDevice();
const cursorVisible=()=>keyboardCursor;
const nativeFullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement||null;

const fullscreenActive=()=>!!nativeFullscreenElement()||gameShell.classList.contains('immersive-fullscreen');
const needsLandscape=()=>handheldActive()&&window.innerHeight>window.innerWidth;
function updateRotateGate(){
 if(!rotateGate)return;
 const active=started&&needsLandscape();
 rotateGate.classList.toggle('active',active);
 rotateGate.setAttribute('aria-hidden',String(!active));
}
function syncSoundUI(){
 $('#sound').textContent=soundOn?'Sound on':'Sound off';
 $('#sound').setAttribute('aria-pressed',String(soundOn));
 $('#handSound').textContent=soundOn?'Sound on':'Sound off';
}
function syncEditionSelect(select){
 if(!select)return;
 const wanted=new Set(capabilities.themes);
 for(const option of [...select.options])if(!wanted.has(option.value))option.remove();
 for(const value of capabilities.themes)if(![...select.options].some(option=>option.value===value)){
  const option=document.createElement('option');option.value=value;option.textContent=themeLabels[value]||value;select.append(option);
 }
 select.value=normalizeTheme(select.value);
}
function applyEditionUI(){
 const full=edition===FULL_EDITION;
 document.documentElement.dataset.crownAshEdition=edition;
 document.title=`Crown & Ash — ${capabilities.label}`;
 syncEditionSelect($('#setupTheme'));syncEditionSelect($('#theme'));
 for(const el of document.querySelectorAll('[data-full-only]')){el.hidden=!full;el.classList.toggle('hidden',!full);}
 const setupCombat=$('#setupCombat');
 if(setupCombat){setupCombat.disabled=!full;setupCombat.checked=full&&normalizeCombat(setupCombat.checked);}
 const combatToggle=$('#combatToggle');
 if(combatToggle)combatToggle.disabled=!full;
 const lead=document.querySelector('.setup-lead');
 if(lead)lead.textContent=full
  ?'Choose a faction, opponent, and presentation profile. Full Edition captures become cinematic character confrontations while chess legality remains authoritative.'
  :'Crown & Ash Basic Edition delivers complete chess in the browser with a polished Classic board, computer or local play, save/load, match tools, controller support, and 2D/3D views. The cinematic Full Edition is reserved for Windows/Steam.';
 const kicker=document.querySelector('.setup-kicker');
 if(kicker)kicker.textContent=full?'CINDRVAULT PRESENTS / CROWN & ASH FULL EDITION':'CINDRVAULT PRESENTS / CROWN & ASH BASIC EDITION';
}
function currentSettings(){return{mode:$('#mode')?.value||$('#setupMode')?.value||'ai',theme:normalizeTheme(theme),difficulty:$('#difficulty')?.value||$('#setupDifficulty')?.value||'2',view:viewMode,sound:soundOn,quality,animatedCombat:normalizeCombat(animatedCombat),edition}}
function persistSettings(){saveSettings(currentSettings())}
function persistMatch(){if(started)saveMatch({game,settings:currentSettings(),flipped})}
function updateContinueButton(){const saved=loadSavedMatch(),button=$('#continueGameBtn');if(!button)return;button.classList.toggle('hidden',!saved);$('#continueSummary').textContent=savedMatchSummary(saved)||''}
function syncCombatUI(){for(const selector of ['#combatToggle']){const el=$(selector);if(el){el.textContent=animatedCombat?'Battles on':'Battles off';el.setAttribute('aria-pressed',String(animatedCombat))}}}
function syncSetupDifficulty(){
 const local=$('#setupMode')?.value==='local';
 if($('#setupDifficulty'))$('#setupDifficulty').disabled=local;
}
function launchFromSetup(){return launchConfiguredGame(false)}
async function launchConfiguredGame(resume=false){
 const saved=resume?loadSavedMatch():null;
 if(resume&&!saved){notice('No saved battle is available.');updateContinueButton();return}
 const mode=saved?.settings.mode||$('#setupMode').value;
 const nextTheme=normalizeTheme(saved?.settings.theme||$('#setupTheme').value);
 const difficulty=saved?.settings.difficulty||$('#setupDifficulty').value;
 const nextView=saved?.settings.view||$('#setupView').value;
 const nextSound=saved?.settings.sound??$('#setupSound').checked;
 const nextQuality=saved?.settings.quality||$('#setupQuality').value;
 const nextCombat=normalizeCombat(saved?.settings.animatedCombat??$('#setupCombat').checked);
 $('#mode').value=mode;$('#theme').value=nextTheme;$('#difficulty').value=difficulty;
 $('#quality').value=nextQuality;theme=nextTheme;viewMode=nextView;soundOn=nextSound;quality=nextQuality;animatedCombat=nextCombat;flipped=!!saved?.flipped;
 if(saved){try{game.loadRecord(saved.game)}catch(error){notice(error.message);updateContinueButton();return}}else game.reset();
 setupScreen.classList.add('hidden');gameShell.classList.remove('hidden');gameShell.setAttribute('aria-hidden','false');
 document.body.classList.add('playing');started=true;fullscreenStarted=true;
 void enterFullscreen();
 const wasInitialized=initialized;
 init();
 await audio.setEnabled(soundOn);syncSoundUI();syncCombatUI();applyQuality();
 if(wasInitialized){
  audio.setTheme(theme);createBoard();selected=null;legal=[];drawPieces();renderStatus();setView(viewMode,false);
 }else{
  setView(viewMode,false);
 }
 if(camera&&orbit){camera.position.set(flipped?-8.5:8.5,10,flipped?-9.5:9.5);orbit.target.set(0,.25,0);orbit.update()}
 persistSettings();persistMatch();
 if(mode==='ai'&&game.turn==='b'&&!game.status().over)queueComputer();
 updateRotateGate();
 requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
}
async function exitToSetup(){
 if(busy)return;
 generation++;clearTimeout(aiTimer);
 await exitFullscreen();
 started=false;fullscreenStarted=false;
 document.body.classList.remove('playing','immersive-lock');
 gameShell.classList.add('hidden');gameShell.setAttribute('aria-hidden','true');
 setupScreen.classList.remove('hidden');
 $('#controls').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');
 const settings=loadSettings();applyEditionUI();$('#setupMode').value=settings.mode;$('#setupTheme').value=normalizeTheme(settings.theme);$('#setupDifficulty').value=settings.difficulty;$('#setupView').value=settings.view;$('#setupQuality').value=settings.quality;$('#setupSound').checked=settings.sound;$('#setupCombat').checked=normalizeCombat(settings.animatedCombat);syncSetupDifficulty();updateContinueButton();
 updateRotateGate();$('#startGameBtn')?.focus();
}
function connectSetup(){
 applyEditionUI();
 const settings=loadSettings();
 $('#setupMode').value=settings.mode;$('#setupTheme').value=normalizeTheme(settings.theme);$('#setupDifficulty').value=settings.difficulty;$('#setupView').value=settings.view;$('#setupQuality').value=settings.quality;$('#setupSound').checked=settings.sound;$('#setupCombat').checked=normalizeCombat(settings.animatedCombat);
 syncSetupDifficulty();
 $('#setupMode').addEventListener('change',syncSetupDifficulty);
 $('#startGameBtn').addEventListener('click',()=>void launchFromSetup());
 $('#continueGameBtn').addEventListener('click',()=>void launchConfiguredGame(true));
 updateContinueButton();
 window.addEventListener('orientationchange',()=>setTimeout(updateRotateGate,120));
}

function material(color,glow=0){return new THREE.MeshStandardMaterial({color,roughness:.4,metalness:theme==='cosmic'?.65:.16,emissive:glow,emissiveIntensity:.35})}
function clearGroup(group){if(!group)return;while(group.children.length){const item=group.children[0];group.remove(item);item.traverse(node=>{node.geometry?.dispose();if(node.material)(Array.isArray(node.material)?node.material:[node.material]).forEach(m=>m.dispose())})}}
function createBoard(){
 if(!boardGroup)return;
 clearGroup(boardGroup);
 const p=themes[theme];
 sceneEl.style.background=`radial-gradient(ellipse at 50% 27%, ${new THREE.Color(p.back).offsetHSL(0,0,.055).getStyle()} 0%, ${new THREE.Color(p.back).getStyle()} 55%, #0a1521 100%)`;
 scene.fog.color.setHex(p.back);
 const ground=new THREE.Mesh(new THREE.CircleGeometry(7.2,64),new THREE.MeshStandardMaterial({color:p.back,roughness:.96,metalness:.08}));
 ground.rotation.x=-Math.PI/2;ground.position.y=-.48;ground.receiveShadow=true;boardGroup.add(ground);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(5.08,.035,8,72),material(p.glow,p.glow));halo.position.y=-.4;halo.rotation.x=Math.PI/2;boardGroup.add(halo);
 const base=new THREE.Mesh(new THREE.BoxGeometry(9,.36,9),material(0x1a2837));base.position.y=-.25;base.receiveShadow=true;boardGroup.add(base);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  const sq=new THREE.Mesh(new THREE.BoxGeometry(.98,.12,.98),material((x+y)%2?p.dark:p.light));
  sq.position.set(x-3.5,0,y-3.5);sq.userData={square:true,x,y};sq.receiveShadow=true;boardGroup.add(sq);
 }
}
function render2D(){
 if(!board2d)return;
 const rows=flipped?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7],cols=flipped?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
 const frag=document.createDocumentFragment();
 for(const y of rows)for(const x of cols){
  const p=game.piece(x,y),b=document.createElement('button'),m=legal.find(v=>v.nx===x&&v.ny===y);
  b.type='button';b.className='square2d '+((x+y)%2?'dark':'light');
  if(p)b.classList.add(p.c==='w'?'white-piece':'black-piece');
  if(selected&&selected.x===x&&selected.y===y)b.classList.add('selected');
  if(m)b.classList.add(game.piece(x,y)||game.ep?.x===x&&game.ep?.y===y?'capture':'legal');
  if(cursorVisible()&&handCursor.x===x&&handCursor.y===y)b.classList.add('cursor');
  b.dataset.x=x;b.dataset.y=y;b.setAttribute('role','gridcell');
  b.setAttribute('aria-label',p?`${p.c==='w'?'White':'Black'} ${roleNames[p.t]} on ${coord(x,y)}`:coord(x,y));
  b.textContent=p?glyphs[p.c][p.t]:'';
  b.onclick=()=>{void audio.ensure();beginPlayFullscreen();handCursor={x,y};chooseSquare(x,y)};
  frag.appendChild(b);
 }
 board2d.replaceChildren(frag);
 updateHandheldStatus();
}
function drawPieces(){
 if(pieceGroup){
  clearGroup(pieceGroup);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(game.piece(x,y)){
   const p=game.piece(x,y);
   pieceGroup.add(useV8Combat?createV8BoardPiece(p,x,y,theme):createCharacter(p,x,y,theme));
  }
 }
 highlight();
}
function highlight(){
 if(boardGroup)for(const o of boardGroup.children)if(o.userData.square){
  o.material.emissive.setHex(0);o.material.emissiveIntensity=.52;
  if(cursorVisible()&&o.userData.x===handCursor.x&&o.userData.y===handCursor.y)o.material.emissive.setHex(0x38bdf8);
  if(selected&&o.userData.x===selected.x&&o.userData.y===selected.y)o.material.emissive.setHex(0xfbbf24);
  const m=legal.find(m=>m.nx===o.userData.x&&m.ny===o.userData.y);
  if(m)o.material.emissive.setHex(game.piece(m.nx,m.ny)||game.ep?.x===m.nx&&game.ep?.y===m.ny?0xfb7185:0x2dd4bf);
  if(selected&&castleAttempt(game,selected,o.userData.x,o.userData.y)?.move)o.material.emissive.setHex(0x2dd4bf);
 }
 render2D();
}
function renderStatus(){
 const st=game.status();
 turnEl.textContent=(game.turn==='w'?'White':'Black')+' to move';
 stateEl.textContent=st.over?(st.winner?(st.winner==='w'?'White':'Black')+' wins · checkmate':'Draw · '+st.kind):(st.check?'CHECK':'Battle in progress');
 logEl.replaceChildren(...game.moves.map((move,i)=>{const li=document.createElement('li');li.textContent=(i%2===0?'White · ':'Black · ')+move.notation;return li}));
 logEl.scrollTop=logEl.scrollHeight;
 $('#difficulty').disabled=$('#mode').value!=='ai';
 if(st.over)clearTimeout(aiTimer);
 if(st.over&&!resultShown&&started){
  resultShown=true;
  const title=st.kind==='checkmate'?'Checkmate':st.kind==='stalemate'?'Stalemate':'Draw';
  $('#gameOverTitle').textContent=title;
  $('#gameOverText').textContent=st.winner?`${st.winner==='w'?'White':'Black'} claims the crown.`:`The battle ends by ${st.kind}.`;
  $('#gameOver').classList.remove('hidden');
  $('#rematch').focus();
 }
 updateHandheldStatus();
}
function notice(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2500)}
function promotionChoice(){return new Promise(resolve=>{const modal=$('#promotion'),choices=$('#promotionChoices');choices.replaceChildren();const titles={q:'Queen',r:'Rook',b:'Bishop',n:'Knight'};for(const p of['q','r','b','n']){const b=document.createElement('button');b.textContent=titles[p];b.onclick=()=>{modal.classList.add('hidden');resolve(p)};choices.appendChild(b)}modal.classList.remove('hidden');choices.firstElementChild.focus()})}
async function applyMove(m,computer=false,promotion=null){
 if(busy||game.status().over)return false;
 const p=game.piece(m.x,m.y),target=game.piece(m.nx,m.ny),enPassant=p?.t==='p'&&game.ep?.x===m.nx&&game.ep?.y===m.ny&&!target;
 const captured=!!(target||enPassant);
 if(!p||p.c!==game.turn||!game.legalMoves(m.x,m.y).some(c=>c.nx===m.nx&&c.ny===m.ny))return false;
 busy=true;
 if(p.t==='p'&&(m.ny===0||m.ny===7)&&!promotion)promotion=computer?'q':await promotionChoice();
 if(captured&&animatedCombat&&viewMode==='3d'&&webglReady){
  const attacker=pieceGroup.children.find(o=>o.userData.x===m.x&&o.userData.y===m.y);
  const defender=pieceGroup.children.find(o=>o.userData.x===m.nx&&o.userData.y===(enPassant?m.y:m.ny));
  stateEl.textContent=roleNames[p.t]+' '+ATTACK_NAMES[theme][p.t]+'!';
  void audio.move(p.t);
  const duelRunner=useV8Combat?animateDuelV8:animateDuel;
  await duelRunner({source:attacker,victim:defender,x:m.nx,y:m.ny,theme,role:p.t,fxGroup,camera,orbit,boardGroup,pieceGroup,reducedMotion,onImpact:()=>{void audio.attack(theme,p.t)}});
 }
 const move=game.move(m.x,m.y,m.nx,m.ny,promotion||'q');
 if(!move){busy=false;renderStatus();return false}
 selected=null;legal=[];handCursor={x:m.nx,y:m.ny};drawPieces();renderStatus();
 if(!captured)void audio.move(p.t);
 busy=false;persistMatch();
 if(!computer&&$('#mode').value==='ai'&&game.turn==='b'&&!game.status().over)queueComputer();
 return true;
}
function queueComputer(){
 clearTimeout(aiTimer);const ticket=++generation;
 aiTimer=setTimeout(async()=>{
  if(ticket!==generation||!started||busy||game.turn!=='b'||$('#mode').value!=='ai'||game.status().over)return;
  const strength=Number($('#difficulty').value),profile=computerProfile(strength);
  stateEl.textContent=`Computer thinking · ${profile.name}…`;
  await new Promise(resolve=>requestAnimationFrame(resolve));
  if(ticket!==generation)return;
  const m=chooseComputerMove(game,strength);
  if(ticket===generation&&m)await applyMove(m,true);
 },350);
}
function syncFullscreenUI(){
 const active=fullscreenActive();
 document.body.classList.toggle('immersive-lock',active);
 $('#fullscreenBtn').textContent=active?'Exit full screen':'Full screen';
 $('#handFullscreen').textContent=active?'Exit Full':'Full Screen';
 if(active)requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
}
async function enterFullscreen(){
 if(fullscreenActive())return true;
 const request=gameShell?.requestFullscreen||gameShell?.webkitRequestFullscreen;
 if(request){
  try{await request.call(gameShell);syncFullscreenUI();return true}catch{}
 }
 // Fallback for browsers that do not expose element fullscreen: remove all page chrome
 // and fit the game to the visual viewport. Native browser chrome may still be controlled
 // by the browser/OS, but the game itself is borderless and resolution-responsive.
 gameShell.classList.add('immersive-fullscreen');syncFullscreenUI();return true;
}
async function exitFullscreen(){
 if(nativeFullscreenElement()){
  const exit=document.exitFullscreen||document.webkitExitFullscreen;
  if(exit){try{await exit.call(document)}catch{}}
 }
 gameShell.classList.remove('immersive-fullscreen');syncFullscreenUI();
}
async function toggleFullscreen(){
 fullscreenStarted=true;
 if(fullscreenActive())await exitFullscreen();else await enterFullscreen();
}
function beginPlayFullscreen(){
 if(fullscreenStarted||fullscreenActive())return;
 fullscreenStarted=true;void enterFullscreen();
}
function chooseSquare(x,y){
 if(busy||game.status().over||($('#mode').value==='ai'&&game.turn==='b'))return;
 handCursor={x,y};beginPlayFullscreen();void audio.ensure();
 if(selected){
  const castle=castleAttempt(game,selected,x,y);
  if(castle){if(castle.move)void applyMove(castle.move);else notice('Cannot castle: clear the path, keep king and rook unmoved, and avoid check.');return}
  const m=legal.find(m=>m.nx===x&&m.ny===y);if(m){void applyMove(m);return}
 }
 if(game.piece(x,y)?.c===game.turn){selected={x,y};legal=game.legalMoves(x,y);highlight();return}
 selected=null;legal=[];highlight();
}
function connectPointers(){
 if(renderer){
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};void audio.ensure()});
 renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>9){down=null;return}
  down=null;beginPlayFullscreen();
  const rect=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-rect.left)/rect.width*2-1;pointer.y=-(e.clientY-rect.top)/rect.height*2+1;
  raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...pieceGroup.children,...boardGroup.children],true);if(!hits.length)return;
  const obj=hits[0].object,root=obj.userData.root||obj,d=root.userData;if(d.piece||d.square)chooseSquare(d.x,d.y);
 });
 }
 const form=$('#moveForm');if(form)form.noValidate=true;
 if(form)form.addEventListener('submit',e=>{
  e.preventDefault();beginPlayFullscreen();void audio.ensure();
  const text=$('#moveInput').value.trim().toLowerCase(),castle=castleNotation(game,text);
  if(castle){if(!castle.move){notice('Cannot castle: clear the path and avoid check.');return}void applyMove(castle.move).then(ok=>{if(ok)$('#moveInput').value=''});return}
  const match=/^([a-h])([1-8])([a-h])([1-8])([qrbn])?$/.exec(text);if(!match){notice('Enter e2e4 or e7e8q.');return}
  const x=match[1].charCodeAt(0)-97,y=8-Number(match[2]),nx=match[3].charCodeAt(0)-97,ny=8-Number(match[4]);
  if($('#mode').value==='ai'&&game.turn==='b'){notice('Computer is playing Black.');return}
  const rookCastle=castleAttempt(game,{x,y},nx,ny),actual=rookCastle?.move||{x,y,nx,ny};
  if(rookCastle&&!rookCastle.move){notice('Cannot castle: clear the path and avoid check.');return}
  if(!game.legalMoves(actual.x,actual.y).some(m=>m.nx===actual.nx&&m.ny===actual.ny)){notice('That move is not legal.');return}
  void applyMove(actual,false,match[5]||null).then(ok=>{if(ok)$('#moveInput').value=''});
 });
}
function newGame(){
 if(busy){notice('Wait for the attack to finish.');return}
 generation++;clearTimeout(aiTimer);busy=false;resultShown=false;$('#gameOver').classList.add('hidden');game.reset();selected=null;legal=[];handCursor={x:4,y:6};drawPieces();renderStatus();persistMatch();
}
function undoMove(){
 if(busy)return;generation++;clearTimeout(aiTimer);
 if(!game.undo()){notice('No move to undo.');return}
 if($('#mode').value==='ai'&&game.turn==='b')game.undo();
 selected=null;legal=[];resultShown=false;$('#gameOver').classList.add('hidden');drawPieces();renderStatus();persistMatch();
}
function flipBoard(){
 flipped=!flipped;
 if(camera&&orbit){camera.position.x*=-1;camera.position.z*=-1;orbit.update()}
 render2D();highlight();persistMatch();
}
async function toggleSound(){
 soundOn=!soundOn;await audio.setEnabled(soundOn);
 $('#sound').textContent=soundOn?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(soundOn));
 $('#handSound').textContent=soundOn?'Sound on':'Sound off';
 persistSettings();persistMatch();
}
function setView(mode,announce=true){
 if(busy){if(announce)notice('Wait for the current move to finish.');return;}
 const wanted=mode==='2d'?'2d':'3d';
 if(wanted==='3d'&&!webglReady){notice('3D graphics are unavailable; staying in 2D.');viewMode='2d'}else viewMode=wanted;
 audio.setMode(viewMode);
 sceneEl.hidden=viewMode!=='3d';board2d.classList.toggle('hidden',viewMode!=='2d');

 // The button always shows the view you can switch TO:
 // 3D active -> button says 2D; 2D active -> button says 3D.
 const nextView=viewMode==='3d'?'2d':'3d';
 const nextLabel=nextView.toUpperCase();
 const nextDescription=`Switch to ${nextLabel} board`;
 const viewButton=$('#viewToggle');
 const handViewButton=$('#handView');
 if(viewButton){
  viewButton.textContent=nextLabel;
  viewButton.setAttribute('aria-pressed',String(viewMode==='2d'));
  viewButton.setAttribute('aria-label',nextDescription);
  viewButton.title=nextDescription;
  viewButton.dataset.targetView=nextView;
 }
 if(handViewButton){
  handViewButton.textContent=nextLabel;
  handViewButton.setAttribute('aria-label',nextDescription);
  handViewButton.title=nextDescription;
  handViewButton.dataset.targetView=nextView;
 }
 render2D();
 if(viewMode==='3d'&&renderer){const w=Math.max(1,sceneEl.clientWidth),h=Math.max(1,sceneEl.clientHeight);renderer.setSize(w,h,false)}
 persistSettings();persistMatch();
 if(announce)notice(viewMode==='2d'?'2D board active · tap 3D to return':'3D board active · tap 2D to switch');
}
function updateHandheldStatus(){
 const el=$('#handheldStatus');if(!el)return;
 el.textContent=selected?`Selected ${coord(selected.x,selected.y)} · tap a highlighted square`:'Tap the board to play';
}
function nudgeCursor(dx,dy){
 if(flipped){dx*=-1;dy*=-1}
 handCursor={x:clamp(handCursor.x+dx,0,7),y:clamp(handCursor.y+dy,0,7)};highlight();
}
function boardKeyboard(e){
 const tag=e.target?.tagName?.toLowerCase();
 if(tag==='input'||tag==='select'||tag==='textarea'||e.target?.isContentEditable)return;
 const key=e.key.toLowerCase();
 const moveKeys={
  arrowup:[0,-1],w:[0,-1],
  arrowdown:[0,1],s:[0,1],
  arrowleft:[-1,0],a:[-1,0],
  arrowright:[1,0],d:[1,0]
 };
 if(moveKeys[key]){
  e.preventDefault();keyboardCursor=true;beginPlayFullscreen();void audio.ensure();
  nudgeCursor(...moveKeys[key]);return;
 }
 if(key==='enter'||key===' '){
  e.preventDefault();keyboardCursor=true;beginPlayFullscreen();void audio.ensure();chooseSquare(handCursor.x,handCursor.y);return;
 }
 if(key==='v'){e.preventDefault();beginPlayFullscreen();void audio.ensure();setView(viewMode==='3d'?'2d':'3d');return}
 if(key==='f'){e.preventDefault();beginPlayFullscreen();flipBoard();return}
 if(key==='u'){e.preventDefault();undoMove();return}
 if(key==='m'){e.preventDefault();void toggleSound();return}
 if(key==='n'){e.preventDefault();newGame();return}
 if(key==='escape'&&gameShell.classList.contains('immersive-fullscreen')){e.preventDefault();void exitFullscreen();return}
}
function applyQuality(){
 if(!renderer)return;
 const high=quality==='high'||quality==='auto'&&(navigator.hardwareConcurrency||4)>=8&&(devicePixelRatio||1)<=2.5;
 const performance=quality==='performance';
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,performance?1:high?2:1.5));
 renderer.shadowMap.enabled=!performance;
 if(renderer.shadowMap.enabled)renderer.shadowMap.needsUpdate=true;
}
function toggleCombat(){
 if(!capabilities.animatedCombat){animatedCombat=false;syncCombatUI();notice('Cinematic battles are reserved for Crown & Ash Full Edition.');return}
 animatedCombat=!animatedCombat;syncCombatUI();persistSettings();persistMatch();notice(animatedCombat?'Animated battles enabled.':'Animated battles disabled for faster play.')
}
function downloadText(filename,text,type='text/plain'){
 const link=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
}
async function copyFen(){
 const fen=game.toFEN();$('#fenInput').value=fen;
 try{await navigator.clipboard.writeText(fen);notice('FEN copied to the clipboard.')}catch{notice('FEN placed in the text box for copying.')}
}
function loadFenPosition(){
 if(busy)return;
 try{game.loadFEN($('#fenInput').value);generation++;clearTimeout(aiTimer);selected=null;legal=[];resultShown=false;$('#gameOver').classList.add('hidden');drawPieces();renderStatus();persistMatch();notice('Position loaded. Move history begins here.');if($('#mode').value==='ai'&&game.turn==='b'&&!game.status().over)queueComputer()}catch(error){notice(error.message)}
}
function gamepadLoop(){
 if(!started){gamepadFrame=requestAnimationFrame(gamepadLoop);return}
 const pad=navigator.getGamepads?.()[0];
 if(pad){
  const pressed=pad.buttons.map(button=>button.pressed),edge=index=>pressed[index]&&!lastGamepadButtons[index];
  const now=performance.now(),axisReady=!gamepadLoop.lastAxis||now-gamepadLoop.lastAxis>170;
  let dx=0,dy=0;if(axisReady){if(pad.axes[0]<-.55||pad.axes[6]<-.55)dx=-1;else if(pad.axes[0]>.55||pad.axes[6]>.55)dx=1;if(pad.axes[1]<-.55||pad.axes[7]<-.55)dy=-1;else if(pad.axes[1]>.55||pad.axes[7]>.55)dy=1;if(dx||dy){keyboardCursor=true;nudgeCursor(dx,dy);gamepadLoop.lastAxis=now}}
  if(edge(0)){keyboardCursor=true;chooseSquare(handCursor.x,handCursor.y)}
  if(edge(1)){selected=null;legal=[];highlight()}
  if(edge(2))flipBoard();
  if(edge(3))setView(viewMode==='3d'?'2d':'3d');
  if(edge(4))undoMove();
  if(edge(9)){const c=$('#controls'),open=c.classList.toggle('open');$('#menuBtn').setAttribute('aria-expanded',String(open))}
  lastGamepadButtons=pressed;
 }else lastGamepadButtons=[];
 gamepadFrame=requestAnimationFrame(gamepadLoop);
}
function connectButtons(){
 $('#newGame').onclick=newGame;$('#undo').onclick=undoMove;$('#flip').onclick=flipBoard;$('#exitGame').onclick=()=>{void exitToSetup()};
 $('#viewToggle').onclick=e=>{void audio.ensure();setView(e.currentTarget.dataset.targetView||(viewMode==='3d'?'2d':'3d'))};
 $('#sound').onclick=()=>{void toggleSound()};$('#combatToggle').onclick=toggleCombat;$('#fullscreenBtn').onclick=()=>{void toggleFullscreen()};
 $('#saveGame').onclick=()=>{persistMatch();updateContinueButton();notice('Battle saved on this device.')};
 $('#copyFen').onclick=()=>{void copyFen()};$('#downloadPgn').onclick=()=>downloadText('crown-and-ash-match.pgn',game.toPGN());$('#loadFen').onclick=loadFenPosition;
 $('#rematch').onclick=newGame;$('#resultSetup').onclick=()=>{$('#gameOver').classList.add('hidden');void exitToSetup()};
 $('#theme').onchange=e=>{if(busy){e.target.value=theme;return}theme=normalizeTheme(e.target.value);e.target.value=theme;audio.setTheme(theme);createBoard();drawPieces();persistSettings();persistMatch()};
 $('#quality').onchange=e=>{quality=e.target.value;applyQuality();persistSettings();persistMatch();notice(`Graphics quality: ${quality}.`)};
 $('#mode').onchange=()=>{newGame();persistSettings()};
 $('#difficulty').onchange=e=>{const p=computerProfile(Number(e.target.value));persistSettings();persistMatch();notice(`Computer strength: ${p.name} · search depth ${p.depth}`);if($('#mode').value==='ai'&&game.turn==='b'&&!busy)queueComputer()};
 $('#menuBtn').onclick=e=>{const c=$('#controls'),open=c.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open))};
 $('#handUndo').onclick=undoMove;$('#handFlip').onclick=flipBoard;$('#handView').onclick=e=>{void audio.ensure();setView(e.currentTarget.dataset.targetView||(viewMode==='3d'?'2d':'3d'))};
 $('#handSound').onclick=()=>{void toggleSound()};$('#handNew').onclick=newGame;$('#handFullscreen').onclick=()=>{void toggleFullscreen()};
 document.addEventListener('fullscreenchange',syncFullscreenUI);
 document.addEventListener('webkitfullscreenchange',syncFullscreenUI);
 window.addEventListener('gamepadconnected',()=>notice('Controller connected · A select · B cancel · X flip · Y view'));
 document.addEventListener('keydown',e=>{
  boardKeyboard(e);
  if(e.key==='Escape'&&!fullscreenActive()){
   $('#controls').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');
  }
 });
 if(!gamepadFrame)gamepadFrame=requestAnimationFrame(gamepadLoop);
}
function init3D(){
 try{
  scene=new THREE.Scene();scene.fog=new THREE.Fog(themes[theme].back,15,35);camera=new THREE.PerspectiveCamera(43,1,.1,100);camera.position.set(8.5,10,9.5);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.84;sceneEl.appendChild(renderer.domElement);applyQuality();
 }catch(error){sceneEl.textContent='This browser could not start WebGL. '+error.message;return false}
 orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.target.set(0,.25,0);orbit.minDistance=7;orbit.maxDistance=22;orbit.maxPolarAngle=1.47;orbit.update();
 scene.add(new THREE.HemisphereLight(0xdcecf8,0x718397,1.15));
 const light=new THREE.DirectionalLight(0xffedd3,2.0);light.position.set(6,12,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.00012;light.shadow.normalBias=.018;light.shadow.radius=2.4;scene.add(light);
 const rim=new THREE.DirectionalLight(0xb2ecff,1.15);rim.position.set(-5,8,-7);scene.add(rim);const fill=new THREE.DirectionalLight(0xffffff,.40);fill.position.set(-6,4,6);scene.add(fill);
 boardGroup=new THREE.Group();pieceGroup=new THREE.Group();fxGroup=new THREE.Group();scene.add(boardGroup,pieceGroup,fxGroup);webglReady=true;
 createBoard();
 const resize=()=>{if(viewMode!=='3d')return;const w=Math.max(1,sceneEl.clientWidth),h=Math.max(1,sceneEl.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=camera.aspect<.85?62:43;camera.updateProjectionMatrix()};
 new ResizeObserver(resize).observe(sceneEl);resize();renderer.setAnimationLoop(()=>{if(started&&viewMode==='3d'&&!document.hidden){orbit.update();renderer.render(scene,camera)}});
 return true;
}
function init(){
 if(initialized)return;
 initialized=true;
 document.body.classList.toggle('handheld-active',handheldActive());
 window.addEventListener('resize',()=>{document.body.classList.toggle('handheld-active',handheldActive());render2D();updateRotateGate()});
 audio.setTheme(theme);audio.setMode(viewMode);connectButtons();
 const ok=init3D();connectPointers();drawPieces();renderStatus();
 if(!ok)setView('2d',false);else setView(viewMode,false);
}
connectSetup();

// Adopt the singleton used by the emergency renderer; never reset during handoff.
export function resumePreservedGame(){
 theme=normalizeTheme($('#theme').value);viewMode='3d';soundOn=$('#setupSound').checked;animatedCombat=normalizeCombat($('#setupCombat').checked);
 setupScreen.classList.add('hidden');gameShell.classList.remove('hidden');gameShell.setAttribute('aria-hidden','false');
 document.body.classList.add('playing');started=true;fullscreenStarted=true;
 init();void audio.setEnabled(soundOn);syncSoundUI();drawPieces();renderStatus();setView('3d',false);updateRotateGate();
 if($('#mode').value==='ai'&&game.turn==='b')queueComputer();
}
