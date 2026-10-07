/* Global metadata search. Does not load or inspect isolated project internals. */
(() => {
  const base=new URL('./',document.currentScript.src),dialog=document.querySelector('#search-dialog'),input=document.querySelector('#search-input'),results=document.querySelector('#search-results'),open=document.querySelector('#search-open');
  if(!dialog||!input||!results||!open)return;
  let entries=[],loading,previous,state='idle';
  const render=()=>{
    results.setAttribute('aria-busy',String(state==='loading'));
    if(state==='error'){
      const message=document.createElement('p');
      message.textContent='Search is unavailable. Try again or use the navigation links to browse.';
      const retry=document.createElement('button');
      retry.type='button';retry.textContent='Retry search';retry.addEventListener('click',load);
      results.replaceChildren(message,retry);return;
    }
    if(state!=='ready'){results.textContent='Loading search…';return;}
    const words=input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const found=entries.filter(e=>words.every(w=>(e.title+' '+e.text).toLowerCase().includes(w))).slice(0,30);
    results.replaceChildren(...found.map(e=>{
      const a=document.createElement('a');a.href=e.path;
      const title=document.createElement('strong');title.textContent=e.title;
      const detail=document.createElement('small');detail.textContent=e.text.slice(0,170);
      a.append(title,document.createElement('br'),detail);return a;
    }));
    if(!found.length)results.textContent='No matches. Try a subject, skill, project or lesson title.';
  };
  const load=()=>{
    if(loading||state==='ready')return;
    state='loading';render();
    loading=fetch(new URL('assets/site-search.json',base)).then(r=>{
      if(!r.ok)throw Error('Search request failed');return r.json();
    }).then(data=>{
      entries=data.entries||[];
      if(!entries.some(e=>e.path==='security-research.html'))entries.unshift({path:'security-research.html',title:'Security Research',text:'Authorized vulnerability analysis, deterministic fuzzing, Linux privilege review, synthetic Active Directory privilege paths, container hardening, and attack-surface inventory analysis.'});
      state='ready';render();
    }).catch(()=>{state='error';render();}).finally(()=>{loading=null;});
  };
  const show=(event)=>{
    if(!dialog.open){previous=event?.type==='click'?open:document.activeElement;dialog.showModal();}
    input.focus();load();render();
  };
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dialog.close();}});
  open.addEventListener('click',show);input.addEventListener('input',render);
  dialog.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>previous?.focus());
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)&&!document.activeElement?.isContentEditable){e.preventDefault();show();}});
})();
