/* Quantum learning tools: small exact state-vector models and clearly labeled heuristics; no hardware claims. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const C=(re=0,im=0)=>({re,im}),add=(a,b)=>C(a.re+b.re,a.im+b.im),mul=(a,b)=>C(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re),scale=(a,s)=>C(a.re*s,a.im*s),abs2=a=>a.re*a.re+a.im*a.im;
  let state=[C(1,0),C(0,0)],history=[];
  const matrices={
    X:[[C(0),C(1)],[C(1),C(0)]],
    Y:[[C(0),C(0,-1)],[C(0,1),C(0)]],
    Z:[[C(1),C(0)],[C(0),C(-1)]],
    H:[[C(Math.SQRT1_2),C(Math.SQRT1_2)],[C(Math.SQRT1_2),C(-Math.SQRT1_2)]],
    S:[[C(1),C(0)],[C(0),C(0,1)]],
    T:[[C(1),C(0)],[C(0),C(Math.SQRT1_2,Math.SQRT1_2)]]
  };
  const fmt=n=>(Math.abs(n)<1e-10?0:n).toFixed(4);
  function normalize(){
    const n=Math.sqrt(abs2(state[0])+abs2(state[1]))||1;state=state.map(a=>scale(a,1/n));
  }
  function fromAngles(){
    const th=Number($('theta').value)*Math.PI/180,ph=Number($('phi').value)*Math.PI/180;
    state=[C(Math.cos(th/2)),C(Math.sin(th/2)*Math.cos(ph),Math.sin(th/2)*Math.sin(ph))];history=[];
    render();
  }
  function anglesFromState(){
    normalize();
    let alpha=state[0],beta=state[1];
    const phase=Math.atan2(alpha.im,alpha.re);
    const rot=C(Math.cos(-phase),Math.sin(-phase));alpha=mul(alpha,rot);beta=mul(beta,rot);state=[alpha,beta];
    const theta=2*Math.atan2(Math.sqrt(abs2(beta)),Math.sqrt(abs2(alpha)));
    let phi=Math.atan2(beta.im,beta.re); if(phi<0)phi+=2*Math.PI;
    $('theta').value=Math.round(theta*180/Math.PI);$('phi').value=Math.round(phi*180/Math.PI);
  }
  function apply(name){
    const m=matrices[name];if(!m)return;
    state=[add(mul(m[0][0],state[0]),mul(m[0][1],state[1])),add(mul(m[1][0],state[0]),mul(m[1][1],state[1]))];
    normalize();history.push(name);anglesFromState();render();
  }
  function complexText(a){
    const sign=a.im<0?' − ':' + ';return fmt(a.re)+sign+fmt(Math.abs(a.im))+'i';
  }
  function drawBloch(){
    const canvas=$('bloch-canvas');if(!canvas)return;
    const dpr=Math.max(1,Math.min(2,devicePixelRatio||1)),w=canvas.clientWidth||460,h=300;
    canvas.width=w*dpr;canvas.height=h*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
    const p0=abs2(state[0]),p1=abs2(state[1]);
    const ab=mul({re:state[0].re,im:-state[0].im},state[1]);
    const x=2*ab.re,y=2*ab.im,z=p0-p1,cx=w/2,cy=h/2,r=Math.min(w,h)*.36;
    ctx.strokeStyle=getComputedStyle(document.body).color;ctx.fillStyle=ctx.strokeStyle;ctx.globalAlpha=.45;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(cx,cy,r,r*.32,0,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx-r,cy);ctx.lineTo(cx+r,cy);ctx.moveTo(cx,cy-r);ctx.lineTo(cx,cy+r);ctx.stroke();
    ctx.globalAlpha=1;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+x*r*.85,cy-z*r*.85);ctx.stroke();
    ctx.beginPath();ctx.arc(cx+x*r*.85,cy-z*r*.85,5,0,Math.PI*2);ctx.fill();
    ctx.font='12px system-ui';ctx.fillText('x',cx+r+6,cy+4);ctx.fillText('z',cx+6,cy-r-6);ctx.fillText('y='+fmt(y),12,20);
  }
  function render(){
    normalize();
    const p0=abs2(state[0]),p1=abs2(state[1]);
    $('alpha').textContent=complexText(state[0]);$('beta').textContent=complexText(state[1]);
    $('p0').textContent=(p0*100).toFixed(2)+'%';$('p1').textContent=(p1*100).toFixed(2)+'%';
    $('gate-history').textContent=history.length?'Circuit: |ψ⟩ → '+history.join(' → '):'Circuit: prepared directly from θ and φ.';
    drawBloch();
  }
  $('theta')?.addEventListener('input',fromAngles);$('phi')?.addEventListener('input',fromAngles);
  document.querySelectorAll('[data-gate]').forEach(b=>b.addEventListener('click',()=>apply(b.dataset.gate)));
  $('state-reset')?.addEventListener('click',()=>{$('theta').value=0;$('phi').value=0;fromAngles();});
  fromAngles();

  function rng(seed){let x=(seed|0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
  function sample(){
    const shots=Math.max(1,Math.min(100000,Number($('shots').value)||1024)),random=rng(Number($('shot-seed').value)||1),p0=abs2(state[0]);let z=0;
    for(let i=0;i<shots;i++)if(random()<p0)z++;
    $('shot-output').innerHTML='<strong>|0⟩: '+z.toLocaleString()+' · |1⟩: '+(shots-z).toLocaleString()+'</strong><p>Observed |0⟩ frequency: '+(z/shots*100).toFixed(2)+'%. Expected probability from the current state: '+(p0*100).toFixed(2)+'%. Change the seed to see sampling noise.</p>';
  }
  $('sample-shots')?.addEventListener('click',sample);sample();

  function grover(){
    const N=Math.max(2,Math.min(1e12,Number($('grover-n').value)||8)),M=Math.max(1,Math.min(N,Number($('grover-m').value)||1));
    const theta=Math.asin(Math.sqrt(M/N)),k=Math.max(0,Math.floor(Math.PI/(4*theta)-.5)),p=Math.sin((2*k+1)*theta)**2;
    $('grover-output').innerHTML='<strong>Suggested nearby iteration count: '+k.toLocaleString()+'</strong><p>Idealized marked-state success: '+(p*100).toFixed(3)+'%. Classical exhaustive work scales with N; amplitude amplification uses O(√(N/M)) oracle calls under its assumptions. Oracle construction, fault tolerance, data loading and hardware noise are not free.</p>';
  }
  $('grover-n')?.addEventListener('input',grover);$('grover-m')?.addEventListener('input',grover);grover();

  function qec(){
    const p=Math.max(1e-8,Math.min(.2,Number($('physical-error').value)||.001));
    const pth=Math.max(1e-7,Math.min(.2,Number($('threshold-error').value)||.01));
    const d=Math.max(3,Math.min(99,Math.round(Number($('code-distance').value)||5)|1));
    $('code-distance').value=d;
    const logical=.1*Math.pow(p/pth,(d+1)/2),supp=logical>0?p/logical:Infinity;
    const condition=p<pth?'below the chosen threshold':'at/above the chosen threshold';
    $('qec-output').innerHTML='<strong>Teaching-model logical error/cycle: '+logical.toExponential(3)+'</strong><p>The physical error is '+condition+'. Approximate physical/logical suppression ratio: '+(Number.isFinite(supp)?supp.toExponential(2):'∞')+'. This uses p<sub>L</sub>≈0.1(p/p<sub>th</sub>)<sup>(d+1)/2</sup> only to build intuition. Real codes depend on the noise model, decoder, syndrome circuit, leakage, correlations, geometry, gate schedule and hardware.</p>';
    $('qec-meter').style.width=Math.max(1,Math.min(100,-Math.log10(Math.max(logical,1e-15))/15*100))+'%';
  }
  ['physical-error','threshold-error','code-distance'].forEach(id=>$(id)?.addEventListener('input',qec));qec();

  const quiz=[
    {q:'A qubit in superposition gives you both classical answers when measured once.',a:false,e:'Measurement returns one classical outcome. Quantum advantage comes from manipulating amplitudes and interference across a computation, not reading every branch.'},
    {q:'Global phase changes ordinary measurement probabilities.',a:false,e:'A common global phase is physically unobservable; relative phase can change interference.'},
    {q:'Entanglement creates correlations that cannot always be represented as independent single-qubit states.',a:true,e:'Correct. Some multi-qubit states cannot be factored into a tensor product of individual qubit states.'},
    {q:'Passing an error-correction threshold automatically means a machine is already a useful fault-tolerant computer.',a:false,e:'No. Below-threshold scaling is essential evidence, but useful fault-tolerant computation also needs many logical qubits, logical gates, decoding, control, architecture and enormous systems engineering.'}
  ];
  let qi=0;
  function showQuiz(){const x=quiz[qi%quiz.length];$('quantum-question').textContent=x.q;$('quantum-answer').textContent='';}
  document.querySelectorAll('[data-qanswer]').forEach(b=>b.addEventListener('click',()=>{const x=quiz[qi%quiz.length],ans=b.dataset.qanswer==='true';$('quantum-answer').textContent=(ans===x.a?'Correct. ':'Not quite. ')+x.e;qi++;setTimeout(showQuiz,2600);}));
  showQuiz();
})();
