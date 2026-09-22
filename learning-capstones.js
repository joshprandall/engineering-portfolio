/* Eight authored, offline-compatible foundation capstones. No automatic grading of free response. */
(async()=>{
 const root=document.getElementById('cap-detail'),nav=document.getElementById('cap-selector');
 try{
  const response=await fetch('learning-capstones.json',{cache:'no-store'});
  if(!response.ok)throw new Error(`Capstone data unavailable (${response.status})`);
  const data=await response.json();if(!Array.isArray(data.capstones)||data.capstones.length!==8)throw new Error('Capstone set is incomplete');
  const choices=new Map(data.capstones.map((c,i)=>[c.id,{...c,index:i}]));
  const byId=new URL(location.href).searchParams.get('path');const chosen=choices.get(byId)||data.capstones[0];
  function element(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n}
  function section(title,body){const wrap=element('section',undefined,'cap-section');wrap.append(element('h3',title),element('p',body));return wrap}
  for(const cap of data.capstones){const a=element('a',cap.title);a.href=`learn-capstones.html?path=${encodeURIComponent(cap.id)}`;if(chosen.id===cap.id)a.setAttribute('aria-current','page');nav.append(a)}
  const title=document.getElementById('cap-title');title.textContent=chosen.title;document.title=`${chosen.title} | Foundation capstones`;
  root.replaceChildren(element('p',`CAPSTONE ${String(data.capstones.findIndex(c=>c.id===chosen.id)+1).padStart(2,'0')} / 08 · ${chosen.time} MINUTES · EDUCATIONAL PRACTICE`,'cap-meta'),section('Prerequisites',chosen.prerequisites),section('Scenario',chosen.scenario),section('Core concept',chosen.concept));
  const sample=section('Worked example',chosen.example);sample.querySelector('p').className='cap-example';root.append(sample);
  const steps=element('section',undefined,'cap-section');steps.append(element('h3','Hands-on lab procedure'));
  const ordered=element('ol');chosen.steps.forEach(s=>ordered.append(element('li',s)));steps.append(ordered);root.append(steps);
  const quiz=element('section',undefined,'cap-section');quiz.append(element('h3','Check your understanding'),element('p',chosen.check.question));
  const form=element('form',undefined,'cap-check');const options=[];
  chosen.check.options.forEach((option,i)=>{const label=element('label'),input=element('input');input.type='radio';input.name='answer';input.value=String(i);input.required=true;label.append(input,element('span',option));form.append(label);options.push(input)});
  const submit=element('button','Check answer');submit.type='submit';const result=element('p','', 'cap-check-result');result.setAttribute('role','status');form.append(submit,result);
  form.addEventListener('submit',e=>{e.preventDefault();const found=options.find(x=>x.checked);if(!found){result.textContent='Choose an answer first.';return}result.textContent=(Number(found.value)===chosen.check.correct?'Correct. ':'Revisit the concept. ')+chosen.check.reason});quiz.append(form);root.append(quiz);
  const review=element('section',undefined,'cap-section cap-rubric');review.append(element('h3','Evidence-based self-review'),element('p','Check an item only after you can show its working or explain it without notes. A checkbox is not a credential or verified completion.'));
  const progress=element('p','0 of '+chosen.rubric.length+' criteria checked','cap-progress');progress.setAttribute('role','status');
  chosen.rubric.forEach((s,i)=>{const label=element('label');const box=element('input');box.type='checkbox';box.setAttribute('aria-label',s);label.append(box,element('span',s));box.onchange=()=>{progress.textContent=`${review.querySelectorAll('input:checked').length} of ${chosen.rubric.length} criteria checked`;};review.append(label)});
  review.append(progress);root.append(review);
  const next=element('nav',undefined,'cap-next');next.setAttribute('aria-label','Continue learning');
  const previous=element('a','← Return to this learning path');previous.href=`learn-paths.html?path=${encodeURIComponent(chosen.id)}`;
  const all=element('a','All learning paths');all.href='learn-paths.html';next.append(previous,all);root.append(next);
 }catch(error){root.replaceChildren(element('p',`Capstone couldn't load: ${error.message}. Return to learning paths and try again.`))}
})();
