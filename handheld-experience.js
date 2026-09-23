(() => {
  'use strict';
  const path = location.pathname.toLowerCase();
  if (/\/games\//.test(path) || /geometric-lab/.test(path) || /project-geometric-ai\.html$/.test(path) || /project-battle-chess\.html$/.test(path) || /play-evil-wizard\.html$/.test(path)) return;

  const phone = matchMedia('(max-width: 720px)');
  const tablet = matchMedia('(min-width: 721px) and (max-width: 1024px)');

  function markCards(){
    document.querySelectorAll('.project-card').forEach((card,i)=>{
      if(card.id==='evil-wizard'||card.id==='geometric-ai'||card.id==='battle-chess') return;
      card.classList.add('hx-science-card');
      card.style.setProperty('--hx-index',i);
    });
  }

  function removeLegacyFloatingNavigation(){
    document.getElementById('hx-phone-dock')?.remove();
    document.getElementById('hx-tablet-rail')?.remove();
  }

  function apply(){
    const mode=phone.matches?'phone':tablet.matches?'tablet':'desktop';
    document.documentElement.dataset.experience=mode;
    document.body.classList.toggle('hx-handheld',mode!=='desktop');
    removeLegacyFloatingNavigation();
    markCards();
  }

  phone.addEventListener?.('change',apply);
  tablet.addEventListener?.('change',apply);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();