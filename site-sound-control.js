/* Sole site ambience UI; playback/preferences belong to SiteAudio. */
(() => {
  const boot=()=>{
    const tools=document.querySelector('header .tools, header .header-tools'),audio=window.SiteAudio;
    if(!tools||!audio||document.querySelector('.scene-sound-control'))return;
    const wrapper=document.createElement('div');wrapper.className='scene-sound-control';
    wrapper.innerHTML='<button type="button" data-scene-audio aria-label="Background sound control" aria-expanded="false" aria-controls="ambient-panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM16 8q6 4 0 8"/></svg><span>Sound</span></button><div id="ambient-panel" class="scene-sound-panel" hidden><label for="ambient-volume">Ambient sound <output>5%</output></label><div class="scene-sound-volume-row"><button type="button" class="scene-sound-down" aria-label="Lower ambient sound by five percent">−</button><input id="ambient-volume" type="range" min="0" max="100" step="1" value="5" aria-label="Ambient sound volume, zero to one hundred percent"><button type="button" class="scene-sound-up" aria-label="Raise ambient sound by five percent">+</button></div><button type="button" class="scene-sound-mute">Mute</button><small data-audio-status></small></div>';
    tools.insertBefore(wrapper,tools.querySelector('[data-theme-toggle]')||tools.lastElementChild);
    const button=wrapper.querySelector('[data-scene-audio]'),panel=wrapper.querySelector('.scene-sound-panel'),slider=wrapper.querySelector('input'),mute=wrapper.querySelector('.scene-sound-mute'),down=wrapper.querySelector('.scene-sound-down'),up=wrapper.querySelector('.scene-sound-up');
    const render=()=>{slider.value=String(audio.volume*100);wrapper.querySelector('output').textContent=audio.muted?'Muted':Math.round(audio.volume*100)+'%';mute.textContent=audio.muted?'Unmute':'Mute';button.setAttribute('aria-pressed',String(!audio.muted&&audio.volume>0));button.setAttribute('aria-expanded',String(!panel.hidden));wrapper.querySelector('[data-audio-status]').textContent=audio.autoplayBlocked?'Tap Sound to allow playback.':audio.suppressed?'Ambient sound paused for this activity.':'';};
    button.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!audio.muted)audio.play();render();});
    const setPercent=value=>{const percent=Math.max(0,Math.min(100,Math.round(Number(value)||0)));audio.setVolume(percent/100);if(percent>0)audio.setMuted(false);audio.sync(true);render();};
    slider.addEventListener('input',()=>setPercent(slider.value));
    down.addEventListener('click',()=>setPercent(Math.round(audio.volume*100)-5));
    up.addEventListener('click',()=>setPercent(Math.round(audio.volume*100)+5));
    mute.addEventListener('click',()=>{audio.setMuted(!audio.muted);if(!audio.muted&&audio.volume===0)audio.setVolume(.05);audio.sync(true);render();});
    document.addEventListener('click',e=>{if(!wrapper.contains(e.target)){panel.hidden=true;render();}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;button.focus();render();}});
    for(const event of ['portfolio:ambient-volume','portfolio:ambient-autoplay','portfolio:theme'])document.addEventListener(event,render);
    addEventListener('storage',render);render();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
