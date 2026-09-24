/* Implementation by Joshua Randall. Uses established numerical and geometric methods; see CREDITS.md. */
(function(root){
'use strict';

const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[
  a[1]*b[2]-a[2]*b[1],
  a[2]*b[0]-a[0]*b[2],
  a[0]*b[1]-a[1]*b[0]
];
const norm=a=>Math.hypot(...a);
const unit=a=>{const n=norm(a)||1;return a.map(v=>v/n)};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

function random(seed=42){
  let x=seed|0;
  return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296};
}

function normal(r){
  return Math.sqrt(-2*Math.log(Math.max(1e-12,r())))*Math.cos(2*Math.PI*r());
}

function generate(shape='torus',n=1200,scale=1,noise=0,seed=42){
  const points=[],truth=[],normals=[],areaWeights=[],truthMeanAbs=[],rng=random(seed);
  const R=1.35*scale,r=.5*scale;

  if(shape==='saddle'){
    const m=Math.ceil(Math.sqrt(n));
    const step=2/(m-1);
    for(let i=0;i<n;i++){
      const gx=i%m,gy=Math.floor(i/m);
      const x=gx/(m-1)*2-1,z=gy/(m-1)*2-1;
      const p=[x*scale,(x*x-z*z)*scale/2,z*scale];
      const no=unit([-x,1,z]);
      const K=-1/(scale*scale*(1+x*x+z*z)**2);
      const H=(z*z-x*x)/(2*scale*(1+x*x+z*z)**1.5);
      const edgeWeight=(gx===0||gx===m-1?.5:1)*(gy===0||gy===m-1?.5:1);
      points.push(p.map(v=>v+normal(rng)*noise*scale));
      truth.push(K);normals.push(no);truthMeanAbs.push(Math.abs(H));
      areaWeights.push(scale*scale*step*step*Math.sqrt(1+x*x+z*z)*edgeWeight);
    }
  }else{
    for(let i=0;i<n;i++){
      let p,no,K,Habs,w;
      if(shape==='sphere'){
        const z=1-2*(i+.5)/n;
        const t=i*Math.PI*(3-Math.sqrt(5));
        const a=Math.sqrt(Math.max(0,1-z*z));
        no=[a*Math.cos(t),z,a*Math.sin(t)];
        p=no.map(v=>v*scale);
        K=1/scale**2;
        Habs=1/scale;
        w=4*Math.PI*scale*scale/n;
      }else{
        const v=2*Math.PI*((i*.618033988749895)%1);
        const u=2*Math.PI*(i+.5)/n;
        p=[(R+r*Math.cos(v))*Math.cos(u),r*Math.sin(v),(R+r*Math.cos(v))*Math.sin(u)];
        no=[Math.cos(v)*Math.cos(u),Math.sin(v),Math.cos(v)*Math.sin(u)];
        const kMeridian=1/r;
        const kParallel=Math.cos(v)/(R+r*Math.cos(v));
        K=kMeridian*kParallel;
        Habs=Math.abs((kMeridian+kParallel)/2);
        w=4*Math.PI*Math.PI*r*(R+r*Math.cos(v))/n;
      }
      points.push(p.map(v=>v+normal(rng)*noise*scale));
      truth.push(K);normals.push(no);truthMeanAbs.push(Habs);areaWeights.push(w);
    }
  }
  return {points,truth,normals,areaWeights,truthMeanAbs,shape,scale,noise,seed};
}

function solve(A,b){
  const m=A.map((r,i)=>[...r,b[i]]),n=b.length;
  for(let i=0;i<n;i++){
    let p=i;
    for(let j=i+1;j<n;j++)if(Math.abs(m[j][i])>Math.abs(m[p][i]))p=j;
    [m[i],m[p]]=[m[p],m[i]];
    if(Math.abs(m[i][i])<1e-13)return null;
    let d=m[i][i];
    for(let k=i;k<=n;k++)m[i][k]/=d;
    for(let j=0;j<n;j++)if(j!==i){
      d=m[j][i];
      for(let k=i;k<=n;k++)m[j][k]-=d*m[i][k];
    }
  }
  return m.map(r=>r[n]);
}

function smallestEigen(A){
  let a=A.map(r=>r.slice()),V=[[1,0,0],[0,1,0],[0,0,1]];
  const mul=(x,y)=>x.map(r=>y[0].map((_,j)=>r.reduce((z,v,k)=>z+v*y[k][j],0)));
  const tr=x=>x[0].map((_,j)=>x.map(r=>r[j]));
  for(let t=0;t<24;t++){
    let p=0,q=1;
    for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){
      if(Math.abs(a[i][j])>Math.abs(a[p][q])){p=i;q=j}
    }
    if(Math.abs(a[p][q])<1e-14)break;
    const theta=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(theta),s=Math.sin(theta);
    const J=[[1,0,0],[0,1,0],[0,0,1]];
    J[p][p]=c;J[q][q]=c;J[p][q]=s;J[q][p]=-s;
    a=mul(mul(tr(J),a),J);V=mul(V,J);
  }
  const i=[0,1,2].sort((i,j)=>a[i][i]-a[j][j])[0];
  return unit(V.map(r=>r[i]));
}

function nearestK(points,p,k){
  const heap=[];
  const swap=(i,j)=>{const t=heap[i];heap[i]=heap[j];heap[j]=t};
  const up=i=>{while(i){const parent=(i-1)>>1;if(heap[parent].d>=heap[i].d)break;swap(parent,i);i=parent}};
  const down=i=>{for(;;){let l=i*2+1,r=l+1,b=i;if(l<heap.length&&heap[l].d>heap[b].d)b=l;if(r<heap.length&&heap[r].d>heap[b].d)b=r;if(b===i)break;swap(i,b);i=b}};
  for(let j=0;j<points.length;j++){
    const q=points[j];
    const d=(q[0]-p[0])**2+(q[1]-p[1])**2+(q[2]-p[2])**2;
    if(heap.length<k){heap.push({j,d});up(heap.length-1)}
    else if(d<heap[0].d){heap[0]={j,d};down(0)}
  }
  return heap.sort((a,b)=>a.d-b.d);
}

function localGeometry(points,idx,k=30,referenceNormal=null){
  const p=points[idx],neighbors=nearestK(points,p,Math.min(Math.max(8,k),points.length));
  if(neighbors.length<8)return null;
  const ps=neighbors.map(o=>points[o.j].map((v,a)=>v-p[a]));
  const center=[0,1,2].map(a=>ps.reduce((s,q)=>s+q[a],0)/ps.length);
  const cov=[0,1,2].map(a=>[0,1,2].map(b=>ps.reduce((s,q)=>s+(q[a]-center[a])*(q[b]-center[b]),0)));
  let no=smallestEigen(cov);
  if(referenceNormal&&dot(no,referenceNormal)<0)no=no.map(v=>-v);
  const u=unit(cross(no,Math.abs(no[0])<.8?[1,0,0]:[0,1,0]));
  const v=cross(no,u);
  const h=Math.sqrt(neighbors[neighbors.length-1].d)||1;
  const A=Array.from({length:6},()=>Array(6).fill(0)),b=Array(6).fill(0),samples=[];
  for(const q of ps){
    const x=dot(q,u)/h,y=dot(q,v)/h,z=dot(q,no)/h;
    const basis=[1,x,y,x*x,x*y,y*y],w=Math.exp(-2*(x*x+y*y));
    samples.push({x,y,z});
    for(let a=0;a<6;a++){
      b[a]+=w*basis[a]*z;
      for(let c=0;c<6;c++)A[a][c]+=w*basis[a]*basis[c];
    }
  }
  for(let a=0;a<6;a++)A[a][a]+=1e-9;
  const fit=solve(A,b);
  if(!fit)return null;

  const fx=fit[1],fy=fit[2],fxx=2*fit[3]/h,fxy=fit[4]/h,fyy=2*fit[5]/h;
  const W=1+fx*fx+fy*fy;
  const gaussian=(fxx*fyy-fxy*fxy)/(W*W);
  const mean=((1+fy*fy)*fxx-2*fx*fy*fxy+(1+fx*fx)*fyy)/(2*W**1.5);
  const disc=Math.sqrt(Math.max(0,mean*mean-gaussian));
  const k1=mean+disc,k2=mean-disc;
  const residual=Math.sqrt(samples.reduce((s,q)=>{
    const pred=fit[0]+fit[1]*q.x+fit[2]*q.y+fit[3]*q.x*q.x+fit[4]*q.x*q.y+fit[5]*q.y*q.y;
    return s+(q.z-pred)**2;
  },0)/samples.length)*h;

  return {
    gaussian,mean,meanAbs:Math.abs(mean),k1,k2,
    kMaxAbs:Math.max(Math.abs(k1),Math.abs(k2)),
    kMinAbs:Math.min(Math.abs(k1),Math.abs(k2)),
    residual,radius:h,normal:no
  };
}

function estimateGeometry(points,k=30,referenceNormals=null){
  const out={
    gaussian:[],mean:[],meanAbs:[],k1:[],k2:[],kMaxAbs:[],kMinAbs:[],
    residual:[],radius:[]
  };
  for(let i=0;i<points.length;i++){
    const g=localGeometry(points,i,k,referenceNormals?.[i]||null);
    for(const key of Object.keys(out))out[key].push(g?g[key]:null);
  }
  return out;
}

function estimate(points,k=30){
  return estimateGeometry(points,k).gaussian;
}

function quantile(values,q){
  const a=values.filter(Number.isFinite).slice().sort((x,y)=>x-y);
  if(!a.length)return null;
  const p=(a.length-1)*clamp(q,0,1),i=Math.floor(p),f=p-i;
  return a[i]*(1-f)+(a[Math.min(i+1,a.length-1)]||a[i])*f;
}

function stats(values,truth){
  const pairs=values.map((v,i)=>[v,truth?.[i]]).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));
  if(!pairs.length)return {count:0,mae:null,rmse:null,bias:null,medianAe:null,p95Ae:null,maxAe:null,correlation:null};
  const errors=pairs.map(([a,b])=>a-b),abs=errors.map(Math.abs);
  const ma= pairs.reduce((s,[a])=>s+a,0)/pairs.length;
  const mb= pairs.reduce((s,[,b])=>s+b,0)/pairs.length;
  let num=0,da=0,db=0;
  for(const [a,b] of pairs){num+=(a-ma)*(b-mb);da+=(a-ma)**2;db+=(b-mb)**2}
  return {
    count:pairs.length,
    mae:abs.reduce((a,b)=>a+b,0)/pairs.length,
    rmse:Math.sqrt(errors.reduce((a,b)=>a+b*b,0)/pairs.length),
    bias:errors.reduce((a,b)=>a+b,0)/pairs.length,
    medianAe:quantile(abs,.5),
    p95Ae:quantile(abs,.95),
    maxAe:Math.max(...abs),
    correlation:da&&db?num/Math.sqrt(da*db):null
  };
}

function posterior(radius=1,sigma=.12,count=8,seed=42){
  const rng=random(seed),obs=Array.from({length:count},()=>1/radius**2+sigma*normal(rng));
  const xs=Array.from({length:501},(_,i)=>.4+i*2.1/500);
  const log=xs.map(r=>-obs.reduce((s,y)=>s+(y-1/r**2)**2,0)/(2*sigma**2)),mx=Math.max(...log);
  let ys=log.map(v=>Math.exp(v-mx)),sum=ys.reduce((a,b)=>a+b,0);
  ys=ys.map(v=>v/sum);
  let acc=0,lo=xs[0],hi=xs.at(-1),low=false;
  ys.forEach((v,i)=>{acc+=v;if(!low&&acc>=.025){lo=xs[i];low=true}if(acc<.975)hi=xs[Math.min(i+1,xs.length-1)]});
  return {xs,ys,obs,lo,hi,mean:xs.reduce((s,x,i)=>s+x*ys[i],0),map:xs[log.indexOf(mx)]};
}

function diffusion(points,r,t,D){
  return points.map(p=>.5+.5*(p[1]/r)*Math.exp(-2*D*t/r**2));
}

function integrate(values,weights){
  if(!Array.isArray(values)||!Array.isArray(weights)||values.length!==weights.length)return null;
  let sum=0,used=0;
  for(let i=0;i<values.length;i++)if(Number.isFinite(values[i])&&Number.isFinite(weights[i])){sum+=values[i]*weights[i];used++}
  return used?sum:null;
}

function gaussBonnet(dataset,values=dataset?.truth){
  const integral=integrate(values,dataset?.areaWeights);
  const expectedChi=dataset?.shape==='sphere'?2:dataset?.shape==='torus'?0:null;
  return {
    integral,
    chi:Number.isFinite(integral)?integral/(2*Math.PI):null,
    expectedChi,
    expectedIntegral:expectedChi==null?null:2*Math.PI*expectedChi,
    area:dataset?.areaWeights?.reduce((a,b)=>a+b,0)??null
  };
}

function legendre(l,x){
  x=clamp(x,-1,1);
  if(l===0)return 1;if(l===1)return x;
  let p0=1,p1=x;
  for(let n=2;n<=l;n++){const p=((2*n-1)*x*p1-(n-1)*p0)/n;p0=p1;p1=p}
  return p1;
}

function spectralSphere(points,r,l=2){
  const values=points.map(p=>legendre(l,p[1]/r));
  const eigenvalue=l*(l+1)/(r*r),multiplicity=2*l+1;
  return {values,eigenvalue,multiplicity,l};
}

function meanCurvatureFlowSphere(radius0,t){
  const extinction=radius0*radius0/4;
  const radius=Math.sqrt(Math.max(radius0*radius0-4*t,0));
  return {
    radius0,t,extinction,radius,
    area:4*Math.PI*radius*radius,
    gaussian:radius>0?1/(radius*radius):Infinity,
    meanAbs:radius>0?1/radius:Infinity
  };
}

root.GeoMath={
  dot,cross,norm,unit,random,normal,generate,solve,smallestEigen,
  localGeometry,estimateGeometry,estimate,stats,quantile,posterior,diffusion,
  integrate,gaussBonnet,legendre,spectralSphere,meanCurvatureFlowSphere
};
if(typeof module!=='undefined')module.exports=root.GeoMath;
})(typeof self!=='undefined'?self:globalThis);
