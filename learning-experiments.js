/* Small, inspectable experiments. No timers, network requests, audio, or storage. */
(function (root) {
  'use strict';
  const finite = (v, name, lo = -Infinity, hi = Infinity) => {
    if (String(v).trim() === '') throw new Error(`${name} is required.`);
    const n = Number(v);
    if (!Number.isFinite(n) || n < lo || n > hi) throw new Error(`${name} must be a finite number between ${lo} and ${hi}.`);
    return n;
  };
  const integer = (v, name, lo, hi) => {
    const n = finite(v, name, lo, hi);
    if (!Number.isInteger(n)) throw new Error(`${name} must be an integer.`);
    return n;
  };
  const field = (key, label, value, type = 'number', extra = {}) => ({key, label, value, type, ...extra});
  const number = (n) => Number.isInteger(n) ? String(n) : Number(n.toPrecision(7)).toString();
  const experiments = {
    prefix: {
      title: 'Find the block before counting hosts',
      fields: [field('address', 'IPv4 address', '192.168.10.70', 'text'), field('prefix', 'Prefix length (bits)', 26, 'number', {min: 0, max: 32, step: 1})],
      caption: 'An aligned IPv4 block. /31 is interpreted as a point-to-point link; /32 identifies one address. Provider reservations are outside this model.',
      run(p) {
        const parts = String(p.address).trim().split('.');
        if (parts.length !== 4 || parts.some(x => !/^(0|[1-9]\d{0,2})$/.test(x) || +x > 255)) throw new Error('Use four decimal IPv4 octets, each 0–255, without empty octets or leading zeroes.');
        const prefix = integer(p.prefix, 'Prefix', 0, 32), ip = parts.reduce((a, x) => a * 256 + +x, 0);
        const total = 2 ** (32 - prefix), start = Math.floor(ip / total) * total;
        const address = n => [24, 16, 8, 0].map(s => Math.floor(n / 2 ** s) % 256).join('.');
        return {metrics: {Network: `${address(start)}/${prefix}`, 'Upper address': address(start + total - 1), 'Total addresses': total, 'Usable addresses under stated model': prefix < 31 ? total - 2 : total},
          rows: [['Fixed bits', prefix], ['Varying bits', 32 - prefix]],
          explanation: `${parts.join('.')} belongs to ${address(start)}–${address(start + total - 1)}. ${prefix < 31 ? 'The conventional broadcast-subnet count reserves the network and broadcast addresses.' : prefix === 31 ? 'Both addresses are endpoints under RFC 3021 point-to-point semantics.' : 'This is a single address, not a broadcast LAN.'}`};
      }
    },
    eigen: {
      title: 'Test an eigenvector by its residual',
      fields: [field('a', 'A₁₁', 2), field('b', 'A₁₂', 1), field('c', 'A₂₁', 1), field('d', 'A₂₂', 2), field('x', 'v₁', 1), field('y', 'v₂', 1), field('lambda', 'Candidate eigenvalue λ', 3)],
      caption: 'The two components of Av and λv are compared. Entries are dimensionless; the zero vector is excluded. A small residual tests this candidate, not the accuracy of every eigenvalue of A.',
      run(p) {
        const [a,b,c,d,x,y,l] = ['a','b','c','d','x','y','lambda'].map(k => finite(p[k], k, -1e6, 1e6));
        if (Math.hypot(x,y) === 0) throw new Error('An eigenvector must be nonzero.');
        const av = [a*x+b*y,c*x+d*y], lv = [l*x,l*y], residual = Math.hypot(av[0]-lv[0],av[1]-lv[1]);
        return {metrics: {'Av': av.map(number).join(', '), 'λv': lv.map(number).join(', '), 'Residual norm': residual, 'Residual / vector norm': residual / Math.hypot(x,y)}, rows: [['(Av)₁',av[0]],['(λv)₁',lv[0]],['(Av)₂',av[1]],['(λv)₂',lv[1]]], explanation: 'A candidate satisfies Av = λv when the residual is zero in exact arithmetic. Floating-point comparisons need a scale-aware tolerance. Try v=(1,−1), λ=1, then try the incorrect λ=3.'};
      }
    },
    bayes: {
      title: 'Count outcomes before interpreting a positive result',
      fields: [field('prevalence','Prior probability (%)',1), field('sensitivity','True-positive rate (%)',90), field('falsePositive','False-positive rate (%)',5), field('population','Illustrative population',10000)],
      caption: 'Expected counts for a fictional fault detector. The rates are assumed known and constant across the equipment population; these are not sampled observations.',
      run(p) {
        const prior=finite(p.prevalence,'Prior probability',0,100)/100, sensitivity=finite(p.sensitivity,'True-positive rate',0,100)/100, fp=finite(p.falsePositive,'False-positive rate',0,100)/100, n=integer(p.population,'Population',1,10000000);
        const tp=n*prior*sensitivity, falsePos=n*(1-prior)*fp, denominator=tp+falsePos;
        if (denominator===0) throw new Error('A positive result has zero probability under these inputs; the conditional probability is undefined.');
        return {metrics:{'Expected true positives':tp,'Expected false positives':falsePos,'P(condition | positive)':tp/denominator},rows:[['True positives',tp],['False positives',falsePos],['False negatives',n*prior*(1-sensitivity)],['True negatives',n*(1-prior)*(1-fp)]],explanation:'P(condition | positive) = prior × sensitivity / [prior × sensitivity + (1−prior) × false-positive rate]. Sensitivity conditions on the true condition; the posterior conditions on the observed positive. They are different questions.'};
      }
    },
    qubit: {
      title: 'Predict a pure qubit in three measurement bases',
      fields:[field('theta','Polar angle θ (degrees)',90),field('phi','Relative phase φ (degrees)',90)],
      caption:'Ideal pure state cos(θ/2)|0⟩ + exp(iφ)sin(θ/2)|1⟩. X and Y outcomes are labeled +/−; Z outcomes are 0/1. No hardware noise or sampling is included here.',
      run(p) {
        const t=finite(p.theta,'θ',0,180)*Math.PI/180, f=finite(p.phi,'φ',-360,360)*Math.PI/180;
        const x=Math.sin(t)*Math.cos(f),y=Math.sin(t)*Math.sin(f),z=Math.cos(t);
        const px=(1+x)/2,py=(1+y)/2,pz=(1+z)/2;
        return {metrics:{'P(Z=0)':pz,'P(X=+)':px,'P(Y=+)':py,'Bloch-vector norm':Math.hypot(x,y,z)},rows:[['Z=0',pz],['Z=1',1-pz],['X=+',px],['X=−',1-px],['Y=+',py],['Y=−',1-py]],explanation:'Changing φ leaves Z probabilities unchanged but can change X and Y probabilities. At θ=90°, φ=90°, Y=+ is certain while either Z outcome has probability 1/2. A global phase would leave every measurement probability unchanged.'};
      }
    },
    bell: {
      title:'Distinguish entanglement from a classical mixture',
      fields:[field('basis','Measure both qubits in basis','X','select',{options:['X','Y','Z']}),field('visibility','Bell-state fraction v',1,'number',{min:0,max:1,step:0.1})],
      caption:'ρ = v|Φ+⟩⟨Φ+| + (1−v)(|00⟩⟨00|+|11⟩⟨11|)/2. Both qubits use the selected Pauli basis. Local outcomes are individually unbiased; no signaling is possible.',
      run(p) {
        if (!['X','Y','Z'].includes(p.basis)) throw new Error('Choose X, Y, or Z.');
        const v=finite(p.visibility,'Bell-state fraction',0,1), correlation=p.basis==='Z'?1:p.basis==='X'?v:-v;
        const same=(1+correlation)/4, different=(1-correlation)/4;
        return {metrics:{'Correlation ⟨σ⊗σ⟩':correlation,'Probability of matching outcomes':2*same,'Local P(+) or P(0)':0.5,'Purity Tr(ρ²)':(1+v*v)/2},rows:[['++ / 00',same],['+− / 01',different],['−+ / 10',different],['−− / 11',same]],explanation:'At v=0, Z correlation survives while X and Y correlations vanish. At v=1, Φ+ has XX=+1, YY=−1, ZZ=+1. This restricted correlation comparison is not a loophole-free Bell test or a calculation of a CHSH violation.'};
      }
    },
    recovery: {
      title:'Compare objectives with observed recovery evidence',
      fields:[field('rto','RTO target (minutes)',120),field('rpo','RPO target (minutes)',30),field('restore','Observed restoration time (minutes)',95),field('age','Age of newest verified recoverable point at incident (minutes)',45),field('verified','Application/data validation','passed','select',{options:['passed','failed','not tested']})],
      caption:'A fictional incident starts the recovery clock. The recoverable point is independently verified. Backup-job success alone does not supply that evidence; business-defined clock boundaries may differ.',
      run(p) {
        const rto=finite(p.rto,'RTO',0,100000),rpo=finite(p.rpo,'RPO',0,100000),restore=finite(p.restore,'Restoration time',0,100000),age=finite(p.age,'Recoverable-point age',0,100000);
        if (!['passed','failed','not tested'].includes(p.verified)) throw new Error('Choose a validation result.');
        const valid=p.verified==='passed';
        return {metrics:{'RTO margin (minutes)':rto-restore,'RPO margin (minutes)':rpo-age,'Recovery demonstrated':valid&&restore<=rto&&age<=rpo?'Yes, within this fixture':'No','Application/data validation':p.verified},rows:[['RTO target',rto],['Restoration time',restore],['RPO target',rpo],['Recoverable-point age',age]],explanation:!valid?'Time measurements do not establish a usable recovery when validation failed or was not performed.':age>rpo?'Restoration met its time target only if its RTO margin is nonnegative, but the recoverable data point is too old for the RPO target.':'Interpret each objective independently. This fixture is evidence for one exercise, not a guarantee for a future incident.'};
      }
    },
    ingestion: {
      title:'Validate a batch before accepting any records',
      fields:[field('records','JSON array of inventory records','[{"id":"A1","owner":"Operations","count":3},{"id":"A2","owner":"Research","count":0}]','textarea')],
      caption:'Local JSON parsing and schema validation only. Required fields are id, owner, and count; count must be a nonnegative integer. No file or database is modified.',
      run(p) {
        if (String(p.records).length>50000) throw new Error('Keep this teaching fixture below 50,000 characters.');
        let data;try{data=JSON.parse(p.records);}catch{throw new Error('The input is not valid JSON. Use double-quoted keys and strings.');}
        if (!Array.isArray(data)||data.length>100) throw new Error('Supply an array containing at most 100 records.');
        const ids=new Set(),errors=[];
        data.forEach((r,i)=>{
          if (!r||typeof r!=='object'||Array.isArray(r)){errors.push(`Record ${i+1}: expected an object.`);return;}
          if (Object.keys(r).some(k=>!['id','owner','count'].includes(k))) errors.push(`Record ${i+1}: unexpected field.`);
          if (typeof r.id!=='string'||!r.id.trim())errors.push(`Record ${i+1}: id must be a nonempty string.`);
          else if(ids.has(r.id.trim()))errors.push(`Record ${i+1}: duplicate id ${r.id.trim()}.`);else ids.add(r.id.trim());
          if(typeof r.owner!=='string'||!r.owner.trim())errors.push(`Record ${i+1}: owner must be a nonempty string.`);
          if(!Number.isSafeInteger(r.count)||r.count<0)errors.push(`Record ${i+1}: count must be a nonnegative safe integer.`);
        });
        return {metrics:{'Input records':data.length,'Validation errors':errors.length,'Accepted records':errors.length?0:data.length,'Batch result':errors.length?'Rejected atomically':'Valid; no persistence performed'},rows:[['Accepted',errors.length?0:data.length],['Rejected',errors.length?data.length:0]],explanation:errors.length?errors.join('\n'):'All rows meet this schema. Schema validity does not prove inventory accuracy. The downloadable companion demonstrates an actual transaction and duplicate-request handling.'};
      }
    },
    slo: {
      title:'Calculate a request-based error budget',
      fields:[field('target','SLO target (%)',99.9),field('requests','Eligible requests in the window',1000000),field('bad','Bad requests in the window',1500)],
      caption:'One fixed measurement window and an explicitly defined set of eligible requests. This request-based budget is not a downtime allowance and does not imply an SLA or financial penalty.',
      run(p) {
        const target=finite(p.target,'SLO target',0,100),total=integer(p.requests,'Eligible requests',1,1000000000000),bad=integer(p.bad,'Bad requests',0,total),budget=total*(100-target)/100;
        return {metrics:{'Observed success (%)':100*(1-bad/total),'Allowed bad requests':budget,'Budget remaining':budget-bad,'Budget consumed (%)':budget===0?(bad===0?'No errors; zero budget':'Undefined ratio; zero budget exceeded'):100*bad/budget},rows:[['Allowed bad requests',budget],['Observed bad requests',bad]],explanation:'A 99.9% objective over 1,000,000 eligible requests allows 1,000 bad requests. 1,500 consumes 150% of that budget. An operating policy should define the response before an incident; this calculation alone cannot choose the business tradeoff.'};
      }
    }
  };
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function shell(id) {
    const e=experiments[id];if(!e)return '';
    const inputs=e.fields.map(f=>`<label>${esc(f.label)}${f.type==='select'?`<select name="${f.key}">${f.options.map(o=>`<option${o===f.value?' selected':''}>${esc(o)}</option>`).join('')}</select>`:f.type==='textarea'?`<textarea name="${f.key}" rows="6">${esc(f.value)}</textarea>`:`<input name="${f.key}" type="${f.type}" value="${esc(f.value)}"${f.type==='number'?` step="${f.step||'any'}"${f.min!==undefined?` min="${f.min}"`:''}${f.max!==undefined?` max="${f.max}"`:''}`:''}>`}</label>`).join('');
    return `<div class="flagship-experiment" data-flagship-experiment="${esc(id)}"><h3>${esc(e.title)}</h3><form novalidate><div class="lab-controls">${inputs}</div><div class="lesson-actions"><button class="button primary" type="submit">Calculate</button><button class="button" type="reset">Reset experiment</button><button class="button" type="button" data-experiment-export>Download result JSON</button></div></form><p>${esc(e.caption)}</p><div data-experiment-output aria-live="polite"></div></div>`;
  }
  function mount(scope) {
    if(!scope)return;
    scope.querySelectorAll('[data-flagship-experiment]').forEach(host=>{
      const id=host.dataset.flagshipExperiment,e=experiments[id],form=host.querySelector('form'),out=host.querySelector('[data-experiment-output]'),exportButton=host.querySelector('[data-experiment-export]');
      if(!e||host.dataset.mounted)return;host.dataset.mounted='true';
      let current=null;
      const run=()=>{
        const inputs=Object.fromEntries(new FormData(form));
        try{
          const result=e.run(inputs);current={schemaVersion:1,experiment:id,inputs,result};exportButton.disabled=false;
          const max=Math.max(1,...result.rows.map(r=>Math.abs(r[1])));
          out.innerHTML=`<dl>${Object.entries(result.metrics).map(([k,v])=>`<dt>${esc(k)}</dt><dd><strong>${esc(typeof v==='number'?number(v):v)}</strong></dd>`).join('')}</dl><figure><svg viewBox="0 0 520 ${result.rows.length*38+12}" role="img" aria-label="${esc(result.rows.map(([k,v])=>`${k}: ${number(v)}`).join('; '))}" style="width:100%;height:auto;color:var(--accent)">${result.rows.map(([k,v],i)=>`<text x="0" y="${i*38+22}" fill="currentColor" font-size="13">${esc(k)}</text><rect x="200" y="${i*38+7}" width="${Math.abs(v)/max*200}" height="20" fill="currentColor" opacity="0.65"/><text x="410" y="${i*38+22}" fill="currentColor" font-size="13">${esc(number(v))}</text>`).join('')}</svg><figcaption>Bar length shows magnitude; the signed value is printed. ${esc(e.caption)}</figcaption></figure><p>${esc(result.explanation).replace(/\n/g,'<br>')}</p>`;
        }catch(error){current=null;exportButton.disabled=true;out.innerHTML=`<p role="alert">${esc(error.message)}</p>`;}
      };
      form.onsubmit=event=>{event.preventDefault();run();};
      form.oninput=()=>{current=null;exportButton.disabled=true;out.innerHTML='<p>Inputs changed. Calculate to update the result.</p>';};
      form.onreset=event=>{event.preventDefault();e.fields.forEach(f=>{form.elements.namedItem(f.key).value=f.value;});run();};
      exportButton.onclick=()=>{
        run();if(!current)return;
        const blob=new Blob([JSON.stringify(current,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
        a.href=url;a.download=`${id}-experiment.json`;a.click();URL.revokeObjectURL(url);
      };
      run();
    });
  }
  const api={experiments,shell,mount};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.LearningExperiments=api;
})(typeof window==='undefined'?null:window);
