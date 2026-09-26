/* Global metadata search. Does not load or inspect isolated project internals. */
(() => {
  const base=new URL('./',document.currentScript.src),dialog=document.querySelector('#search-dialog'),input=document.querySelector('#search-input'),results=document.querySelector('#search-results'),open=document.querySelector('#search-open');
  if(!dialog||!input||!results||!open)return;
  let entries=[],loading,previous;
  const render=()=>{const words=input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);const found=entries.filter(e=>words.every(w=>(e.title+' '+e.text).toLowerCase().includes(w))).slice(0,30);results.replaceChildren(...found.map(e=>{const a=document.createElement('a');a.href=e.path;const title=document.createElement('strong');title.textContent=e.title;const detail=document.createElement('small');detail.textContent=e.text.slice(0,170);a.append(title,document.createElement('br'),detail);return a;}));if(!found.length)results.textContent=entries.length?'No matches. Try a subject, skill, project or lesson title.':'Loading search…';};
  const show=()=>{previous=document.activeElement;if(!dialog.open)dialog.showModal();input.focus();if(!loading)loading=fetch(new URL('assets/site-search.json',base)).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{entries=data.entries;render();}).catch(()=>{results.textContent='Search is unavailable. Use the navigation links to browse.';loading=null;});render();};
  open.addEventListener('click',show);input.addEventListener('input',render);
  dialog.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>previous?.focus());
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)&&!document.activeElement?.isContentEditable){e.preventDefault();show();}});
})();
