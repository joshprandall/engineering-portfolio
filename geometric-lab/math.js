/* Implementation by Joshua Randall. Uses established numerical and geometric methods; see CREDITS.md. */
(function(root){
'use strict';
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], norm=a=>Math.hypot(...a), unit=a=>{const n=norm(a)||1;return a.map(v=>v/n)};
function random(seed=42){let x=seed|0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function normal(r){return Math.sqrt(-2*Math.log(Math.max(1e-12,r())))*Math.cos(2*Math.PI*r())}
function generate(shape='torus',n=1200,scale=1,noise=0,seed=42){
 const points=[],truth=[],normals=[],rng=random(seed); let R=1.35*scale,r=.5*scale;
 for(let i=0;i<n;i++){
  let p,no,k;
  if(shape==='sphere'){let z=1-2*(i+.5)/n,t=i*Math.PI*(3-Math.sqrt(5)),a=Math.sqrt(1-z*z);no=[a*Math.cos(t),z,a*Math.sin(t)];p=no.map(v=>v*scale);k=1/scale**2}
  else if(shape==='saddle'){let m=Math.ceil(Math.sqrt(n)),x=(i%m)/(m-1)*2-1,y=Math.floor(i/m)/(m-1)*2-1;p=[x*scale,(x*x-y*y)*scale/2,y*scale];no=unit([-x,1,y]);k=-1/(scale*scale*(1+x*x+y*y)**2)}
  else {let v=2*Math.PI*((i*.618033988749895)%1),u=2*Math.PI*(i+.5)/n; p=[(R+r*Math.cos(v))*Math.cos(u),r*Math.sin(v),(R+r*Math.cos(v))*Math.sin(u)];no=[Math.cos(v)*Math.cos(u),Math.sin(v),Math.cos(v)*Math.sin(u)];k=Math.cos(v)/(r*(R+r*Math.cos(v)))}
  points.push(p.map(v=>v+normal(rng)*noise*scale));truth.push(k);normals.push(no);
 }
 return {points,truth,normals,shape,scale,noise,seed};
}
function solve(A,b){let m=A.map((r,i)=>[...r,b[i]]),n=b.length;for(let i=0;i<n;i++){let p=i;for(let j=i+1;j<n;j++)if(Math.abs(m[j][i])>Math.abs(m[p][i]))p=j;[m[i],m[p]]=[m[p],m[i]];if(Math.abs(m[i][i])<1e-13)return null;let d=m[i][i];for(let k=i;k<=n;k++)m[i][k]/=d;for(let j=0;j<n;j++)if(j!==i){d=m[j][i];for(let k=i;k<=n;k++)m[j][k]-=d*m[i][k]}}return m.map(r=>r[n])}
function smallestEigen(A){let a=A.map(r=>r.slice()),V=[[1,0,0],[0,1,0],[0,0,1]];for(let t=0;t<24;t++){let p=0,q=1;for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)if(Math.abs(a[i][j])>Math.abs(a[p][q])){p=i;q=j}if(Math.abs(a[p][q])<1e-14)break;let theta=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(theta),s=Math.sin(theta);let J=[[1,0,0],[0,1,0],[0,0,1]];J[p][p]=c;J[q][q]=c;J[p][q]=s;J[q][p]=-s;const mul=(x,y)=>x.map(r=>y[0].map((_,j)=>r.reduce((z,v,k)=>z+v*y[k][j],0))),tr=x=>x[0].map((_,j)=>x.map(r=>r[j]));a=mul(mul(tr(J),a),J);V=mul(V,J)}let i=[0,1,2].sort((i,j)=>a[i][i]-a[j][j])[0];return unit(V.map(r=>r[i]))}
function estimate(points,k=30){
 return points.map((p,idx)=>{
 const neighbors=points.map((q,j)=>({j,d:q.reduce((s,v,a)=>s+(v-p[a])**2,0)})).sort((a,b)=>a.d-b.d).slice(0,k);
 const ps=neighbors.map(o=>points[o.j].map((v,a)=>v-p[a])),center=[0,1,2].map(a=>ps.reduce((s,q)=>s+q[a],0)/ps.length);
 const cov=[0,1,2].map(a=>[0,1,2].map(b=>ps.reduce((s,q)=>s+(q[a]-center[a])*(q[b]-center[b]),0)));
 const no=smallestEigen(cov),u=unit(cross(no,Math.abs(no[0])<.8?[1,0,0]:[0,1,0])),v=cross(no,u),h=Math.sqrt(neighbors[neighbors.length-1].d)||1;
 let A=Array.from({length:6},()=>Array(6).fill(0)),b=Array(6).fill(0);
 ps.forEach(q=>{let x=dot(q,u)/h,y=dot(q,v)/h,z=dot(q,no)/h,f=[1,x,y,x*x,x*y,y*y],w=Math.exp(-2*(x*x+y*y));for(let a=0;a<6;a++){b[a]+=w*f[a]*z;for(let c=0;c<6;c++)A[a][c]+=w*f[a]*f[c]}});
 for(let a=0;a<6;a++)A[a][a]+=1e-9;
 const fit=solve(A,b);if(!fit)return null;return (4*fit[3]*fit[5]-fit[4]**2)/(h*h*(1+fit[1]**2+fit[2]**2)**2);
 });
}
function stats(values,truth){let pairs=values.map((v,i)=>[v,truth?.[i]]).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));return {count:pairs.length,mae:pairs.length?pairs.reduce((s,[a,b])=>s+Math.abs(a-b),0)/pairs.length:null,rmse:pairs.length?Math.sqrt(pairs.reduce((s,[a,b])=>s+(a-b)**2,0)/pairs.length):null}}
function posterior(radius=1,sigma=.12,count=8,seed=42){let rng=random(seed),obs=Array.from({length:count},()=>1/radius**2+sigma*normal(rng)),xs=Array.from({length:501},(_,i)=>.4+i*2.1/500);let log=xs.map(r=>-obs.reduce((s,y)=>s+(y-1/r**2)**2,0)/(2*sigma**2)),mx=Math.max(...log),ys=log.map(v=>Math.exp(v-mx)),sum=ys.reduce((a,b)=>a+b,0);ys=ys.map(v=>v/sum);let acc=0,lo=xs[0],hi=xs.at(-1),low=false;ys.forEach((v,i)=>{acc+=v;if(!low&&acc>=.025){lo=xs[i];low=true}if(acc<.975)hi=xs[Math.min(i+1,xs.length-1)]});return {xs,ys,obs,lo,hi,mean:xs.reduce((s,x,i)=>s+x*ys[i],0),map:xs[log.indexOf(mx)]}}
function diffusion(points,r,t,D){return points.map(p=>.5+.5*(p[1]/r)*Math.exp(-2*D*t/r**2))}
root.GeoMath={dot,cross,norm,unit,random,normal,generate,estimate,stats,posterior,diffusion,solve,smallestEigen};if(typeof module!=='undefined')module.exports=root.GeoMath;
})(typeof self!=='undefined'?self:globalThis);
