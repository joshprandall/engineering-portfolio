from pathlib import Path
import base64,json,io,math,struct,wave,os,shutil
ROOT=Path(__file__).resolve().parents[1]
(ROOT/'evidence').mkdir(parents=True,exist_ok=True)
def launch_browser(pw):
 executable=os.environ.get('BROWSER_EXECUTABLE_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
 args=['--no-sandbox'] if hasattr(os,'geteuid') and os.geteuid()==0 else []
 return pw.chromium.launch(executable_path=executable,headless=True,args=args)
def tone_bytes():
 path=ROOT/'tests/tone.wav'
 if path.is_file():return path.read_bytes()
 out=io.BytesIO()
 with wave.open(out,'wb') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(44100)
  w.writeframes(b''.join(struct.pack('<h',round(16383*math.sin(2*math.pi*440*i/44100))) for i in range(44100*6)))
 return out.getvalue()

HTML='''<!doctype html><html data-theme="dark"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Volume control verification</title><style>body{font:18px system-ui;margin:40px}header .tools{display:flex;gap:18px}button{font:inherit;padding:12px}svg{width:24px;height:24px;vertical-align:middle}.scene-sound-panel{background:transparent;border:0;box-shadow:none;padding:0}input{width:220px;margin-top:15px}[hidden]{display:none!important}</style><body><header><div class="tools"><button data-theme-toggle>Night</button></div></header><h1>Volume control verification</h1><p>Isolated controller test; not a full website preview.</p></body></html>'''
def fixture(page,variant='baseline',storage='normal',muted=False,theme='dark',viewport=None):
 if viewport:page.set_viewport_size(viewport)
 page.set_content(HTML)
 page.evaluate('''({tone,storage,muted,theme})=>{
  document.documentElement.dataset.theme=theme;
  const values=new Map([['jr-site-ambient-volume-v6','0.05'],['jr-site-ambient-muted-v3',muted?'1':'0']]);
  window.__storageValues=values;window.__storageMode=storage;
  Object.defineProperty(window,'localStorage',{configurable:true,value:{
   getItem(k){if(window.__storageMode==='denied')throw new DOMException('Denied','SecurityError');return values.get(k)??null},
   setItem(k,v){if(window.__storageMode!=='normal')throw new DOMException('Full','QuotaExceededError');values.set(k,String(v))},
   removeItem(k){values.delete(k)},clear(){values.clear()}
  }});
  const create=document.createElement.bind(document);
  window.__documentProxy=new Proxy(document,{get(t,k){if(k==='currentScript')return {src:'https://fixture.invalid/site-audio.js'};const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v}});
  const srcSetter=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'src').set;
  window.__players=[];
  document.createElement=function(tag,...args){const element=create(tag,...args);if(tag.toLowerCase()==='audio'){
   let logical='';
   Object.defineProperty(element,'src',{configurable:true,get(){return logical},set(v){logical=String(v);srcSetter.call(this,tone)}});
   Object.defineProperty(element,'currentSrc',{configurable:true,get(){return logical}});
   window.__players.push(element);
  }return element};
  window.__meters=[];window.__contexts=[];
  const Native=window.AudioContext;
  window.AudioContext=class extends Native {constructor(...args){super(...args);__contexts.push(this)}createGain(){const g=super.createGain(),meter=this.createAnalyser();meter.fftSize=2048;g.connect(meter);__meters.push(meter);return g}};
 }''',{'tone':'data:audio/wav;base64,'+base64.b64encode(tone_bytes()).decode(),'storage':storage,'muted':muted,'theme':theme})
 source=(ROOT/variant/'site-audio.js').read_text()
 page.evaluate("s=>new Function('document','location',s)(__documentProxy,{href:'https://fixture.invalid/',pathname:'/',hostname:'fixture.invalid'})",source)
 page.add_script_tag(content=(ROOT/variant/'site-sound-control.js').read_text())
 page.locator('[data-scene-audio]').click();page.wait_for_timeout(350)

def snapshot(page):
 return page.evaluate('''()=>({volume:SiteAudio.volume,muted:SiteAudio.muted,slider:document.querySelector('#ambient-volume').value,levels:SiteAudio.outputLevels,contextStates:__contexts.map(c=>c.state),rms:__meters.map(a=>{const v=new Float32Array(a.fftSize);a.getFloatTimeDomainData(v);return Math.sqrt(v.reduce((s,x)=>s+x*x,0)/v.length)})})''')

def set_slider(page,value,event='input'):
 page.locator('#ambient-volume').evaluate("(e,v)=>{e.value=String(v.value);e.dispatchEvent(new Event(v.event,{bubbles:true}))}",{'value':value,'event':event})
 page.wait_for_timeout(150)
