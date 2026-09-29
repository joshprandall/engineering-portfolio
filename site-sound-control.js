/* Sole site ambience UI; playback/preferences belong to SiteAudio. */
(() => {
  const boot=()=>{
    const tools=document.querySelector('header .tools, header .header-tools'),audio=window.SiteAudio;
    if(!tools||!audio||document.querySelector('.scene-sound-control'))return;
    const wrapper=document.createElement('div');wrapper.className='scene-sound-control';
    wrapper.innerHTML='<button type="button" data-scene-audio aria-label="Background sound control" aria-expanded="false" aria-controls="ambient-panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM16 8q6 4 0 8"/></svg><span>Sound</span></button><div id="ambient-panel" class="scene-sound-panel" hidden><input id="ambient-volume" type="range" min="0" max="100" step="1" value="5" aria-label="Ambient sound volume, zero to mute"></div>';
    tools.insertBefore(wrapper,tools.querySelector('[data-theme-toggle]')||tools.lastElementChild);
    const button=wrapper.querySelector('[data-scene-audio]'),panel=wrapper.querySelector('.scene-sound-panel'),slider=wrapper.querySelector('input');
    const render=()=>{
      const percent=Math.round(audio.volume*100);
      slider.value=String(audio.muted?0:percent);
      slider.setAttribute('aria-valuetext',audio.muted||percent===0?'Muted':percent+' percent');
      button.setAttribute('aria-pressed',String(!audio.muted&&percent>0));
      button.setAttribute('aria-expanded',String(!panel.hidden));
      button.title=audio.autoplayBlocked?'Tap Sound to allow playback.':audio.suppressed?'Ambient sound paused for this activity.':'Adjust background sound; slide to zero to mute.';
    };
    button.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!audio.muted)audio.play();render();});
    // Native range handling preserves touch, mouse and keyboard behavior.
    // A second pointer-based scrubber must not fight the browser's own thumb.
    const applySlider=()=>{
      const percent=Math.max(0,Math.min(100,Number(slider.value)||0));
      audio.setVolume(percent/100);
      if(audio.muted!==(percent===0))audio.setMuted(percent===0);
      audio.sync(true);
      if(percent>0)audio.play();
      render();
    };
    // Safari/iOS may defer a native range update until the control commits.
    // Listen to both continuous input and the final change event so touch,
    // mouse and keyboard all drive the same SiteAudio state.
    slider.addEventListener('input',applySlider);
    slider.addEventListener('change',applySlider);
    document.addEventListener('click',e=>{if(!wrapper.contains(e.target)){panel.hidden=true;render();}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;button.focus();render();}});
    for(const event of ['portfolio:ambient-volume','portfolio:ambient-autoplay','portfolio:theme'])document.addEventListener(event,render);
    addEventListener('storage',render);render();
  };
  document.addEventListener('portfolio:site-audio-ready',boot);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
