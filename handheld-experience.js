(() => {
  'use strict';
  const path = location.pathname.toLowerCase();
  if (/\/games\//.test(path) || /geometric-lab/.test(path) || /project-geometric-ai\.html$/.test(path) || /project-battle-chess\.html$/.test(path) || /play-evil-wizard\.html$/.test(path)) return;
  const $ = (s, r=document) => r.querySelector(s);
  const state = {mode:'desktop'};
  const phone = matchMedia('(max-width: 720px)');
  const tablet = matchMedia('(min-width: 721px) and (max-width: 1024px)');

  function activateExisting(selector){
    const el=$(selector); if(el){ el.click(); return true; } return false;
  }
  function focusSearch(){
    if(activateExisting('#search-open'))return true;
    const field=$('input[type="search"],#library-search,#search-input');
    if(field){field.focus();field.scrollIntoView({block:'center',behavior:'smooth'});return true}
    return false;
  }
  function openMenu(){
    return activateExisting('#menu')||activateExisting('#mobile-menu')||activateExisting('.menu-button');
  }
  function jump(href){ location.href=href; }
  function currentRoot(){ return /\/qubit-preview-/.test(path) ? '../' : ''; }
  function button(label, icon, action){
    const b=document.createElement('button'); b.type='button'; b.className='hx-action';
    b.innerHTML=`<span aria-hidden="true">${icon}</span><small>${label}</small>`;
    b.addEventListener('click', action); return b;
  }
  function buildPhoneDock(){
    if($('#hx-phone-dock')) return;
    const root=currentRoot();
    const nav=document.createElement('nav'); nav.id='hx-phone-dock'; nav.className='hx-phone-dock'; nav.setAttribute('aria-label','Handheld quick navigation');
    nav.append(
      button('Home','⌂',()=>jump(root+'index.html')),
      button('Projects','◈',()=>jump(root+'projects.html')),
      button('Learn','◎',()=>jump(root+'learn.html')),
      button('Search','⌕',()=>{ if(!focusSearch()) jump(root+'projects.html'); }),
      button('Menu','☰',()=>{ if(!openMenu()) window.scrollTo({top:0,behavior:'smooth'}); })
    );
    const active=/\/(?:learn|knowledge)/.test(path)?2:/\/(?:projects?|project-|qubit-preview-)/.test(path)?1:0;
    nav.children[active]?.setAttribute('aria-current','page');
    document.body.append(nav);
  }
  function buildTabletRail(){
    if($('#hx-tablet-rail')) return;
    const root=currentRoot();
    const rail=document.createElement('nav'); rail.id='hx-tablet-rail'; rail.className='hx-tablet-rail'; rail.setAttribute('aria-label','Tablet quick navigation');
    rail.append(
      button('Home','⌂',()=>jump(root+'index.html')),
      button('Projects','◈',()=>jump(root+'projects.html')),
      button('Learn','◎',()=>jump(root+'learn.html')),
      button('Search','⌕',()=>focusSearch())
    );
    const active=/\/(?:learn|knowledge)/.test(path)?2:/\/(?:projects?|project-|qubit-preview-)/.test(path)?1:0;
    rail.children[active]?.setAttribute('aria-current','page');
    document.body.append(rail);
  }
  function markCards(){
    document.querySelectorAll('.project-card').forEach((card,i)=>{
      if(card.id==='evil-wizard'||card.id==='geometric-ai'||card.id==='battle-chess') return;
      card.classList.add('hx-science-card'); card.style.setProperty('--hx-index',i);
    });
  }
  function apply(){
    state.mode=phone.matches?'phone':tablet.matches?'tablet':'desktop';
    document.documentElement.dataset.experience=state.mode;
    document.body.classList.toggle('hx-handheld',state.mode!=='desktop');
    buildPhoneDock(); buildTabletRail(); markCards();
    $('#hx-phone-dock')?.toggleAttribute('hidden',state.mode!=='phone');
    $('#hx-tablet-rail')?.toggleAttribute('hidden',state.mode!=='tablet');
  }
  phone.addEventListener?.('change',apply); tablet.addEventListener?.('change',apply);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true}); else apply();
})();