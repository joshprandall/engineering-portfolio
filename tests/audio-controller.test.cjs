/* Execute the complete controller against deterministic media, lifecycle and gain models. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=process.env.PORTFOLIO_RUNTIME_ROOT||path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'site-audio.js'),'utf8');
function harness({gain=true,pending=false,readonlyVolume=false,storage=new Map(),preview=false,storageWritesFail=false,decodeFails=false}={}){
 const players=[],bufferSources=[],events=new EventTarget(),document=new EventTarget(),timers=new Map(),frames=new Map(),intervals=[];let counter=0,now=0,audioContext=null;
 const audioSession=new EventTarget();audioSession.type='auto';audioSession.state='active';
 class Media extends EventTarget{
  constructor(){super();this.dataset={};this.style={};this.paused=true;this.currentTime=0;this.duration=12;this.plays=0;this.loads=0;this.muted=false;this._volume=1;}
  set volume(v){if(!readonlyVolume)this._volume=v;}get volume(){return this._volume;}
  setAttribute(){}remove(){}get currentSrc(){return this.src||'';}
  play(){this.plays++;this.paused=false;return Promise.resolve();}pause(){this.paused=true;}load(){this.loads++;this.onloadedmetadata?.();}
 }
 class AudioContext extends EventTarget{
  constructor(){super();this.currentTime=0;this.state='suspended';this.destination={};audioContext=this;}
  createGain(){return {gain:{value:0,setValueAtTime(v){this.value=v;}},connect(){}};}
  createMediaElementSource(){return {connect(){}};}
  decodeAudioData(_bytes,success,failure){
   if(decodeFails){const error=new Error('decode failed');failure?.(error);return Promise.reject(error);}
   const buffer={duration:12,numberOfChannels:2,sampleRate:44100};success?.(buffer);return Promise.resolve(buffer);
  }
  createBufferSource(){
   const source={buffer:null,loop:false,loopStart:0,loopEnd:0,playbackRate:{value:1},started:false,stopped:false,startArgs:null,
    connect(){},disconnect(){},start(...args){this.started=true;this.startArgs=args;},stop(){this.stopped=true;}};
   bufferSources.push(source);return source;
  }
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
 return {S:context.SiteAudio,players,bufferSources,storage,context,document,audioSession,emit,
 theme(v){document.documentElement.dataset.theme=v;emit('portfolio:theme');},
 windowEvent(name){events.dispatchEvent(new Event(name));},watchdog(){intervals.forEach(fn=>fn());},
 frame(ms){now=ms;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));},
 advanceAudio(seconds){if(audioContext)audioContext.currentTime+=seconds;},
 repeat(){vm.runInContext(code,context);}};
}
const flush=async()=>{for(let i=0;i<3;i++)await new Promise(resolve=>setImmediate(resolve));};
const silent=h=>assert(h.players.every(p=>p.paused&&p.muted),'Every background player must be stopped and muted');
test('one owner, quiet first output, no inactive autoplay, including iOS read-only volume',async()=>{
 for(const readonlyVolume of [false,true]){
  const h=harness({readonlyVolume});await flush();
  assert.equal(h.S.volume,.05);assert.equal(h.S.volumeBackend,'gain');
  assert.equal(h.S.darkBackend,'buffer');assert.equal(h.bufferSources.length,1);
  assert.equal(h.S.outputLevels.filter(p=>!p.paused&&!p.muted&&p.level>0).reduce((n,p)=>n+p.level,0),.05);
  assert(h.players.every(p=>p.autoplay===false));assert(h.S.beachElements.every(p=>p.paused&&p.muted));
  h.repeat();assert.equal(h.players.length,4);assert.equal(h.bufferSources.length,1);h.S.setVolume(.23);
  assert.equal(h.S.outputLevels.filter(p=>!p.paused&&!p.muted&&p.level>0).reduce((n,p)=>n+p.level,0),.23);
 }
});
test('native media remains usable when Web Audio is unavailable',async()=>{const h=harness({gain:false});await flush();assert.equal(h.S.volumeBackend,'media');assert.equal(h.S.darkBackend,'media');h.S.setVolume(.12);assert.equal(h.S.element.volume,.12);h.S.setMuted(true);silent(h);});
test('a WAV fetch/decode failure activates exactly one looping media fallback',async()=>{const h=harness({decodeFails:true});await flush();assert.equal(h.S.darkBackend,'media');assert.equal(h.bufferSources.length,0);assert.equal(h.S.darkElements.length,1);assert.equal(h.S.element.loop,true);assert.equal(h.S.element.playbackRate,1);});
test('trusted interaction claims playback routing and recovers the WebKit audio session',()=>{
 const h=harness();assert.equal(h.audioSession.type,'auto');h.document.dispatchEvent(new Event('pointerdown'));assert.equal(h.audioSession.type,'playback');assert.equal(h.S.audioSessionType,'playback');
 h.audioSession.type='ambient';h.audioSession.state='active';h.audioSession.dispatchEvent(new Event('statechange'));assert.equal(h.audioSession.type,'playback');
});
test('mute and zero restore the last selected nonzero volume, even when storage writes fail',()=>{
 const h=harness({storage:new Map([['jr-site-ambient-volume-v6','.05']]),storageWritesFail:true});
 h.S.setVolume(.37);assert.equal(h.S.volume,.37);h.S.setMuted(true);silent(h);h.S.setMuted(false);assert.equal(h.S.volume,.37);
 h.S.setVolume(0);h.S.setMuted(true);silent(h);h.S.setMuted(false);assert.equal(h.S.volume,.37);assert.equal(h.S.muted,false);
});
test('theme and scene transition matrix never leaves two ambience owners audible',async()=>{
 const h=harness();await flush();const active=()=>h.S.outputLevels.filter(p=>!p.paused&&!p.muted&&p.level>0).length;
 const expect=(key,count=1)=>{assert.equal(h.S.key,key);assert.equal(active(),count,key+' has exactly one audible owner');};
 expect('dark');
 for(let cycle=0;cycle<3;cycle++){
   h.emit('portfolio:scene',{id:'forest-river'});
   h.theme('light');expect('river');
   h.emit('portfolio:scene-will-change',{id:'forest-waterfall'});silent(h);h.emit('portfolio:scene',{id:'forest-waterfall'});expect('waterfall');
   h.emit('portfolio:scene-will-change',{id:'forest-river'});silent(h);h.emit('portfolio:scene',{id:'forest-river'});expect('river');
   h.emit('portfolio:scene-will-change',{id:'birds-water'});silent(h);h.emit('portfolio:scene',{id:'birds-water'});expect('beach');
   h.emit('portfolio:scene-will-change',{id:'forest-waterfall'});silent(h);h.emit('portfolio:scene',{id:'forest-waterfall'});expect('waterfall');
   h.theme('dark');await flush();expect('dark');
   h.theme('light');expect('waterfall');
   h.emit('portfolio:scene-will-change',{id:'birds-water'});silent(h);h.emit('portfolio:scene',{id:'birds-water'});expect('beach');
   h.theme('dark');await flush();expect('dark');
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
test('mute, hide and pagehide resist late metadata, ended, errors and watchdog; return restores',async()=>{
 const h=harness();await flush();for(const kind of ['mute','hide','pagehide']){
  const metadata=h.S.element.onloadedmetadata;
  if(kind==='mute')h.S.setMuted(true);else if(kind==='hide'){h.document.hidden=true;h.emit('visibilitychange');}else h.windowEvent('pagehide');
  const plays=h.players.reduce((n,p)=>n+p.plays,0);metadata?.();h.players.forEach(p=>{p.dispatchEvent(new Event('ended'));p.dispatchEvent(new Event('error'));});h.watchdog();silent(h);assert.equal(h.players.reduce((n,p)=>n+p.plays,0),plays);
  if(kind==='mute')h.S.setMuted(false);else if(kind==='hide'){h.document.hidden=false;h.emit('visibilitychange');}else h.windowEvent('pageshow');await flush();assert(h.S.outputLevels.some(p=>!p.paused&&!p.muted&&p.level>0));
 }
});
test('overlapping activities remain quiet until every activity releases its reason',async()=>{
 const h=harness();await flush();h.emit('portfolio:ambient-suppression',{reason:'video',active:true});h.emit('portfolio:ambient-suppression',{reason:'lesson',active:true});h.emit('portfolio:ambient-suppression',{reason:'video',active:false});silent(h);h.emit('portfolio:ambient-suppression',{reason:'lesson',active:false});await flush();assert(h.S.outputLevels.some(p=>!p.paused&&!p.muted&&p.level>0));
});
test('Night uses one sample-accurate looping buffer across multiple complete boundaries',async()=>{
 const h=harness({readonlyVolume:true});await flush();
 assert.equal(h.S.darkBackend,'buffer');assert.equal(h.bufferSources.length,1);const source=h.bufferSources[0];
 assert.equal(source.loop,true);assert.equal(source.loopStart,0);assert.equal(source.loopEnd,12);assert.equal(source.playbackRate.value,1);assert.deepEqual(source.startArgs,[0,0]);
 h.advanceAudio(36.25);
 assert.equal(h.S.darkLoopCount,3);assert.equal(h.S.darkSourceStarts,1);assert.equal(h.bufferSources.length,1);
 const active=h.S.outputLevels.filter(p=>!p.paused&&!p.muted&&p.level>0);assert.equal(active.length,1);assert.equal(active[0].backend,'buffer');assert.equal(active[0].level,.05);
});
test('beach crossfade obeys current volume, zero and mute; no outgoing audio survives',async()=>{
 const h=harness({readonlyVolume:true});h.theme('light');h.emit('portfolio:scene',{id:'birds-water'});const p=h.S.element;p.currentTime=11;p.dispatchEvent(new Event('timeupdate'));await flush();h.frame(600);assert.equal(h.S.outputLevels.slice(2,4).reduce((n,p)=>n+p.level,0),.05);
 h.S.setVolume(0);h.frame(900);assert(h.S.outputLevels.every(p=>p.level===0));h.S.setVolume(.4);h.frame(1100);assert(Math.abs(h.S.outputLevels.slice(2,4).reduce((n,p)=>n+p.level,0)-.4)<1e-9);
 h.S.setMuted(true);h.frame(1500);silent(h);h.S.setMuted(false);h.emit('portfolio:scene-will-change',{id:'forest-river'});silent(h);h.emit('portfolio:scene',{id:'forest-river'});assert(h.S.beachElements.every(p=>p.paused&&p.muted));
});
test('mute, volume and Night playhead survive navigation',async()=>{
 const storage=new Map(),a=harness({storage});await flush();a.S.setVolume(.17);a.advanceAudio(7);a.windowEvent('pagehide');const b=harness({storage});await flush();assert.equal(b.S.volume,.17);assert.equal(b.S.darkPosition,7);b.S.setMuted(true);const c=harness({storage});await flush();assert(c.S.muted);silent(c);
});
