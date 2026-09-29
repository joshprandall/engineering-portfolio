#!/usr/bin/env python3
"""Build a review-only volume repair from the verified repair-branch files.

No network, Git writes or production deployment. Refuses unknown source bytes.
"""
from pathlib import Path
import argparse,hashlib,json,difflib
BASE_SHA={'site-audio.js':'c0f0c42208070e965cda31c8078d3697ba8a5f02','site-sound-control.js':'234c3bfd02097bdc80ec6db79c648c92fafdd8b4'}
def git_sha(data):return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
def replace_once(text,old,new):
 if text.count(old)!=1:raise ValueError('Unexpected source block; refusing ambiguous replacement: '+old[:60])
 return text.replace(old,new,1)
def repair_audio(s):
 s=replace_once(s,"  let memoryVolume=DEFAULT_BACKGROUND_VOLUME, memoryMuted=false;\n  function setMuted(value){memoryMuted=Boolean(value);try{localStorage.setItem(MUTE_KEY,memoryMuted?'1':'0');}catch{}sync(true);document.dispatchEvent(new CustomEvent('portfolio:ambient-volume'));}\n  function muted() {\n    try { const value=localStorage.getItem(MUTE_KEY);return value===null?memoryMuted:value==='1'; }\n    catch (_) { return memoryMuted; }\n  }",'''  // The current session is authoritative. Persistence is best-effort: a quota
  // or privacy failure must never restore stale volume or prevent muting.
  let memoryVolume = DEFAULT_BACKGROUND_VOLUME;
  let memoryMuted = false;

  function readSavedPreferences(key = null) {
    try {
      if (key === null || key === VOLUME_KEY) {
        const raw = localStorage.getItem(VOLUME_KEY);
        const saved = raw === null ? DEFAULT_BACKGROUND_VOLUME : Number(raw);
        if (Number.isFinite(saved)) {
          memoryVolume = Math.min(MAX_BACKGROUND_VOLUME, Math.max(0, saved));
        }
      }
      if (key === null || key === MUTE_KEY) {
        memoryMuted = localStorage.getItem(MUTE_KEY) === '1';
      }
    } catch (_) {
      // Retain the current in-memory preferences if storage cannot be read.
    }
  }

  readSavedPreferences();

  function setMuted(value) {
    memoryMuted = Boolean(value);
    try { localStorage.setItem(MUTE_KEY, memoryMuted ? '1' : '0'); } catch (_) {}
    sync(true);
    document.dispatchEvent(new CustomEvent('portfolio:ambient-volume'));
  }

  function muted() {
    return memoryMuted;
  }''')
 s=replace_once(s,'''  function preferredVolume() {
    try {
      const raw = localStorage.getItem(VOLUME_KEY);
      const saved = raw === null ? memoryVolume : Number(raw);
      if (Number.isFinite(saved)) return Math.min(MAX_BACKGROUND_VOLUME, Math.max(0, saved));
    } catch (_) {}
    return memoryVolume;
  }''','''  function preferredVolume() {
    return memoryVolume;
  }''')
 s=replace_once(s,'''  function playBeach() {
    if (desiredKey() !== 'beach') return;
    resumeVolumeGraph();
    const player''','''  function playBeach() {
    if (desiredKey() !== 'beach') return;
    resumeVolumeGraph();
    // Slider/gesture recovery must not reset the active crossfade's levels.
    if (beachTransitioning) return;
    const player''')
 s=replace_once(s,'''  // Keep different tabs/windows in sync with the global mute preference.
  addEventListener('storage', event => {
    if (event.key === MUTE_KEY) sync(true);
    if (event.key === VOLUME_KEY) {
      applyPreferredVolume();
      sync(true);
    }
  });''','''  // Only external preference changes reload persistence. Local input never
  // rereads an old value after a failed write. A cleared store restores defaults.
  addEventListener('storage', event => {
    if (event.key !== null && event.key !== MUTE_KEY && event.key !== VOLUME_KEY) return;
    try { if (event.storageArea && event.storageArea !== localStorage) return; }
    catch (_) { return; }
    readSavedPreferences(event.key);
    applyPreferredVolume();
    sync(true);
    document.dispatchEvent(new CustomEvent('portfolio:ambient-volume'));
  });''')
 return s

def repair_control(s):
 return replace_once(s,'''    slider.addEventListener('input',()=>{
      const percent=Math.max(0,Math.min(100,Number(slider.value)||0));
      audio.setVolume(percent/100);
      if(audio.muted!==(percent===0))audio.setMuted(percent===0);
      audio.sync(true);render();
    });''','''    const commitVolume=()=>{
      const percent=Math.max(0,Math.min(100,Number(slider.value)||0));
      audio.setVolume(percent/100);
      if(audio.muted!==(percent===0))audio.setMuted(percent===0);
      // Resume within this interaction, not a later metadata callback. This also
      // recovers a suspended audio graph when the media element is still playing.
      if(percent>0&&!audio.suppressed)audio.play();else audio.sync(true);
      render();
    };
    slider.addEventListener('input',commitVolume);
    // Accessibility/browser commit paths may dispatch change without input.
    slider.addEventListener('change',commitVolume);''')

def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--source',type=Path,default=Path(__file__).parent/'baseline')
 ap.add_argument('--output',type=Path,default=Path(__file__).parent/'patched')
 a=ap.parse_args()
 if a.source.resolve()==a.output.resolve():ap.error('Source and output must be different; review copies only.')
 payload={}
 for name,wanted in BASE_SHA.items():
  data=(a.source/name).read_bytes()
  if git_sha(data)!=wanted:raise SystemExit('STOP: '+name+' differs from verified repair-branch source. No files written.')
  text=data.decode();out=repair_audio(text) if name=='site-audio.js' else repair_control(text)
  payload[name]=(data,out.encode())
 a.output.mkdir(parents=True,exist_ok=True)
 report={}
 for name,(before,after) in payload.items():
  (a.output/name).write_bytes(after)
  report[name]={'base_blob_sha':git_sha(before),'patched_sha256':hashlib.sha256(after).hexdigest(),'bytes':len(after)}
  print(name,report[name]['patched_sha256'])
 (a.output/'volume-repair-manifest.json').write_text(json.dumps({'base_commit':'11f9f5e33bd8452b1b0538ffe285b8e9b354d865','review_only':True,'files':report},indent=2)+'\n')
 patch=''.join(''.join(difflib.unified_diff(before.decode().splitlines(True),after.decode().splitlines(True),fromfile='a/'+name,tofile='b/'+name)) for name,(before,after) in payload.items())
 (a.output/'volume-repair.patch').write_text(patch)
if __name__=='__main__':main()
