"""Offline browser integration tests. Original network media is replaced by an
embedded WAV; browser navigation, production hosting and physical devices are NOT tested.
"""
from offline_fixture import *
from playwright.sync_api import sync_playwright
import traceback,sys
RESULTS=[]
def close(a,b,tol=1e-6):assert abs(a-b)<tol,(a,b)
def state(p):return snapshot(p)
def emit(p,name,detail):p.evaluate('(x)=>document.dispatchEvent(new CustomEvent(x.name,{detail:x.detail}))',{'name':name,'detail':detail});p.wait_for_timeout(120)
def scene(p,id):
 p.evaluate("document.documentElement.dataset.theme='light'");emit(p,'portfolio:scene',{'id':id});emit(p,'portfolio:theme',{'theme':'light'})
def assert_silent(p):
 s=state(p);assert all(x['muted'] or x['paused'] or x['level']==0 for x in s['levels']),s
 assert max(s['rms'],default=0)<1e-6,s

def normal(p):
 fixture(p,'patched');set_slider(p,20);s1=state(p);set_slider(p,60);s2=state(p)
 close(s2['volume'],.6);assert s1['rms'][0]>.02
 ratio=s2['rms'][0]/s1['rms'][0];assert 2.9<ratio<3.1,ratio
 return {'rms_at_20':s1['rms'][0],'rms_at_60':s2['rms'][0],'amplitude_ratio':ratio}
def quota(p):
 fixture(p,'patched','write-denied');set_slider(p,60);s=state(p);close(s['volume'],.6);assert s['rms'][0]>.18
 set_slider(p,0);assert state(p)['muted'];assert_silent(p);set_slider(p,35);close(state(p)['volume'],.35);assert not state(p)['muted']
 return {'stored_value_remains':p.evaluate("__storageValues.get('jr-site-ambient-volume-v6')"),'current_volume':state(p)['volume']}
def denied(p):
 fixture(p,'patched','denied');set_slider(p,40);close(state(p)['volume'],.4);set_slider(p,0);assert_silent(p)
def unmute(p):
 fixture(p,'patched','normal',True);assert_silent(p);set_slider(p,50);s=state(p);assert not s['muted'];close(s['volume'],.5);assert max(s['rms'])>.15,s
def change(p):
 fixture(p,'patched');set_slider(p,65,'change');close(state(p)['volume'],.65);assert state(p)['rms'][0]>.2
 set_slider(p,0,'change');assert_silent(p)
def keyboard(p):
 fixture(p,'patched');e=p.locator('#ambient-volume');e.focus();e.press('End');p.wait_for_timeout(100);close(state(p)['volume'],1)
 e.press('ArrowLeft');p.wait_for_timeout(100);close(state(p)['volume'],.99)
 e.press('Home');p.wait_for_timeout(100);assert_silent(p)
 e.press('ArrowRight');p.wait_for_timeout(100);close(state(p)['volume'],.01);assert not state(p)['muted']
def suspended(p):
 fixture(p,'patched');p.evaluate('__contexts[0].suspend()');assert state(p)['contextStates']==['suspended']
 set_slider(p,45);s=state(p);assert s['contextStates']==['running'];assert s['rms'][0]>.12,s

def scenes(p):
 fixture(p,'patched');set_slider(p,37);out=[]
 for id,key in [('forest-river','river'),('forest-waterfall','waterfall'),('birds-water','beach')]:
  scene(p,id);s=state(p);assert p.evaluate('SiteAudio.key')==key;close(s['volume'],.37);assert max(s['rms'])>.1,s;out.append(key)
 return {'controller_scene_keys':out}
def pending(p):
 fixture(p,'patched');scene(p,'forest-river');set_slider(p,40)
 emit(p,'portfolio:scene-will-change',{'id':'forest-waterfall'});assert_silent(p)
 emit(p,'portfolio:scene',{'id':'forest-waterfall'});assert p.evaluate('SiteAudio.key')=='waterfall';assert max(state(p)['rms'])>.1

def suppression(p):
 fixture(p,'patched');set_slider(p,45)
 for reason in ['lesson','game']:emit(p,'portfolio:ambient-suppression',{'reason':reason,'active':True});assert_silent(p)
 set_slider(p,67);assert_silent(p)
 emit(p,'portfolio:ambient-suppression',{'reason':'lesson','active':False});assert_silent(p)
 emit(p,'portfolio:ambient-suppression',{'reason':'game','active':False});close(state(p)['volume'],.67);assert state(p)['rms'][0]>.2

def lifecycle(p):
 fixture(p,'patched');set_slider(p,40)
 p.evaluate("dispatchEvent(new Event('pagehide'))");p.wait_for_timeout(150);assert_silent(p)
 p.evaluate("dispatchEvent(new Event('pageshow'))");p.wait_for_timeout(200);close(state(p)['volume'],.4);assert state(p)['rms'][0]>.12
 set_slider(p,0);p.evaluate("dispatchEvent(new Event('pagehide'));dispatchEvent(new Event('pageshow'))");p.wait_for_timeout(150);assert_silent(p)

def storage_sync(p):
 fixture(p,'patched');p.evaluate("__storageValues.set('jr-site-ambient-volume-v6','0.44');dispatchEvent(new StorageEvent('storage',{key:'jr-site-ambient-volume-v6',newValue:'0.44'}))");p.wait_for_timeout(150);close(state(p)['volume'],.44)
 p.evaluate("__storageValues.set('jr-site-ambient-muted-v3','1');dispatchEvent(new StorageEvent('storage',{key:'jr-site-ambient-muted-v3',newValue:'1'}))");p.wait_for_timeout(150);assert_silent(p)
 p.evaluate("__storageValues.clear();dispatchEvent(new StorageEvent('storage',{key:null}))");p.wait_for_timeout(150);close(state(p)['volume'],.05);assert not state(p)['muted']

def bounds(p):
 fixture(p,'patched');p.evaluate('SiteAudio.setVolume(99)');close(state(p)['volume'],1)
 p.evaluate('SiteAudio.setVolume(-5)');close(state(p)['volume'],0)
 p.evaluate('SiteAudio.setVolume(NaN)');close(state(p)['volume'],0)

def duplicates(p):
 fixture(p,'patched');s=(ROOT/'patched/site-audio.js').read_text();p.evaluate("s=>new Function('document','location',s)(__documentProxy,{href:'https://fixture.invalid/',pathname:'/'})",s)
 p.add_script_tag(content=(ROOT/'patched/site-sound-control.js').read_text());assert p.locator('audio').count()==3;assert p.locator('#ambient-volume').count()==1;assert p.evaluate('__contexts.length')==1

def readonly_native(p):
 fixture(p,'patched');p.evaluate("__players.forEach(a=>Object.defineProperty(a,'volume',{configurable:true,get(){return 1},set(v){}}))")
 set_slider(p,20);s1=state(p);set_slider(p,60);s2=state(p);ratio=s2['rms'][0]/s1['rms'][0];assert 2.9<ratio<3.1;return {'readonly_volume_simulation_gain_ratio':ratio}

def fade(p):
 fixture(p,'patched');scene(p,'birds-water');set_slider(p,70)
 p.evaluate("SiteAudio.element.currentTime=SiteAudio.element.duration-0.85;SiteAudio.element.dispatchEvent(new Event('timeupdate'))")
 p.wait_for_timeout(250);set_slider(p,30)
 samples=[]
 for _ in range(8):
  s=state(p);total=sum(x['level'] for x in s['levels'][1:]);samples.append(total);assert total<=.300001,(total,s);p.wait_for_timeout(40)
 return {'maximum_combined_fade_gain_after_change':max(samples)}

def mobile_touch(p):
 fixture(p,'patched',viewport={'width':390,'height':844});set_slider(p,42);close(state(p)['volume'],.42)
 p.locator('[data-scene-audio]').tap();p.locator('[data-scene-audio]').tap();box=p.locator('#ambient-volume').bounding_box();assert box; p.touchscreen.tap(box['x']+box['width']*.8,box['y']+box['height']/2);p.wait_for_timeout(150);assert state(p)['volume']>.7,state(p)
 return {'touch_selected_volume':state(p)['volume']}

cases=[normal,quota,denied,unmute,change,keyboard,suspended,scenes,pending,suppression,lifecycle,storage_sync,bounds,duplicates,readonly_native,fade,mobile_touch]
with sync_playwright() as pw:
 b=launch_browser(pw)
 for case in cases:
  ctx=b.new_context(has_touch=True);p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  try:
   info=case(p);assert not errors,errors;RESULTS.append({'name':case.__name__,'passed':True,'detail':info});print('PASS',case.__name__,info,flush=True)
  except Exception as e:
   RESULTS.append({'name':case.__name__,'passed':False,'error':str(e),'stack':traceback.format_exc()});print('FAIL',case.__name__,str(e),flush=True)
  finally:ctx.close()
 b.close()
report={'base_commit':'11f9f5e33bd8452b1b0538ffe285b8e9b354d865','test_mode':'Offline Chromium DOM with real embedded-WAV media and native Web Audio. Storage, source URL mapping, lifecycle events, and read-only native-volume behavior are simulated. Not physical iOS or live HTTP testing.','passed':sum(x['passed'] for x in RESULTS),'total':len(RESULTS),'cases':RESULTS}
(ROOT/'evidence/volume-browser-results.json').write_text(json.dumps(report,indent=2)+'\n');print('TOTAL',report['passed'],'/',report['total']);sys.exit(0 if report['passed']==report['total'] else 1)
