const $=s=>document.querySelector(s);
function distribution(phi,bits,mix=0){
  const n=2**bits, out=[];
  for(let y=0;y<n;y++){
    const delta=phi-y/n, den=Math.sin(Math.PI*delta);
    const ideal=Math.abs(den)<1e-12?1:(Math.sin(Math.PI*n*delta)/(n*den))**2;
    out.push({y,bits:y.toString(2).padStart(bits,'0'),phase:y/n,ideal,mixed:(1-mix)*ideal+mix/n});
  }
  const total=out.reduce((s,x)=>s+x.mixed,0);out.forEach(x=>x.mixed/=total);return out;
}
function rng(seed){let x=(Number(seed)||1)>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function sample(rows,shots,seed){const r=rng(seed),out=Array(rows.length).fill(0);for(let i=0;i<shots;i++){let z=r(),acc=0;for(let j=0;j<rows.length;j++){acc+=rows[j].mixed;if(z<=acc){out[j]++;break}}}return out}
function draw(rows){const c=$('#qpe-chart'),ctx=c.getContext('2d'),d=devicePixelRatio||1,w=c.clientWidth,h=400;c.width=w*d;c.height=h*d;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);const max=Math.max(...rows.map(x=>x.mixed),1e-9),bw=w/rows.length;rows.forEach((x,i)=>{const bh=(x.mixed/max)*(h-42),x0=i*bw;ctx.fillStyle=x.mixed===max?'#f4a575':'#8cc8d1';ctx.fillRect(x0+1,h-bh-25,Math.max(1,bw-2),bh);if(rows.length<=32){ctx.fillStyle='#a7b1b3';ctx.font='11px sans-serif';ctx.save();ctx.translate(x0+bw/2,h-8);ctx.rotate(-Math.PI/3);ctx.fillText(x.bits,-3,0);ctx.restore()}});ctx.fillStyle='#a7b1b3';ctx.font='12px sans-serif';ctx.fillText('Probability',8,16);ctx.fillText('Measured bit string',Math.max(8,w-140),h-8)}
function run(){const phi=Math.min(.999999,Math.max(0,Number($('#phase').value)||0)),bits=Number($('#bits').value),mix=Number($('#mix').value),shots=Math.max(1,Number($('#shots').value)||1),seed=Number($('#seed').value)||42;const rows=distribution(phi,bits,mix),counts=sample(rows,shots,seed);rows.forEach((x,i)=>x.count=counts[i]);draw(rows);const best=rows.reduce((a,b)=>b.count>a.count?b:a);$('#qpe-result').textContent=`Most frequent outcome: ${best.bits} (phase ${best.phase.toFixed(6)}), observed ${best.count}/${shots}. Ideal target phase: ${phi.toFixed(6)}.`;$('#qpe-rows').innerHTML=rows.map(x=>`<tr><td>${x.bits}</td><td>${x.phase.toFixed(6)}</td><td>${x.ideal.toFixed(6)}</td><td>${x.mixed.toFixed(6)}</td><td>${x.count}</td></tr>`).join('');window.__qpe={phi,bits,mix,shots,seed,rows};return window.__qpe}
$('#qpe-controls').addEventListener('submit',e=>{e.preventDefault();run()});$('#qpe-export').addEventListener('click',()=>{const b=new Blob([JSON.stringify(window.__qpe||run(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='qpe-experiment.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});addEventListener('resize',()=>window.__qpe&&draw(window.__qpe.rows));run();
export {distribution,sample};
