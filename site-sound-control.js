/* Sole site ambience UI; playback/preferences belong to SiteAudio. */
(() => {
  const boot=()=>{
    if(!/(?:^|\/)(?:index\.html|learn\.html)?$/.test(location.pathname))return;
    const tools=document.querySelector('header .tools, header .header-tools'),audio=window.SiteAudio;
    if(!tools||!audio||document.querySelector('.scene-sound-control'))return;
    const wrapper=document.createElement('div');wrapper.className='scene-sound-control';
    wrapper.innerHTML='<button type="button" data-scene-audio aria-label="Background sound control" aria-expanded="false" aria-controls="ambient-panel">♫ <span>Sound</span></button><div id="ambient-panel" class="scene-sound-panel" hidden><label for="ambient-volume">Ambient sound <output>5%</output></label><input id="ambient-volume" type="range" min="0" max="10" step="5" value="5" aria-label="Ambient sound volume, zero to ten percent"><button type="button" class="scene-sound-mute">Mute</button><small data-audio-status></small></div>';
    tools.insertBefore(wrapper,tools.querySelector('[data-theme-toggle]')||tools.lastElementChild);
    const button=wrapper.querySelector('[data-scene-audio]'),panel=wrapper.querySelector('.scene-sound-panel'),slider=wrapper.querySelector('input'),mute=wrapper.querySelector('.scene-sound-mute');
    const render=()=>{slider.value=String(audio.volume*100);wrapper.querySelector('output').textContent=audio.muted?'Muted':Math.round(audio.volume*100)+'%';mute.textContent=audio.muted?'Unmute':'Mute';button.setAttribute('aria-pressed',String(!audio.muted&&audio.volume>0));button.setAttribute('aria-expanded',String(!panel.hidden));wrapper.querySelector('[data-audio-status]').textContent=audio.autoplayBlocked?'Tap Sound to allow playback.':audio.suppressed?'Ambient sound paused for this activity.':'';};
    button.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!audio.muted)audio.play();render();});
    slider.addEventListener('input',()=>{audio.setVolume(Math.round(Number(slider.value)/5)*.05);if(audio.volume>0)audio.setMuted(false);audio.sync(true);render();});
    mute.addEventListener('click',()=>{audio.setMuted(!audio.muted);if(!audio.muted&&audio.volume===0)audio.setVolume(.05);audio.sync(true);render();});
    document.addEventListener('click',e=>{if(!wrapper.contains(e.target)){panel.hidden=true;render();}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;button.focus();render();}});
    for(const event of ['portfolio:ambient-volume','portfolio:ambient-autoplay','portfolio:theme'])document.addEventListener(event,render);
    addEventListener('storage',render);render();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
