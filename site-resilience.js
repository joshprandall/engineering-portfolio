/* Shared navigation fallback and explicit unavailable-image states. */
(() => {
  const nav=document.querySelector('header nav#primary-nav');
  const menu=document.getElementById('menu');
  if(nav&&menu){
    menu.setAttribute('aria-controls',nav.id);
    // Capture once on document so a separately loaded app.js cannot double-toggle.
    document.addEventListener('click',event=>{
      if(!menu.contains(event.target))return;
      event.stopPropagation();
      const opened=nav.classList.toggle('open');
      menu.setAttribute('aria-expanded',String(opened));
      menu.setAttribute('aria-label',opened?'Close navigation':'Open navigation');
    },true);
    nav.addEventListener('click',event=>{
      if(event.target.closest('a')){
        nav.classList.remove('open');menu.setAttribute('aria-expanded','false');
        menu.setAttribute('aria-label','Open navigation');
      }
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&nav.classList.contains('open')){
        nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.focus();
      }
    });
    window.addEventListener('resize',()=>{
      if(innerWidth>900){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}
    });
  }
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
