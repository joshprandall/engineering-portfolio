/* Shared navigation fallback, project-card navigation and explicit unavailable-image states. */
(() => {
  const markProjectShell=()=>{if(/\/(?:project-[^/]+|play-evil-wizard)\.html$/i.test(location.pathname))document.body?.classList.add('project-shell');};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',markProjectShell,{once:true});else markProjectShell();

  // Shared primary navigation owner for every standard portfolio page.
  const installNavigation=()=>{
    const nav=document.querySelector('header nav#primary-nav');
    const menu=document.getElementById('menu');
    if(!nav||!menu||menu.dataset.navOwner==='resilience')return;
    document.body.classList.add('header-menu');

    const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    const projectPage=/^(?:project-[^/]+|resume)\.html$/.test(path);
    const gamePage=path==='play-evil-wizard.html'||path==='project-battle-chess.html'||/\/games\//i.test(location.pathname);
    const current=gamePage?'game-development.html':
      projectPage?'projects.html':
      path.startsWith('learn')||path==='lesson.html'?'learn.html':
      path==='expertise-experience.html'?'expertise-experience.html':
      path==='projects.html'?'projects.html':
      path==='game-development.html'?'game-development.html':
      path==='index.html'?'index.html':'';

    const links=[
      ['index.html','Home'],
      ['expertise-experience.html','Expertise & Experience'],
      ['projects.html','Projects'],
      ['learn.html','Learn'],
      ['game-development.html','Game Development'],
      ['index.html#direction','Direction']
    ];

    nav.innerHTML=links.map(([href,label])=>{
      const base=href.split('#')[0];
      const active=current===base&&href.indexOf('#')<0;
      return '<a href="'+href+'"'+(active?' aria-current="page"':'')+'>'+label+'</a>';
    }).join('');

    const close=()=>{
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded','false');
      menu.setAttribute('aria-label','Open navigation');
    };

    menu.dataset.navOwner='resilience';
    menu.setAttribute('aria-controls',nav.id||'primary-nav');
    menu.setAttribute('aria-expanded',String(nav.classList.contains('open')));
    menu.setAttribute('aria-label',nav.classList.contains('open')?'Close navigation':'Open navigation');

    menu.onclick=event=>{
      event.preventDefault();
      event.stopPropagation();
      const opened=nav.classList.toggle('open');
      menu.setAttribute('aria-expanded',String(opened));
      menu.setAttribute('aria-label',opened?'Close navigation':'Open navigation');
    };

    nav.addEventListener('click',event=>{if(event.target.closest('a'))close();});
    document.addEventListener('click',event=>{
      if(nav.classList.contains('open')&&!nav.contains(event.target)&&!menu.contains(event.target))close();
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){close();menu.focus();}});
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
