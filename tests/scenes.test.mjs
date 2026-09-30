import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile(new URL('../site-scenes.js', import.meta.url), 'utf8');
// Exercise the real controller functions with media whose play promises can
// stall. No video decoder or physical iPhone is simulated by these tests.
const section = (from, to) => source.slice(source.indexOf(from), source.indexOf(to));
function controller() {
  let nextTimer = 0;
  const timers = new Map();
  const videos = [0, 1].map(() => ({
    readyState: 0, error: null, autoplay: true, sources: [], pauses: 0,
    classList: { add() {}, remove() {} },
    removeAttribute() {}, setAttribute() {}, load() {},
    set src(value) { this.sources.push(value); },
    pause() { this.pauses++; },
    play() { return new Promise(resolve => { this.finishPlaying = resolve; }); },
  }));
  const context = vm.createContext({
    Promise, videos, setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    document: { hidden: false }, performance: { now: () => 0 }, requestAnimationFrame() { return 1; },
  });
  vm.runInContext(`
    let theme='light', paused=false, mediaDisabled=false, compactMedia=false, mediaReady=true, sceneLoadId=0, lightLoaded=true, lightRecoveryPending=false;
    const BRANCH_PREVIEW_HOST=false;
    const motionAllowed=()=>!paused, reducedMotion=()=>false;
    let activeVideo=videos[0], standbyVideo=videos[1], activeSceneIndex=0;
    let rotationElapsed=0, lastFrame=0, raf=0, time=0, width=400;
    const ROTATE_AFTER=28;
    const LIGHT_SCENES=[0,1,2].map(i=>({id:'scene-'+i,src:'local-'+i,mobileSrc:'mobile-'+i,remoteSrc:'remote-'+i,poster:'poster-'+i}));
    const dayPosters=new Map(LIGHT_SCENES.map(scene=>[scene.id,{complete:true,naturalWidth:1280,src:scene.poster}]));
    const readyScenes=[];
    const dayFallback={classList:{add(){readyScenes.push(activeSceneIndex)},remove(){}}};
    const credits=[], announceDaySceneWillChange=()=>{}, updateDayCredit=()=>credits.push(activeSceneIndex), draw=()=>{}, loadInitialLightScene=()=>{};
    ${section('    function configureVideo(', '    function pauseVideos(')}
    ${section('    async function prepareAndPlay(', '    function drawStars(')}
    ${section('    function frame(', '    function refresh(')}
    ${section('    const retryLightPlayback =', '    const clearLightRecovery =')}
    globalThis.api={
      frame, rotateLightScene, start:()=>prepareAndPlay(activeVideo,LIGHT_SCENES[activeSceneIndex]),
      pause:()=>{paused=true}, night:()=>{theme='dark'},
      retry:retryLightPlayback,
      setPosterReady:(index,ready)=>{const poster=dayPosters.get(LIGHT_SCENES[index].id);poster.complete=ready;poster.naturalWidth=ready?1280:0},
      state:()=>({activeSceneIndex,credits:[...credits],readyScenes:[...readyScenes]})
    };
  `, context);
  return { api: context.api, videos, timers };
}
const flush = async () => { for (let i=0; i<8; i++) await Promise.resolve(); };

test('Day scenes cycle every 28 visible seconds even when every video play stays pending', () => {
  const { api } = controller();
  api.start();
  // A heavily throttled animation loop must still use elapsed wall time.
  api.frame(28000);
  assert.equal(api.state().activeSceneIndex, 1);
  api.frame(56000);
  assert.equal(api.state().activeSceneIndex, 2);
  api.frame(84000);
  assert.equal(api.state().activeSceneIndex, 0);
  assert.equal(api.state().credits.join(','), '1,2,0');
});

test('Day rotation keeps the current scene until the next poster can paint', () => {
  const { api } = controller();
  api.setPosterReady(1,false);
  api.frame(28000);
  assert.equal(api.state().activeSceneIndex,0);
  assert.equal(api.state().credits.length,0);
  api.setPosterReady(1,true);
  api.frame(56000);
  assert.equal(api.state().activeSceneIndex,1);
});

test('slow startup keeps the local clip beyond the old seven-second cutoff', async () => {
  const { api, videos, timers } = controller();
  const result = api.start();
  assert.equal([...timers.values()][0].delay, 30000);
  assert.equal(videos[0].preload, 'auto');
  videos[0].finishPlaying();
  assert.equal(await result, true);
  assert.deepEqual(videos[0].sources, ['local-0']);
});

test('a timed-out previous scene cannot replace the next scene or reused video', async () => {
  const { api, videos, timers } = controller();
  const old = api.start();
  const oldTimeout = [...timers.values()][0].fn;
  api.rotateLightScene();
  api.rotateLightScene();
  oldTimeout();
  await flush();
  assert.equal(await old, false);
  assert.equal(api.state().activeSceneIndex, 2);
  assert.deepEqual(videos[0].sources, ['local-0', 'local-2']);
});

test('explicit motion pause and Night mode prevent Day rotation', () => {
  const paused = controller(); paused.api.pause(); paused.api.frame(28000);
  assert.equal(paused.api.state().activeSceneIndex, 0);
  const night = controller(); night.api.night(); night.api.frame(28000);
  assert.equal(night.api.state().activeSceneIndex, 0);
});

test('a late autonomous recovery for the outgoing video cannot hide the new poster', async () => {
  const { api, videos }=controller();
  api.retry();
  api.rotateLightScene();
  videos[0].finishPlaying();
  await flush();
  assert.equal(api.state().activeSceneIndex,1);
  assert.equal(api.state().readyScenes.length,0);
});

test('scene audio waits for its visible poster and ignores an old poster loading late', () => {
  const events = [];
  const posterCallbacks = new Map();
  const context = vm.createContext({
    document: { dispatchEvent(event) { if (event.type==='portfolio:scene') events.push(event.detail.id); } },
    CustomEvent: class { constructor(type, {detail}) { this.type=type; this.detail=detail; } },
    localStorage: { setItem() {} }, posterCallbacks,
  });
  vm.runInContext(`
    let activeSceneIndex=0;
    const LIGHT_SCENES=[{id:'waterfall',poster:'waterfall.jpg'}, {id:'river',poster:'river.jpg'}];
    const LIGHT_SCENE_KEY='test', mediaDisabled=false, BRANCH_PREVIEW_HOST=false;
    const backdrop={dataset:{}}, dayFallback={style:{}}, dayLink=null, dayCredit=null;
    const dayPosters=new Map(LIGHT_SCENES.map(scene=>[scene.id,{
      complete:false, naturalWidth:0,
      addEventListener(type,callback){posterCallbacks.set(scene.id,callback)}
    }]));
    const loadDayPoster=scene=>dayPosters.get(scene.id);
    ${section('    function announceDaySceneWillChange(', '    function resize(')}
    globalThis.api={
      updateDayCredit,
      river(){activeSceneIndex=1; updateDayCredit()},
      state:()=>({...backdrop.dataset,poster:dayFallback.style.backgroundImage})
    };
  `, context);
  context.api.updateDayCredit();
  assert.deepEqual(events, []);
  assert.equal(context.api.state().pendingDayScene, 'waterfall');
  context.api.river();
  posterCallbacks.get('waterfall')();
  assert.deepEqual(events, []);
  posterCallbacks.get('river')();
  assert.deepEqual(events, ['river']);
  assert.equal(context.api.state().visibleDayScene, 'river');
  assert.equal(context.api.state().pendingDayScene, undefined);
  assert.equal(context.api.state().poster, 'url("river.jpg")');
});
