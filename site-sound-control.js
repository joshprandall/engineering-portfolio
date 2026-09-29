/* Shared shell sound control. SiteAudio owns playback/state; this module owns only the UI. */
(() => {
  'use strict';
  const boot=()=>{
    const tools=document.querySelector('header .tools, header .header-tools'),audio=window.SiteAudio;
    if(!tools||!audio||document.querySelector('.scene-sound-control'))return;

    const wrapper=document.createElement('div');
    wrapper.className='scene-sound-control';
    wrapper.innerHTML='<button type="button" data-scene-audio aria-label="Background sound control" aria-expanded="false" aria-controls="ambient-panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM16 8q6 4 0 8"/></svg><span>Sound</span></button><div id="ambient-panel" class="scene-sound-panel" hidden><label for="ambient-volume"><span>Volume</span><output>5%</output></label><div class="scene-sound-volume-row"><button type="button" class="scene-sound-down" aria-label="Lower background sound by five percent">−</button><input id="ambient-volume" type="range" min="0" max="100" step="1" value="5" aria-label="Background sound volume, zero to one hundred percent"><button type="button" class="scene-sound-up" aria-label="Raise background sound by five percent">+</button></div><button type="button" class="scene-sound-mute">Mute</button><small data-audio-status aria-live="polite"></small></div>';
    tools.insertBefore(wrapper,tools.querySelector('[data-theme-toggle]')||tools.lastElementChild);

    const button=wrapper.querySelector('[data-scene-audio]');
    const panel=wrapper.querySelector('.scene-sound-panel');
    const slider=wrapper.querySelector('#ambient-volume');
    const output=wrapper.querySelector('output');
    const mute=wrapper.querySelector('.scene-sound-mute');
    const down=wrapper.querySelector('.scene-sound-down');
    const up=wrapper.querySelector('.scene-sound-up');
    const status=wrapper.querySelector('[data-audio-status]');

    const render=()=>{
      const percent=Math.max(0,Math.min(100,Math.round(audio.volume*100)));
      slider.value=String(percent);
      slider.setAttribute('aria-valuetext',audio.muted?'Muted':percent+' percent');
      output.textContent=audio.muted?'Muted':percent+'%';
      mute.textContent=audio.muted?'Unmute':'Mute';
      mute.setAttribute('aria-pressed',String(audio.muted));
      button.setAttribute('aria-pressed',String(!audio.muted&&percent>0));
      button.setAttribute('aria-expanded',String(!panel.hidden));
      button.title=audio.autoplayBlocked?'Tap Sound to allow playback.':audio.suppressed?'Background sound paused for this activity.':'Adjust background sound.';
      status.textContent=audio.autoplayBlocked?'Tap Sound to allow playback.':audio.suppressed?'Background sound paused for this activity.':'';
      status.hidden=!status.textContent;
    };

    const setPercent=value=>{
      const percent=Math.max(0,Math.min(100,Math.round(Number(value)||0)));
      audio.setVolume(percent/100);
      audio.setMuted(percent===0);
      audio.sync(true);
      if(percent>0)audio.play();
      render();
    };

    button.addEventListener('click',()=>{
      panel.hidden=!panel.hidden;
      if(!panel.hidden&&!audio.muted)audio.play();
      render();
    });

    slider.addEventListener('input',()=>setPercent(slider.value));
    slider.addEventListener('change',()=>setPercent(slider.value));
    down.addEventListener('click',()=>setPercent(Math.round(audio.volume*100)-5));
    up.addEventListener('click',()=>setPercent(Math.round(audio.volume*100)+5));
    mute.addEventListener('click',()=>{
      const next=!audio.muted;
      if(!next&&audio.volume===0)audio.setVolume(.05);
      audio.setMuted(next);
      audio.sync(true);
      if(!next)audio.play();
      render();
    });

    document.addEventListener('click',e=>{if(!wrapper.contains(e.target)){panel.hidden=true;render();}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;button.focus();render();}});
    for(const event of ['portfolio:ambient-volume','portfolio:ambient-autoplay','portfolio:theme'])document.addEventListener(event,render);
    addEventListener('storage',render);
    render();
  };
  document.addEventListener('portfolio:site-audio-ready',boot);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
