import assert from 'node:assert/strict';

class FakeParam {
  constructor(value=0){this.value=value;this.events=[];}
  setValueAtTime(value,time){this.value=value;this.events.push(['set',value,time]);}
  exponentialRampToValueAtTime(value,time){this.value=value;this.events.push(['ramp',value,time]);}
}
class FakeNode {
  constructor(){this.connections=[];this.disconnected=false;}
  connect(target){this.connections.push(target);return target;}
  disconnect(){this.disconnected=true;}
}
class FakeOscillator extends FakeNode {
  constructor(){super();this.type='sine';this.frequency=new FakeParam();this.started=[];this.stopped=[];}
  start(time=0){this.started.push(time);}
  stop(time=0){this.stopped.push(time);}
}
class FakeGain extends FakeNode {
  constructor(){super();this.gain=new FakeParam(1);}
}
class FakeBufferSource extends FakeNode {
  constructor(){super();this.buffer=null;this.started=[];}
  start(time=0){this.started.push(time);}
}
class FakeBiquadFilter extends FakeNode {
  constructor(){super();this.type='lowpass';this.frequency={value:0};}
}
class FakeAudioContext {
  constructor(){
    this.currentTime=10;
    this.sampleRate=8000;
    this.state='running';
    this.destination={kind:'destination'};
    this.oscillators=[];
    this.gains=[];
    this.sources=[];
  }
  createOscillator(){const n=new FakeOscillator();this.oscillators.push(n);return n;}
  createGain(){const n=new FakeGain();this.gains.push(n);return n;}
  createBuffer(channels,length,sampleRate){
    assert.equal(channels,1);
    assert.equal(sampleRate,this.sampleRate);
    return {getChannelData:()=>new Float32Array(length)};
  }
  createBufferSource(){const n=new FakeBufferSource();this.sources.push(n);return n;}
  createBiquadFilter(){return new FakeBiquadFilter();}
  async resume(){this.state='running';}
}

global.window={AudioContext:FakeAudioContext};
const {GameAudio}=await import('../games/3d-battle-chess/audio.js');

const audio=new GameAudio();
audio.setTheme('classic');
assert.equal(await audio.ensure(),true);
assert.equal(audio.music.length,4,'ambient bed should contain three voices plus one LFO');
assert.equal(audio.music[0].osc.frequency.value,55,'classic ambience should use the classic root');

const ctx=audio.ctx;
const firstClassicOsc=audio.music[0].osc;
const oscillatorCountBeforeThemeSwitch=ctx.oscillators.length;
audio.setTheme('cosmic');
assert(firstClassicOsc.stopped.length>0,'changing faction theme must stop the old ambience');
assert.equal(audio.music.length,4,'theme refresh must leave exactly one ambient bed running');
assert.equal(audio.music[0].osc.frequency.value,49,'cosmic ambience should use the cosmic root');
assert(ctx.oscillators.length>oscillatorCountBeforeThemeSwitch,'changing theme must create a replacement ambience');

const oscillatorCountAfterThemeSwitch=ctx.oscillators.length;
audio.setTheme('cosmic');
assert.equal(ctx.oscillators.length,oscillatorCountAfterThemeSwitch,'re-selecting the active theme must not restart audio');

audio.setMode('2d');
const muted3dCount=ctx.oscillators.length;
await audio.move('r');
await audio.attack('classic','q');
assert.equal(ctx.oscillators.length,muted3dCount,'2D mode must not emit 3D move or combat tones');

audio.setMode('3d');
await audio.attack('arcane','q');
assert(ctx.oscillators.length>muted3dCount,'3D combat must still emit role/theme audio');

await audio.setEnabled(false);
assert.equal(audio.music.length,0,'disabling sound must stop ambience');
assert.equal(audio.master,null,'disabling sound must disconnect the ambient master');

audio.setTheme('classic');
assert.equal(audio.music.length,0,'changing theme while muted must not start audio');
await audio.setEnabled(true);
assert.equal(audio.music[0].osc.frequency.value,55,'re-enabling sound must start the currently selected theme');

await audio.setEnabled(false);
delete global.window;
console.log('PASS Crown & Ash audio: live faction-theme refresh, 2D suppression, 3D combat cues and mute/re-enable behavior.');
