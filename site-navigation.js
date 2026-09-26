/* Standard portfolio navigation. Learning and isolated games/labs opt in separately. */
(() => {
  const script=document.currentScript,base=new URL('./',script.src);
  const install=()=>{
    const nav=document.querySelector('header #primary-nav, header.site-header nav'),menu=document.querySelector('header #menu, header #mobile-menu');
    if(!nav||!menu||menu.dataset.navOwner)return;
    nav.id=nav.id||'primary-nav';
    menu.dataset.navOwner='site-navigation';document.body.classList.add('header-menu');
    const close=(restore=false)=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');if(restore)menu.focus();};
    menu.setAttribute('aria-controls',nav.id);close();
    menu.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
    nav.addEventListener('click',e=>{if(e.target.closest('a'))close();});
    document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!menu.contains(e.target))close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){e.preventDefault();close(true);}});
    nav.addEventListener('focusout',()=>setTimeout(()=>{if(!nav.contains(document.activeElement)&&document.activeElement!==menu)close();},0));
    fetch(new URL('assets/site-navigation.json',base)).then(r=>{if(!r.ok)throw Error('Navigation metadata unavailable');return r.json();}).then(data=>{
      const page=location.pathname.split('/').pop()||'index.html';const current=data.parents[page]||page;
      nav.replaceChildren(...data.items.map(item=>{const a=document.createElement('a');a.href=item.path;a.textContent=item.label;if(item.path===current)a.setAttribute('aria-current','page');return a;}));
    }).catch(()=>{/* Server-rendered valid links remain available when metadata cannot load. */});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
