/* Thumb-only page scroller. Native scrolling remains intact; this is a persistent drag/keyboard affordance with no rail. */
(() => {
  'use strict';
  if (window.SitePageScroll) return;

  const mount=()=>{
    if(document.querySelector('.site-page-scroll'))return;
    const host=document.createElement('div');
    host.className='site-page-scroll';
    host.setAttribute('aria-hidden','false');
    host.innerHTML='<div class="site-page-scroll-thumb" role="scrollbar" aria-label="Page position" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"></div>';
    document.body.append(host);
    const thumb=host.firstElementChild;

    let frame=0,startY=0,startScroll=0,dragging=false;

    const metrics=()=>{
      const root=document.documentElement;
      const height=Math.max(root.scrollHeight,document.body?.scrollHeight||0);
      const viewport=Math.max(1,window.innerHeight);
      const maxScroll=Math.max(0,height-viewport);
      const track=Math.max(1,host.clientHeight);
      const thumbHeight=Math.min(track,72,Math.max(44,track*(viewport/Math.max(height,viewport))));
      const travel=Math.max(0,track-thumbHeight);
      return {height,viewport,maxScroll,track,thumbHeight,travel};
    };

    const sync=()=>{
      frame=0;
      const m=metrics();
      const ratio=m.maxScroll?Math.max(0,Math.min(1,window.scrollY/m.maxScroll)):0;
      host.hidden=m.maxScroll<2;
      thumb.style.height=m.thumbHeight+'px';
      thumb.style.transform='translate3d(0,'+(m.travel*ratio)+'px,0)';
      const value=Math.round(ratio*100);
      thumb.setAttribute('aria-valuenow',String(value));
      thumb.setAttribute('aria-valuetext',value+' percent through page');
    };
    const requestSync=()=>{if(!frame)frame=requestAnimationFrame(sync);};

    const scrollToValue=value=>{
      const m=metrics();
      const next=Math.max(0,Math.min(m.maxScroll,value));
      window.scrollTo({top:next,left:0,behavior:'instant'});
      requestSync();
    };

    thumb.addEventListener('pointerdown',e=>{
      if(e.button!==undefined&&e.button!==0)return;
      dragging=true;startY=e.clientY;startScroll=window.scrollY;
      thumb.classList.add('is-dragging');
      try{thumb.setPointerCapture(e.pointerId);}catch{}
      e.preventDefault();
    });
    thumb.addEventListener('pointermove',e=>{
      if(!dragging)return;
      const m=metrics();
      if(!m.travel)return;
      scrollToValue(startScroll+(e.clientY-startY)*(m.maxScroll/m.travel));
      e.preventDefault();
    });
    const stop=e=>{
      if(!dragging)return;
      dragging=false;thumb.classList.remove('is-dragging');
      try{thumb.releasePointerCapture(e.pointerId);}catch{}
    };
    thumb.addEventListener('pointerup',stop);
    thumb.addEventListener('pointercancel',stop);

    thumb.addEventListener('keydown',e=>{
      const m=metrics();
      const step=Math.max(48,m.viewport*.09);
      let target=null;
      if(e.key==='ArrowUp')target=window.scrollY-step;
      if(e.key==='ArrowDown')target=window.scrollY+step;
      if(e.key==='PageUp')target=window.scrollY-m.viewport*.85;
      if(e.key==='PageDown')target=window.scrollY+m.viewport*.85;
      if(e.key==='Home')target=0;
      if(e.key==='End')target=m.maxScroll;
      if(target!==null){e.preventDefault();scrollToValue(target);}
    });

    addEventListener('scroll',requestSync,{passive:true});
    addEventListener('resize',requestSync,{passive:true});
    addEventListener('pageshow',requestSync);
    document.addEventListener('load',requestSync,true);
    document.addEventListener('toggle',requestSync,true);
    new MutationObserver(requestSync).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open','class']});
    requestSync();

    window.SitePageScroll=Object.freeze({sync:requestSync});
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
