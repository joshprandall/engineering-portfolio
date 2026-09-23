/* Shared navigation fallback, project-card navigation and explicit unavailable-image states. */
(() => {
  // Shared primary navigation owner for every standard portfolio page.
  const installNavigation=()=>{
    const nav=document.querySelector('header nav#primary-nav');
    const menu=document.getElementById('menu');
    if(!nav||!menu)return;

    // One intentional game-development category replaces legacy standalone game links.
    nav.querySelectorAll(':scope > a[href="project-battle-chess.html"]').forEach(link=>link.remove());
    if(!nav.querySelector('.nav-games')){
      const games=document.createElement('details');
      games.className='nav-games';
      games.innerHTML='<summary>Game Development</summary><div class="nav-games-menu"><a href="project-battle-chess.html">3D Battle Chess</a><a href="play-evil-wizard.html">Defeat the Evil Wizard</a></div>';
      nav.append(games);
    }

    const games=nav.querySelector('.nav-games');
    const close=()=>{
      nav.classList.remove('open');
      games?.removeAttribute('open');
      menu.setAttribute('aria-expanded','false');
      menu.setAttribute('aria-label','Open navigation');
    };

    menu.dataset.navOwner='resilience';
    menu.setAttribute('aria-controls',nav.id||'primary-nav');
    menu.setAttribute('aria-expanded',String(nav.classList.contains('open')));
    menu.setAttribute('aria-label',nav.classList.contains('open')?'Close navigation':'Open navigation');

    // onclick assignment guarantees one owner even if an older cached handler existed.
    menu.onclick=event=>{
      event.preventDefault();
      event.stopPropagation();
      const opened=nav.classList.toggle('open');
      if(!opened)games?.removeAttribute('open');
      menu.setAttribute('aria-expanded',String(opened));
      menu.setAttribute('aria-label',opened?'Close navigation':'Open navigation');
    };

    nav.addEventListener('click',event=>{if(event.target.closest('a'))close();});
    document.addEventListener('click',event=>{
      if(games?.open&&!games.contains(event.target))games.removeAttribute('open');
      if(innerWidth<=900&&nav.classList.contains('open')&&!nav.contains(event.target)&&!menu.contains(event.target))close();
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
    window.addEventListener('resize',()=>{if(innerWidth>900)close();});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installNavigation,{once:true});
  else installNavigation();

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
    'portrait.jpg':'JR',
    'osu-logo.png':'Oregon State University',
    'quantum2.jpg':'Advanced computing · systems, physics and quantum engineering'
  };
  document.querySelectorAll('img[src^="assets/"]').forEach(img=>{
    const name=img.getAttribute('src').split('/').pop();
    if(!fallbacks[name])return;
    const replace=()=>{
      if(!img.isConnected)return;
      if(!img.dataset.remoteAttempted){
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
