import { stateFromAngles, measurementProbabilities, describeState, sampleMeasurements, seededRng } from './qubit.js';
const $=s=>document.querySelector(s);
const theta=$('#theta'),phi=$('#phi'),basis=$('#basis'),thetaValue=$('#theta-value'),phiValue=$('#phi-value'),angleOutput=$('#angle-output'),phaseOutput=$('#phase-output'),arrow=$('#state-arrow');
const alpha=$('#alpha'),beta=$('#beta'),normalization=$('#normalization'),bx=$('#bloch-x'),by=$('#bloch-y'),bz=$('#bloch-z'),p0=$('#p0'),p1=$('#p1'),bar0=$('#bar0'),bar1=$('#bar1'),description=$('#state-description');
const outcome0Label=$('#outcome0-label'),outcome1Label=$('#outcome1-label'),formula0=$('#formula0'),formula1=$('#formula1'),shots=$('#shots'),seed=$('#sample-seed'),count0=$('#count0'),count1=$('#count1'),observed0=$('#observed0'),observed1=$('#observed1'),delta=$('#sample-delta'),sigma=$('#sample-sigma'),chart=$('#convergence-chart');
const percent=v=>`${(v*100).toFixed(1)}%`,labels={Z:['|0⟩','|1⟩','z'],X:['|+⟩','|−⟩','x'],Y:['|+i⟩','|−i⟩','y']};
function snapshot(){const state=stateFromAngles(Number(theta.value),Number(phi.value)),prob=measurementProbabilities(state,basis.value);return {state,prob}}
function clearResults(){[count0,count1,observed0,observed1,delta,sigma].forEach(x=>{if(x)x.textContent='—'});const ctx=chart?.getContext('2d');if(ctx)ctx.clearRect(0,0,chart.width,chart.height)}
function render(){
  const {state,prob}=snapshot(),axis=labels[prob.basis];
  thetaValue.textContent=`${state.thetaDegrees}°`;phiValue.textContent=`${state.phiDegrees}°`;angleOutput.textContent=`${state.thetaDegrees}°`;phaseOutput.textContent=`${state.phiDegrees}°`;
  alpha.textContent=state.alpha.toFixed(4);beta.textContent=`${state.betaMag.toFixed(4)} ∠ ${state.phiDegrees}°`;normalization.textContent=state.normalization.toFixed(4);
  bx.textContent=state.bloch.x.toFixed(4);by.textContent=state.bloch.y.toFixed(4);bz.textContent=state.bloch.z.toFixed(4);
  p0.textContent=percent(prob.p0);p1.textContent=percent(prob.p1);bar0.style.width=percent(prob.p0);bar1.style.width=percent(prob.p1);
  outcome0Label.textContent='Outcome '+axis[0];outcome1Label.textContent='Outcome '+axis[1];formula0.textContent=`P(${axis[0]}) = (1 + ${axis[2]}) / 2`;formula1.textContent=`P(${axis[1]}) = (1 − ${axis[2]}) / 2`;
  description.textContent=describeState(state.thetaDegrees,state.phiDegrees,prob.basis);
  const sx=state.bloch.x*.78+state.bloch.y*.22,sy=-state.bloch.z+state.bloch.y*.16,angle=Math.atan2(sx,-sy)*180/Math.PI,length=Math.max(.14,Math.min(1,Math.hypot(sx,sy)));
  arrow.style.transform=`translate(-50%,-100%) rotate(${angle}deg)`;arrow.style.height=`${Math.max(12,42*length)}%`;
  const resultSpans=document.querySelectorAll('.results>div>span');if(resultSpans.length>=4){resultSpans[0].textContent=axis[0]+' count';resultSpans[1].textContent=axis[1]+' count';resultSpans[2].textContent='Observed '+axis[0];resultSpans[3].textContent='Observed '+axis[1]}
  clearResults();
}
function measure(){
  const {prob}=snapshot(),total=Math.max(1,Number(shots.value)||1),rng=seededRng(Number(seed.value)||1),result=sampleMeasurements(prob.p0,total,rng),obs=result.count0/result.shots,se=Math.sqrt(prob.p0*(1-prob.p0)/result.shots);
  count0.textContent=result.count0.toLocaleString();count1.textContent=result.count1.toLocaleString();observed0.textContent=percent(obs);observed1.textContent=percent(result.count1/result.shots);delta.textContent=((obs-prob.p0)*100).toFixed(2)+' pp';sigma.textContent=(se*100).toFixed(2)+' pp';
}
function convergence(){
  const {prob}=snapshot(),sizes=[10,30,100,300,1000,3000,10000],values=sizes.map((n,i)=>{const r=sampleMeasurements(prob.p0,n,seededRng((Number(seed.value)||1)+i));return r.count0/n}),ctx=chart.getContext('2d'),d=Math.min(devicePixelRatio||1,2),w=Math.max(280,chart.clientWidth),h=240;chart.width=w*d;chart.height=h*d;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
  const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#09131a');bg.addColorStop(1,'#101416');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.strokeStyle='#354044';ctx.strokeRect(36,15,w-48,h-48);
  const y=v=>15+(1-v)*(h-48),x=i=>36+i*(w-48)/(sizes.length-1);ctx.strokeStyle='#f4a575';ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(36,y(prob.p0));ctx.lineTo(w-12,y(prob.p0));ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#8cc8d1';ctx.lineWidth=2;ctx.beginPath();values.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));ctx.stroke();
  values.forEach((v,i)=>{ctx.fillStyle='#8cc8d1';ctx.shadowColor='#8cc8d1';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(x(i),y(v),4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#a7b1b3';ctx.font='10px sans-serif';ctx.fillText(String(sizes[i]),x(i)-8,h-15)});ctx.fillStyle='#a7b1b3';ctx.font='11px sans-serif';ctx.fillText(`Observed first outcome in ${prob.basis} basis · orange = expected`,38,12);
}
theta.addEventListener('input',render);phi.addEventListener('input',render);basis.addEventListener('change',render);
document.querySelectorAll('[data-angle]').forEach(button=>button.addEventListener('click',()=>{theta.value=button.dataset.angle;phi.value=button.dataset.phase||0;render();theta.focus()}));
$('#measure').addEventListener('click',measure);$('#reset-results').addEventListener('click',clearResults);$('#run-convergence').addEventListener('click',convergence);render();