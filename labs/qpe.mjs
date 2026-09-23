const $=s=>document.querySelector(s);
function distribution(phi,bits,mix=0){
  const n=2**bits,out=[];let idealTotal=0;
  for(let y=0;y<n;y++){
    const delta=phi-y/n,den=Math.sin(Math.PI*delta);
    const ideal=Math.abs(den)<1e-12?1:(Math.sin(Math.PI*n*delta)/(n*den))**2;
    idealTotal+=ideal;out.push({y,bits:y.toString(2).padStart(bits,'0'),phase:y/n,ideal,mixed:0});
  }
  for(const x of out)x.ideal/=idealTotal||1;
  for(const x of out)x.mixed=(1-mix)*x.ideal+mix/n;
  const total=out.reduce((s,x)=>s+x.mixed,0);for(const x of out)x.mixed/=total||1;return out;
}
function rng(seed){let x=(Number(seed)||1)>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function sample(rows,shots,seed){
  const r=rng(seed),out=Array(rows.length).fill(0),cdf=[];let acc=0;
  for(const row of rows){acc+=row.mixed;cdf.push(acc)}cdf[cdf.length-1]=1;
  for(let i=0;i<shots;i++){const z=r();let lo=0,hi=cdf.length-1;while(lo<hi){const m=(lo+hi)>>1;if(z<=cdf[m])hi=m;else lo=m+1}out[lo]++}return out;
}
function draw(rows,target){
  const c=$('#qpe-chart'),ctx=c.getContext('2d'),d=Math.min(devicePixelRatio||1,2),w=Math.max(260,c.clientWidth),h=400;c.width=w*d;c.height=h*d;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,.02)';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#354044';ctx.lineWidth=1;for(let k=1;k<5;k++){const y=24+(h-70)*k/5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  const max=Math.max(...rows.map(x=>x.mixed),1e-9),bw=w/rows.length;
  rows.forEach((x,i)=>{const bh=(x.mixed/max)*(h-62),x0=i*bw;ctx.fillStyle=Math.abs(x.phase-target)<1e-12?'#f4a575':'#8cc8d1';ctx.fillRect(x0+1,h-bh-28,Math.max(1,bw-2),bh);if(rows.length<=32){ctx.fillStyle='#a7b1b3';ctx.font='11px sans-serif';ctx.save();ctx.translate(x0+bw/2,h-8);ctx.rotate(-Math.PI/3);ctx.fillText(x.bits,-3,0);ctx.restore()}});
  const tx=target*w;ctx.strokeStyle='#f4a575';ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(tx,18);ctx.lineTo(tx,h-28);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#a7b1b3';ctx.font='12px sans-serif';ctx.fillText('relative probability',8,16);ctx.fillText('phase grid →',Math.max(8,w-88),16);
}
function run(){
  const phi=Math.min(.999999,Math.max(0,Number($('#phase').value)||0)),bits=Number($('#bits').value),mix=Math.min(1,Math.max(0,Number($('#mix').value))),shots=Math.min(100000,Math.max(1,Number($('#shots').value)||1)),seed=Number($('#seed').value)||42;
  const rows=distribution(phi,bits,mix),counts=sample(rows,shots,seed);rows.forEach((x,i)=>x.count=counts[i]);const nearest=Math.round(phi*(2**bits))/(2**bits);draw(rows,nearest);const best=rows.reduce((a,b)=>b.count>a.count?b:a),mean=rows.reduce((s,x)=>s+x.phase*x.count,0)/shots,rmse=Math.sqrt(rows.reduce((s,x)=>s+((x.phase-phi)**2)*x.count,0)/shots),resolution=1/(2**bits);
  $('#qpe-result').textContent=`Dominant ${best.bits} → ${best.phase.toFixed(6)} · target φ ${phi.toFixed(6)} · grid resolution ${resolution.toFixed(6)} · sample mean ${mean.toFixed(6)} · RMSE ${rmse.toFixed(6)}.`;
  $('#qpe-rows').innerHTML=rows.map(x=>`<tr${x===best?' class="is-dominant"':''}><td>${x.bits}</td><td>${x.phase.toFixed(6)}</td><td>${x.ideal.toFixed(6)}</td><td>${x.mixed.toFixed(6)}</td><td>${x.count}</td></tr>`).join('');window.__qpe={phi,bits,mix,shots,seed,resolution,nearest,mean,rmse,rows};return window.__qpe;
}
if (typeof document !== 'undefined') {
  $('#qpe-controls').addEventListener('submit',e=>{e.preventDefault();run()});$('#qpe-export').addEventListener('click',()=>{const b=new Blob([JSON.stringify(window.__qpe||run(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='qpe-experiment.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});addEventListener('resize',()=>window.__qpe&&draw(window.__qpe.rows,window.__qpe.nearest));run();
}
export {distribution,sample};