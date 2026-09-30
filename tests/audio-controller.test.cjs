/* Execute the complete controller against deterministic media, lifecycle and gain models. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=process.env.PORTFOLIO_RUNTIME_ROOT||path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'site-audio.js'),'utf8');
function harness({gain=true,pending=false,readonlyVolume=false,storage=new Map(),preview=false,storageWritesFail=false}={}){
 const players=[],events=new EventTarget(),document=new EventTarget(),timers=new Map(),frames=new Map(),intervals=[];let counter=0,now=0;
 const audioSession=new EventTarget();audioSession.type='auto';audioSession.state='active';
 class Media extends EventTarget{
  constructor(){super();this.dataset={};this.style={};this.paused=true;this.currentTime=0;this.duration=12;this.plays=0;this.loads=0;this.muted=false;this._volume=1;}
  set volume(v){if(!readonlyVolume)this._volume=v;}get volume(){return this._volume;}
  setAttribute(){}remove(){}get currentSrc(){return this.src||'';}
  play(){this.plays++;this.paused=false;return Promise.resolve();}pause(){this.paused=true;}load(){this.loads++;this.onloadedmetadata?.();}
 }
 class AudioContext extends EventTarget{
  constructor(){super();this.currentTime=0;this.state='suspended';this.destination={};}
  createGain(){return {gain:{value:0,setValueAtTime(v){this.value=v;}},connect(){}};}
  createMediaElementSource(){return {connect(){}};}
  resume(){this.state='running';return Promise.resolve();}
 }
 document.hidden=false;document.documentElement={dataset:{theme:'dark'}};
 const origin=preview?'https://raw.githack.com/joshprandall/engineering-portfolio/repair/':'https://portfolio.test/';
 document.currentScript={src:origin+'site-audio.js'};
 document.body={appendChild:p=>players.push(p)};document.querySelectorAll=()=>[];document.querySelector=()=>pending?{}:null;document.getElementById=()=>null;document.createElement=()=>new Media();
 const context={document,navigator:{audioSession},location:{href:origin+'index.html',hostname:preview?'raw.githack.com':'portfolio.test',pathname:'/index.html'},URL,Blob,CustomEvent,console,Date,Math,Number,Object,Boolean,Promise,Map,Set,
 fetch:async()=>({ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3,4]).buffer}),
 localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(storageWritesFail)throw new Error('storage blocked');storage.set(k,v);}},addEventListener:events.addEventListener.bind(events),performance:{now:()=>now},
 setTimeout(fn,ms){timers.set(++counter,{fn,ms});return counter;},clearTimeout(id){timers.delete(id);},setInterval(fn){intervals.push(fn);return ++counter;},requestAnimationFrame(fn){frames.set(++counter,fn);return counter;},cancelAnimationFrame(id){frames.delete(id);}};
 context.window=context;if(gain)context.AudioContext=AudioContext;vm.createContext(context);vm.runInContext(code,context);
 const emit=(name,detail)=>document.dispatchEvent(new CustomEvent(name,{detail}));
 return {S:context.SiteAudio,players,storage,context,document,audioSession,emit,
 theme(v){document.documentElement.dataset.theme=v;emit('portfolio:theme');},
 windowEvent(name){events.dispatchEvent(new Event(name));},watchdog(){intervals.forEach(fn=>fn());},
 frame(ms){now=ms;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));},
 repeat(){vm.runInContext(code,context);}};
}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
const silent=h=>assert(h.players.every(p=>p.paused&&p.muted),'Every background player must be stopped and muted');
test('one owner, quiet first output, no inactive autoplay, including iOS read-only volume',()=>{
 for(const readonlyVolume of [false,true]){const h=harness({readonlyVolume});assert.equal(h.S.volume,.05);assert.equal(h.S.volumeBackend,'gain');assert.equal(h.S.outputLevels[0].level,.05);assert(h.players.every(p=>p.autoplay===false));assert(h.S.beachElements.every(p=>p.paused&&p.muted));h.repeat();assert.equal(h.players.length,3);h.S.setVolume(.23);assert.equal(h.S.outputLevels[0].level,.23);}
});
test('native media remains usable when Web Audio is unavailable',()=>{const h=harness({gain:false});assert.equal(h.S.volumeBackend,'media');h.S.setVolume(.12);assert.equal(h.S.element.volume,.12);h.S.setMuted(true);silent(h);});
test('only explicit Sound activation claims playback routing; random page touch stays silent',()=>{
 const h=harness({pending:true});assert.equal(h.audioSession.type,'auto');assert.equal(h.S.unlocked,false);
 h.document.dispatchEvent(new Event('pointerdown'));assert.equal(h.audioSession.type,'auto');assert.equal(h.S.unlocked,false);
 h.S.activate();assert.equal(h.audioSession.type,'playback');assert.equal(h.S.audioSessionType,'playback');assert.equal(h.S.unlocked,true);
 h.audioSession.type='ambient';h.audioSession.state='active';h.audioSession.dispatchEvent(new Event('statechange'));assert.equal(h.audioSession.type,'playback');
});
test('mute and zero restore the last selected nonzero volume, even when storage writes fail',()=>{
 const h=harness({storage:new Map([['jr-site-ambient-volume-v6','.05']]),storageWritesFail:true});
 h.S.setVolume(.37);assert.equal(h.S.volume,.37);h.S.setMuted(true);silent(h);h.S.setMuted(false);assert.equal(h.S.volume,.37);
 h.S.setVolume(0);h.S.setMuted(true);silent(h);h.S.setMuted(false);assert.equal(h.S.volume,.37);assert.equal(h.S.muted,false);
});
test('theme and scene transition matrix never leaves two ambience owners audible',()=>{
 const h=harness(),active=()=>h.S.outputLevels.filter(p=>!p.paused&&!p.muted&&p.level>0).length;
 const expect=(key,count=1)=>{assert.equal(h.S.key,key);assert.equal(active(),count,key+' has exactly one audible owner');};
 expect('dark');
 for(let cycle=0;cycle<3;cycle++){
   h.emit('portfolio:scene',{id:'forest-river'});
   h.theme('light');expect('river');
   h.emit('portfolio:scene-will-change',{id:'forest-waterfall'});silent(h);h.emit('portfolio:scene',{id:'forest-waterfall'});expect('waterfall');
   h.emit('portfolio:scene-will-change',{id:'forest-river'});silent(h);h.emit('portfolio:scene',{id:'forest-river'});expect('river');
   h.emit('portfolio:scene-will-change',{id:'birds-water'});silent(h);h.emit('portfolio:scene',{id:'birds-water'});expect('beach');
   h.emit('portfolio:scene-will-change',{id:'forest-waterfall'});silent(h);h.emit('portfolio:scene',{id:'forest-waterfall'});expect('waterfall');
   h.theme('dark');expect('dark');
   h.theme('light');expect('waterfall');
   h.emit('portfolio:scene-will-change',{id:'birds-water'});silent(h);h.emit('portfolio:scene',{id:'birds-water'});expect('beach');
   h.theme('dark');expect('dark');
 }
});
test('preview Night load cannot resurrect after switching to Day',async()=>{
 const h=harness({preview:true,pending:true}),player=h.S.element;
 player.src='blob:night';player.paused=false;player.muted=false;player.dataset.previewFallback='1';player.dataset.previewKey='dark';
 h.theme('light');silent(h);
 h.emit('portfolio:scene',{id:'forest-river'});
 await flush();
 assert.equal(h.S.key,'river');assert.notEqual(player.dataset.previewKey,'dark');
 assert(h.S.outputLevels.filter(p=>!p.paused&&!p.muted&&p.level>0).length<=1);
});
test('Day waits for visible scenery and the matching local sound; local fallback is retained',()=>{
 const h=harness({pending:true});h.theme('light');silent(h);h.emit('portfolio:scene',{id:'forest-river'});assert.match(h.S.element.src,/\/river\.mp3$/);h.S.element.dispatchEvent(new Event('error'));assert.match(h.S.element.src,/\/river\.ogg$/);const n=h.S.element.loads;h.S.sync(true);assert.equal(h.S.element.loads,n);
 h.emit('portfolio:scene-will-change',{id:'forest-waterfall'});silent(h);h.S.play();h.watchdog();silent(h);h.emit('portfolio:scene',{id:'forest-waterfall'});assert.match(h.S.element.src,/\/waterfall\.mp3$/);assert(!h.S.element.paused);
});
test('mute, hide and pagehide resist late metadata, ended, errors and watchdog; return restores',()=>{
 const h=harness();for(const kind of ['mute','hide','pagehide']){
  const metadata=h.S.element.onloadedmetadata;
  if(kind==='mute')h.S.setMuted(true);else if(kind==='hide'){h.document.hidden=true;h.emit('visibilitychange');}else h.windowEvent('pagehide');
  const plays=h.players.reduce((n,p)=>n+p.plays,0);metadata?.();h.players.forEach(p=>{p.dispatchEvent(new Event('ended'));p.dispatchEvent(new Event('error'));});h.watchdog();silent(h);assert.equal(h.players.reduce((n,p)=>n+p.plays,0),plays);
  if(kind==='mute')h.S.setMuted(false);else if(kind==='hide'){h.document.hidden=false;h.emit('visibilitychange');}else h.windowEvent('pageshow');assert(!h.S.element.paused);
 }
});
test('overlapping activities remain quiet until every activity releases its reason',()=>{
 const h=harness();h.emit('portfolio:ambient-suppression',{reason:'video',active:true});h.emit('portfolio:ambient-suppression',{reason:'lesson',active:true});h.emit('portfolio:ambient-suppression',{reason:'video',active:false});silent(h);h.emit('portfolio:ambient-suppression',{reason:'lesson',active:false});assert(!h.S.element.paused);
});
test('beach crossfade obeys current volume, zero and mute; no outgoing audio survives',async()=>{
 const h=harness({readonlyVolume:true});h.theme('light');h.emit('portfolio:scene',{id:'birds-water'});const p=h.S.element;p.currentTime=11;p.dispatchEvent(new Event('timeupdate'));await flush();h.frame(600);assert.equal(h.S.outputLevels.slice(1).reduce((n,p)=>n+p.level,0),.05);
 h.S.setVolume(0);h.frame(900);assert(h.S.outputLevels.every(p=>p.level===0));h.S.setVolume(.4);h.frame(1100);assert(Math.abs(h.S.outputLevels.slice(1).reduce((n,p)=>n+p.level,0)-.4)<1e-9);
 h.S.setMuted(true);h.frame(1500);silent(h);h.S.setMuted(false);h.emit('portfolio:scene-will-change',{id:'forest-river'});silent(h);h.emit('portfolio:scene',{id:'forest-river'});assert(h.S.beachElements.every(p=>p.paused&&p.muted));
});
test('mute, volume and Night playhead survive navigation',()=>{
 const storage=new Map(),a=harness({storage});a.S.setVolume(.17);a.S.element.currentTime=7;a.windowEvent('pagehide');const b=harness({storage});assert.equal(b.S.volume,.17);assert.equal(b.S.element.currentTime,7);b.S.setMuted(true);const c=harness({storage});assert(c.S.muted);silent(c);
});
