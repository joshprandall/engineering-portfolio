/* Shared navigation fallback, project-card navigation and explicit unavailable-image states. */
(() => {
  const markProjectShell=()=>{if(/\/(?:project-[^/]+|play-evil-wizard)\.html$/i.test(location.pathname))document.body?.classList.add('project-shell');};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',markProjectShell,{once:true});else markProjectShell();

  // Mobile layouts keep Play/Source links independently tappable. The rest of
  // each card still opens its dedicated project page, including by keyboard.
  const projectTarget=card=>card.querySelector('a.vnext-card-link')||card.querySelector('a.tile-open');
  document.querySelectorAll('.project-card').forEach(card=>{
    card.tabIndex=0;
    card.setAttribute('aria-label',(card.querySelector('h2,h3')?.textContent||'Project').trim()+': press Enter for project details');
  });
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||window.getSelection()?.toString())return;
    const card=event.target.closest?.('.project-card');
    if(!card||event.target.closest('a,button,input,select,textarea,summary,[role="button"]'))return;
    const target=projectTarget(card);
    if(target){event.preventDefault();window.location.assign(target.href);}
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||!event.target.matches?.('.project-card'))return;
    const target=projectTarget(event.target);
    if(target){event.preventDefault();window.location.assign(target.href);}
  });

  // Device-specific project actions: handheld links are only exposed on phones/tablets.
  const isHandheldDevice=()=>{
    const ua=navigator.userAgent||'';
    const explicit=/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
    const ipadDesktopUA=navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
    const coarseTouch=navigator.maxTouchPoints>0&&matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<=1024;
    return explicit||ipadDesktopUA||coarseTouch;
  };
  document.querySelectorAll('.handheld-only').forEach(link=>{link.hidden=!isHandheldDevice();});

  const fallbacks={
    'MIT-logo-black-red-72x38.svg':'MIT',
    'portrait.jpg':'JR',
    'osu-logo.png':'Oregon State University',
    'quantum2.jpg':'Advanced computing · systems, physics and quantum engineering'
  };
  document.querySelectorAll('img[src]').forEach(img=>{
    const name=img.getAttribute('src').split('/').pop();
    if(!fallbacks[name])return;
    const replace=()=>{
      if(!img.isConnected)return;
      if(!img.dataset.remoteAttempted&&img.getAttribute('src').startsWith('assets/')){
        img.dataset.remoteAttempted='1';
        img.src='https://raw.githubusercontent.com/joshprandall/engineering-portfolio/main/assets/'+name;
        return;
      }
      const element=document.createElement('div');element.className='image-fallback';
      element.setAttribute('role','img');element.setAttribute('aria-label',img.alt||fallbacks[name]);
      element.textContent=fallbacks[name];img.replaceWith(element);
    };
    img.addEventListener('error',replace);
    if(img.complete&&img.naturalWidth===0)replace();
  });
})();
